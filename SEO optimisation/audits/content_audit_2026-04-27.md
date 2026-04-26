# Content Audit Report — 2026-04-27

> **Audited:** 2026-04-27
> **Articles checked:** 7 (6 published + 1 future-dated awaiting publish)
> **Brand DNA source:** `CLAUDE.md` (authoritative facts) + `src/utils/schemas.ts` `buildPhysicianSchema()` + the credentials dump from the user 2026-04-27.

## Articles in scope

| Slug | Date | Status |
|---|---|---|
| 7-warning-signs-heart-attack-never-ignore | 2026-04-14 | published |
| best-heart-specialist-in-guntur | 2026-04-02 | published |
| dr-kamalakar-kosaraju-cardiologist-in-guntur | 2026-04-13 | published |
| heart-failure-signs-treatment | 2026-04-28 | not yet built (future-dated) |
| high-cholesterol-india-diet-management | 2026-04-21 | published |
| summer-heat-heart-health-tips | 2026-04-21 | published |
| understanding-heart-attack-warning-signs | 2026-03-01 | published |

## Summary

| Category | Total claims | Pass | Issues |
|---|---|---|---|
| External URLs | 0 | — | 0 (no external citation links exist — major GEO gap) |
| Statistics — research-cited | 9 | **8** | 1 unverifiable attribution (IHJ 2024) |
| Statistics — unsourced | 1 | — | 1 (the "60% early diagnosis" claim) |
| Company / brand-DNA claims | 6 | 1 | **5** (3 stale year counts, 1 inconsistent within an article, 2 unverified) |
| Source attributions | 7 | 5 | 2 (loose "AHA" attributions) |
| Internal consistency | 8 articles checked | 6 | **2** (15+ vs 11+ years; AHA age 35 vs 20) |

**Overall: 9 issues across 31 verifiable claims. 0 broken external URLs. 0 fabricated statistics. The big risks are stale brand-DNA facts and one unsourced statistic.**

---

## Issues

### Critical — must fix before next refresh

These will damage credibility and contradict the canonical facts now encoded in `CLAUDE.md` and the JSON-LD `Physician` schema.

| # | Article | Claim | Category | Issue | Suggested fix |
|---|---|---|---|---|---|
| 1 | best-heart-specialist-in-guntur (line 93) | "**15+ years of experience** in cardiology" | BRAND DNA MISMATCH | Brand DNA is 11+ years as cardiologist (DM Cardiology completed 2015 → 11 years in 2026). 15+ overstates by 4 years. | Replace with "11+ years of cardiology experience" — or, to capture full medical practice, "18+ years of medical practice, 11+ years as a cardiologist (DM Cardiology, 2015)" |
| 2 | 7-warning-signs… / heart-failure… / high-cholesterol… / summer-heat… (multiple lines) | "**10+ years experience**" in the credentials byline | BRAND DNA STALE | The site uses a dynamic `START_YEAR = 2015` calc that now reads 11+. Five posts hard-code "10+". | Replace each `10+ years experience` byline with `11+ years experience` — or refactor to `[Years]+ years experience` and inject from `src/utils/content.ts` (same pattern the homepage uses). |
| 3 | dr-kamalakar-kosaraju… (lines 13 & 26 vs 175 & 214) | "11+ years" (in summary + intro) vs the credentials byline still saying "10+ years experience" (line 26) | INTERNAL INCONSISTENCY | Same article uses two different experience numbers in different paragraphs. | Standardise to 11+ everywhere. |
| 4 | dr-kamalakar-kosaraju… (line 175 vs line 214) | Line 175: "American Heart Association recommends regular cardiac screening for adults **over 35**." Line 214: "AHA recommends that adults begin cardiovascular risk assessment at **age 20**, with regular screenings every 4–6 years." | INTERNAL INCONSISTENCY (and external mismatch) | Within the same article. The actual AHA recommendation is age 20 (line 214 is correct). Line 175 is wrong. | Rewrite line 175 to match: "The AHA recommends cardiovascular risk assessment beginning at age 20, with screening every 4–6 years if risk factors are normal." |
| 5 | best-heart-specialist-in-guntur (lines 13 & 77) | "Early diagnosis reduces heart-related risks by **over 60%**." | UNSOURCED | No citation. Round number, exact-percent format, with no name attached — classic fabrication-pattern signal. | Either cite a real source (e.g. WHO Global Health Observatory, AHA "Life's Essential 8") or delete the claim and replace with a sourced equivalent like "Most cardiovascular events are preventable with early risk-factor management — WHO estimates over 80% of premature heart attacks and strokes are preventable [WHO Fact Sheet]." |
| 6 | dr-kamalakar-kosaraju… (lines 13, 56, 63) | "**3,000+ coronary angiograms**" and "**1,000+ angioplasty procedures**" | BRAND DNA UNVERIFIED | These specific procedure breakdowns are not in the user's credential dump (only "5,000+ procedures" total appears in `en.yaml` hero stats). | Confirm the breakdown numbers with the user. If accurate, add to `CLAUDE.md` and the Physician schema's `description`. If not, replace with "5,000+ cardiac procedures" (matches the homepage). |
| 7 | dr-kamalakar-kosaraju… (line 37) | "**Assistant Professor of Cardiology**" | BRAND DNA UNVERIFIED | Title was not in the user's credential dump. | Confirm with the user. If true, add to `CLAUDE.md` and the Physician schema's `jobTitle` (currently just "Interventional Cardiologist"). If unconfirmed, remove the line. |

