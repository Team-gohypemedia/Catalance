# Proposal To Freelancer Matching Flow

This document describes the current backend logic for client proposal or project data being matched to freelancers.

It reflects the current implementation in:

- `backend/src/controllers/proposal.controller.js`
- `backend/src/controllers/matching.controller.js`
- `backend/src/services/proposal-matching.service.js`
- `backend/src/controllers/project.controller.js`
- `backend/src/services/project-manager-assignment.service.js`
- `backend/src/modules/users/user.service.js`

## 1) Main Entry Points

There are 4 related backend flows.

### A. Match freelancers from a saved project or proposal

- Route: `POST /api/proposals/match-freelancers`
- Input:
  - `proposalId`, or
  - proposal-like payload in the request body

Behavior:

- If `proposalId` is provided, backend first tries DB-backed matching.
- If that lookup fails with `400` or `404`, and request also contains a usable payload, backend falls back to payload-based matching.
- If only payload is sent, matching runs directly from payload without needing a saved proposal/project.

### B. Run matching from matching routes

- Route: `POST /api/matching/proposals/:proposalId/run`
- Route: `GET /api/matching/proposals/:proposalId/results`

Behavior:

- Both call the same ranking service.
- The `:proposalId` can resolve either:
  - directly to a `Project.id`, or
  - to a `Proposal.id` whose related project is then used as the source

### C. Create a project or proposal

- Route: `POST /api/projects`
- Route: `POST /api/proposals`

Behavior:

- These routes create records.
- They do not automatically run freelancer ranking after creation.
- `POST /api/projects` does generate and store hidden project matching context in `freelancerMatchingJson`.
- `POST /api/proposals` only creates or reopens a proposal and sends notifications.

Important current limitation:

- The ranking logic exists, but project or proposal creation does not automatically return matched freelancers in the same request.

### D. Match freelancers for agency multi-service proposals

Behavior:

- If proposal is marked as agency flow or contains more than one selected service, backend now uses a separate multi-service matching branch.
- The existing single-service matcher is reused per service.
- Backend runs one full match for each requested service.
- Only freelancers who appear in all service result sets are kept in final output.
- Agencies are not forced exclusively; both individuals and agencies can match if they cover every requested service.
- If matched freelancer has `FreelancerProfile.profileRole = agency`, response includes that label so UI can show it.

## 2) Source Resolution Logic

When matching is run by `proposalId`, backend resolves the source in this order:

1. Try to find a `Project` whose `id` equals the provided id.
2. If not found, try to find a `Proposal` whose `id` equals the provided id.
3. If proposal exists, use `proposal.project` as the source.
4. If neither is found, throw `404`.

This means the variable name `proposalId` is slightly misleading in current code because it can also be a project id.

## 3) Payload Normalization Logic

When matching is run from payload, backend normalizes missing fields from multiple possible locations.

It fills from:

- `proposal.serviceType`
- `proposal.proposalContext.serviceType`
- `proposal.project.serviceType`
- `proposal.service`
- `proposal.serviceName`
- `proposal.project.category`

Similar fallback chains exist for:

- `title`
- `summary`
- `content`
- `service`
- `serviceKey`
- `budget`
- `projectStack`
- `techStack`
- `projectId`

Result:

- Matching can still run even when frontend sends incomplete proposal-shaped payloads.

## 4) Freelancer Pool Logic

The candidate pool is built from `listUsers(...)`.

Current filters:

- `role = FREELANCER`
- `status = ACTIVE` and `status = PENDING_APPROVAL`
- `onboardingComplete = true`
- freelancer must have a related `freelancerProfile`

The service merges:

- active freelancers
- pending-approval freelancers

This is why logs can show:

- `freelancerPoolCount`
- `openToWorkCount`
- `closedToWorkCount`

## 5) Completed Project Pool Logic

Level 1 matching uses completed project history.

Backend loads completed projects filtered by matching hints such as:

- `serviceKey`
- `projectTypes`
- `niches`

