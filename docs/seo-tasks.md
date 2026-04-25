# SEO Audit — Task Breakdown

Converted from `docs/seo-audit-2026-04.md`. Every recommendation in the audit appears here exactly once, classified on two axes:

- **Internal** = work done inside this repo / on this website / by the dev or content team. Fully under our control.
- **External** = work done off-site — Google Business Profile, directories, reviews, press, social channels. Requires action on third-party platforms, and often waiting on verification / patient action / editorial timelines.
- **Now** = Weeks 1–4 (urgency: compliance risk, conversion bleed, or foundation work that everything else depends on).
- **Later** = Month 2+ (sustained investment, content programmes, authority building).

---

## 🅐 Internal — Now (Weeks 1–4)

*Things we ship on the website this month. Dev + content work.*

### Compliance & technical hygiene (do first — this week)
- [ ] **Fix the synthetic `aggregateRating` in `src/utils/schemas.ts:88-102`** — either gate it behind real Google reviews (with `Review` schema citing real verified text) or remove it entirely until reviews exist. Google Rich Results policy violation risk.
- [ ] **Fix invalid Schema.org type** — `'@type': ['MedicalOrganization', 'MedicalBusiness', 'LocalBusiness']` at `src/utils/schemas.ts:44`. `MedicalBusiness` is not a real Schema.org type. Change to `['MedicalOrganization', 'LocalBusiness']`.
- [ ] **Add Instagram (`@kamalakarheartclinic`) to the `sameAs` array** in `buildBusinessSchema`. Currently only Facebook is listed.
- [ ] **Add JustDial profile URL to `sameAs`** once confirmed.
- [ ] **Add GBP / Google Maps short URL to `sameAs`** once GBP is verified (depends on External-Now task).

### Conversion channels (highest ICE score in the audit — 25)
- [ ] **Add floating WhatsApp button** (bottom-right, persistent across pages) → `https://wa.me/919959423566?text=Hello%20Dr.%20Kamalakar,%20I%20would%20like%20to%20book%20a%20consultation`.
- [ ] **Add WhatsApp as co-equal CTA** alongside "Call Now" in hero, every service page, every blog post end-CTA, contact page, footer.
- [ ] **Add appointment form** on `/contact/` — Name, Phone, Preferred Date, Reason (Consultation / Angiogram / Follow-up / Emergency). Submit via Formspree or similar; route to email + WhatsApp.
- [ ] **Add "Request a callback" mini-form** in homepage hero — single field (phone number) + button.
- [ ] **Surface email `info@kamalakarheartcentre.com` as a clickable CTA** (currently only in schema).

### Analytics & measurement setup
- [ ] **Verify GA4 is firing** on production (the `data-gtag-id="GT-WRGJZJKJ"` tag is set; confirm script loads and hits register).
- [ ] **Configure GA4 conversion events**: `tel:` click, WhatsApp click, appointment form submit, callback form submit.
- [ ] **Verify Google Search Console property** for the production domain; submit the sitemap.
- [ ] **Build a front-desk log template** mapping every new patient to their discovery channel ("How did you hear about us?").

---

## 🅑 Internal — Later (Month 2+)

*Sustained content and architecture work. Starts after the Now block is shipped.*

### Condition landing pages (attach orphaned `MedicalCondition` schemas)
- [ ] **Create `/conditions/coronary-artery-disease/`** — 1,500–2,000 words, symptoms/causes/diagnosis/treatment/prevention/FAQ. Attach existing `MedicalCondition` schema.
- [ ] **Create `/conditions/heart-failure/`** — same spec.
- [ ] **Create `/conditions/hypertension/`** — same spec.
- [ ] **Create `/conditions/high-cholesterol/`** — same spec.
- [ ] **Move `MedicalCondition` schemas from `src/utils/schemas.ts:155-163` onto the respective condition pages.**

### Location catchment pages (6 pages, not templated — each unique)
- [ ] **`/locations/mangalagiri/`** — 800–1,200 words, distance/travel time, common conditions, transport directions, local FAQ.
- [ ] **`/locations/tenali/`** — same spec.
- [ ] **`/locations/narasaraopet/`** — same spec.
- [ ] **`/locations/chilakaluripet/`** — same spec.
- [ ] **`/locations/sattenapalli/`** — same spec.
- [ ] **`/locations/vijayawada/`** (overflow catchment) — same spec.
- [ ] **Add `MedicalClinic` schema on each location page** with canonical NAP + narrowed `areaServed` to that town.
- [ ] **Set sitemap priority 0.7** for location pages (in `scripts/generate-sitemap.mjs`).