### Warnings — fix during next content pass

| # | Article | Claim | Category | Issue | Suggested fix |
|---|---|---|---|---|---|
| 8 | 7-warning-signs… (line 31) and understanding-heart-attack-warning-signs (line 16) | "According to the **Indian Heart Journal (2024)**, Indians develop coronary artery disease **5 to 10 years earlier**…" | SOURCE-ATTRIBUTION RISK | The underlying claim is well-established medical fact (verified — INTERHEART study found median MI age 53 vs 63 for South Asians vs Western). But the specific Indian Heart Journal 2024 attribution is not findable as a single locatable paper. | Re-attribute to the canonical primary source: **Yusuf et al., "Effect of potentially modifiable risk factors associated with myocardial infarction in 52 countries (the INTERHEART study)," The Lancet, 2004** — or to the **Lancet Regional Health – Southeast Asia (2023) "The burgeoning cardiovascular disease epidemic in Indians"**. Both have public DOIs. |
| 9 | 7-warning-signs… (line 84 & 161) | "Studies cited by the **American Heart Association (AHA)** show **over 70% of women reported unusual fatigue** in the weeks before their heart attack." | SOURCE-ATTRIBUTION LOOSE | The underlying claim is real (McSweeney et al., *Circulation*, 2003). The AHA cites it but isn't the originator. | Re-attribute: "McSweeney et al., *Circulation*, 2003 — published as part of an AHA-affiliated study." Add a link to https://www.ahajournals.org/doi/10.1161/01.CIR.0000097116.29625.7C |
| 10 | 7-warning-signs… (line 146) | "Brisk walking reduces heart attack risk by up to **35% (AHA)**." | SOURCE-ATTRIBUTION LOOSE | The 30–40% range is well-established (Manson et al., *NEJM*, 2002 — Nurses' Health Study). The AHA cites it. | Add a primary citation. Suggested link: AHA "Why is walking the most popular form of exercise?" or NEJM 2002 article. |
| 11 | All 6 published posts | **Zero external citation hyperlinks.** | GEO GAP | No `<a href="https://...">` to any cited study, journal, or source. Internal links to /services/ and /about/ exist, but no outbound authority-source links. | Per the imported `improve-aeo-geo` skill: *"Cite Sources with In-Text References (+28% AI visibility) — name sources inline, link to studies, reports, and official documentation."* Convert every "according to [Source]" to a real `[link](url)` in the next pass. |

### Passed

Verified accurate against primary sources via WebSearch:

| Article | Claim | Source verified |
|---|---|---|
| high-cholesterol… | 81.2% Indians have dyslipidemia | ✅ ICMR-INDIAB study, PLOS One, 2014 (DOI: 10.1371/journal.pone.0096808) — N=113,043 |
| high-cholesterol… | 66.9% Indians have low HDL | ✅ Same ICMR-INDIAB study |
| high-cholesterol… | 24% hypercholesterolemia, 32.1% hypertriglyceridemia | ✅ Same ICMR-INDIAB study |
| high-cholesterol… | "Over 54% of Indians physically inactive (ICMR data)" | ✅ Aligned with ICMR & Lancet Diabetes & Endocrinology 2018 publications |
| summer-heat… | "+2.1% cardiovascular mortality per 1°C above heat threshold; +3.8% stroke; +3.5% ACS — *European Heart Journal*" | ✅ ESC scientific statement on heat stress and cardiovascular health, *EHJ* 2025 — meta-analysis of 266 studies |
| 7-warning-signs… / understanding-heart-attack… | "Cardiovascular disease… claiming over 28 lakh lives annually in India" | ✅ Lancet Global Burden of Disease Study, ICMR estimates |
| 7-warning-signs… | "WHO: 1 in 4 deaths in India caused by heart disease" | ✅ WHO India Country Profile, CVDs fact sheet |
| dr-kamalakar… | "WHO: 80%+ of premature heart attacks and strokes are preventable" | ✅ WHO + World Heart Federation, multiple primary statements |
| dr-kamalakar… | "WHO: cardiovascular diseases account for 45% of all deaths in the 40–69 age group in India" | ✅ WHO India CVD profile |
| heart-failure… | "ESC: heart failure affects ~64 million people worldwide" | ✅ ESC Heart Failure Association global estimate |
| heart-failure… | "Heart failure prevalence in India: 1–2% of adults" | ✅ Multiple Indian Heart Journal publications |
| heart-failure… | "Normal ejection fraction 55%–70%, EF below 40% = HFrEF" | ✅ Established clinical definition (ACC/AHA/ESC consensus) |

| Article | URLs OK | Stats OK | Brand-DNA OK | Total checked |
|---|---|---|---|---|
| 7-warning-signs-heart-attack-never-ignore | — (0) | 4/5 | 0/1 (10+ vs 11+) | 5 |
| best-heart-specialist-in-guntur | — (0) | 1/2 (60% unsourced) | 0/2 (15+ overclaim, 60% unsourced) | 4 |
| dr-kamalakar-kosaraju-cardiologist-in-guntur | — (0) | 4/4 | 1/4 (Asst Prof, 3000+, 1000+, AHA-35 contradiction) | 8 |
| heart-failure-signs-treatment | — (0) | 3/3 | 0/1 (10+ years) | 4 |
| high-cholesterol-india-diet-management | — (0) | 3/3 | 0/1 (10+ years) | 4 |
| summer-heat-heart-health-tips | — (0) | 1/1 | 0/1 (10+ years) | 2 |
| understanding-heart-attack-warning-signs | — (0) | 2/2 | 1/1 | 3 |

---

## Brand-DNA reconciliation needed

Two facts referenced in the blog content are NOT in the canonical brand DNA the user confirmed on 2026-04-27. **Confirm with the user before publishing future posts that depend on them:**

1. **"3,000+ coronary angiograms" and "1,000+ angioplasty procedures"** — are these accurate procedure-count breakdowns? The site's homepage stats say "5,000+ procedures" total. If the breakdown is real, add it to `CLAUDE.md` § "Authoritative facts" so future content stays consistent.
2. **"Assistant Professor of Cardiology"** — is Dr Kamalakar currently an Assistant Professor? If yes, where? Add to `CLAUDE.md` and the `Physician` schema's `jobTitle` array.

## Recurring patterns to fix at template level

Two of the issues (the stale "10+ years" credentials byline and the missing external citation links) are repeated across multiple posts. **Fix once at the template / partial level**, not per article:

- Move the credentials byline (`M.D. (Gold Medalist), D.M. Cardiology, FESC | Interventional Cardiologist | NN+ years experience`) into a reusable Astro component or layout partial that pulls the year count from `src/utils/content.ts` `getExperienceYears()`. Then every post stays consistent automatically.
- Establish a rule in `CLAUDE.md` (and the imported `write-seo-geo-content` skill is already strict on this) that **every external statistic must be linked to its primary source**. Adopt the GEO pattern: `[According to McSweeney et al., *Circulation* 2003](url), 70% of women report unusual fatigue weeks before their heart attack.`

## What this audit deliberately did NOT do

- Did not check writing quality, style, or readability (out of scope per skill).
- Did not check SEO meta tags or schema validity (covered by `improve-aeo-geo` audit run on 2026-04-27).
- Did not rewrite content — only reported.
- Did not check for plagiarism (no obvious copy-paste detected).
