---
name: deploy-verify
description: "Build, deploy, and verify the Kamalakar Heart Centre website. Runs post-deployment checks on sitemap, robots.txt, SEO meta tags, and page availability. Trigger: 'deploy', 'deploy to production', 'push and deploy', 'verify deployment', 'post-deploy check', 'check sitemap', 'check robots.txt', 'is the site working'"
version: "1.0.0"
---

# Deploy & Verify

You are the deployment and verification agent for the Kamalakar Heart Centre website (Astro static site).

## Context

- **Site:** https://kamalakarheartcentre.com
- **Repo:** https://github.com/Siddharth-kosaraju/kamalakar-website-astro
- **Build command:** `npm run build` (runs `astro build`, sitemap generator, llms.txt generator, and canonical verifier — all must pass)
- **Deploy command:** `npm run deploy` → runs `scripts/deploy.sh` (build + **tiered** S3 sync with per-tier `Cache-Control` + CloudFront invalidation)
- **Output directory:** `dist/`
- **Branch:** `main`

### AWS Infrastructure

- **Hosting:** AWS S3 + CloudFront (static site)
- **S3 Bucket:** `kamalakar-heart-centre-prod`
- **CloudFront Distribution:** `E3STOTV0PG9BZU`
- **AWS CLI Profile:** `sid-personal`
- **Deploy:** `npm run deploy` (= `bash scripts/deploy.sh`). The script syncs in three cache tiers, each pruning its own prefix with `--delete`:
  - `_astro/**` → `Cache-Control: public,max-age=31536000,immutable`
  - `fonts/ images/ media/` + root favicons → `public,max-age=2592000`
  - HTML/`sitemap.xml`/`robots.txt`/`llms.txt`/`feed.xml` → `public,max-age=0,must-revalidate`
  then invalidates CloudFront `/*`.
- **One-time cache-header backfill:** `scripts/backfill-cache-headers.sh` rewrites `Cache-Control` in place on **pre-existing** objects (a plain sync only sets headers on files it re-uploads). **Already run once on 2026-07-07** — do NOT re-run on routine deploys; only needed again if the bucket accumulates objects predating the tiered deploy script.

## Deploy Workflow

### Quick Deploy (Recommended)

```bash
npm run deploy
```

This single command runs: build → S3 sync → CloudFront invalidation. After it completes, proceed directly to Step 3 (post-deployment verification).

### Manual Deploy Steps

#### Step 1: Pre-deploy build

```bash
npm run build
```

Verify:
- Build completes without errors
- `dist/sitemap.xml` exists (NOT `sitemap-0.xml`)
- `dist/robots.txt` exists and contains `Sitemap: https://kamalakarheartcentre.com/sitemap.xml`
- `dist/llms.txt` exists and passes the llms verifier — the build runs `scripts/generate-llms.mjs`, which prints `[llms] Generated .../dist/llms.txt (N URLs; …)` and fails the build if a forbidden claim is present or if the sitemap ⇄ llms.txt completeness cross-check finds a page missing a description entry. The generated file starts with `# Kamalakar Heart Centre`.
- Page count matches expectations. Assert the **invariant**, not a fixed number — the count grows with every new page, so a hardcoded value goes stale:
  - `indexable HTML  ==  sitemap <loc> count  ==  llms.txt URL count`
  - `total HTML  ==  indexable + 1` (the extra is `dist/404.html`, the only `noindex` page — note it is emitted as `404.html` at the root, not `/404/index.html`)
  - the count should equal **previous total + pages added in this change**; if it doesn't, reconcile before deploying (a page may have been retired earlier — see the redirect note below)
  ```bash
  find dist -name '*.html' | wc -l                  # total (indexable + 404)
  grep -c '<loc>' dist/sitemap.xml                  # indexable
  grep -cE '^- \[' dist/llms.txt                    # must equal sitemap
  ls src/content/blog/*.md | wc -l                  # must equal blog entries in sitemap
  ```
  *Reference point: 28 total / 27 indexable as of 2026-07-22, after adding `heart-treatment-in-guntur` and `medical-emergency-heart-attack-first-aid`.*
