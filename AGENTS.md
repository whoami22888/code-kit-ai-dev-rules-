# AI developer rules — ChatGPT, Codex and Claude Code

This repository is a **Node 22+ ESM rules engine and CLI**. Claude Code hooks are one integration; ChatGPT and Codex use the same verified rules through `AGENTS.md`, a repository skill and the CLI/CI. Do not claim that ChatGPT or Codex automatically executes Claude hooks.

## Start here

- Inspect `package.json`, the applicable files and relevant tests. Read additional docs only when the task requires them.
- Before changes, record the branch, exact HEAD SHA and existing work. Keep each task's edits minimal; preserve unrelated work.
- For repository policy or OpenAI workflow changes, read `docs/openai-integration.md` and use `.agents/skills/code-kit-verification/SKILL.md` when available.
- For hook/CLI changes, inspect only the affected modules in `hooks/lib/`, `hooks/`, `bin/` and relevant tests.
- For any change to rules semantics, compare CLI and hook behavior. Keep one authoritative enforcement implementation instead of duplicating policy across tool-specific adapters.

## Architecture and ownership

- `hooks/lib/`: shared rules, configuration, imports/layers, security, approvals, verification, queue and evidence.
- `hooks/*.mjs` and `hooks/hooks.json`: Claude Code integration, retaining existing compatibility.
- `hooks/mod/`: Claude UI integration. The UI is not a substitute for verification.
- `bin/code-kit.mjs`: existing universal CLI; `bin/code-kit-ai.mjs`: cross-agent CLI entry point.
- `scripts/agent-doctor.mjs`: read-only environment/project contract diagnostics.
- `.agents/skills/code-kit-verification/`: on-demand Codex/ChatGPT-compatible workflow guidance.
- `templates/`: templates for downstream projects; `test/`: unit and end-to-end regression tests.

### Enforcement boundaries

- An `AGENTS.md` or skill is **instructions**, not a sandbox or a pre-tool authorization hook.
- GitHub Actions and `code-kit verify` provide independent checks on repository changes; a required gate must not be skipped or accepted as proof when it was not run.
- Claude-specific pre-tool blocking exists only where Claude hooks are installed. Codex and ChatGPT cannot be assumed to have equivalent blocking.
- Existing project configuration remains `.claude/code-kit.json` for backward compatibility. Never quietly migrate, rename or fork the rule schema. Run `code-kit-ai doctor` and `code-kit-ai check` before using rules against a downstream project.
- Treat missing checks, missing tools, stale CI and stale reviews as unverified. Do not misreport them as passing.
- Preserve attribution, the MIT licence and existing documented Claude usage.

## Working procedure

1. Identify the exact user request, affected paths and current commit; inspect source of truth and active PRs where relevant.
2. Find the root cause. Prefer a focused fix over architecture changes or tests weakened to fit a result.
3. Add a regression test for each behavioral change. Never hide test failures, remove required samples, relax thresholds or inflate timeouts.
4. Run focused tests, then `npm test` for behavior changes. Run `npx prettier --check .` for format verification. For OpenAI entry-point changes, run `npm run test:openai` and `npm run agent:doctor:self`.
5. For project branches with a valid configuration, run `node bin/code-kit-ai.mjs verify --base <base-ref>` at the exact head being reviewed; never claim this check passed for a branch where it could not run.
6. Examine the actual diff, secret exposure and dependencies; report exact results. Code and CI evidence must apply to the current SHA. Do not merge until all applicable required gates are verified.
7. Report: changed files, tests/checks run and results, exact SHA, blockers, and next improvement.

## Core engineering constraints

- No runtime dependencies or build step unless a change is explicitly justified. Node >=22 and ESM are the baseline.
- Existing tests: `test/units.test.mjs` (pure behavior), `test/hooks.test.mjs` (real hooks against temporary Git repos), `test/mod.mjs` (Claude integration).
- Changes to hook behavior require an end-to-end test in `test/hooks.test.mjs`; cross-agent behavior requires `test/openai-dev.test.mjs`.
- Keep `README.md`, CLI help, `SECURITY.md` and templates accurate when interfaces or limitations change.
- A release must update `CHANGELOG.md` with version/date/user-visible changes; no release version bump merely for a development PR.
- Keep credentials out of prompts, commits, logs and workflow outputs. Never auto-deploy or trigger a merge on the strength of an AI message alone.

## Review priorities

Correctness and actual evidence come first: regressions, policy bypass, shell-command safety, protected-path logging, missing verification tools, configuration drift, branch ownership, stale approvals, and changed behavior without tests. Use precise file references and actionable remediation.
