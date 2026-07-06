---
name: changes-review-confirm
description: "Run any non-trivial site change through the saved multi-agent pipeline: implement → deploy-scripts check → multi-lens review → adversarial verify → fix → acceptance test, then deploy from the main conversation only if everything passes. Trigger: 'changes-review-confirm', 'run the change pipeline', 'implement and review', 'make this change safely', or any substantive change the user wants implemented with review before deploy."
version: "1.0.0"
---

# Changes-Review-Confirm Pipeline

You orchestrate the saved workflow at `.claude/workflows/changes-review-confirm.js` for the Kamalakar Heart Centre website. The workflow implements a change, checks the deploy pipeline, reviews it through independent lenses with adversarial verification of every finding, fixes what is confirmed, and runs an acceptance test. **It never deploys** — you own the deploy decision afterwards.

## How to run it

Invoke the Workflow tool with the saved workflow and a fully specified `args` object:

```
Workflow({
  name: "changes-review-confirm",
  args: {
    task: "<one-line description>",
    instructions: "<detailed implementation instructions: file paths, exact edits, constraints, what NOT to touch>",
    context: "<optional: authoritative facts / forbidden claims relevant to this change>",
    check_deploy: true,                    // false only for pure content edits
    deploy_notes: "<optional: change-specific deploy checks>",
    lenses: [                              // optional; omit for the 3 defaults
      { key: "correctness", prompt: "..." },
      ...
    ],
    test_plan: "<numbered acceptance assertions the Test agent must verify in dist/>"
  }
})
```

## Rules (do not weaken)

1. **Author `instructions` and `test_plan` yourself, thoroughly, before launching.** Do the scouting (grep, read files, check live site) in the main conversation first; the workflow agents should receive file:line-precise instructions, not research tasks.
2. **Implement/Deploy-check/Fix phases run on Opus** — this is encoded in the workflow; don't override to a smaller model.
3. **The workflow never commits, pushes, or deploys.** After it returns:
   - Read the full result (review findings, fix report, test assertions).
   - Distinguish genuine failures from pre-existing issues — only failures **caused by the change** block deployment.
   - If checks pass: commit with a descriptive message, push, then deploy via the `deploy-verify` skill (which includes post-deploy verification).
   - If checks fail: report to the user with the failing assertions; do not deploy.
4. **CLAUDE.md policies always apply** — canonical/trailing-slash rules, sitemap/llms.txt regeneration, authoritative clinic facts, forbidden claims (success-rate stats, named insurers, EECP, "Assistant Professor"). Pass the relevant ones in `context`.
5. **Structural changes** (new/renamed/removed pages, redirect changes, robots edits) additionally require the structural-change checklist in the `deploy-verify` skill before commit.
6. Report the outcome to the user as a table: implementation summary, confirmed/refuted finding counts, fix list, test assertion results, deploy status.

## Where things live

| Item | Path |
|---|---|
| Workflow script (source of truth) | `.claude/workflows/changes-review-confirm.js` |
| Deploy + post-deploy verification | `.claude/skills/deploy-verify/SKILL.md` |
| Site policies & authoritative facts | `CLAUDE.md` |

## History

- 2026-07-06 — first (ad hoc) run: converted static llms.txt to build-time generation. 15 agents, 5 confirmed findings fixed pre-deploy, deployed clean.
