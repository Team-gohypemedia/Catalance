import test from "node:test";
import assert from "node:assert/strict";

import {
  buildProjectFreelancerMatchingSeed,
  buildProjectProposalJson,
  extractProjectProposalFields,
} from "../../../../src/shared/lib/project-proposal-fields.js";

test("extractProjectProposalFields maps proposal markdown into structured project columns", () => {
  const proposalContent = `
Client Name: Ravindra
Business Name: Catalance
Service Type: Web Development
Project Overview: Build a custom booking website for service discovery and lead capture.
Primary Objectives:
- Increase qualified inbound bookings
- Reduce manual scheduling work
Features/Deliverables Included:
- Responsive marketing pages
- Admin dashboard
Launch Timeline: 8 weeks
Budget: INR 20,000
Website Type: Booking platform
Design Style: Modern and clean
Frontend Framework: Next.js
Backend Technology: Node.js
Database: PostgreSQL
Hosting: Vercel
Page Count: 8 pages
  `;

  const result = extractProjectProposalFields({
    proposalContent,
    serviceKey: "web-development",
  });

  assert.equal(result.clientName, "Ravindra");
  assert.equal(result.businessName, "Catalance");
  assert.equal(result.serviceType, "Web Development");
  assert.equal(
    result.projectOverview,
    "Build a custom booking website for service discovery and lead capture.",
  );
  assert.deepEqual(result.primaryObjectives, [
    "Increase qualified inbound bookings",
    "Reduce manual scheduling work",
  ]);
  assert.deepEqual(result.featuresDeliverables, [
    "Responsive marketing pages",
    "Admin dashboard",
  ]);
  assert.equal(result.timeline, "8 weeks");
  assert.equal(result.budgetSummary, "INR 20,000");
  assert.equal(result.websiteType, "Booking platform");
  assert.equal(result.designStyle, "Modern and clean");
  assert.equal(result.frontendFramework, "Next.js");
  assert.equal(result.backendTechnology, "Node.js");
  assert.equal(result.databaseType, "PostgreSQL");
  assert.equal(result.hosting, "Vercel");
  assert.equal(result.pageCount, "8 pages");
  assert.equal(result.serviceKey, "web-development");
  assert.match(result.proposalContent, /Client Name: Ravindra/);
});

test("extractProjectProposalFields falls back to explicit payload fields when markdown is unavailable", () => {
  const result = extractProjectProposalFields({
    description: "SEO support for a local service business in Delhi NCR.",
    service: "SEO Optimization",
    serviceKey: "seo-optimization",
    timeline: "3 months",
    budgetSummary: "INR 50,000",
    primaryObjectives: ["Improve local rankings", "Generate more qualified leads"],
    targetLocations: "Delhi NCR; Gurgaon",
    seoGoals: ["Organic traffic growth", "More consultation requests"],
  });

  assert.equal(
    result.projectOverview,
    "SEO support for a local service business in Delhi NCR.",
  );
  assert.equal(result.serviceType, "SEO Optimization");
  assert.equal(result.timeline, "3 months");
  assert.equal(result.budgetSummary, "INR 50,000");
  assert.deepEqual(result.primaryObjectives, [
    "Improve local rankings",
    "Generate more qualified leads",
  ]);
  assert.deepEqual(result.targetLocations, ["Delhi NCR", "Gurgaon"]);
  assert.deepEqual(result.seoGoals, [
    "Organic traffic growth",
    "More consultation requests",
  ]);
  assert.equal(result.serviceKey, "seo-optimization");
});

test("buildProjectProposalJson captures raw proposal content and parsed sections", () => {
  const proposalContent = `
Client Name: Ravindra
Business Name: cleclo
Service Type: SEO (Search Engine Optimisation)
Project Overview: Build search visibility for a new clothing brand.
Primary Objectives:
- Improve local keyword rankings
- Increase organic traffic
Features/Deliverables Included:
- Technical SEO audit
- On-page optimization
Duration: 2 months
Budget: INR 10,000 per month
  `;

  const result = buildProjectProposalJson({
    title: "SEO / cleclo",
    proposalContent,
    serviceKey: "seo-optimization",
    status: "DRAFT",
    budget: 10000,
  });

  assert.equal(result.version, 1);
  assert.equal(result.title, "SEO / cleclo");
  assert.equal(result.serviceKey, "seo-optimization");
  assert.equal(result.status, "DRAFT");
  assert.equal(result.budget, "10000");
  assert.match(result.proposalContent, /Client Name: Ravindra/);
  assert.equal(result.fields.clientName, "Ravindra");
  assert.equal(result.fields.businessName, "cleclo");
  assert.equal(result.fields.duration, "2 months");
  assert.deepEqual(result.fields.primaryObjectives, [
    "Improve local keyword rankings",
    "Increase organic traffic",
  ]);
  assert.ok(
    result.sections.some(
      (section) =>
        section.label === "Primary Objectives"
        && section.items.includes("Increase organic traffic"),
    ),
  );
});

test("buildProjectFreelancerMatchingSeed builds hidden freelancer matching data from proposal context", () => {
  const proposalContent = `
Client Name: Ravindra
Business Name: cleclo
Service Type: Web Development
Project Overview: Build a conversion-focused Shopify storefront for a clothing brand with lead capture and product management.
Primary Objectives:
- Increase qualified online sales
- Launch a polished branded store quickly
Features/Deliverables Included:
- Custom storefront design
- Product catalog setup
- Admin dashboard
Launch Timeline: 6 weeks
Budget: INR 80,000
Website Type: E-commerce store
Design Style: Premium and modern
Website Build Type: Shopify
Frontend Framework: Next.js
Backend Technology: Node.js
Database: PostgreSQL
Hosting: Vercel
Page Count: 8 pages
  `;

  const result = buildProjectFreelancerMatchingSeed({
    title: "cleclo commerce launch",
    proposalContent,
    serviceKey: "web-development",
  });

  assert.equal(result.version, 1);
  assert.equal(result.visibility, "internal");
  assert.equal(result.project.serviceKey, "web-development");
  assert.equal(result.project.serviceType, "Web Development");
  assert.equal(result.project.businessName, "cleclo");
  assert.equal(result.matchingQuery.category, "web-development");
  assert.equal(result.matchingQuery.minBudget, 80000);
  assert.equal(result.matchingQuery.maxBudget, 80000);
  assert.ok(result.fitProfile.requiredSkills.includes("Next.js"));
  assert.ok(result.fitProfile.requiredSkills.includes("Node.js"));
  assert.ok(result.fitProfile.requiredSkills.includes("PostgreSQL"));
  assert.ok(result.fitProfile.requiredSkills.includes("Vercel"));
  assert.ok(result.fitProfile.deliverables.includes("Admin dashboard"));
  assert.ok(result.screening.mustHaveQuestions.length > 0);
});
