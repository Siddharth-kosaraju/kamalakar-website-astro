# SEO Review & 1-Week Execution Plan — 26 April 2026

**Source data:** Google Search Console export, last 90 days (2026-01-23 → 2026-04-22).
**Site:** https://kamalakarheartcentre.com
**Author:** Siddharth Kosaraju

---

## 1. Snapshot of where we are

- 61 clicks / ~1,100 impressions / avg position **9.2** (page-1/page-2 boundary).
- 94% of impressions from India; brand + "guntur" geo modifiers dominate.
- Mobile = 75% of impressions, but only 4.66% CTR vs desktop 8.42% — mobile under-converts.
- Top page = `/` (879 imp, 5.23% CTR). `/services/` ranks well (pos 5.6) but converts at only 1.32% CTR.
- HTTP variant, trailing-slash variants, and `?page=…&lang=…` query variants are **all indexed separately** — link equity is being split.

### High-intent demand we are leaking
| Query | Impr | Pos | Clicks | Root cause |
|---|---|---|---|---|
| heart specialist in guntur | 22 | 5.7 | 0 | Title/meta CTR failure |
| echo and tmt test price | 24 | 66 | 0 | No pricing page exists |
| cardiologist in guntur | 14 | 17.6 | 0 | Stuck on page 2 |
| best cardiologist in guntur | 40 | 19.4 | 1 | Stuck on page 2 |
| 2d echo test cost in guntur | 8 | 12.3 | 0 | No pricing content |
| eecp treatment in guntur | 1 | 15 | 0 | No `/services/eecp` page |
| kamalakar hospital reviews | 3 | 11 | 0 | No reviews page |

---

## 2. Compressed 1-week execution plan

The full multi-month strategy is preserved at the bottom of this document. The block below is what we commit to ship in **week of 27 April – 3 May 2026**.

### Day-by-day

| Day | Focus | Deliverable |
|---|---|---|
| Mon 27 Apr | Technical hygiene — canonicals, redirects, trailing slash | US-01, US-02, US-03 |
| Tue 28 Apr | CTR rescue — titles & meta on top 4 pages | US-04, US-05 |
| Wed 29 Apr | New page: diagnostics pricing | US-06 |
| Thu 30 Apr | New page: EECP service + reviews block | US-07, US-08 |
| Fri 1 May | FAQ schema + `Physician`/`MedicalClinic` JSON-LD upgrade | US-09, US-10 |
| Sat 2 May | Sitemap + robots regeneration + GSC re-submit | US-11 |
| Sun 3 May | Verification: Lighthouse, Rich Results test, GSC URL inspection | US-12 |

**Definition of done for the week:**
1. Every indexed URL resolves to exactly one canonical (host, scheme, trailing-slash, query-string).
2. `/services/` and `/about/` SERP snippets rewritten — measured CTR delta over the following 14 days.
3. Two new high-intent pages live: pricing + EECP.
4. Sitemap regenerated, robots.txt reviewed, GSC re-pinged.
5. No regressions in Lighthouse (mobile ≥ 90 perf, ≥ 95 SEO).

---

## 3. Book of work — user stories

Stories are grouped by execution phase. **Phase 1 = this week.** Phase 2 and 3 are scheduled into May/June and listed here so the backlog is one document.

Priority key:
- **P0** — must ship this week, blocks other work or fixes a leak.
- **P1** — ships this week, high impact.
- **P2** — next 2–4 weeks.
- **P3** — longer-term / agentic-search work.

---

### Phase 1 — Website-changeable, this week (P0/P1)

These are all things we control by editing this repo. Prioritised first per your instruction.

#### US-01 — Single canonical host & scheme   [P0]
> As a search engine, I want one authoritative URL per page so I do not split ranking signals between `http://`, `https://`, `www`, and non-`www` versions.

