---
name: codex-token-optimizer
description: optimize codex, claude code, cursor, copilot, and other ai coding-agent workflows for lower token usage without sacrificing correctness. use when users ask to reduce token consumption, implement caveman-style replies, compress coding prompts, clean or create agents.md, set file-selection guardrails, prevent full-file rewrites, route work across models, or diagnose why coding agents burn context or hit usage limits.
---

# Codex Token Optimizer

## Mission

Reduce coding-agent token usage while preserving correctness, reviewability, and code quality. Prioritize high-leverage savings in this order:

1. **Scope and context**: fewer files, targeted search, no broad repo ingestion.
2. **Diff size**: patch small areas, avoid full-file rewrites.
3. **Workflow shape**: plan once, implement from a compact plan, split large tasks.
4. **Reply style**: terse output contracts, no pasted full files.
5. **Model routing**: strong model for ambiguity, cheaper/faster model for clear execution.

Never make a prompt so short that it loses constraints, file paths, errors, acceptance criteria, or safety-critical instructions.

## Default Procedure

1. **Classify the user request**
   - Prompt compression → return an optimized coding-agent prompt.
   - AGENTS.md creation/cleanup → return a minimal instruction file or patch.
   - Token audit → identify biggest leaks and fixes.
   - Workflow design → produce a repeatable plan/implement/test loop.
   - Codex settings/instructions → provide drop-in reply and edit rules.

2. **Preserve non-negotiables**
   Keep file paths, APIs, schemas, commands, versions, errors, current/expected behavior, acceptance criteria, test commands, constraints, and “do not” rules.

3. **Delete or compress waste**
   Remove pleasantries, duplicate context, motivational wording, generic best practices, vague quality goals, long explanations, and repeated instructions.

4. **Add token guardrails**
   Apply explicit limits on files, searches, diffs, replies, and escalation points.

5. **Return a usable artifact**
   Prefer drop-in prompts, AGENTS.md content, or patch blocks over essays.

## Token Guardrails to Add

Use these when optimizing coding-agent prompts:

```text
Token rules:
- Use targeted search first. Read only files needed for this task.
- Do not scan the whole repo unless the plan proves it is necessary.
- Make minimal diffs. Do not rewrite full files unless required.
- Before editing >3 files, adding dependencies, or refactoring broadly, stop and return a short plan + file list.
- Do not paste full files in replies.
- Reply only: changed files, commands run, test result, blockers.
```

For very small tasks, tighten further:

```text
Budget: inspect <=3 files, edit <=2 files, reply <=120 words.
```

## Budget Ladder

Use this to right-size prompts and model choice:

| Task size | Examples | Default guardrail |
|---|---|---|
| Tiny | typo, one CSS tweak, one failing assertion | inspect <=2 files, edit <=1 file, no plan unless blocked |
| Small | localized bug, simple UI state fix | inspect <=5 files, edit <=3 files, run one focused test |
| Medium | feature touching a few modules | plan first, then implement; edit <=6 files unless approved |
| Large | architecture, migrations, refactors, unknown failures | strong-model plan first; split into phases; implement phase-by-phase |

## Prompt Compression Rules

When rewriting a prompt:

- Convert paragraphs into fields: `Task`, `Scope`, `Context`, `Constraints`, `Done when`, `Reply`.
- Replace vague requests with observable acceptance criteria.
- Add allowed files/directories when known.
- Add explicit exclusions when risk or token waste is likely.
- Add a stop rule before broad refactors or more than 3 edited files.
- Keep “caveman” style terse but specific. Do not produce vague prompts like “fix app, be brief.”

Default output:

```markdown
## Optimized prompt
[drop-in prompt]

## Key changes
- [1-3 bullets: scope/diff/reply/model savings]
```

If the user asks for maximum brevity, return only the optimized prompt.

## AGENTS.md Surgery

When creating or cleaning `AGENTS.md`:

- Target **20-60 lines**. Longer only for real repo-specific constraints.
- Include project facts, commands, generated-file rules, test rules, path-specific conventions, and repeated agent mistakes.
- Delete generic rules: “write clean code,” “use best practices,” “be careful,” “explain everything,” “add comments.”
- Prefer path-specific rules over global rules.
- Keep reply rules short and operational.
- Do not add policies the agent cannot verify or execute.

Default `AGENTS.md` sections:

```markdown
# AGENTS.md

## Project facts
## Commands
## Edit rules
## Path rules
## Reply rules
```

See `references/templates.md` for drop-in templates and before/after examples.

## Model Routing

Recommend this split when useful:

- **High/strong reasoning**: ambiguous planning, architecture, unfamiliar failures, security-sensitive changes, large refactors, migrations.
- **Medium/default**: normal implementation from a clear plan, local bugs, tests, moderate features.
- **Mini/small**: formatting, repetitive edits, simple file moves, docs, prompt compression, small test updates.

Do not use maximum reasoning for every small task. Do not use low reasoning for ambiguous debugging just to save tokens; failed attempts often cost more.

## Token Audit Checklist

Diagnose in this order:

1. **Scope leak**: task too broad or acceptance criteria missing.
2. **Context leak**: agent reads whole repo, too many files, or pasted full files.
3. **Diff leak**: full-file rewrites, broad refactors, unnecessary formatting churn.
4. **Prompt leak**: repeated context, vague requirements, missing stop conditions.
5. **Instruction leak**: bloated AGENTS.md or generic behavior rules.
6. **Reply leak**: verbose summaries, huge code excerpts, repeated explanations.
7. **Model leak**: high reasoning used for routine execution, or weak model used repeatedly on hard planning.

## Output Contracts

### Optimized prompt
Return the prompt first. Briefly explain only high-impact changes.

### AGENTS.md
Return the complete proposed file content unless the user asked for a diff or critique.

### Token audit
Use:

```markdown
## Biggest leaks
1. [leak] → [fix]
2. [leak] → [fix]
3. [leak] → [fix]

## Drop-in fix
[prompt, AGENTS.md patch, or workflow]
```

### Workflow advice
Return a short procedure with copy/paste prompts for each phase.

## Reference Files

- Use `references/templates.md` for reusable prompt, AGENTS.md, audit, and settings templates.
- Use `references/playbooks.md` for detailed workflows: planning-first, implementation-only, debugging, refactor containment, and context reset.

## Style

Be compact and practical. Favor artifacts over commentary. Mention tradeoffs only when they affect correctness, cost, or risk.
