import { describe, expect, it } from "vitest";

import {
  getServiceStepValidationErrors,
  getServiceStepValidationMessage,
  normalizeServiceDraft,
  serializeServiceDraft,
} from "./service-details";

const legacyComplexityKey = "complexity";
const legacyServiceComplexityKey = ["service", "Complexity"].join("");
const legacyProjectComplexityKey = ["project", "Complexity"].join("");

describe("service details normalization", () => {
  it("drops legacy complexity fields from normalized drafts", () => {
    const normalizedDraft = normalizeServiceDraft({
      serviceKey: "web_development",
      title: "Web build",
      experience: "expert",
      [legacyComplexityKey]: "large",
      [legacyServiceComplexityKey]: "legacy-complexity",
      [legacyProjectComplexityKey]: "legacy-project-complexity",
    });

    expect(legacyComplexityKey in normalizedDraft).toBe(false);
    expect(legacyServiceComplexityKey in normalizedDraft).toBe(false);
    expect(legacyProjectComplexityKey in normalizedDraft).toBe(false);
  });

  it("does not serialize service complexity into persisted service details", () => {
    const serializedDetail = serializeServiceDraft({
      draft: {
        serviceKey: "web_development",
        title: "Web build",
        experience: "expert",
        [legacyComplexityKey]: "large",
        [legacyServiceComplexityKey]: "legacy-complexity",
      },
    });

    expect(legacyServiceComplexityKey in serializedDetail).toBe(false);
    expect(legacyComplexityKey in serializedDetail).toBe(false);
  });
});

describe("service step validation", () => {
  it("returns field-level service info validation errors", () => {
    expect(getServiceStepValidationErrors({}, "serviceInfo")).toMatchObject({
      title: "Please enter a service title.",
      category: "Please select a category.",
      skills: "Please add at least one skill or technology.",
      experience: "Please select your experience level.",
    });
  });

  it("requires a service title before continuing service info", () => {
    expect(getServiceStepValidationMessage({}, "serviceInfo")).toBe(
      "Please enter a service title.",
    );
  });

  it("accepts a complete service info draft", () => {
    expect(
      getServiceStepValidationMessage(
        {
          serviceKey: "web_development",
          title: "Website build",
          experience: "expert",
          subcategories: [
            {
              subCategoryId: 1,
              subCategoryKey: "catalog:1",
              label: "Frontend",
              selectedToolIds: [2],
            },
          ],
        },
        "serviceInfo",
      ),
    ).toBe("");
  });

  it("requires pricing details before continuing pricing", () => {
    expect(getServiceStepValidationMessage({}, "servicePricing")).toBe(
      "Please add a service description.",
    );
  });

  it("accepts a complete pricing draft", () => {
    expect(
      getServiceStepValidationMessage(
        {
          serviceKey: "web_development",
          description: "A concise but complete service description.",
          deliveryTimeline: "2_weeks",
          priceRange: "500",
        },
        "servicePricing",
      ),
    ).toBe("");
  });

  it("requires media before continuing visuals", () => {
    expect(getServiceStepValidationMessage({}, "serviceVisuals")).toBe(
      "Please add either 2 images or 1 video before continuing.",
    );
  });

  it("returns field-level case study validation errors", () => {
    expect(getServiceStepValidationErrors({}, "caseStudy")).toMatchObject({
      title: "Please enter a case study title.",
      description: "Please add a case study description.",
      niche: "Please select a niche.",
      role: "Please enter your role.",
      timeline: "Please select a timeline.",
      budget: "Please set a budget.",
      projectProof: "Please add a project link or upload a project file.",
    });
  });

  it("accepts a complete case study draft", () => {
    expect(
      getServiceStepValidationMessage(
        {
          serviceKey: "web_development",
          caseStudies: [
            {
              id: "case-study-1",
              title: "Landing page redesign",
              description: "Improved the conversion flow for a client landing page.",
              niche: "web development",
              role: "Lead developer",
              timeline: "2 weeks",
              budget: "1500",
              projectLink: "https://example.com/project",
            },
          ],
          activeCaseStudyId: "case-study-1",
        },
        "caseStudy",
      ),
    ).toBe("");
  });
});
