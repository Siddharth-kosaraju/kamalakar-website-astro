# Reading & extracting from the Google content doc

Everything here was derived empirically against
`docs.google.com/document/d/1vX9MOFZKhnN0EZi38y2s-_q0nQTHz2kKuVCQPng8U1o/`.

## Why this is not a normal web scrape

Google Docs renders the document body into `<canvas>` elements. Consequences:

- `get_page_text` returns only the app chrome (menus, tab list) — **not the document text**.
- There are **no `<img>` elements** for embedded images. Querying `document.querySelectorAll('img')` returns only the avatar and a promo SVG.
- `/preview` and `/export?format=zip` do **not** yield usable HTML+images for this doc (preview renders in `about:blank` iframes; export triggers a download, which needs explicit user permission anyway).

So: **text is read from screenshots, images are extracted by cropping the canvas.**

## Tab navigation

The left "Document tabs" tree lists `Blog 1 … Blog N`. Mouse-wheel scrolling over the sidebar scrolls the *document*, not the sidebar. Use refs instead:

```
find { query: "Blog 13 and Blog 14 tabs in document tabs sidebar" }
computer { action: "scroll_to", ref: "ref_N" }
computer { action: "left_click", ref: "ref_N" }
computer { action: "wait", duration: 3 }
```

The URL anchor (`?tab=t.xxxxx`) changes per tab but is opaque — **identify the tab by the rendered H1**, and say it back to the user before capturing.

Once a Blog tab is active, the sidebar expands to show that post's headings. **This outline is the definitive checklist** of sections to capture.

## Reading the body

Loop: `computer{action:"scroll", scroll_direction:"down", scroll_amount:8..14, coordinate:[775,450]}` → `screenshot`.

Two failure modes, both silent:

1. **Overshoot.** A 12–15 tick scroll can jump a whole heading. Whenever a screenshot starts mid-section, scroll **up 4–6** and re-shoot. Reconcile every sidebar heading before moving on.
2. **Page-break splits.** The doc paginates; a list can be split across two page canvases with a large white gap. Keep scrolling — the continuation appears on the next page.

## Locating a section's page canvas

```js
Array.from(document.querySelectorAll('canvas')).map((c,i)=>{
  const r=c.getBoundingClientRect();
  return {i, nw:c.width, nh:c.height, cssW:Math.round(r.width), cssH:Math.round(r.height),
          top:Math.round(r.top), left:Math.round(r.left)};
}).filter(c=>c.cssW>0)
```

Observed geometry (stable across sessions):

| Property | Value |
|---|---|
| Canvas native | **898 × 1162** |
| Canvas CSS | **816 × 1056** |
| native ÷ CSS | **≈ 1.1005** |
| `devicePixelRatio` | **1.1** |
| Page left edge | CSS `left ≈ 449` |

Several canvases exist at once (previous/next pages) with negative `top`. Pick the one whose `top`…`top+1056` brackets the element you want.

## Screenshot → canvas coordinate conversion

Screenshot pixels ≠ CSS pixels. Convert:

```
CSS      = screenshot_px × (window.innerWidth / screenshot_width)     # ≈ 1.104
relative = CSS − canvas.getBoundingClientRect().left/top
native   = relative × 1.1005
```

In practice the content column is constant, so you rarely need the x math:

- **`sx = 106`** (left edge of the text/image column, native px)
- **`sw = 688`** (column width, native px)
- Only `sy` / `sh` need tuning per banner.

Typical banner heights are `sh ≈ 430–442`.

## Extracting the banner

**Step 1 — focus.** `navigator.clipboard.writeText()` rejects silently when the document isn't focused. Click an empty white area of the page (below the content) first:

```
computer { action: "left_click", coordinate: [775, 620] }
```

**Step 2 — crop and copy:**

```js
const c = document.querySelectorAll('canvas')[IDX];
const sx = 106, sy = SY, sw = 688, sh = SH;
const cr = document.createElement('canvas');
cr.width = sw; cr.height = sh;
cr.getContext('2d').drawImage(c, sx, sy, sw, sh, 0, 0, sw, sh);
window.__h = cr.toDataURL('image/png').split(',')[1];
await navigator.clipboard.writeText(window.__h);
'copied ' + window.__h.length + ' focus=' + document.hasFocus()
```

Healthy result: `copied 728380 focus=true`. **Under ~10k chars means it failed** — re-focus and retry.

> Do not try to return the base64 through the tool result; large values get truncated. The clipboard is the transport.

**Step 3 — save and convert:**

```bash
.claude/skills/kamalakar-blogs/scripts/save-hero-image.sh blog-<topic>-hero
```

**Step 4 — look at it.** `Read` the generated `.jpg`. Reject and re-crop if you see:
- body text bleeding in at the bottom → reduce `sh`
- the banner clipped at top/bottom → adjust `sy` / `sh`
- a mouse cursor drawn over the art → `computer{action:"hover", coordinate:[1450,400]}` then re-crop
- large white margins → tighten `sy`/`sh`

## Where the banner lives

| Post | Banner position |
|---|---|
| Blogs 7, 8 | Top of tab, directly under the H1 |
| Blogs 9, 10, 11, 12 | **Bottom of the tab**, after the SEO block |

Always scroll to the very end before concluding a post has no banner.

Blog 10's tab ended with the *Angiography* banner even though the post was about *Angioplasty* — a copy/paste artifact. Treat topic mismatch as a decision gate for the user, not something to fix silently.

## The trailing SEO block

Most tabs end with:

```
Meta Title:      <often already includes "| Dr. Kamalakar Heart Centre">
Meta Description:
Meta Keywords:   <comma-separated>
URL Slug:        <sometimes present — prefer it when it is>
```

Blog 10 put this block **above** the title instead. Blog 12 had no `URL Slug`. Capture whatever exists; derive what doesn't.

## Image conversion notes

- `sips -s format jpeg -s formatOptions 85` works for JPEG.
- **`sips` cannot write WebP** on this machine (`Error 13: Can't write format: org.webmproject.webp`). `cwebp`, `magick`, and `ffmpeg` are not installed. Python 3 + Pillow **is** available — the script uses it.
- Repo convention is a **`.jpg` + `.webp` pair**; the intermediate `.png` is deleted, never committed.
- Typical output: ~690×440, JPEG ≈ 105–132 KB, WebP ≈ 37–52 KB.
