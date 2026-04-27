import test from "node:test";
import assert from "node:assert/strict";

import { clearSession, persistSession } from "../auth-storage.js";
import {
  canAccessDashboard,
  FREELANCER_ONBOARDING_PATH,
  getAccessibleDashboards,
  getDashboardEntryPath,
  getDashboardPreferenceStorageKey,
  getStoredDashboardPreference,
  resolveFreelancerPath,
  resolveWorkspaceHomePath,
  setStoredDashboardPreference,
} from "../dashboard-preference.js";

const createLocalStorageMock = () => {
  const store = new Map();

  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
  };
};

const createJwt = (payload = {}) => {
  const encode = (value) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");

  return [
    encode({ alg: "none", typ: "JWT" }),
    encode(payload),
    "signature",
  ].join(".");
};

const withMockWindow = (callback) => {
  const previousWindow = globalThis.window;
  const localStorage = createLocalStorageMock();
  globalThis.window = { localStorage };

  try {
    return callback({ localStorage });
  } finally {
    if (previousWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = previousWindow;
    }
  }
};

test("resolveWorkspaceHomePath restores the stored dashboard after refresh", () => {
  withMockWindow(() => {
    const user = {
      id: "user-10",
      role: "CLIENT",
      roles: ["CLIENT", "FREELANCER"],
      onboardingComplete: true,
    };

    setStoredDashboardPreference(user, "freelancer");

    assert.equal(getStoredDashboardPreference(user), "freelancer");
    assert.equal(resolveWorkspaceHomePath(user), "/freelancer");
  });
});

test("resolveWorkspaceHomePath sends incomplete freelancer entries to the dashboard gate", () => {
  withMockWindow(() => {
    const user = {
      id: "user-10b",
      role: "CLIENT",
      roles: ["CLIENT", "FREELANCER"],
      onboardingComplete: false,
    };

    setStoredDashboardPreference(user, "freelancer");

    assert.equal(getStoredDashboardPreference(user), "freelancer");
    assert.equal(resolveWorkspaceHomePath(user), "/freelancer");
    assert.equal(getDashboardEntryPath(user, "freelancer"), "/freelancer");
  });
});

test("resolveFreelancerPath only allows dashboard and onboarding before onboarding is complete", () => {
  const user = {
    id: "user-10c",
    role: "FREELANCER",
    roles: ["FREELANCER"],
    onboardingComplete: false,
  };

  assert.equal(resolveFreelancerPath(user, "/freelancer"), "/freelancer");
  assert.equal(
    resolveFreelancerPath(user, "/freelancer/proposals"),
    "/freelancer"
  );
  assert.equal(
    resolveFreelancerPath(user, FREELANCER_ONBOARDING_PATH),
    FREELANCER_ONBOARDING_PATH
  );
});

test("invalid stored dashboard values are ignored and cleared", () => {
  withMockWindow(({ localStorage }) => {
    const user = {
      id: "user-11",
      role: "CLIENT",
      roles: ["CLIENT", "FREELANCER"],
    };
    const preferenceKey = getDashboardPreferenceStorageKey(user);

    localStorage.setItem(preferenceKey, "broken-value");

    assert.equal(getStoredDashboardPreference(user), null);
    assert.equal(localStorage.getItem(preferenceKey), null);
    assert.equal(resolveWorkspaceHomePath(user), "/client");
  });
});

test("remembered dashboard survives logout and is reused after the next login", () => {
  withMockWindow(({ localStorage }) => {
    const now = Date.UTC(2026, 3, 21, 6, 0, 0);
    const user = {
      id: "user-12",
      role: "CLIENT",
      roles: ["CLIENT", "FREELANCER"],
      onboardingComplete: true,
    };
    const token = createJwt({
      sub: user.id,
      exp: Math.floor((now + 60_000) / 1000),
    });
    const preferenceKey = getDashboardPreferenceStorageKey(user);

    setStoredDashboardPreference(user, "freelancer");
    persistSession({ accessToken: token, user });
    clearSession();

    assert.equal(localStorage.getItem(preferenceKey), "freelancer");
    assert.equal(resolveWorkspaceHomePath(user), "/freelancer");
  });
});

test("freelancer accounts can access the client workspace switcher", () => {
  const user = {
    id: "user-13",
    role: "FREELANCER",
    roles: ["FREELANCER"],
  };

  assert.deepEqual(getAccessibleDashboards(user), ["client", "freelancer"]);
  assert.equal(canAccessDashboard(user, "client"), true);
  assert.equal(canAccessDashboard(user, "freelancer"), true);
});

test("client accounts can access the freelancer workspace switcher", () => {
  const user = {
    id: "user-14",
    role: "CLIENT",
    roles: ["CLIENT"],
  };

  assert.deepEqual(getAccessibleDashboards(user), ["client", "freelancer"]);
  assert.equal(canAccessDashboard(user, "client"), true);
  assert.equal(canAccessDashboard(user, "freelancer"), true);
});
