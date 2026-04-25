# Codex Token Optimization Templates

## Compact Coding-Agent Prompt

```text
Task: [one sentence]

Scope:
- Include: [paths/symbols]
- Exclude: [paths/features]

Context:
- Current: [behavior/error]
- Expected: [behavior]
- Relevant facts: [APIs/schema/version]

Constraints:
- Minimal diff. No full-file rewrites unless required.
- Use targeted search first; read only needed files.
- Do not change public API/schema unless required.
- Stop and ask/plan before editing >3 files, adding deps, or broad refactor.
- Do not paste full files in reply.

Done when:
- [acceptance criterion]
- `[test/build command]` passes

Reply only:
- Changed files
- Commands run + result
- Blockers
```

## Ultra-Compact Tiny Task Prompt

```text
Fix: [bug/change].
Files: [allowed paths].
Rules: inspect <=3 files, edit <=2 files, minimal diff, no full-file rewrite.
Test: [command].
Reply: files changed, test result, blockers only. <=120 words.
```

## Planning Prompt Before Implementation

```text
Plan only. No code edits.
Goal: [goal]
Known files: [paths]
Return under 200 words:
1. Files to inspect/edit
2. Minimal plan
3. Risks/unknowns
4. Test command
Stop if more than 6 files seem needed.
```

## Implementation Prompt From Plan

```text
Implement this plan: [compact plan]
Allowed files: [paths]
Rules: minimal diff, patch only, no broad refactor, no full-file rewrite.
If the plan is wrong or needs >3 extra files, stop and report why.
Test: [command]
Reply: changed files, commands run + result, blockers only.
```

## Debugging Prompt

```text
Debug this failure with minimum context.
Failure: [error/log]
Expected: [expected behavior]
Start files/search terms: [paths/symbols]
Rules:
- Form one likely hypothesis first.
- Inspect only files needed to prove/fix it.
- Patch smallest cause, not surrounding code.
- No formatting churn or broad refactor.
Test: [focused command]
Reply: root cause, changed files, test result, blockers. <=180 words.
```

## Refactor Containment Prompt

```text
Refactor only: [specific target].
Do not change behavior.
Allowed scope: [paths].
Preserve public API, tests, snapshots, schema, routes.
Make mechanical, minimal commits/diffs.
If behavior change is required, stop and explain.
Validate with: [command]
Reply: changed files, validation result, blockers only.
```

## Prompt Compressor Prompt

Use this in ChatGPT before sending to Codex:

```text
Rewrite my coding-agent prompt for minimum token use without losing requirements.
Keep: paths, commands, errors, constraints, acceptance criteria, versions, expected behavior.
Add guardrails: targeted search, minimal diff, no full-file rewrites, stop before broad scope.
Output only the optimized prompt.

Prompt:
[paste prompt]
```

## Minimal AGENTS.md Template

```markdown
# AGENTS.md

## Project facts
- [framework/runtime/package manager]
- [important architecture fact]

## Commands
- Install: `[command]`
- Dev: `[command]`
- Test: `[command]`
- Lint/typecheck: `[command]`

## Edit rules
- Prefer minimal diffs. Do not rewrite full files unless necessary.
- Do not edit generated files: [paths]
- Keep changes within requested scope.
- Before editing more than 3 files for one task, return a short plan first.

## Path rules
- `[path]`: [specific convention]
- `[path]`: [specific convention]

## Reply rules
- Be terse.
- Include changed files, commands run, test result, blockers.
- Do not paste full files unless asked.
```

## Codex Custom Instructions / Settings

```text
Be terse and operational.
For coding tasks:
- Use targeted search first. Read only files needed.
- Prefer minimal diffs. Do not rewrite full files unless required.
- Stop and return a short plan before broad refactors, dependency changes, or editing >3 files.
- Do not paste full files in replies.
- Final reply only: changed files, commands run + result, blockers.
```

## AGENTS.md Cleanup Rules

Delete lines like:

```text
write clean code
follow best practices
be careful
add helpful comments
make sure the app works
explain everything you did
always produce high quality code
```

Replace broad rules with operational rules:

```text
Use pnpm, not npm.
Run pnpm test --filter web before final reply.
Do not edit prisma/generated/**.
For UI changes, modify app/components/** before creating new components.
Do not update snapshots unless the user asks.
```

## Before / After Prompt Example

Before:

```text
Can you look through the app and fix the login bug? Please make sure it is high quality and explain everything you changed.
```

After:

```text
Fix login redirect bug.
Start: src/auth/**, src/routes/login.tsx.
Expected: after login, user lands on previous protected route.
Rules: targeted search only, minimal diff, no full-file rewrites. Stop before editing >3 files.
Test: npm test -- login redirect.
Reply: changed files, test result, blockers only.
```

## Caveman Reply Rule

```text
Reply style: no preamble, no compliments, no long summary.
Final format:
- Files: [changed]
- Tests: [command/result]
- Blockers: [none or list]
```

## Token Audit Output

```markdown
## Biggest leaks
1. [leak] → [fix]
2. [leak] → [fix]
3. [leak] → [fix]

## Optimized workflow
[compact workflow]

## Drop-in prompt / AGENTS.md patch
[artifact]
```

## Token Leak Fix Matrix

| Leak | Symptom | Fix |
|---|---|---|
| Broad scope | agent reads many unrelated files | define include/exclude paths and stop rule |
| Missing acceptance criteria | agent explores/guesses | add “done when” checks |
| Full-file rewrites | huge diffs, formatting churn | require patch-only, preserve formatting |
| Verbose replies | long explanations/code dumps | set final reply contract |
| Bloated AGENTS.md | generic rules consume context every run | keep only repo-specific rules |
| Wrong model | many retries or overthinking small edits | plan with strong model, execute with medium/small |
