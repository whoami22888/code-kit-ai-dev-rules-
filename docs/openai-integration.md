# ChatGPT and Codex integration

This fork preserves code-kit's MIT-licensed Claude Code hook implementation and exposes its existing Node 22+ CLI to ChatGPT and Codex. It **does not** convert Claude hook events into OpenAI hooks or make plain-text prompts enforceable.

## What actually runs

| Surface | Instructions | Enforcement | Limitation |
| --- | --- | --- | --- |
| Codex CLI / IDE / cloud | Root `AGENTS.md` and repo-local `.agents/skills/code-kit-verification/SKILL.md` when the environment loads them | Execute `code-kit-ai` locally or in CI | Skills/AGENTS are guidance; pre-tool blocking is not provided here |
| ChatGPT with repository access / Work | Read `AGENTS.md`, selected docs, skill, source and current PR | Connected GitHub checks; run CLI only in an available execution environment | Standard chat cannot directly execute local repo hooks |
| GitHub Actions | Workflow YAML and reviewed configuration | Tests and `code-kit verify` where a downstream project config is installed | Requires real workflow execution, passing status and matching HEAD |
| Claude Code | `CLAUDE.md`, plugin skills and hooks | Existing pre/post-tool hook checks plus CLI | Hooks protect only supported tool actions and are not a sandbox |

The authoritative downstream policy is still `.claude/code-kit.json`. Do not duplicate it into `.codex/` or `.agents/` or claim a Codex equivalent of `PreToolUse`. `AGENTS.md` defines behavior, whereas CLI/CI validate the checked-out code.

## Using this source repository

Requires Node >=22 and git. From the repository root:

```bash
node bin/code-kit-ai.mjs doctor --self --json
node --test test/openai-dev.test.mjs
npm test
npx prettier --check .
```

The wrapper delegates all existing commands to `bin/code-kit.mjs`; `doctor` runs a separate read-only compatibility check. No new SDK, API key, hosted model or runtime dependency is required.

## Using these rules in a project

Copy the approved configuration template/setup from the existing code-kit documentation to `<project>/.claude/code-kit.json` and configure checks with `ifMissing: "fail"` for tools required in CI. Install or reference this package in the project and make the `code-kit-ai` command available. Keep a project-specific `AGENTS.md` and optionally copy this skill into `.agents/skills/code-kit-verification/`.

Then from the **project root**:

```bash
code-kit-ai doctor --json
code-kit-ai check --json
code-kit-ai verify --base origin/main --branch <actual-branch> --json
```

**Branch ownership matters:** the original verifier associates lane permissions with branch names of the form `<configured-lane>/<story>` (or `lead/<story>`). An arbitrary `codex/*` branch has no lane association and will not get the same lane-path enforcement. Use a branch with the configured lane prefix or mark lane ownership as unverified; an unrecognised prefix must not be counted as full policy compliance.\n\nNever run `verify` against an invented base or without a populated git history. `verify` checks tracked changes since the merge base and may list skipped checks: inspect `skipped` in JSON output and do not accept required skips. For pull requests, run it in a full checkout with base history available; inspect the current PR head and ensure CI gates are required by branch protection or a fail-closed merge controller.

For ChatGPT without shell access, have it review `AGENTS.md`, inspect relevant source and GitHub results, and report any execution gate as unverified. For Codex with shell access, run the commands above instead of merely promising to follow the skill.

## Collaboration model

Use one branch or worktree per independent task and explicit ownership for overlapping paths. Planner identifies scope and acceptance; implementer makes minimal change; tester supplies reproducible evidence; AI reviewer examines exact-head diff and adverse cases. A review is not a test result, and a passing test from an older SHA is not evidence for changed files.

Failures are classified as code defect, infrastructure, flaky environment, missing dependency or unverified check. Root-cause fixes get regression coverage. Keep a compact summary with exact SHA, command, outcome, and next action so recovery does not repeat successful work.

## Security and compatibility

The repository is a fork of Warren Langeveldt's code-kit and retains upstream attribution and licence. Existing `hooks/hooks.json`, the `hooks/lib/` rules engine, `CLAUDE.md` consumers and `code-kit` CLI remain supported. Do not execute untrusted repository check commands outside an isolated, authorized environment. Keep secrets out of commits and logs, require least-privilege CI permissions, and do not automatically deploy or merge from a free-text AI claim.

## Candidate follow-on work

A real provider-neutral rule schema migration, typed adapters for OpenAI Agents SDK tool approvals, sandboxed command execution, structured verification manifests, caching keyed by SHA/inputs, and automated PR review/repair orchestration are future implementation work; none is implied by this compatibility layer.
