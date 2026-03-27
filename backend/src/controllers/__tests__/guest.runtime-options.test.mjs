import test from "node:test";
import assert from "node:assert/strict";

const { __testables } = await import("../guest.controller.js");

const {
  applyExtractedAnswerUpdates,
  buildCurrentQuestionValidationPrompt,
  buildLockedServiceReply,
  buildPersistedAnswersPayload,
  buildQuestionDisplayAnswer,
  findBudgetMinimumViolationChange,
  getDisplayedQuestionOptions,
  getBudgetMinimumValidationResult,
  getQuestionIdentityType,
  getMostRecentMessageContentByRole,
  getSemanticDependentIndexesForChanges,
  getServiceScopedMessages,
  isBudgetQuestion,
  normalizeAnswerForQuestion,
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
    servicePrompt: "",
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
    currentQuestionSubtitle: "Choose the launch platform",
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
