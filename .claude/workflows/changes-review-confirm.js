export const meta = {
  name: 'changes-review-confirm',
  description: 'Implement a change, verify deploy scripts, multi-lens review with adversarial verification, fix confirmed findings, and run acceptance tests. Never deploys — production deploy stays in the main conversation.',
  whenToUse: 'Any non-trivial change to this site that should go through the implement → review → confirm cycle before deploy. Invoke with args: { task, instructions, context?, check_deploy?, deploy_notes?, lenses?, test_plan? }.',
  phases: [
    { title: 'Implement', detail: 'implement the change end-to-end', model: 'opus' },
    { title: 'Deploy Scripts', detail: 'check/update deploy pipeline + deploy-verify skill', model: 'opus' },
    { title: 'Review', detail: 'parallel reviewers, one per lens' },
    { title: 'Verify', detail: 'adversarial verification of each finding' },
    { title: 'Fix', detail: 'apply confirmed findings', model: 'opus' },
    { title: 'Test', detail: 'acceptance test of the final state' },
  ],
}

// ---------------------------------------------------------------------------
// changes-review-confirm — reusable pipeline for the Kamalakar Heart Centre repo
//
// args:
//   task         (required) one-line description of the change
//   instructions (required) detailed implementation instructions (file paths,
//                exact edits, constraints). The implement agent reads CLAUDE.md
//                first regardless.
//   context      (optional) extra facts/constraints injected into EVERY agent
//                prompt (e.g. authoritative clinic facts, forbidden claims)
//   check_deploy (optional, default true) run the Deploy Scripts phase
//   deploy_notes (optional) specific things the deploy-scripts agent must check
//   lenses       (optional) [{key, prompt}] review lenses; defaults below
//   test_plan    (optional) explicit acceptance-test checklist for the Test agent
//
// Invariants encoded here (do not weaken):
//   - Implement/Deploy-check/Fix phases run on Opus.
//   - Reviewers are read-only; a single fixer applies confirmed findings.
//   - Every finding is adversarially verified before it is fixed.
//   - No agent commits, pushes, or deploys. The main conversation owns step 5
//     (deploy via the deploy-verify skill, only if this workflow's checks pass).
// ---------------------------------------------------------------------------

// Normalize: some invocation paths deliver args as a JSON-encoded string.
const A = (typeof args === 'string') ? JSON.parse(args) : (args || {})
if (!A.task || !A.instructions) {
  throw new Error('changes-review-confirm requires args: { task, instructions, ... }')
}

const CONTEXT = A.context ? `\nADDITIONAL CONTEXT / CONSTRAINTS:\n${A.context}\n` : ''
const NO_SHIP = 'Do NOT commit, push, or deploy — the main conversation handles that after this workflow reports.'

phase('Implement')
const impl = await agent(`You are working in the current repo (Kamalakar Heart Centre — Astro 5 static site). Read CLAUDE.md first and honour every policy in it (canonical/trailing-slash rules, sitemap/llms.txt generation, authoritative facts, forbidden claims).
${CONTEXT}
TASK: ${A.task}

IMPLEMENTATION INSTRUCTIONS (follow thoroughly):
${A.instructions}

After implementing, run "npm run build" and make sure the full pipeline passes (astro build, sitemap generator, llms.txt generator, canonical verifier). Fix anything that breaks. ${NO_SHIP}

Return: a summary, every file created/modified/deleted (absolute paths), key design decisions, and whether the build passed.`,
  { label: 'implement', phase: 'Implement', model: 'opus', effort: 'high',
    schema: { type: 'object', properties: {
      summary: { type: 'string' },
      files_created: { type: 'array', items: { type: 'string' } },
      files_modified: { type: 'array', items: { type: 'string' } },
      files_deleted: { type: 'array', items: { type: 'string' } },
      build_passed: { type: 'boolean' },
      notes: { type: 'string' } },
      required: ['summary', 'files_created', 'files_modified', 'files_deleted', 'build_passed'] } })

