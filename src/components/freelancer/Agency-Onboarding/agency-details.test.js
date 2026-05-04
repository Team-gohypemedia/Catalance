import { describe, expect, it } from "vitest";

import {
  createInitialAgencyProfileForm,
  getAgencyStepValidationErrors,
  getAgencyStepValidationMessage,
  sanitizeAgencyProfileFormForDraft,
} from "./agency-details";

describe("agency profile helpers", () => {
  it("returns an empty agency draft with the expected fields", () => {
    expect(createInitialAgencyProfileForm()).toMatchObject({
      companyName: "",
      agencyType: "",
      coreRoles: [],
      industries: [],
      ndaAvailable: false,
    });
  });

  it("sanitizes agency drafts before storage", () => {
    expect(
      sanitizeAgencyProfileFormForDraft({
        companyName: "  Acme Studio  ",
        foundedYear: "2024",
        coreRoles: ["design", "design", "development"],
        industries: ["SaaS", "SaaS", "Fintech"],
        ndaAvailable: 1,
      }),
    ).toMatchObject({
      companyName: "Acme Studio",
      foundedYear: "2024",
      coreRoles: ["design", "development"],
      industries: ["SaaS", "Fintech"],
      ndaAvailable: true,
    });
  });

  it("returns agency overview validation errors", () => {
    expect(getAgencyStepValidationErrors({}, "agencyOverview")).toMatchObject({
      companyName: "Please enter your agency name.",
      agencyType: "Please select an agency type.",
    });
  });

  it("requires team and trust fields before continuing", () => {
    expect(getAgencyStepValidationMessage({}, "agencyTeam")).toBe(
      "Please choose your team size.",
    );
    expect(getAgencyStepValidationMessage({}, "agencyTrust")).toBe(
      "Please select at least one industry.",
    );
  });
});
