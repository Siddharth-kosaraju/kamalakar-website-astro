#!/usr/bin/env node
// First-pass phrase scanner for the nmc-check skill.
// Flags known trigger wording from the NMC Guidelines on Ethical Advertising (06-10-2026).
// A hit is a prompt to read the context, not a verdict; absence of hits is not compliance.
//
// Usage:
//   node .claude/skills/nmc-check/scripts/nmc-scan.mjs <file-or-dir> [...]
//   node .claude/skills/nmc-check/scripts/nmc-scan.mjs --all
//   add --json for machine-readable output, --strict to exit 1 on any BLOCKER hit

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const PRACTICE = '(?:cardiolog\\w*|doctors?|physicians?|hospitals?|specialists?|surgeons?|centres?|centers?|clinics?|check-?ups?|treatments?|care|services?|tests?|angiogra\\w*|angioplast\\w*|pacemaker\\w*|heart)';

const RULES = [
  // R1 — comparative / superiority (8.1.ix, 8.3.ii)
  ['R1', 'BLOCKER', `\\bbest\\b[^.\\n|"]{0,45}\\b${PRACTICE}\\b`],
  ['R1', 'BLOCKER', `\\b(?:no\\.?\\s?1|number one|#1)\\b`],
  ['R1', 'BLOCKER', `\\b(?:most trusted|most experienced|unmatched|unrivall?ed|second to none)\\b`],
  ['R1', 'BLOCKER', `\\bleading\\b(?![-\\[])[^.\\n]{0,40}\\b${PRACTICE}\\b`],
  ['R1', 'BLOCKER', `\\btop\\b[^.\\n]{0,25}\\b${PRACTICE}\\b`],
  ['R1', 'HIGH', `\\b(?:renowned|premier|finest|foremost|world[- ]class|widely (?:regarded|trusted|recognized|recognised)|highly (?:regarded|acclaimed)|preferred choice|recognized as one of|recognised as one of|trusted name)\\b`],
  // R2 — guarantees / exaggerated outcomes (8.1.iii, 8.1.vi)
  ['R2', 'BLOCKER', `\\b(?:guarantee[ds]?|100\\s?%|painless|miracle|exclusive cure|permanent cure|risk[- ]free|no side[- ]effects?|assured results?)\\b`],
  ['R2', 'HIGH', `\\b(?:high|higher|excellent|proven) success rates?\\b|\\bsuccess rates?\\b|\\b(?:completely|totally|absolutely|perfectly|100% )safe\\b|\\binstant relief\\b`],
  // R3 — achievements / volumes (8.1.iii)
  ['R3', 'HIGH', `\\b\\d[\\d,]*\\s?\\+\\s?(?:coronary |successful )?(?:angiogra\\w*|angioplast\\w*|procedures?|patients?|surger\\w*|cases|implants?|stents?)\\b`],
  ['R3', 'HIGH', `\\b(?:patients treated|lives saved|happy patients|successful (?:procedures|surgeries|cases))\\b`],
  ['R3', 'REVIEW', `\\bgold medal\\w*\\b|\\baward[- ]winning\\b|\\byears of excellence\\b`],
  // R4 — testimonials / reviews / ratings (Expl. V, 8.1.xi)
  ['R4', 'HIGH', `\\b(?:testimonials?|aggregateRating|reviewCount|ratingValue|patient reviews?|google reviews?|star rating|rated \\d(?:\\.\\d)?|what (?:our )?patients say|highly recommend\\w*)\\b`],
  // R5 — solicitation (8.1.ii, 8.3.ii)
  ['R5', 'HIGH', `\\b(?:why choose|book (?:now|today|your)|don'?t (?:wait|delay)|call (?:now|today)|hurry|act now|trust your heart|your heart deserves)\\b`],
  // R6 — fear-based / unnecessary demand (8.1.i)
  ['R6', 'HIGH', `\\b(?:before it'?s too late|you could be next|silent killer|ticking time ?bomb|everyone (?:over|above) \\d+ (?:should|must|needs?))\\b`],
  // R7 — inducements (8.1.x)
  ['R7', 'BLOCKER', `\\b(?:discount\\w*|\\d+\\s?% off|limited[- ](?:period|time)|special offer|offer price|coupon\\w*|cashback|free (?:consultation|check-?up|camp|ecg|echo|screening|procedure)|referral (?:bonus|benefit|reward)|package deal)\\b`],
  // R8/R9 — cases, before/after, identifiable patients (8.1.v, 6, 7.4)
  ['R8', 'REVIEW', `\\b(?:before[- ]and[- ]after|before\\s?/\\s?after|success stor\\w+|patient stor\\w+|celebrity|(?:mr|mrs|ms|smt|sri)\\.?\\s[A-Z][a-z]+)\\b`],
  // R10 — AI (7.2)
  ['R10', 'REVIEW', `\\b(?:ai[- ]generated|generated (?:by|with) ai|midjourney|dall-?e|stable diffusion|gemini[- ]generated|synthetic (?:patient|voice))\\b`],
  // R13 — product endorsement (8.1.iv)
  ['R13', 'REVIEW', `\\b(?:we recommend|dr\\.? kamalakar recommends|recommended brand|sponsored by|in partnership with)\\b`],
  // R14 — unproven therapies / site rule
  ['R14', 'HIGH', `\\b(?:EECP|chelation|reverse heart disease|avoid bypass|natural cure|cure[sd]? (?:heart|blockage)\\w*)\\b`],
  // R15 — fees / equipment puffery
  ['R15', 'HIGH', `\\b(?:state[- ]of[- ]the[- ]art|most advanced|cutting[- ]edge|latest technology|100% accura\\w+|affordable|lowest (?:cost|price)|cheapest|leading insurers?)\\b`],
  // R16 — site rule
  ['R16', 'BLOCKER', `\\bassistant professor\\b`],
].map(([rule, sev, src]) => ({ rule, sev, re: new RegExp(src, 'gi') }));

