# Project Manager Module Guide

This document explains the full Project Manager section in the website:

- which slug opens which page
- where login exists
- whether registration exists
- what is available from admin side
- how each page works
- how the main flows connect
- which frontend files and backend endpoints power the section

## 1. Module Entry Points

Project Manager frontend routes are defined in `src/App.jsx`.

Main PM page files live in:

- `src/modules/project-manager/pages/`
- `src/modules/project-manager/services/pm-api.js`

PM backend routes live in:

- `backend/src/routes/pm.routes.js`
- `backend/src/controllers/pm.controller.js`
- `backend/src/controllers/pm.module.controller.js`
- `backend/src/middleware/pm.middleware.js`

## 2. Important Auth Reality

## PM Login Page

- Slug: `/project-manager/login`
- Component: `src/components/features/project-manager/PMLogin.jsx`

This is the dedicated login page for project managers.

What it does:

1. Takes `email` and `password`.
2. Calls the shared `login()` API.
3. Accepts access only when user role is `PROJECT_MANAGER` or `ADMIN`.
4. Stores session through `AuthContext`.
5. Redirects to:
   - `location.state.redirectTo` if provided
   - otherwise `/project-manager`

## PM Register Page

There is no dedicated Project Manager registration page in the current frontend code. Public signup exists at `/signup`, but it only supports `CLIENT` and `FREELANCER`. This is controlled by `src/components/features/auth/forms/SignupRoleSelect.jsx` and `src/components/features/auth/forms/Signup.jsx`. So PM accounts are not created through the public website registration flow in this repo.

## Admin Side Visibility

Yes, Project Managers are visible from the admin side at `/admin/project-managers`. In `src/App.jsx`, that route is registered and loads `src/components/features/admin/AdminDisputes.jsx`. That page fetches PM users using `GET /admin/users?role=PROJECT_MANAGER`, shows the PM list, and after selecting one PM it shows:

- assigned projects
- disputes assigned to that PM

## Can Admin Add Project Manager?

In this codebase, there is no completed admin "Add Project Manager" flow.

What is present:

- admin can view PMs
- admin can filter PMs
- admin can view PM-linked projects/disputes
- admin can update user status

What is not present:

- no "Add Project Manager" button in `AdminDisputes.jsx`
- no PM creation form in admin UI
- no backend admin API to create a PM directly
- no backend role update path that allows setting `PROJECT_MANAGER` in `updateUserRole()`

Important code fact:
`backend/src/controllers/admin.controller.js` currently allows only:

- `CLIENT`
- `FREELANCER`
- `ADMIN`

So `PROJECT_MANAGER` is not accepted there.

## PM Route Protection

All PM pages are wrapped by `ProtectedRoute` with:

- `loginPath="/project-manager/login"`
- `allowedRoles={["PROJECT_MANAGER", "ADMIN"]}`

Backend also protects PM APIs using:

- `requireAuth`
- `requirePm`

`requirePm` only allows active users with role `PROJECT_MANAGER` or `ADMIN`.

## 3. Route Map With Slugs

## Public PM Route

| Slug | Purpose | File |
|---|---|---|
| `/project-manager/login` | PM login page | `src/components/features/project-manager/PMLogin.jsx` |

## Protected PM Routes

| Slug | Purpose | File |
|---|---|---|
| `/project-manager` | PM dashboard/home | `DashboardPage.jsx` |
| `/project-manager/availability` | PM meeting/availability view | `CalendarPage.jsx` |
| `/project-manager/appointments` | PM appointments/meetings view | `CalendarPage.jsx` |
| `/project-manager/projects` | assigned projects list | `ProjectsPage.jsx` |
| `/project-manager/projects/:projectId` | single project detail | `ProjectDetailsPage.jsx` |
| `/project-manager/messages` | project chat center | `MessagesPage.jsx` |
| `/project-manager/profile` | PM own profile | `ProfessionalProfilePage.jsx` |
| `/project-manager/profile/:id` | freelancer profile from PM side | `ProfessionalProfilePage.jsx` |
| `/project-manager/marketplace` | freelancer marketplace | `MarketplacePage.jsx` |
| `/project-manager/reports` | incident reports | `ReportsPage.jsx` |
| `/project-manager/create-project` | project creation wizard | `ProjectSetupPage.jsx` |

## Admin Routes Related To Project Managers

| Slug | Purpose | File |
|---|---|---|
| `/admin/project-managers` | admin PM overview page | `src/components/features/admin/AdminDisputes.jsx` |

Important note:

