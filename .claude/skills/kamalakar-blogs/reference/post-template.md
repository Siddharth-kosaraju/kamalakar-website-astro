# House post structure

Match the existing corpus (`src/content/blog/*.md`). Copy the blocks below verbatim and fill them in — the CSS classes are load-bearing for dark mode and prose resets.

## Frontmatter

```yaml
---
title: "<the doc's H1, verbatim — this is the on-page H1>"
metaTitle: "<short SEO title WITHOUT the brand suffix>"
summary: "<1–2 sentences; feeds the blog index card, llms.txt and RSS>"
metaDescription: "<the doc's Meta Description, verbatim>"
date: YYYY-MM-DD
author: "Dr. Kamalakar Kosaraju"
tags: ["<doc keyword 1>", "<doc keyword 2>", "..."]
readingTime: "N min read"
heroImage: "/media/blog-<topic>-hero.jpg"
heroImageAlt: "<what the banner shows, including its on-image text>"
published: true
---
```

Field behaviour (`src/content.config.ts` + `src/pages/blog/[slug].astro`):

| Field | Effect | Fallback |
|---|---|---|
| `title` | on-page `<h1>`, BlogPosting headline, breadcrumb | required |
| `metaTitle` | `<title>` only — brand appended by template | `title` |
| `summary` | index card, llms.txt, RSS, schema description | required |
| `metaDescription` | `<meta name="description">`, og/twitter description | `summary` |
| `tags` | `<meta name="keywords">`, tag pills, schema keywords | optional |
| `heroImage` | `<picture>` lede + `og:image` + BlogPosting.image | portrait `dr-kamalakar.jpg` |
| `heroImageAlt` | `alt` on the hero | `title` |
| `date` | publish gate (`date <= now`), sort order, sitemap lastmod | required |
| `published` | kill switch | `true` |

`heroImage` auto-derives the `.webp` sibling — reference only the `.jpg`.

Reading time ≈ words ÷ 200, rounded up. Existing posts run 6–7 min.

## Body blocks

### 1. Key Takeaway (always first)

```html
<div class="not-prose bg-primary/5 dark:bg-primary/10 border-l-4 border-primary rounded-r-xl p-5 mb-10">
<p class="text-sm font-bold uppercase tracking-wider text-primary dark:text-accent-light mb-2">Key Takeaway</p>
<p class="text-base leading-relaxed text-gray-700 dark:text-gray-300">…</p>
</div>
```

Answer the title's question in 2–3 sentences. Bold the 3–5 load-bearing terms. Don't just restate the intro.

For urgent/emergency posts, swap to the red variant and retitle the label (e.g. "Act First, Then Treat"):

```html
<div class="not-prose bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 rounded-r-xl p-5 mb-10">
<p class="text-sm font-bold uppercase tracking-wider text-red-700 dark:text-red-400 mb-2">…</p>
```

### 2. Sections

Plain markdown `##` / `###`, following the doc's own headings. Keep the doc's ordering — it reflects how the client wants the topic told. Bullets stay bullets. Bold the doc's bolded phrases.

### 3. Internal links (3–5 minimum)

Targets:
- `/services/` · `/services/angioplasty/` · `/services/ecg-echo/` · `/services/heart-failure/` · `/services/hypertension-cholesterol/` · `/services/pacemaker/` · `/services/emergency-cardiac-care/` · `/services/diagnostics-pricing/`
- sibling posts — always check `ls src/content/blog/` for current slugs

Link on natural phrases, not "click here". When shipping two related posts in one batch, cross-link them.

### 4. FAQ (drives FAQPage schema)

```markdown
## Frequently Asked Questions

### <question in the user's words>

<2–4 sentence answer, may contain links>
```

The template parses this **exact** shape — `## Frequently Asked Questions`, then `###` per question. Deviating breaks the schema silently. 4–5 questions. Cut the section off with the disclaimer `<div>` (the parser stops at the first root-level `<div>`).

### 5. Medical disclaimer

```html
<div class="not-prose text-xs text-gray-400 dark:text-gray-500 border-t border-gray-200 dark:border-gray-700 pt-4 mt-8">
<p><strong>Medical Disclaimer:</strong> This article is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified cardiologist for personalised guidance. If you are experiencing a medical emergency, call 108 or visit your nearest emergency room immediately.</p>
</div>
```

If the doc supplies a stronger disclaimer (the emergency post did), use the doc's — never weaken it.

### 6. CTA

```html
<div class="not-prose bg-primary/10 dark:bg-primary/20 border border-primary/20 rounded-2xl p-6 sm:p-8 my-8 text-center">
<p class="text-lg sm:text-xl font-bold mb-2 text-gray-900 dark:text-white">…</p>
<p class="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4">…</p>
<a href="tel:9959423566" class="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-full font-bold text-lg shadow-lg hover:shadow-xl hover:bg-primary-dark transition-all">
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
99594 23566
</a>
<p class="text-xs text-gray-500 dark:text-gray-400 mt-3">Life Hospital, Old Club Road, Kothapet, Guntur &mdash; 522001</p>
</div>
```

Use the doc's own "Book an Appointment" copy as the CTA text where it has one.

## Voice

- British spelling: personalised, recognise, colour, anaesthesia.
- Second person ("your heart"), plain language, no hype.
- Never add statistics the doc didn't supply and you can't source. Existing posts cite INTERHEART / Lancet / WHO / AHA / Mayo Clinic — you may keep such citations when the doc names them, with a real link.
- Don't stack `<div>` blocks back to back; let prose breathe between them.

## Do not

- ❌ Write JSON-LD by hand — the template generates BlogPosting, MedicalWebPage, BreadcrumbList and FAQPage.
- ❌ Add an `<h1>` in the body (the template renders `title`).
- ❌ Hardcode years of experience or invent credentials.
- ❌ Reference a video/image that isn't actually embedded on the page.
- ❌ Soften or drop a drug contraindication that appears in the doc.
