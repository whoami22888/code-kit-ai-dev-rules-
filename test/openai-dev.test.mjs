import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const doctor = join(root, 'scripts/agent-doctor.mjs');
const entry = join(root, 'bin/code-kit-ai.mjs');
const run = (file, args, cwd) =>
  spawnSync(process.execPath, [file, ...args], { cwd, encoding: 'utf8' });

test('source integration is complete and diagnostics are read-only', () => {
  const result = run(entry, ['doctor', '--self', '--json'], root);
  assert.equal(result.status, 0, result.stderr + result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.ok, true);
  assert.ok(report.checks.some((c) => c.name === 'AGENTS.md' && c.status === 'pass'));
});

test('project without config fails closed instead of claiming enforcement', () => {
  const dir = mkdtempSync(join(tmpdir(), 'code-kit-openai-'));
  try {
    writeFileSync(join(dir, 'AGENTS.md'), '# Project\n');
    const result = run(doctor, ['--json'], dir);
    assert.equal(result.status, 1, result.stderr + result.stdout);
    const report = JSON.parse(result.stdout);
    assert.equal(report.ok, false);
    assert.match(report.checks.find((c) => c.name === 'config').detail, /NOT enforced/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('valid configured project passes portable diagnostics', () => {
  const dir = mkdtempSync(join(tmpdir(), 'code-kit-openai-'));
  try {
    mkdirSync(join(dir, '.claude'));
    writeFileSync(join(dir, 'AGENTS.md'), '# Rules\n');
    writeFileSync(join(dir, '.claude/code-kit.json'),
      readFileSync(join(root, 'test/fixture.json'), 'utf8'));
    // The doctor still requires git history access; create a real checkout without a commit.
    assert.equal(spawnSync('git', ['init', '-q'], { cwd: dir }).status, 0);
    const result = run(doctor, ['--json'], dir);
    assert.equal(result.status, 0, result.stderr + result.stdout);
    const report = JSON.parse(result.stdout);
    assert.equal(report.ok, true);
    assert.equal(report.checks.find((c) => c.name === 'config').status, 'pass');
    assert.equal(report.checks.find((c) => c.name === 'head').status, 'warn');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('invalid config fails and CLI forwards child exit status', () => {
  const dir = mkdtempSync(join(tmpdir(), 'code-kit-openai-'));
  try {
    mkdirSync(join(dir, '.claude'));
    writeFileSync(join(dir, 'AGENTS.md'), '# Rules\n');
    writeFileSync(join(dir, '.claude/code-kit.json'), '{bad json');
    const result = run(entry, ['doctor', '--json'], dir);
    assert.equal(result.status, 1);
    assert.equal(JSON.parse(result.stdout).checks.find((c) => c.name === 'config').status, 'fail');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('wrapper forwards the original code-kit CLI help and rejects unknown commands', () => {
  const help = run(entry, ['--help'], root);
  assert.equal(help.status, 0);
  assert.match(help.stdout, /code-kit-ai verify/);
  const invalid = run(entry, ['not-a-code-kit-command'], root);
  assert.notEqual(invalid.status, 0);
});

test('shipped Node project starter is valid and requires missing checks to fail', () => {
  const template = JSON.parse(readFileSync(join(root, 'templates/openai/node-project.code-kit.json'), 'utf8'));
  assert.equal(template.version, 1);
  assert.ok(template.checks.length);
  assert.ok(template.checks.every((check) => check.ifMissing === 'fail'));
  const dir = mkdtempSync(join(tmpdir(), 'code-kit-openai-template-'));
  try {
    mkdirSync(join(dir, '.claude'));
    writeFileSync(join(dir, 'AGENTS.md'), '# Rules\n');
    writeFileSync(join(dir, '.claude/code-kit.json'), JSON.stringify(template));
    assert.equal(spawnSync('git', ['init', '-q'], { cwd: dir }).status, 0);
    const result = run(doctor, ['--json'], dir);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(JSON.parse(result.stdout).ok, true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
