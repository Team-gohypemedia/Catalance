Catalance – Comprehensive System Guide (Updated 2026-02-17)
==========================================================

Purpose
-------
Catalance is a multi-role freelancer marketplace with AI-assisted intake and proposal generation. It serves four personas: Clients (hire work), Freelancers (deliver work), Project Managers (oversee delivery), and Admins (govern catalog/users). Key pillars: authentication with OTP & Google, structured projects/proposals, AI chat + proposal generator, scheduling, disputes, notifications, payments scaffolding, and real-time chat.

At-a-Glance Stack
-----------------
- Frontend: Vite + React 18, React Router v7, Tailwind v4, Radix UI, Framer Motion/GSAP, Socket.IO client optional, Firebase (Google Auth + FCM).
- Backend: Express 4 (ESM), Prisma (PostgreSQL), JWT auth, Resend emails, Socket.IO server, cron jobs, Multer uploads, OpenRouter (AI), optional R2/S3.
- Deployment posture: Vercel-friendly (serverless capable) with polling Socket transport; runs as long-lived server locally.

Environments & Configuration
----------------------------
- Frontend `.env` (root):
  - `VITE_API_BASE_URL` (default falls back to `/api` or `http://localhost:5000/api`)
  - `VITE_SOCKET_URL`, `VITE_SOCKET_PATH` (optional for Socket.IO)
  - Firebase keys: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MEASUREMENT_ID`, `VITE_FIREBASE_VAPID_KEY`
- Backend `.env` (root or `backend/.env`, parsed in `backend/src/config/env.js`):
  - Required: `DATABASE_URL`, `JWT_SECRET` (≥32 chars), `PASSWORD_PEPPER` (≥16 chars)
  - Common: `PORT` (5000), `PASSWORD_SALT_ROUNDS` (8–15, default 12), `JWT_EXPIRES_IN` (7d)
  - CORS: `CORS_ORIGIN`, `LOCAL_CORS_ORIGIN`, `VERCEL_CORS_ORIGIN`, `SOCKET_IO_PATH`
  - Email: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
  - AI: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENROUTER_MODEL_FALLBACK`
  - Misc: `OPENAI_API_KEY`, `STITCH_API_KEY`, `FRONTEND_URL`, `DIRECT_DATABASE_URL`

Local Development Quickstart
----------------------------
1) `npm install` (root) — installs frontend deps.  
2) `npm run dev` — Vite on 5173/5174.  
3) `cd backend && npm install && npm run dev` — Express on 5000 with nodemon. Or run from root: `npm run backend:dev`.  
4) Ensure Postgres URL in `.env`. Run `npm run backend:build` (generates Prisma client).  
5) Seeds: `npm run backend:prisma:seed` (sample users/projects/etc.).  
6) Prisma Studio: `npm run backend:prisma:studio`.

System Architecture (conceptual)
--------------------------------
- Client app (browser) → REST API (`/api/*`) and optional Socket.IO (polling).
- AuthContext holds JWT; API client attaches Bearer token.
- AI endpoints proxy to OpenRouter with service-catalog context.
- DB: PostgreSQL via Prisma ORM; schema models listed below.
- Storage: Multer uploads; helper for R2/S3; images proxy/resizer.
- Emails: Resend; OTP + reset + welcome.
- Background: cron jobs triggered in long-lived mode; skipped in serverless.