If completed-project lookup fails, backend does not fail the whole request.

Fallback behavior:

- It logs:
  - `[Proposal Matching] Level 1 completed-project matching unavailable; continuing with Level 2/3:`
- Then it continues with case study and profile matching.

This is a resilience fallback, not a fatal error.

## 6) Matching Modes

There are 2 matching modes now.

### Single-service mode

- Used for the normal freelancer flow.
- Uses one target service and the standard 3 matching levels.

### Agency multi-service mode

- Used when `isAgencyProposal = true`, `proposalContext.flowMode = agency`, or selected services contain more than one service.
- Backend keeps the exact current single-service matching logic for each service separately.
- After per-service ranking finishes, backend intersects freelancer ids across all requested services.
- Final output contains only freelancers who matched every service in the proposal.
- Response metadata includes:
  - `matchingMode = agency_multi_service`
  - `agencyServiceKeys`
  - `agencyServiceCount`
  - `perServiceMatchCounts`
  - `intersectionCount`
  - `intersectionStrategy = all_services`

Important:

- Single-service ranking behavior is unchanged.

## 7) Three Matching Levels

Ranking is performed in 3 levels.

### Level 1: Completed project matching

Evidence source:

- archived or completed projects already delivered by freelancers

Checks:

- service alignment
- skills overlap
- niche overlap
- project type overlap
- budget fit
- timeline fit
- text relevance
- availability

Priority:

- strongest evidence
- highest source priority score

### Level 2: Case study matching

Evidence source:

- freelancer case studies or portfolio project records

Checks:

- case-study service alignment
- skills overlap
- budget fit
- text relevance
- availability

Rule difference from Level 1:

- service match alone is not enough
- there must also be concrete overlap from skills, niches, project types, or text relevance

### Level 3: Profile matching

Evidence source:

- freelancer profile service data
- profile details
- skills
- niches
- service metadata

Checks:

- service alignment
- skills overlap
- niche overlap
- project type overlap
- budget fit
- text relevance
- availability

Rule difference from Level 1:

- service-only matches are rejected here too
- profile match needs concrete overlap, not just same service label

## 8) Min Result Expansion Logic

Current defaults:

- `limit = 20`
- `minResults = 5`

Selection flow:

1. Run Level 1.
2. If selected candidates are still below `minResults`, run Level 2.
3. If still below `minResults`, run Level 3.
4. Merge unique freelancers across levels.
5. Keep the better candidate version if the same freelancer appears in multiple levels.
6. Sort final results and cut to `limit`.

Important effect:

- `levelCounts` are counts per level before final deduped output.
- Final `matched` count can be lower than `level1 + level2 + level3` because the same freelancer can pass more than one level.

## 9) Availability Logic

A freelancer is immediately rejected if either condition is true:

- `openToWork === false`
- active project count is greater than or equal to `OPEN_TO_WORK_MIN_ACTIVE_PROJECT_COUNT`

Current active-project threshold:

- `5`

If eligible, availability score is:

- `10 - activeProjectCount * 2`
- minimum returned score is `2`

Failure reason used:

- `availability_not_eligible`

## 10) Budget Logic

Budget logic is intentionally asymmetric.

Current rule:

- freelancer budget means the freelancer's minimum acceptable project value
- project is hard rejected only when the full project budget ceiling is below freelancer minimum budget

Hard rejection case:

- if `projectBudgetCeiling < freelancerMinimumBudget`

Failure reason used:

- `budget_hard_rejected`

If not rejected:

- match is considered budget-compatible
- service returns `withinRange = true`
- budget contributes score and match percentage

Important consequence:

- A higher project budget does not hurt the match.
- A too-low project budget can fully remove the candidate.

## 11) Service Matching Logic

Service values are normalized into canonical service signals.

Current alias groups include examples like:

- `web_development`
- `website_development`
- `web_dev`
- `app_development`
- `mobile_app_development`
- `seo`
- `search_engine_optimization`

Service scoring behavior:

- if target has service signal and source matches it, service gets strong positive score
- if target has service signal and source clearly mismatches it, candidate fails
- if target has no service signal but source does, source can still contribute weak positive signal

Failure reason used for explicit mismatch:

- `service_category_mismatch`

## 12) Concrete Overlap Logic

For Level 2 and Level 3, service match by itself is not enough.

Backend requires at least one of:

- matched skills
- matched niches
- matched project types or tags
- text relevance score above zero

If service matches but none of the above overlaps exist, candidate fails with:

- `service_only_without_concrete_overlap`

## 13) No-Signal Logic

If candidate has no meaningful overlap at all, backend rejects it.

Current signal sources:

- service match
- skills overlap
- niche overlap
- project type overlap
- text relevance

If none match, failure reason is:

- `no_signal_match`

## 14) Scoring Inputs

Current scoring components include:

- source level priority
- service score
- skills score
- niche score
- budget score
- project type score
- timeline score
- text relevance score
- availability score
- rating score
- recency bonus

There are also penalties for weak or low-evidence matches.

## 15) Diagnostics Logging Logic

In non-production, backend logs:

- Level 1 summary
- Level 1 diagnostics
- Level 2 summary
- Level 2 diagnostics
- Level 3 summary
- Level 3 diagnostics
- request summary
- final results summary

Each diagnostics entry can include:

- `levelKey`
- `passed`
- `failReason`
- `freelancerId`
- `freelancerName`
- `sourceType`
- `sourceTitle`
- check summaries

This is for debugging only and does not change ranking logic.

## 16) All Current Failure Cases

The current explicit failure reasons in the ranking engine are:

### `availability_not_eligible`

When:

- freelancer is not open to work, or
- freelancer active projects reached the current threshold

What happens:

- candidate is removed immediately from that evaluation path

### `budget_hard_rejected`

When:

- project budget is fully below the freelancer minimum budget

What happens:

- candidate is removed immediately from that evaluation path

### `no_signal_match`

When:

- no service, skill, niche, project-type, or text signal matches

What happens:

- candidate is removed from that evaluation path

### `service_category_mismatch`

When:

- target service signal exists
- source service signal also exists
- normalized service categories do not match

What happens:

- candidate is removed from that evaluation path

### `service_only_without_concrete_overlap`

When:

- candidate is in Level 2 or Level 3
- service matches
- but there is no concrete overlap from skills, niches, project type, or text relevance

What happens:

- candidate is removed from that evaluation path

## 17) What Happens When Logic Fails

There are 3 different meanings of "fail" in current flow.

### A. Source lookup fail

Examples:

- empty id
- unknown project id
- unknown proposal id

What happens:

- `400` if id is invalid or missing
- `404` if source does not exist
- if request also contains payload and the failure is `400` or `404`, controller falls back to payload matching

### B. Completed-project data fail

Example:

- Level 1 source loading fails

What happens:

- request does not fail
- backend logs warning
- matching continues with Level 2 and Level 3

### C. Candidate evaluation fail

Examples:

- service mismatch
- no overlap
- too-low budget
- freelancer not available

What happens:

- only that candidate is removed from that level
- whole request still succeeds

## 18) How Results Are Returned

Controller normalizes returned freelancer records into response-friendly objects.

Returned fields include examples like:

- `freelancerId`
- `name`
- `title`
- `bio`
- `avatarUrl`
- `service`
- `serviceType`
- `serviceKey`
- `proposalBudget`
- `startingPrice`
- `matchedSkills`
- `matchedCaseStudyTitles`
- `profileRole`
- `isAgencyProfile`
- `coveredServices`
- `coveredServiceKeys`
- `serviceMatches`
- match percentage and scoring metadata

Route response includes:

- `success`
- `proposalId`
- `data`
- `freelancers`
- `total`
- `levelCounts`
- `meta`

For agency multi-service matches:

- `serviceMatches` contains one match summary per required service
- `coveredServiceKeys` shows which services were covered in the intersection result
- `coveredServices` shows the human-readable matched services