**Acceptance criteria**
- All `http://kamalakarheartcentre.com/*` requests 301 → `https://kamalakarheartcentre.com/*` at the CloudFront / origin layer.
- Every page emits `<link rel="canonical" href="https://kamalakarheartcentre.com{pathname}">` via `src/components/SEO.astro`.
- No page emits a canonical that points to a non-existent or redirected URL.
- Verified by `curl -I` on three sample pages.

**Files touched:** `cloudfront-functions/`, `src/components/SEO.astro`, every page that constructs `canonicalUrl` manually.

---

#### US-02 — One trailing-slash convention site-wide   [P0]
> As a crawler, I want `/services/ecg-echo` and `/services/ecg-echo/` to resolve to the same canonical URL so duplicate impressions stop appearing in Search Console.

**Acceptance criteria**
- `astro.config.mjs` sets `trailingSlash: 'always'` (default for static hosting on CloudFront — matches the URLs already in GSC like `/about/`, `/services/`, `/contact/`).
- A CloudFront function or origin rule 301s the no-slash variant to the slash variant for non-asset paths.
- All internal links (`<a href>`, sitemap entries, schema URLs, breadcrumbs) updated to the canonical form.
- `npm run build && grep -r 'href="/services/ecg-echo"' dist/` returns 0 hits.

**Files touched:** `astro.config.mjs`, `cloudfront-functions/`, `scripts/generate-sitemap.mjs`, internal link refs across `src/`.

---

#### US-03 — Strip indexable query-string variants of the homepage   [P0]
> As a search engine, I want `/?page=education`, `/?lang=te`, `/?page=education&lang=en`, `/?page=education&lang=te` to all canonicalise to a single primary URL so they stop being indexed as duplicates of `/`.

**Acceptance criteria**
- Homepage emits `<link rel="canonical" href="https://kamalakarheartcentre.com/">` regardless of query string.
- The `?page=education` legacy pattern 301s to `/education/` (page already exists).
- The `?lang=te` legacy pattern 301s to `/te/`.
- Sitemap contains zero query-string URLs.
- Verified in GSC URL inspection for at least one previously-duplicated URL.

**Files touched:** `src/pages/index.astro`, `cloudfront-functions/`, `scripts/generate-sitemap.mjs`.

---

#### US-04 — Rewrite homepage `<title>` and meta description   [P1]
> As a Guntur patient searching for "best cardiologist in guntur", I want the SERP snippet to clearly identify Dr Kamalakar's specialism, location, and experience so I click through.

**Acceptance criteria**
- Title ≤ 60 chars, leads with "Dr Kamalakar Kosaraju" + role + city.
- Description ≤ 155 chars, includes credentials (DM Cardiology), 30+ yrs experience, key services, Guntur.
- Meta refreshed in `src/content/site/en.yaml` and the Telugu equivalent.
- Sitemap `lastmod` updated (auto via existing build script).

**Files touched:** `src/content/site/en.yaml`, `src/content/site/te.yaml` (if exists), `src/pages/index.astro` if hardcoded.

---

#### US-05 — Rewrite `<title>` and meta on `/services/`, `/about/`, `/services/ecg-echo/`, `/services/hypertension-cholesterol/`   [P1]
> As a search-engine user, I want each landing page to promise a clearly differentiated answer in the SERP so I click on the right one.

**Acceptance criteria**
- `/services/` description names the actual procedures (Angioplasty, ECG/Echo, Pacemaker, EECP, BP/Cholesterol management).
- `/about/` title leads with credentials, links to author E-E-A-T story.
- `/services/ecg-echo/` includes the words "cost", "price", "Guntur" in the description (this query class is high-intent and we currently get 0% CTR on it).
- `/services/hypertension-cholesterol/` title + description recover its current 0% CTR at pos 5.

**Files touched:** `src/content/services/*.yaml`, `src/pages/services/[slug].astro`.

---

#### US-06 — New page: `/services/diagnostics-pricing/`   [P1]
> As a patient comparing test costs, I want a single page that lists ECG, 2D Echo, TMT, Holter, and angiogram pricing at Kamalakar Heart Centre so I can decide before visiting.

