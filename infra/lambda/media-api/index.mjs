// Media admin CRUD API. Node 20 Lambda runtime ships the AWS SDK v3, so no
// bundling/node_modules are needed — kept deliberately dependency-free.
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  GetCommand,
} from '@aws-sdk/lib-dynamodb';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME;

const CATEGORIES = [
  'Heart Tests Explained',
  'Heart Attack & Emergency',
  'Prevention & Lifestyle',
  'Inside the Clinic',
];
const TIERS = ['featured', 'full', 'grid-only'];
const LANGUAGES = ['English', 'Telugu'];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

function json(status, body) {
  return { statusCode: status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }, body: JSON.stringify(body) };
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

function extractYoutubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function validate(body, { partial = false } = {}) {
  const errors = [];
  if (!partial || body.youtubeUrl !== undefined) {
    if (!body.youtubeUrl || !extractYoutubeId(body.youtubeUrl)) {
      errors.push('youtubeUrl must be a valid YouTube URL (watch, youtu.be, or shorts).');
    }
  }
  if (!partial || body.displayTitle !== undefined) {
    if (!body.displayTitle || typeof body.displayTitle !== 'string' || !body.displayTitle.trim()) {
      errors.push('displayTitle is required.');
    }
  }
  if (!partial || body.category !== undefined) {
    if (!CATEGORIES.includes(body.category)) {
      errors.push(`category must be one of: ${CATEGORIES.join(', ')}`);
    }
  }
  if (body.tier !== undefined && !TIERS.includes(body.tier)) {
    errors.push(`tier must be one of: ${TIERS.join(', ')}`);
  }
  if (body.language !== undefined && !LANGUAGES.includes(body.language)) {
    errors.push(`language must be one of: ${LANGUAGES.join(', ')}`);
  }
  return errors;
}

async function listVideos() {
  const out = await ddb.send(new ScanCommand({ TableName: TABLE }));
  // `order` is the admin-managed display order (ascending — matches /media/).
  // Ties (e.g. legacy items) fall back to newest-first by uploadDate.
  const items = (out.Items || []).sort((a, b) => {
    const oa = a.order ?? 0, ob = b.order ?? 0;
    if (oa !== ob) return oa - ob;
    return (b.uploadDate || '').localeCompare(a.uploadDate || '');
  });
  return json(200, { items });
}

async function getVideo(slug) {
  const out = await ddb.send(new GetCommand({ TableName: TABLE, Key: { slug } }));
  if (!out.Item) return json(404, { error: 'Not found' });
  return json(200, out.Item);
}

async function addVideo(body) {
  const errors = validate(body);
  if (errors.length) return json(400, { errors });

  const slug = body.slug && body.slug.trim() ? slugify(body.slug) : slugify(body.displayTitle);
  const now = new Date().toISOString();

  const existing = await ddb.send(new GetCommand({ TableName: TABLE, Key: { slug } }));
  if (existing.Item) return json(409, { error: `A video with slug "${slug}" already exists.` });

  // New videos go to the end of the display order by default — never jump
  // ahead of what an admin has already arranged without being asked to.
  const all = await ddb.send(new ScanCommand({ TableName: TABLE }));
  const maxOrder = (all.Items || []).reduce((max, i) => Math.max(max, i.order ?? 0), -1);

  const item = {
    slug,
    youtubeUrl: body.youtubeUrl.trim(),
    displayTitle: body.displayTitle.trim(),
    category: body.category,
    language: body.language || 'English',
    tier: body.tier || 'grid-only',
    description: body.description || '',
    keyPoints: Array.isArray(body.keyPoints) ? body.keyPoints.filter(Boolean) : [],
    uploadDate: body.uploadDate || now,
    relatedService: body.relatedService || null,
    relatedPost: body.relatedPost || null,
    order: maxOrder + 1,
    hidden: false,
    createdAt: now,
    updatedAt: now,
  };

  await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));
  return json(201, item);
}

