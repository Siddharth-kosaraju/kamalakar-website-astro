#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------
# deploy.sh — build + tiered S3 sync + CloudFront invalidation.
#
# Replaces the previous inline one-liner in package.json. The key improvement
# over a single `aws s3 sync dist/ ... --delete` is per-tier Cache-Control
# headers, so browsers and CloudFront cache content-hashed assets aggressively
# while always re-validating HTML/sitemap/robots/feeds.
#
# Cache-Control tiers:
#   1. _astro/**  (content-hashed, filename changes on every content change)
#        -> public,max-age=31536000,immutable      (1 year, never revalidate)
#   2. fonts/**, images/**, media/**, favicon*, apple-touch-icon*
#        -> public,max-age=2592000                 (30 days)
#   3. everything else — *.html, sitemap.xml, robots.txt, llms.txt, feed.xml,
#      *.xml, *.txt
#        -> public,max-age=0,must-revalidate       (always revalidate)
#
# IMPORTANT — `aws s3 sync` only writes metadata (incl. Cache-Control) on
# objects it actually UPLOADS. Objects whose content is unchanged keep whatever
# metadata they already had on S3. So this script only guarantees correct
# headers on NEW/CHANGED objects. To fix Cache-Control on ALL pre-existing
# objects (the current production state has NO Cache-Control at all), run the
# one-time scripts/backfill-cache-headers.sh once.
#
# IMPORTANT — orphan pruning with `--delete`. The AWS CLI applies --exclude to
# BOTH sides of a sync: an excluded key is removed from the operation entirely,
# so `--delete` will NOT prune destination objects that match an --exclude
# pattern. Therefore a single whole-tree `sync --delete --exclude _astro/*`
# would leave old content-hashed assets in _astro/ forever. Instead, each tier
# prunes its OWN prefix: tiers 1 and 2 sync `dist/<prefix>/ -> s3/<prefix>/`
# WITH `--delete`, which is scoped to that prefix (both source and dest are the
# same subtree), so it safely removes stale hashed assets there and nothing
# else. Tier 3 then syncs the whole tree WITH `--delete` but EXCLUDES the tier
# 1/2 prefixes (already reconciled) — so it prunes orphaned HTML/root files and
# leaves the asset tiers untouched. Net: correct per-tier headers, orphans
# pruned in every tier, nothing wrongly deleted.
# ---------------------------------------------------------------------------

BUCKET="s3://kamalakar-heart-centre-prod"
DIST_ID="E3STOTV0PG9BZU"
PROFILE="sid-personal"
DIST_DIR="dist"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> Building site (astro build + sitemap + llms + canonical verify)"
npm run build

# Strip macOS Finder artifacts copied from public/ so they never reach S3.
# (Removing them here — not from public/ — is durable: macOS recreates them.)
find "$DIST_DIR" -name '.DS_Store' -type f -delete

echo "==> Tier 1: _astro/** (immutable, 1 year) — prunes stale hashed assets"
aws s3 sync "$DIST_DIR/_astro/" "$BUCKET/_astro/" \
  --profile "$PROFILE" \
  --delete \
  --cache-control "public,max-age=31536000,immutable"

echo "==> Tier 2: fonts/, images/, media/ (30 days)"
for dir in fonts images media; do
  if [ -d "$DIST_DIR/$dir" ]; then
    aws s3 sync "$DIST_DIR/$dir/" "$BUCKET/$dir/" \
      --profile "$PROFILE" \
      --delete \
      --cache-control "public,max-age=2592000"
  fi
done

echo "==> Tier 2b: root favicons / apple-touch-icon (30 days)"
# These live at the bucket root, not in a dir, so sync them individually.
# `aws s3 cp` sets Cache-Control on upload; run only for files that exist.
for f in favicon.ico favicon.svg apple-touch-icon.png; do
  if [ -f "$DIST_DIR/$f" ]; then
    aws s3 cp "$DIST_DIR/$f" "$BUCKET/$f" \
      --profile "$PROFILE" \
      --cache-control "public,max-age=2592000"
  fi
done
# favicon-*.png (globbed) at root
for f in "$DIST_DIR"/favicon-*.png; do
  [ -e "$f" ] || continue
  base="$(basename "$f")"
  aws s3 cp "$f" "$BUCKET/$base" \
    --profile "$PROFILE" \
    --cache-control "public,max-age=2592000"
done

echo "==> Tier 3: catch-all (HTML/sitemap/robots/llms/feeds) + --delete reconcile"
# Whole-tree sync with --delete, EXCLUDING the tier-1/tier-2 prefixes (already
# uploaded-and-pruned above with their own aggressive headers). Excluding them
# here means this pass neither re-uploads them with the wrong (tier-3) headers
# NOR prunes them (their own passes handle deletion). This pass therefore only
# uploads/updates HTML + root text/xml files and prunes orphaned HTML/root keys
# (e.g. a removed blog post's index.html).
aws s3 sync "$DIST_DIR/" "$BUCKET/" \
  --profile "$PROFILE" \
  --delete \
  --cache-control "public,max-age=0,must-revalidate" \
  --exclude "_astro/*" \
  --exclude "fonts/*" \
  --exclude "images/*" \
  --exclude "media/*" \
  --exclude "favicon.ico" \
  --exclude "favicon.svg" \
  --exclude "favicon-*.png" \
  --exclude "apple-touch-icon.png"

echo "==> CloudFront invalidation ($DIST_ID)"
aws cloudfront create-invalidation \
  --distribution-id "$DIST_ID" \
  --paths "/*" \
  --profile "$PROFILE"

echo "==> Deploy complete."