**Acceptance criteria**
- Live at `/services/diagnostics-pricing/`.
- Targets queries: `echo and tmt test price`, `2d echo test cost in guntur`, `echo tmt test price`, `angiogram cost in guntur`.
- Includes structured data: `MedicalProcedure` for each test + `PriceSpecification`.
- Linked from `/services/`, `/services/ecg-echo/`, homepage services grid.
- Internal nav: breadcrumb, prev/next.
- Sitemap regenerated (US-11).

**Files touched:** new `src/pages/services/diagnostics-pricing.astro` (or new `src/content/services/diagnostics-pricing.yaml` if using the existing `[slug].astro` pattern), `src/content/site/en.yaml` nav, `scripts/generate-sitemap.mjs` regenerated.

---

#### US-07 — New page: `/services/eecp/`   [P1]
> As a patient referred for EECP therapy in Guntur, I want a dedicated page describing the procedure, indications, and how to book at Kamalakar Heart Centre.

**Acceptance criteria**
- Live at `/services/eecp/`.
- Targets `eecp treatment in guntur` (currently pos 15 with no dedicated page).
- Uses the existing `[slug].astro` template by adding an `eecp.yaml` content entry.
- Linked from `/services/`, related-services block on `/services/heart-failure/`.

**Files touched:** new `src/content/services/eecp.yaml`, nav update.

---

#### US-08 — Reviews / testimonials block on homepage and `/about/`   [P1]
> As a prospective patient, I want to see real reviews so I trust the clinic before booking.

**Acceptance criteria**
- Reviews block visible on homepage and `/about/`.
- Markup uses `Review` items + `AggregateRating` on the `MedicalClinic` schema.
- Targets the `kamalakar hospital reviews` query.
- Source: at least 5 verifiable Google Business reviews quoted.

**Files touched:** `src/components/Reviews.astro` (new), `src/utils/schemas.ts`, page templates.

---

#### US-09 — FAQ schema on top service pages   [P1]
> As a search engine, I want structured FAQ Q&A on service pages so I can render rich results that lift CTR.

**Acceptance criteria**
- 4–6 FAQs on `/services/ecg-echo/`, `/services/hypertension-cholesterol/`, `/services/diagnostics-pricing/`, `/services/eecp/`.
- Marked up as `FAQPage` JSON-LD via `src/utils/schemas.ts`.
- Validates in Google Rich Results Test.
- Each answer ≤ 300 chars (LLM-extraction friendly).

**Files touched:** `src/utils/schemas.ts`, service yaml content, page templates.

---

#### US-10 — Upgrade site JSON-LD graph: `Physician` + `MedicalClinic` + `MedicalProcedure`   [P1]
> As an LLM grounding answer, I want one connected JSON-LD graph that ties Dr Kamalakar to the clinic and to each service so I can cite the site reliably.

**Acceptance criteria**
- Single JSON-LD graph using `@id` references: `Physician` → `worksFor` → `MedicalClinic` → `availableService` → `MedicalProcedure`.
- Author/byline on every blog post links to the `Physician` `@id`.
- `Physician` includes degrees, council registration, years of experience.
- Validates in Schema.org validator and Google Rich Results Test.

**Files touched:** `src/utils/schemas.ts`, layout templates, blog post template.

---

#### US-11 — Sitemap & robots.txt always rebuilt on content / route changes   [P0]
> As an operator, I want the sitemap and robots.txt to be regenerated automatically whenever a page is added, removed, renamed, or redirected so search engines never see a stale URL list.

**Acceptance criteria**
- `npm run build` invokes `scripts/generate-sitemap.mjs` (already exists) and the script output is part of the CI build artefact.
- The script reads pages and content collections — confirmed it picks up `diagnostics-pricing` and `eecp` automatically once US-06/07 ship.
- `public/robots.txt` reviewed: contains exactly one `Sitemap:` directive, points to the canonical HTTPS sitemap URL, and lists the AI crawlers (already done).
- A short note added to `CLAUDE.md` and to the `deploy-verify` skill so this becomes a permanent pre-deploy gate: **"if you added/renamed/removed a page, rebuild sitemap and re-verify robots before deploying."**
- Post-deploy: GSC `Sitemaps` page shows the new sitemap successfully fetched.

