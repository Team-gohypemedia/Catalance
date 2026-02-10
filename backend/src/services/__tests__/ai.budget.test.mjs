import test from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";
process.env.OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "test-key";
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://localhost:5432/catalance_test";
process.env.JWT_SECRET =
  process.env.JWT_SECRET || "12345678901234567890123456789012";
process.env.PASSWORD_PEPPER =
  process.env.PASSWORD_PEPPER || "1234567890abcdef";

const { __testables } = await import("../ai.service.js");
const { buildBudgetOverrideMessage, buildUserInputGuardMessage } = __testables;

const SERVICE_NAME = "Web Development";
const BUDGET_QUESTION = "What is your budget for this project?";

const assistant = (content) => ({ role: "assistant", content });
const user = (content) => ({ role: "user", content });

const runBudgetOverride = (conversationHistory) =>
  buildBudgetOverrideMessage({
    conversationHistory,
    messages: [],
    selectedServiceName: SERVICE_NAME
  });

test("acknowledges when budget meets minimum and does not re-ask", () => {
  const history = [assistant(BUDGET_QUESTION), user("INR 15000")];
  const acknowledgement = runBudgetOverride(history);

  assert.ok(acknowledgement);
  assert.match(
    acknowledgement,
    /budget is noted|budget noted|budget confirmed/i
  );
  assert.doesNotMatch(acknowledgement, /below|increase/i);

  const followUp = runBudgetOverride([
    ...history,
    assistant(acknowledgement),
    user("We also need analytics integration.")
  ]);
  assert.equal(followUp, null);
});

test("shows below-minimum warning once and does not repeat it", () => {
  const history = [assistant(BUDGET_QUESTION), user("INR 5000")];
  const warning = runBudgetOverride(history);

  assert.ok(warning);
  assert.match(warning, /below the standard minimum requirement/i);
  assert.match(warning, /could you increase your budget/i);

  const repeatedWarning = runBudgetOverride([
    ...history,
    assistant(warning),
    user("Timeline is about 2 months.")
  ]);
  assert.equal(repeatedWarning, null);
});

test("accepts low budget when user cannot increase and does not loop", () => {
  const history = [assistant(BUDGET_QUESTION), user("INR 5000")];
  const warning = runBudgetOverride(history);
  assert.ok(warning);

  const acceptedWithLimits = runBudgetOverride([
    ...history,
    assistant(warning),
    user("I can't increase the budget.")
  ]);

  assert.ok(acceptedWithLimits);
  assert.match(
    acceptedWithLimits,
    /scope, features, and quality of work may be limited/i
  );
  assert.doesNotMatch(acceptedWithLimits, /would you like to continue/i);

  const shouldNotRepeat = runBudgetOverride([
    ...history,
    assistant(warning),
    user("I can't increase the budget."),
    assistant(acceptedWithLimits),
    user("Please continue to the next step.")
  ]);
  assert.equal(shouldNotRepeat, null);
});

test("accepts repeated same lower amount without re-asking budget", () => {
  const history = [assistant(BUDGET_QUESTION), user("INR 5000")];
  const warning = runBudgetOverride(history);
  assert.ok(warning);

  const acceptedWithLimits = runBudgetOverride([
    ...history,
    assistant(warning),
    user("INR 5000")
  ]);
  assert.ok(acceptedWithLimits);
  assert.match(
    acceptedWithLimits,
    /scope, features, and quality of work may be limited/i
  );
  assert.doesNotMatch(acceptedWithLimits, /could you increase your budget/i);
});

test("input guard does not force re-entry when user says cannot increase", () => {
  const guardMessage = buildUserInputGuardMessage({
    conversationHistory: [
      assistant(
        "The amount you provided is below the standard minimum requirement. Could you increase your budget to at least INR 10000?"
      )
    ],
    messages: [user("I cannot increase it.")],
    selectedServiceName: SERVICE_NAME
  });

  assert.equal(guardMessage, null);
});