- Only published posts with `date <= now` are built (future-dated posts must NOT appear)
- `[verify-canonicals] OK: ... all canonicals valid` printed at end of build (the build script now runs `scripts/verify-canonicals.mjs`)

**Structural-change checklist (run before commit if any of these apply):**

If this change adds, renames, removes, or redirects a page — or touches the CloudFront function, robots.txt, or `astro.config.mjs` — then the canonical/sitemap/robots policy in `CLAUDE.md` requires:

- [ ] `npm run build` passes (sitemap regenerated, llms.txt regenerated, canonical verifier passes)
- [ ] Diff `dist/sitemap.xml` against the previous build — added/removed routes match the change
- [ ] **New static page?** Add a matching description entry to `STATIC_DESCRIPTIONS` in `scripts/generate-llms.mjs`. Blog posts (`src/content/blog/*.md`) and services (`src/content/services/*.yaml`) are derived automatically from frontmatter and need no entry, but a new static route (`src/pages/*.astro`) will FAIL the build with `→ in sitemap but missing from llms.txt. Add a STATIC_DESCRIPTIONS["<path>"] entry` until you add one.
- [ ] `public/robots.txt` reviewed — still has exactly two `Sitemap:` lines (`sitemap.xml` primary + `feed.xml` RSS-as-sitemap), AI crawlers still allowed
- [ ] If the CF function changed, plan to deploy it via `scripts/aws_deploy.sh` (NOT `npm run deploy`)
- [ ] **Deleted/renamed a page that had a new CF 301 rule added for its old URL?** Deploy the CF function **before or together with** the site deploy. `npm run deploy` runs `--delete`, so the old URL's `index.html` is pruned from S3 the moment the site deploys. If the CF function (which 301s the old URL) is not yet live, the old URL 404s in the gap. Deploy order: `bash scripts/aws_deploy.sh deploy prod` (or the CF-function-only path) → then `npm run deploy` → then verify the 301. (As of 2026-07-07 this applies to `/blog/understanding-heart-attack-warning-signs/` → `/blog/7-warning-signs-heart-attack-never-ignore/`.)
- [ ] Sitemap re-submitted in Google Search Console after deploy

#### Step 2a: Commit and push

```bash
git add <files>
git commit -m "descriptive message"
git push origin main
```

#### Step 2b: Deploy to AWS

```bash
bash scripts/deploy.sh
```

This is the canonical deploy path (same as `npm run deploy`). It rebuilds, strips `dist/.DS_Store`, then runs the **tiered** S3 sync with per-tier `Cache-Control` and invalidates CloudFront `/*`. **Do NOT** fall back to a single `aws s3 sync dist/ s3://… --delete` — that uploads every object with default (no `Cache-Control`) headers and undoes the cache-tier work. Each tier prunes its own prefix with `--delete`, so orphaned assets and HTML are still removed.

**IMPORTANT:** `scripts/deploy.sh` always invalidates CloudFront after the sync. Without invalidation, CloudFront serves stale cached content (TTL can be up to 24 hours). The per-tier `--delete` removes files from the bucket that no longer exist in `dist/` (e.g., old `sitemap-0.xml`, a stale content-hashed `_astro/` asset).

#### Step 2c: Wait for invalidation

CloudFront invalidation typically completes in 1-2 minutes. Check status:

```bash
aws cloudfront get-invalidation --distribution-id E3STOTV0PG9BZU --id <INVALIDATION_ID> --profile sid-personal
```

### Step 3: Post-deployment verification

After code is deployed to production, run ALL of these checks using WebFetch:

#### 3a. Sitemap verification

```
WebFetch: https://kamalakarheartcentre.com/sitemap.xml
```

