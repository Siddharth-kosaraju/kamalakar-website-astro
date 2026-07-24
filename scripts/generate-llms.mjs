/**
 * Post-build llms.txt generator  (https://llmstxt.org/)
 *
 * GENERATED FILE — do NOT hand-edit dist/llms.txt. Edit THIS script instead.
 *
 * Runs AFTER `astro build` and AFTER generate-sitemap.mjs (it reads
 * dist/sitemap.xml to cross-check completeness). Writes dist/llms.txt from the
 * project's source-of-truth content — never from public/.
 *
 * Data sources:
 *   - Blog entries   → frontmatter of src/content/blog/*.md
 *                      (title + summary), included ONLY if the post was
 *                      actually built (dist/blog/<slug>/index.html exists).
 *                      Unpublished / future-dated posts are excluded by Astro
 *                      at build time, so gating on the built HTML mirrors that.
 *   - Service entries→ src/content/services/*.yaml (title + metaDescription),
 *                      included ONLY if dist/services/<slug>/index.html exists.
 *   - Static pages   → STATIC_DESCRIPTIONS map below (hand-maintained).
 *   - Authoritative facts block → CLAUDE.md + src/utils/schemas.ts. These are
 *                      encoded verbatim below; never invent alternatives.
 *
 * COMPLETENESS GATE (exit 1 on failure):
 *   Every URL in dist/sitemap.xml MUST appear in the generated llms.txt, and
 *   every URL emitted MUST resolve to a real dist/ page. A new static page in
 *   the sitemap with no STATIC_DESCRIPTIONS entry fails the build with a clear
 *   message telling the developer to add a description here. This is what
 *   forces llms.txt to stay in sync as the site grows.
 *
 * FORBIDDEN CLAIMS — must never appear in output (enforced below):
 *   - any success-rate stat ("99% success rate")
 *   - "5,000+ procedures"
 *   - "Assistant Professor"
 *   - EECP in any form
 *   - any named insurance company
 */

import { readdirSync, statSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../', import.meta.url).pathname;
const DIST = new URL('../dist/', import.meta.url).pathname;
const BLOG_SRC = join(ROOT, 'src/content/blog');
const SERVICES_SRC = join(ROOT, 'src/content/services');
const MEDIA_SRC = join(ROOT, 'src/content/media');
const SITE = 'https://kamalakarheartcentre.com';
const OUT_FILE = join(DIST, 'llms.txt');
const SITEMAP_FILE = join(DIST, 'sitemap.xml');

// Practising interventional cardiology since 2015 — mirror START_YEAR in
// src/utils/content.ts. We prefer the static-safe phrase in prose, but compute
// the count here in case it is ever needed.
const START_YEAR = 2015;
const YEARS_PRACTISING = new Date().getFullYear() - START_YEAR;

// ---------------------------------------------------------------------------
// Hand-maintained descriptions for static (non-content-collection) pages.
// A sitemap URL that is NOT a /blog/<slug>/ or /services/<slug>/ page and is
// NOT listed here will FAIL the build (see completeness gate). When you add a
// new static page, add its description here.
// Each description should state, in natural query language, the questions the
// page answers (AEO/GEO).
// ---------------------------------------------------------------------------
const STATIC_DESCRIPTIONS = {
  '/': {
    section: 'clinic',
    name: 'Kamalakar Heart Centre — Home',
    desc: 'Best cardiologist and heart specialist in Guntur; who is Dr. Kamalakar Kosaraju, where is the clinic, consultation fee, OPD timings and how to book an appointment.',
  },
  '/about/': {
    section: 'clinic',
    name: 'About Dr. Kamalakar Kosaraju',
    desc: 'Dr. Kamalakar Kosaraju qualifications and experience — MBBS and MD (Gold Medalist) from Dr. NTR University, DM Cardiology from Osmania Medical College, FESC, and years as an interventional cardiologist in Guntur.',
  },
  '/contact/': {
    section: 'clinic',
    name: 'Contact & Location',
    desc: 'Kamalakar Heart Centre address, phone number, OPD hours, directions to the clinic at Life Hospital in Kothapet Guntur, and how to reach 24/7 cardiac emergency care.',
  },
  '/education/': {
    section: 'clinic',
    name: 'Patient Education',
    desc: 'Heart-health patient education from a Guntur cardiologist — understanding heart disease, symptoms, tests, treatments and prevention explained in plain language.',
  },
  '/services/': {
    section: 'clinic',
    name: 'Cardiology Services',
    desc: 'Full list of cardiology services in Guntur — angiogram, angioplasty, pacemaker, heart-failure management, hypertension and cholesterol control, ECG/2D-Echo/TMT diagnostics and emergency cardiac care.',
  },
  '/blog/': {
    section: 'clinic',
    name: 'Heart Health Blog',
    desc: 'Articles and patient guides on heart attacks, heart tests, angioplasty, cholesterol, heart failure and heart-healthy living from Dr. Kamalakar Kosaraju.',
  },
  '/media/': {
    section: 'clinic',
    name: 'Heart Health Videos',
    desc: 'Short video explainers from Dr. Kamalakar Kosaraju on heart tests, heart attack warning signs, and prevention — in English and Telugu.',
  },
  '/privacy-policy/': {
    section: 'optional',
    name: 'Privacy Policy',
    desc: 'How Kamalakar Heart Centre collects, uses and protects visitor and patient data on this website.',
  },
  '/terms-of-service/': {
    section: 'optional',
    name: 'Terms of Service',
    desc: 'Terms and conditions governing use of the Kamalakar Heart Centre website.',
  },
};

// ---------------------------------------------------------------------------
// Minimal frontmatter / yaml scalar parser (no new deps).
// Only top-level scalar keys are read: title, summary, metaDescription,
// published, date. Handles single/double quoted and bare scalars.
// ---------------------------------------------------------------------------
function unquote(v) {
  v = v.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    return v.slice(1, -1).replace(/\\"/g, '"');
  }
  return v;
}

// YAML block-scalar indicators (folded `>` / literal `|`, with optional
// chomping/indent modifiers). We only support inline scalars; a block scalar
// would otherwise silently emit its literal indicator (e.g. ">-") as the page
// name/description. Detect and fail loudly instead.
const BLOCK_SCALAR_RE = /^[|>][+-]?\d*$/;

/** Parse the top-level scalar keys we care about from a block of text. */
function parseScalars(block, keys, sourceLabel = 'content') {
  const out = {};
  for (const line of block.split('\n')) {
    // Only top-level keys (no leading whitespace).
    const m = line.match(/^([A-Za-z0-9_]+):[ \t]*(.*)$/);
    if (!m) continue;
    const [, key, rawVal] = m;
    if (!keys.includes(key)) continue;
    if (rawVal === '' || rawVal === undefined) continue; // skip nested/empty
    const trimmed = rawVal.trim();
    if (BLOCK_SCALAR_RE.test(trimmed)) {
      console.error(
        `\n[llms] FAILED: '${key}' in ${sourceLabel} uses an unsupported YAML ` +
          `block scalar ('${trimmed}'). The llms.txt generator only reads ` +
          `inline scalars — rewrite it as a single quoted string, e.g. ` +
          `${key}: "…".\n`
      );
      process.exit(1);
    }
    out[key] = unquote(rawVal);
  }
  return out;
}

/** Extract the YAML frontmatter block (between the first two `---` lines). */
function frontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  return m ? m[1] : '';
}

