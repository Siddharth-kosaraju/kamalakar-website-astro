---
name: deploy-verify
description: "Build, deploy, and verify the Kamalakar Heart Centre website. Runs post-deployment checks on sitemap, robots.txt, SEO meta tags, and page availability. Trigger: 'deploy', 'deploy to production', 'push and deploy', 'verify deployment', 'post-deploy check', 'check sitemap', 'check robots.txt', 'is the site working'"
version: "1.0.0"
---

# Deploy & Verify

You are the deployment and verification agent for the Kamalakar Heart Centre website (Astro static site).

## Context

- **Site:** https://kamalakarheartcentre.com
- **Repo:** https://github.com/AlbusisDead/kamalakar-website-astro
- **Build command:** `npm run build` (runs `astro build`, sitemap generator, and canonical verifier — all three must pass)
- **Deploy command:** `npm run deploy` (builds + S3 sync + CloudFront invalidation — all-in-one)
- **Output directory:** `dist/`
- **Branch:** `main`

### AWS Infrastructure

- **Hosting:** AWS S3 + CloudFront (static site)
- **S3 Bucket:** `kamalakar-heart-centre-prod`
- **CloudFront Distribution:** `E3STOTV0PG9BZU`
- **AWS CLI Profile:** `sid-personal`
- **Deploy commands (manual):**
  ```bash
  aws s3 sync dist/ s3://kamalakar-heart-centre-prod --delete --profile sid-personal
  aws cloudfront create-invalidation --distribution-id E3STOTV0PG9BZU --paths "/*" --profile sid-personal
  ```

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
- Page count matches expectations (currently 21 HTML pages, 20 indexable + the noindex /404/)
- Only published posts with `date <= now` are built (future-dated posts must NOT appear)
- `[verify-canonicals] OK: ... all canonicals valid` printed at end of build (the build script now runs `scripts/verify-canonicals.mjs`)

**Structural-change checklist (run before commit if any of these apply):**

If this change adds, renames, removes, or redirects a page — or touches the CloudFront function, robots.txt, or `astro.config.mjs` — then the canonical/sitemap/robots policy in `CLAUDE.md` requires:

- [ ] `npm run build` passes (sitemap regenerated, canonical verifier passes)
- [ ] Diff `dist/sitemap.xml` against the previous build — added/removed routes match the change
- [ ] `public/robots.txt` reviewed — still has exactly one `Sitemap:` line, AI crawlers still allowed
- [ ] If the CF function changed, plan to deploy it via `scripts/aws_deploy.sh` (NOT `npm run deploy`)
- [ ] Sitemap re-submitted in Google Search Console after deploy

#### Step 2a: Commit and push

```bash
git add <files>
git commit -m "descriptive message"
git push origin main
```

#### Step 2b: Deploy to AWS

```bash
aws s3 sync dist/ s3://kamalakar-heart-centre-prod --delete --profile sid-personal
aws cloudfront create-invalidation --distribution-id E3STOTV0PG9BZU --paths "/*" --profile sid-personal
```

**IMPORTANT:** Always invalidate CloudFront after S3 sync. Without invalidation, CloudFront serves stale cached content (TTL can be up to 24 hours). The `--delete` flag on S3 sync removes files from the bucket that no longer exist in `dist/` (e.g., old `sitemap-0.xml`).

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
- **Deploy script:** `npm run deploy` — builds, syncs to S3 with `--delete`, invalidates CloudFront

## Workflow Learnings (Avoid Repeating These Mistakes)

1. **Sitemap filename:** The sitemap generator MUST output `sitemap.xml` (not `sitemap-0.xml`). Google and all crawlers expect `/sitemap.xml`. The `OUT_FILE` in `scripts/generate-sitemap.mjs` must always be `join(DIST, 'sitemap.xml')`.

2. **robots.txt format:** The `Sitemap:` directive MUST have a space after the colon: `Sitemap: https://...` (not `Sitemap:https://...`). Some crawlers fail to parse without the space.

3. **CloudFront invalidation is mandatory:** After every S3 sync, ALWAYS run CloudFront invalidation. Without it, users see stale cached content for up to 24 hours. The `npm run deploy` script handles this automatically.

4. **S3 `--delete` flag:** Always use `--delete` with `aws s3 sync` to remove orphaned files (e.g., old `sitemap-0.xml`). Without it, stale files persist in the bucket.

5. **Git auth for pushes:** If HTTPS push fails, run `gh auth setup-git` to configure git credentials via GitHub CLI.

6. **Quoting glob characters in git:** Paths with brackets like `src/pages/blog/[slug].astro` must be quoted in git commands to prevent shell glob expansion.

7. **Sitemap timestamps:** Never use build-time for `lastmod`. Always use `git log -1 --format=%aI -- <file>` for real content-change dates. Fake timestamps burn Google's crawl budget.

8. **Sitemap source file mapping:** For content-driven routes (blog posts → `.md`, services → `.yaml`), only track the content file in `getSourceFiles()`. Do NOT include shared templates like `[slug].astro` — a template refactor would incorrectly reset `lastmod` for every page using that template, telling Google everything changed when only infrastructure did.
