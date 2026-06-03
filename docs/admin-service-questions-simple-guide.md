# Admin Service Questions Simple Guide

Page: `https://catalance.in/admin/service-questions`

This page is used to manage the question flow for each service.

These questions are important because they help the system:

1. Ask the client the right things.
2. Save useful answers for AI context.
3. Control which question comes next.
4. Improve proposal generation and internal project data.

## 1. What This Page Does

Each service can have its own interview flow.

Example:

- Web Development can ask about pages, timeline, and budget.
- SEO can ask about target location, goals, and duration.
- Branding can ask about brand stage and deliverables.

So this page is where you design that flow.

## 2. Left Side Service List

This section shows all services.

### Search Services

- Use this to quickly find a service.

What changes if you use it:

- Nothing is saved.
- It only helps you find the service faster.

### Service Card

Each card shows:

- Service name
- Service ID
- Active or Draft status
- Number of questions

What happens when you click it:

- That service becomes selected.
- Its question flow loads on the right side.

## 3. Top Summary Area

When a service is selected, you will see some counts.

### Questions

- Total number of questions in this service flow.

### AI Context

- Number of questions where `Save Response for AI Context` is turned on.

### Branches

- Number of logic rules that send users to different questions.

### Selections

- Number of choice-based questions like single select or multi select.

These numbers are just for quick understanding.
They do not change anything by themselves.

## 4. List View And Flow View

### List View

- Shows all questions as cards.
- Best for editing details.
- You can drag cards to reorder them.

### Flow View

- Shows the question path as a visual map.
- Best for checking branches and jumps.
- Click any node to edit that question.

What changes if you switch views:

- Nothing is saved.
- It only changes how you look at the same question flow.

## 5. Copy Flow

- This copies the full question flow to clipboard.
- It includes a readable list and the raw JSON config.

What changes if you click it:

- No data changes.
- It only copies the flow for sharing or review.

## 6. Add Question

- This opens the question form.
- Use this to create a new step in the service interview.

What changes if you save:

- A new question is added to that service.
- By default, new questions are added at the end of the flow.

## 7. Reordering Questions

In list view, you can drag question cards up or down.

What changes if you reorder:

- The default question sequence changes.
- If there is no jump logic, users move in this order.

Important:

- Reordering changes the normal flow.
- But custom branch logic can still jump to a different question.

## 8. Each Question Card Means

Each saved question card shows:

- Question ID
- Question type
- Whether it is optional
- Whether the answer is saved for AI context
- Branch count or next jump

This helps you quickly understand the flow without opening the editor.

## 9. Question Form Fields

When you click `Add Question` or edit a question, a dialog opens.

### Question ID (Slug)

- Example: `project_timeline`
- This is the internal system name for the question.
- It should be unique inside that service.

What changes if you modify it:

- The system uses this ID for logic and jumps.
- If you rename it, any old references may need updating.

Best practice:

- Keep it simple, lowercase, and stable.

### Input Type

There are 3 types:

- `Text Input`
- `Single Selection (Radio)`
- `Multiple Selection (Checkbox)`

What each one means:

- `Text Input`: user types a free answer
- `Single Selection`: user chooses one option
- `Multiple Selection`: user can choose many options

What changes if you modify it:

- The answer format changes.
- The front-end asking style changes.
- Branching rules may also behave differently depending on options.

### Question Text

- This is the actual question shown to the user.
- Example: `What is your estimated budget for this project?`

What changes if you modify it:

- The wording the client sees changes.
- This can strongly affect answer quality.

Best practice:

- Keep it short and very clear.

### Subtitle (AI Context)

- This is hidden from the user.
- It is internal guidance for the AI.
- It explains the intent of the question or how to interpret the answer.

What changes if you modify it:

- The AI gets better context for understanding this answer.
- This can improve downstream proposal quality and answer handling.

Special note:

- This field supports internal directives like `@prioritize:`, `@recommend:`, `@reply:`, `@validate:`, and `@map:`.
- New team members should only edit these if they understand how they are used.

### This Question Is Required

- If checked, the user is expected to answer it.
- If unchecked, the question is optional.

What changes if you modify it:

- The flow becomes stricter or more flexible.

### Save Response for AI Context

- If checked, the answer is saved for later AI use.
- This means the answer can help proposal generation or other AI decisions later.

