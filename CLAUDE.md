# Kamalakar Heart Centre — Project Memory for Claude

This file is loaded by Claude Code on every session. It captures the **structural rules** for this site that must hold across all future changes. The full SEO plan is at `SEO optimisation/26th April Review.md`.

---

## Site & infrastructure

- **Production URL:** https://kamalakarheartcentre.com (bare domain — `www.` 301s to non-`www.`)
- **Stack:** Astro 5 (static), React islands, Tailwind v4
- **Hosting:** AWS S3 (`kamalakar-heart-centre-prod`) + CloudFront (`E3STOTV0PG9BZU`), AWS profile `sid-personal`
- **CloudFront viewer-request function:** `cloudfront-functions/redirect-www-to-non-www.js` — handles all redirect logic (see "Canonical & redirect policy" below)
- **Build:** `npm run build` — runs `astro build`, then sitemap generator, then canonical verifier
- **Deploy:** `npm run deploy` — build + S3 sync (`--delete`) + CloudFront invalidation
- **CF function deploy:** `scripts/aws_deploy.sh` (separate from `npm run deploy`)

## Canonical & redirect policy (must hold)

These rules are encoded in `cloudfront-functions/redirect-www-to-non-www.js`, `src/components/SEO.astro`, `astro.config.mjs`, and the build-time check `scripts/verify-canonicals.mjs`. **Do not weaken any of them without re-running the SEO plan.**

1. **One scheme**: HTTPS only. CloudFront viewer-protocol-policy redirects HTTP → HTTPS.
2. **One host**: bare domain (`kamalakarheartcentre.com`). The CF function 301s `www.` → non-`www.`
3. **One trailing-slash convention**: **always** (`/about/`, not `/about`). Set in `astro.config.mjs` (`trailingSlash: 'always'`, `build.format: 'directory'`). The CF function 301s no-slash → slash for non-asset URIs.
4. **Canonical tags are mandatory.** Every indexable page passes a `canonicalUrl` prop to `src/components/SEO.astro`. The URL must be: absolute · HTTPS · bare domain · trailing slash · self-referential · no query string.
5. **og:url matches canonical exactly.**
6. **Pages that are not indexable** (e.g. `/404/`) must declare `<meta name="robots" content="noindex">`. The canonical verifier exempts them.
7. **Retired URLs**:
   - `/te*` (Telugu, retired in commit `847d537`) → 301 → `/`
   - `/?page=education` (legacy SPA params) → 301 → `/education/` (and similar for `?page=about|services|contact|blog`)
   - `/?lang=*` → 301 → `/`
8. **Build fails if any indexable HTML in `dist/` violates rules 1–5.** The check is `scripts/verify-canonicals.mjs`, wired into `npm run build`.

## Sitemap & robots policy (must hold)

1. `npm run build` always regenerates `dist/sitemap.xml` via `scripts/generate-sitemap.mjs`. **Never edit the sitemap by hand.**
2. The sitemap script is the single source of truth for indexable URLs — it walks `dist/` for every `index.html` and excludes `/404/`.
3. `lastmod` uses `git log -1 --format=%aI` against the **content file** (`.md` / `.yaml`), NOT the shared template. A template refactor must not reset every page's `lastmod`.
4. `public/robots.txt` is hand-maintained code. It must contain exactly one `Sitemap:` line pointing to `https://kamalakarheartcentre.com/sitemap.xml` (with a space after the colon). AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Bingbot, etc.) must remain `Allow: /`.
5. **After any of these changes, sitemap and robots are reviewed before deploy:**
   - new page added
   - existing page renamed or path changed
   - page removed or 301-redirected
   - canonical convention changed
   - robots access policy changed
6. **Post-deploy verification** (run by the `deploy-verify` skill):
   - GET `https://kamalakarheartcentre.com/sitemap.xml` returns 200 and lists every expected URL
   - GET `/robots.txt` returns 200 and references the canonical sitemap URL
   - Re-submit the sitemap in Google Search Console after structural changes

## Definition of "structural change"

Any of these triggers the full canonical/sitemap/robots review cycle above:

- new page (`src/pages/*.astro`, new `src/content/services/*.yaml`, new `src/content/blog/*.md`)
- renamed slug or path
- removed page
- new redirect rule in the CF function
- robots.txt edit
- canonical-policy change
- `astro.config.mjs` `site` / `trailingSlash` / `build.format` change

## Where things live

| Topic | File |
|---|---|
| Strategy & user stories | `SEO optimisation/26th April Review.md` |
| Canonical SEO meta component | `src/components/SEO.astro` |
| CloudFront redirects | `cloudfront-functions/redirect-www-to-non-www.js` |
| Sitemap generator | `scripts/generate-sitemap.mjs` |
| Canonical verifier (build gate) | `scripts/verify-canonicals.mjs` |
| Robots | `public/robots.txt` |
| Deploy + verify skill | `.claude/skills/deploy-verify/SKILL.md` |
| Blog writer skill | `.claude/skills/blog-writer/SKILL.md` |
| Content planner skill | `.claude/skills/content-planner/SKILL.md` |

## Operating notes

- **Dates:** when adding any dated content (blog posts, content plans, this CLAUDE.md), use the absolute date — never "today" or "this week".
- **Phase 2 / Phase 3 SEO work** is tracked as user stories US-13 through US-22 in `SEO optimisation/26th April Review.md`.
- **Telugu (`/te/`)**: retired. Currently 301s to `/`. If we rebuild Telugu content (US-15), update the CF function to drop the redirect first, then ship the pages.
