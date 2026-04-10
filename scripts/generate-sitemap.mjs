/**
 * Post-build sitemap generator
 *
 * Scans dist/ for all HTML pages and generates sitemap-0.xml.
 * Run automatically after every `astro build` via the build script.
 *
 * Timestamps use the last git commit date of the source file(s) that
 * generate each route, so `lastmod` reflects real content changes — not
 * build time. This avoids burning Google's crawl budget on unchanged pages.
 *
 * Grouping order:
 *   1. Homepage
 *   2. Top-level sections (about, services, education, blog, contact)
 *   3. Service detail pages
 *   4. Legal pages
 *   5. Blog post pages
 *
 * Priority rules:
 *   1.00 — Homepage (/)
 *   0.80 — Top-level sections, service detail pages, legal pages
 *   0.60 — Blog post pages
 */

import { readdirSync, statSync, writeFileSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execSync } from 'node:child_process';

const DIST = new URL('../dist/', import.meta.url).pathname;
const ROOT = new URL('../', import.meta.url).pathname;
const SITE = 'https://kamalakarheartcentre.com';
const OUT_FILE = join(DIST, 'sitemap-0.xml');

// Paths to exclude from the sitemap
const EXCLUDE = new Set(['/404/', '/404']);

/**
 * Map a route to the source file(s) that generate it.
 * Returns an array of paths relative to the repo root.
 */
function getSourceFiles(route) {
  // Blog posts
  const blogMatch = route.match(/^\/blog\/([^/]+)\/$/);
  if (blogMatch) {
    return [
      `src/content/blog/${blogMatch[1]}.md`,
      'src/pages/blog/[slug].astro',
    ];
  }

  // Service detail pages
  const serviceMatch = route.match(/^\/services\/([^/]+)\/$/);
  if (serviceMatch) {
    return [
      `src/content/services/${serviceMatch[1]}.yaml`,
      'src/pages/services/[slug].astro',
    ];
  }

  // Static routes mapped to their page files
  const staticMap = {
    '/': 'src/pages/index.astro',
    '/about/': 'src/pages/about.astro',
    '/blog/': 'src/pages/blog/index.astro',
    '/contact/': 'src/pages/contact.astro',
    '/education/': 'src/pages/education.astro',
    '/services/': 'src/pages/services/index.astro',
    '/privacy-policy/': 'src/pages/privacy-policy.astro',
    '/terms-of-service/': 'src/pages/terms-of-service.astro',
  };

  if (staticMap[route]) {
    return [staticMap[route]];
  }

  // Fallback — use the built HTML file's mtime
  return [];
}

/**
 * Get the last git commit date for a file (ISO format).
 * Falls back to the file's mtime if not tracked by git.
 */
function getLastModified(route) {
  const sources = getSourceFiles(route);

  let latestDate = null;

  for (const src of sources) {
    const fullPath = join(ROOT, src);
    try {
      // Get the author date of the last commit that touched this file
      const gitDate = execSync(
        `git log -1 --format=%aI -- "${src}"`,
        { cwd: ROOT, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
      ).trim();

      if (gitDate) {
        const d = new Date(gitDate);
        if (!latestDate || d > latestDate) latestDate = d;
      }
    } catch {
      // Not in git — try file mtime
      try {
        const mtime = statSync(fullPath).mtime;
        if (!latestDate || mtime > latestDate) latestDate = mtime;
      } catch {
        // File doesn't exist at expected path — skip
      }
    }
  }

  // Fallback: use the built HTML file's mtime
  if (!latestDate) {
    const routeDir = route === '/' ? '' : route.replace(/^\//, '').replace(/\/$/, '');
    const htmlPath = join(DIST, routeDir, 'index.html');
    try {
      latestDate = statSync(htmlPath).mtime;
    } catch {
      latestDate = new Date();
    }
  }

  // Format as YYYY-MM-DD (Google's preferred format for lastmod)
  return latestDate.toISOString().split('T')[0];
}

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

// Assign a sort group and priority to each route
function getGroupAndPriority(route) {
  if (route === '/') return { group: 0, priority: '1.00' };

  if (/^\/(about|services|education|blog|contact)\/$/.test(route))
    return { group: 1, priority: '0.80' };

  if (/^\/services\/.+\/$/.test(route))
    return { group: 2, priority: '0.80' };

  if (/^\/(privacy-policy|terms-of-service)\/$/.test(route))
    return { group: 3, priority: '0.80' };

  if (/^\/blog\/.+\/$/.test(route))
    return { group: 4, priority: '0.60' };

  return { group: 5, priority: '0.50' };
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

// Generate sitemap XML with real lastmod dates
const urls = routes
  .map((route) => {
    const lastmod = getLastModified(route);
    const { priority } = getGroupAndPriority(route);
    return `<url>
  <loc>${SITE}${route}</loc>
  <lastmod>${lastmod}</lastmod>
  <priority>${priority}</priority>
</url>`;
  })
  .join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

writeFileSync(OUT_FILE, xml);
console.log(`\n[sitemap] Generated ${OUT_FILE} with ${routes.length} URLs.\n`);
