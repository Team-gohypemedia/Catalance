import test from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://localhost:5432/catalance_test";
process.env.JWT_SECRET =
  process.env.JWT_SECRET || "12345678901234567890123456789012";
process.env.PASSWORD_PEPPER =
  process.env.PASSWORD_PEPPER || "1234567890abcdef";

const { __testables } = await import("../proposal-matching.service.js");
const {
  buildTargetProfileFromPayload,
  normalizeMatchPercentage,
  rankFreelancersFromData,
} = __testables;

const createTargetProfile = () =>
  buildTargetProfileFromPayload({
    title: "Northstar storefront",
    serviceKey: "web-development",
    serviceType: "Web Development",
    budget: 80000,
    businessCategory: "Fashion",
    targetAudience: "D2C fashion shoppers",
    proposalContent: `
Service Type: Web Development
Project Overview: Build a premium ecommerce storefront.
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
  });

const createFreelancer = ({
  id,
  fullName,
  openToWork = true,
  skills = [],
  services = ["web-development"],
  portfolioProjects = [],
  profileDetails = {},
  rating = 4.8,
  reviewCount = 10,
} = {}) => ({
  id,
  fullName,
  openToWork,
  available: true,
  status: "ACTIVE",
  onboardingComplete: true,
  skills,
  services,
  portfolioProjects,
  profileDetails,
  rating,
  reviewCount,
  updatedAt: "2026-04-10T00:00:00.000Z",
  createdAt: "2026-03-01T00:00:00.000Z",
});

const createCompletedProject = ({
  id,
  freelancerIds,
  title = "Completed commerce build",
  skills = ["Next.js", "Node.js", "PostgreSQL"],
  niche = "Fashion",
  projectType = "E-commerce store",
  budgetMin = 80000,
  budgetMax = 80000,
  serviceKey = "web-development",
  completedAt = "2026-03-20T00:00:00.000Z",
} = {}) => ({
  id,
  freelancerIds,
  title,
  skills,
  niche,
  projectType,
  budgetMin,
  budgetMax,
  serviceKey,
  serviceType: "Web Development",
  tags: ["Admin dashboard"],
  completedAt,
  matchingSeed: {
    matchingQuery: {
      category: serviceKey,
      techStack: skills,
      industriesOrNiches: [niche],
      serviceSpecializations: [projectType],
      minBudget: budgetMin,
      maxBudget: budgetMax,
    },
    fitProfile: {
      requiredSkills: skills,
      deliverables: ["Admin dashboard"],
    },
  },
});

test("Level 1 matching uses completed projects", () => {
  const targetProfile = createTargetProfile();
  const freelancers = [
    createFreelancer({
      id: "freelancer-1",
      fullName: "Rhea Dev",
      skills: ["Next.js", "Node.js", "PostgreSQL"],
    }),
    createFreelancer({
      id: "freelancer-2",
      fullName: "Other Fit",
      skills: ["Next.js"],
      portfolioProjects: [
        {
          id: "case-study-1",
          title: "Generic web project",
          serviceKey: "web-development",
          service: "Web Development",
          techStack: ["Next.js"],
          industriesOrNiches: ["General"],
          budget: 50000,
        },
      ],
    }),
  ];
  const completedProjects = [
    createCompletedProject({
      id: "completed-1",
      freelancerIds: ["freelancer-1"],
    }),
  ];

  const ranked = rankFreelancersFromData({
    targetProfile,
    freelancers,
    completedProjects,
    activeProjectCounts: new Map(),
  });

  assert.equal(ranked.results[0].id, "freelancer-1");
  assert.equal(ranked.results[0].sourceLevel, 1);
  assert.equal(ranked.results[0].matchSource, "completed_project");
});

test("Level 2 fallback works when Level 1 is insufficient", () => {
  const targetProfile = createTargetProfile();
  const freelancers = [
    createFreelancer({
      id: "freelancer-3",
      fullName: "Case Study Fit",
      portfolioProjects: [
        {
          id: "case-study-2",
          title: "Fashion commerce rebuild",
          service: "Web Development",
          serviceKey: "web-development",
          serviceKeys: ["web-development"],
          techStack: ["Next.js", "Node.js", "PostgreSQL"],
          tags: ["Admin dashboard"],
          industriesOrNiches: ["Fashion"],
          serviceSpecializations: ["E-commerce store"],
          budget: 80000,
          updatedAt: "2026-03-25T00:00:00.000Z",
        },
      ],
    }),
  ];

  const ranked = rankFreelancersFromData({
    targetProfile,
    freelancers,
    completedProjects: [],
    activeProjectCounts: new Map(),
  });

  assert.equal(ranked.results[0].id, "freelancer-3");
  assert.equal(ranked.results[0].sourceLevel, 2);
  assert.equal(ranked.results[0].matchSource, "case_study");
  assert.equal(ranked.results[0].caseStudyMatch.hasCaseStudy, true);
  assert.deepEqual(ranked.results[0].matchedCaseStudyTitles, ["Fashion commerce rebuild"]);
  assert.equal(ranked.results[0].serviceMatch, true);
  assert.ok(Array.isArray(ranked.results[0].matchedSkills));
  assert.ok(Number.isFinite(Number(ranked.results[0].budgetFitPercent)));
  assert.ok(Number.isFinite(Number(ranked.results[0].skillsMatchPercent)));
});

test("Level 3 fallback works when Levels 1 and 2 are insufficient", () => {
  const targetProfile = createTargetProfile();
  const freelancers = [
    createFreelancer({
      id: "freelancer-4",
      fullName: "Profile Fit",
      skills: ["Next.js", "Node.js", "PostgreSQL"],
      profileDetails: {
        globalIndustryFocus: ["Fashion"],
        serviceDetails: {
          "web-development": {
            startingPrice: "80000",
            skillsAndTechnologies: ["Next.js", "Node.js", "PostgreSQL"],
            serviceSpecializations: ["E-commerce store"],
            deliverables: ["Admin dashboard"],
          },
        },
      },
    }),
  ];

  const ranked = rankFreelancersFromData({
    targetProfile,
    freelancers,
    completedProjects: [],
    activeProjectCounts: new Map(),
  });

  assert.equal(ranked.results[0].id, "freelancer-4");
  assert.equal(ranked.results[0].sourceLevel, 3);
  assert.equal(ranked.results[0].matchSource, "global_skills");
});

test("Level 3 fallback does not treat unrelated service profiles as a direct service match", () => {
  const targetProfile = createTargetProfile();
  const freelancers = [
    createFreelancer({
      id: "freelancer-service-mismatch",
      fullName: "Design Only",
      skills: ["Brand Identity"],
      services: ["graphic-design"],
      profileDetails: {
        serviceDetails: {
          "graphic-design": {
            startingPrice: "50000",
            skillsAndTechnologies: ["Figma", "Illustrator"],
            serviceSpecializations: ["Brand Identity"],
          },
        },
      },
    }),
  ];

  const ranked = rankFreelancersFromData({
    targetProfile,
    freelancers,
    completedProjects: [],
    activeProjectCounts: new Map(),
  });

  assert.equal(ranked.results.length, 0);
});

test("filtering excludes unavailable or overloaded freelancers", () => {
  const targetProfile = createTargetProfile();
  const freelancers = [
    createFreelancer({
      id: "freelancer-5",
      fullName: "Unavailable",
      openToWork: false,
      skills: ["Next.js", "Node.js"],
    }),
    createFreelancer({
      id: "freelancer-6",
      fullName: "Overloaded",
      skills: ["Next.js", "Node.js"],
    }),
  ];

  const ranked = rankFreelancersFromData({
    targetProfile,
    freelancers,
    completedProjects: [
      createCompletedProject({
        id: "completed-2",
        freelancerIds: ["freelancer-5", "freelancer-6"],
      }),
    ],
    activeProjectCounts: new Map([["freelancer-6", 5]]),
  });

  assert.equal(ranked.results.length, 0);
});

test("scoring orders candidates correctly", () => {
  const targetProfile = createTargetProfile();
  const freelancers = [
    createFreelancer({
      id: "freelancer-7",
      fullName: "Strong Fit",
      skills: ["Next.js", "Node.js", "PostgreSQL"],
    }),
    createFreelancer({
      id: "freelancer-8",
      fullName: "Partial Fit",
      skills: ["Next.js"],
    }),
  ];

  const ranked = rankFreelancersFromData({
    targetProfile,
    freelancers,
    completedProjects: [
      createCompletedProject({
        id: "completed-3",
        freelancerIds: ["freelancer-7"],
      }),
      createCompletedProject({
        id: "completed-4",
        freelancerIds: ["freelancer-8"],
        skills: ["Next.js"],
        niche: "General",
        projectType: "Business website",
        budgetMin: 60000,
        budgetMax: 60000,
      }),
    ],
    activeProjectCounts: new Map(),
  });

  assert.equal(ranked.results[0].id, "freelancer-7");
  assert.ok(ranked.results[0].matchScore > ranked.results[1].matchScore);
});

test("duplicate freelancer handling keeps the strongest source level", () => {
  const targetProfile = createTargetProfile();
  const freelancers = [
    createFreelancer({
      id: "freelancer-9",
      fullName: "Multi-source Fit",
      skills: ["Next.js", "Node.js", "PostgreSQL"],
      portfolioProjects: [
        {
          id: "case-study-9",
          title: "Fashion commerce app",
          serviceKey: "web-development",
          service: "Web Development",
          techStack: ["Next.js", "Node.js", "PostgreSQL"],
          industriesOrNiches: ["Fashion"],
          serviceSpecializations: ["E-commerce store"],
          budget: 80000,
          tags: ["Admin dashboard"],
        },
      ],
    }),
  ];

  const ranked = rankFreelancersFromData({
    targetProfile,
    freelancers,
    completedProjects: [
      createCompletedProject({
        id: "completed-9",
        freelancerIds: ["freelancer-9"],
      }),
    ],
    activeProjectCounts: new Map(),
  });

  assert.equal(ranked.results.length, 1);
  assert.equal(ranked.results[0].id, "freelancer-9");
  assert.equal(ranked.results[0].sourceLevel, 1);
});

test("service-aligned skill matches outrank weak completed-project signals", () => {
  const targetProfile = createTargetProfile();
  const freelancers = [
    createFreelancer({
      id: "freelancer-weak-level1",
      fullName: "Weak Completed Match",
      skills: ["Brand Identity"],
      services: ["graphic-design"],
      profileDetails: {
        serviceDetails: {
          "graphic-design": {
            startingPrice: "80000",
            skillsAndTechnologies: ["Figma", "Illustrator"],
            serviceSpecializations: ["Brand Identity"],
          },
        },
      },
    }),
    createFreelancer({
      id: "freelancer-strong-level2",
      fullName: "Strong Case Study Match",
      services: ["web-development"],
      skills: ["Next.js", "Node.js", "PostgreSQL"],
      portfolioProjects: [
        {
          id: "case-strong-1",
          title: "Fashion ecommerce platform",
          service: "Web Development",
          serviceKey: "web-development",
          serviceKeys: ["web-development"],
          techStack: ["Next.js", "Node.js", "PostgreSQL"],
          tags: ["Admin dashboard", "Shopify integration"],
          industriesOrNiches: ["Fashion"],
          serviceSpecializations: ["E-commerce store"],
          budget: 80000,
        },
      ],
    }),
  ];

  const completedProjects = [
    createCompletedProject({
      id: "completed-weak-1",
      freelancerIds: ["freelancer-weak-level1"],
      skills: ["Brand Identity"],
      niche: "Fashion",
      projectType: "Brand Website",
      serviceKey: "graphic-design",
      budgetMin: 80000,
      budgetMax: 80000,
    }),
  ];

  const ranked = rankFreelancersFromData({
    targetProfile,
    freelancers,
    completedProjects,
    activeProjectCounts: new Map(),
  });

  assert.equal(ranked.results[0].id, "freelancer-strong-level2");
  assert.equal(ranked.results[0].serviceMatch, true);
  assert.ok((ranked.results[0].matchedSkills || []).length > 0);
});

test("missing rating does not outrank equally matched rated freelancer", () => {
  const targetProfile = createTargetProfile();
  const freelancers = [
    createFreelancer({
      id: "freelancer-no-rating",
      fullName: "No Rating",
      rating: 0,
      reviewCount: 0,
      portfolioProjects: [
        {
          id: "case-rating-1",
          title: "Ecommerce site build",
          service: "Web Development",
          serviceKey: "web-development",
          serviceKeys: ["web-development"],
          techStack: ["Next.js", "Node.js", "PostgreSQL"],
          tags: ["Admin dashboard"],
          industriesOrNiches: ["Fashion"],
          serviceSpecializations: ["E-commerce store"],
          budget: 80000,
          timeline: "6 weeks",
        },
      ],
    }),
    createFreelancer({
      id: "freelancer-rated",
      fullName: "Rated Match",
      rating: 4.9,
      reviewCount: 25,
      portfolioProjects: [
        {
          id: "case-rating-2",
          title: "Ecommerce site build",
          service: "Web Development",
          serviceKey: "web-development",
          serviceKeys: ["web-development"],
          techStack: ["Next.js", "Node.js", "PostgreSQL"],
          tags: ["Admin dashboard"],
          industriesOrNiches: ["Fashion"],
          serviceSpecializations: ["E-commerce store"],
          budget: 80000,
          timeline: "6 weeks",
        },
      ],
    }),
  ];

  const ranked = rankFreelancersFromData({
    targetProfile,
    freelancers,
    completedProjects: [],
    activeProjectCounts: new Map(),
  });

  assert.equal(ranked.results[0].id, "freelancer-rated");
});

test("service-only sparse case studies are excluded without overlap evidence", () => {
  const targetProfile = createTargetProfile();
  const freelancers = [
    createFreelancer({
      id: "freelancer-sparse-case-study",
      fullName: "Sparse Evidence",
      services: ["web-development"],
      skills: [],
      portfolioProjects: [
        {
          id: "case-sparse-1",
          title: "Astrophotography Portfolio Revamp",
          service: "Web Development",
          serviceKey: "web-development",
        },
      ],
    }),
  ];

  const ranked = rankFreelancersFromData({
    targetProfile,
    freelancers,
    completedProjects: [],
    activeProjectCounts: new Map(),
  });

  assert.equal(ranked.results.length, 0);
});

test("normalizeMatchPercentage clamps percentage boundaries", () => {
  assert.equal(normalizeMatchPercentage(100.8, 100), 100);
  assert.equal(normalizeMatchPercentage(-7, 100), 0);
  assert.equal(normalizeMatchPercentage("invalid", 100), 0);
});

test("normalized web development service keys resolve as a service match", () => {
  const targetProfile = createTargetProfile();
  const freelancers = [
    createFreelancer({
      id: "freelancer-webdev-normalized",
      fullName: "Normalized Service Fit",
      services: ["web_development"],
      portfolioProjects: [
        {
          id: "case-webdev-normalized",
          title: "Fashion storefront migration",
          service: "web-development",
          serviceKey: "web_development",
          serviceKeys: ["web_development"],
          techStack: ["Next.js", "Node.js", "PostgreSQL"],
          industriesOrNiches: ["Fashion"],
          serviceSpecializations: ["E-commerce store"],
          budget: 80000,
        },
      ],
    }),
  ];

  const ranked = rankFreelancersFromData({
    targetProfile,
    freelancers,
    completedProjects: [],
    activeProjectCounts: new Map(),
  });

  assert.equal(ranked.results.length, 1);
  assert.equal(ranked.results[0].id, "freelancer-webdev-normalized");
  assert.equal(ranked.results[0].serviceMatch, true);
});

test("service-aligned candidates rank ahead of mismatched fallback candidates", () => {
  const targetProfile = createTargetProfile();
  const freelancers = [
    createFreelancer({
      id: "freelancer-service-fit",
      fullName: "Service Fit",
      services: ["web-development"],
      rating: 0,
      reviewCount: 0,
      portfolioProjects: [
        {
          id: "case-service-fit",
          title: "Small storefront refresh",
          service: "Web Development",
          serviceKey: "web-development",
          serviceKeys: ["web-development"],
          techStack: ["Next.js"],
        },
      ],
    }),
    createFreelancer({
      id: "freelancer-service-mismatch-strong",
      fullName: "Mismatch Strong",
      services: ["graphic-design"],
      skills: ["Next.js", "Node.js", "PostgreSQL"],
      profileDetails: {
        serviceDetails: {
          "graphic-design": {
            startingPrice: "80000",
            skillsAndTechnologies: ["Next.js", "Node.js", "PostgreSQL"],
            serviceSpecializations: ["E-commerce store"],
          },
        },
      },
    }),
  ];

  const ranked = rankFreelancersFromData({
    targetProfile,
    freelancers,
    completedProjects: [
      createCompletedProject({
        id: "completed-service-mismatch-strong",
        freelancerIds: ["freelancer-service-mismatch-strong"],
        serviceKey: "graphic-design",
      }),
    ],
    activeProjectCounts: new Map([["freelancer-service-fit", 2]]),
  });

  assert.equal(ranked.results.length, 2);
  assert.equal(ranked.results[0].id, "freelancer-service-fit");
  assert.equal(ranked.results[0].serviceMatch, true);
  assert.equal(ranked.results[1].id, "freelancer-service-mismatch-strong");
  assert.equal(ranked.results[1].serviceMatch, false);
  assert.ok(ranked.results[1].rawMatchScore > ranked.results[0].rawMatchScore);
  ranked.results.forEach((result) => {
    assert.ok(result.matchScore >= 0 && result.matchScore <= 100);
  });
});
