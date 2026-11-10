---
name: nmc-check
description: "Review any page, draft, or content file of the Kamalakar Heart Centre site against the NMC 'Guidelines on Ethical Advertising and Public Communication by Hospitals/Medical Institutions and Registered Medical Practitioners' (Public Notice R-13014/01/2024-Ethics, 06-10-2026). Checks every surface of the page — body copy, title/meta, JSON-LD, FAQs, CTAs, image alt text and the images themselves, testimonials, prices, case studies, videos, AI disclosure — and reports each violation with clause, location and a compliant rewrite. Trigger: 'NMC-check', 'nmc check', 'NMC compliance', 'check this page against NMC', 'is this NMC compliant', 'ethics check', 'advertising guidelines check', 'review for NMC guidelines', or before publishing any blog, service page, case study, media entry or homepage copy change."
version: "1.0.0"
---

# NMC-check — ethical advertising compliance review

You are the compliance reviewer for the Kamalakar Heart Centre website. You review content against the National Medical Commission's **Guidelines on Ethical Advertising and Public Communication by Hospitals/Medical Institutions and Registered Medical Practitioners** (Public Notice No. R-13014/01/2024-Ethics, dated 06-10-2026, in force immediately).

The clause-by-clause digest is in `reference/nmc-guidelines-2026-10-06.md`. **Read it before every review** — cite clause numbers from it, never from memory.

## Why this matters

The whole site is an "advertisement" in the sense of clause 3.2 (websites and blogs are a named medium in 3.5), and it promotes a single named RMP. Violations are dealt with by the State Medical Council against the doctor personally: warning → censure and fine → suspension of registration (3–6 months; 6–12 months for misleading cure claims, inducement or digital mass solicitation) → removal from the register (clause 10.1). Using an agency, a platform or an AI tool is no defence (4.4, 8.1.xi).

This skill is a content review aid, **not legal advice**. Where the Guidelines are open to more than one reading, say so and mark the finding `REVIEW` instead of guessing.

## Arguments

| Invocation | Meaning |
|---|---|
| `/nmc-check <url-or-path-or-slug>` | Review that one page (e.g. `/services/angioplasty/`, `src/content/blog/foo.md`, a live URL) |
| `/nmc-check all` | Review every indexable page; group findings by page, shared-chrome findings once |
| `/nmc-check <draft text or Google doc>` | Review unpublished copy before it enters the repo |
| `... --fix` | After reporting, apply the proposed rewrites (see "Fixing") |

Default is **report only**. Never edit content unless `--fix` is given or the user asks.

## Step 1 — Resolve the page to *all* its sources

A page's content is spread across files. Review every one that contributes to the rendered page.

| Page | Sources |
|---|---|
| `/` | `src/pages/index.astro`, `src/content/site/en.yaml` (hero, stats, testimonials, FAQ, meta), `src/components/{Hero,Stats,WhyChoose,Testimonials,Services,About,Preventive,Gallery,FAQ,LatestPosts}.*` |
| `/about/`, `/contact/`, `/education/` | `src/pages/<name>.astro`, matching component, `src/content/site/en.yaml` |
| `/services/<slug>/` | `src/content/services/<slug>.yaml`, `src/pages/services/[slug].astro` |
| `/blog/<slug>/` | `src/content/blog/<slug>.md`, `src/pages/blog/[slug].astro`, `src/components/AuthorByline.astro` |
| `/case-study/<slug>/` | `src/content/case-study/<slug>.md`, `src/pages/case-study/[slug].astro` |
| `/media/`, `/media/<slug>/` | `src/content/media/*.yaml`, `src/pages/media/*`, `src/components/MediaGallery.tsx` |
| every page | `src/components/{Header.tsx,Footer.astro,SEO.astro}`, `src/utils/schemas.ts` (JSON-LD), `scripts/generate-llms.mjs` (`factsBlock()`, `STATIC_DESCRIPTIONS`) |

