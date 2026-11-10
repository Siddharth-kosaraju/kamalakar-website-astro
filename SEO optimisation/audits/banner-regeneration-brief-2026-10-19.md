# Banner regeneration brief — 2026-10-19

Two blog banners were patched on 2026-10-19 to remove claim text printed into the image (NMC Guidelines R-13014/01/2024-Ethics, cl. 8.1.ix and 3.2 Expl. II). The patches are a stopgap; regenerate clean versions and replace the files in `public/media/` (both `.jpg` and `.webp`, same filenames, 688 × 442 px).

## Rules for both banners

- Keep the current visual style, layout, colours and the post title text.
- Brand name: **"Kamalakar Heart Centre"** (not "Dr. Kamalakar Heart Centre").
- No superiority or outcome words anywhere in the image: best, top, leading, expert, advanced, world-class, trusted, guaranteed, painless, success.
- No doctor or patient figures (avoids AI images being read as the real doctor or a real patient — cl. 7.2(b)). Equipment, anatomy, icons and the hospital building are fine.
- The post still carries `heroImageAi: true`, so the "Illustration generated using AI" caption stays.

## 1. `blog-angiography-guide-hero.jpg` — "Angiography: Procedure, Preparation, Risks & Recovery Guide"

- Keep: logo, title block, cath-lab background, angiogram monitor, heart and artery illustration, website URL.
- Location pill (currently patched to "Life Hospital, Kothapet, Guntur"): keep that wording.
- Second line (currently patched to "Cardiac Care at Kamalakar Heart Centre"): keep that wording, or drop the line.

## 2. `blog-heart-treatment-guntur-hero.jpg` — "Heart Treatment in Guntur"

- Keep: logo, title, Life Hospital building, heart graphic, "Kamalakar Heart Centre" label.
- Three icon labels (currently patched): **Consultation · Diagnostics · Procedures**.
- The shield badge "Your Health Our Priority" may stay (a slogan, not a claim) or be removed.

After replacing, run `/nmc-check` on both posts and view the images before deploying.
