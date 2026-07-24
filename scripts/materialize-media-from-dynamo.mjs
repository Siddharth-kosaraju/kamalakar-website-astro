/**
 * Publish-pipeline step (runs inside CodeBuild, NOT in local/dev builds).
 *
 * Pulls every video from the `media-videos` DynamoDB table (the CMS source
 * of truth once the admin portal is live) and writes/overwrites
 * src/content/media/<slug>.yaml to match — then deletes any YAML file in
 * that directory that no longer has a matching DynamoDB item, so a video
 * deleted in the admin UI actually disappears from the site.
 *
 * Requires @aws-sdk/client-dynamodb + @aws-sdk/lib-dynamodb, installed by
 * the CodeBuild buildspec (scripts/codebuild/media-publish-buildspec.yml)
 * with `npm install --no-save` — NOT a dependency of the main site build,
 * to keep `npm run build` / `npm run dev` free of AWS SDK weight.
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { readdirSync, writeFileSync, unlinkSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../', import.meta.url).pathname;
const MEDIA_DIR = join(ROOT, 'src/content/media');
const TABLE_NAME = process.env.DYNAMO_TABLE_NAME;

if (!TABLE_NAME) {
  console.error('[materialize-media] DYNAMO_TABLE_NAME env var is required.');
  process.exit(1);
}

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

function yamlString(value) {
  // Double-quoted YAML scalar with backslash/quote escaping — matches the
  // hand-authored style already used across src/content/{services,media}.
  return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function itemToYaml(item) {
  const lines = [];
  lines.push(`youtubeUrl: ${yamlString(item.youtubeUrl)}`);
  lines.push(`displayTitle: ${yamlString(item.displayTitle)}`);
  lines.push(`category: ${yamlString(item.category)}`);
  lines.push(`language: ${yamlString(item.language || 'English')}`);
  lines.push(`tier: ${yamlString(item.tier || 'grid-only')}`);
  if (item.description) lines.push(`description: ${yamlString(item.description)}`);
  if (Array.isArray(item.keyPoints) && item.keyPoints.length > 0) {
    lines.push('keyPoints:');
    for (const point of item.keyPoints) lines.push(`  - ${yamlString(point)}`);
  }
  if (item.uploadDate) lines.push(`uploadDate: ${yamlString(item.uploadDate)}`);
  if (item.relatedService) lines.push(`relatedService: ${yamlString(item.relatedService)}`);
  if (item.relatedPost) lines.push(`relatedPost: ${yamlString(item.relatedPost)}`);
  lines.push(`order: ${Number.isFinite(item.order) ? item.order : 0}`);
  // Authoritative sitemap lastmod for this route — see generate-sitemap.mjs.
  // This file itself is regenerated fresh on every publish and never
  // committed to git, so git history/mtime can't tell "actually edited"
  // apart from "just republished unchanged" the way it can for hand-authored
  // content. DynamoDB's updatedAt is the real signal.
  if (item.updatedAt) lines.push(`updatedAt: ${yamlString(item.updatedAt)}`);
  return lines.join('\n') + '\n';
}

async function scanAll() {
  const items = [];
  let ExclusiveStartKey;
  do {
    const out = await ddb.send(new ScanCommand({ TableName: TABLE_NAME, ExclusiveStartKey }));
    items.push(...(out.Items || []));
    ExclusiveStartKey = out.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return items;
}

async function main() {
  if (!existsSync(MEDIA_DIR)) mkdirSync(MEDIA_DIR, { recursive: true });

  const items = (await scanAll()).filter((i) => !i.hidden);
  const liveSlugs = new Set(items.map((i) => i.slug));

  for (const item of items) {
    if (!item.slug) {
      console.warn(`[materialize-media] Skipping item with no slug: ${item.displayTitle}`);
      continue;
    }
    writeFileSync(join(MEDIA_DIR, `${item.slug}.yaml`), itemToYaml(item));
  }

  const existingFiles = readdirSync(MEDIA_DIR).filter((f) => f.endsWith('.yaml'));
  let removed = 0;
  for (const file of existingFiles) {
    const slug = file.replace(/\.yaml$/, '');
    if (!liveSlugs.has(slug)) {
      unlinkSync(join(MEDIA_DIR, file));
      removed++;
    }
  }

  console.log(`[materialize-media] Wrote ${items.length} video(s), removed ${removed} stale file(s).`);
}

main().catch((err) => {
  console.error('[materialize-media] FAILED:', err);
  process.exit(1);
});
