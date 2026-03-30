import test from "node:test";
import assert from "node:assert/strict";

const { __testables } = await import("../guest.controller.js");

const {
  applyAdminControlsToOptions,
  applyExtractedAnswerUpdates,
  buildAdminControlSummaryText,
  buildBusinessNameGuardPrompt,
  buildCurrentQuestionValidationPrompt,
  buildLockedServiceReply,
  buildPersistedAnswersPayload,
  buildSessionStartPrefill,
  buildSupplementalBudgetExtractions,
  buildQuestionDisplayAnswer,
  findExtractedBudgetMinimumViolation,
  findBudgetMinimumViolationChange,
  getBusinessNameValidationGuardAction,
  getDisplayedQuestionOptions,
  getBudgetMinimumValidationResult,
  normalizeAdviceVisibleOptions,
  normalizeGuestAdvicePayload,
  getQuestionAdminControls,
  getQuestionIdentityType,
  getMostRecentMessageContentByRole,
  getPostProposalBudgetFollowupAction,
  getSemanticDependentIndexesForChanges,
  getServiceScopedMessages,
  isBudgetQuestion,
  mergeExtractedAnswers,
  normalizeAnswerForQuestion,
  parseKnownBrandAffiliationResponse,
  parseAdminControlText,
  toChronologicalGuestHistory,
} = __testables;

const question = {
  slug: "frontend_framework",
  text: "Which frontend framework do you prefer?",
  type: "single_select",
  options: [
    { label: "Next.js", value: "nextjs" },
    { label: "React", value: "react" },
    { label: "Other", value: "other" },
  ],
};

const runtimeOptionsByQuestionSlug = {
  frontend_framework: [
    { label: "Fast Next.js build", value: "nextjs" },
    { label: "Plain React app", value: "react" },
    { label: "Other", value: "other" },
  ],
};

test("normalizes runtime option labels back to canonical values", () => {
  assert.equal(
    normalizeAnswerForQuestion(question, "Fast Next.js build", runtimeOptionsByQuestionSlug),
    "nextjs"
  );
  assert.equal(
    normalizeAnswerForQuestion(question, "React", runtimeOptionsByQuestionSlug),
    "react"
  );
});

test("persists canonical bySlug answers and readable byQuestionText answers", () => {
  const payload = buildPersistedAnswersPayload(
    { frontend_framework: "nextjs" },
    [question],
    { runtimeOptionsByQuestionSlug }
  );

  assert.equal(payload.bySlug.frontend_framework, "nextjs");
  assert.equal(
    payload.byQuestionText["Which frontend framework do you prefer?"],
    "Fast Next.js build"
  );
  assert.equal(
    payload.uiState.runtimeOptionsByQuestionSlug.frontend_framework[0].label,
    "Fast Next.js build"
  );
});

test("builds displayed answers from runtime option labels", () => {
  assert.equal(
    buildQuestionDisplayAnswer(question, "nextjs", runtimeOptionsByQuestionSlug),
    "Fast Next.js build"
  );
  assert.equal(
    getDisplayedQuestionOptions(question, runtimeOptionsByQuestionSlug)[0].label,
    "Fast Next.js build"
  );
});

test("normalizes popup advice options from numbered chat option objects", () => {
  const options = normalizeAdviceVisibleOptions([
    { number: 1, text: "Shopify (recommended for online stores)" },
    { number: 2, text: "WordPress (with WooCommerce)" },
    { number: 4, text: "Not sure - need suggestion" },
  ]);

  assert.deepEqual(
    options.map((option) => option.label),
    [
      "Shopify (recommended for online stores)",
      "WordPress (with WooCommerce)",
      "Not sure - need suggestion",
    ]
  );
});

test("maps AI recommendation text back to the exact visible option label", () => {
  const visibleOptionObjects = normalizeAdviceVisibleOptions([
    { number: 1, text: "Shopify (recommended for online stores)" },
    { number: 2, text: "WordPress (with WooCommerce)" },
  ]);

  const payload = normalizeGuestAdvicePayload({
    payload: {
      notice: "Recommended: Shopify. It gives you fast performance and strong SEO.",
      placeholder: "e.g. Shopify",
      recommendedAnswer: "Shopify",
    },
    isRecommendationMode: true,
    visibleOptionObjects,
  });

  assert.equal(payload.recommendedAnswer, "Shopify (recommended for online stores)");
  assert.equal(payload.notice, "Recommended: Shopify. It gives you fast performance and strong SEO.");
});

