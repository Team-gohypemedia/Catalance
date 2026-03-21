import test from "node:test";
import assert from "node:assert/strict";

const { __testables } = await import("../guest.controller.js");

const {
  buildPersistedAnswersPayload,
  buildQuestionDisplayAnswer,
  getDisplayedQuestionOptions,
  mapNumericReplyToOptions,
  normalizeAnswerForQuestion,
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

test("maps numeric replies against displayed runtime options", () => {
  const mapped = mapNumericReplyToOptions(question, "1", runtimeOptionsByQuestionSlug);
  assert.equal(mapped.matched, true);
  assert.equal(mapped.normalizedText, "Fast Next.js build");
  assert.deepEqual(mapped.selectedLabels, ["Fast Next.js build"]);
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
