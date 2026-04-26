# P0 Post-Deploy Verification — 27 April 2026

**Deployed commit:** `d78d8e8` — "feat: P0 SEO canonicalisation"
**S3 sync + CloudFront invalidation:** ID `ID0PGCCXM3Q6YAQO4TXOETL1W6` (CloudFront `E3STOTV0PG9BZU`)
**CloudFront function:** `redirect-www-to-non-www` republished, ETag `E1F83G8C2ARO7P`, runtime `cloudfront-js-2.0`

All 10 verification gates passed against live production.

| # | Check | Expected | Actual | Result |
|---|---|---|---|---|
| 1a | `/te/` | 301 → `/` | 301 → `/` | ✅ |
| 1b | `/te` | 301 → `/` | 301 → `/` | ✅ |
| 1c | `/te/about` | 301 → `/` | 301 → `/` | ✅ |
| 1d | `/te/services/ecg-echo` | 301 → `/` | 301 → `/` | ✅ |
| 2a | `/services/ecg-echo` | 301 → `/services/ecg-echo/` | match | ✅ |
| 2b | `/about`, `/services`, `/blog`, `/contact` | 301 → `/...` | match | ✅ |
| 3 | Slash variant of every above | 200 | 200 | ✅ |
| 4a | `/?page=education` | 301 → `/education/` | match | ✅ |
| 4b | `/?page=about/services/contact/blog` | 301 → matching `/x/` | match | ✅ |
| 4c | `/?lang=te` and `/?lang=en` | 301 → `/` | match | ✅ |
| 5 | `/?ref=email` (unknown query) | 200, no redirect | 200 | ✅ |
| 6 | `/sitemap.xml`, `/robots.txt`, `/favicon.ico` | 200, no redirect | 200 | ✅ |
| 7 | `www.` host | 301 → bare domain | 301 | ✅ |
| 8 | `http://` | 301 → `https://` | 301 | ✅ |
| 9a | Sitemap accessible, lists all canonical URLs with trailing slash | yes | yes | ✅ |
| 9b | Robots.txt has one `Sitemap:` line at canonical URL | yes | yes | ✅ |
| 10 | Canonical tag on `/`, `/about/`, `/services/ecg-echo/`, `/blog/best-heart-specialist-in-guntur/` | self-referential, HTTPS, bare domain, trailing slash | match for all 4 | ✅ |

## Build-time gate

`npm run build` now runs `scripts/verify-canonicals.mjs` after the sitemap step. Output for this deploy:

```
[verify-canonicals] OK: 20 indexable HTML files, all canonicals valid (1 noindex page(s) skipped).
```

## Outstanding (manual) — needs your action

These are the post-deploy steps that I cannot perform from this repo:

- [ ] **Google Search Console — re-submit sitemap** at `https://kamalakarheartcentre.com/sitemap.xml`. This should trigger Google to recrawl with the new canonical signals.
- [ ] **GSC URL Inspection** for at least these previously-duplicated URLs, to confirm Google sees the consolidation:
  - `https://kamalakarheartcentre.com/services/ecg-echo` (no slash)
  - `https://kamalakarheartcentre.com/services/hypertension-cholesterol` (no slash)
  - `https://kamalakarheartcentre.com/te/`
  - `https://kamalakarheartcentre.com/?page=education`
  - `http://kamalakarheartcentre.com/`
- [ ] **GSC Sitemaps page** — confirm last fetched is post-deploy.
- [ ] (Optional) Run a **Lighthouse mobile** audit on `/`, `/services/`, `/about/`, `/services/ecg-echo/` and capture before/after for the next CTR review (target: SEO ≥ 95, Performance ≥ 90).

## Notes

- **CTR data lag**: GSC data refreshes daily but search-result snippets can take 1–4 weeks to fully reflect canonical consolidation. Re-export GSC at end-May to measure impact.
- **Cache propagation**: CloudFront edge propagation took ≤ 15s for this function update — well within the 1-2 min expected.
- **Pre-existing uncommitted changes** in `src/content.config.ts`, `src/pages/contact.astro`, `src/utils/schemas.ts` were left untouched in this commit (they're unrelated work in progress).

## What this unlocks for Phase 1 (rest of the week)

P0 work is complete. The remaining P1 stories from `26th April Review.md` can now ship without competing for the same files:

- **US-04, US-05** — title & meta rewrites on top 4 pages (Tue 28 Apr).
- **US-06** — `/services/diagnostics-pricing/` (Wed 29 Apr) — needs pricing data input.
- **US-07** — `/services/eecp/` (Thu 30 Apr).
- **US-08** — Reviews block + `AggregateRating` (Thu 30 Apr).
- **US-09** — `FAQPage` schema on 4 service pages (Fri 1 May).
- **US-10** — Connected `Physician` ↔ `MedicalClinic` ↔ `MedicalProcedure` JSON-LD graph (Fri 1 May).
