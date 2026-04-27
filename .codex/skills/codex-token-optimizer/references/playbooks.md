# Codex Token Optimization Playbooks

## Planning-First Workflow

Use for medium/large work, ambiguous bugs, architecture, migrations, and refactors.

1. Ask a strong model for a compact plan only.
2. Review and trim the plan to files, constraints, acceptance criteria, and tests.
3. Send implementation to Codex with allowed files and stop rules.
4. Ask for terse final output only.

Copy/paste:

```text
Phase 1: plan only. No edits. Identify files, smallest change, risks, test. <=200 words.
Phase 2: implement approved plan only. Stop if scope expands.
```

## Implementation-Only Workflow

Use when the task is already clear.

```text
Implement exactly this: [task].
Allowed files: [paths].
Constraints: minimal diff, no broad refactor, no full-file rewrite.
Test: [command].
Reply: files, tests, blockers only.
```

## Debug Unknown Failure Workflow

Use when logs are available but the cause is unclear.

1. Provide the exact error and expected behavior.
2. Give likely entry files or search terms.
3. Require one hypothesis before broad inspection.
4. Patch only the proven cause.
5. Run the narrowest failing test first.

## Context Reset Workflow

Use when a conversation has become bloated.

```text
Summarize current state for a fresh Codex thread.
Include only:
- goal
- repo facts
- files changed/inspected
- decisions made
- current blocker
- next command/test
Max 250 words. No code blocks unless essential.
```

Then start a new thread with the summary plus the next implementation prompt.

## File Selection Workflow

Use before giving Codex a task:

1. Name known files first.
2. Add search terms/symbols if files are unknown.
3. Add exclude paths for generated/vendor/build output.
4. Add an escalation rule: stop if more files are needed.

Template:

```text
Start with: [files].
Search only for: [symbols/errors].
Ignore: node_modules, dist, build, generated, snapshots unless directly relevant.
If fix needs >3 edited files, stop and return plan.
```

## Full-File Rewrite Prevention

Use when agents often rewrite entire files:

```text
Patch existing code in place. Preserve unrelated formatting and ordering.
Do not rewrite a whole file unless the whole file is generated or the task explicitly requires it.
If a full rewrite seems necessary, stop and explain why first.
```

## AGENTS.md Pruning Workflow

1. Delete generic behavior rules.
2. Keep only rules that are repo-specific, command-specific, path-specific, or repeatedly missed.
3. Convert advice into executable constraints.
4. Keep reply style short.
5. Re-check that every line can change agent behavior.

Good line: `Use pnpm test --filter web for frontend tests.`
Bad line: `Always write robust, maintainable code.`