const EXT = new Set(['.md', '.mdx', '.yaml', '.yml', '.astro', '.tsx', '.ts', '.mjs', '.html', '.txt', '.xml', '.json']);
const SKIP_DIR = new Set(['node_modules', '.git', '_astro', '.astro', 'admin']);
const ALL = [
  'src/content', 'src/pages', 'src/components', 'src/utils/schemas.ts', 'scripts/generate-llms.mjs',
];

const args = process.argv.slice(2);
const flags = new Set(args.filter(a => a.startsWith('--')));
let targets = args.filter(a => !a.startsWith('--'));
if (flags.has('--all')) targets = ALL;
if (targets.length === 0) {
  console.error('usage: nmc-scan.mjs <file-or-dir> [...] | --all  [--json] [--strict]');
  process.exit(2);
}

function* walk(p) {
  if (!existsSync(p)) { console.error(`skip (not found): ${p}`); return; }
  const st = statSync(p);
  if (st.isDirectory()) {
    for (const name of readdirSync(p).sort()) {
      if (SKIP_DIR.has(name)) continue;
      yield* walk(join(p, name));
    }
  } else if (EXT.has(extname(p))) {
    yield p;
  }
}

const snippet = (line, i, len) => {
  const a = Math.max(0, i - 50), b = Math.min(line.length, i + len + 50);
  return (a > 0 ? '…' : '') + line.slice(a, b).trim() + (b < line.length ? '…' : '');
};

const hits = [];
for (const t of targets) {
  for (const file of walk(t)) {
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, n) => {
      const seen = new Set();
      for (const { rule, sev, re } of RULES) {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(line)) !== null) {
          const key = `${rule}:${m.index}`;
          if (!seen.has(key)) {
            seen.add(key);
            hits.push({ file: relative(process.cwd(), file), line: n + 1, rule, sev, match: m[0], context: snippet(line, m.index, m[0].length) });
          }
          if (m.index === re.lastIndex) re.lastIndex++;
        }
      }
    });
  }
}

if (flags.has('--json')) {
  console.log(JSON.stringify(hits, null, 2));
} else {
  for (const h of hits) console.log(`${h.file}:${h.line}  [${h.rule} ${h.sev}]  "${h.match}"  — ${h.context}`);
  const by = (k) => hits.reduce((o, h) => ((o[h[k]] = (o[h[k]] || 0) + 1), o), {});
  console.log(`\n${hits.length} hits in ${new Set(hits.map(h => h.file)).size} files`, by('sev'), by('rule'));
  console.log('Hits are prompts to read the context, not verdicts. Images, tone, missing disclosures (R11) and consent (R8/R9) need manual review.');
}
process.exit(flags.has('--strict') && hits.some(h => h.sev === 'BLOCKER') ? 1 : 0);
