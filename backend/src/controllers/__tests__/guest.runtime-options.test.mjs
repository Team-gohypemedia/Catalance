import test from "node:test";
import assert from "node:assert/strict";

const { __testables } = await import("../guest.controller.js");

const {
  buildLockedServiceReply,
  buildPersistedAnswersPayload,
  buildQuestionDisplayAnswer,
  getDisplayedQuestionOptions,
  getServiceScopedMessages,
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
