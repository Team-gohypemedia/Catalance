# AI Demo API + AI Flow Documentation (`/ai-demo`)

This document explains exactly what happens when a user opens `http://localhost:5173/ai-demo`, which APIs are called, when AI is called, and how data flows frontend -> backend -> AI provider.

## 1) Entry Point and Base URL Flow

1. Frontend route:
`/ai-demo` is rendered by `GuestAIDemo`.
- Source: `src/App.jsx:147`

2. Frontend API base inside this page:
`API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'`
- Source: `src/components/pages/GuestAIDemo.jsx:22`

3. In local dev, Vite proxies `/api/*` to backend `http://localhost:5000`.
- Source: `vite.config.js:15`
- Source: `vite.config.js:17`

4. Backend mounts all API routes under `/api`.
- Source: `backend/src/index.js:107`

So browser calls like `/api/guest/chat` from port `5173` are proxied to backend `5000`.

## 2) APIs Used by `/ai-demo`

These are the APIs actively used by `GuestAIDemo`:

1. `GET /api/ai/services`
- Called on page load (`useEffect` -> `fetchServices`)
- Source: `src/components/pages/GuestAIDemo.jsx:273`
- Source: `src/components/pages/GuestAIDemo.jsx:295`
- Source: `src/components/pages/GuestAIDemo.jsx:297`

2. `POST /api/guest/start`
- Called when user selects a service card
- Source: `src/components/pages/GuestAIDemo.jsx:308`
- Source: `src/components/pages/GuestAIDemo.jsx:312`

3. `POST /api/guest/chat`
- Called on every user message (text or selected options)
- Source: `src/components/pages/GuestAIDemo.jsx:335`
- Source: `src/components/pages/GuestAIDemo.jsx:356`

Available but currently not called by this page:

4. `GET /api/guest/history/:sessionId`
- Route exists for session replay/debug/history
- Source: `backend/src/routes/guest.routes.js:8`

## 3) Backend Route Wiring

1. API router mounts:
- `apiRouter.use("/ai", aiRouter)` -> `backend/src/routes/index.js:27`
- `apiRouter.use("/guest", guestRouter)` -> `backend/src/routes/index.js:38`

2. Guest routes:
- `POST /start` -> `startGuestSession`
- `POST /chat` -> `guestChat`
- `GET /history/:sessionId` -> `getGuestHistory`
- Source: `backend/src/routes/guest.routes.js:6`
- Source: `backend/src/routes/guest.routes.js:7`
- Source: `backend/src/routes/guest.routes.js:8`

3. AI routes:
- `GET /services`
- `GET /services/:serviceId`
- `POST /chat`
- `POST /proposal`
- Source: `backend/src/routes/ai.routes.js:11`
- Source: `backend/src/routes/ai.routes.js:48`
- Source: `backend/src/routes/ai.routes.js:84`
- Source: `backend/src/routes/ai.routes.js:94`

## 4) End-to-End Runtime Flow

## Phase A: User opens `/ai-demo`

1. Frontend mounts `GuestAIDemo`.
2. Frontend calls `GET /api/ai/services`.
3. Backend handles `GET /api/ai/services`:
   - calls `getAllServices()`
   - loads service catalog (DB-first, file fallback, cached)
4. Frontend renders service cards.

Relevant backend service catalog loading:
- `loadServiceCatalogFromDb` -> `backend/src/services/ai.service.js:65`
- `ensureServicesCatalogLoaded` -> `backend/src/services/ai.service.js:124`
- `getAllServices` -> `backend/src/services/ai.service.js:2409`

Important: this phase does **not** call OpenRouter AI. It is service metadata retrieval.

## Phase B: User clicks a service

1. Frontend calls `POST /api/guest/start` with:
```json
{
  "serviceId": "<service.slug or service.id>"
}
```

2. Backend `startGuestSession` does:
1. Validates `serviceId`.
2. Finds active service + ordered questions from DB.
3. Creates `AiGuestSession` with:
   - `serviceId` (slug)
   - `currentStep = 0`
   - `answers = {}`
