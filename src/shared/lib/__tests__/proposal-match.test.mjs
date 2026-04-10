import test from "node:test";
import assert from "node:assert/strict";

import {
  canonicalizeServiceIdentity,
  clampPercentage,
  isFreelancerServiceAligned,
  resolveFreelancerMatchPercent,
} from "../proposal-match.js";

test("clampPercentage keeps values between 0 and 100", () => {
  assert.equal(clampPercentage(99.4), 99);
  assert.equal(clampPercentage(100.8), 100);
  assert.equal(clampPercentage(-4), 0);
  assert.equal(clampPercentage("bad", { fallback: 0 }), 0);
});

test("resolveFreelancerMatchPercent always returns a bounded percentage", () => {
  assert.equal(resolveFreelancerMatchPercent({ matchPercent: 107 }), 100);
  assert.equal(resolveFreelancerMatchPercent({ matchScore: -9 }), 0);
  assert.equal(
    resolveFreelancerMatchPercent({ projectRelevanceScore: "not-a-number" }, 0),
    0,
  );
});

test("service identity normalization aligns web development variants", () => {
  assert.equal(canonicalizeServiceIdentity("Web Development"), "web_development");
  assert.equal(canonicalizeServiceIdentity("web_development"), "web_development");
  assert.equal(canonicalizeServiceIdentity("web-development"), "web_development");
});

test("isFreelancerServiceAligned requires matching normalized service", () => {
  const serviceAlignedFreelancer = {
    matchedService: {
      serviceKey: "web_development",
      serviceName: "Web Development",
    },
    serviceMatch: false,
  };

  const mismatchFreelancer = {
    matchedService: {
      serviceKey: "graphic_design",
      serviceName: "Graphic Design",
    },
    serviceMatch: false,
  };

  assert.equal(
    isFreelancerServiceAligned(serviceAlignedFreelancer, "Web Development"),
    true,
  );
  assert.equal(
    isFreelancerServiceAligned(mismatchFreelancer, "Web Development"),
    false,
  );
});