Data Model (Prisma)
-------------------
- **User**: id, email, fullName, passwordHash, role (CLIENT/FREELANCER/ADMIN/PROJECT_MANAGER), roles[], status (ACTIVE/SUSPENDED/PENDING_APPROVAL), skills[], bio, hourlyRate, otpCode/otpExpires, resetPasswordToken/resetPasswordExpires, onboardingComplete, isVerified, location, avatar, social links, profileDetails (JSON), workExperience, portfolioProjects, fcmToken, phone.
- **Project**: ownerId, managerId, title, description, budget, status (DRAFT/OPEN/IN_PROGRESS/AWAITING_PAYMENT/COMPLETED), progress, spent, notes, completedTasks/verifiedTasks (JSON), proposals[], disputes[], appointments[], payments[], externalLink.
- **Proposal**: freelancerId, projectId, coverLetter, amount, status (PENDING/ACCEPTED/REJECTED), budgetReminderSent.
- **Dispute**: projectId, raisedById, managerId, description, status (OPEN/IN_PROGRESS/RESOLVED), meetingLink/date, resolutionNotes, meetingReminderSent.
- **Profile**: (legacy) email/name/services/skills/workExperience.
- **ServiceCatalog**: legacy JSON store (key/payload); replaced by relational Service tables.
- **Service**: slug, name, description, icon, minBudget, currency, active, questions[].
- **ServiceQuestion**: slug, text, type (input/single_option/multi_option), order, required, options JSON, logic JSON; scoped to Service.
- **ChatConversation**: service, projectTitle, createdById; messages[].
- **ChatMessage**: conversationId, senderId, content, attachment JSON, deleted flag, readAt.
- **Notification**: userId, type/title/message/data, read.
- **ManagerAvailability**: managerId, date, startHour/endHour, isBooked/isEnabled, remark.
- **Appointment**: bookedById, managerId, title/description, date, startHour/endHour, status, meetingLink, optional projectId.
- **Payment**: projectId, freelancerId, amount, platformFee, freelancerAmount, currency, status (PENDING/PROCESSING/COMPLETED/FAILED/REFUNDED), paidAt.
- **AiGuestSession / AiGuestMessage**: unauthenticated AI demo sessions/messages.

Authentication & Authorization
------------------------------
- JWT Bearer; decoded into `req.user` with `sub` (user id) and `role`.
- Signup flow: `POST /auth/signup` → creates user with OTP; `POST /auth/verify-otp` returns `{ user, accessToken }`.
- Login: `POST /auth/login` or `POST /auth/google-login` (Firebase token) → `{ user, accessToken }`.
- Password reset: `/auth/forgot-password` → reset token emailed; `/auth/verify-reset-token/:token` → validity; `/auth/reset-password`.
- Guard middleware: `requireAuth` (rejects 401), `optionalAuth` (populates req.user if token provided), `AdminRoute` on frontend restricts UI.

Key Backend Modules
-------------------
- `backend/src/index.js`: Express setup, CORS allowlist + Vercel fail-safe, Helmet, JSON, logging, routes, error/not-found handlers, Socket.IO init, cron start.
- `config/env.js`: env parsing with Zod and friendly 500s when invalid.
- `lib/prisma.js`: Prisma client singleton with initialization guard.
- `lib/socket.js` / `socket-manager.js`: Socket.IO server and helpers.
- `lib/notification-util.js`: writes Notification rows and emits sockets.
- `lib/resend.js`: Resend client factory.
- `services/ai.service.js`: OpenRouter integration, service catalog loading (DB first, file fallback), chat + proposal generation, guardrails (budget/timeline).
- `services/cron.service.js`: scheduled tasks (e.g., reminders).
- `modules/users/user.service.js`: OTP/email, password hashing/pepper, role management, profile normalization (skills, avatars, locations), Google auth support.
- `middlewares/validate-resource.js`: Zod validation for body/params/query.
- `utils/async-handler.js`: wraps controllers to surface errors.

REST API Reference (selected high-importance)
---------------------------------------------
Base prefix: `/api`

Auth
- `POST /auth/signup` body `{ fullName,email,password,role?,skills?,freelancerProfile?,portfolioProjects?,location?,avatar? }` → `{ data: { message, email, userId, emailDelivery } }`.
- `POST /auth/verify-otp` body `{ email, otp }` → `{ data: { user, accessToken } }`.
- `POST /auth/resend-otp` body `{ email }` → `{ data: { message, emailDelivery } }`.
- `POST /auth/login` body `{ email, password, role? }` → `{ data: { user, accessToken } | { requiresVerification,... } }`.
- `POST /auth/google-login` body `{ token, role? }` → `{ data: { user, accessToken } }`.
- `GET /auth/profile` (JWT) → `{ data: user }`.
- `PUT /auth/profile` (JWT) body allowed fields: fullName, phoneNumber, bio, portfolio, linkedin, github, avatar, profileDetails, onboardingComplete, skills, portfolioProjects, location → `{ data: user }`.
- Reset password trio: `POST /auth/forgot-password`, `GET /auth/verify-reset-token/:token`, `POST /auth/reset-password`.

