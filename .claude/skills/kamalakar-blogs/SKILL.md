---
name: kamalakar-blogs
description: "Ingest blog posts from the Kamalakar Heart Centre Google content doc into the Astro site — read the doc tab, extract the hero banner, write SEO-complete markdown, build, verify, deploy, and confirm on production. Trigger: 'add blog 13', 'add the new blogs', 'blogs from the doc', 'pick blog N from this google doc', 'import blogs from google doc', 'publish the blogs from the content doc', 'add these blogs to the website'"
version: "1.0.0"
---

# Kamalakar Blogs — Google Doc → Live Site Pipeline

You ingest finished blog copy from the client's **Google content doc** and publish it to the Kamalakar Heart Centre Astro site — end to end, verified at every stage.

This skill is the **doc → site ingestion pipeline**. Related skills:
- `blog-writer` — writes a post from scratch (no source doc). Use that when there is no doc copy.
- `deploy-verify` — the authoritative deploy/verify reference. This skill's deploy phase is a condensed form of it.

## Context

| | |
|---|---|
| **Site** | https://kamalakarheartcentre.com |
| **Content doc** | `https://docs.google.com/document/d/1vX9MOFZKhnN0EZi38y2s-_q0nQTHz2kKuVCQPng8U1o/` (tabs named `Blog 1` … `Blog N`) |
| **Posts** | `src/content/blog/<slug>.md` |
| **Hero images** | `public/media/blog-<topic>-hero.{jpg,webp}` (jpg **and** webp pair — no PNG committed) |
| **Schema** | `src/content.config.ts` → `blogPostSchema` |
| **Template** | `src/pages/blog/[slug].astro` |
| **Build** | `npm run build` (astro → sitemap → llms.txt → canonical verifier) |
| **Deploy** | `npm run deploy` (build → tiered S3 sync → CloudFront `/*` invalidation) |

**Everything index-like regenerates at build time.** Never hand-edit `sitemap.xml`, `llms.txt`, `feed.xml`, or the blog index — adding the `.md` file is sufficient.

---

## Non-negotiable facts (verify every claim against these)

These come from `CLAUDE.md`. Doc copy sometimes contradicts them — **the doc is not authoritative on these points.**

**Never publish:**
- ❌ "Assistant Professor" (false — was removed once already)
- ❌ EECP in any form (not offered; `/services/eecp/*` 301s away)
- ❌ Any success-rate stat ("99% success"), "5,000+ procedures"
- ❌ Any named insurance company
- ❌ Invented titles. The doc has used **"Chief Interventional Cardiologist"** — the verified descriptor is **"Interventional Cardiologist"**. Flag it, don't silently ship it.

**Correct facts:**
- MBBS (NTR Univ, 2007) · MD General Medicine, Gold Medalist (NTR Univ, 2012) · **DM Cardiology — Osmania Medical College, 2012–2015** · FESC · AP Medical Council **#57814**
- Volumes: 3,000+ angiograms · 1,000+ angioplasties
- **Never hardcode years of experience** — `AuthorByline` computes it from `START_YEAR = 2015`
- Prices (must match `diagnostics-pricing.yaml`): Consultation ₹500 (incl. basic ECG) · ECG ₹200 · 2D Echo ₹1,000 · TMT ₹1,200 · Holter ₹6,000 · Angiogram ₹15,000 · Angioplasty from ₹1,10,000 + hardware
- Address: Life Hospital, Old Club Road, Kothapet, Guntur – 522001 · Phone 99594 23566 · Mon–Sat 10:00–18:00

---

## Phase 0 — Recon (always, before touching the doc)

```bash
date "+%Y-%m-%d"                      # authoritative publish date — do NOT trust injected context
git -C <repo> status --short          # note pre-existing untracked files; leave them alone
git -C <repo> branch --show-current   # expect main
sed -n '/const blogPostSchema/,/^});/p' src/content.config.ts
grep -n "seoTitle\|seoDescription" 'src/pages/blog/[slug].astro'
ls src/content/blog/                  # existing slugs (avoid collisions, find cross-link targets)
ls src/content/services/              # internal-link targets
```

**Why:** repo history has been rewritten between sessions before. Never assume the state you remember. Confirm the schema still has the fields you plan to use.