test("keeps binary recommendation answers hidden from visible helper copy", () => {
  const payload = normalizeGuestAdvicePayload({
    payload: {
      notice: "Recommended: Yes. This keeps the launch scope aligned with the stronger flow.",
      placeholder: "e.g. Yes",
      recommendedAnswer: "Yes",
    },
    isRecommendationMode: true,
  });

  assert.equal(payload.recommendedAnswer, "Yes");
  assert.match(payload.notice, /^Recommended direction:/);
  assert.doesNotMatch(payload.notice, /^Recommended:\s*(yes|no)\b/i);
  assert.notEqual(payload.placeholder.toLowerCase(), "e.g. yes");
});

test("reorders displayed options from question-level admin priority directives", () => {
  const prioritizedQuestion = {
    slug: "platform",
    text: "Which platform do you want to launch on?",
    type: "single_select",
    subtitle: "@prioritize: Android and iOS | Android only | iOS only",
    options: [
      { label: "iOS only", value: "ios" },
      { label: "Android only", value: "android" },
      { label: "Android and iOS", value: "both" },
    ],
  };

  assert.deepEqual(
    getDisplayedQuestionOptions(prioritizedQuestion, {}).map((option) => option.label),
    ["Android and iOS", "Android only", "iOS only"]
  );
});

test("maps admin-configured aliases back to the canonical option value", () => {
  const mappedQuestion = {
    slug: "platform",
    text: "Which platform do you want to launch on?",
    type: "single_select",
    subtitle: "@map: cross platform => Android and iOS; both apps => Android and iOS",
    options: [
      { label: "Android only", value: "android" },
      { label: "iOS only", value: "ios" },
      { label: "Android and iOS", value: "both" },
    ],
  };

  assert.equal(
    normalizeAnswerForQuestion(mappedQuestion, "cross platform", {}),
    "both"
  );
});

test("merges service and question admin controls with question overrides first", () => {
  const controls = getQuestionAdminControls(
    {
      subtitle: [
        "Choose the best launch platform.",
        "@prioritize: Android and iOS | Android only",
        "@map: cross platform => Android and iOS",
      ].join("\n"),
    },
    [
      "@reply: Keep replies concise.",
      "@recommend: Android and iOS",
      "@prioritize: iOS only",
    ].join("\n")
  );

  assert.equal(controls.recommendedOption, "Android and iOS");
  assert.deepEqual(controls.prioritizeOptions, [
    "Android and iOS",
    "Android only",
    "iOS only",
  ]);
  assert.deepEqual(controls.optionMappings, [
    { source: "cross platform", target: "Android and iOS" },
  ]);
  assert.match(buildAdminControlSummaryText(controls), /prefer Android and iOS/i);
});

test("prefills the first personal-name question from a logged-in user name", () => {
  const questions = [
    {
      slug: "company_name",
      text: "What is your company name?",
      type: "input",
    },
    {
      slug: "client_name",
      text: "What is your name?",
      type: "input",
    },
    {
      slug: "contact_name",
      text: "What is the contact name for this project?",
      type: "input",
    },
  ];

  assert.deepEqual(
    buildSessionStartPrefill({
      questions,
      prefillName: "  Ravindra    Kumar  ",
    }),
    {
      answersBySlug: { client_name: "Ravindra Kumar" },
      acknowledgedQuestion: questions[1],
      acknowledgedAnswer: "Ravindra Kumar",
    }
  );
});

test("does not prefill when the service has no personal-name question", () => {
  const questions = [
    {
      slug: "company_name",
      text: "What is your company name?",
      type: "input",
    },
  ];

  assert.deepEqual(
    buildSessionStartPrefill({
      questions,
      prefillName: "Ravindra",
    }),
    {
      answersBySlug: {},
      acknowledgedQuestion: null,
      acknowledgedAnswer: "",
    }
  );
});

test("parses admin control directives from free-text fields", () => {
  const parsed = parseAdminControlText([
    "Use this question to confirm the preferred launch path.",
    "@reply: Keep the answer short and direct.",
    "@validate: Treat WooCommerce as WordPress.",
    "@map: woocommerce => WordPress; elementor => WordPress",
  ].join("\n"));

  assert.equal(parsed.contextText, "Use this question to confirm the preferred launch path.");
  assert.deepEqual(parsed.responseRules, ["Keep the answer short and direct."]);
  assert.deepEqual(parsed.validationRules, ["Treat WooCommerce as WordPress."]);
  assert.deepEqual(parsed.optionMappings, [
    { source: "woocommerce", target: "WordPress" },
    { source: "elementor", target: "WordPress" },
  ]);
});