Check:
- [ ] Returns valid XML (not a 404 or HTML page)
- [ ] Contains all expected URLs (homepage, about, services, blog, contact, etc.)
- [ ] Blog post URLs match only published posts with date <= today
- [ ] No Telugu `/te/` URLs present
- [ ] `lastmod` dates are real dates (not all identical build timestamps)
- [ ] All URLs use `https://kamalakarheartcentre.com` (no trailing slash inconsistencies)

#### 3b. robots.txt verification

```
WebFetch: https://kamalakarheartcentre.com/robots.txt
```

Check:
- [ ] Returns valid robots.txt (not a 404)
- [ ] Contains `Sitemap: https://kamalakarheartcentre.com/sitemap.xml` (with space after `Sitemap:`)
- [ ] `Allow: /` is set for all user agents
- [ ] AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Bingbot) are allowed

#### 3b-ii. llms.txt verification

```
WebFetch: https://kamalakarheartcentre.com/llms.txt
```

Check:
- [ ] Returns HTTP `200` (not a 404) and is served as text, not redirected
- [ ] Content starts with `# Kamalakar Heart Centre`
- [ ] Lists the current pages (blog posts, services, static pages) as Markdown links under H2 sections

The retired files must now be **gone** (they were deleted from `public/` and the S3 `--delete` sync removes them from the bucket):

```
curl -sI https://kamalakarheartcentre.com/llms-full.txt
curl -sI https://kamalakarheartcentre.com/.well-known/llms.txt
curl -sI https://kamalakarheartcentre.com/.well-known/llms-full.txt
```

Check:
- [ ] Each returns `404` (or `403`) — these are retired and must NOT serve content

#### 3b-iii. Cache-Control header verification

The tiered deploy (`scripts/deploy.sh`) sets per-tier `Cache-Control`. Verify one asset per tier plus HTML:

```bash
# Tier 1 — content-hashed asset (grab a real filename from the homepage first)
ASSET=$(curl -s https://kamalakarheartcentre.com/ | grep -oE '/_astro/[^"]+\.(js|css)' | head -1)
curl -sI "https://kamalakarheartcentre.com${ASSET}" | grep -i cache-control
# Tier 2 — font / image
curl -sI https://kamalakarheartcentre.com/fonts/inter-latin.woff2 | grep -i cache-control
# Tier 3 — HTML + llms.txt
curl -sI https://kamalakarheartcentre.com/ | grep -i cache-control
curl -sI https://kamalakarheartcentre.com/llms.txt | grep -i cache-control
```

Check:
- [ ] `_astro/*` asset → `public,max-age=31536000,immutable`
- [ ] `fonts/*.woff2` → `public,max-age=2592000`
- [ ] `/` (HTML) and `/llms.txt` → `public,max-age=0,must-revalidate`
- [ ] If any asset still has **no** `Cache-Control` header, a pre-existing object was missed — run `scripts/backfill-cache-headers.sh` once, then re-invalidate CloudFront.

> The CloudFront function `redirect-www-to-non-www.js` is a **viewer-request** function — it never touches response headers, so it cannot strip `Cache-Control`. If headers are missing, the cause is an un-backfilled S3 object, not the CF function.

#### 3c. Homepage check

```
WebFetch: https://kamalakarheartcentre.com/
```

Check:
- [ ] Page loads (not a 404 or error)
- [ ] Title contains "Kamalakar Heart Centre"

#### 3d. Blog listing check

```
WebFetch: https://kamalakarheartcentre.com/blog/
```

Check:
- [ ] Page loads
- [ ] Only shows published posts with date <= today
- [ ] No future-dated posts visible

#### 3e. Latest blog post check

Fetch the most recently published blog post URL from the sitemap, then:
- [ ] Page loads (not a 404)
- [ ] JSON-LD schemas present (BlogPosting, MedicalWebPage, BreadcrumbList)
- [ ] og:type is "article"
- [ ] article:published_time meta tag present

#### 3f. Retired Telugu routes — must 301 to homepage

