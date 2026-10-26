#!/usr/bin/env node
// Read-only diagnostics for ChatGPT, Codex and downstream code-kit projects.
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { validate } from '../hooks/lib/config.mjs';

const args = new Set(process.argv.slice(2));
const asJson = args.has('--json');
const self = args.has('--self');
const root = process.cwd();
const checks = [];
const add = (name, status, detail) => checks.push({ name, status, detail });
const path = (rel) => resolve(root, rel);
const has = (rel) => existsSync(path(rel));

const nodeMajor = Number(process.versions.node.split('.')[0]);
add('node', nodeMajor >= 22 ? 'pass' : 'fail', `Node ${process.versions.node}; minimum 22`);

let sha = null;
try {
  execFileSync('git', ['rev-parse', '--is-inside-work-tree'], {
    cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
  });
  add('git', 'pass', 'Git worktree detected');
  try {
    sha = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    add('head', 'warn', 'No HEAD commit yet; evidence cannot be tied to a SHA');
  }
} catch {
  add('git', 'fail', 'Run from a Git repository with git installed');
}

add('AGENTS.md', has('AGENTS.md') ? 'pass' : 'fail', has('AGENTS.md')
  ? 'Repository-level agent instructions found'
  : 'Add AGENTS.md for Codex and connected ChatGPT workflows');

if (self) {
  for (const rel of ['package.json', 'bin/code-kit.mjs', 'bin/code-kit-ai.mjs',
    '.agents/skills/code-kit-verification/SKILL.md', 'docs/openai-integration.md', 'templates/openai/node-project.code-kit.json']) {
    add(rel, has(rel) ? 'pass' : 'fail', has(rel) ? 'Present' : 'Required integration file missing');
  }
} else {
  const conf = '.claude/code-kit.json';
  if (!has(conf)) {
    add('config', 'fail', `Missing ${conf}: code-kit rules are NOT enforced`);
  } else {
    try {
      const problems = validate(JSON.parse(readFileSync(path(conf), 'utf8')));
      add('config', problems.length ? 'fail' : 'pass',
        problems.length ? problems.join('; ') : `${conf} passed schema validation`);
    } catch (error) {
      add('config', 'fail', `Unable to parse ${conf}: ${error.message}`);
    }
  }
  add('skill', has('.agents/skills/code-kit-verification/SKILL.md') ? 'pass' : 'warn',
    has('.agents/skills/code-kit-verification/SKILL.md')
      ? 'Repository verification skill available'
      : 'Optional: install the shared verification skill in .agents/skills/');
}
const fails = checks.filter((c) => c.status === 'fail').length;
const report = { root, sha, mode: self ? 'repository' : 'project', ok: fails === 0, checks };
if (asJson) process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
else {
  process.stdout.write(`code-kit-ai doctor (${report.mode}) at ${sha ?? 'no HEAD'}\n`);
  for (const c of checks) process.stdout.write(`[${c.status.toUpperCase()}] ${c.name}: ${c.detail}\n`);
}
process.exitCode = fails ? 1 : 0;