if (!impl) throw new Error('Implementation agent failed')
log(`Implement done (build passed: ${impl.build_passed}). Files: +${impl.files_created.length} ~${impl.files_modified.length} -${impl.files_deleted.length}`)

phase('Deploy Scripts')
let deployCheck = { summary: 'Skipped (check_deploy=false)', files_modified: [], risks: [] }
if (A.check_deploy !== false) {
  const dc = await agent(`Current repo: Kamalakar Heart Centre Astro site. A change was just implemented:
${JSON.stringify({ task: A.task, summary: impl.summary, files_created: impl.files_created, files_modified: impl.files_modified, files_deleted: impl.files_deleted }, null, 2)}
${CONTEXT}
Check every deployment-related script/config and update what is needed so the deploy pipeline correctly ships and verifies this change. Read CLAUDE.md first. Standard checklist:
1. package.json "deploy" script (build → aws s3 sync --delete → CloudFront invalidation) — still correct for this change?
2. cloudfront-functions/redirect-www-to-non-www.js — READ the actual logic; confirm no new path is mis-redirected. Do NOT modify unless genuinely broken (it deploys via scripts/aws_deploy.sh, a separate pipeline) — flag prominently instead.
3. .claude/skills/deploy-verify/SKILL.md — add/adjust pre-deploy and post-deploy verification steps for this change.
4. Anything change-specific:
${A.deploy_notes || '(none provided — use judgement)'}
${NO_SHIP}
Return what you checked, what you changed, and any risks.`,
    { label: 'deploy-scripts', phase: 'Deploy Scripts', model: 'opus', effort: 'high',
      schema: { type: 'object', properties: {
        checked: { type: 'array', items: { type: 'string' } },
        files_modified: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' } },
        required: ['checked', 'files_modified', 'risks', 'summary'] } })
  if (dc) deployCheck = dc
  log(`Deploy scripts checked: ${deployCheck.summary.slice(0, 120)}`)
}

const FINDINGS_SCHEMA = { type: 'object', properties: {
  findings: { type: 'array', items: { type: 'object', properties: {
    file: { type: 'string' }, line: { type: 'integer' },
    summary: { type: 'string' }, severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
    failure_scenario: { type: 'string' } },
    required: ['file', 'summary', 'severity', 'failure_scenario'] } } },
  required: ['findings'] }

const VERDICT_SCHEMA = { type: 'object', properties: {
  real: { type: 'boolean' }, reason: { type: 'string' } }, required: ['real', 'reason'] }

const DEFAULT_LENSES = [
  { key: 'correctness', prompt: 'LENS: correctness & regressions. Hunt for real bugs, broken edge cases, build-pipeline breakage, unintended behaviour changes to untouched pages, and unnecessary breaking changes. Only report demonstrable defects with a concrete failure scenario — not style preferences.' },
  { key: 'policy', prompt: 'LENS: site policy & factual compliance. Check the change against every CLAUDE.md policy: canonical/trailing-slash rules, sitemap/robots/llms.txt policies, authoritative facts about Dr Kamalakar and prices, forbidden claims (success-rate stats, named insurers, EECP, Assistant Professor). Report violations as findings.' },
  { key: 'quality', prompt: 'LENS: quality & effectiveness. Does the change actually achieve its stated goal? Check the built dist/ output where relevant. Look for half-measures, silent degradations, and accessibility/SEO regressions. Report only substantiated findings.' },
]

const lenses = (Array.isArray(A.lenses) && A.lenses.length > 0) ? A.lenses : DEFAULT_LENSES
const changedFiles = [...new Set([...impl.files_created, ...impl.files_modified, ...deployCheck.files_modified])].join(', ')
const REVIEW_CTX = `Current repo: Kamalakar Heart Centre Astro site. Change under review: ${A.task}. Files created/modified: ${changedFiles}. Deleted: ${impl.files_deleted.join(', ') || '(none)'}. Inspect the files on disk and "git status"/"git diff" for ground truth. Rebuild with "npm run build" if you need fresh dist/ output.${CONTEXT}`

const reviewed = await pipeline(
  lenses,
  l => agent(`${REVIEW_CTX}\n${l.prompt}`, { label: `review:${l.key}`, phase: 'Review', schema: FINDINGS_SCHEMA }),
  (result, l) => result ? parallel(result.findings.map(f => () =>
    agent(`${REVIEW_CTX}\nA reviewer (lens: ${l.key}) reported this finding — adversarially verify it by reading the actual code/output on disk. Try to REFUTE it. Only real=true if you can demonstrate the defect concretely; default to real=false if uncertain or stylistic.\nFINDING: ${JSON.stringify(f)}`,
      { label: `verify:${l.key}`, phase: 'Verify', schema: VERDICT_SCHEMA })
      .then(v => ({ ...f, lens: l.key, verdict: v }))
  )) : []
)

const confirmed = reviewed.flat().filter(Boolean).filter(f => f.verdict && f.verdict.real)
const refuted = reviewed.flat().filter(Boolean).filter(f => !f.verdict || !f.verdict.real)
log(`Review complete: ${confirmed.length} confirmed finding(s), ${refuted.length} refuted/uncertain`)

phase('Fix')
let fixReport = { applied: [], skipped: [], build_passed: impl.build_passed, summary: 'No confirmed findings — nothing to fix.' }
if (confirmed.length > 0) {
  const fix = await agent(`${REVIEW_CTX}\nApply fixes for these CONFIRMED review findings (verified real). Fix each properly in source (never hand-edit dist/). After fixing, run "npm run build" to confirm the pipeline still passes. ${NO_SHIP}\nFINDINGS:\n${JSON.stringify(confirmed, null, 2)}`,
    { label: 'fix', phase: 'Fix', model: 'opus', effort: 'high',
      schema: { type: 'object', properties: {
        applied: { type: 'array', items: { type: 'string' } },
        skipped: { type: 'array', items: { type: 'string' } },
        build_passed: { type: 'boolean' },
        summary: { type: 'string' } },
        required: ['applied', 'skipped', 'build_passed', 'summary'] } })
  if (fix) fixReport = fix
}

phase('Test')
const test = await agent(`Current repo: Kamalakar Heart Centre Astro site. Final acceptance test of: ${A.task}. Run checks and report honestly — do NOT fix anything, report only.${CONTEXT}
ALWAYS check first:
1. "rm -rf dist && npm run build" exits 0; sitemap, llms.txt, and canonical verifier all print their success lines; sitemap URL count == llms.txt URL count.
2. "git status --short" — capture the exact change set; flag anything unexpected.
CHANGE-SPECIFIC TEST PLAN:
${A.test_plan || '(none provided — derive assertions from the task description and verify each implemented item in the built dist/ output)'}
Return passed=true ONLY if every assertion holds. List each assertion with ok true/false and detail.`,
  { label: 'test', phase: 'Test', effort: 'high',
    schema: { type: 'object', properties: {
      passed: { type: 'boolean' },
      assertions: { type: 'array', items: { type: 'object', properties: {
        check: { type: 'string' }, ok: { type: 'boolean' }, detail: { type: 'string' } },
        required: ['check', 'ok'] } },
      git_status: { type: 'string' },
      notes: { type: 'string' } },
      required: ['passed', 'assertions', 'git_status'] } })

return {
  task: A.task,
  implementation: { summary: impl.summary, files_created: impl.files_created, files_modified: impl.files_modified, files_deleted: impl.files_deleted, notes: impl.notes || '' },
  deploy_scripts: deployCheck,
  review: { confirmed_findings: confirmed, refuted_count: refuted.length },
  fixes: fixReport,
  test: test || { passed: false, assertions: [], git_status: '', notes: 'test agent failed' },
}
