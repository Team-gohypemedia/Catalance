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
import { FREELANCER_ONBOARDING_PATH } from "@/shared/lib/dashboard-preference";

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

const LocationProbe = () => {
  const { user } = useAuth();
  return <div>{user ? "Session Ready" : "No Session"}</div>;
};

const renderProtectedApp = ({
  initialEntry = "/client",
  loginPath = "/login",
  protectedPath = "/client",
  protectedElement = <ProtectedContent />,
  protectedProps = {},
  extraRoutes = null,
} = {}) =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <Routes>
          <Route path={loginPath} element={<LoginPage />} />
          <Route
            path={protectedPath}
            element={<ProtectedRoute {...protectedProps}>{protectedElement}</ProtectedRoute>}
          />
          {extraRoutes}
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

    renderProtectedApp({ protectedElement: <AuthFetchProbe /> });

    expect(await screen.findByText("Protected Area")).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText("Login Page")).toBeTruthy();
    });

    expect(window.localStorage.getItem(sessionStorageKeys.token)).toBeNull();
    expect(window.localStorage.getItem(sessionStorageKeys.user)).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("allows incomplete freelancers to load the dashboard route", async () => {
    const now = Date.now();
    const token = createJwt({
      sub: "user-4",
      exp: Math.floor((now + 60_000) / 1000),
    });
    persistSession({
      accessToken: token,
      user: { id: "user-4", role: "FREELANCER", onboardingComplete: false },
    });

    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse(200, {
        data: {
          id: "user-4",
          role: "FREELANCER",
          email: "freelancer@example.com",
          onboardingComplete: false,
        },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    renderProtectedApp({
      initialEntry: "/freelancer",
      protectedPath: "/freelancer",
      extraRoutes: <Route path="*" element={<LocationProbe />} />,
    });

    expect(await screen.findByText("Protected Area")).toBeTruthy();
    expect(screen.queryByText("Login Page")).toBeNull();
  });

  it("redirects incomplete freelancers away from locked freelancer routes", async () => {
    const now = Date.now();
    const token = createJwt({
      sub: "user-4b",
      exp: Math.floor((now + 60_000) / 1000),
    });
    persistSession({
      accessToken: token,
      user: { id: "user-4b", role: "FREELANCER", onboardingComplete: false },
    });

    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse(200, {
        data: {
          id: "user-4b",
          role: "FREELANCER",
          email: "freelancer-locked@example.com",
          onboardingComplete: false,
        },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    renderProtectedApp({
      initialEntry: "/freelancer/proposals",
      protectedPath: "/freelancer/proposals",
      protectedProps: { requireFreelancerOnboardingComplete: true },
      extraRoutes: (
        <>
          <Route path="/freelancer" element={<div>Freelancer Dashboard</div>} />
          <Route path="*" element={<LocationProbe />} />
        </>
      ),
    });

    expect(await screen.findByText("Freelancer Dashboard")).toBeTruthy();
    expect(screen.queryByText("Protected Area")).toBeNull();
  });

  it("redirects completed freelancers away from the onboarding route", async () => {
    const now = Date.now();
    const token = createJwt({
      sub: "user-5",
      exp: Math.floor((now + 60_000) / 1000),
    });
    persistSession({
      accessToken: token,
      user: { id: "user-5", role: "FREELANCER", onboardingComplete: true },
    });

    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse(200, {
        data: {
          id: "user-5",
          role: "FREELANCER",
          email: "complete@example.com",
          onboardingComplete: true,
        },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    renderProtectedApp({
      initialEntry: FREELANCER_ONBOARDING_PATH,
      protectedPath: FREELANCER_ONBOARDING_PATH,
      protectedProps: { allowFreelancerOnboardingOnly: true },
      extraRoutes: <Route path="/freelancer" element={<div>Freelancer Dashboard</div>} />,
    });

    expect(await screen.findByText("Freelancer Dashboard")).toBeTruthy();
    expect(screen.queryByText("Protected Area")).toBeNull();
  });
});
