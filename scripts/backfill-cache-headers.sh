#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------
# backfill-cache-headers.sh — ONE-TIME in-place Cache-Control backfill.
#
# WHY: `aws s3 sync` only writes metadata on objects it uploads. Production
# currently has NO Cache-Control header on ANY object, and most objects are
# byte-identical to dist/, so a normal deploy would NOT re-upload them and they
# would keep missing their headers forever. This script rewrites Cache-Control
# on ALL existing objects in place using
#     aws s3 cp <uri> <uri> --metadata-directive REPLACE
# which performs a server-side copy onto itself, replacing metadata.
#
# Run this ONCE (the main conversation runs it at deploy time). After that,
# scripts/deploy.sh keeps headers correct on any changed object going forward.
#
# CRITICAL GOTCHA — Content-Type:
#   `--metadata-directive REPLACE` REPLACES the full metadata set. Any field not
#   re-specified is DROPPED, and the S3 CLI does NOT re-guess Content-Type on a
#   self-copy — it would default to binary/octet-stream and break every HTML,
#   CSS, JS, image, etc. So we MUST re-specify --content-type on every batch.
#   We therefore run one `cp --recursive` per (tier x content-type) combination,
#   using --exclude "*"/--include "<glob>" to scope each batch and passing the
#   matching --content-type explicitly.
#
#   >>> TEST FIRST on one object before trusting a broad run: <<<
#     aws s3api head-object --bucket kamalakar-heart-centre-prod \
#       --key _astro/<somehash>.css --profile sid-personal
#     # confirm ContentType is text/css after the tier-1 css batch runs.
#   If your bucket has content types we don't enumerate below, add a batch.
#
# NOTE: this operates on what's live in the bucket. Run it AFTER a deploy that
# has already uploaded the current file set, so keys and content types match.
# ---------------------------------------------------------------------------

BUCKET="kamalakar-heart-centre-prod"
S3="s3://$BUCKET"
PROFILE="sid-personal"

IMMUTABLE="public,max-age=31536000,immutable"
MEDIUM="public,max-age=2592000"
NOCACHE="public,max-age=0,must-revalidate"

# Helper: recursive in-place metadata rewrite for one content-type batch.
#   $1 = s3 prefix (e.g. s3://bucket/_astro/)
#   $2 = cache-control value
#   $3 = content-type
#   $4 = include glob (relative to the prefix)
rewrite() {
  local prefix="$1" cc="$2" ct="$3" glob="$4"
  echo "    [$ct | $glob] under $prefix"
  aws s3 cp "$prefix" "$prefix" \
    --recursive \
    --metadata-directive REPLACE \
    --cache-control "$cc" \
    --content-type "$ct" \
    --exclude "*" \
    --include "$glob" \
    --profile "$PROFILE"
}

echo "==> Tier 1: _astro/** (immutable) — per content-type"
rewrite "$S3/_astro/" "$IMMUTABLE" "text/css"                 "*.css"
rewrite "$S3/_astro/" "$IMMUTABLE" "text/javascript"          "*.js"
rewrite "$S3/_astro/" "$IMMUTABLE" "image/webp"               "*.webp"
rewrite "$S3/_astro/" "$IMMUTABLE" "image/svg+xml"            "*.svg"
rewrite "$S3/_astro/" "$IMMUTABLE" "font/woff2"               "*.woff2"

echo "==> Tier 2: fonts/ images/ media/ (30 days) — per content-type"
for dir in fonts images media; do
  rewrite "$S3/$dir/" "$MEDIUM" "image/webp"       "*.webp"
  rewrite "$S3/$dir/" "$MEDIUM" "image/jpeg"       "*.jpg"
  rewrite "$S3/$dir/" "$MEDIUM" "image/jpeg"       "*.jpeg"
  rewrite "$S3/$dir/" "$MEDIUM" "image/png"        "*.png"
  rewrite "$S3/$dir/" "$MEDIUM" "image/svg+xml"    "*.svg"
  rewrite "$S3/$dir/" "$MEDIUM" "image/gif"        "*.gif"
  rewrite "$S3/$dir/" "$MEDIUM" "font/woff2"       "*.woff2"
  rewrite "$S3/$dir/" "$MEDIUM" "font/woff"        "*.woff"
done

echo "==> Tier 2b: root favicons / apple-touch-icon (30 days)"
# Individual root objects — set each explicitly (no --recursive, exact key).
declare -A ROOT_ICONS=(
  ["favicon.ico"]="image/x-icon"
  ["favicon.svg"]="image/svg+xml"
  ["favicon-48x48.png"]="image/png"
  ["favicon-192x192.png"]="image/png"
  ["apple-touch-icon.png"]="image/png"
)
for key in "${!ROOT_ICONS[@]}"; do
  ct="${ROOT_ICONS[$key]}"
  if aws s3api head-object --bucket "$BUCKET" --key "$key" --profile "$PROFILE" >/dev/null 2>&1; then
    echo "    [$ct] $key"
    aws s3 cp "$S3/$key" "$S3/$key" \
      --metadata-directive REPLACE \
      --cache-control "$MEDIUM" \
      --content-type "$ct" \
      --profile "$PROFILE"
  fi
done

echo "==> Tier 3: catch-all (HTML/sitemap/robots/llms/feeds) — always revalidate"
# HTML pages live at nested keys ending in index.html (directory format).
# We must NOT touch the tier-1/2 scopes here, so exclude them, then include
# each catch-all content type explicitly with the right Content-Type.
tier3() {
  local cc="$1" ct="$2" glob="$3"
  echo "    [$ct | $glob]"
  aws s3 cp "$S3/" "$S3/" \
    --recursive \
    --metadata-directive REPLACE \
    --cache-control "$cc" \
    --content-type "$ct" \
    --exclude "*" \
    --include "$glob" \
    --exclude "_astro/*" \
    --exclude "fonts/*" \
    --exclude "images/*" \
    --exclude "media/*" \
    --profile "$PROFILE"
}
tier3 "$NOCACHE" "text/html; charset=utf-8"        "*.html"
tier3 "$NOCACHE" "application/xml"                 "*.xml"
tier3 "$NOCACHE" "text/plain; charset=utf-8"       "*.txt"

echo "==> Backfill complete."
echo "    Verify a sample:"
echo "    aws s3api head-object --bucket $BUCKET --key index.html --profile $PROFILE"