**Files touched:** `package.json` (ensure `build` runs sitemap script), `scripts/generate-sitemap.mjs`, `public/robots.txt`, `CLAUDE.md`, `.claude/skills/deploy-verify/*` (if applicable).

---

#### US-12 — Verification & re-submission   [P0]
> As an SEO owner, I want post-deploy verification so I know the canonical, schema, and sitemap changes actually took effect.

**Acceptance criteria**
- Lighthouse mobile run on `/`, `/services/`, `/about/`, `/services/ecg-echo/`: SEO ≥ 95, Perf ≥ 90.
- Rich Results Test passes on home, services, blog, new pricing & EECP pages.
- GSC: sitemap re-submitted, "URL Inspection" run for 3 previously-duplicated URLs to confirm canonical consolidation.
- Result captured in `SEO optimisation/26th April Review — verification.md` (created end of week).

**Files touched:** none (verification only). New report file at end of week.

---

### Phase 2 — Content gaps (May, weeks 2–4) — P2

Stories listed for backlog visibility. Deferred until Phase 1 lands.

- **US-13** — Pillar page `/best-cardiologist-in-guntur/` (or homepage H1 stack rework) targeting the 40-impression query stuck at pos 19.
- **US-14** — Author profile page `/team/dr-kamalakar/` with full E-E-A-T (degrees, registration #, fellowships, papers, hospital affiliations, photos).
- **US-15** — Telugu translation of top 4 service pages + about, linked from `/te/`.
- **US-16** — "Medically reviewed by" line + last-reviewed date on every blog post.
- **US-17** — Internal-linking pass across blog posts → pillar pages (3 topical clusters: interventional, diagnostics, chronic conditions).

### Phase 3 — Agentic / LLM search (June onwards) — P3

- **US-18** — Add `llms.txt` pointers to highest-authority pages (file already exists; refresh it once new pages ship).
- **US-19** — Off-site NAP consistency: Practo, JustDial, Lybrate, Google Business — all match exactly.
- **US-20** — Wikidata entry for the clinic.
- **US-21** — Quarterly AI-mention audit: query ChatGPT, Perplexity, Gemini, Google AI Overviews for the top 20 GSC queries; log citation rate. Owner: SK. First run: end Q2 2026.
- **US-22** — Monthly GSC export diff vs this baseline so we can attribute lift to specific changes.

---

## 4. Requirements consolidated — what changes on the website (priority order)

This is the single list to drive the week. **Higher = ship first.**

| # | Requirement | Story | Priority | Repo area |
|---|---|---|---|---|
| 1 | All HTTP traffic 301s to HTTPS | US-01 | P0 | `cloudfront-functions/` |
| 2 | One trailing-slash convention enforced | US-02 | P0 | `astro.config.mjs`, CloudFront, sitemap |
| 3 | Homepage canonicalises away `?page=…` and `?lang=…` variants | US-03 | P0 | `src/pages/index.astro`, CloudFront |
| 4 | `<link rel="canonical">` present and correct on every page (already wired through `SEO.astro` — verify all pages pass it) | US-01 | P0 | `src/components/SEO.astro` + every page using it |
| 5 | Sitemap regenerated on every build; robots.txt reviewed | US-11 | P0 | `scripts/generate-sitemap.mjs`, `package.json`, `public/robots.txt` |
| 6 | Homepage title + meta rewritten | US-04 | P1 | `src/content/site/en.yaml` |
| 7 | `/services/`, `/about/`, `/services/ecg-echo/`, `/services/hypertension-cholesterol/` titles + metas rewritten | US-05 | P1 | content yamls |
| 8 | New `/services/diagnostics-pricing/` page with `MedicalProcedure` + `PriceSpecification` schema | US-06 | P1 | `src/content/services/`, sitemap |
| 9 | New `/services/eecp/` page | US-07 | P1 | `src/content/services/`, sitemap |
| 10 | Reviews block + `AggregateRating` schema | US-08 | P1 | `src/components/`, `src/utils/schemas.ts` |
| 11 | `FAQPage` schema on 4 service pages | US-09 | P1 | `src/utils/schemas.ts`, content |
| 12 | One connected JSON-LD graph: `Physician` ↔ `MedicalClinic` ↔ `MedicalProcedure` | US-10 | P1 | `src/utils/schemas.ts` |
| 13 | Verification: Lighthouse + Rich Results + GSC re-submit | US-12 | P0 | none (verification) |

---

## 5. Canonical-tag policy (must hold for every page going forward)

This is the rule the site must obey from this week onward, enforced via `src/components/SEO.astro`:

1. **Every page** emits exactly one `<link rel="canonical">`.
2. The canonical URL is **absolute**, **HTTPS**, **bare domain (no `www.`)**, and uses the site's **chosen trailing-slash convention** (`always`, per US-02).
3. The canonical **never includes a query string** unless the query string is the page's defining identifier (no current page on this site qualifies).
4. Localised pages (`/te/...`) canonicalise to themselves and add `<link rel="alternate" hreflang="te">` and `<link rel="alternate" hreflang="en">` cross-references.
5. Paginated or filterable pages (none today, but future-proof): canonical points to the unfiltered base URL.
6. `og:url` matches the canonical exactly.
7. Verified at build time: a script (or manual checklist) that crawls `dist/` and asserts every `*.html` has a canonical tag whose URL resolves to itself.

---

## 6. Sitemap & robots policy (must hold from this week onward)

1. **`npm run build` always regenerates the sitemap.** No manual sitemap edits.
2. The sitemap script is the single source of truth for indexable URLs — it reads from Astro pages + content collections, so any new `/services/*.yaml` or new `src/pages/*.astro` automatically appears.
3. After **any** of the following, sitemap and robots are reviewed before deploy:
   - new page added
   - existing page renamed or path changed
   - page removed or 301-redirected
   - canonical convention changed
4. `public/robots.txt` is treated as code. Diff it on every PR. Exactly one `Sitemap:` line, pointing to `https://kamalakarheartcentre.com/sitemap.xml`.
5. Post-deploy: hit `/sitemap.xml` and `/robots.txt` over HTTPS, confirm 200, then re-submit sitemap in GSC.
6. This rule is captured permanently in `CLAUDE.md` and the `deploy-verify` skill so future sessions cannot forget it.

---

## 7. Reference — full multi-month strategy (preserved)

The longer-horizon plan from the 26 April analysis is preserved here for backlog continuity. Phase 2 and 3 user stories above (US-13 through US-22) implement it.

**Pillars for topical authority (Q2–Q3 2026):**
1. Interventional cardiology (angioplasty / stents / angiogram) — pillar + 6 supporting articles.
2. Diagnostics & costs (ECG / Echo / TMT / Holter — with prices) — pillar + 4 articles.
3. Chronic conditions (hypertension / cholesterol / heart failure) — pillar + 6 articles.

**Agentic-search readiness:**
- E-E-A-T at the document level — author profile, medically-reviewed-by, last-reviewed dates.
- One connected `Physician`/`MedicalClinic`/`MedicalProcedure` JSON-LD graph (US-10).
- Short, factual TL;DR paragraphs at the top of every clinical page (≤60 words) — what LLMs lift verbatim.
- `FAQPage` blocks with ≤300-char answers.
- `llms.txt` updated as new authoritative pages ship.
- Off-site NAP consistency on Practo / JustDial / Lybrate / Google Business; encourage Google reviews.
- Wikidata entry for the clinic if/when notable.

**Measurement cadence:**
- Monthly: re-export GSC, diff against this baseline.
- Quarterly: AI-mention audit across ChatGPT / Perplexity / Gemini / Google AI Overviews for the top 20 GSC queries.
