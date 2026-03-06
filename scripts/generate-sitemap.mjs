/**
 * Post-build sitemap generator
 *
 * Scans dist/ for all HTML pages and generates sitemap-0.xml.
 * Run automatically after every `astro build` via the build script.
 *
 * Grouping order (matches the structure from the sitemap tool):
 *   1. English homepage
 *   2. Telugu homepage
 *   3. English top-level sections (about, services, education, blog, contact)
 *   4. English service detail pages
 *   5. English legal pages
 *   6. Telugu top-level sections
 *   7. Telugu service detail pages
 *   8. Telugu blog post pages
 *   9. Telugu legal pages
 *   10. English blog post pages
 *
 * Priority rules:
 *   1.00 — English homepage (/)
 *   0.80 — Telugu homepage, English top-level sections, English service/legal pages
 *   0.60 — Telugu top-level sections, Telugu service/blog/legal pages
 *   0.60 — English blog post pages
 */

import { readdirSync, statSync, writeFileSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const SITE = 'https://kamalakarheartcentre.com';
const OUT_FILE = join(DIST, 'sitemap-0.xml');

// Paths to exclude from the sitemap
const EXCLUDE = new Set(['/404/', '/404']);

function collectHtmlRoutes(dir, routes = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectHtmlRoutes(full, routes);
    } else if (entry === 'index.html') {
      let route = '/' + relative(DIST, dir).replace(/\\/g, '/');
      if (!route.endsWith('/')) route += '/';
      routes.push(route);
    }
  }
  return routes;
}

// Assign a sort group and priority to each route for the desired ordering
function getGroupAndPriority(route) {
  const isTe = route.startsWith('/te/');

  // Homepages
  if (route === '/') return { group: 0, priority: '1.00' };
  if (route === '/te/') return { group: 1, priority: '0.80' };

  // English top-level sections
  if (!isTe && /^\/(about|services|education|blog|contact)\/$/.test(route))
    return { group: 2, priority: '0.80' };

  // English service detail pages
  if (!isTe && /^\/services\/.+\/$/.test(route))
    return { group: 3, priority: '0.80' };

  // English legal pages
  if (!isTe && /^\/(privacy-policy|terms-of-service)\/$/.test(route))
    return { group: 4, priority: '0.80' };

  // Telugu top-level sections
  if (isTe && /^\/te\/(about|services|education|blog|contact)\/$/.test(route))
    return { group: 5, priority: '0.60' };

  // Telugu service detail pages
  if (isTe && /^\/te\/services\/.+\/$/.test(route))
    return { group: 6, priority: '0.60' };

  // Telugu blog post pages
  if (isTe && /^\/te\/blog\/.+\/$/.test(route))
    return { group: 7, priority: '0.60' };

  // Telugu legal pages
  if (isTe && /^\/te\/(privacy-policy|terms-of-service)\/$/.test(route))
    return { group: 8, priority: '0.60' };

  // English blog post pages
  if (!isTe && /^\/blog\/.+\/$/.test(route))
    return { group: 9, priority: '0.60' };

  // Fallback
  return { group: 10, priority: '0.50' };
}

// Generate a per-URL timestamp offset from the base build time
// so each URL gets a unique lastmod (seconds apart)
function generateTimestamps(count) {
  const base = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(base.getTime() + i * 1000);
    // Format as ISO 8601 with timezone offset: 2026-03-02T17:36:45+00:00
    return d.toISOString().replace(/\.\d{3}Z$/, '+00:00');
  });
}

// Collect all routes from built HTML files
const routes = collectHtmlRoutes(DIST).filter((r) => !EXCLUDE.has(r));

// Sort routes by group, then alphabetically within each group
routes.sort((a, b) => {
  const ga = getGroupAndPriority(a);
  const gb = getGroupAndPriority(b);
  if (ga.group !== gb.group) return ga.group - gb.group;
  return a.localeCompare(b);
});

// Check if current sitemap exists and extract existing URLs for comparison
let existingUrls = new Set();
try {
  const existing = readFileSync(OUT_FILE, 'utf-8');
  for (const match of existing.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    existingUrls.add(match[1].replace(SITE, ''));
  }
} catch {
  // No existing sitemap — generating fresh
}

// Report changes
const routeUrls = new Set(routes);
const missing = routes.filter((r) => !existingUrls.has(r));
const extra = [...existingUrls].filter((u) => !routeUrls.has(u));

if (missing.length > 0) {
  console.log(`\n[sitemap] Adding ${missing.length} new route(s):`);
  missing.forEach((r) => console.log(`  + ${r}`));
}
if (extra.length > 0) {
  console.log(`\n[sitemap] Removing ${extra.length} stale URL(s):`);
  extra.forEach((r) => console.log(`  - ${r}`));
}

// Generate sitemap XML
const timestamps = generateTimestamps(routes.length);

const urls = routes
  .map(
    (route, i) => `<url>
  <loc>${SITE}${route}</loc>
  <lastmod>${timestamps[i]}</lastmod>
  <priority>${getGroupAndPriority(route).priority}</priority>
</url>`
  )
  .join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

writeFileSync(OUT_FILE, xml);
console.log(`\n[sitemap] Generated ${OUT_FILE} with ${routes.length} URLs.\n`);
