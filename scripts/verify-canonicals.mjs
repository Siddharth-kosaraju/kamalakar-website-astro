/**
 * Build-time canonical-tag assertion.
 *
 * Walks dist/ and asserts every *.html file has exactly one
 * <link rel="canonical" href="..."> that:
 *   - is HTTPS
 *   - uses the bare domain (kamalakarheartcentre.com, no `www.`)
 *   - ends with `/` (matches trailingSlash: 'always')
 *   - is self-referential (the canonical URL resolves back to this file)
 *   - matches og:url
 *
 * Fails the build (exit 1) if any rule is violated. This is the gate that
 * keeps the canonical-tag policy honest as new pages are added.
 *
 * See: SEO optimisation/26th April Review.md  (US-01, US-11, §5)
 */

import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const SITE = 'https://kamalakarheartcentre.com';

function collectHtml(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      collectHtml(full, out);
    } else if (name.endsWith('.html')) {
      out.push(full);
    }
  }
  return out;
}

function expectedCanonicalForFile(absPath) {
  // dist/about/index.html       → /about/
  // dist/index.html             → /
  // dist/services/ecg-echo/index.html → /services/ecg-echo/
  // dist/foo.html (rare)        → /foo/   (treat top-level html as a section)
  const rel = '/' + relative(DIST, absPath).replace(/\\/g, '/');
  if (rel === '/index.html') return SITE + '/';
  if (rel.endsWith('/index.html')) return SITE + rel.replace(/index\.html$/, '');
  // Fallback for any non-index .html (we don't expect these, but cover it)
  return SITE + rel.replace(/\.html$/, '/');
}

function extractAttr(tagSource, attr) {
  const match = tagSource.match(new RegExp(`${attr}\\s*=\\s*["']([^"']+)["']`, 'i'));
  return match ? match[1] : null;
}

function findCanonicals(html) {
  // Pull every <link ...> with rel="canonical"
  const out = [];
  const re = /<link\b[^>]*\brel\s*=\s*["']canonical["'][^>]*>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    out.push(extractAttr(m[0], 'href'));
  }
  return out;
}

function findOgUrl(html) {
  const m = html.match(/<meta\s+property\s*=\s*["']og:url["'][^>]*>/i);
  return m ? extractAttr(m[0], 'content') : null;
}

function isNoindex(html) {
  // Skip pages that explicitly opt out of indexing (e.g. /404/).
  // We accept either form: robots=noindex or googlebot=noindex.
  return /<meta\s+name\s*=\s*["'](?:robots|googlebot)["'][^>]*content\s*=\s*["'][^"']*\bnoindex\b/i.test(html);
}

const files = collectHtml(DIST);
const failures = [];
let skipped = 0;

for (const file of files) {
  const html = readFileSync(file, 'utf-8');
  const canonicals = findCanonicals(html);
  const expected = expectedCanonicalForFile(file);
  const route = expected.replace(SITE, '');

  if (isNoindex(html)) {
    skipped++;
    continue;
  }

  if (canonicals.length === 0) {
    failures.push(`${route}  →  missing <link rel="canonical">`);
    continue;
  }
  if (canonicals.length > 1) {
    failures.push(`${route}  →  ${canonicals.length} canonical tags found (must be exactly 1)`);
    continue;
  }

  const actual = canonicals[0];

  if (!actual.startsWith('https://')) {
    failures.push(`${route}  →  canonical is not HTTPS: ${actual}`);
  }
  if (actual.includes('://www.')) {
    failures.push(`${route}  →  canonical uses www subdomain: ${actual}`);
  }
  if (!actual.startsWith(SITE)) {
    failures.push(`${route}  →  canonical points to wrong host: ${actual}`);
  }
  if (!actual.endsWith('/') && !/[?#]/.test(actual)) {
    failures.push(`${route}  →  canonical missing trailing slash: ${actual}`);
  }
  if (actual !== expected) {
    failures.push(`${route}  →  canonical not self-referential. expected ${expected}, got ${actual}`);
  }

  const ogUrl = findOgUrl(html);
  if (ogUrl && ogUrl !== actual) {
    failures.push(`${route}  →  og:url (${ogUrl}) does not match canonical (${actual})`);
  }
}

if (failures.length > 0) {
  console.error(`\n[verify-canonicals] FAILED: ${failures.length} issue(s) across ${files.length} HTML files:\n`);
  for (const f of failures) console.error('  ✗ ' + f);
  console.error('');
  process.exit(1);
}

console.log(`\n[verify-canonicals] OK: ${files.length - skipped} indexable HTML files, all canonicals valid (${skipped} noindex page(s) skipped).\n`);
