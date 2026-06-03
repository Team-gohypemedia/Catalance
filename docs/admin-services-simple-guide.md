# Admin Services Simple Guide

Page: `https://catalance.in/admin/services`

This page is used to manage one service in the platform.

When you change a service here, it can affect 3 things:

1. The service card shown in admin or user-facing flows.
2. The proposal format shown to the client.
3. The internal project JSON used by the system after a project is created.

## 1. Service Basics

### Service ID (Slug)

- Example: `web_development`
- This is the unique system name of the service.
- It is used by the backend to identify the service.
- Keep it short, simple, and stable.
- Best practice: do not change this after creation.

What changes if you modify it:

- A new slug means the system will treat it like a different service.
- Existing references may not match the old service anymore.

### Display Name

- Example: `Web Development`
- This is the readable service name.
- People see this name in the UI.

What changes if you modify it:

- The visible name changes where the service is shown.
- The service identity does not change. Only the label changes.

### Description

- A short explanation of the service.
- Use this to describe what the service covers.

What changes if you modify it:

- The service description text changes wherever this field is shown.

### Icon Name

- Example: `Code`
- This picks the icon for the service card.
- It uses Lucide icon names.

What changes if you modify it:

- Only the service icon changes.

### Status

- `Active & Public` means the service is available for normal use.
- `Draft / Inactive` means the service is saved but should not be publicly active.

What changes if you modify it:

- Active services can be used in live flows.
- Inactive services stay in the system but are not meant for public use.

### Minimum Budget

- This is the lowest allowed budget for this service.
- Example: `50000`

What changes if you modify it:

- If a user gives a lower budget in the guest/project flow, the AI will reject it and ask them to increase it.
- If you keep it `0`, there is no minimum-budget blocking.

### Currency

- Example: `INR`
- This is the currency used with the minimum budget and related proposal budget formatting.

What changes if you modify it:

- Budget messages and formatting use this currency.

## 2. AI Instructions

### AI Context / System Prompt

- This is the main service-specific AI instruction.
- It tells the AI how to behave for this service.
- Use it for service logic, tone, restrictions, must-ask items, and domain-specific rules.

Good use cases:

- Tell the AI what matters for this service.
- Tell the AI what not to assume.
- Add service-specific checks or rules.

What changes if you modify it:

- The AI behavior changes in guest/service-related flows for that service.
- This can change the questions, follow-up logic, and how the AI understands user input.

### Proposal Prompt Rules

- This is extra guidance only for proposal generation.
- It tells the proposal generator what to include, avoid, or emphasize.

Good use cases:

- Focus more on deliverables.
- Avoid overpromising.
- Ask for a business tone.
- Emphasize timeline, scope, or local market context.

What changes if you modify it:

- The final proposal content changes.
- This affects proposal writing, not the basic service identity.

## 3. Client Proposal Structure

This controls the proposal format the client sees and approves.

Simple meaning:

- You are deciding which sections will appear in the final proposal.
- You are also deciding whether each section is a normal text field or a bullet list.

Examples of fields:

- Client Name
- Business Name
- Service Type
- Project Overview
- Primary Objectives
- Features/Deliverables Included
- Launch Timeline
- Budget

### Field Label

- This is the section title.
- Example: `Project Overview`

What changes if you modify it:

- The proposal section name changes.
- The AI will try to fill that section using this label as guidance.

### Output Type

- `Text` means one normal text value.
- `Bullet List` means a list with points.

What changes if you modify it:

- The final proposal layout changes.
- The AI will format the answer differently.

### Field Guidance

- This tells the AI what to write inside that specific field.
- Use simple instructions.

Example:

- For `Project Overview`, you can say: "Keep this to 2-3 lines. Mention the business goal only."

What changes if you modify it:

- Only that field's output changes.
- This is one of the safest ways to improve proposal quality.

### Use Defaults

- This removes the custom client proposal template.
- The system goes back to the default structure for that service type.

### Add Field

- Adds one more section to the client proposal.

### Builder Tab

- Easy UI mode.
- Best for normal editing.

### Raw JSON Tab

- Advanced mode.
- Lets you edit the full field structure as JSON.
- Use this only if the person understands JSON.

### Preview Tab

- Shows a simple preview of how the proposal structure will look.

## 4. Agency Proposal Structure

This controls how the service appears inside a combined agency proposal.

Simple meaning:

- If multiple services are included in one agency flow, this structure helps define this service's part of the combined proposal.

What changes if you modify it:

- The agency-mode proposal layout changes.
- Normal single-service client proposals are not the main target here.

If no custom agency structure is saved:

- The system uses the default agency layout.

## 5. Internal Project JSON Structure

This controls the internal-only `proposalJson` saved on the project.

Simple meaning:

- This is for the system, not for the client.
- It helps automation, matching, downstream logic, and internal project processing.

What changes if you modify it:

- The project's saved structured data changes.
- This can affect later system features that read proposal JSON.

Important:

- Use clear field names.
- Avoid unnecessary field changes unless you know what downstream systems expect.

If no internal structure is saved:

- The system falls back to the service proposal structure.
- If that is also not available, it tries to parse from the final proposal text.

## 6. When To Change What

### If you want to change only the visible service name

- Change `Display Name`

### If you want to change the icon only

- Change `Icon Name`

### If you want the AI to ask/think differently for this service

- Change `AI Context / System Prompt`

### If you want the final proposal wording to improve

- Change `Proposal Prompt Rules`
- Or update `Field Guidance` inside proposal structure

### If you want different proposal sections

- Change `Client Proposal Structure`

### If you want different internal structured project data

- Change `Internal Project JSON Structure`

### If you want to block low-budget projects

- Change `Minimum Budget`

## 7. Safe Editing Rules For New Team Members

- Do not change `Service ID (Slug)` unless absolutely necessary.
- Prefer changing `Display Name`, `Description`, `Prompt Rules`, or `Field Guidance` first.
- Use `Builder` instead of `Raw JSON` unless you are comfortable with JSON.
- If you change internal JSON fields, check whether any automation depends on those field names.
- Keep field names simple and consistent.

## 8. Very Simple Example

If you edit `Web Development` like this:

- `Minimum Budget` from `0` to `50000`
- `Proposal Prompt Rules` to "Focus on business goals, deliverables, and clear timeline."
- `Project Overview` field guidance to "Keep this short and easy to understand."

Then the result is:

- Users cannot continue with a budget below `INR 50,000`.
- The generated proposal becomes more focused on goals and timeline.
- The `Project Overview` section becomes shorter and cleaner.

## 9. Final Summary

Use this page like this:

- `Service Basics` = service identity and visibility
- `AI Instructions` = how AI behaves
- `Client Proposal Structure` = what client sees
- `Agency Proposal Structure` = combined agency proposal layout
- `Internal Project JSON Structure` = what the system saves internally