// ---------------------------------------------------------------------------
// Collect blog entries — only those actually built into dist/.
// ---------------------------------------------------------------------------
function collectBlog() {
  const entries = [];
  const files = existsSync(BLOG_SRC)
    ? readdirSync(BLOG_SRC).filter((f) => f.endsWith('.md'))
    : [];
  for (const file of files) {
    const slug = file.replace(/\.md$/, '');
    // Mirror what Astro actually built (unpublished / future-dated excluded).
    if (!existsSync(join(DIST, 'blog', slug, 'index.html'))) continue;
    const fm = parseScalars(
      frontmatter(readFileSync(join(BLOG_SRC, file), 'utf-8')),
      ['title', 'summary', 'date'],
      `src/content/blog/${file}`
    );
    entries.push({
      url: `${SITE}/blog/${slug}/`,
      name: fm.title || slug,
      desc: fm.summary || '',
      date: fm.date || '',
    });
  }
  // Newest first.
  entries.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return entries;
}

// ---------------------------------------------------------------------------
// Collect service entries — only those actually built into dist/.
// ---------------------------------------------------------------------------
function collectServices() {
  const entries = [];
  const files = existsSync(SERVICES_SRC)
    ? readdirSync(SERVICES_SRC).filter((f) => f.endsWith('.yaml'))
    : [];
  for (const file of files) {
    const slug = file.replace(/\.yaml$/, '');
    if (!existsSync(join(DIST, 'services', slug, 'index.html'))) continue;
    const fm = parseScalars(
      readFileSync(join(SERVICES_SRC, file), 'utf-8'),
      ['title', 'metaDescription'],
      `src/content/services/${file}`
    );
    entries.push({
      url: `${SITE}/services/${slug}/`,
      name: fm.title || slug,
      desc: fm.metaDescription || '',
    });
  }
  entries.sort((a, b) => a.name.localeCompare(b.name));
  return entries;
}