test("applies admin-recommended option ordering deterministically", () => {
  const reordered = applyAdminControlsToOptions(
    [
      { label: "WordPress", value: "wordpress" },
      { label: "Shopify", value: "shopify" },
      { label: "Custom Development", value: "custom" },
    ],
    {
      recommendedOption: "Custom Development",
      prioritizeOptions: ["Shopify"],
      optionMappings: [{ source: "bespoke", target: "Custom Development" }],
    }
  );

  assert.deepEqual(
    reordered.map((option) => option.label),
    ["Custom Development", "Shopify", "WordPress"]
  );
  assert.match(reordered[0].aliases.join(" "), /bespoke/i);
});

test("keeps custom off-menu option answers as-is", () => {
  const durationQuestion = {
    slug: "duration",
    text: "How long would you like to continue SEO services?",
    type: "single_select",
    options: [
      { label: "3 months", value: "3_months" },
      { label: "6 months", value: "6_months" },
      { label: "12 months", value: "12_months" },
    ],
  };

  assert.equal(normalizeAnswerForQuestion(durationQuestion, "2 months", {}), "2 months");
  assert.equal(buildQuestionDisplayAnswer(durationQuestion, "2 months", {}), "2 months");
  assert.equal(normalizeAnswerForQuestion(durationQuestion, "4 months", {}), "4 months");
  assert.equal(buildQuestionDisplayAnswer(durationQuestion, "4 months", {}), "4 months");
});

test("locks the chat to the originally selected service when another service is mentioned", () => {
  assert.equal(
    buildLockedServiceReply({
      currentServiceName: "SEO (Search Engine Optimisation)",
      targetServiceName: "Web Development",
    }),
    "Web Development is a different service from the current SEO (Search Engine Optimisation) service. This chat will stay on SEO (Search Engine Optimisation)."
  );
});

test("scopes proposal history to the active service boundary", () => {
  const messages = [
    {
      role: "assistant",
      content: "Old SEO proposal",
      createdAt: new Date("2026-03-25T09:00:00.000Z"),
    },
    {
      role: "user",
      content: "Create website proposal",
      createdAt: new Date("2026-03-25T09:05:00.000Z"),
    },
    {
      role: "assistant",
      content: "What are your website requirements?",
      createdAt: new Date("2026-03-25T09:10:00.000Z"),
    },
  ];

  const scoped = getServiceScopedMessages(messages, "2026-03-25T09:06:00.000Z");
  assert.deepEqual(
    scoped.map((message) => message.content),
    ["What are your website requirements?"]
  );
});

test("sorts guest history chronologically before returning it to the client", () => {
  const history = toChronologicalGuestHistory([
    {
      role: "assistant",
      content: "Latest reply",
      createdAt: new Date("2026-03-24T10:00:02.000Z"),
    },
    {
      role: "assistant",
      content: "First question",
      createdAt: new Date("2026-03-24T10:00:00.000Z"),
    },
    {
      role: "user",
      content: "My answer",
      createdAt: new Date("2026-03-24T10:00:01.000Z"),
    },
  ]);

  assert.deepEqual(history, [
    { role: "assistant", content: "First question" },
    { role: "user", content: "My answer" },
    { role: "assistant", content: "Latest reply" },
  ]);
});

test("classifies personal-name and business-name questions separately", () => {
  assert.equal(
    getQuestionIdentityType({ slug: "client_name", text: "What is your name?" }),
    "person_name",
  );
  assert.equal(
    getQuestionIdentityType({ slug: "company_name", text: "What is your company or brand name?" }),
    "business_name",
  );
});

test("asks for team affiliation when a known company name is used as the brand", () => {
  const action = getBusinessNameValidationGuardAction({
    question: { slug: "company_name", text: "What is your company or brand name?" },
    userMessage: "google",
  });

  assert.equal(action.type, "ask_known_brand_affiliation");
  assert.equal(action.brandName, "Google");
});

test("redirects Catalance brand answers instead of accepting them", () => {
  const action = getBusinessNameValidationGuardAction({
    question: { slug: "company_name", text: "What is your company or brand name?" },
    userMessage: "Catalance",
  });

  assert.equal(action.type, "reserved_platform_brand");
  assert.equal(action.brandName, "Catalance");
});

