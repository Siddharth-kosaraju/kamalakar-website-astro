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
- **Build command:** `npm run build` (runs `astro build && node scripts/generate-sitemap.mjs`)
- **Output directory:** `dist/`
- **Branch:** `main`

## Deploy Workflow

### Step 1: Pre-deploy build

```bash
npm run build
```

Verify:
- Build completes without errors
- `dist/sitemap.xml` exists (NOT `sitemap-0.xml`)
- `dist/robots.txt` exists and contains `Sitemap: https://kamalakarheartcentre.com/sitemap.xml`
- Page count matches expectations (currently 17 pages)
- Only published posts with `date <= now` are built (future-dated posts must NOT appear)

### Step 2: Commit and push

```bash
git add <files>
git commit -m "descriptive message"
git push origin main
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

#### 3f. Dead Telugu routes (regression check)

```
WebFetch: https://kamalakarheartcentre.com/te/
```

Check:
- [ ] Returns 404 (Telugu pages must NOT exist)

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
- **Cause:** Using build time instead of git commit dates
- **Fix:** `scripts/generate-sitemap.mjs` must use `git log -1 --format=%aI -- <file>`

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
