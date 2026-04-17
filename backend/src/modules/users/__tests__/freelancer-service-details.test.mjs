import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCanonicalProfileDetails,
  buildFreelancerSkillRows,
  buildPrimaryServiceSnapshot,
  deriveTopLevelSkillsFromProfileDetails,
} from "../freelancer-service-details.js";

const serviceRows = [
  { id: 1, key: "web_development", name: "Web Development" },
  { id: 2, key: "seo", name: "SEO" },
];

const subCategoryRows = [
  { id: 11, name: "Frontend" },
  { id: 12, name: "Landing Pages" },
  { id: 21, name: "Technical SEO" },
];

const toolRows = [
  { id: 101, subCategoryId: 11, name: "React" },
  { id: 102, subCategoryId: 11, name: "Next.js" },
  { id: 201, subCategoryId: 21, name: "Site Audit" },
];

test("buildCanonicalProfileDetails normalizes services, prunes stray detail keys, and removes legacy fields", () => {
  const canonical = buildCanonicalProfileDetails({
    profileDetails: {
      services: ["web_development", "seo", "web_development"],
      serviceDetails: {
        web_development: {
          title: "Build conversion-focused websites",
          subcategories: [
            {
              subCategoryId: 11,
              selectedToolIds: [101, 101, 999],
              customSkillNames: ["Astro", "astro", " "],
            },
          ],
          skillsAndTechnologies: ["Legacy React"],
        },
        seo: {
          title: "Grow rankings",
          subcategories: [],
        },
        orphan_service: {
          title: "Should be removed",
        },
      },
      serviceSubcategorySkills: {
        11: ["React"],
      },
      serviceActiveSkillCategory: 11,
    },
    serviceRows,
    toolRows,
  });

  assert.equal(canonical.profileDetailsVersion, 2);
  assert.deepEqual(canonical.services, ["web_development", "seo"]);
  assert.deepEqual(Object.keys(canonical.serviceDetails), ["web_development", "seo"]);
  assert.equal("serviceSubcategorySkills" in canonical, false);
  assert.equal("serviceActiveSkillCategory" in canonical, false);
  assert.deepEqual(
    canonical.serviceDetails.web_development.subcategories,
    [
      {
        subCategoryId: 11,
        selectedToolIds: [101, 999],
        customSkillNames: ["Astro"],
      },
    ],
  );
  assert.deepEqual(
    canonical.serviceDetails.web_development.skillsAndTechnologies,
    ["React", "Astro", "Legacy React"],
  );
});

test("buildPrimaryServiceSnapshot derives primary service fields from the first service", () => {
  const profileDetails = {
    services: ["web_development", "seo"],
    serviceDetails: {
      web_development: {
        title: "Modern marketing websites",
        subcategories: [
          { subCategoryId: 11, selectedToolIds: [101], customSkillNames: [] },
          { subCategoryId: 12, selectedToolIds: [], customSkillNames: [] },
        ],
        experienceYears: "Expert 5–10 years",
        serviceComplexity: "Expert",
        serviceDescription: "End-to-end website delivery.",
        deliveryTime: "2 Weeks",
        averageProjectPrice: "₹50,000 – ₹1,00,000",
        keywords: ["Conversion", "Webflow"],
        media: [{ url: "https://cdn.example.com/cover.jpg" }],
      },
    },
  };

  const snapshot = buildPrimaryServiceSnapshot({
    profileDetails,
    subCategoryRows,
    existingValues: {
      serviceCategory: "Legacy Category",
    },
  });

  assert.equal(snapshot.serviceTitle, "Modern marketing websites");
  assert.equal(snapshot.serviceCategory, "Frontend, Landing Pages");
  assert.equal(snapshot.serviceExperience, "Expert 5–10 years");
  assert.equal(snapshot.serviceComplexity, "Expert");
  assert.equal(snapshot.serviceDescription, "End-to-end website delivery.");
  assert.equal(snapshot.deliveryTimeline, "2 Weeks");
  assert.equal(snapshot.startingPrice, "₹50,000 – ₹1,00,000");
  assert.deepEqual(snapshot.serviceKeywords, ["Conversion", "Webflow"]);
  assert.deepEqual(snapshot.serviceMedia, [{ url: "https://cdn.example.com/cover.jpg" }]);
});

test("deriveTopLevelSkillsFromProfileDetails unions service skill labels case-insensitively", () => {
  const skills = deriveTopLevelSkillsFromProfileDetails({
    serviceDetails: {
      web_development: {
        skillsAndTechnologies: ["React", "Next.js"],
      },
      seo: {
        skillsAndTechnologies: ["site audit", "React"],
      },
    },
  });

  assert.deepEqual(skills, ["React", "Next.js", "site audit"]);
});

test("buildFreelancerSkillRows emits only valid catalog-backed tool rows", () => {
  const rows = buildFreelancerSkillRows({
    userId: "user_123",
    profileDetails: {
      services: ["web_development", "seo"],
      serviceDetails: {
        web_development: {
          subcategories: [
            {
              subCategoryId: 11,
              selectedToolIds: [101, 999, 101],
              customSkillNames: ["Astro"],
            },
          ],
        },
        seo: {
          subcategories: [
            {
              subCategoryId: 21,
              selectedToolIds: [201, 102],
              customSkillNames: [],
            },
          ],
        },
      },
    },
    serviceRows,
    toolRows,
  });

  assert.deepEqual(rows, [
    {
      userId: "user_123",
      serviceId: 1,
      subCategoryId: 11,
      toolId: 101,
    },
    {
      userId: "user_123",
      serviceId: 2,
      subCategoryId: 21,
      toolId: 201,
    },
  ]);
});