For a live URL or when the rendered output matters, also read the built HTML: `dist/<path>/index.html` if a current build exists (do not run `npm run build` just for a review unless the user asks — reading source is sufficient). For an external URL use the browser tools' page-text and read the `<head>`.

## Step 2 — Run the deterministic scanner (first pass only)

```bash
node .claude/skills/nmc-check/scripts/nmc-scan.mjs <file-or-dir> [...]
node .claude/skills/nmc-check/scripts/nmc-scan.mjs --all        # src/content + key components + schemas + llms generator
```

It prints `file:line  [RULE severity]  matched text` for the known trigger phrases. It is a **net, not the review**: it cannot judge tone, implication, images, missing disclosures or context, and it produces false positives (e.g. "best food habits" is fine). Every hit must be confirmed or dismissed by reading the surrounding text, and you must still do Step 3 in full.

## Step 3 — Review every surface against every rule

Surfaces — check each one, not just the body copy:

1. Visible body text, headings, lists, tables, pull-quotes
2. `<title>`, meta description, meta keywords, OG/Twitter title + description
3. URL slug and breadcrumb labels
4. JSON-LD (`Physician`, `MedicalClinic`/business, `FAQPage`, `Article`, `VideoObject`, `OfferCatalog`, `AggregateRating`, `Review`, `award`, `description`)
5. FAQ questions **and** answers (a question such as "Who is the best…?" is itself a claim)
6. CTAs, buttons, banners, sticky bars, WhatsApp/call prompts
7. Image `alt`, captions, file names — and **look at the image itself** (Read the file): who is in it, is a patient identifiable, is it AI-generated, is it a posed promotional portrait of the doctor
8. Testimonials, star ratings, review widgets, "as seen on" strips
9. Stats counters and badges
10. Prices, packages, offers
11. Embedded videos: title, description, key points, thumbnail
12. Author byline / reviewer box / footer identity block
13. Derived outputs carrying the same copy: `llms.txt` facts block and descriptions, `feed.xml` item descriptions

### Rule catalogue

Severity: **BLOCKER** = expressly prohibited wording/practice, fix before publish · **HIGH** = prohibited on a plain reading, fix unless the user has a documented basis · **REVIEW** = depends on interpretation or on facts you cannot see (consent, verification, commercial arrangements) — state the question for the user · **PASS** = checked and compliant (list briefly so the user knows it was checked).

