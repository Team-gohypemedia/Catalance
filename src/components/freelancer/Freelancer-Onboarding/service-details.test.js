import { describe, expect, it } from "vitest";

import {
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