### Beef up money pages (the 6 service pages)
- [ ] **Add transparent cost-range section** to each service page (angioplasty, pacemaker, ECG/echo, etc.).
- [ ] **Add "What to expect" timeline** — pre-procedure, day-of, recovery.
- [ ] **Add 3–5 patient testimonials** with `Review` schema (requires consent workflow — see External-Now).
- [ ] **Add cath lab / recovery room photos** (staged or consented).
- [ ] **Add related blog posts block** at the bottom of every service page (fixes the service → blog link gap; currently only blog → service links exist).
- [ ] **Add related posts block to blog posts** — currently missing per the `/blog/7-warning-signs-heart-attack-never-ignore/` audit.

### Long-form content cadence
- [ ] **Publish 1 evergreen condition explainer every 2 weeks for 6 months** — use the `.claude/skills/blog-writer` workflow.
- [ ] **Seed topics:** women's heart attack symptoms, diabetes and heart disease, post-COVID cardiac issues, pediatric heart screening, second opinion before bypass, cost of angiogram in Guntur, reading an ECG report, when to see a cardiologist for chest pain.
- [ ] **Add infographics/diagrams** to blog posts (currently text + one photo only).

### Brand disambiguation (there's a separate "Kamalakar Heart Center" in Rajahmundry)
- [ ] **Add "About Dr. Kamalakar Kosaraju (Guntur)" disambiguation paragraph** on homepage and About page.
- [ ] **Ensure all directory entries explicitly include "Guntur"** in the listing name.

---

## 🅒 External — Now (Weeks 1–4)

*Off-site foundation work. Starts immediately; some tasks have verification/approval waits.*

### Google Business Profile (tied for #1 priority with Practo claim)
- [ ] **Claim / verify the GBP** for Kamalakar Heart Centre at Life Hospital, Kothapet.
- [ ] **Primary category:** Cardiologist. **Secondary categories:** Heart hospital, Medical clinic, Doctor.
- [ ] **Populate all fields:** services with descriptions, attributes (wheelchair accessible, accepts new patients, online care), opening hours, holiday hours.
- [ ] **Add appointment URL** pointing to the booking flow on the site (once Internal-Now appointment form is live).
- [ ] **Upload 25+ photos**: exterior, reception, OPD, cath lab, equipment, team, Dr. Kamalakar in scrubs, patient-facing signage.
- [ ] **Seed 5–10 owner-answered Q&As** ("What is the consultation fee?", "Do you do angioplasty?", "Are you available on Sunday?").
- [ ] **Link the GBP back to the website** (and vice versa — see Internal-Now `sameAs` task).

### Top-tier medical directory claims (in priority order)
- [ ] **Practo** — full bio, fees, online consult option, photo, services, languages, all credentials. Aim for "Verified" badge.
- [ ] **Skedoc** — profile + bio + services.
- [ ] **Lybrate** — profile + bio + services.
- [ ] **Apollo247** — profile + bio + services.
- [ ] **DocGenie** — profile + bio.
- [ ] **Curofy** — profile + bio.
- [ ] **ThreeBestRated** — submission + vetting.
- [ ] **Lock canonical NAP string** — "Kamalakar Heart Centre, Life Hospital, Old Club Road, Kothapet, Guntur, AP 522001 — +91 99594 23566" — use this exactly everywhere.

### Review-collection engine (drives Gap 3 and feeds real `aggregateRating`)
- [ ] **Set up SMS/WhatsApp review-request workflow** — every patient receives a Google review link 24 hours post-visit.
- [ ] **Print QR review cards** for reception desk as a backup channel.
- [ ] **Draft the request copy** ("Thank you for visiting Kamalakar Heart Centre. If we helped, would you share your experience? [shortlink to GBP review]").
- [ ] **Set 60-day target: 50 Google reviews.**
- [ ] **Respond to every review within 48 hours** — positive and negative.