Users
- `GET /users` query filters `{ role, status, onboardingComplete }` → list of sanitized users.
- `POST /users` body createUserSchema → created user.

Projects
- `GET /projects` (JWT) → role-aware list (PM/Admin all; client own).
- `POST /projects` (JWT) body `{ title, description, budget?, status?, proposal? }` → auto-assigns PROJECT_MANAGER if available, returns `{ project, proposal? }`.
- `GET /projects/:id` (JWT) → project with owner, proposals (with freelancer info), manager, disputes counts.
- `PATCH /projects/:id` (JWT) body arbitrary fields + optional `notificationMeta` to trigger notifications (task completed/verified/unverified). Permissions: owner or accepted freelancer.
- `POST /projects/:id/pay-upfront` (JWT owner) → calculates upfront (50%/<50k, 33%/50k–200k, 25%/>200k), updates status `IN_PROGRESS`, returns `{ project, paymentAmount, message }`.

Proposals
- `GET /proposals` (JWT) filters `status`, `projectId`, etc. → proposals with freelancer info.
- `GET /proposals/:id` (JWT) → proposal.
- `POST /proposals` (JWT) body createProposalSchema → new proposal.
- `PATCH /proposals/:id/status` (JWT) body `{ status }` → updated proposal.
- `DELETE /proposals/:id` (JWT) → deleted proposal.

Chat
- `GET /chat/conversations` (JWT) → conversations for user.
- `POST /chat/conversations` (optional auth) body `{ service?, projectTitle?, createdById? }` → new conversation.
- `GET /chat/conversations/:id/messages` (optional auth) → messages for conversation.
- `POST /chat/conversations/:id/messages` (optional auth) body `{ content, service?, senderId?, senderRole?, senderName?, skipAssistant? }` → new message; assistant may reply (if not skipped).
- PM view: `GET /chat/projects/:projectId/messages` (JWT).

AI
- `POST /ai/chat` body `{ message, conversationHistory?, serviceName? }` → `{ success, message, usage? }` (guardrails enforce budget question order).
- `POST /ai/proposal` body `{ proposalContext?, chatHistory?, serviceName? }` → `{ success, proposal (markdown) }`.
- `GET /ai/services` → `{ services }` (id/name/questions/minBudget/etc.).
- `GET /ai/services/:serviceId` → single service.

Appointments & Availability
- Routes under `/appointments` (see controller) manage:
  - Manager availability CRUD (ManagerAvailability).
  - Booking appointments (Appointment) between clients and managers.
  - Status updates (PENDING/APPROVED/REJECTED/CANCELLED).

Disputes
- Routes under `/disputes`: create dispute tied to project, update status, add meeting link/time, list disputes (role-aware).

Notifications
- `/notifications` routes list and mark notifications; notifications also emitted via sockets when task updates happen.

Uploads & Images
- `POST /upload` — file upload (Multer).
- `/images` — image proxy/transform endpoints (e.g., resize).

Payments (scaffold)
- `POST /projects/:id/pay-upfront` implemented; Payment model prepared for release/refund flows; further payment gateway integration required.

Admin
- `/admin` routes: approvals (freelancer onboarding), user/project moderation, service catalog CRUD (Service, ServiceQuestion), disputes, projects, users, dashboards.

Frontend Architecture
---------------------
- Entry: `src/main.jsx`; global providers: ThemeProvider, AuthProvider.
- Routing: `src/App.jsx` uses lazy-loaded routes; Suspense fallback spinner.
- Public marketing pages: `/`, `/services`, `/about`, `/contact`, `/blog`, `/help`, `/enterprise`, `/talent`, `/careers`, `/terms`, `/privacy`, `/ai-demo`, `/get-started`.
- Auth: `/signup`, `/login`, `/forgot-password`, `/reset-password`.
- Client area: `/client`, `/client/project`, `/client/project/:projectId`, `/client/proposal`, `/client/proposal/drafts`, `/client/messages`, `/client/profile`, `/client/ai-chat`.
- Freelancer area: `/freelancer`, `/freelancer/proposals`, `/freelancer/proposals/received`, `/freelancer/proposals/accepted`, `/freelancer/project`, `/freelancer/project/:projectId`, `/freelancer/messages`, `/freelancer/onboarding`, `/freelancer/profile`.
- Project Manager: `/project-manager/login`, `/project-manager`, `/project-manager/availability`, `/project-manager/appointments`, `/project-manager/projects`, `/project-manager/projects/:projectId`, `/project-manager/messages`, `/project-manager/profile`.
- Admin: `/admin/login`, `/admin`, `/admin/clients`, `/admin/freelancers`, `/admin/project-managers`, `/admin/services`, `/admin/service-questions`, `/admin/projects`, `/admin/users/:userId`, `/admin/projects/:id`, `/admin/approvals`, `/admin/disputes`.
- Shared UI: Radix components, Tailwind classes; CataButton floating action; Navbar/Footer wrappers.

