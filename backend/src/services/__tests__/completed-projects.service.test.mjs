import test from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://localhost:5432/catalance_test";
process.env.JWT_SECRET =
  process.env.JWT_SECRET || "12345678901234567890123456789012";
process.env.PASSWORD_PEPPER =
  process.env.PASSWORD_PEPPER || "1234567890abcdef";

const { __testables } = await import("../completed-projects.service.js");
const { buildCompletedProjectArchiveData } = __testables;

test("project completion archives data correctly", () => {
  const archived = buildCompletedProjectArchiveData({
    id: "project-1",
    title: "Northstar commerce launch",
    description: "Build a premium e-commerce storefront with admin controls.",
    budget: 80000,
    spent: 80000,
    ownerId: "client-1",
    managerId: "pm-1",
    serviceKey: "web-development",
    serviceType: "Web Development",
    businessCategory: "Fashion",
    targetAudience: "D2C fashion shoppers",
    proposalContent: `
Client Name: Maya
Business Name: Northstar
Service Type: Web Development
Project Overview: Build a premium storefront for a fashion label.
Primary Objectives:
- Increase qualified online sales
Features/Deliverables Included:
- Admin dashboard
- Shopify integration
Launch Timeline: 6 weeks
Budget: INR 80,000
Website Type: E-commerce store
Frontend Framework: Next.js
Backend Technology: Node.js
Database: PostgreSQL
Hosting: Vercel
    `,
    owner: {
      id: "client-1",
      fullName: "Maya Client",
      email: "maya@example.com",
      avatar: "https://example.com/client.png",
      clientProfile: {
        profileDetails: {
          companySize: "11-50",
        },
      },
    },
    proposals: [
      {
        id: "proposal-1",
        freelancerId: "freelancer-1",
        amount: 80000,
        freelancer: {
          id: "freelancer-1",
          fullName: "Rhea Dev",
          email: "rhea@example.com",
          avatar: "https://example.com/rhea.png",
          freelancerProfile: {
            jobTitle: "Full Stack Developer",
            skills: ["Next.js", "Node.js", "PostgreSQL"],
            services: ["web-development"],
            available: true,
            openToWork: true,
            rating: 4.8,
            reviewCount: 12,
            experienceYears: 6,
            profileDetails: {
              globalIndustryFocus: ["Fashion"],
            },
            serviceDetails: {
              "web-development": {
                startingPrice: "80000",
              },
            },
            portfolioProjects: [{ title: "Commerce app" }],
          },
        },
      },
    ],
  });

  assert.equal(archived.originalProjectId, "project-1");
  assert.equal(archived.ownerId, "client-1");
  assert.equal(archived.clientSnapshot.fullName, "Maya Client");
  assert.deepEqual(archived.freelancerIds, ["freelancer-1"]);
  assert.equal(archived.freelancerSnapshots[0].fullName, "Rhea Dev");
  assert.equal(archived.serviceKey, "web-development");
  assert.equal(archived.serviceType, "Web Development");
  assert.equal(archived.projectType, "E-commerce store");
  assert.equal(archived.niche, "Fashion");
  assert.ok(archived.skills.includes("Next.js"));
  assert.ok(archived.skills.includes("Node.js"));
  assert.ok(archived.tags.includes("Admin dashboard"));
  assert.equal(archived.budgetMin, 80000);
  assert.equal(archived.budgetMax, 80000);
  assert.equal(archived.timeline, "6 weeks");
  assert.equal(archived.archivedData.projectSnapshot.id, "project-1");
});