### GBP content cadence
- [ ] **Start weekly GBP posts** — health tip / patient story (with consent) / seasonal advisory. Posts decay after 7 days so weekly is the rhythm.

---

## 🅓 External — Later (Month 2+)

*Authority, channel, and PR work. Slower compounding; start in Month 2, harvest in months 6–12.*

### Second-tier directory expansion
- [ ] **MediFee** profile.
- [ ] **Credihealth** profile.
- [ ] **Doctor360** profile.
- [ ] **Sehat** profile.
- [ ] **Lazoi** profile.
- [ ] **Sulekha** profile.
- [ ] **IndiaMART** listing.
- [ ] **Bing Places** listing.
- [ ] **Apple Maps** listing.

### YouTube channel (owned video — #2 search engine globally)
- [ ] **Claim "Kamalakar Heart Centre" on YouTube.**
- [ ] **Channel banner, about, playlists** configured.
- [ ] **Upload cadence: 1 video per fortnight** — 2-minute Telugu+English explainers (chest pain warning signs, what is angioplasty, when to do an ECG, BP at home, life after a heart attack).
- [ ] **Embed every video on the relevant blog/service page** with `VideoObject` schema (the `buildVideoListSchema` helper in `src/utils/schemas.ts:214-239` already supports this).

### Instagram Reels (repurpose YouTube Shorts)
- [ ] **Activate the existing `@kamalakarheartclinic` account** with a content cadence aligned to YouTube.
- [ ] **1 Reel per week minimum** — repurposed from YouTube Shorts.

### Press & local media outreach (Telugu-audience reach independent of site language)
- [ ] **Pitch monthly health column to Eenadu.**
- [ ] **Pitch monthly health column to Sakshi.**
- [ ] **Pitch monthly health column to The Hindu (Guntur edition).**
- [ ] **Pitch monthly health column to Andhra Jyothi.**
- [ ] **Target topics:** seasonal cardiac risks, women's heart health, exercise for diabetics.
- [ ] **Secure at least one published column in Month 3** — each placement = high-authority backlink.

### Professional-association authority
- [ ] **Create Cardiological Society of India (CSI) member directory profile** with backlink to site.
- [ ] **Claim any APSMC (Andhra Pradesh State Medical Council) profile.**
- [ ] **Long-term: Wikipedia / Wikidata entity** for Dr. Kamalakar Kosaraju (entity-recognition play for AI search).

### AI / LLM search visibility
- [ ] **Test "best cardiologist in Guntur" every 2 months** in Perplexity, ChatGPT, Google AI Overview.
- [ ] **Log whether Dr. Kamalakar is cited and which source the AI uses.**
- [ ] **Optimize the most-cited source** (usually GBP or the canonical homepage).

### Measurement & review cycle
- [ ] **Monthly KPI dashboard** tracking the 8 KPIs from the audit (GBP calls, GBP directions, reviews count, GSC clicks, local-pack rank, `tel:` clicks, WhatsApp clicks, booked consults by source).
- [ ] **Day-90 re-audit** — pull GSC, GBP Insights, call volume, review count delta. Identify next-quarter focus.

---

## Do-Not-Do List (from the audit — avoid temptation)

- ❌ Buying backlinks or running directory blasts ("list you on 500 sites for ₹X").
- ❌ Paid review services — Google detects velocity manipulation and may terminate the GBP.
- ❌ Templated programmatic location pages at scale (6 unique pages > 50 templated).
- ❌ Auto-translated Telugu content (out of scope this cycle, but if revisited: needs a Telugu-native medical editor).
- ❌ Chatbots pretending to be the doctor (YMYL trust collapse).
- ❌ Doorway pages for distant cities (Vijayawada overflow only — no Hyderabad / Bangalore reach-stretch).
- ❌ Generalist SEO agencies without verifiable healthcare case studies.

---

## Priority at a glance

If only **three things** get done, do them in this order:

1. **🅐 Internal-Now — Compliance:** fix the synthetic `aggregateRating` and invalid `MedicalBusiness` type in `src/utils/schemas.ts`.
2. **🅐 Internal-Now — Conversion:** ship WhatsApp button + appointment form + callback request.
3. **🅒 External-Now — Acquisition:** verify GBP + claim Practo + launch review-request workflow targeting 50 Google reviews in 60 days.

These three unlock more value than every other recommendation combined.