## 19) Current Project Creation Logic Around Matching

When client creates a project with `POST /api/projects`:

1. Backend builds structured proposal fields.
2. Backend determines agency vs freelancer proposal mode.
3. Backend builds hidden freelancer matching context.
4. Backend looks for least-loaded active project manager.
5. Backend creates project with `freelancerMatchingJson`.
6. Backend may create an attached proposal if `proposal.coverLetter` exists.
7. Backend returns created project and proposal.

Important:

- This stores matching seed/context.
- It does not run the ranking service automatically.

This explains why a later explicit call to `/api/proposals/match-freelancers` is still needed today.

## 20) Current Project Manager Assignment Logic

During project creation, backend logs:

- `Looking for an available Project Manager...`
- `Assigning Project Manager: <id or None found>`

Assignment rules:

- only users with role `PROJECT_MANAGER`
- only status `ACTIVE`
- exclude PMs already at max active project limit
- current max active projects per PM is `10`
- if PM profile defines allowed service keys, project service must be eligible
- tie-breaker is lowest active project count, then oldest creation date

If no eligible PM is found:

- project can still be created with `managerId = null`

## 21) What Your Shared Logs Mean

Based on the log sample you pasted:

### `sourceType: 'payload'`

Meaning:

- matching was run from request body payload
- not from a saved proposal or project lookup

### `completedProjectPoolCount: 0`

Meaning:

- there were no completed-project records available for this match
- so Level 1 had nothing to evaluate

This matches:

- `Level 1 totalChecked: 0`
- `levelCounts.level1 = 0`

### `Level 2 passed: 2`

Meaning:

- 2 case-study candidates passed
- 17 case-study evaluations failed for reasons such as:
  - `no_signal_match`
  - `service_only_without_concrete_overlap`
  - `budget_hard_rejected`
  - `service_category_mismatch`

### `Level 3 passed: 6`

Meaning:

- 6 profile-based candidates passed
- 6 profile-based evaluations failed

### Final `matched: 7`

Meaning:

- passed candidates from Level 2 and Level 3 were merged
- duplicates were deduplicated
- final output had 7 unique freelancers

This is why:

- `level2 = 2`
- `level3 = 6`
- final unique matches = `7`, not `8`

### `POST /api/projects 201`

Meaning:

- project was created successfully after matching request
- project creation also assigned a PM and stored matching context
- but it did not auto-run ranking as part of `POST /api/projects`

### repeated `GET /api/projects` and `GET /api/proposals?as=owner`

Meaning:

- frontend was refreshing project and owner proposal lists
- these are not the matching engine itself

## 22) Current Behavior Summary

Today the system behaves like this:

1. Client or frontend can send proposal/project-like payload to `/api/proposals/match-freelancers`.
2. Backend normalizes the payload.
3. Backend decides whether this is single-service mode or agency multi-service mode.
4. Backend loads freelancer pool and completed-project pool.
5. Single-service mode ranks freelancers through Level 1, then Level 2, then Level 3 until minimum result threshold is met.
6. Agency multi-service mode runs that same ranking separately per service, then keeps only freelancer ids present in every service result set.
7. Backend logs detailed diagnostics in non-production.
8. Backend returns normalized freelancer matches.
9. Creating a project later stores matching context and assigns a PM, but does not auto-run ranking.

## 23) Practical Current Gaps

Current implementation gaps:

- `POST /api/projects` does not automatically run ranking after project creation
- `POST /api/proposals` does not automatically run ranking after proposal creation
- matching result is computed on demand, not persisted as a final match snapshot
- Level 1 depends on completed-project data quality and availability

## 24) Recommended Next Step If You Want Full Automation

If you want the flow to be fully automatic after client proposal or project creation, backend should do this:

1. Create project.
2. Store `freelancerMatchingJson`.
3. Immediately call `matchFreelancersForProposal(project.id)`.
4. Return created project plus matched freelancers in the same response.
5. Optionally persist a match snapshot for later UI reuse.