Load Chrome tools in **one** ToolSearch call:
```
select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__find,mcp__claude-in-chrome__javascript_tool
```
If the extension is disconnected: `list_connected_browsers` → `select_browser` with the returned `deviceId`.

---

## Phase 1 — Locate the blog tabs

1. `navigate` to the doc URL, then `computer{action:"wait", duration:5}` (canvas render is slow).
2. **Do not scroll the sidebar with the mouse wheel** — it scrolls the document instead. Use:
   ```
   find { query: "Blog 13 and Blog 14 tabs in document tabs sidebar" }   → ref_N
   computer{action:"scroll_to", ref}  →  computer{action:"left_click", ref}
   ```
3. Confirm which tab you landed on by its **title**, not by the URL anchor. State it back to the user.

---

## Phase 2 — Capture the content

Google Docs renders to `<canvas>`. `get_page_text` returns only the chrome, and there are **no `<img>` tags**. Content must be read from screenshots.

**Use the sidebar outline as your checklist.** Once a Blog tab is active, the sidebar lists that post's headings. Capture every one.

Scroll/screenshot loop:
- Scroll down **8–14 ticks** at a time, screenshot each step.
- **When you land past a heading, scroll back up 4–6 ticks and re-shoot.** Large scrolls routinely skip a section. This is the single most common way content gets silently dropped.
- Tick back and forth until every sidebar heading has been read in full.

Capture in full: title, intro, every heading + body + bullets, the trailing **SEO block** (Meta Title / Meta Description / Meta Keywords / **URL Slug**), and any sign-off.

**The SEO block position varies** — sometimes above the title (Blog 10), usually at the very end (Blogs 9, 11, 12).

---

## Phase 3 — Extract the hero banner

**The hero is usually at the very BOTTOM of the tab**, after the SEO block (Blogs 9–12). Blogs 7–8 had it at the top. Always scroll to the end to check.

Full technique + constants: **`reference/google-doc-extraction.md`**. Summary:

1. Frame the whole banner in the viewport (scroll so it is fully visible with margin).
2. Identify the visible page canvas:
   ```js
   Array.from(document.querySelectorAll('canvas')).map((c,i)=>{const r=c.getBoundingClientRect();
     return {i,nw:c.width,nh:c.height,cssW:Math.round(r.width),top:Math.round(r.top),left:Math.round(r.left)}})
     .filter(c=>c.cssW>0)
   ```
   The page canvas is **native 898×1162** for **CSS 816×1056**. Pick the one whose `top` brackets the banner.
3. **Click an empty area of the page first.** `navigator.clipboard.writeText()` silently fails unless `document.hasFocus()` is true — you get ~103 junk chars instead of the image.
4. Crop + copy (content column is native **x≈106, width≈688**; tune `sy`/`sh` to the banner):
   ```js
   const c=document.querySelectorAll('canvas')[IDX];
   const sx=106, sy=SY, sw=688, sh=SH;
   const cr=document.createElement('canvas'); cr.width=sw; cr.height=sh;
   cr.getContext('2d').drawImage(c,sx,sy,sw,sh,0,0,sw,sh);
   window.__h=cr.toDataURL('image/png').split(',')[1];
   await navigator.clipboard.writeText(window.__h);
   'copied '+window.__h.length+' focus='+document.hasFocus()
   ```
   Expect ~600k–900k chars. Anything under ~10k means the copy failed.
5. Save + convert with the bundled script:
   ```bash
   .claude/skills/kamalakar-blogs/scripts/save-hero-image.sh blog-<topic>-hero
   ```
6. **Read the produced `.jpg` back and look at it.** Confirm: whole banner, no body text bleeding in, no mouse cursor overlay, nothing cropped. Re-crop if not.

### Decision gate — mismatched or missing hero

