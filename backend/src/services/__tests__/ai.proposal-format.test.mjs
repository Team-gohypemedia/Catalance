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
const {
  normalizeProposalMarkdown,
  normalizeProposalBudgetValue,
  normalizeNumericFieldValue,
} = __testables;

test("normalizes proposal structure and converts numeric words", () => {
  const normalized = normalizeProposalMarkdown({
    markdown: `
Client Name: Jane
Business Name: Acme Labs
Service Type: Website Development
Project Overview: Need a conversion-focused website for a B2B software company.
Primary Objectives:
- Generate leads
Features/Deliverables Included:
- Home page
- Contact form
Website Type: Corporate website
Page Count: five pages
Launch Timeline: six weeks
Budget: fifty thousand
    `,
    proposalContext: {
      clientName: "Jane",
      companyName: "Acme Labs",
      serviceName: "Website Development",
    },
    selectedServiceName: "Website Development",
  });

  assert.match(normalized, /^Client Name: Jane/m);
  assert.match(normalized, /^Business Name: Acme Labs/m);
  assert.match(normalized, /^Service Type: Website Development/m);
  assert.match(normalized, /^Project Overview: Need a conversion-focused website/m);
  assert.match(normalized, /^Page Count: 5$/m);
  assert.match(normalized, /^Budget: INR 50,000$/m);
});

test("collapses alias labels into canonical proposal fields", () => {
  const normalized = normalizeProposalMarkdown({
    markdown: `
Client Name: Rahul
Business Name: Orbit Foods
Service Type: SEO
Overview: Improve non-brand organic traffic for a regional food brand.
Primary Objectives:
- Increase keyword visibility
Features/Deliverables Included:
- On-page optimization
Target Locations: Mumbai, Pune
Launch Timeline: 3 months
Budget: 20000
    `,
    proposalContext: {
      clientName: "Rahul",
      companyName: "Orbit Foods",
      serviceName: "SEO",
    },
    selectedServiceName: "SEO",
  });

  assert.match(normalized, /^Project Overview: Improve non-brand organic traffic/m);
  assert.doesNotMatch(normalized, /^Overview:/m);
});

test("keeps confirmed structured budget and timeline over conflicting draft values", () => {
  const normalized = normalizeProposalMarkdown({
    markdown: `
Client Name: ravindra
Business Name: cleclo
Service Type: Web Development
Project Overview: Build a custom e-commerce platform.
Primary Objectives:
- Launch the store
Features/Deliverables Included:
- Product listing
Launch Timeline: 1 month
Budget: INR 5,000
Website Type: E-commerce Store
Frontend Framework: Next.js
Backend Technology: Node.js
Database: MySQL
    `,
    proposalContext: {
      clientName: "ravindra",
      companyName: "cleclo",
      serviceName: "Web Development",
      questionnaireAnswersBySlug: {
        q_web_budget: "10k",
        q_web_timeline: "2 months"
      },
      serviceQuestionAnswers: [
        {
          slug: "q_web_budget",
          question: "What kind of budget range are you planning for this project?",
          answer: "10k"
        },
        {
          slug: "q_web_timeline",
          question: "What timeline do you have in mind for this project?",
          answer: "2 months"
        }
      ]
    },
    selectedServiceName: "Web Development"
  });

  assert.match(normalized, /^Launch Timeline: 2 months$/m);
  assert.match(normalized, /^Budget: INR 10,000$/m);
  assert.doesNotMatch(normalized, /^Launch Timeline: 1 month$/m);
  assert.doesNotMatch(normalized, /^Budget: INR 5,000$/m);
});

test("normalizes standalone numeric helpers", () => {
  assert.equal(normalizeNumericFieldValue("seven pages"), "7");
  assert.equal(normalizeProposalBudgetValue("twenty five thousand"), "INR 25,000");
});
