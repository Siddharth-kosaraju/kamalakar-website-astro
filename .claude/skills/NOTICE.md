# Imported skills — attribution

The following 11 skills under `.claude/skills/` were imported from
**[onvoyage-ai/gtm-engineer-skills](https://github.com/onvoyage-ai/gtm-engineer-skills)**
on **2026-04-27**. They are licensed under the MIT License (Copyright (c) 2025 OnVoyage AI).

| Skill | Purpose (one line) |
|---|---|
| `audit-content` | Verify URLs, statistics, citations, and company claims before publishing. |
| `build-backlinks` | Find free backlink/mention opportunities (HN, Quora, GitHub, directories). |
| `build-resource-pages` | Build frontend resource pages from existing content. |
| `create-geo-charts` | Data visualisations with AI-readable text layers. |
| `geo-content-planning` | Plan content architecture from research outputs. |
| `geo-content-research` | GEO prompt targets (Buy / Solve / Learn) for AI citations. |
| `improve-aeo-geo` | Audit a website codebase and apply AEO/GEO code fixes. |
| `reddit-opportunity-research` | Find Reddit pain points and promotable discussions. |
| `research-brand` | URL → `brand_dna.md`. |
| `research-keywords` | SEO keyword research (Ahrefs/Semrush + SerpAPI helper scripts). |
| `write-seo-geo-content` | Product-led SEO and GEO content pages. |

The intended workflow per the source repo is:

```
research-brand
  → research-keywords / reddit-opportunity-research / geo-content-research
  → geo-content-planning
  → write-seo-geo-content / build-resource-pages
  → audit-content
  → improve-aeo-geo
  → build-backlinks
```

## Attribution and license

Original repo: <https://github.com/onvoyage-ai/gtm-engineer-skills>
Original commit cloned: see `git log` of the import commit.
License: MIT — full text below.

```
MIT License

Copyright (c) 2025 OnVoyage AI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OF OTHER DEALINGS IN THE
SOFTWARE.
```

## What was NOT imported

The following top-level files from the source repo were intentionally left out
because they document the source repo itself rather than any individual skill:

- `README.md`, `AGENT.md`, `CONTRIBUTING.md`, `.gitignore`, `assets/`

The original `LICENSE` text is reproduced above instead of being copied as a
file under `.claude/`.
