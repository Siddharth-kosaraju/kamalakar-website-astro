# P1 Post-Deploy Verification — 27 April 2026

**Deployed commit:** `80e4e9b` — "feat: P1 SEO — title/meta rewrites, EECP + pricing pages, connected JSON-LD graph"
**Build:** 23 HTML pages, 22 indexable, sitemap regenerated with 22 URLs, canonical verifier passed.
**S3 sync + CloudFront invalidation:** ran via `npm run deploy`.

## Gates passed against live production

| # | Check | Result |
|---|---|---|
| 1 | `/services/eecp/` returns 200 | ✅ |
| 2 | `/services/diagnostics-pricing/` returns 200 | ✅ |
| 3 | Homepage `<title>` rewritten ("Best Cardiologist in Guntur \| Dr Kamalakar Kosaraju, MD DM") | ✅ 58 chars |
| 4 | Homepage meta description rewritten with credentials + procedure list | ✅ 143 chars |
| 5 | Diagnostics-pricing title leads with cost intent ("ECG, Echo, TMT, Angiogram Cost in Guntur \| Kamalakar Heart Centre") | ✅ |
| 6 | EECP title targets "EECP Treatment in Guntur" | ✅ |
| 7 | Sitemap contains `diagnostics-pricing` and `eecp` URLs | ✅ |
| 8 | Homepage JSON-LD graph references three canonical `@id`s: `#website`, `#organization`, `#physician` | ✅ |
| 9 | Homepage AggregateRating: 5.0 of 5, 5 reviews (US-08) | ✅ |
| 10 | Blog post author now `Physician @id #physician` (US-10) | ✅ |
| 11 | Pricing page emits 7-item OfferCatalog (Consultation + 6 tests/procedures) with `INR` `PriceSpecification` | ✅ |
| 12 | P0 redirects still working: `/te/` → 301 → `/`, `/services/ecg-echo` → 301 → slash, `/?page=education` → 301 → `/education/` | ✅ |

## User stories shipped this commit

| Story | Title | Status | Notes |
|---|---|---|---|
| US-04 | Rewrite homepage title & meta | ✅ Done | New title 58 chars; description 143 chars naming MD/DM/FESC + key procedures |
| US-05 | Rewrite title/meta on top 4 pages | ✅ Done | Homepage, `/services/ecg-echo/` (now leads with prices), `/services/hypertension-cholesterol/`, `/about/` |
| US-06 | New `/services/diagnostics-pricing/` page | ✅ Done | Visible price prose + 7-item OfferCatalog with PriceSpecification (₹500 / ₹200 / ₹1,000 / ₹1,200 / ₹6,000 / ₹15,000 / from ₹1,10,000) |
| US-07 | New `/services/eecp/` page | ✅ Done | Targets `eecp treatment in guntur` (was pos 15 with no page) |
| US-08 | Reviews block + `AggregateRating` schema | ✅ Done | Existing 5 testimonials in `en.yaml` now wired into `buildBusinessSchema(testimonials)` → AggregateRating 5.0/5 with 5 reviews emitted on homepage |
| US-09 | `FAQPage` schema on top service pages | ✅ Done (was already in production for ecg-echo etc.; new pricing & EECP pages also emit it) |
| US-10 | Connected `Physician` ↔ `MedicalClinic` ↔ `MedicalProcedure` JSON-LD graph | ✅ Done | Single homepage graph (`buildHomepageSchemaGraph`) — `#website` → `#organization` → `#physician`. Physician schema corrected to NTR Univ degrees + Osmania residency, AP MC #57814 as `identifier`, 5 `hasCredential` entries. Blog posts now `author @id #physician`, `publisher @id #organization`. About page already used `#physician`. |

## Phase 1 of the 1-week plan is now COMPLETE

P0 (US-01, 02, 03, 11, 12) shipped 26 Apr.
P1 (US-04, 05, 06, 07, 08, 09, 10) shipped 27 Apr.

The full week's commitment from `26th April Review.md` is delivered ahead of schedule (planned: Tue–Fri).

## Outstanding (manual) — needs your action

These remain the same as after P0 — search-side actions I cannot perform from this repo:

- [ ] **Google Search Console**: re-submit `https://kamalakarheartcentre.com/sitemap.xml` (now contains 22 URLs, including `/services/eecp/` and `/services/diagnostics-pricing/`).
- [ ] **GSC URL Inspection** for the new pages — request indexing for `/services/eecp/` and `/services/diagnostics-pricing/` so Google crawls them sooner.
- [ ] **GSC Rich Results Test**:
  - Homepage: confirm AggregateRating displays + Physician + MedicalOrganization
  - Diagnostics-pricing: confirm OfferCatalog/Offers
  - EECP: confirm MedicalProcedure + FAQPage
  - Any blog post: confirm Article + reviewedBy/Physician
- [ ] (Optional) Lighthouse mobile run to capture post-P1 baseline.

## Next steps (Phase 2 backlog)

- US-13 — Pillar page targeting "best cardiologist in guntur" (40 imp, pos 19, 1 click)
- US-14 — `/team/dr-kamalakar/` profile page consolidating credentials in one E-E-A-T-rich URL
- US-15 — Telugu translation of top pages
- US-16 — "Medically reviewed by" line on every blog post
- US-17 — Internal-linking pass across blog posts → cluster pillars

CTR data for US-04/05/06/07 changes will be visible in Search Console after ~7–14 days of recrawl. Re-export GSC mid-May to measure delta vs. the 26 Apr baseline.
