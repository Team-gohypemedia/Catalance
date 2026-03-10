# Freelancer Matching Flow

This document describes how freelancer matching currently works in `src/shared/lib/freelancer-matching.js`.

Primary entry point:

- `rankFreelancersForProposal(freelancers, proposal)`

Supporting stages:

- `extractMatchingRequirements(proposal)`
- `buildCandidatePool(freelancers, requirements)`
- `computeScoreForProject(freelancer, serviceProject, requirements)`
- `prioritizeByTechCoverage(scoredFreelancers, requirements)`

## End-to-End Flow

```mermaid
flowchart TD
    A[Start: rankFreelancersForProposal] --> B{Freelancer list exists?}
    B -- No --> Z[Return empty array]
    B -- Yes --> C[Extract matching requirements from proposal]

    C --> C1[Parse proposal summary and content]
    C --> C2[Parse labeled fields from proposal text]
    C --> C3[Read proposalContext.questionnaireAnswersBySlug]
    C --> C4[Read proposalContext.questionnaireAnswers]
    C --> C5[Read proposalContext.capturedFields]
    C --> C6[Read proposalContext.appHints]

    C1 --> D[Build normalized requirements object]
    C2 --> D
    C3 --> D
    C4 --> D
    C5 --> D
    C6 --> D

    D --> D1[Resolve serviceKey]
    D --> D2[Extract technologies and canonical tech keys]
    D --> D3[Extract specializations]
    D --> D4[Extract industries]
    D --> D5[Extract requirement keywords]
    D --> D6[Extract budget]
    D --> D7[Extract timeline in months]
    D --> D8[Infer complexity]
    D --> D9[Detect ongoing project flag]

    D --> E[Build candidate pool]
    E --> E1[Strict filter<br/>status ACTIVE or PENDING_APPROVAL<br/>onboardingComplete true<br/>isVerified true<br/>matches service<br/>availability allows ongoing work]
    E1 --> E2{Strict pool >= 3?}
    E2 -- Yes --> F[Use strict pool]
    E2 -- No --> E3[Fallback: service-matched freelancers]
    E3 --> E4{Service-matched pool >= 3?}
    E4 -- Yes --> F
    E4 -- No --> E5[Fallback: verified freelancers]
    E5 --> E6{Any verified freelancers?}
    E6 -- Yes --> F
    E6 -- No --> E7[Fallback: all normalized freelancers]
    E7 --> F

    F --> G[For each freelancer in scoring pool]
    G --> G1[Get service projects matching requirements.serviceKey]
    G1 --> G2{Matching service projects found?}
    G2 -- No --> G3[Use single null variant]
    G2 -- Yes --> G4[Use each matching service project as a scoring variant]
    G3 --> H[Score each variant]
    G4 --> H

    H --> H1[Technology score]
    H --> H2[Specialization score]
    H --> H3[Industry score]
    H --> H4[Requirement relevance score]
    H --> H5[Budget compatibility score]
    H --> H6[Experience score]
    H --> H7[Complexity fit score]
    H --> H8[Rating score]
    H --> H9[Portfolio relevance score]

    H1 --> I[Resolve score weights]
    H2 --> I
    H3 --> I
    H4 --> I
    H5 --> I
    H6 --> I
    H7 --> I
    H8 --> I
    H9 --> I

    I --> J[Compute weighted totalScore]
    J --> K[Build match reasons, highlights, techMatch, budgetCompatibility]
    K --> L[Apply hard filters<br/>technology passes if no tech required or matchedCount > 0<br/>budget passes if not hardRejected]
    L --> M{Variant passes hard filters?}
    M -- No --> N[Discard variant]
    M -- Yes --> O[Keep variant]

    O --> P[Sort kept variants for the freelancer]
    P --> P1[Primary: totalScore desc]
    P --> P2[Tie-breaker 1: matched tech count desc]
    P --> P3[Tie-breaker 2: tech coverage desc]
    P --> P4[Tie-breaker 3: budget score desc]
    P4 --> Q[Pick best variant and attach match metadata to freelancer]

    Q --> R[After all freelancers are scored]
    R --> S[Prioritize by tech coverage]
    S --> S1{Tech requirements exist?}
    S1 -- No --> T[Skip tech-priority filter]
    S1 -- Yes --> S2[Keep freelancers with matchedCount > 0]
    S2 --> S3{Any full tech matches?}
    S3 -- Yes --> S4[Keep only full tech matches]
    S3 -- No --> S5[Keep partial tech matches]
    S4 --> T
    S5 --> T

    T --> U[Final sort]
    U --> U1[Primary: matchScore desc]
    U --> U2[Tie-breaker 1: tech coverage desc]
    U --> U3[Tie-breaker 2: budget score desc]
    U --> U4[Tie-breaker 3: rating desc]
    U --> U5[Tie-breaker 4: reviewCount desc]
    U5 --> V[Round matchScore]
    V --> W[Return ranked freelancers]
```

## Requirement Extraction Details

`extractMatchingRequirements(proposal)` pulls data from five places and merges them:

1. `proposal.summary` and `proposal.content`
2. Labeled fields parsed from proposal text
3. `proposal.proposalContext.questionnaireAnswersBySlug`
4. `proposal.proposalContext.questionnaireAnswers`
5. `proposal.proposalContext.capturedFields`

Extra app-specific hints can also contribute through `proposal.proposalContext.appHints`.

The output contains:

- `serviceKey`
- `technologies`
- `technologyCanonicals`
- `specializations`
- `industries`
- `requirementKeywords`
- `budget`
- `timelineMonths`
- `complexity`
- `isOngoingProject`

### Complexity Inference

If an explicit complexity hint exists, it wins.

Otherwise complexity is inferred with a score:

- Budget `>= 300000`: `+2`
- Budget `>= 100000`: `+1`
- Timeline `>= 6 months`: `+2`
- Timeline `>= 3 months`: `+1`
- Feature count `>= 10`: `+2`
- Feature count `>= 6`: `+1`

Final complexity:

- Score `>= 4` => `large`
- Score `>= 2` => `medium`
- Else => `small`

## Candidate Pool Fallback Order

The matcher does not always score every freelancer immediately. It first tries to narrow the pool:

1. Strict candidates
   - Allowed status: `ACTIVE` or `PENDING_APPROVAL`
   - `onboardingComplete === true`
   - `isVerified === true`
   - Matches the requested service
   - If the project is ongoing, at least one matching service project must allow in-progress work
2. If strict candidates are fewer than `3`, use service-matched freelancers
3. If still fewer than `3`, use verified freelancers
4. If none exist, fall back to the normalized freelancer list

## Score Weights

Base weights:

| Dimension | Weight |
| --- | ---: |
| Technology | 30 |
| Specialization | 22 |
| Industry | 13 |
| Requirement relevance | 12 |
| Budget | 13 |
| Experience | 5 |
| Complexity | 2 |
| Rating | 2 |
| Portfolio | 1 |

If no technology requirements are extracted:

- Technology weight becomes `0`
- `40%` of that weight moves to specialization
- `30%` moves to industry
- `30%` moves to requirement relevance

## Budget Compatibility Decision Tree

```mermaid
flowchart TD
    A[Start budget evaluation] --> B{Client budget exists?}
    B -- No --> B1[raw 0.5, no hard reject]
    B -- Yes --> C{Freelancer price range exists and can be parsed?}
    C -- No --> C1[raw 0.35, no hard reject]
    C -- Yes --> D[Parse min and max]
    D --> E{Client budget < min and min > clientBudget x 1.35?}
    E -- Yes --> E1[raw 0.1, hardRejected true]
    E -- No --> F{Budget within min..max?}
    F -- Yes --> F1[raw 1.0, withinRange true]
    F -- No --> G{Budget below min?}
    G -- Yes --> H{Gap <= 10%?}
    H -- Yes --> H1[raw 0.85]
    H -- No --> I{Gap <= 25%?}
    I -- Yes --> I1[raw 0.65]
    I -- No --> J{Gap <= 40%?}
    J -- Yes --> J1[raw 0.45]
    J -- No --> J2[raw 0.25]
    G -- No --> K{Open-ended max?}
    K -- Yes --> K1[raw 0.95]
    K -- No --> L{Overshoot <= 20%?}
    L -- Yes --> L1[raw 0.85]
    L -- No --> M{Overshoot <= 50%?}
    M -- Yes --> M1[raw 0.7]
    M -- No --> M2[raw 0.55]
```

Important hard rejection:

- A freelancer is budget-hard-rejected only when:
  - `clientBudget < minPrice`
  - and `minPrice > clientBudget * 1.35`

## Dimension-Level Scoring Summary

- Technology
  - Uses canonical tech aliases plus fuzzy tech matching
  - Full match is possible only when all required technologies are covered
- Specialization
  - Compares required specializations against service specializations
- Industry
  - Compares required industries against service and profile industry focus
- Requirement relevance
  - Tokenizes proposal keywords, removes stop words, then compares against freelancer skills, services, profile details, service details, project text, and portfolio text
- Budget
  - Uses client budget vs freelancer price range
- Experience
  - Maps years or declared experience band to a normalized rank
- Complexity
  - Checks whether freelancer service complexity fits the inferred project complexity
- Rating
  - Uses freelancer rating and review count
- Portfolio
  - Looks for overlap in tech, specialization, budget presence, and project links

## Hard Filters

A scored variant is discarded if either of these fails:

- Technology hard filter
  - If technology requirements exist, the freelancer must match at least one required technology
- Budget hard filter
  - The freelancer cannot be more than `35%` above the client budget floor

## Variant Selection Per Freelancer

A freelancer can have multiple matching service projects. Each project is scored as its own variant.

Variant comparison order:

1. `totalScore`
2. `techMatch.matchedCount`
3. `techMatch.coverage`
4. `budgetCompatibility.score`

Only the best variant survives and is attached back to the freelancer record.

## Final Ranking Order

After variant selection and tech-priority filtering, final freelancers are sorted by:

1. `matchScore`
2. `techMatch.coverage`
3. `budgetCompatibility.score`
4. `rating`
5. `reviewCount`

## Returned Matching Metadata

Each returned freelancer is enriched with:

- `matchScore`
- `matchBreakdown`
- `matchedTechnologies`
- `matchReasons`
- `matchHighlights`
- `techMatch`
- `budgetCompatibility`
- `matchedService`
- `matchHardFilters`

## Practical Summary

The matcher is a weighted scoring engine with two strong gating behaviors:

- Candidate pool narrowing before scoring
- Hard filtering after scoring for technology and severe budget mismatch

So in practice, a freelancer usually reaches the top only if they:

- match the requested service
- are verified and onboarding-ready
- cover at least part of the required tech stack
- are not materially outside the client budget
- show relevant specialization, industry, and portfolio evidence