If the tab's image **doesn't match the post topic** (Blog 10's only image was the *Angiography* banner on an *Angioplasty* post), **stop and ask the user.** Offer: (a) publish with no hero — `heroImage` is optional and `og:image` falls back to the doctor portrait, (b) use it anyway, (c) hold for a correct banner. Do not ship a misleading banner.

---

## Phase 4 — Write the markdown

Full house structure + copy rules: **`reference/post-template.md`**.

Frontmatter:

```yaml
---
title: "<H1 — the doc's headline, verbatim>"
metaTitle: "<short SEO title, NO brand suffix>"     # optional
summary: "<1–2 sentences; also feeds llms.txt + RSS>"
metaDescription: "<the doc's Meta Description, verbatim>"   # optional
date: YYYY-MM-DD          # from `date` in Phase 0
author: "Dr. Kamalakar Kosaraju"
tags: [ ... ]             # the doc's Meta Keywords, split into an array
readingTime: "N min read"
heroImage: "/media/blog-<topic>-hero.jpg"          # omit entirely if no hero
heroImageAlt: "<describe the banner, including its on-image text>"
published: true
---
```

### ⚠️ The metaTitle brand-suffix trap

The template does:
```js
const seoTitle = `${post.data.metaTitle ?? post.data.title} | Kamalakar Heart Centre`;
```
The doc's "Meta Title" usually **already ends in `| Dr. Kamalakar Heart Centre`**. Copying it verbatim produces a doubled brand:
> ❌ `Heart Treatment in Guntur | Dr. Kamalakar Heart Centre | Kamalakar Heart Centre`

**Strip the brand from `metaTitle`.** Keep the whole rendered title ≲60–65 chars.

### Other frontmatter rules
- **Slug = filename.** Use the doc's `URL Slug` if given; else derive a short keyword-bearing slug from the meta title. Check for collisions against `ls src/content/blog/`.
- `metaDescription` falls back to `summary`; `metaTitle` falls back to `title`. Omit rather than duplicate.
- `heroImage` auto-resolves the sibling `.webp` for the `<picture>` srcset — only reference the `.jpg`.
- Future `date` = post won't build. Same-day is fine.

### Body must include
1. **Key Takeaway** callout (`<div class="not-prose bg-primary/5 …">`) — a real summary, not a restatement of the intro.
2. The doc's sections as `##` / `###`, faithfully.
3. **Internal links** — at least 3–5 to `/services/*` and sibling posts. Cross-link new posts to each other where topically related.
4. **`## Frequently Asked Questions`** with `### question` subheads → the template auto-builds `FAQPage` JSON-LD from this exact structure. 4–5 Q&As.
5. **Medical disclaimer** block.
6. **CTA** block with `tel:9959423566`.

### Content-adaptation judgement calls
- **Dangling references:** the doc said *"In this informative video, Dr. Kamalakar explains…"* with no video URL. Rephrase to remove it, or embed a real video. Never reference media that isn't on the page.
- **Emergency numbers:** doc says `112`; the rest of the site says `108`. Use **"112 or 108 for an ambulance"** — accurate and consistent.
- **Medical dosing** (aspirin/clopidogrel/nitrates): reproduce **verbatim including every safety caveat**, and keep the strongest available disclaimer. Never soften or trim a contraindication. This is YMYL content.
- **British spelling** matches the existing corpus (personalised, recognise, colour).

---

## Phase 5 — Build and verify indexes

```bash
npm run build
```

Must see all three, with no errors:
- `[sitemap] Generated … with N URLs.`
- `[llms] Generated … (N URLs; …)`
- `[verify-canonicals] OK: N indexable HTML files, all canonicals valid`

Then confirm — don't assume:

```bash
grep -c '<loc>' dist/sitemap.xml
grep -E '<slug-1>|<slug-2>' dist/sitemap.xml
grep -E '<slug-1>|<slug-2>' dist/llms.txt
for s in <slug-1> <slug-2>; do grep -o "$s" dist/feed.xml | head -1; done
ls -la dist/media/blog-*-hero.*
```

**If the URL count isn't `previous + new`, investigate before proceeding.** A legitimate cause: a post was retired in an earlier commit (`understanding-heart-attack-warning-signs` was removed and 301'd, so the baseline dropped by one). Reconcile `ls src/content/blog/*.md | wc -l` against the sitemap's blog entries — they must be equal.

Per-post SEO check:
```bash
for f in <slug-1> <slug-2>; do
  grep -oE '<title>[^<]+</title>|<meta name="description"[^>]+>|<meta name="keywords"[^>]+>|<link rel="canonical"[^>]+>|<meta property="og:url"[^>]+>|<meta property="og:image"[^>]+>' "dist/blog/$f/index.html"
  grep -o '"@type":"FAQPage"' "dist/blog/$f/index.html"
done
```
Assert: `<title>` uses metaTitle + **exactly one** brand suffix · description = metaDescription · canonical == og:url · og:image is the post's own hero (or the doctor portrait when heroless) · FAQPage present.

