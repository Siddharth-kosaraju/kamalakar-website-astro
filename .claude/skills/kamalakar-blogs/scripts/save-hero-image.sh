#!/usr/bin/env bash
#
# save-hero-image.sh — turn a clipboard base64 PNG into the repo's jpg+webp hero pair.
#
# Usage:
#   .claude/skills/kamalakar-blogs/scripts/save-hero-image.sh blog-angiography-guide-hero
#
# Expects: the browser step has already run
#   window.__h = croppedCanvas.toDataURL('image/png').split(',')[1];
#   await navigator.clipboard.writeText(window.__h);
# ...with document.hasFocus() === true (click an empty page area first, or the
# clipboard write silently fails and you get a few dozen junk characters).
#
# Produces public/media/<name>.jpg and <name>.webp, deletes the intermediate PNG.
# macOS `sips` handles JPEG but CANNOT write WebP, so Pillow does the WebP.

set -euo pipefail

NAME="${1:-}"
if [[ -z "$NAME" ]]; then
  echo "usage: $(basename "$0") <hero-basename>   e.g. blog-angiography-guide-hero" >&2
  exit 64
fi
NAME="${NAME%.png}"; NAME="${NAME%.jpg}"; NAME="${NAME%.webp}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
MEDIA_DIR="$REPO_ROOT/public/media"
[[ -d "$MEDIA_DIR" ]] || { echo "error: $MEDIA_DIR not found — run inside the site repo" >&2; exit 66; }

PNG="$MEDIA_DIR/$NAME.png"
JPG="$MEDIA_DIR/$NAME.jpg"
WEBP="$MEDIA_DIR/$NAME.webp"

# --- 1. clipboard sanity ------------------------------------------------------
LEN=$(pbpaste | wc -c | tr -d ' ')
if (( LEN < 10000 )); then
  echo "error: clipboard holds only ${LEN} bytes — the canvas copy did not land." >&2
  echo "       Click an empty area of the doc page so document.hasFocus() is true," >&2
  echo "       then re-run the toDataURL + clipboard.writeText step." >&2
  exit 65
fi

# --- 2. decode ----------------------------------------------------------------
pbpaste | base64 -d > "$PNG" 2>/dev/null || { echo "error: base64 decode failed" >&2; rm -f "$PNG"; exit 65; }

if ! file "$PNG" | grep -q 'PNG image data'; then
  echo "error: decoded data is not a PNG:" >&2
  file "$PNG" >&2
  rm -f "$PNG"
  exit 65
fi

DIMS=$(file "$PNG" | sed -n 's/.*PNG image data, \([0-9]* x [0-9]*\).*/\1/p')

# --- 3. convert ---------------------------------------------------------------
sips -s format jpeg -s formatOptions 85 "$PNG" --out "$JPG" >/dev/null 2>&1 \
  || { echo "error: sips JPEG conversion failed" >&2; rm -f "$PNG"; exit 70; }

python3 - "$PNG" "$WEBP" <<'PY' || { echo "error: WebP conversion failed (is Pillow installed?)" >&2; exit 70; }
import sys
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
Image.open(src).convert("RGB").save(dst, "WEBP", quality=82, method=6)
PY

# --- 4. clean up + report -----------------------------------------------------
rm -f "$PNG"

human() { local b=$1; awk -v b="$b" 'BEGIN{printf "%.0f KB", b/1024}'; }
JPG_SIZE=$(human "$(stat -f%z "$JPG")")
WEBP_SIZE=$(human "$(stat -f%z "$WEBP")")

echo "hero saved  ${DIMS}"
echo "  $JPG   ($JPG_SIZE)"
echo "  $WEBP  ($WEBP_SIZE)"
echo
echo "NEXT: Read the .jpg and look at it before using it."
echo "      Reject if body text bleeds in, the banner is clipped, or a mouse cursor is drawn over it."
echo "      Reference it in frontmatter as: heroImage: \"/media/$NAME.jpg\"  (the .webp is auto-resolved)"
