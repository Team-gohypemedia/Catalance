import test from "node:test";
import assert from "node:assert/strict";

import { clearSession, persistSession } from "../auth-storage.js";
import {
  getDashboardPreferenceStorageKey,
  getStoredDashboardPreference,
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
    };

    setStoredDashboardPreference(user, "freelancer");

    assert.equal(getStoredDashboardPreference(user), "freelancer");
    assert.equal(resolveWorkspaceHomePath(user), "/freelancer");
  });
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
