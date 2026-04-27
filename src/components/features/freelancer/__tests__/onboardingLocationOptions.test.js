import { beforeEach, describe, expect, it } from "vitest";

import {
  STATE_OPTIONS_CACHE,
  resolveStateOptionsForCountry,
} from "@/components/features/freelancer/onboarding/constants";

describe("resolveStateOptionsForCountry", () => {
  beforeEach(() => {
    STATE_OPTIONS_CACHE.clear();
  });

  it("returns fallback state options for India when remote data is unavailable", () => {
    const stateOptions = resolveStateOptionsForCountry("India");

    expect(stateOptions).toContain("Maharashtra");
    expect(stateOptions).toContain("Tamil Nadu");
    expect(stateOptions.length).toBeGreaterThan(10);
  });

  it("prefers remote state options and caches them for later lookups", () => {
    const remoteStateOptions = ["Goa", "Karnataka"];

    expect(
      resolveStateOptionsForCountry("India", remoteStateOptions),
    ).toEqual(remoteStateOptions);
    expect(resolveStateOptionsForCountry("India")).toEqual(remoteStateOptions);
  });
});
