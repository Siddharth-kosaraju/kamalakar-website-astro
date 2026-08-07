---
name: kamalakar-case-studies
description: "Add a new patient case study to the Kamalakar Heart Centre site — ingest from the Google content doc (or provided copy), write SEO-complete markdown, and verify that the case-study index, sitemap, llms.txt and RSS feed all reflect it. Trigger: 'add case study 2', 'add the new case study', 'pick case-study N from the doc', 'publish the case study', 'import case studies from the google doc', 'new case study for the website'"
version: "1.0.0"
---

# Kamalakar Case Studies — Google Doc → Live Site Pipeline

You ingest a finished patient case study from the client's **Google content doc** (tabs named `Case study - N`) and publish it to the Kamalakar Heart Centre Astro site — end to end, verified at every stage.

Related skills:
- `kamalakar-blogs` — the same pipeline for blog posts. The two share conventions; where this file is silent, that skill's rules apply (doc-reading technique, hero-image extraction, commit/deploy ordering).
- `deploy-verify` — the authoritative deploy/verify reference.

## Context

| | |
|---|---|
| **Site** | https://kamalakarheartcentre.com |
| **Content doc** | `https://docs.google.com/document/d/1vX9MOFZKhnN0EZi38y2s-_q0nQTHz2kKuVCQPng8U1o/` (tabs named `Case study - N`) |
| **Case studies** | `src/content/case-study/<slug>.md` — **filename = URL slug** |
| **URLs** | list `/case-study/` · detail `/case-study/<slug>/` |
| **Schema** | `src/content.config.ts` → `caseStudies` collection (reuses `blogPostSchema`) |
| **Templates** | `src/pages/case-study/index.astro` (list) · `src/pages/case-study/[slug].astro` (detail) |
| **Hero images** | `public/media/case-study-<topic>-hero.{jpg,webp}` (jpg **and** webp pair) — optional |
| **Build** | `npm run build` (astro → sitemap → llms.txt → canonical verifier) |
| **Deploy** | `npm run deploy` (build → S3 sync → CloudFront invalidation) |