// ---------------------------------------------------------------------------
// Collect media (video) entries — only full/featured tier, and only those
// actually built into dist/ (grid-only videos have no dedicated page and are
// intentionally excluded — nothing for llms.txt or the sitemap to point at).
// ---------------------------------------------------------------------------
function collectMedia() {
  const entries = [];
  const files = existsSync(MEDIA_SRC)
    ? readdirSync(MEDIA_SRC).filter((f) => f.endsWith('.yaml'))
    : [];
  for (const file of files) {
    const slug = file.replace(/\.yaml$/, '');
    if (!existsSync(join(DIST, 'media', slug, 'index.html'))) continue;
    const fm = parseScalars(
      readFileSync(join(MEDIA_SRC, file), 'utf-8'),
      ['displayTitle', 'description', 'tier'],
      `src/content/media/${file}`
    );
    if (fm.tier !== 'full' && fm.tier !== 'featured') continue;
    entries.push({
      url: `${SITE}/media/${slug}/`,
      name: fm.displayTitle || slug,
      desc: fm.description || fm.displayTitle || '',
    });
  }
  entries.sort((a, b) => a.name.localeCompare(b.name));
  return entries;
}

// ---------------------------------------------------------------------------
// Build the authoritative facts block (verbatim; do not invent alternatives).
// ---------------------------------------------------------------------------
function factsBlock() {
  return `Dr. Kamalakar Kosaraju is an Interventional Cardiologist practising in Guntur, Andhra Pradesh since 2015. He has performed 3,000+ coronary angiograms and 1,000+ angioplasty procedures.

**Credentials:** MBBS — Dr. NTR University of Health Sciences, Vijayawada (2007) · MD General Medicine, Gold Medalist — Dr. NTR University of Health Sciences, Vijayawada (2012) · DM Cardiology — Osmania Medical College, Hyderabad (2012–2015) · FESC (Fellow of the European Society of Cardiology) · Andhra Pradesh Medical Council registration #57814 (2007).

**Clinic:** Kamalakar Heart Centre, Life Hospital, Old Club Road, Kothapet, Guntur, Andhra Pradesh 522001 (opposite AVR Hospital). Phone +91-9959423566 · Email info@kamalakarheartcentre.com. Languages: English, Telugu.

**Hours:** OPD Monday–Saturday 10:00 AM–6:00 PM · Sunday emergency only · 24/7 cardiac emergency care.

**Published prices (INR):** Cardiology Consultation ₹500 (includes basic ECG) · ECG ₹200 · 2D Echocardiography ₹1,000 · Treadmill Test (TMT) ₹1,200 · Holter Monitoring ₹6,000 · Coronary Angiogram ₹15,000 · Coronary Angioplasty from ₹1,10,000 + hardware.

**Insurance:** Cashless and reimbursement options are available for most major procedures — please call to confirm with your provider.`;
}

// ---------------------------------------------------------------------------
// Assemble the document.
// ---------------------------------------------------------------------------
function buildDoc() {
  const blog = collectBlog();
  const services = collectServices();
  const media = collectMedia();

  const staticEntries = Object.entries(STATIC_DESCRIPTIONS).map(([path, v]) => ({
    url: SITE + path,
    ...v,
  }));
  const clinic = staticEntries.filter((e) => e.section === 'clinic');
  const optional = staticEntries.filter((e) => e.section === 'optional');

  const link = (e) => `- [${e.name}](${e.url}): ${e.desc}`;

  const parts = [];
  parts.push('# Kamalakar Heart Centre');
  parts.push('');
  parts.push(
    '> Kamalakar Heart Centre is an interventional cardiology clinic in Guntur, Andhra Pradesh, led by Dr. Kamalakar Kosaraju (Interventional Cardiologist, FESC). Located at Life Hospital, Old Club Road, Kothapet, Guntur 522001 (opposite AVR Hospital). Phone +91-9959423566. OPD Mon–Sat 10:00 AM–6:00 PM, Sunday emergency only, with 24/7 cardiac emergency care.'
  );
  parts.push('');
  parts.push(factsBlock());
  parts.push('');
  parts.push('## Services');
  parts.push(services.map(link).join('\n'));
  parts.push('');
  parts.push('## Patient Guides');
  parts.push(blog.map(link).join('\n'));
  parts.push('');
  parts.push('## Videos');
  parts.push(media.map(link).join('\n'));
  parts.push('');
  parts.push('## Clinic');
  parts.push(clinic.map(link).join('\n'));
  parts.push('');
  parts.push('## Optional');
  parts.push(optional.map(link).join('\n'));
  parts.push('');

  const doc = parts.join('\n');

  // Collect every URL we emitted, for the completeness cross-check.
  const emitted = new Set([
    ...services.map((e) => e.url),
    ...blog.map((e) => e.url),
    ...media.map((e) => e.url),
    ...staticEntries.map((e) => e.url),
  ]);

  return { doc, emitted };
}

