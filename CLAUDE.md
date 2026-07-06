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
4. `public/robots.txt` is hand-maintained code. It must contain exactly two `Sitemap:` lines (each with a space after the colon): `https://kamalakarheartcentre.com/sitemap.xml` (primary) and `https://kamalakarheartcentre.com/feed.xml` (the RSS feed, submitted as a sitemap for freshness signals — added deliberately in commit `a23d419`; Google accepts RSS/Atom feeds as sitemaps). No other `Sitemap:` lines. AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Bingbot, etc.) must remain `Allow: /`.
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

## llms.txt policy (must hold)

1. `dist/llms.txt` is **generated at build time** by `scripts/generate-llms.mjs` (runs after `astro build` and after the sitemap generator). **Never hand-edit `llms.txt`, and never re-add a static copy under `public/` or `public/.well-known/`** — the old hand-written `public/llms.txt` / `llms-full.txt` and `.well-known` variants were deleted deliberately.
2. Data sources: blog entries come from `src/content/blog/*.md` frontmatter (`title` + `summary`), service entries from `src/content/services/*.yaml` (`title` + `metaDescription`), both included **only if the page actually built into `dist/`**. Static-page descriptions live in the `STATIC_DESCRIPTIONS` map inside the generator.
3. **New pages force an llms.txt update.** The generator cross-checks itself against `dist/sitemap.xml`: every sitemap URL must appear in `llms.txt` and vice-versa. A new static page with no `STATIC_DESCRIPTIONS` entry **fails the build (exit 1)** with a message telling you to add its description. Follows the llmstxt.org format (single H1, blockquote summary, facts paragraphs, H2 link-list sections with `- [name](url): description`).
4. **Forbidden claims** (build fails if present in the output): any success-rate stat (e.g. "99% success rate"), "5,000+ procedures", "Assistant Professor", EECP in any form, and any named insurance company. Insurance is described only with the approved wording from `diagnostics-pricing.yaml`.
5. Adding/renaming/removing a page or changing the facts block is a structural change (see below) and requires a build + review before deploy.

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
| llms.txt generator (build gate) | `scripts/generate-llms.mjs` |
| Robots | `public/robots.txt` |
| Deploy + verify skill | `.claude/skills/deploy-verify/SKILL.md` |
| Blog writer skill | `.claude/skills/blog-writer/SKILL.md` |
| Content planner skill | `.claude/skills/content-planner/SKILL.md` |
| GTM/SEO skills (imported) — see `.claude/skills/NOTICE.md` for the full set | `.claude/skills/{audit-content, build-backlinks, build-resource-pages, create-geo-charts, geo-content-planning, geo-content-research, improve-aeo-geo, reddit-opportunity-research, research-brand, research-keywords, write-seo-geo-content}` |
| SEO subagents (imported, project-local) — see `.claude/agents/NOTICE.md` | `.claude/agents/{seo-cluster, seo-content, seo-dataforseo, seo-flow, seo-geo, seo-image-gen, seo-local, seo-maps, seo-schema, seo-sitemap, seo-technical}` |

## Operating notes

- **Dates:** when adding any dated content (blog posts, content plans, this CLAUDE.md), use the absolute date — never "today" or "this week".
- **Phase 2 / Phase 3 SEO work** is tracked as user stories US-13 through US-22 in `SEO optimisation/26th April Review.md`.
- **Telugu (`/te/`)**: retired. Currently 301s to `/`. If we rebuild Telugu content (US-15), update the CF function to drop the redirect first, then ship the pages.

## Authoritative facts about Dr Kamalakar Kosaraju

These are encoded in `src/utils/schemas.ts` `buildPhysicianSchema()` and the connected JSON-LD graph. **Do not invent or change without source.**

- **Specialisation:** Cardiologist (Interventional Cardiology)
- **MBBS:** Dr. NTR University of Health Sciences, Vijayawada — 2007
- **MD General Medicine** (Gold Medalist): Dr. NTR University of Health Sciences, Vijayawada — 2012
- **DM Cardiology:** **Osmania Medical College, Hyderabad — 2012–2015** (in Indian medical education, the DM is itself a 3-year super-specialty residency program; Osmania is both the college and the residency institution. Earlier framing of "DM from NTR Univ with residency at Osmania" was incorrect.)
- **Fellowship:** FESC — Fellow of the European Society of Cardiology
- **AP Medical Council registration:** **#57814** (2007)
- **Years as cardiologist:** dynamically computed from `START_YEAR = 2015` in `src/utils/content.ts`
- **Procedure volume:** 3,000+ coronary angiograms · 1,000+ angioplasty procedures (confirmed by user 2026-04-27; encoded in `Physician.description` JSON-LD)
- **NOT an Assistant Professor.** Earlier blog content claimed this — it is incorrect and has been removed. Do not re-introduce.
- **EECP is NOT offered by Dr Kamalakar / Kamalakar Heart Centre.** A `/services/eecp/` page existed briefly (shipped 2026-04-27 as US-07, removed the same day). The CF function 301s `/services/eecp/*` → `/services/`. Do not re-introduce EECP as a service offering, do not list it in `knowsAbout`, and do not include it in keyword targets.

## Current published prices (₹, INR)

These prices live in **three** places and a change must update **all three** (there is no build gate that cross-checks them, so a missed copy silently ships contradictory prices):

1. the yaml prose in `src/content/services/diagnostics-pricing.yaml`,
2. the `buildPricingOfferCatalog()` call in `src/pages/services/[slug].astro` (the `OfferCatalog` JSON-LD), and
3. the hardcoded **"Published prices (INR)"** line in `factsBlock()` inside `scripts/generate-llms.mjs` (the AI-facing `llms.txt` facts block).

The same insurance rule applies: the approved wording ("Cashless and reimbursement options are available for most major procedures — please call to confirm with your provider.") is duplicated in both the yaml and `factsBlock()`; never name a specific insurer in either.

| Service | Price |
|---|---|
| Cardiology Consultation (includes basic ECG) | ₹500 |
| ECG | ₹200 |
| 2D Echocardiography | ₹1,000 |
| Treadmill Test (TMT) | ₹1,200 |
| Holter Monitoring | ₹6,000 |
| Coronary Angiogram | ₹15,000 |
| Coronary Angioplasty | from ₹1,10,000 + hardware |
