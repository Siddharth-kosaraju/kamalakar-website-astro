# SEO Review & 1-Week Execution Plan — 26 April 2026

**Source data:** Google Search Console export, last 90 days (2026-01-23 → 2026-04-22).
**Site:** https://kamalakarheartcentre.com
**Author:** Siddharth Kosaraju

> 📊 **Live status dashboard:** see [§ 0 Status — current as of 27 April 2026](#0-status--current-as-of-27-april-2026) below. The original plan is preserved unchanged from §1 onward.

---

## 0. Status — current as of 27 April 2026

### Status legend

| Badge | Meaning |
|---|---|
| ✅ DONE | Shipped to production and verified live. |
| ↩️ REVERTED | Was shipped, then removed/rolled back (factual correction). |
| 🟦 IN PROGRESS | Started, partially shipped. |
| 🟧 OPEN | Not started, planned. |
| ⏸ DEFERRED | In scope but explicitly later (Phase 2/3 backlog). |
| 👤 NEEDS USER | Code-side complete but a human action outside the repo is required (GSC, GBP, etc). |
| 🔁 RECURRING | Ongoing cadence (monthly/quarterly). |

### Phase 1 (week of 27 April – 3 May) — **COMPLETE**

P0 shipped Sun 26 Apr; P1 + AEO improvements shipped Mon 27 Apr — **6 days ahead of the original Sun 3 May target.**

| ID | Title | Phase | Pri | Status | Last action |
|---|---|---|---|---|---|
| US-01 | Single canonical host & scheme | P0 | P0 | ✅ DONE | 26 Apr — commit `d78d8e8` |
| US-02 | One trailing-slash convention site-wide | P0 | P0 | ✅ DONE | 26 Apr — `d78d8e8` |
| US-03 | Strip indexable query-string variants of homepage | P0 | P0 | ✅ DONE | 26 Apr — `d78d8e8` |
| US-04 | Rewrite homepage title & meta | P1 | P1 | ✅ DONE | 27 Apr — `80e4e9b` |
| US-05 | Rewrite title/meta on top 4 pages | P1 | P1 | ✅ DONE | 27 Apr — `80e4e9b` |
| US-06 | New `/services/diagnostics-pricing/` page | P1 | P1 | ✅ DONE | 27 Apr — `80e4e9b` |
| US-07 | New `/services/eecp/` page | P1 | P1 | ↩️ REVERTED | Shipped 27 Apr (`80e4e9b`); removed same day after user clarified Dr Kamalakar does NOT offer EECP. CF function 301s `/services/eecp/*` → `/services/`. See US-36. |
| US-08 | Reviews block + `AggregateRating` schema | P1 | P1 | ✅ DONE | 27 Apr — `80e4e9b` |
| US-09 | `FAQPage` schema on top service pages | P1 | P1 | ✅ DONE | 27 Apr — `80e4e9b` (already in production for service pages, now also on EECP + pricing) |
| US-10 | Connected `Physician` ↔ `MedicalClinic` ↔ `MedicalProcedure` JSON-LD graph | P1 | P1 | ✅ DONE | 27 Apr — `80e4e9b` + `94822b5` (extended to doctor-profile blog posts) |
| US-11 | Sitemap & robots regenerated on every change | P0 | P0 | ✅ DONE | 26 Apr — `d78d8e8` (build-time canonical verifier `scripts/verify-canonicals.mjs`) |
| US-12 | Verification & re-submission | P0 | P0 | 🟦 IN PROGRESS · 👤 NEEDS USER | Site-side verified live; GSC sitemap re-submit + URL Inspection still pending (see §0.5 below) |

### Phase 2 (May, weeks 2–4) — **all 🟧 OPEN**

| ID | Title | Pri | Status | Notes |
|---|---|---|---|---|
| US-13 | Pillar page targeting "best cardiologist in guntur" (or homepage H1 stack rework) | P2 | 🟧 OPEN | Highest CTR upside left in the plan — 40-impression query stuck at pos 19 |
| US-14 | Author profile page `/team/dr-kamalakar/` (full E-E-A-T) | P2 | 🟧 OPEN | Consolidates credentials in one URL distinct from `/about/` |
| US-15 | Telugu translation of top 4 service pages + about | P2 | 🟧 OPEN | If we ship this, **remove the `/te/*` 301 in the CF function FIRST** (encoded in CLAUDE.md) |
| US-16 | "Medically reviewed by" line + last-reviewed date on every blog post | P2 | 🟦 IN PROGRESS | `article:modified_time` already shipped 27 Apr (`a23d419`); the visible "Medically reviewed by Dr Kamalakar — last reviewed [date]" UI line is still TODO |
| US-17 | Internal-linking pass across blog posts → pillar pages (3 topical clusters) | P2 | 🟧 OPEN | Depends on US-13 landing first |

### Phase 3 (June onwards — agentic / off-site) — **🟧 OPEN / 🔁 RECURRING / 👤 NEEDS USER**

| ID | Title | Pri | Status | Notes |
|---|---|---|---|---|
| US-18 | Refresh `llms.txt` with pointers to highest-authority pages | P3 | 🟧 OPEN | Existing `/llms.txt` and `/.well-known/llms.txt` ship from 27 Apr (`a23d419`) — content not yet updated to reflect the new pricing/EECP pages |
| US-19 | Off-site NAP consistency: Practo, JustDial, Lybrate, Google Business | P3 | 👤 NEEDS USER | SERP scan during keyword research showed aggregators dominate — winning on these depends on profile completeness |
| US-20 | Wikidata entry for the clinic | P3 | 🟧 OPEN | Strong agentic-search lift; takes 1–2 weeks for Wikidata review |
| US-21 | Quarterly AI-mention audit (ChatGPT / Perplexity / Gemini / Google AI Overviews) for top 20 GSC queries | P3 | 🔁 RECURRING | First run: end Q2 2026 (≈ 30 June 2026) |
| US-22 | Monthly GSC export diff vs the 27 Apr baseline | P3 | 🔁 RECURRING | First run: end May 2026 |

### Items discovered post-plan (numbered US-23+)

| ID | Title | Pri | Status | Last action |
|---|---|---|---|---|
| US-23 | robots.txt full 9-AI-bot allowlist (added OAI-SearchBot, anthropic-ai, Bytespider, CCBot) | P1 | ✅ DONE | 27 Apr — `a23d419` |
| US-24 | RSS feed (`/feed.xml`) + `<link rel="alternate">` discovery on every page | P1 | ✅ DONE | 27 Apr — `a23d419` |
| US-25 | Mirror `llms.txt` and `llms-full.txt` to `/.well-known/` | P2 | ✅ DONE | 27 Apr — `a23d419` |
| US-26 | `article:modified_time` on every blog post (computed from git lastmod at build time) | P1 | ✅ DONE | 27 Apr — `a23d419` |
| US-27 | Drift-proof author byline (single `<AuthorByline />` component, year computed from `START_YEAR=2015`) — replaces hand-written HTML in 5 markdown posts | P1 | ✅ DONE | 27 Apr — `b2403de` |
| US-28 | Brand-DNA refresh from authoritative facts: NTR Univ degrees, Osmania residency, AP MC #57814, 3,000+ angiograms, 1,000+ angioplasty; remove "Assistant Professor" claim | P0 | ✅ DONE | 27 Apr — `b2403de` (content) + `80e4e9b` (Physician schema) |
| US-29 | Inline full Physician schema on doctor-profile blog posts (was previously only on home + about) | P1 | ✅ DONE | 27 Apr — `94822b5` (after Rich Results Test surfaced the gap) |
| US-30 | Replace unsourced "60% early diagnosis" claim with sourced WHO 80%-preventable claim (×2 in best-heart-specialist post) | P0 | ✅ DONE | 27 Apr — `b2403de` |
| US-31 | Resolve AHA screening-age contradiction in dr-kamalakar post (was "over 35" in one paragraph and "age 20" in another) | P0 | ✅ DONE | 27 Apr — `b2403de` |
| US-32 | Add external citation links to verified primary sources (ICMR-INDIAB, INTERHEART, EHJ heat meta-analysis, Lancet Regional Health, WHO CVDs fact sheet, AHA prevention guidelines) | P1 | 🟦 IN PROGRESS | 27 Apr — `b2403de`. Done: 6 posts now carry 3–6 citation links each. **Still missing**: AHA McSweeney *Circulation* 2003 link for the 70% women fatigue claim; AHA brisk-walking 35% link; remaining "Indian Heart Journal (2024)" attribution in `understanding-heart-attack-warning-signs.md` (line 16) — see below |
| US-33 | About page word count (currently 374) → 500+ for AEO depth signal | P3 | ⏸ DEFERRED | Below the 250 floor → fine. Above 500 is "ideal" per AEO skill — content addition, not urgent |
| US-34 | `aws_deploy.sh` runtime upgrade `cloudfront-js-1.0` → `cloudfront-js-2.0` | P3 | ⏸ DEFERRED | Only matters if `infra` mode is re-run. Live function already on `2.0` since 26 Apr |
| US-35 | Pre-existing uncommitted modifications in `src/content.config.ts` and `src/pages/contact.astro` (in repo since before this session, never staged) | — | 👤 NEEDS USER | Not my work — your in-progress changes. Decide to keep / commit / discard |
| US-36 | Remove EECP page + all references (yaml, schema `knowsAbout`, route registration, homepage Additional Resources card, keywords.csv); add CF 301 `/services/eecp/*` → `/services/`; lock guard in CLAUDE.md and project memory | P0 | 🟦 IN PROGRESS | 27 Apr — code committed; CF function publish + post-deploy 301 verification still in this commit cycle |

### Manual actions outside the repo (👤 NEEDS USER)

| # | Action | When | Why |
|---|---|---|---|
| M1 | Re-submit `https://kamalakarheartcentre.com/sitemap.xml` in Google Search Console | This week | Closes US-12. Sitemap now has 22 URLs (vs 16 before) and `feed.xml` Sitemap entry — Google needs a nudge to recrawl. |
| M2 | GSC URL Inspection on 5 previously-duplicated URLs: `/services/ecg-echo` (no slash), `/services/hypertension-cholesterol` (no slash), `/te/`, `/?page=education`, `http://kamalakarheartcentre.com/` | This week | Confirm Google sees the canonical consolidation from US-01/02/03. |
| M3 | Re-test `/blog/dr-kamalakar-kosaraju-cardiologist-in-guntur/` in [Rich Results Test](https://search.google.com/test/rich-results) | After 27 Apr deploy propagates (~1–4 hours) | Confirm Physician schema now shows up (closes the issue you raised on commit `94822b5`) |
| M4 | Rich Results Test on `/services/diagnostics-pricing/` | This week | Confirm OfferCatalog with 7 priced items validates |
| M5 | Lighthouse mobile run on `/`, `/services/`, `/about/`, `/services/ecg-echo/` | This week | Capture post-P1 baseline (target: SEO ≥ 95, Perf ≥ 90) |
| M6 | Confirm or correct two facts in CLAUDE.md before US-13 / US-14 ship: any awards / fellowships not yet listed? Hospital affiliations beyond Life Hospital? | Before US-14 | Author profile page wants the most complete E-E-A-T story |
| M7 | Off-site profile audit: Practo, JustDial, Lybrate, Google Business — confirm NAP consistency with the canonical address; encourage Google reviews | Phase 3 | US-19 — biggest off-site lever for "best cardiologist in guntur" |
| M8 | First quarterly AI-mention audit | end Q2 2026 (≈ 30 June) | US-21 — log citation rate across ChatGPT/Perplexity/Gemini for top 20 GSC queries |
| M9 | First monthly GSC export diff | end May 2026 | US-22 — measure CTR delta on rewritten metas + new page traction |

### Open citation work (US-32 sub-tasks)

These are the warning-level items from the content audit that haven't been linked yet. Smaller, lower-priority than the critical fixes — flagged so we don't lose them.

| # | Article | Claim | Action |
|---|---|---|---|
| C1 | `7-warning-signs-heart-attack-never-ignore.md` (line 84 & 161) | "AHA: over 70% of women reported unusual fatigue weeks before their heart attack" | Add `[McSweeney et al., *Circulation*, 2003](https://www.ahajournals.org/doi/10.1161/01.CIR.0000097116.29625.7C)` |
| C2 | Same post (line 146) | "Brisk walking reduces heart attack risk by up to 35% (AHA)" | Add link to AHA's "Why is walking the most popular form of exercise" or NEJM 2002 Manson study |
| C3 | `understanding-heart-attack-warning-signs.md` (line 16) | "claiming over 28 lakh lives annually" — currently unlinked | Add link to Lancet GBD India profile / WHO India CVD profile |
| C4 | `understanding-heart-attack-warning-signs.md` (line 13 & 16) | "Indians develop heart disease nearly a decade earlier" — needs primary source | Same INTERHEART link used in `7-warning-signs` post |

### Snapshot — count of items by status

| Status | Count | Stories |
|---|---|---|
| ✅ DONE | 18 | US-01–06, US-08–11, US-23–31 |
| ↩️ REVERTED | 1 | US-07 (EECP — Dr Kamalakar does not offer it) |
| 🟦 IN PROGRESS | 4 | US-12, US-16, US-32, US-36 |
| 🟧 OPEN | 6 | US-13, 14, 15, 17, 18, 20 |
| ⏸ DEFERRED | 2 | US-33, US-34 |
| 👤 NEEDS USER | 11 | US-19 + 9 manual actions M1–M9 + US-35 |
| 🔁 RECURRING | 2 | US-21, US-22 |

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
