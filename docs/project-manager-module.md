# Catalance Project Manager Module

## 1) Folder Structure

### Frontend

`src/modules/project-manager/`

- `components/`
  - `PmShell.jsx`
  - `ProjectCard.jsx`
  - `StatusBadge.jsx`
- `pages/`
  - `DashboardPage.jsx`
  - `ProjectsPage.jsx`
  - `ProjectDetailsPage.jsx`
  - `CalendarPage.jsx`
  - `MarketplacePage.jsx`
  - `MessagesPage.jsx`
  - `ProfilePage.jsx`
  - `ReportsPage.jsx`
  - `ProjectSetupPage.jsx`
- `services/pm-api.js`
- `hooks/use-async-resource.js`
- `constants.js`
- `data/seed.js`

Legacy PM feature files in `src/components/features/project-manager/*` are wrappers to these module pages.

### Backend

`backend/src/`

- `controllers/pm.controller.js` (core PM rule enforcement + compatibility)
- `controllers/pm.module.controller.js` (modular PM API handlers)
- `routes/pm.routes.js`
- `db/schema/project-manager.drizzle.js`
- `db/seed/project-manager.seed.js`

## 2) Database Schema (Drizzle/Neon)

Defined in `backend/src/db/schema/project-manager.drizzle.js`.

### Tables

- `users`
- `project_managers`
- `clients`
- `freelancers`
- `pm_projects` (projects)
- `project_assignments`
- `project_messages`
- `project_message_reads`
- `pm_meetings`
- `pm_meeting_participants`
- `pm_milestones`
- `pm_milestone_approvals`
- `pm_freelancer_internal_reviews`
- `pm_reports`
- `pm_project_handover_checklist`
- `pm_profile_edit_requests`
- `pm_notifications`

### Included

- Enums
- Foreign keys
- Indexes / unique indexes
- Timestamps
- `deleted_at` soft-delete fields where needed
- Relation example (`projectRelations`)
- SQL trigger/check snippets for business rules:
  - PM active projects max 10
  - Meeting overlap prevention
  - Milestone payout phase constraints
  - Project closure only after full handover checklist

## 3) React Page/Component Structure

### Dashboard

- Summary cards (active, issues, unread messages, upcoming meetings)
- Active project cards with status badge, message counts, last activity, milestone progress, meeting indicators
- Upcoming meetings with participant list and relative markers (`Today`, `Tomorrow`, `In 30 mins`)

### Project Details

- Header: title, project id, status, short description, settings/escalation actions
- Tabs: Overview, Messages, Milestones, Deliverables, Project Logs
- Overview: client and freelancer profile blocks with communication + meeting summaries
- Right-side chat panel: PM can read full thread and send as `Project Manager`
- Milestone approval UI with phase lock behavior
- Handover checklist with finalize action gated by all checklist items
- Escalation panel to admin

### Calendar

- Day/week/month view switch
- Meeting list with meeting-type color coding
- Conflict check + server-side conflict API
- Local blocked-slot detection (slot unavailable state in form)
- Suggested alternate slots from conflict endpoint
- Blocked times panel and internal review indicator

### Marketplace

- Search/filter (skills, availability, rating, experience, sort)
- Freelancer cards with rates, rating, skills, availability, internal review snippet
- Actions: direct contact/chat, invite, replace, add internal review
- PM pipeline panel (active invites, unread chats, active interviews)

### Profile/Onboarding

- PM editable profile form
- Pending admin approval state and field-lock rules
- Left menu: profile, incident reports, activity log

### Reports

- Report creation with category/project/title/severity/description/attachments
- Recent reports list with status mapping (`In Review`, `Resolved`, `Escalated`)

### Project Setup

- 4-step flow: details, milestones+budget, team alignment, review+publish
- Milestone total validation must equal 100%
- Success state with project id, budget, timeline, next actions

## 4) API/Service Layer Contract

Base route: `/api/pm/*`

### Dashboard

- `GET /dashboard/summary`
- `GET /projects`

### Projects

- `GET /projects/:id/details`
- `GET /projects/:id/messages`
- `POST /projects/:id/messages`
- `GET /projects/:id/milestones`
- `POST /projects/:id/milestone-approval`
- `POST /projects/:id/escalate`
- `POST /projects/:id/finalize-handover`

### Meetings

- `GET /meetings?view=day|week|month&from=YYYY-MM-DD`
- `POST /meetings/conflicts`
- `POST /meetings`
- `PATCH /meetings/:id/reschedule`

### Freelancers

- `GET /freelancers`
- `POST /freelancers/:freelancerId/invite`
- `POST /projects/:id/replace-freelancer`
- `POST /freelancers/:freelancerId/internal-review`

### Profile

- `GET /profile`
- `POST /profile-update-request`
- `GET /profile-update-request/active`

### Reports

- `GET /reports`
- `POST /reports`
- `GET /reports/:id`

### Notifications

- `GET /notifications`

### Setup Flow

- `POST /projects/setup`

## 5) Core Validation and Constraint Logic

- PM project capacity (`max 10 active`) enforced in setup flow and schema trigger snippets.
- Milestone approval restrictions:
  - only phases 2/3/4 can be PM-approved
  - phase 3 requires phase 2 approved
  - final phase requires phase 3 approved
- Meeting conflicts prevented in create/reschedule API and surfaced in UI.
- PM messages are labeled as `Project Manager`.
- Project closure checks:
  - checklist must be fully verified (including final files delivered)
  - unresolved disputes block closure
  - pending payment issues block closure
  - only assigned PM can finalize closure
- PM profile edits create/update pending admin approval request.

## 6) Seed Data

- Frontend fallback seeds: `src/modules/project-manager/data/seed.js`
  - dashboard cards
  - upcoming meetings
- Backend seed payload shape: `backend/src/db/seed/project-manager.seed.js`
  - users
  - project template
  - milestone defaults

## 7) Drizzle Query Examples (Connection-Ready)

These schema tables are Neon/PostgreSQL-ready and can be queried via Drizzle in your backend service layer.

Example patterns:

- PM active projects with cap:
  - filter by `projectManagerId`, status in active set, `deletedAt is null`, `limit 10`
- Conflict check for meetings:
  - compare `startsAt/endsAt` overlap for same PM and active statuses
- Milestone phase approvals:
  - fetch existing approvals by `projectId`, gate next phase
- Handover close eligibility:
  - read `pm_project_handover_checklist` row and ensure all booleans true before status update

## 8) Dynamic Data Flow Notes

- All PM pages use service functions from `pm-api.js`.
- `useAsyncResource` provides loading/error/refresh lifecycle for state-driven fetches.
- Buttons and actions are connected to backend endpoints (no dead buttons).
- UI has loaders, empty states, and backend-fallback seed behavior for resilience.
