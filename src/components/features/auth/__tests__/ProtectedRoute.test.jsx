import { useEffect } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import ProtectedRoute from "../ProtectedRoute.jsx";
import { AuthProvider, useAuth } from "@/shared/context/AuthContext";
import {
  persistSession,
  sessionStorageKeys,
} from "@/shared/lib/auth-storage";

const createJwt = (payload = {}) => {
  const encode = (value) =>
    window.btoa(JSON.stringify(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

  return [
    encode({ alg: "none", typ: "JWT" }),
    encode(payload),
    "signature",
  ].join(".");
};

const createJsonResponse = (status, payload = null) => ({
  status,
  ok: status >= 200 && status < 300,
  headers: new Headers({ "content-type": "application/json" }),
  json: vi.fn().mockResolvedValue(payload),
});

const createLocalStorageMock = () => {
  const store = new Map();

  return {
    clear() {
      store.clear();
    },
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    removeItem(key) {
      store.delete(key);
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
  };
};

const ProtectedContent = () => <div>Protected Area</div>;

const LoginPage = () => <div>Login Page</div>;

const AuthFetchProbe = () => {
  const { authFetch } = useAuth();

  useEffect(() => {
    void authFetch("/private").catch(() => null);
  }, [authFetch]);

  return <div>Protected Area</div>;
};

const renderProtectedApp = (protectedElement = <ProtectedContent />) =>
  render(
    <MemoryRouter initialEntries={["/client"]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/client"
            element={<ProtectedRoute>{protectedElement}</ProtectedRoute>}
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );

let originalLocalStorage;

beforeEach(() => {
  originalLocalStorage = window.localStorage;
  const nextLocalStorage = createLocalStorageMock();

  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: nextLocalStorage,
  });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: nextLocalStorage,
  });
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.unstubAllGlobals();
  vi.clearAllMocks();

  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: originalLocalStorage,
  });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: originalLocalStorage,
  });
});

describe("ProtectedRoute auth bootstrap", () => {
  it("renders protected content after validating a valid stored token on load", async () => {
    const now = Date.now();
    const token = createJwt({
      sub: "user-1",
      exp: Math.floor((now + 60_000) / 1000),
    });
    persistSession({
      accessToken: token,
      user: { id: "user-1", role: "CLIENT" },
    });

    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse(200, {
        data: { id: "user-1", role: "CLIENT", email: "client@example.com" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    renderProtectedApp();

    expect(await screen.findByText("Protected Area")).toBeTruthy();
    expect(screen.queryByText("Login Page")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/auth/profile"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${token}`,
        }),
      })
    );
  });

  it("redirects to login immediately when the stored token is already expired", async () => {
    const now = Date.now();
    const token = createJwt({
      sub: "user-2",
      exp: Math.floor((now - 60_000) / 1000),
    });
    persistSession({
      accessToken: token,
      user: { id: "user-2", role: "FREELANCER" },
    });

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    renderProtectedApp();

    expect(await screen.findByText("Login Page")).toBeTruthy();
    expect(screen.queryByText("Protected Area")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(sessionStorageKeys.token)).toBeNull();
    expect(window.localStorage.getItem(sessionStorageKeys.user)).toBeNull();
  });

  it("logs the user out when a later authenticated request returns 401", async () => {
    const now = Date.now();
    const token = createJwt({
      sub: "user-3",
      exp: Math.floor((now + 60_000) / 1000),
    });
    persistSession({
      accessToken: token,
      user: { id: "user-3", role: "CLIENT" },
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse(200, {
          data: { id: "user-3", role: "CLIENT", email: "client@example.com" },
        })
      )
      .mockResolvedValueOnce(createJsonResponse(401, { message: "Unauthorized" }));
    vi.stubGlobal("fetch", fetchMock);

    renderProtectedApp(<AuthFetchProbe />);

    expect(await screen.findByText("Protected Area")).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText("Login Page")).toBeTruthy();
    });

    expect(window.localStorage.getItem(sessionStorageKeys.token)).toBeNull();
    expect(window.localStorage.getItem(sessionStorageKeys.user)).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