// ---------------------------------------------------------------------------
// Forbidden-claims guard.
// ---------------------------------------------------------------------------
function assertNoForbiddenClaims(doc) {
  const patterns = [
    { re: /\bsuccess[\s-]*rate\b/i, msg: 'success-rate claim' },
    { re: /\b\d+\s*%\s*success/i, msg: 'percentage success-rate claim' },
    { re: /\b5,?000\+?\s*(procedures|cardiac)/i, msg: '"5,000+ procedures" claim' },
    { re: /\bassistant professor\b/i, msg: '"Assistant Professor" claim' },
    { re: /\bEECP\b/i, msg: 'EECP reference' },
    // Named insurers are forbidden — only the approved generic wording is
    // allowed. Catch both the specific insurers seen historically AND the
    // general shape of an insurer/TPA brand name, since blog summaries and
    // service metaDescriptions are injected unvetted. Known-safe generic words
    // like "health insurance" / "insurance provider" are excluded below.
    {
      re: /\b(united\s*health(care)?|star\s*health|arogya\s*raksha|icici\s*lombard|hdfc\s*ergo|bajaj\s*allianz|max\s*bupa|niva\s*bupa|care\s*health|new\s*india\s*assurance|oriental\s*insurance|national\s*insurance|reliance\s*(general|health)|tata\s*aig|aditya\s*birla\s*health|sbi\s*(general|health)|manipal\s*cigna|cigna|apollo\s*munich|religare|mediclaim)\b/i,
      msg: 'named insurance company',
    },
    {
      // Generic catch for "<Brand> Insurance/Assurance/Mediclaim/TPA" or
      // "<Brand> Health Insurance" — a capitalised brand token immediately
      // before an insurance keyword. Excludes the bare category words.
      re: /\b(?!Health\b|Cardiac\b|Medical\b)[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?\s+(?:Insurance|Assurance|Mediclaim|TPA)\b/,
      msg: 'named insurance company (brand + insurance keyword)',
    },
  ];
  const hits = patterns.filter((p) => p.re.test(doc));
  if (hits.length > 0) {
    console.error('\n[llms] FAILED: forbidden claim(s) present in generated llms.txt:');
    for (const h of hits) console.error('  ✗ ' + h.msg);
    console.error('');
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Completeness gate: sitemap ⇄ llms.txt must be a bijection over indexable URLs.
// ---------------------------------------------------------------------------
function crossCheck(emitted) {
  let sitemapXml;
  try {
    sitemapXml = readFileSync(SITEMAP_FILE, 'utf-8');
  } catch {
    console.error(
      `\n[llms] FAILED: ${SITEMAP_FILE} not found. generate-llms must run AFTER generate-sitemap.\n`
    );
    process.exit(1);
  }

  const sitemapUrls = new Set();
  for (const m of sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    sitemapUrls.add(m[1].trim());
  }

  const failures = [];

  // 1. Every sitemap URL must appear in llms.txt.
  for (const url of sitemapUrls) {
    if (!emitted.has(url)) {
      const path = url.replace(SITE, '');
      failures.push(
        `${path}  →  in sitemap but missing from llms.txt. ` +
          (path.startsWith('/blog/') || path.startsWith('/services/')
            ? 'Content page — check it built into dist/.'
            : `Add a STATIC_DESCRIPTIONS["${path}"] entry in scripts/generate-llms.mjs.`)
      );
    }
  }

  // 2. Every emitted URL must be a real built page and be in the sitemap.
  for (const url of emitted) {
    if (!sitemapUrls.has(url)) {
      const path = url.replace(SITE, '');
      failures.push(`${path}  →  emitted in llms.txt but NOT in sitemap (stale/non-indexable).`);
    }
    const routeDir = url === SITE + '/' ? '' : url.replace(SITE + '/', '').replace(/\/$/, '');
    if (!existsSync(join(DIST, routeDir, 'index.html'))) {
      const path = url.replace(SITE, '');
      failures.push(`${path}  →  emitted in llms.txt but no dist/${routeDir}/index.html exists.`);
    }
  }

  if (failures.length > 0) {
    console.error(`\n[llms] FAILED: ${failures.length} completeness issue(s):\n`);
    for (const f of failures) console.error('  ✗ ' + f);
    console.error('');
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Run.
// ---------------------------------------------------------------------------
const { doc, emitted } = buildDoc();
assertNoForbiddenClaims(doc);
crossCheck(emitted);
writeFileSync(OUT_FILE, doc.endsWith('\n') ? doc : doc + '\n');
console.log(
  `\n[llms] Generated ${OUT_FILE} (${emitted.size} URLs; ${YEARS_PRACTISING} years practising).\n`
);