```
curl -sI https://kamalakarheartcentre.com/te/
curl -sI https://kamalakarheartcentre.com/te
curl -sI https://kamalakarheartcentre.com/te/about
```

Check:
- [ ] All three return `301 Moved Permanently` with `Location: https://kamalakarheartcentre.com/`
- [ ] Telugu pages must NOT serve content (no 200)

#### 3f-ii. Retired duplicate blog post — must 301 to consolidated guide

The `understanding-heart-attack-warning-signs` post was removed (2026-07-07) and superseded by `7-warning-signs-heart-attack-never-ignore`. The CF function 301s the old slug (both slash and no-slash forms). Its `index.html` no longer exists in the bucket, so if the CF function is NOT deployed the old URL 404s.

```bash
curl -sI https://kamalakarheartcentre.com/blog/understanding-heart-attack-warning-signs/
curl -sI https://kamalakarheartcentre.com/blog/understanding-heart-attack-warning-signs
```

Check:
- [ ] Both return `301 Moved Permanently` with `Location: https://kamalakarheartcentre.com/blog/7-warning-signs-heart-attack-never-ignore/`
- [ ] The redirect target returns `200`
- [ ] If either returns `404`, the CF function was not deployed before the site — run `bash scripts/aws_deploy.sh deploy prod` (CF function path) and re-invalidate. This is the deploy-ordering failure mode called out in the structural-change checklist.

#### 3g. Trailing-slash canonicalisation — no-slash 301s to slash

```
curl -sI https://kamalakarheartcentre.com/services/ecg-echo
curl -sI https://kamalakarheartcentre.com/about
```

Check:
- [ ] Each returns `301` with `Location` ending in `/`
- [ ] The redirect target itself returns `200` (the slash form is the canonical)
- [ ] Files (`/sitemap.xml`, `/robots.txt`, `*.jpg`, `*.css`) are NOT redirected

#### 3h. Legacy SPA query-string redirects

```
curl -sI 'https://kamalakarheartcentre.com/?page=education'
curl -sI 'https://kamalakarheartcentre.com/?lang=te'
```

Check:
- [ ] `?page=education` → 301 → `https://kamalakarheartcentre.com/education/`
- [ ] `?page=about|services|contact|blog` → 301 → matching clean URL
- [ ] `?lang=te` → 301 → `https://kamalakarheartcentre.com/`
- [ ] An unknown query (e.g. `?ref=email`) is NOT redirected (renders homepage normally)

#### 3i. Canonical-tag spot check

For at least 3 random pages, confirm exactly one canonical and that it is self-referential:

```
curl -s https://kamalakarheartcentre.com/services/ecg-echo/ | grep -o '<link rel="canonical"[^>]*>'
```

Check:
- [ ] Exactly one canonical tag per page
- [ ] HTTPS, bare domain, trailing slash
- [ ] `og:url` matches the canonical exactly

(The build itself runs `scripts/verify-canonicals.mjs` and fails if any of these are violated, so this is a regression check, not a primary gate.)

### Step 4: Report

Present results as a table:

| Check | Status | Details |
|-------|--------|---------|
| Sitemap at /sitemap.xml | PASS/FAIL | ... |
| robots.txt Sitemap reference | PASS/FAIL | ... |
| llms.txt at /llms.txt (200, starts `# Kamalakar Heart Centre`) | PASS/FAIL | ... |
| Retired /llms-full.txt returns 404/403 | PASS/FAIL | ... |
| Homepage loads | PASS/FAIL | ... |
| Blog listing (no future posts) | PASS/FAIL | ... |
| Latest blog post SEO schemas | PASS/FAIL | ... |
| Telugu routes return 404 | PASS/FAIL | ... |

## Common Issues & Fixes

### Sitemap shows as sitemap-0.xml instead of sitemap.xml
- **Cause:** `scripts/generate-sitemap.mjs` has wrong `OUT_FILE` path
- **Fix:** Ensure `OUT_FILE = join(DIST, 'sitemap.xml')` (not `sitemap-0.xml`)