test("accepts a known company name when the user already shared their role", () => {
  const action = getBusinessNameValidationGuardAction({
    question: { slug: "company_name", text: "What is your company or brand name?" },
    userMessage: "Spinny - I lead marketing there",
  });

  assert.equal(action.type, "accept_known_brand");
  assert.equal(action.brandName, "Spinny");
});

test("keeps a known-brand follow-up pending until the user shares a role", () => {
  const question = { slug: "company_name", text: "What is your company or brand name?" };
  const pendingState = {
    questionSlug: "company_name",
    brandName: "Google",
  };

  assert.equal(
    getBusinessNameValidationGuardAction({
      question,
      userMessage: "yes",
      pendingState,
    }).type,
    "ask_pending_brand_role",
  );

  assert.equal(
    getBusinessNameValidationGuardAction({
      question,
      userMessage: "I am the product manager there",
      pendingState,
    }).type,
    "accept_pending_brand",
  );

  assert.equal(
    getBusinessNameValidationGuardAction({
      question,
      userMessage: "no",
      pendingState,
    }).type,
    "deny_pending_brand",
  );
});

test("parses role-bearing brand affiliation replies as confirmed", () => {
  assert.equal(parseKnownBrandAffiliationResponse("I am the founder"), "confirmed");
  assert.equal(parseKnownBrandAffiliationResponse("yes"), "needs_more_detail");
  assert.equal(parseKnownBrandAffiliationResponse("no"), "denied");
});

test("validation prompt no longer hard-rejects every famous brand name", () => {
  const prompt = buildCurrentQuestionValidationPrompt({
    serviceName: "Web Development",
    servicePrompt: "",
    currentQuestionText: "What is your company or brand name?",
    currentQuestionOptions: [],
    currentQuestionNumberedOptions: [],
    currentQuestionCanonicalOptions: [],
    knownContextByQuestion: {},
    savedResponseContext: "",
    currentQuestionContext: "",
    lastAssistantMessage: "",
    userMessageText: "Google",
    attachmentContextText: "",
    urlContextText: "",
    attachmentInferredAnswer: "",
    validationResponseRules: "Keep the response brief.",
  });

  assert.match(prompt, /Catalance.*project or brand name/i);
  assert.match(prompt, /do NOT automatically reject/i);
});