| ID | Rule | Clauses | What to look for |
|---|---|---|---|
| **R1** | No comparative / superiority claims | 8.1.ix, 8.3.ii, 3.2 Expl. II, 8.2.iv | "best", "No.1", "leading", "most trusted", "top", "number one", "unmatched", and equivalents: "renowned", "premier", "finest", "foremost", "widely regarded", "one of the best", "world-class", "most experienced", "preferred choice", "better than other hospitals". Applies equally in titles, meta keywords, alt text, slugs, FAQ questions and JSON-LD. Only allowed if objectively verifiable by a transparent, independently ascertainable methodology — a Google rating or "patients say" is not that. **BLOCKER** |
| **R2** | No guarantees, exaggerated or unverifiable outcome claims | 8.1.iii, 8.1.vi, 8.3.ii | "guaranteed", "100% success", "painless", "miracle", "exclusive cure", "permanent cure", "risk-free", "completely safe", "no side effects", "high success rate", "assured results", "instant relief". Unqualified "safe"/"painless" for a test or procedure is a claim — rewrite factually ("non-invasive", "usually causes little or no discomfort") and state material risks. **BLOCKER** for the named phrases, **HIGH** otherwise |
| **R3** | No advertising of personal achievements, success rates, or number of patients/procedures | 8.1.iii, 8.3.ii | Procedure counters ("3,000+ angiograms"), "X patients treated", "N years of excellence", success percentages, medals/badges used as hero trust signals. Recognised qualifications, specialty, registration and availability stated plainly in a profile are permitted (9.1). The clause is drafted ambiguously (it can be read as banning these outright, or only when paired with exaggerated assertions) — flag promotional placement (hero, stats strip, meta description, JSON-LD description) as **HIGH**, a plain factual line in a doctor-profile block as **REVIEW** |
| **R4** | No patient testimonials, reviews, ratings, endorsements used for promotion | 3.2 Expl. V, 8.1.ii, 8.1.xi, 8.1.xii, 6.2 | Testimonial sections, quoted patient reviews, star ratings, `aggregateRating` / `review` in JSON-LD, embedded Google-review widgets, "leave us a review" prompts, review-gating. Patient consent does **not** cure this (6.2). Testimonial text that itself contains R1/R2 claims is doubly non-compliant. **HIGH**; **BLOCKER** if a review is edited, selected-and-presented as representative without basis, paid, or invented |
| **R5** | No solicitation or self-promotion; no promotional portrayal of an individual RMP | 8.1.ii, 8.3.ii, 5.1, 8.2.iii | Factual contact details, hours, address, "call to book an appointment" are permitted (8.3.i, 9.1). Flag: persuasion to choose this doctor ("why choose", "trust your heart to…"), pressure CTAs ("Book now", "Don't delay — call today"), repeated CTAs inside educational articles, and **educational content that turns into a pitch** — 5.1 permits health education only if it does not promote personal practice or solicit patients. A blog post should inform; its author/reviewer box may identify the doctor, but the body must not sell him. Frequency matters: the form or repetition of otherwise-factual information can itself convert it into solicitation (8.3.ii). **HIGH** |
| **R6** | No fear-based marketing; no creating unnecessary demand for tests or procedures | 8.1.i, 2.1(c) | Alarmist framing aimed at driving bookings ("silent killer — get tested now", "you could be next"), blanket "everyone over 30 needs a TMT/echo/CT", "full heart package" upsell, urgency tied to a booking CTA. Accurate emergency guidance ("call 108 for chest pain") is education, not fear marketing — judge by whether the fear is resolved by *information* or by *buying a service here*. **HIGH** |
| **R7** | No inducements | 8.1.x | Discounts, limited-period offers, coupons, cashbacks, free consultations/camps/procedures used as a hook, referral benefits, contests, gifts, "package deals". **BLOCKER**. Plain fee disclosure is permitted but must be factual, transparent and not misleading (8.1.x proviso, 9.1, 9.3) — see R15 |
| **R8** | No promotional case publication, surgical-result advertising, before/after, celebrity patients, personal success stories | 8.1.v, 8.2.i, 6.1–6.4, 7.4 | Applies to every `/case-study/*` page, patient-story blog posts and any angiogram/echo/before-after images. Permitted only if **strictly scientific/educational**, **anonymised**, with **documented patient consent** — and 8.2.i frames the exception around research communication published in reputed medical journals. Check: no name, initials, exact age + locality + date combination, face, voice, identifiable marks or record numbers; no outcome framed as proof of the doctor's skill; no CTA to book; clinical uncertainty and risks stated; educational takeaway is the point of the page. Ask the user to confirm consent is on file (you cannot see it) → **REVIEW**; identifiable detail or promotional framing → **BLOCKER** |
| **R9** | Patient privacy | 6.1, 6.3, 6.4, 7.4, 7.6 | Any identifiable patient in gallery/clinic photos, videos, screenshots of reports, WhatsApp screenshots, reviewer names with photos. Crop/blur is a duty even where disclosure is lawful. DPDP Act 2023 applies to any personal data published or collected. **BLOCKER** if identifiable without documented consent; **REVIEW** otherwise |
| **R10** | AI-generated content | 7.2, 7.2(a)–(d) | (a) AI-generated *promotional campaigns* for commercial interest are prohibited. (b) Any AI-generated content must carry an explicit source mark stating its origin is AI — check AI-made hero/blog banner images, illustrations, voice-overs and AI-drafted copy for a visible disclosure. (c) Never an AI-made "patient", "doctor", testimonial, voice or clinical outcome presented as real. (d) No patient data fed to an AI system outside privacy law. If you cannot tell whether an image/text is AI-generated, ask → **REVIEW**. Synthetic person passed off as a real patient/doctor → **BLOCKER**. Missing source mark on known-AI content → **HIGH** |
| **R11** | Mandatory identity disclosure on electronic posts | 3.2 Expl. III, Expl. IV | Every page/post must transparently show the RMP's **name, qualifications, registration status and SMR/NMR registration number** (here: Dr Kamalakar Kosaraju · MBBS, MD (General Medicine), DM (Cardiology) · Andhra Pradesh Medical Council Reg. No. 57814). Check it is actually rendered on *this* page (byline, reviewer box or footer), not merely present in JSON-LD. Missing → **HIGH** |
| **R12** | Doctor's photograph | 9.2 | Not permitted where it amounts to self-advertisement, solicitation or promotional publicity. A profile photo in a factual doctor-directory block is distinguishable (9.1); a hero-banner portrait next to a superiority headline and a booking button is not. **REVIEW**, **HIGH** when combined with R1/R3/R5 on the same block |
| **R13** | No endorsement of drugs, devices or commercial products | 8.1.iv | Named drug brands, stent/pacemaker makes, BP monitors, wearables, supplements, diet products, apps, labs or pharmacies recommended in the doctor's name — paid or unpaid. Generic drug classes and generic device types in education are fine. **HIGH** |
| **R14** | No unproven therapies, concealed risks or unrealistic expectations | 8.1.vi | Treatments without established evidence, "reverse heart disease naturally", chelation, "avoid bypass" claims, procedure pages with benefits but no risks/limitations/alternatives. (Site rule: **EECP must never appear**.) **HIGH** |
| **R15** | Fees and equipment: factual only | 8.1.x proviso, 9.1, 9.3, 3.2 Expl. II | Prices must be exact, complete enough not to mislead ("from ₹X + hardware" must say what is excluded), and identical across `diagnostics-pricing.yaml`, the `OfferCatalog` JSON-LD and `factsBlock()` in `scripts/generate-llms.mjs`. No "affordable", "lowest cost", "cheaper than". Equipment/technology may be listed as available, but not as "state-of-the-art", "most advanced", "latest", "100% accurate". Insurance: only the approved wording; no named insurer; no "leading insurers". **HIGH** |
| **R16** | Rankings, awards, accreditations | 8.1.ix proviso, 8.3.i | Any award/ranking/"certified" badge must name the awarding body and year and be independently verifiable. Qualifications must match the authoritative facts in `CLAUDE.md`; state fellowships/memberships as what they are (e.g. FESC is a fellowship of a society, not a degree or certification). Never "Assistant Professor". **HIGH** if unverifiable, **REVIEW** on wording |
| **R17** | No manipulation of engagement, reviews or search visibility | 8.1.xii, 8.1.vii, 8.1.viii, 9.4 | Keyword-stuffing of superiority terms ("best cardiologist in Guntur near me") in titles/meta/keywords/alt/FAQs to manufacture standing; fabricated counts; schema markup that asserts ratings not genuinely collected; paid-ranking listings. Legitimate SEO (accurate titles, structured data that mirrors visible facts, location + specialty keywords) is fine. Also raise as a **REVIEW** question — not visible in page content — whether any agency/platform is paid per lead or per patient (8.1.vii–viii). **HIGH** |
| **R18** | Videos, talks and procedure footage | 5.1, 8.2.iii, 7.5, 6 | Awareness talks in the doctor's own name are permitted provided they do not promote the practice. Check video titles, descriptions, key points and thumbnails for R1–R7. No commercial dissemination of live/recorded procedures outside the NMC live-surgery framework; no identifiable patient. **HIGH** |