### robots.txt points to wrong sitemap
- **Cause:** `public/robots.txt` has old sitemap path
- **Fix:** Update to `Sitemap: https://kamalakarheartcentre.com/sitemap.xml`

### Future-dated blog posts appearing on site
- **Cause:** Missing `post.data.date <= now` filter in page files
- **Fix:** All 4 blog page files must filter: `src/pages/blog/index.astro`, `src/pages/blog/[slug].astro`

### Sitemap lastmod dates all identical
- **Cause 1:** Using build time instead of git commit dates
- **Fix:** `scripts/generate-sitemap.mjs` must use `git log -1 --format=%aI -- <file>`
- **Cause 2:** Tracking shared template files (e.g., `[slug].astro`) alongside content files — any template refactor resets ALL pages' lastmod
- **Fix:** For content-driven routes (blog posts, services), only track the content file (`.md` / `.yaml`), NOT the shared template. Template changes are infrastructure, not content updates.

### FAQ schema not generating
- **Cause:** FAQ section doesn't follow exact format
- **Fix:** Must use `## Frequently Asked Questions` then `### Question` with one blank line before answer

### Green tips box layout splitting into columns
- **Cause:** `<strong>` inside `<li class="flex">` creates separate flex item
- **Fix:** Wrap `<strong>` + text in `<span>`: `<li class="flex gap-2 items-start"><span>...</span> <span><strong>Label:</strong> text</span></li>`

## Build Pipeline Reference

- **Date gating:** `post.data.date <= now` in `getStaticPaths()` — posts auto-publish on next build after their date
- **Sitemap generator:** `scripts/generate-sitemap.mjs` — runs post-build, uses git dates for lastmod
- **SEO schemas:** Auto-generated in `src/pages/blog/[slug].astro` from frontmatter (BlogPosting, MedicalWebPage, BreadcrumbList, FAQPage)
- **robots.txt:** Static file in `public/robots.txt` — copied to `dist/` at build time
- **Deploy script:** `npm run deploy` (= `bash scripts/deploy.sh`) — builds, strips `.DS_Store`, tiered S3 sync (each tier prunes its own prefix with `--delete`, per-tier `Cache-Control`), invalidates CloudFront

## Workflow Learnings (Avoid Repeating These Mistakes)

1. **Sitemap filename:** The sitemap generator MUST output `sitemap.xml` (not `sitemap-0.xml`). Google and all crawlers expect `/sitemap.xml`. The `OUT_FILE` in `scripts/generate-sitemap.mjs` must always be `join(DIST, 'sitemap.xml')`.

2. **robots.txt format:** The `Sitemap:` directive MUST have a space after the colon: `Sitemap: https://...` (not `Sitemap:https://...`). Some crawlers fail to parse without the space.

3. **CloudFront invalidation is mandatory:** After every S3 sync, ALWAYS run CloudFront invalidation. Without it, users see stale cached content for up to 24 hours. The `npm run deploy` script handles this automatically.

4. **S3 `--delete` flag:** Always use `--delete` with `aws s3 sync` to remove orphaned files (e.g., old `sitemap-0.xml`). Without it, stale files persist in the bucket.

5. **Git auth for pushes:** If HTTPS push fails, run `gh auth setup-git` to configure git credentials via GitHub CLI.

6. **Quoting glob characters in git:** Paths with brackets like `src/pages/blog/[slug].astro` must be quoted in git commands to prevent shell glob expansion.

7. **Sitemap timestamps:** Never use build-time for `lastmod`. Always use `git log -1 --format=%aI -- <file>` for real content-change dates. Fake timestamps burn Google's crawl budget.

8. **Sitemap source file mapping:** For content-driven routes (blog posts → `.md`, services → `.yaml`), only track the content file in `getSourceFiles()`. Do NOT include shared templates like `[slug].astro` — a template refactor would incorrectly reset `lastmod` for every page using that template, telling Google everything changed when only infrastructure did.
