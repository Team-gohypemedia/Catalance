import test from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://localhost:5432/catalance_test";
process.env.JWT_SECRET =
  process.env.JWT_SECRET || "12345678901234567890123456789012";
process.env.PASSWORD_PEPPER =
  process.env.PASSWORD_PEPPER || "1234567890abcdef";

const { __testables } = await import("../ai.service.js");
const { normalizeProjectSopJson } = __testables;

const countWords = (value = "") =>
  String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

test("normalizeProjectSopJson enforces 4 phases and short task titles", () => {
  const normalized = normalizeProjectSopJson(
    {
      phases: [
        { id: "kickoff", name: "Deep discovery and planning session for the project" },
        { id: "design", name: "Design approvals and creative direction" },
        { id: "build", name: "Execution, delivery and launch readiness" },
      ],
      tasks: [
        {
          id: "t1",
          title: "Understand business and website goal in a very detailed collaborative kickoff discussion",
          phase: "kickoff",
          status: "done",
        },
        { id: "t2", title: "Finalize sitemap and all page requirements", phase: "kickoff" },
        { id: "t3", title: "Create and share references / wireframes / inspiration links", phase: "kickoff" },
        { id: "t4", title: "Lock timeline and responsibilities", phase: "kickoff" },
        { id: "t5", title: "Prepare first design direction", phase: "design" },
        { id: "t6", title: "Collect detailed design feedback from stakeholders", phase: "design" },
        { id: "t7", title: "Apply revisions and present updated drafts", phase: "build" },
        { id: "t8", title: "Complete development and browser testing", phase: "build" },
        { id: "t9", title: "Launch site and share credentials", phase: "launch" },
      ],
    },
    {
      serviceType: "Website Development",
      title: "Acme growth website",
      proposalContent: "Marketing website with lead capture forms and CMS pages.",
    },
  );

  assert.equal(normalized.phases.length, 4);
  assert.equal(normalized.tasks.length >= 16, true);
  assert.equal(normalized.tasks.length <= 24, true);
  assert.equal(normalized.phases[0].status, "in-progress");
  assert.equal(normalized.phases[1].status, "pending");
  assert.equal(normalized.phases[0].progress, 0);

  for (const phase of normalized.phases) {
    const phaseTasks = normalized.tasks.filter((task) => task.phase === phase.id);
    assert.equal(phaseTasks.length >= 4, true);
    assert.equal(phaseTasks.length <= 6, true);

    for (const task of phaseTasks) {
      assert.equal(task.status, "pending");
      assert.equal(countWords(task.title) <= 6, true, `Task too long: ${task.title}`);
      assert.equal(task.title.length <= 56, true, `Task too wide: ${task.title}`);
    }
  }
});

test("normalizeProjectSopJson pads sparse fallback templates to the required task count", () => {
  const normalized = normalizeProjectSopJson(
    null,
    {
      serviceType: "Creative Design",
      title: "Brand identity redesign",
      proposalContent: "Need logo, social templates, and brand collateral.",
    },
  );

  assert.equal(normalized.phases.length, 4);
  assert.equal(normalized._meta.source, "fallback");

  for (const phase of normalized.phases) {
    const phaseTasks = normalized.tasks.filter((task) => task.phase === phase.id);
    assert.equal(phaseTasks.length >= 4, true);
    assert.equal(phaseTasks.length <= 6, true);
    for (const task of phaseTasks) {
      assert.equal(countWords(task.title) >= 2, true);
      assert.equal(countWords(task.title) <= 6, true);
    }
  }
});