State & Data Fetching
---------------------
- AuthContext (`src/shared/context/AuthContext.jsx`): stores `{ user, token }` in localStorage; verifies via `/auth/profile`; provides `authFetch` with JWT header, timeout, and 401 handling; `ProtectedRoute` and `AdminRoute` wrap pages.
- API client (`src/shared/lib/api-client.js`): base URL resolution, request wrapper with 15s timeout, auth headers, JSON parsing; exports helpers for auth, chat, users.
- Socket: configured for polling-only (upgrade disabled) for serverless safety; enabled when `VITE_SOCKET_URL` or local API.

AI UX
-----
- `AIChat.jsx` + `ai-elements/*`: sends messages to `/ai/chat`, maintains conversation history, enforces question order (budget last), offers proposal generation via `/ai/proposal`.
- Service catalog drives dynamic questions; stored in DB (Service/ServiceQuestion) with file fallback.
- Guardrails: refuses to generate proposal until required Qs answered; budget/timeline normalization; applies emphasis formatting.

Scheduling UX
-------------
- Managers set availability slots; clients book appointments; appointments stored with start/end hour, status transitions; meeting link support.

Disputes UX
-----------
- Users raise disputes on projects; managers/admins manage statuses, schedule resolution meeting.

Notifications UX
----------------
- Stored notifications list; triggered e.g., when freelancer marks task complete or client verifies/unverifies; Socket.IO used when available; fallback to polling.

Uploads/Assets
--------------
- Multer handles multipart; R2/S3 helper for object storage; image proxy routes for resizing/serving images.

Security & Validation
---------------------
- Zod schemas on inputs (`validate-resource` middleware).
- JWT + peppered passwords; OTP verification; reset tokens stored server-side (raw SQL updates to avoid stale client).
- CORS allowlist with Vercel fail-safe to reduce accidental block in serverless.
- Helmet with cross-origin resource policy set to cross-origin.
- Socket limited to polling to avoid serverless websocket issues.

Performance Notes (frontend)
----------------------------
- Heavy use of route-based code splitting via `lazy` + `Suspense`.
- Tailwind 4; Radix components direct imports (avoid barrel bloat).
- Auth fetch timeouts; API client aborts after 15s.
- Consider dynamic imports for heavy editors/3D if added (pattern already present).

Error Handling
--------------
- `asyncHandler` centralizes try/catch.
- `error-handler` middleware standardizes JSON `{ error, message }`.
- Env/Prisma init failures respond with friendly 500 without crashing serverless instance.
- Frontend shows toasts (sonner) on errors, spinner on auth verification.

Deployment Notes
----------------
- Serverless (Vercel): ensure `prisma generate` runs (scripts already set: `backend build/vercel-build/postinstall`). CORS fallback to allow requesting origin. Sockets remain polling. Cron jobs not ideal in serverless; keep disabled or move to external scheduler.
- Long-lived host (Railway/Render/Fly): Sockets fully available; cron jobs run; ensure graceful shutdown signals.
- Database migrations: `npm run backend:prisma:migrate -- --name <label>` (uses DIRECT_DATABASE_URL when set).

Testing & Tooling
-----------------
- Frontend lint: `npm run lint`.
- Backend sample test: `npm --prefix backend run test:budget` (AI budget guardrails, node:test).
- Prisma Studio for DB inspection.

Sample Request/Response Snippets
--------------------------------
Signup (email/password):
```
POST /api/auth/signup
{ "fullName": "Jane Client", "email": "jane@example.com", "password": "StrongPass123!", "role": "CLIENT" }
→ 201 { "data": { "message": "Verification code sent...", "email": "jane@example.com", "userId": "<id>", "emailDelivery": "sent|not_sent" } }
```