- the route name suggests full PM management
- but the actual component is `AdminDisputes.jsx`
- so this page is more of a PM listing + assigned projects + disputes view, not a full PM CRUD module

## 4. Query Params Used In PM Section

## `/project-manager/projects`

Supported query params:

- `preset=active`
- `preset=issues`
- `status=...`
- `assignment=...`
- `sync=...`

Behavior:

- dashboard cards deep-link into filtered project lists
- page normalizes filters from query string on load

## `/project-manager/appointments`

Supported query params:

- `time=ALL`
- `time=UPCOMING`
- `time=CURRENT`
- `time=PREVIOUS`

Behavior:

- calendar/meeting screen reads `time` and preselects that meeting bucket

## `/project-manager/messages`

Supported query params:

- `projectId=<id>`

Behavior:

- auto-selects the project conversation

Important note:

- code from freelancer profile sometimes navigates with `freelancerId=...`
- current `MessagesPage.jsx` does **not** use `freelancerId`
- so only `projectId` currently has effect here

## `/project-manager/marketplace`

Supported query params:

- `projectId=<id>`
- `reassign=true`

Behavior:

- if `projectId` exists:
  - button becomes assign/invite behavior for that project
- if `projectId` and `reassign=true`:
  - button triggers freelancer replacement flow

## `/project-manager/create-project`

Supported query params:

- `freelancerId=<id>`

Behavior:

- preselects a freelancer in step 3 of project setup
- can also move the wizard forward to team assignment state

## 5. Page-By-Page Explanation

## 5.0 Admin Side Visibility For PMs

- Slug: `/admin/project-managers`
- Route defined in: `src/App.jsx`
- Component used: `src/components/features/admin/AdminDisputes.jsx`

You mentioned this URL:

- `https://catalance.in/admin/project-managers`

From the codebase, yes, this route is present and is intended to be visible from the admin side.

What this admin page currently does:

1. Loads PM users using:
   - `GET /admin/users?role=PROJECT_MANAGER`
2. Shows list of PMs.
3. Lets admin click a PM row.
4. After selecting a PM, shows:
   - projects assigned to that PM
   - disputes assigned to that PM

What it does **not** currently do:

- it does not contain an "Add Project Manager" button
- it does not contain a PM creation form
- it does not directly create a PM account
- it does not provide a backend role update path here that allows setting `PROJECT_MANAGER`

So the admin side currently supports:

- PM visibility
- PM listing
- PM selection
- PM-linked projects visibility
- PM-linked disputes visibility

But it does **not** yet support full PM creation from this screen.

## 5.1 Dashboard

- Slug: `/project-manager`
- File: `src/modules/project-manager/pages/DashboardPage.jsx`
- API:
  - `pmApi.getDashboard()`

What loads:

- stats
- projects
- upcoming meetings

Main actions:

- open filtered projects
- open unread project messages
- open upcoming appointments
- open project detail
- open create project wizard

Main dashboard cards link to:

- active projects -> `/project-manager/projects?preset=active`
- open issues -> `/project-manager/projects?preset=issues`
- unread comms -> `/project-manager/messages?projectId=<first-unread-project>`
- today meetings -> `/project-manager/appointments?time=UPCOMING`

Dashboard purpose:

- this is the PM landing page after successful login

## 5.2 Availability / Appointments

- Slugs:
  - `/project-manager/availability`
  - `/project-manager/appointments`
- File: `src/modules/project-manager/pages/CalendarPage.jsx`
- API:
  - `pmApi.getMeetings()`

Important implementation detail:

- both slugs currently render the **same page component**
- the UI title is `Appointments & Meetings`
- there is no separate specialized availability screen in current frontend code

What the page does:

1. Fetches meetings from `/pm/meetings`.
2. Builds filters by:
   - time bucket
   - project
   - search text
3. Shows calendar UI and meeting timeline.
4. Opens project detail when user clicks a meeting card.

Main user flow:

- dashboard -> appointments
- choose `UPCOMING`, `CURRENT`, or `PREVIOUS`
- click meeting -> project detail page

## 5.3 Projects List

- Slug: `/project-manager/projects`
- File: `src/modules/project-manager/pages/ProjectsPage.jsx`
- API:
  - `pmApi.getProjects()`

What the page does:

1. Loads assigned projects.
2. Maps each project into list rows.
3. Derives display status such as:
   - Proposal
   - Started
   - In Progress
   - Completed
   - Issue Raised
4. Applies filters from query string and UI state.
5. Opens project detail on row click.

Main actions:

