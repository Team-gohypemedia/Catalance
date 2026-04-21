import test from "node:test";
import assert from "node:assert/strict";

import {
  getSession,
  persistSession,
  sessionStorageKeys,
} from "../auth-storage.js";

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

test("getSession keeps a valid token available on initial load", () => {
  withMockWindow(() => {
    const now = Date.UTC(2026, 3, 21, 6, 0, 0);
    const token = createJwt({
      sub: "user-1",
      exp: Math.floor((now + 60_000) / 1000),
    });
    const user = { id: "user-1", role: "CLIENT" };

    persistSession({ accessToken: token, user });

    assert.deepEqual(getSession({ now }), {
      accessToken: token,
      user,
    });
  });
});

test("getSession clears an expired token during startup hydration", () => {
  withMockWindow(({ localStorage }) => {
    const now = Date.UTC(2026, 3, 21, 6, 0, 0);
    const token = createJwt({
      sub: "user-2",
      exp: Math.floor((now - 1_000) / 1000),
    });

    persistSession({
      accessToken: token,
      user: { id: "user-2", role: "FREELANCER" },
    });

    assert.equal(getSession({ now }), null);
    assert.equal(localStorage.getItem(sessionStorageKeys.token), null);
    assert.equal(localStorage.getItem(sessionStorageKeys.user), null);
  });
});

test("getSession drops a token once it expires before a later route or API read", () => {
  withMockWindow(({ localStorage }) => {
    const issuedAt = Date.UTC(2026, 3, 21, 6, 0, 0);
    const expiresAt = issuedAt + 30_000;
    const token = createJwt({
      sub: "user-3",
      exp: Math.floor(expiresAt / 1000),
    });

    persistSession({
      accessToken: token,
      user: { id: "user-3", role: "ADMIN" },
    });

    assert.notEqual(getSession({ now: issuedAt }), null);
    assert.equal(getSession({ now: expiresAt + 1_000 }), null);
    assert.equal(localStorage.getItem(sessionStorageKeys.token), null);
  });
});