async function updateVideo(slug, body) {
  const errors = validate(body, { partial: true });
  if (errors.length) return json(400, { errors });

  const existing = await ddb.send(new GetCommand({ TableName: TABLE, Key: { slug } }));
  if (!existing.Item) return json(404, { error: 'Not found' });

  const allowed = [
    'youtubeUrl', 'displayTitle', 'category', 'language', 'tier',
    'description', 'keyPoints', 'uploadDate', 'relatedService', 'relatedPost', 'hidden', 'order',
  ];
  const sets = [];
  const names = {};
  const values = { ':updatedAt': new Date().toISOString() };
  for (const key of allowed) {
    if (body[key] !== undefined) {
      sets.push(`#${key} = :${key}`);
      names[`#${key}`] = key;
      values[`:${key}`] = body[key];
    }
  }
  sets.push('#updatedAt = :updatedAt');
  names['#updatedAt'] = 'updatedAt';

  const out = await ddb.send(new UpdateCommand({
    TableName: TABLE,
    Key: { slug },
    UpdateExpression: `SET ${sets.join(', ')}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
    ReturnValues: 'ALL_NEW',
  }));
  return json(200, out.Attributes);
}

async function deleteVideo(slug) {
  await ddb.send(new DeleteCommand({ TableName: TABLE, Key: { slug } }));
  return json(204, {});
}

/** Swaps the `order` value of two videos — how the admin UI's up/down
 *  reorder buttons move a video without renumbering the whole list. */
async function reorderVideos(body) {
  const { slugA, slugB } = body;
  if (!slugA || !slugB) return json(400, { error: 'slugA and slugB are required.' });

  const [a, b] = await Promise.all([
    ddb.send(new GetCommand({ TableName: TABLE, Key: { slug: slugA } })),
    ddb.send(new GetCommand({ TableName: TABLE, Key: { slug: slugB } })),
  ]);
  if (!a.Item || !b.Item) return json(404, { error: 'One or both videos not found.' });

  const now = new Date().toISOString();
  await Promise.all([
    ddb.send(new UpdateCommand({
      TableName: TABLE, Key: { slug: slugA },
      UpdateExpression: 'SET #order = :order, #updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#order': 'order', '#updatedAt': 'updatedAt' },
      ExpressionAttributeValues: { ':order': b.Item.order ?? 0, ':updatedAt': now },
    })),
    ddb.send(new UpdateCommand({
      TableName: TABLE, Key: { slug: slugB },
      UpdateExpression: 'SET #order = :order, #updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#order': 'order', '#updatedAt': 'updatedAt' },
      ExpressionAttributeValues: { ':order': a.Item.order ?? 0, ':updatedAt': now },
    })),
  ]);
  return json(200, { ok: true });
}

async function oembedLookup(body) {
  const url = body.youtubeUrl;
  const videoId = url ? extractYoutubeId(url) : null;
  if (!videoId) return json(400, { error: 'Not a valid YouTube URL.' });

  const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`);
  if (!res.ok) return json(422, { error: 'Could not fetch video details from YouTube. It may be private or deleted.' });
  const data = await res.json();
  return json(200, {
    youtubeId: videoId,
    suggestedTitle: data.title,
    authorName: data.author_name,
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
  });
}

export const handler = async (event) => {
  const method = event.requestContext?.http?.method || event.httpMethod;
  const path = event.requestContext?.http?.path || event.rawPath || event.path;

  if (method === 'OPTIONS') return { statusCode: 204, headers: CORS_HEADERS, body: '' };

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const slug = event.pathParameters?.slug;

    if (method === 'GET' && path.endsWith('/videos')) return await listVideos();
    if (method === 'GET' && slug) return await getVideo(slug);
    if (method === 'POST' && path.endsWith('/oembed')) return await oembedLookup(body);
    if (method === 'POST' && path.endsWith('/videos/reorder')) return await reorderVideos(body);
    if (method === 'POST' && path.endsWith('/videos')) return await addVideo(body);
    if (method === 'PUT' && slug) return await updateVideo(slug, body);
    if (method === 'DELETE' && slug) return await deleteVideo(slug);

    return json(404, { error: 'Route not found' });
  } catch (err) {
    console.error(err);
    return json(500, { error: 'Internal error', message: err.message });
  }
};
