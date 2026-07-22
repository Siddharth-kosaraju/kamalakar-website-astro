# Verification checklist

Run top to bottom. Each command's expected result is stated — if it doesn't match, **stop and investigate before deploying.**

Set once:

```bash
S1=<slug-1>; S2=<slug-2>
BASE=https://kamalakarheartcentre.com
```

## A. Build gates

```bash
npm run build
```

Expect all three lines, no errors:

```
[sitemap] Generated …/dist/sitemap.xml with N URLs.
[llms] Generated …/dist/llms.txt (N URLs; NN years practising).
[verify-canonicals] OK: N indexable HTML files, all canonicals valid (1 noindex page(s) skipped).
```

The sitemap count and llms count **must be equal**. The `1 noindex` page is `/404/` — expected.

The llms generator **fails the build** if a new *static page* has no `STATIC_DESCRIPTIONS` entry, or if a forbidden claim (success rates, "5,000+ procedures", "Assistant Professor", EECP, a named insurer) appears. Blog posts are auto-included from frontmatter, so a normal post batch needs no generator change.

## B. Indexes actually contain the new posts

```bash
grep -c '<loc>' dist/sitemap.xml                       # = previous total + number added
grep -E "$S1|$S2" dist/sitemap.xml                     # 2 <loc> lines
grep -E "$S1|$S2" dist/llms.txt                        # 2 bullet lines with descriptions
for s in "$S1" "$S2"; do grep -o "$s" dist/feed.xml | head -1; done   # each prints once
ls -la dist/media/blog-*-hero.*                        # jpg + webp for each new hero
```

`grep -c` counts *lines*, not occurrences — `feed.xml` may be one long line, so grep per slug.

### If the total looks wrong

Reconcile source against output:

```bash
ls src/content/blog/*.md | wc -l
grep -oE 'blog/[a-z0-9-]+/' dist/sitemap.xml | wc -l
```

These must be equal. A legitimate mismatch against your *memory* of the count: `understanding-heart-attack-warning-signs` was retired in commit `dc7f982` and 301s to `/blog/7-warning-signs-heart-attack-never-ignore/`, so the baseline dropped by one. Confirm any suspected retirement really does redirect:

```bash
curl -sS -o /dev/null -w "status=%{http_code} -> %{redirect_url}\n" "$BASE/blog/<retired-slug>/"   # expect 301
```

## C. Per-post SEO tags (local)

```bash
for f in "$S1" "$S2"; do
  echo "--- $f ---"
  grep -oE '<title>[^<]+</title>|<meta name="description"[^>]+>|<meta name="keywords"[^>]+>|<link rel="canonical"[^>]+>|<meta property="og:url"[^>]+>|<meta property="og:image"[^>]+>' "dist/blog/$f/index.html"
  grep -o '"@type":"FAQPage"' "dist/blog/$f/index.html"
  grep -oE '<img src="/media/blog-[a-z-]+\.jpg"|<source srcset="/media/blog-[a-z-]+\.webp"' "dist/blog/$f/index.html"
done
```

Assert:
- `<title>` = `metaTitle | Kamalakar Heart Centre` — **exactly one** brand suffix
- description = `metaDescription`
- keywords present (from `tags`)
- canonical == og:url, absolute, https, bare domain, trailing slash
- og:image = that post's hero, or `media/dr-kamalakar.jpg` when heroless
- `FAQPage` present (absent ⇒ FAQ heading shape is wrong)
- hero `<source>` webp + `<img>` jpg both present when the post has a hero

## D. Preview smoke test

```bash
npm run preview            # background
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:4321/blog/$S1/"
```

Port 4321 may already be held by an earlier preview — harmless, `astro preview` serves `dist/` per request, so a 200 on a brand-new slug proves the fresh build is being served.

Screenshot: both posts + `/blog/`. Confirm hero renders full-width, byline correct, Key Takeaway styled, new posts at the top of the index with the right date.

## E. Git hygiene

```bash
git status --short
```

The repo carries pre-existing untracked paths (`.agents/`, `.codex/`, `AGENTS.md`, `google search data/`). **Never `git add -A`.** Stage explicitly, then confirm only your files are staged:

```bash
git add src/content/blog/$S1.md src/content/blog/$S2.md public/media/blog-*-hero.jpg public/media/blog-*-hero.webp
git diff --cached --stat
```

## F. Production (after `npm run deploy`)

```bash
for u in "/blog/$S1/" "/blog/$S2/" "/sitemap.xml" "/llms.txt" "/feed.xml" "/blog/"; do
  printf "%s  %s\n" "$(curl -sS -o /dev/null -w '%{http_code}' -L "$BASE$u")" "$u"
done
# plus every new hero .jpg and .webp
curl -sS "$BASE/sitemap.xml?cb=$RANDOM" | grep -c '<loc>'
curl -sS "$BASE/sitemap.xml?cb=$RANDOM" | grep -oE "blog/($S1|$S2)/"
curl -sS "$BASE/llms.txt?cb=$RANDOM" | grep -coE "$S1|$S2"
for f in "$S1" "$S2"; do
  curl -sS "$BASE/blog/$f/?cb=$RANDOM" | grep -oE '<title>[^<]+</title>|<link rel="canonical"[^>]+>|<meta property="og:image"[^>]+>'
done
```

**Always cache-bust with `?cb=$RANDOM`.** A stale count is usually the browser/CDN cache, not a broken deploy. Before concluding anything is wrong:

```bash
curl -sS -D - -o /dev/null "$BASE/sitemap.xml" | grep -iE 'x-cache|age:|last-modified|etag'
```

`last-modified` should match the deploy time. `x-cache: Hit from cloudfront` with a recent `last-modified` means the cached copy *is* the new one.

## G. Report + handoff

Include: live URLs, hero decisions, publish date, commit SHA, CloudFront invalidation Id, everything verified, and **every judgement call** (corrected titles, dropped references, emergency-number handling).

Remind the user to **re-submit `sitemap.xml` in Google Search Console** — new pages are a structural change under `CLAUDE.md`, and GSC's own page count lags until it re-crawls.