---

## Phase 6 — Preview smoke test

```bash
npm run preview   # background
```
Port 4321 may already be held by an earlier server — harmless. Astro preview serves `dist/` per request, so an already-running instance still serves the fresh build. Confirm with a 200 on a brand-new URL.

Screenshot both posts and `/blog/`. Verify the hero renders full-width, byline is correct, Key Takeaway is styled, and the new posts sort to the top of the index.

---

## Phase 7 — Commit, push, deploy

**Stage only your own files.** The repo carries pre-existing untracked paths (`.agents/`, `.codex/`, `AGENTS.md`, `google search data/`) — never `git add -A`.

```bash
git add src/content/blog/<slug-1>.md src/content/blog/<slug-2>.md public/media/blog-*-hero.jpg public/media/blog-*-hero.webp
git status --short          # confirm ONLY your files are staged
git commit -m "feat(blog): …"
git push origin main
npm run deploy
```

Commit message: what shipped, the slugs, hero decisions, and any deviation from the doc (dropped video reference, corrected title, etc.). End with the `Co-Authored-By:` trailer.

Deploy prints a CloudFront invalidation Id — record it for the report.

---

## Phase 8 — Verify production, then report

```bash
for u in <post-1-url> <post-2-url> <hero jpgs+webps> /sitemap.xml /llms.txt /feed.xml /blog/; do
  curl -sS -o /dev/null -w "%{http_code}  $u\n" -L "https://kamalakarheartcentre.com$u"
done
curl -sS "https://kamalakarheartcentre.com/sitemap.xml?cb=$RANDOM" | grep -c '<loc>'
```

**Always cache-bust with `?cb=$RANDOM`.** A user once reported a stale sitemap count that was purely browser cache. If a count looks wrong, check `x-cache` / `age` / `last-modified` headers before concluding anything is broken.

Confirm on the live HTML: canonical, og:url, og:image, title, description.

### Report format

- Table: post title → live URL → hero (or "none — og:image falls back to portrait")
- Publish date, commit SHA, invalidation Id
- What was verified (build gates, sitemap/llms/feed counts, prod status codes, SEO tags)
- **Every judgement call made**, stated plainly — corrected titles, dropped references, hero decisions, emergency-number handling
- Remind: **re-submit `sitemap.xml` in Google Search Console** (new pages = structural change per CLAUDE.md)

---

## Decision gates — stop and ask the user

Never guess on these:
1. Hero image doesn't match the post topic, or is missing.
2. Doc copy contradicts the non-negotiable facts (titles, credentials, prices, EECP).
3. The doc's slug collides with an existing post.
4. Doc contains a claim you cannot source (stats, awards, affiliations).

Everything else — spelling normalisation, adding FAQs, internal linking, reading-time — is yours to decide. Do it and mention it in the report.

## Known gotchas (learned the hard way)

| Symptom | Cause | Fix |
|---|---|---|
| Clipboard has ~103 chars | `document.hasFocus()` false | Click an empty page area, retry |
| `sips` fails on WebP | macOS `sips` can't write WebP | Python PIL (the script handles it) |
| Body text in the hero crop | `sh` too tall | Reduce `sh`, re-read the jpg |
| Cursor arrow in the banner | Mouse over the canvas | `computer{action:"hover"}` far away, re-shoot |
| Section missing from the post | Scrolled past it | Scroll back 4–6 ticks; reconcile against sidebar outline |
| Doubled brand in `<title>` | Brand left in `metaTitle` | Strip it — template appends it |
| Sitemap count "wrong" | Browser cache, or an earlier retired post | Cache-bust; reconcile `.md` count vs sitemap |
| `get_page_text` returns nothing useful | Doc is canvas-rendered | Screenshots only |

## Maintenance note

`deploy-verify/SKILL.md` used to hardcode an expected page count, which went stale with every batch. It now asserts the **invariant** instead:

```
indexable HTML == sitemap <loc> == llms.txt URLs        and        total HTML == indexable + 1 (dist/404.html)
```

Keep it that way. If you add a reference point there, date it — don't turn it back into a bare number that the next batch invalidates.