- clear filters
- search/filter projects
- open `/project-manager/projects/:projectId`

This is the operational list page for PM work.

## 5.4 Project Detail

- Slug: `/project-manager/projects/:projectId`
- File: `src/modules/project-manager/pages/ProjectDetailsPage.jsx`
- APIs:
  - `pmApi.getProjectDetails()`
  - `pmApi.getProjectMessages()`
  - `pmApi.getNotifications()`
  - `pmApi.getMeetings()`
  - `pmApi.sendProjectMessage()`
  - `pmApi.approveMilestone()`
  - `pmApi.finalizeHandover()`
  - `pmApi.detectMeetingConflicts()`
  - `pmApi.createMeeting()`

This is the most important PM page.

What it contains:

- project summary
- client profile summary
- assigned freelancer summary
- project messages
- milestone data
- SOP/task tracking
- project notifications
- project meetings
- handover checklist
- assignment history

Main flows inside project detail:

### A. Send Project Message

1. PM writes message.
2. Frontend calls `POST /pm/projects/:id/messages`.
3. Conversation refreshes.

### B. Approve Milestone

1. PM chooses a phase.
2. Frontend calls `POST /pm/projects/:id/milestone-approval`.
3. Project detail refreshes.

### C. Finalize Handover

1. PM checks handover checklist.
2. Frontend maps checklist values to backend payload.
3. Calls `POST /pm/projects/:id/finalize-handover`.
4. Detail refreshes after success.

### D. Schedule Meeting

1. PM opens meeting dialog.
2. Selects title, scope, platform, start, end.
3. Frontend first checks conflicts through `POST /pm/meetings/conflicts`.
4. If no conflict, frontend calls `POST /pm/meetings`.
5. Meetings list refreshes.

### E. Reassign Freelancer

1. From project detail, PM opens marketplace with:
   - `/project-manager/marketplace?projectId=<id>&reassign=true`
2. Marketplace loads freelancer search results.
3. PM confirms replacement.
4. Frontend calls `POST /pm/projects/:id/replace-freelancer`.
5. Redirects back to project detail.

### F. Invite/Add Freelancer

1. From project detail, PM can also browse marketplace normally.
2. Marketplace with `projectId` but without `reassign=true` sends invite.
3. Frontend calls `POST /pm/freelancers/:freelancerId/invite`.

## 5.5 Messages Center

- Slug: `/project-manager/messages`
- File: `src/modules/project-manager/pages/MessagesPage.jsx`
- APIs:
  - `pmApi.getDashboard()`
  - `pmApi.getProjectMessages()`
  - `pmApi.sendProjectMessage()`

What it does:

1. Loads PM dashboard project list.
2. Builds left sidebar from PM projects.
3. Selects a project chat.
4. Loads conversation for that project.
5. Polls chat every 3 seconds while page is visible.
6. Clears unread counts when chat is viewed.

Main flow:

- dashboard unread card -> messages page with `projectId`
- selected project chat opens
- PM sends message
- chat refreshes and unread counts are reduced

## 5.6 Profile

### Own PM Profile

- Slug: `/project-manager/profile`
- File: `src/modules/project-manager/pages/ProfessionalProfilePage.jsx`
- APIs:
  - `pmApi.getProfile()`
  - `pmApi.submitProfileEdit()`

This page is used for PM profile/onboarding completion.

What it does:

1. Loads current PM profile summary.
2. Builds onboarding checklist.
3. Enables edit mode if onboarding is incomplete or a request is pending.
4. Builds structured payload for PM profile request.
5. Submits profile update request for admin approval.

Submission endpoint:

- `POST /pm/profile-update-request`

Important behavior:

- PM edits are not written directly as a final approved profile
- they are submitted as a pending admin approval request

### Freelancer Profile From PM Side

- Slug: `/project-manager/profile/:id`
- Same file: `ProfessionalProfilePage.jsx`
- API:
  - `pmApi.getFreelancerDetails()`

Despite the route name using `profile/:id`, this page is effectively used to show a freelancer profile to the PM.

Main actions from this screen:

- `Hire for Project` -> `/project-manager/create-project?freelancerId=<id>`
- `Send Message` -> `/project-manager/messages?freelancerId=<id>`

Important note:

- the send-message navigation adds `freelancerId`
- current messages page does not consume it

## 5.7 Marketplace

- Slug: `/project-manager/marketplace`
- File: `src/modules/project-manager/pages/MarketplacePage.jsx`
- APIs:
  - `pmApi.searchFreelancers()`
  - `pmApi.getFreelancerDetails()`
  - `pmApi.inviteFreelancer()`
  - `pmApi.replaceFreelancer()`