What changes if you modify it:

- The answer becomes part of the AI context for that service flow.
- If unchecked, the answer may still help in the moment, but it is not saved as useful downstream context in the same way.

Best use:

- Turn this on for important business information, scope, goals, budget, timeline, platform, deliverables, and similar details.

## 10. Answer Options

This section appears only for:

- `Single Selection`
- `Multiple Selection`

### Add Option

- Adds one selectable answer.

### Option Text

- This is what the user will see and choose.

What changes if you modify options:

- The available answers change.
- Branching rules may also need updates if they depend on those option values.

Important:

- If you rename an option that is already used in a branch rule, check the logic rules too.

## 11. Default Next Question

- This is an optional manual jump.
- If set, the flow goes to that selected question instead of just the next one in order.

If left empty:

- The flow goes to the next question in sequence.

What changes if you modify it:

- The normal path after this question changes.

Important:

- Advanced branching logic takes priority over this.

## 12. Branching Logic

This is the advanced routing system.

Use it when different answers should lead to different next questions.

Example:

- If user selects `Android and iOS`, go to mobile feature questions.
- If user selects `Website Only`, skip app-related questions.

### Add Rule

- Adds one branch rule.

### Condition

Available conditions:

- `Equals`
- `Not Equals`
- `Contains`

What it means:

- `Equals`: exact match
- `Not Equals`: anything except that match
- `Contains`: useful when the answer includes certain words

### Value

- This is the answer value the rule checks.
- For option questions, it usually matches one option label.
- For text questions, it matches entered text.

### Jump To

- This selects which question should come next if the rule matches.

What changes if you modify branch rules:

- The interview path changes.
- Different users may see different next questions based on their answers.

Important:

- Branching rules override the normal sequence.
- Bad logic setup can send users to the wrong place or skip important questions.

## 13. Edit Question

- Opens the same form with the existing data.

What changes if you save:

- That question is updated.
- This can affect answer format, flow order, AI context, and proposal quality.

## 14. Delete Question

- Permanently removes the question from that service.

What changes if you delete:

- That step disappears from the service flow.
- Any jumps pointing to that question may break the intended flow.

Best practice:

- Before deleting a question, check whether other questions jump to it.

## 15. How Question Flow Actually Works

The system generally follows this order:

1. Ask the current question.
2. If a branch rule matches, jump to that target question.
3. If no branch rule matches but `Default Next Question` is set, go there.
4. Otherwise, go to the next question in list order.

This is the easiest way to understand the page.

## 16. When To Change What

### If you only want to improve the wording

- Change `Question Text`

### If you want better AI understanding

- Change `Subtitle (AI Context)`
- Or enable `Save Response for AI Context`

### If you want the question to become optional

- Uncheck `This question is required`

### If you want fixed answer choices

- Change `Input Type` to single or multi select
- Then add `Answer Options`

### If you want users to go to a different next question

- Change `Default Next Question`

### If you want different paths based on different answers

- Add `Branching Logic`

## 17. Safe Editing Rules For New Team Members

- Do not rename `Question ID` unless necessary.
- Keep question text short and direct.
- Turn on `Save Response for AI Context` only for useful answers.
- If you change options, review branch rules too.
- If you delete a question, check whether other questions jump to it.
- Use `Flow View` to double-check the full path after making branch changes.

## 18. Very Simple Example

Suppose you create this question:

- Question ID: `platform_choice`
- Input Type: `Single Selection`
- Question Text: `Which platform do you need?`
- Options:
  - `Website`
  - `Android App`
  - `iOS App`
  - `Android and iOS`
- Save Response for AI Context: `On`

Then add branch rules:

- If answer equals `Website` -> jump to `website_pages`
- If answer equals `Android and iOS` -> jump to `app_features`

Result:

- Website users see website questions next.
- App users see app questions next.
- The selected platform is also saved for AI context.

## 19. Final Summary

Use this page like this:

- `Service selection` = choose which service flow you are editing
- `List view` = edit and reorder questions
- `Flow view` = visually check branches
- `Question Text` = what the user sees
- `Subtitle (AI Context)` = hidden AI guidance
- `Save Response for AI Context` = store useful answers for later AI use
- `Default Next Question` = basic jump control
- `Branching Logic` = advanced answer-based routing
