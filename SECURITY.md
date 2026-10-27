# Security

code-kit runs as Claude Code hooks and a command line: it reads your repository and its git history, and runs the commands your `.claude/code-kit.json` lists as checks.

The rules themselves send nothing over the network. Three features do, and only when you use them:

- **Delegated dependency approvals** (`approvals.delegate.dependencies`): `code-kit approve --delegated` reads each package's metadata and last week's downloads from the npm registry.
- **Teams** (`team` in the config): claims, intents, codeowners and the board go to GitHub through your own `gh`, or to the team provider you configure.
- **Bug reports for code-kit** (`harness.report.on`): a report you choose to send is filed on code-kit's GitHub repository through your own `gh`. Its text is shown to you first, with your project's folders, home folder and email addresses taken out.

To report a vulnerability, use GitHub's private vulnerability reporting on this repository (Security → Report a vulnerability) rather than a public issue. You'll get a reply within a week.

The hooks are a guard rail for agents, not a sandbox. They stop the actions they recognise; they are not a boundary against a person, or a process deliberately working around them. In particular:

- shell commands are judged by their text before they run, and by the files they changed after, so a command written to hide what it does can get past a shell rule, and a file it writes is caught after the command, not before;
- only Edit, Write, NotebookEdit and Bash calls are seen as they happen; other tools, such as an MCP server that writes files, are seen only through what they change in git, by the finish check and `verify`.

## ChatGPT and Codex execution boundary

The new `code-kit-ai` CLI reuses the original rules engine and the read-only `doctor` command. `AGENTS.md` and the OpenAI skill are advisory instructions, not runtime hooks or a filesystem sandbox. A chat with connected GitHub access cannot block unrelated writes or execute local checks without an authorized execution environment. Do not call a skipped, missing, stale or older-SHA check a pass. The repository's CI checks provide the auditable enforcement point.

Project-configured `checks.run` commands execute with the caller's privileges. Treat untrusted configurations, contributed workflow changes and third-party dependencies as executable code; run them only with appropriate isolation and least-privilege credentials. No AI review result alone authorizes deployment, merging, or secret disclosure.
