---
name: code-kit-verification
description: Verify changes to a code-kit-governed repository before review or merge; use when a user asks to implement, repair, audit, review, or merge code with ChatGPT or Codex.
---

# Code-kit verification

Use the project `AGENTS.md` and `docs/openai-integration.md` as instructions. This skill is a workflow, not a security boundary.

## Execute

1. Inspect the exact branch, HEAD SHA, working tree, applicable repository `AGENTS.md`, relevant source and tests. Preserve existing uncommitted work.
2. Identify whether the target repository has `.claude/code-kit.json`. Do not assume rules are enabled without it.
3. Run `code-kit-ai doctor --json`, then `code-kit-ai check --json`. Fix missing or invalid configuration instead of declaring rules active.
4. For changed behavior: run focused tests first, then project-required tests, lint, type checks, and security scans. Capture actual command output and exit statuses. Never treat missing tools or skipped checks as success.
5. Run `code-kit-ai verify --base <verified-base-ref> --branch <exact-branch> --json`. On a detached checkout, pass the actual source branch explicitly. Confirm there are no reported problems **and** no skipped required checks; in the project config set `ifMissing: "fail"` for mandatory checks.
6. Validate that GitHub CI, security checks and AI review apply to the **current exact HEAD SHA** before any merge. If a new commit moves HEAD, repeat invalidated checks/reviews. Do not invent results.
7. Report exact SHA, affected files, pass/fail/not-run checks, and remaining blockers. Recommend optimizations only after stating verification status.

## On a code-kit source change

Run `npm run agent:doctor:self`, `npm run test:openai`, `npm test` and `npx --yes prettier@3.9.10 --check .`. For behavior in Claude hooks, extend `test/hooks.test.mjs`. For portable entry points, extend `test/openai-dev.test.mjs`.

## Recovery

If configuration, git history, network, permissions, CI, tools, or device evidence is unavailable, mark that gate **unverified** and report the exact blocker. Do not silently fall back to simulated evidence or bypass enforcement. Reuse previous passing evidence only for the same code SHA and same acceptance scope.