Verify OTP:
```
POST /api/auth/verify-otp
{ "email": "jane@example.com", "otp": "123456" }
→ 200 { "data": { "user": { ...sanitizedUser }, "accessToken": "<jwt>" } }
```

Create Project (client):
```
POST /api/projects (Authorization: Bearer <jwt>)
{ "title": "New Brand Site", "description": "Need landing + blog", "budget": 75000 }
→ 201 { "data": { "project": {..., "managerId": "<pm or null>"}, "proposal": null } }
```

AI Chat:
```
POST /api/ai/chat
{ "message": "I need a SaaS marketing site", "conversationHistory": [] }
→ 200 { "success": true, "message": "<assistant reply with next question>", "usage": {...} }
```

Generate Proposal:
```
POST /api/ai/proposal
{ "proposalContext": { "clientName": "Jane", "serviceName": "website_uiux" }, "chatHistory": [...] }
→ 200 { "success": true, "proposal": "## Markdown..." }
```

Pay Upfront:
```
POST /api/projects/<id>/pay-upfront
→ 200 { "data": { "project": {... status: "IN_PROGRESS"}, "paymentAmount": 25000, "message": "33% upfront..." } }
```

Typical User Journeys
---------------------
- **Client**: Sign up → verify OTP → create project (auto PM) → chat AI for scope → receive freelancer proposals → accept → pay upfront → track tasks/notifications → (future) release payments.
- **Freelancer**: Sign up → verify → browse proposals assigned/received → submit proposals → chat with client → deliver tasks → mark completed → get notified on verification.
- **Project Manager**: Login → view assigned projects → messages → update status/tasks → manage availability/appointments with clients → help resolve disputes.
- **Admin**: Login → approvals for freelancers → manage users/projects/disputes → curate services/questions → view dashboards.
- **Guest**: `/ai-demo` uses `AiGuestSession` for unauthenticated AI intake without account creation.

Extending the System (safe steps)
---------------------------------
- New API: add Zod schema in `backend/src/modules/...`, controller with `asyncHandler`, register route in `routes/index.js`, apply `requireAuth`/`optionalAuth` as needed, update frontend API client and page.
- New DB fields: edit `backend/prisma/schema.prisma`, run `prisma migrate dev`, regenerate client, update serializers/schemas/frontend forms.
- New service questions: update Service/ServiceQuestion via admin routes or seed; AI auto-pulls latest catalog.
- Realtime events: emit via `notification-util` + Socket.IO; keep polling fallback.

Open Items / Risks
------------------
- Payments beyond upfront (release/refund) need gateway integration and webhook handling.
- Cron behavior in serverless is limited; move to external scheduler if deploying on Vercel.
- Image upload/storage assumes R2/S3 config; ensure credentials/ACLs.
- Socket scaling across instances may require Redis adapter.
- AI relies on OpenRouter keys; handle quota/errors gracefully in production.

File Map (quick reference)
--------------------------
- Frontend: `src/App.jsx` (routes), `src/shared/context/AuthContext.jsx`, `src/shared/lib/api-client.js`, `src/shared/lib/firebase.js`, `src/components/features/*`, `src/components/pages/*`.
- Backend: `backend/src/index.js`, `backend/src/config/env.js`, `backend/src/routes/index.js`, controllers under `backend/src/controllers/`, services under `backend/src/services/`, modules (schemas/services) under `backend/src/modules/`, Prisma schema `backend/prisma/schema.prisma`, data catalog `backend/src/data/servicesComplete.json`.

If You’re New – Start Here
--------------------------
1) Copy `.env` templates and set DB/JWT/pepper.  
2) Run backend + frontend dev servers.  
3) Hit `POST /api/auth/signup` + OTP to get a token, or use seeded users.  
4) Create a project, then walk through client dashboard and AI chat to see end-to-end flow.  
5) Explore admin screens to view/edit services and questions.  
6) Review `services/ai.service.js` to understand AI rules/guardrails before modifying prompts.  
7) For any feature change, update both Zod schemas and Prisma types, then mirror on frontend forms/API calls.

