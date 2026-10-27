#!/usr/bin/env node
// Cross-agent entry point. Use the existing code-kit rules engine, never a second policy implementation.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const [command, ...args] = process.argv.slice(2);
if (!command || ['help', '--help', '-h'].includes(command)) {
  process.stdout.write([
    'Usage: code-kit-ai doctor [--self] [--json]',
    '       code-kit-ai check [--json]',
    '       code-kit-ai verify --base <ref> [--branch name] [--json]',
    '       code-kit-ai <other code-kit command and options>',
    '',
    'Rules remain in .claude/code-kit.json. ChatGPT/Codex instructions do not',
    'replace enforceable GitHub CI checks or Claude Code hooks.',
    '',
  ].join('\n'));
  process.exit(0);
}
const target = command === 'doctor'
  ? resolve(here, '../scripts/agent-doctor.mjs')
  : resolve(here, 'code-kit.mjs');
const input = command === 'doctor' ? args : [command, ...args];
const result = spawnSync(process.execPath, [target, ...input], { stdio: 'inherit' });
if (result.error) {
  process.stderr.write(`code-kit-ai: ${result.error.message}\n`);
  process.exit(1);
}
if (result.signal) {
  process.stderr.write(`code-kit-ai: child stopped by ${result.signal}\n`);
  process.exit(1);
}
process.exit(result.status ?? 1);
