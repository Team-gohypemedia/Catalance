import test from "node:test";
import assert from "node:assert/strict";

import { extractProjectProposalFields } from "../../../../src/shared/lib/project-proposal-fields.js";

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
