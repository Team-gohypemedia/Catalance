import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockUseAuth = vi.fn();
const mockUseNotifications = vi.fn();

vi.mock("@/shared/context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/shared/context/NotificationContext", () => ({
  useNotifications: () => mockUseNotifications(),
}));

import ClientWorkspaceHeader from "@/components/features/client/ClientWorkspaceHeader.jsx";
import FreelancerWorkspaceHeader from "@/components/features/freelancer/FreelancerWorkspaceHeader.jsx";
import { getDashboardPreferenceStorageKey } from "@/shared/lib/dashboard-preference";

const dualRoleUser = {
  id: "user-44",
  role: "CLIENT",
  roles: ["CLIENT", "FREELANCER"],
  fullName: "ZAMASU GAMING",
  email: "zamasu@example.com",
};

const freelancerOnlyUser = {
  id: "user-45",
  role: "FREELANCER",
  roles: ["FREELANCER"],
  fullName: "MOHD KAIF",
  email: "mohd@example.com",
};

const clientOnlyUser = {
  id: "user-46",
  role: "CLIENT",
  roles: ["CLIENT"],
  fullName: "CLIENT ONLY",
  email: "client-only@example.com",
};

const profile = {
  name: "ZAMASU GAMING",
  email: "zamasu@example.com",
};

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

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
};

const renderHeader = (element, initialEntry) =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="*"
          element={
            <>
              <LocationProbe />
              {element}
            </>
          }
        />
      </Routes>
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

  mockUseAuth.mockReturnValue({
    user: dualRoleUser,
    logout: vi.fn(),
    isAuthenticated: true,
  });
  mockUseNotifications.mockReturnValue({
    notifications: [],
    unreadCount: 0,
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  });
  vi.stubGlobal(
    "ResizeObserver",
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
});

afterEach(() => {
  cleanup();
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

describe("workspace header dashboard switching", () => {
  it("shows 'Switch to Freelancer' in the client header dropdown", async () => {
    renderHeader(<ClientWorkspaceHeader profile={profile} />, "/client");

    fireEvent.click(screen.getAllByRole("button", { name: /zamasu gaming/i })[0]);

    expect(await screen.findByText("Switch to Freelancer")).toBeTruthy();
    expect(screen.getByText("Currently in Client mode")).toBeTruthy();
  });

  it("shows 'Switch to Client' in the freelancer header dropdown", async () => {
    renderHeader(<FreelancerWorkspaceHeader profile={profile} />, "/freelancer");

    fireEvent.click(screen.getAllByRole("button", { name: /zamasu gaming/i })[0]);

    expect(await screen.findByText("Switch to Client")).toBeTruthy();
    expect(screen.getByText("Currently in Freelancer mode")).toBeTruthy();
  });

  it("shows 'Switch to Client' for freelancer-only accounts", async () => {
    mockUseAuth.mockReturnValue({
      user: freelancerOnlyUser,
      logout: vi.fn(),
      isAuthenticated: true,
    });

    renderHeader(
      <FreelancerWorkspaceHeader
        profile={{ name: freelancerOnlyUser.fullName, email: freelancerOnlyUser.email }}
      />,
      "/freelancer"
    );

    fireEvent.click(screen.getAllByRole("button", { name: /mohd kaif/i })[0]);

    expect(await screen.findByText("Switch to Client")).toBeTruthy();
    expect(screen.getByText("Currently in Freelancer mode")).toBeTruthy();
  });

  it("shows 'Switch to Freelancer' for client-only accounts", async () => {
    mockUseAuth.mockReturnValue({
      user: clientOnlyUser,
      logout: vi.fn(),
      isAuthenticated: true,
    });

    renderHeader(
      <ClientWorkspaceHeader
        profile={{ name: clientOnlyUser.fullName, email: clientOnlyUser.email }}
      />,
      "/client"
    );

    fireEvent.click(screen.getAllByRole("button", { name: /client only/i })[0]);

    expect(await screen.findByText("Switch to Freelancer")).toBeTruthy();
    expect(screen.getByText("Currently in Client mode")).toBeTruthy();
  });

  it("saves the last active dashboard immediately when switching", async () => {
    renderHeader(<ClientWorkspaceHeader profile={profile} />, "/client");

    fireEvent.click(screen.getAllByRole("button", { name: /zamasu gaming/i })[0]);
    fireEvent.click(
      await screen.findByRole("switch", {
        name: /switch to freelancer dashboard/i,
      })
    );

    await waitFor(() => {
      expect(screen.getByTestId("location").textContent).toBe("/freelancer");
    });

    expect(
      window.localStorage.getItem(getDashboardPreferenceStorageKey(dualRoleUser))
    ).toBe("freelancer");
  });
});