4. Creates initial assistant message (first question) in `AiGuestMessage`.
5. Returns:
   - `sessionId`
   - `message` (first question)
   - `inputConfig` (question type/options for step 0)
   - `history` with first assistant message

Source: `backend/src/controllers/guest.controller.js:1268`

## Phase C: User sends chat message

Each turn calls `POST /api/guest/chat`.

### C1) Request normalization and context load

Backend `guestChat`:
1. Accepts `message` as text or array (multi-select case).
2. Normalizes array to comma-separated text for storage/validation.
3. Loads session with existing messages.
4. Loads service and ordered questions.
5. Resolves:
   - `currentStep`
   - `currentQuestion`
   - existing answers by slug

Source: `backend/src/controllers/guest.controller.js:1331`

### C2) AI-assisted extraction and validation logic

Before deciding how to continue:

1. `extractAnswersFromMessage(...)` (AI call) tries to detect explicit answers for one or more question slugs from current user text.
- Source: `backend/src/controllers/guest.controller.js:1156`

2. Suggestion intent detection:
   - Regex/static checks first.
   - Optional AI classifier (`detectSuggestionIntentWithAI`) if ambiguous.
- Source: `backend/src/controllers/guest.controller.js:795`

3. Validation:
   - If greeting-while-name-question: immediate invalid handling.
   - Else AI validator call (`chatWithAI`) returns structured JSON:
     - `isValid`
     - `status` (`valid_answer`, `invalid_answer`, `info_request`)
     - `message`
- Source: `backend/src/controllers/guest.controller.js:457`
- Source: `backend/src/controllers/guest.controller.js:1493`

### C3) Branching behavior

If invalid or info request:
1. Save user message.
2. Save assistant feedback.
3. Do **not** advance step.
4. Return updated `history`.

If valid:
1. Save user message.
2. Store direct answer for current question slug.
3. Merge high-confidence extracted answers from same message.
4. If answer changed a branching question, clear dependent downstream answers.
5. Compute next unanswered step via question logic.
6. Persist updated `answers` + `currentStep`.

Main helpers:
- `resolveNextQuestionIndex` -> `backend/src/controllers/guest.controller.js:621`
- `applyExtractedAnswerUpdates` -> `backend/src/controllers/guest.controller.js:963`
- `findNextUnansweredStep` -> `backend/src/controllers/guest.controller.js:1040`

### C4) Next question vs proposal generation

If `nextStep < questions.length`:
1. Compose assistant response (bridge + next question).
2. Build `inputConfig` from next question type/options.
3. Save assistant message.
4. Return `history` + `inputConfig`.

If all questions are complete (`nextStep >= questions.length`):
1. Build full proposal history from session + current turn.
2. Run transcript-level answer extraction (AI call) to enrich/repair missing answers.
3. Build structured `proposalContext`.
4. Call `generateProposalMarkdown(...)` (AI call).
5. Save proposal markdown as assistant message.
6. Return final history.

Sources:
- conversation extraction: `backend/src/controllers/guest.controller.js:1208`
- proposal generation call inside guest flow: `backend/src/controllers/guest.controller.js:1861`

## 5) Exactly When AI Is Called

AI provider is OpenRouter:
- URL: `https://openrouter.ai/api/v1/chat/completions`
- Source: `backend/src/services/ai.service.js:160`

Request wrapper:
- `requestOpenRouterCompletion(...)`
- Source: `backend/src/services/ai.service.js:203`

Main entry functions:
- `chatWithAI(...)` -> used for chat, extraction, validation, intent classifier
  - Source: `backend/src/services/ai.service.js:2303`
- `generateProposalMarkdown(...)` -> used for final proposal
  - Source: `backend/src/services/ai.service.js:2256`

Potential AI calls in one `POST /api/guest/chat` turn:

1. `extractAnswersFromMessage` (usually while still in questionnaire)
2. `detectSuggestionIntentWithAI` (conditional)
3. validator `chatWithAI` (usually while still in questionnaire)
4. `extractAnswersFromConversation` (when finalizing proposal)
5. `generateProposalMarkdown` (when finalizing proposal)