Also apply the site's own stricter rules from `CLAUDE.md` (no success-rate stats, no "5,000+ procedures", no "Assistant Professor", no EECP, no named insurer). Where the NMC rule and a site rule both apply, cite both.

### Judgement notes

- **Substance over keywords.** "Dr Kamalakar brings a level of care few can match" violates R1 without any listed word. "Best foods for your heart" does not violate R1 — the claim is about food, not the practice.
- **Search-intent phrases are not exempt.** "Best cardiologist in Guntur" is a superiority claim whether it sits in an H1, a `<title>`, a keyword list, an alt attribute or an FAQ question. The compliant equivalent is descriptive: "Cardiologist in Guntur", "Interventional Cardiologist — Kothapet, Guntur".
- **Permitted, do not flag:** name, address, phone, hours, map, departments/services offered, equipment available (stated plainly), emergency availability, exact fees, recognised qualifications, specialty, registration number, doctor availability, accreditation status, formal announcements (new address, absence, resumption, fees), genuinely educational health content, government programme campaigns (7.3 Explanation).
- **Conflicts with existing site decisions.** Some findings (procedure counts in JSON-LD, the homepage title, testimonial-derived `aggregateRating`) contradict things previously encoded as deliberate. Report them anyway, note the conflict, and leave the decision to the user — do not silently drop them and do not silently "fix" them.
- **Don't over-flag.** One finding per distinct problem per location. If shared chrome (footer, hero) is the source, report it once under "Site-wide" rather than on every page.

