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
  normalizeProposalTimelineValue,
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

test("normalizes proposal field values and bullet items to sentence case", () => {
  const normalized = normalizeProposalMarkdown({
    markdown: `
Client Name: ravindra
Business Name: cleclo
Service Type: web development
Project Overview: build a shopify store with strong seo for a clothing brand.
Primary Objectives:
- launch the store quickly
Features/Deliverables Included:
- custom shopify theme
Launch Timeline: ASAP
Budget: INR 15000
    `,
    proposalContext: {
      clientName: "ravindra",
      companyName: "cleclo",
      serviceName: "web development",
    },
    selectedServiceName: "web development",
  });

  assert.match(normalized, /^Client Name: Ravindra$/m);
  assert.match(normalized, /^Business Name: Cleclo$/m);
  assert.match(normalized, /^Service Type: Web development$/m);
  assert.match(
    normalized,
    /^Project Overview: Build a Shopify store with strong SEO for a clothing brand\.$/m
  );
  assert.match(normalized, /^- Launch the store quickly$/m);
  assert.match(normalized, /^- Custom Shopify theme$/m);
  assert.match(normalized, /^Launch Timeline: 4 weeks$/m);
  assert.match(normalized, /^Budget: INR 15,000$/m);
});

test("keeps delivery timeline separate from video duration and collapses ranges to one value", () => {
  const normalized = normalizeProposalMarkdown({
    markdown: `
Client Name: Developers Gohype
Business Name: Cleclo
Service Type: 3d Animation/CGI Videos
Project Overview: Create ad creative videos for a clothing brand.
Primary Objectives:
- Create high impact paid ad visuals
Features/Deliverables Included:
- Two CGI advertisement videos
- 15-30 second runtime per video
Launch Timeline: 1-2 weeks
Budget: INR 15,000 per video
    `,
    proposalContext: {
      clientName: "Developers Gohype",
      companyName: "Cleclo",
      serviceName: "3d Animation/CGI Videos",
      serviceQuestionAnswers: [
        {
          slug: "duration",
          question: "What duration do you prefer for the CGI video?",
          answer: "15-30 seconds"
        },
        {
          slug: "delivery_timeline",
          question: "What is your preferred delivery timeline for the CGI video?",
          answer: "1-2 weeks"
        }
      ]
    },
    selectedServiceName: "3d Animation/CGI Videos"
  });

  assert.match(normalized, /^Launch Timeline: 2 weeks$/m);
  assert.doesNotMatch(normalized, /^Launch Timeline: 15-30 seconds$/m);
});

test("respects admin-defined proposal structure for service-specific fields", () => {
  const normalized = normalizeProposalMarkdown({
    markdown: `
Client Name: Maya
Business Name: Northstar Fitness
Service Type: SEO
Project Overview: Improve organic visibility for a gym chain.
Primary Objectives:
- Increase qualified traffic
Features/Deliverables Included:
- Technical SEO audit
- Content optimization
Campaign Focus: Local lead generation
Target Locations:
- Mumbai
- Pune
Reporting Cadence: Weekly dashboard and monthly strategy review
Launch Timeline: 3 months
Budget: INR 40,000
    `,
    proposalContext: {
      clientName: "Maya",
      companyName: "Northstar Fitness",
      serviceName: "SEO",
      proposalStructure: `
Client Name: ...
Business Name: ...
Service Type: ...
Project Overview: ...
Primary Objectives:
- ...
Features/Deliverables Included:
- ...
Campaign Focus: ...
Target Locations:
- ...
Reporting Cadence: ...
Launch Timeline: ...
Budget: ...
      `,
      proposalPrompt: "Keep the proposal focused on local SEO execution and reporting."
    },
    selectedServiceName: "SEO"
  });

  assert.ok(normalized.indexOf("Campaign Focus:") > normalized.indexOf("Features/Deliverables Included:"));
  assert.ok(normalized.indexOf("Target Locations:") > normalized.indexOf("Campaign Focus:"));
  assert.ok(normalized.indexOf("Reporting Cadence:") > normalized.indexOf("Target Locations:"));
  assert.ok(normalized.indexOf("Launch Timeline:") > normalized.indexOf("Reporting Cadence:"));
  assert.match(normalized, /^Reporting Cadence: Weekly dashboard and monthly strategy review$/m);
});

test("normalizes standalone numeric helpers", () => {
  assert.equal(normalizeNumericFieldValue("seven pages"), "7");
  assert.equal(normalizeProposalBudgetValue("twenty five thousand"), "INR 25,000");
  assert.equal(normalizeProposalTimelineValue("1-2 weeks", "creative"), "2 weeks");
  assert.equal(normalizeProposalTimelineValue("ASAP", "web"), "4 weeks");
  assert.equal(normalizeProposalTimelineValue("15-30 seconds", "creative"), "");
});
