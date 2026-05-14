import assert from "node:assert/strict";
import test from "node:test";

import {
  buildFreelancerProfileDetailsObject,
  buildFreelancerProfileDetailsRecord,
  buildFreelancerProfileDetailsResidual,
} from "../freelancer-profile-details.mapper.js";

test("buildFreelancerProfileDetailsRecord maps dateOfBirth to a date column value", () => {
  const record = buildFreelancerProfileDetailsRecord({
    profileDetails: {
      identity: {
        dateOfBirth: "1992-08-17",
        address: "12 Brick Lane, Mumbai",
        pincode: "400001",
      },
    },
  });

  assert.ok(record.dateOfBirth instanceof Date);
  assert.equal(record.dateOfBirth.toISOString().slice(0, 10), "1992-08-17");
  assert.equal(record.address, "12 Brick Lane, Mumbai");
  assert.equal(record.pincode, "400001");
});

test("buildFreelancerProfileDetailsObject serializes dateOfBirth back into identity", () => {
  const profileDetails = buildFreelancerProfileDetailsObject({
    dateOfBirth: new Date("1992-08-17T00:00:00.000Z"),
    address: "12 Brick Lane, Mumbai",
    pincode: "400001",
  });

  assert.equal(profileDetails.identity.dateOfBirth, "1992-08-17");
  assert.equal(profileDetails.identity.address, "12 Brick Lane, Mumbai");
  assert.equal(profileDetails.identity.pincode, "400001");
});

test("buildFreelancerProfileDetailsResidual strips modeled dateOfBirth from identity", () => {
  const residual = buildFreelancerProfileDetailsResidual({
    identity: {
      dateOfBirth: "1992-08-17",
      address: "12 Brick Lane, Mumbai",
      pincode: "400001",
      githubUrl: "https://example.com/profile",
    },
  });

  assert.deepEqual(residual.identity, {
    githubUrl: "https://example.com/profile",
  });
});