test("builds an AI-writing prompt for business-name guard replies", () => {
  const prompt = buildBusinessNameGuardPrompt({
    serviceName: "Web Development",
    servicePrompt: "",
    scenario: "ask_known_brand_affiliation",
    brandName: "Google",
    userLastMessage: "google",
    currentQuestion: { slug: "company_name", text: "What is your company or brand name?" },
    answersByQuestionText: { "What is your name?": "Ravindra" },
    answersBySlug: { client_name: "Ravindra" },
    allQuestions: [
      { slug: "client_name", text: "What is your name?" },
      { slug: "company_name", text: "What is your company or brand name?" },
    ],
    runtimeOptionsByQuestionSlug: {},
    lastAssistantMessage: "What is your company or brand name?",
  });

  assert.match(prompt, /writing one assistant message/i);
  assert.match(prompt, /known brand affiliation check/i);
  assert.match(prompt, /Are you part of the team\? What's your role there\?/i);
  assert.match(prompt, /Return strict JSON only/i);
});

test("does not backfill a personal-name field from a business-name answer", () => {
  const questions = [
    { slug: "client_name", text: "What is your name?" },
    { slug: "company_name", text: "What is your company or brand name?" },
  ];

  const result = applyExtractedAnswerUpdates({
    baseAnswersBySlug: { company_name: "Sohan" },
    existingAnswersBySlug: {},
    extractedAnswers: [{ slug: "client_name", answer: "Sohan", confidence: 0.99 }],
    questionIndexBySlug: new Map(questions.map((question, index) => [question.slug, index])),
    questionsBySlug: new Map(questions.map((question) => [question.slug, question])),
    questionSlugSet: new Set(questions.map((question) => question.slug)),
    runtimeOptionsByQuestionSlug: {},
    currentStep: 1,
    currentQuestion: questions[1],
    ignoreSlug: "company_name",
    correctionIntent: false,
    logPrefix: "[Test Auto Capture]",
  });

  assert.deepEqual(result.answersBySlug, { company_name: "Sohan" });
  assert.deepEqual(result.updatedSlugs, []);
});

test("reopens the business-name step when a corrected personal name matches it", () => {
  const questions = [
    { slug: "client_name", text: "What is your name?" },
    { slug: "company_name", text: "What is your company or brand name?" },
    { slug: "about_business", text: "Briefly describe your business and what you offer?" },
  ];

  const result = getSemanticDependentIndexesForChanges(
    questions,
    [
      {
        index: 0,
        slug: "client_name",
        previousValue: "Ravindra",
        nextValue: "Rohan",
      },
    ],
    {
      client_name: "Rohan",
      company_name: "Rohan",
      about_business: "We create CGI videos.",
    },
  );

  assert.deepEqual(result, [1]);
});

test("finds the most recent assistant message for validation context", () => {
  const messages = [
    { role: "assistant", content: "Earlier recommendation" },
    { role: "user", content: "Can you recommend one?" },
    { role: "assistant", content: "I recommend **Cross-platform** for launch speed." },
  ];

  assert.equal(
    getMostRecentMessageContentByRole(messages, "assistant"),
    "I recommend **Cross-platform** for launch speed."
  );
});

test("builds a validation prompt that lets the model accept the assistant recommendation", () => {
  const prompt = buildCurrentQuestionValidationPrompt({
    serviceName: "App Development",
    servicePrompt: "@reply: Keep replies concise.",
    currentQuestionText: "Which platform do you want to launch on?",
    currentQuestionOptions: ["Android only", "iOS only", "Android and iOS"],
    currentQuestionNumberedOptions: [
      "1. Android only",
      "2. iOS only",
      "3. Android and iOS",
    ],
    currentQuestionCanonicalOptions: ["Android only", "iOS only", "Android and iOS"],
    knownContextByQuestion: { "Preferred app type": "Marketplace" },
    savedResponseContext: "Preferred mobile app development approach: Flutter",
    currentQuestionSubtitle: [
      "Choose the launch platform",
      "@recommend: Android and iOS",
      "@map: cross platform => Android and iOS",
    ].join("\n"),
    userMessageText: "okay",
    attachmentContextText: "",
    attachmentInferredAnswer: "",
    lastAssistantMessage:
      "I recommend **Android and iOS** because cross-platform development aligns well with your selected stack.",
    validationResponseRules: "- If VALID: use one short acknowledgement.",
  });

  assert.match(prompt, /Last Assistant Message Shown To User/);
  assert.match(prompt, /I recommend \*\*Android and iOS\*\*/);
  assert.match(prompt, /brief agreement or approval/);
  assert.match(prompt, /set "normalizedAnswer" to the exact recommended option label or value/i);
  assert.match(prompt, /Admin Controls \(highest priority when relevant\)/);
  assert.match(prompt, /Option mapping alias: "cross platform" => "Android and iOS"/);
});

test("detects budget questions from question text", () => {
  assert.equal(
    isBudgetQuestion({ slug: "user_budget", text: "What is your budget for this project?" }),
    true
  );
  assert.equal(
    isBudgetQuestion({ slug: "timeline", text: "When do you want to launch?" }),
    false
  );
});

test("detects late budget update messages outside the active budget step", () => {
  const extracted = buildSupplementalBudgetExtractions({
    message: "update budget 5k",
    currentQuestion: {
      slug: "q_final_notes",
      text: "Is there anything else you want to mention before I prepare the proposal?"
    },
    questions: [
      {
        slug: "q_web_budget",
        text: "What kind of budget range are you planning for this project?"
      },
      {
        slug: "q_final_notes",
        text: "Is there anything else you want to mention before I prepare the proposal?"
      }
    ]
  });

  assert.deepEqual(extracted, [
    {
      slug: "q_web_budget",
      answer: "update budget 5k",
      confidence: 0.99
    }
  ]);
});

test("flags late extracted budget updates that go below the service minimum", () => {
  const extractedAnswers = buildSupplementalBudgetExtractions({
    message: "update budget to 5k",
    currentQuestion: {
      slug: "q_final_notes",
      text: "Is there anything else you want to mention before I prepare the proposal?"
    },
    questions: [
      {
        slug: "q_web_budget",
        text: "What kind of budget range are you planning for this project?"
      }
    ]
  });

  const violation = findExtractedBudgetMinimumViolation({
    extractedAnswers,
    questionsBySlug: new Map([
      [
        "q_web_budget",
        { slug: "q_web_budget", text: "What kind of budget range are you planning for this project?" }
      ]
    ]),
    service: { name: "Web Development", minBudget: 10000, currency: "INR" }
  });

  assert.ok(violation);
  assert.equal(violation.extractedAnswer.slug, "q_web_budget");
  assert.match(violation.validation.message, /below the minimum for Web Development/i);
  assert.match(violation.validation.message, /INR 10,000/);
});

test("blocks post-proposal regeneration when requested budget goes below minimum", () => {
  const action = getPostProposalBudgetFollowupAction({
    userMessage: "update my budget to 5k and regenerate the proposal",
    service: { name: "Web Development", minBudget: 10000, currency: "INR" },
    questions: [
      {
        slug: "q_web_budget",
        text: "What kind of budget range are you planning for this project?"
      }
    ],
    existingAnswersBySlug: { q_web_budget: "10k" },
    runtimeOptionsByQuestionSlug: {}
  });

  assert.ok(action);
  assert.equal(action.proposedAnswersBySlug, null);
  assert.match(action.blockedMessage, /below the minimum for Web Development/i);
  assert.match(action.blockedMessage, /INR 10,000/);
});

test("prepares a valid post-proposal budget update for regeneration", () => {
  const action = getPostProposalBudgetFollowupAction({
    userMessage: "update my budget to 15k and regenerate the proposal",
    service: { name: "Web Development", minBudget: 10000, currency: "INR" },
    questions: [
      {
        slug: "q_web_budget",
        text: "What kind of budget range are you planning for this project?"
      }
    ],
    existingAnswersBySlug: { q_web_budget: "10k" },
    runtimeOptionsByQuestionSlug: {}
  });

  assert.ok(action);
  assert.equal(action.blockedMessage, "");
  assert.equal(action.proposedAnswersBySlug.q_web_budget, "update my budget to 15k and regenerate the proposal");
  assert.match(action.reply, /budget updated to INR 15,000/i);
});

test("rejects budget answers below the service minimum", () => {
  const result = getBudgetMinimumValidationResult({
    question: { slug: "user_budget", text: "What is your budget for this project?" },
    service: { name: "Web Development", minBudget: 10000, currency: "INR" },
    answerText: "INR 5000",
  });

  assert.ok(result);
  assert.equal(result.isValid, false);
  assert.equal(result.status, "invalid_answer");
  assert.match(result.message, /below the minimum for Web Development/i);
  assert.match(result.message, /INR 10,000/);
  assert.match(result.message, /Please increase your budget/i);
});

test("accepts budget answers that meet the service minimum", () => {
  const result = getBudgetMinimumValidationResult({
    question: { slug: "user_budget", text: "What is your budget for this project?" },
    service: { name: "Web Development", minBudget: 10000, currency: "INR" },
    answerText: "15k",
  });

  assert.equal(result, null);
});

test("detects below-minimum budget corrections for earlier answers", () => {
  const violation = findBudgetMinimumViolationChange({
    changes: [
      {
        index: 0,
        slug: "q_web_budget",
        previousValue: "20k",
        nextValue: "i changed my mind, now my budget is 100rs",
      },
    ],
    questions: [
      { slug: "q_web_budget", text: "What kind of budget range are you planning for this project?" },
    ],
    service: { name: "Web Development", minBudget: 10000, currency: "INR" },
  });

  assert.ok(violation);
  assert.equal(violation.change.slug, "q_web_budget");
  assert.match(violation.validation.message, /below the minimum for Web Development/i);
  assert.match(violation.validation.message, /INR 10,000/);
});

test("does not let transcript enrichment overwrite a confirmed minimum budget with a lower value", () => {
  const merged = mergeExtractedAnswers({
    baseAnswers: { q_web_budget: "10k" },
    extractedAnswers: [
      {
        slug: "q_web_budget",
        answer: "update my budget to 5k",
        confidence: 0.95,
      },
    ],
    validSlugs: new Set(["q_web_budget"]),
    questionsBySlug: new Map([
      [
        "q_web_budget",
        { slug: "q_web_budget", text: "What kind of budget range are you planning for this project?" },
      ],
    ]),
    runtimeOptionsByQuestionSlug: {},
    service: { name: "Web Development", minBudget: 10000, currency: "INR" },
  });

  assert.equal(merged.q_web_budget, "10k");
});
