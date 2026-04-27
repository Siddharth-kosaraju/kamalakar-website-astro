# Imported subagents — attribution

The 11 subagents under `.claude/agents/` were cherry-picked from
**[AgriciDaniel/claude-seo](https://github.com/AgriciDaniel/claude-seo)** v1.9.6
(MIT, Copyright (c) 2026 agricidaniel) and imported on **2026-04-27**.

These are **subagents** (loaded via the `Agent` tool's `subagent_type` parameter
or invoked when another agent / skill orchestrates them) — they are NOT slash
commands. Slash-command skills live in `.claude/skills/` (different mechanism).

## Imported (11)

These agents are pure-prompt — they have no external Python script or hook
dependencies, so they work in this project without any install setup.

| Agent | Purpose (one line) |
|---|---|
| `seo-cluster` | Semantic topic clustering and pillar/cluster mapping. |
| `seo-content` | Content quality reviewer (E-E-A-T, readability, depth, AI-citation potential). |
| `seo-dataforseo` | DataForSEO MCP data analyst — only works if the DataForSEO MCP is connected. Falls back gracefully. |
| `seo-flow` | FLOW-framework prompt analyst (reads URL, picks relevant FLOW stage prompts). |
| `seo-geo` | GEO / AI-search specialist (AI crawler access, `llms.txt`, passage extractability). |
| `seo-image-gen` | SEO image analyst — audits OG / social preview images. |
| `seo-local` | Local SEO (GBP, NAP, citations, reviews, local schema). |
| `seo-maps` | Maps intelligence — geo-grid rank tracking, GBP audits, review analysis. |
| `seo-schema` | Schema.org / JSON-LD markup expert (detect, validate, generate). |
| `seo-sitemap` | Sitemap architect — validates XML sitemaps, generates new ones. |
| `seo-technical` | Technical SEO — crawlability, indexability, security, URL structure, mobile. |

## Skipped (6 + infrastructure)

These were intentionally **not** imported because they require Python
infrastructure, external API credentials, or hooks we have not set up. Pull them
in separately if/when the Python environment is configured.

### Script-dependent agents
| Agent | Requires |
|---|---|
| `seo-backlinks` | `scripts/backlinks_auth.py`, `bing_webmaster.py`, `commoncrawl_graph.py`, `moz_api.py`, `validate_backlink_report.py`, `verify_backlinks.py` (+ Moz / Bing Webmaster API keys) |
| `seo-drift` | `scripts/drift_baseline.py`, `drift_compare.py`, `drift_history.py`, `drift_report.py`, `fetch_page.py` |
| `seo-ecommerce` | `scripts/dataforseo_costs.py`, `dataforseo_merchant.py`, `fetch_page.py`, `parse_html.py` |
| `seo-google` | `scripts/crux_history.py`, `google_auth.py`, `google_report.py`, `gsc_inspect.py`, `gsc_query.py`, `pagespeed_check.py` (+ GSC / GA4 / CrUX credentials) |
| `seo-performance` | `scripts/crux_history.py`, `pagespeed_check.py` |
| `seo-sxo` | `scripts/fetch_page.py`, `parse_html.py` |
| `seo-visual` | `scripts/capture_screenshot.py` (+ Playwright ~300MB) |

### Other skipped artefacts
- `hooks/hooks.json` and `hooks/validate-schema.py` — the source repo registers a `PostToolUse: Edit|Write` hook that runs `python3 validate-schema.py "$FILE_PATH"` on every file edit. Intrusive (latency on every edit, requires Python in PATH). Not imported.
- `install.sh` / `install.ps1` / `pyproject.toml` / `requirements.txt` / `.devcontainer/` — full plugin install machinery (~15 Python deps including Playwright, weasyprint, google-api-python-client, matplotlib).
- `.claude-plugin/plugin.json` and `marketplace.json` — plugin / marketplace manifests that would belong in a global plugin install, not a flat agent copy.
- `pdf/`, `screenshots/`, `claude-seo-slides/`, `youtube-shorts-research.md`, etc. — repo collateral.

## How to invoke

Use the `Agent` tool with the agent name as `subagent_type`. Example:

```
Agent({
  description: "Schema markup audit",
  subagent_type: "seo-schema",
  prompt: "Audit the Schema.org JSON-LD on /blog/dr-kamalakar-... and report any missing required properties for Person/Physician rich results."
})
```

The agents are project-local — they only show up in this repo, not globally.

## License

```
MIT License
Copyright (c) 2026 agricidaniel
Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```