What it does:

1. Searches freelancers.
2. Filters by:
   - search text
   - category tab
   - availability
   - rating
   - experience
   - sort mode
3. Opens freelancer detail dialog.
4. Performs one of three actions depending on URL state.

Behavior by context:

### Marketplace opened normally

- button action: open project creation wizard with selected freelancer
- redirect:
  - `/project-manager/create-project?freelancerId=<id>`

### Marketplace opened with `projectId`

- button action: invite freelancer to existing project
- API:
  - `POST /pm/freelancers/:freelancerId/invite`

### Marketplace opened with `projectId` and `reassign=true`

- button action: replace current freelancer
- API:
  - `POST /pm/projects/:id/replace-freelancer`

## 5.8 Reports

- Slug: `/project-manager/reports`
- File: `src/modules/project-manager/pages/ReportsPage.jsx`
- APIs:
  - `pmApi.listReports()`
  - `pmApi.createReport()`
  - `pmApi.getProjects()`

What it does:

1. Loads PM reports.
2. Loads PM-assigned projects.
3. Lets PM submit incident report with:
   - project
   - category
   - severity
   - title
   - description
4. Refreshes report list after submit.

Used for:

- freelancer misconduct
- client disputes
- delays
- communication issues

## 5.9 Create Project Wizard

- Slug: `/project-manager/create-project`
- File: `src/modules/project-manager/pages/ProjectSetupPage.jsx`
- APIs:
  - `pmApi.createProjectSetup()`
  - direct `authFetch('/users?role=...')` for clients, PMs, freelancers

This is a 4-step project creation flow.

### Step 1: Details

Fields:

- project name
- client
- category
- description
- visibility

Validation:

- requires `projectName`
- requires `clientId`
- requires `description`

### Step 2: Budget

Fields:

- total budget
- timeline
- milestones

Behavior:

- default milestone structure exists
- PM can add/remove custom milestones
- milestone total must equal `100`
- draft can be saved to `localStorage`

Local draft key:

- `pm.project-setup-draft.v1`

### Step 3: Team

Fields:

- assigned PM
- primary freelancer
- shortlist talent IDs
- communication setup

Behavior:

- if `freelancerId` query param exists, freelancer is preselected

### Step 4: Review & Publish

Behavior:

1. Frontend builds payload from step data.
2. Converts budget to number.
3. Splits shortlist talent IDs by comma.
4. Calls `POST /pm/projects/setup`.
5. Clears local draft.
6. Shows success state.

After success:

- can open `/project-manager/projects`
- can open `/project-manager/marketplace`

## 6. Backend Endpoint Map

PM frontend service file:

- `src/modules/project-manager/services/pm-api.js`

Backend route file:

- `backend/src/routes/pm.routes.js`

Main endpoint map:

| Frontend Call | Backend Endpoint | Purpose |
|---|---|---|
| `getDashboard` | `GET /pm/dashboard/summary` | PM dashboard data |
| `getUpcomingMeetings` | `GET /pm/dashboard/upcoming-meetings` | dashboard meetings |
| `getProjects` | `GET /pm/projects` | assigned projects |
| `getProjectDetails` | `GET /pm/projects/:id/details` | project details |
| `getProjectMessages` | `GET /pm/projects/:id/messages` | project chat |
| `sendProjectMessage` | `POST /pm/projects/:id/messages` | send project message |
| `getProjectMilestones` | `GET /pm/projects/:id/milestones` | milestones |
| `approveMilestone` | `POST /pm/projects/:id/milestone-approval` | approve phase |
| `escalateProject` | `POST /pm/projects/:id/escalate` | raise escalation |
| `finalizeHandover` | `POST /pm/projects/:id/finalize-handover` | verify closure/handover |
| `getMeetings` | `GET /pm/meetings` | meetings list |
| `detectMeetingConflicts` | `POST /pm/meetings/conflicts` | scheduling conflict check |
| `createMeeting` | `POST /pm/meetings` | create meeting |
| `rescheduleMeeting` | `PATCH /pm/meetings/:id/reschedule` | reschedule meeting |
| `searchFreelancers` | `GET /pm/freelancers` | marketplace search |
| `getFreelancerDetails` | `GET /pm/freelancers/:id` | freelancer detail |
| `inviteFreelancer` | `POST /pm/freelancers/:freelancerId/invite` | invite freelancer |
| `replaceFreelancer` | `POST /pm/projects/:id/replace-freelancer` | replace freelancer |
| `getProfile` | `GET /pm/profile` | PM profile |
| `submitProfileEdit` | `POST /pm/profile-update-request` | PM profile approval request |
| `getActiveProfileRequest` | `GET /pm/profile-update-request/active` | pending profile request |
| `listReports` | `GET /pm/reports` | report list |
| `createReport` | `POST /pm/reports` | create report |
| `getReport` | `GET /pm/reports/:id` | report detail |
| `createProjectSetup` | `POST /pm/projects/setup` | create/publish project |
| `getNotifications` | `GET /pm/notifications` | PM notification snapshot |