**Everything index-like regenerates at build time — adding the `.md` file is sufficient.** The case-study list page, `sitemap.xml`, `llms.txt` and `feed.xml` all pick up a new case study automatically:
- the **list page** and **RSS feed** query the `caseStudies` collection at build time;
- `scripts/generate-sitemap.mjs` walks `dist/` (detail pages get priority 0.60, `lastmod` from the `.md`'s git history);
- `scripts/generate-llms.mjs` `collectCaseStudies()` emits `## Patient Case Studies` entries (title + summary) and cross-checks against the sitemap — a discrepancy **fails the build**.

**Never hand-edit** `sitemap.xml`, `llms.txt`, `feed.xml`, or the list page to add an entry.

The header nav, footer quick links, and the homepage testimonials-section link all point at `/case-study/` already — **no nav changes are needed for a new case study.**

---

## Non-negotiable rules (verify every claim against these)

All of `CLAUDE.md`'s facts apply. The doc is **not** authoritative on these points:

**Never publish:**
- ❌ Any success-rate stat ("99% success"), "5,000+ procedures"
- ❌ "Assistant Professor" · ❌ EECP in any form · ❌ any named insurance company
- ❌ Invented titles — the doc has used **"Chief Interventional Cardiologist"**; the verified descriptor is **"Interventional Cardiologist"**
- ❌ Anything that could identify a patient: name, age as a number, exact dates of admission, village/town, occupation, photos. "Elderly patient", "middle-aged patient" etc. is the correct level of detail.

**Every case study MUST include:**
1. The line *"Patient-identifying information has been withheld to protect privacy."* near the top (italics, after the overview).
2. The closing medical-disclaimer block stating it is an **anonymized educational case scenario**, that treatments vary between patients, and the 108 emergency line. Copy the block from `coronary-angioplasty-stent-elderly-patient.md`.
3. Correct prices if any are mentioned (must match `diagnostics-pricing.yaml` — see CLAUDE.md's price table).

**Outcome language:** describing *this one patient's* good outcome is fine (it is what a case study is). Never generalize it into a success-rate or a promise ("our patients recover fully").

---

## Phase 0 — Recon

```bash
date "+%Y-%m-%d"                       # authoritative publish date
git status --short                     # note pre-existing files; leave them alone
ls src/content/case-study/             # existing slugs (avoid collisions)
ls src/content/blog/ src/content/services/   # internal-link targets
```

Read the doc tab. Two ways, in order of preference:
1. **Google Drive MCP** (`read_file_content` with fileId `1vX9MOFZKhnN0EZi38y2s-_q0nQTHz2kKuVCQPng8U1o`) — returns the full doc text including all tabs; search for `Case study - N`. Fast, reliable, but returns **no images**.
2. **Chrome canvas screenshots** — required only for hero-image extraction; full technique in `kamalakar-blogs` (`reference/google-doc-extraction.md`).

Capture in full: title, every section, and the trailing **SEO block** (Meta Title / Meta Description / URL Slug / Focus Keyword / Primary Keywords).

---

## Phase 1 — Write the markdown

Create `src/content/case-study/<slug>.md`. **Slug = the doc's URL Slug** with the `/case-study/` prefix stripped (e.g. doc says `/case-study/foo-bar` → file `foo-bar.md`). Check for collisions.

Frontmatter (same schema as blog posts):

```yaml
---
title: "<H1 — the doc's headline, verbatim>"
metaTitle: "<short SEO title, NO brand suffix, ≤40 chars>"
summary: "<1–2 sentences; feeds llms.txt, RSS and the list card>"
metaDescription: "<the doc's Meta Description, verbatim>"
date: YYYY-MM-DD               # from `date` in Phase 0
author: "Dr. Kamalakar Kosaraju"
tags: [ ... ]                  # from the doc's Primary Keywords, 5–6 items
readingTime: "N min read"
heroImage: "/media/case-study-<topic>-hero.jpg"   # omit entirely if none
heroImageAlt: "<describe the banner>"
published: true
---
```

### The metaTitle brand-suffix trap
The template renders `<title>` as `metaTitle | Kamalakar Heart Centre` (25-char suffix). The doc's Meta Title is usually too long for that — shorten it to ≤40 chars while keeping the focus keyword, and never leave a brand name inside `metaTitle`. Precedent: doc gave *"Coronary Angioplasty and Stent Case Study in an Elderly Patient"* → shipped `metaTitle: "Coronary Angioplasty & Stent Case Study"`.

### Body structure (follow `coronary-angioplasty-stent-elderly-patient.md` as the model)
1. **Key Takeaway** callout (`<div class="not-prose bg-primary/5 …">`) — 3–4 sentence summary of the case and its lesson.
2. The doc's sections as `##` / `###`, faithfully: typically Case Overview → The Patient's Problem → Diagnostic Evaluation → Diagnosis → Treatment → Post-Procedure Care → Outcome → Conclusion.
3. The **privacy line** after the overview (see non-negotiables).
4. **Internal links** — 3–5 to `/services/*` and `/blog/*` where the case mentions tests/procedures (ECG/2D Echo → `/services/ecg-echo/`, angioplasty → `/services/angioplasty/`, angiography → `/blog/angiography-procedure-preparation-risks-recovery/`, emergencies → `/services/emergency-cardiac-care/`).
5. **CTA block** with `tel:9959423566` (copy the styled div from the model file).
6. **Medical disclaimer** block (anonymized-case wording).
7. Optional `## Frequently Asked Questions` with `### question` subheads — the template auto-builds FAQPage JSON-LD from that exact structure. Only add FAQs if the doc provides them or the user asks.

The detail template automatically emits: canonical + og tags, `article:section: Patient Case Studies`, and JSON-LD (`Article`, `MedicalWebPage`, `BreadcrumbList`, referencing the site-wide `#physician` / `#organization` entities). No per-page schema work is needed.

---

## Phase 2 — Build and verify indexes

```bash
npm run build
```

Must see all three, with no errors:
- `[sitemap] Generated … with N URLs.` (N = previous + 1)
- `[llms] Generated … (N URLs; …)`
- `[verify-canonicals] OK: N indexable HTML files, all canonicals valid`

Then confirm — don't assume:

```bash
grep '<slug>' dist/sitemap.xml dist/llms.txt
grep -o 'case-study/<slug>' dist/feed.xml | head -1
grep -c 'case-study/<slug>' dist/case-study/index.html   # ≥1: card on the list page
```

Per-page SEO check:
```bash
f=dist/case-study/<slug>/index.html
grep -oE '<title>[^<]+</title>|<link rel="canonical"[^>]+>|<meta property="og:url"[^>]+>|<meta name="description"[^>]+>' "$f"
grep -o '"@type":"Article"' "$f"; grep -o '"@type":"MedicalWebPage"' "$f"
```
Assert: `<title>` has **exactly one** brand suffix · canonical == og:url · description = metaDescription.

Preview smoke test: serve the build (`npm run preview -- --port 4326`), screenshot `/case-study/` (new card, newest first) and the new detail page (H1, byline, Key Takeaway, CTA render correctly).

---

## Phase 3 — Commit, push, deploy

> **Commit before you deploy.** The sitemap takes `lastmod` from git history; an uncommitted `.md` triggers a `[sitemap] WARNING` and publishes an mtime-based date. **Never deploy while that warning is on screen** — commit, rebuild, then deploy.

**Stage only your own files** (the repo carries unrelated untracked paths — never `git add -A`):

```bash
git add src/content/case-study/<slug>.md public/media/case-study-*-hero.*   # hero only if present
git status --short        # confirm ONLY your files are staged
git commit -m "feat(case-study): <title> (<slug>)"
git push origin main
npm run deploy
```

## Phase 4 — Verify production, then report

```bash
for u in /case-study/ /case-study/<slug>/ /sitemap.xml /llms.txt /feed.xml; do
  curl -sS -o /dev/null -w "%{http_code}  $u\n" -L "https://kamalakarheartcentre.com$u"
done
curl -sS "https://kamalakarheartcentre.com/sitemap.xml?cb=$RANDOM" | grep 'case-study'
```
Always cache-bust with `?cb=$RANDOM`. Confirm canonical/og/title on the live HTML.

Report: live URL, commit SHA, invalidation Id, what was verified, and **every judgement call** (shortened metaTitle, dropped/added content, hero decision). Remind the user to **re-submit `sitemap.xml` in Google Search Console** — a new page is a structural change per CLAUDE.md.

---

## Decision gates — stop and ask the user

1. The case study contains potentially identifying patient details even after the doc's own anonymization.
2. Doc copy contradicts the non-negotiable facts (titles, credentials, prices, EECP).
3. The doc's slug collides with an existing case study or blog post.
4. A claim you cannot source (stats, awards, outcome guarantees).
5. Hero image missing or mismatched — offer: publish heroless (og:image falls back to the doctor portrait), use it anyway, or hold.

Everything else — spelling normalisation (British English), internal linking, reading-time, metaTitle shortening — is yours to decide. Do it and state it in the report.