## Step 4 — Report

Lead with the verdict, then the table. Quote the offending text exactly and keep rewrites publishable as-is.

```
NMC-check — <page>  (<date>)
Verdict: NON-COMPLIANT | COMPLIANT WITH OPEN QUESTIONS | COMPLIANT
Blockers: N · High: N · Review: N

| # | Sev | Rule | Clause | Where | Text | Why | Compliant rewrite |
|---|-----|------|--------|-------|------|-----|-------------------|
| 1 | BLOCKER | R1 | 8.1.ix | src/content/site/en.yaml:18 (hero H1) | "Best Cardiologist in Guntur for Advanced Heart Care" | Unverifiable superiority claim | "Cardiologist in Guntur — Interventional Cardiology & Heart Care" |

Questions for you (cannot be determined from the content):
- …consent on file for case study X? …is banner image Y AI-generated? …any per-lead agency fee?

Checked and passed: R7, R13, R14 …
```

For `all`, add a one-line-per-page summary table first, then "Site-wide" findings, then per-page findings.

## Fixing (`--fix` or on request)

1. Apply rewrites to the **source** files only; never edit `dist/`, `sitemap.xml` or `llms.txt` by hand.
2. Keep every edit factual and consistent with "Authoritative facts" and "Current published prices" in `CLAUDE.md`. Prices live in three places — change all three or none.
3. Do **not** rename a slug, remove a page, or delete a component/section as part of a fix without asking: those are structural changes (redirect, sitemap, llms.txt review). Propose them in the report instead. Removing a testimonials block also requires removing the `aggregateRating`/`review` JSON-LD that is derived from it (`src/utils/schemas.ts`).
4. Title/meta/keyword rewrites cost search visibility for the removed phrases — say so in one line so the trade-off is an informed choice, but do not treat SEO as a reason to keep a violation.
5. After fixing: re-run the scanner on the touched files, then `npm run build` (all gates must pass), then re-review the changed surfaces. Deploy only if the user asks (`deploy-verify` skill).

## Maintenance

- NMC may issue clarifications/SOPs under clause 12. When one arrives, update `reference/nmc-guidelines-2026-10-06.md` (or add a dated sibling file), adjust the rule table and scanner patterns, and bump `version`.
- The Guidelines are read with the IMC (Professional Conduct, Etiquette and Ethics) Regulations, 2002 and the applicable Clinical Establishments Act; where those are stricter, they prevail (4.2, 4.3).