## 7. Main End-to-End Flows

## Flow 1: PM Login -> Dashboard

1. Open `/project-manager/login`
2. Submit email/password
3. Role check must be `PROJECT_MANAGER` or `ADMIN`
4. Session saved in `AuthContext`
5. Redirect to `/project-manager`

## Flow 2: Dashboard -> Project Detail

1. PM opens dashboard
2. Dashboard loads projects and meetings
3. PM clicks a project card or row
4. Navigate to `/project-manager/projects/:projectId`

## Flow 3: Dashboard -> Messages

1. Dashboard detects unread project
2. Unread card links to `/project-manager/messages?projectId=<id>`
3. Messages page auto-selects that project
4. PM reads/sends messages

## Flow 4: Project Detail -> Schedule Meeting

1. Open project detail
2. Open meeting dialog
3. Enter meeting timing
4. Check conflicts
5. Create meeting
6. Refresh project meetings

## Flow 5: Project Detail -> Reassign Freelancer

1. Open project detail
2. Open marketplace using `projectId` and `reassign=true`
3. Choose freelancer
4. Call replacement API
5. Return to project detail

## Flow 6: Marketplace -> New Project

1. Open marketplace normally
2. Choose freelancer
3. Navigate to `/project-manager/create-project?freelancerId=<id>`
4. Freelancer is prefilled in wizard
5. Finish 4-step publish flow

## Flow 7: PM Profile Completion

1. Open `/project-manager/profile`
2. Fill missing onboarding/profile fields
3. Submit profile update request
4. Request becomes pending admin approval

## Flow 8: PM Report Submission

1. Open `/project-manager/reports`
2. Select project
3. Choose category and severity
4. Add description
5. Submit report

## 5.10 Admin PM Overview

- Slug: `/admin/project-managers`
- File: `src/components/features/admin/AdminDisputes.jsx`
- Related APIs:
  - `GET /admin/users?role=PROJECT_MANAGER`
  - `GET /projects`
  - `GET /disputes`

What it does:

1. Fetches all users with role `PROJECT_MANAGER`.
2. Shows them in a table.
3. Lets admin click one PM.
4. Loads projects assigned to that PM.
5. Loads disputes assigned to that PM.
6. Opens dispute details dialog if admin clicks a dispute row.

What is missing:

- no create PM button
- no edit PM form
- no assign role-to-PM action in this screen
- no delete PM flow
- no backend role update path here that allows setting `PROJECT_MANAGER`

This means the page is currently a **PM monitoring page**, not a full PM management module.

## 8. Current Code Notes / Gaps

These are important if you want this module cleaned up further.

### No public PM signup

- PM registration is not exposed in current public auth UI

### No complete admin PM creation flow

- `/admin/project-managers` exists
- admin can view PMs there
- but current code does not provide a proper create-new-PM form or API flow

### Admin role update does not allow converting a user into PM

- `backend/src/controllers/admin.controller.js`
- `updateUserRole()` only allows:
  - `CLIENT`
  - `FREELANCER`
  - `ADMIN`
- `PROJECT_MANAGER` is not accepted there

So even role conversion into PM is not completed in the current admin backend.

### Availability and appointments are same screen

- `/project-manager/availability`
- `/project-manager/appointments`
- both render `CalendarPage.jsx`

### `freelancerId` is passed to messages but not used

- profile page navigates to `/project-manager/messages?freelancerId=<id>`
- messages page only reads `projectId`

### Route naming is slightly misleading

- `/project-manager/profile/:id` actually loads freelancer details when `id` exists
- so it behaves more like a PM-side freelancer profile route

## 9. Recommended Next Docs

If you want, the next useful documents would be:

1. a backend-only PM API document
2. a frontend component hierarchy for PM pages
3. a database/schema flow for PM-related tables
4. a sequence diagram for login, project creation, reassignment, and messaging
5. a missing-features document for PM admin creation flow