So one turn can trigger from `0` to `5` AI calls depending on branch and step.

## 6) DB Writes During Flow

Core models:
- `AiGuestSession` (`serviceId`, `currentStep`, `answers`, timestamps)
- `AiGuestMessage` (`sessionId`, `role`, `content`, `createdAt`)
- Source: `backend/prisma/schema.prisma:434`
- Source: `backend/prisma/schema.prisma:446`

Typical writes:

1. On `/guest/start`:
   - create session
   - create first assistant message

2. On each `/guest/chat`:
   - create user message
   - update session answers/step
   - create assistant message

3. On invalid message:
   - still create user + assistant feedback messages
   - no step advance

## 7) Frontend UI Behavior Notes

1. Input mode is driven by backend `inputConfig`:
   - text entry
   - option chips
   - multi-select chips + "Send selection"
- Source: `src/components/pages/GuestAIDemo.jsx:262`
- Source: `src/components/pages/GuestAIDemo.jsx:602`

2. For multi-select, frontend sends `message` as an array; backend supports this.
- Source: `src/components/pages/GuestAIDemo.jsx:644`

3. When response includes `history`, frontend replaces local message list with backend truth.
- Source: `src/components/pages/GuestAIDemo.jsx:363`

4. Proposal rendering:
   - Assistant message is detected as proposal-like via regex.
   - Parsed into a structured card UI.
- Source: `src/components/pages/GuestAIDemo.jsx:44`
- Source: `src/components/pages/GuestAIDemo.jsx:103`
- Source: `src/components/pages/GuestAIDemo.jsx:532`

## 8) API Payload Examples

### `GET /api/ai/services`

Response (shape overview):
```json
{
  "success": true,
  "services": [
    {
      "id": "website_uiux",
      "name": "Website Development",
      "description": "...",
      "min_budget": 50000,
      "currency": "INR",
      "questions": [
        {
          "id": "project_requirements",
          "question": "What do you need?",
          "type": "single_option",
          "options": [],
          "required": true
        }
      ]
    }
  ]
}
```

### `POST /api/guest/start`

Request:
```json
{
  "serviceId": "website_uiux"
}
```

Response:
```json
{
  "success": true,
  "sessionId": "cm...",
  "message": "First question text",
  "inputConfig": {
    "type": "single_option",
    "options": []
  },
  "history": [
    { "role": "assistant", "content": "First question text" }
  ]
}
```

### `POST /api/guest/chat` (text)

Request:
```json
{
  "sessionId": "cm...",
  "message": "We need a Flutter app in 3 months with a 2 lakh budget"
}
```

### `POST /api/guest/chat` (multi-select)

Request:
```json
{
  "sessionId": "cm...",
  "message": ["Android", "iOS"]
}
```

Response (typical mid-flow):
```json
{
  "success": true,
  "message": "Assistant reply + next question",
  "inputConfig": {
    "type": "text",
    "options": []
  },
  "history": [
    { "role": "assistant", "content": "..." },
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

Response (final step with proposal):
```json
{
  "success": true,
  "message": "Markdown proposal...",
  "inputConfig": { "type": "text", "options": [] },
  "history": [ ...full chat including proposal... ]
}
```

## 9) Quick Sequence Summary

```text
Browser /ai-demo
  -> GET /api/ai/services
  <- services

User picks service
  -> POST /api/guest/start
  <- sessionId + first question + inputConfig

Each user answer
  -> POST /api/guest/chat
       -> DB read session/service/questions
       -> AI extraction/validation (conditional)
       -> DB writes message + answers + step
       -> if final: AI proposal generation
  <- assistant response/history/inputConfig
```

## 10) Important Clarification

The `/ai-demo` page does **not** directly call:
- `POST /api/ai/chat`
- `POST /api/ai/proposal`

Instead, proposal generation is triggered internally inside `POST /api/guest/chat` when all required questionnaire steps are completed.
