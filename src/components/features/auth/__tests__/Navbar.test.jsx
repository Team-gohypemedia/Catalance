import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockUseAuth = vi.fn();
const mockUseDashboardSwitcher = vi.fn();

vi.mock("@/shared/context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/shared/hooks/use-dashboard-switcher", () => ({
  useDashboardSwitcher: () => mockUseDashboardSwitcher(),
}));

vi.mock("@/components/layout/WorkspaceProfileDropdown", () => ({
  default: () => <div>Profile Menu</div>,
}));

vi.mock("@/components/ui/resizable-navbar-fixed", () => ({
  Navbar: ({ children }) => <div>{children}</div>,
  NavBody: ({ children }) => <div>{children}</div>,
  NavItems: ({ items }) => (
    <nav>
      {items.map((item) => (
        <span key={item.link}>{item.name}</span>
      ))}
    </nav>
  ),
  MobileNav: ({ children }) => <div>{children}</div>,
  MobileNavHeader: ({ children }) => <div>{children}</div>,
  MobileNavMenu: ({ isOpen, children }) => (isOpen ? <div>{children}</div> : null),
  MobileNavToggle: ({ onClick }) => <button onClick={onClick}>Toggle</button>,
  NavbarLogo: () => <div>Catalance</div>,
  NavbarButton: ({ children, as: Component = "button", ...props }) => (
    <Component {...props}>{children}</Component>
  ),
}));

import Navbar from "@/components/layout/Navbar";

const authenticatedUser = {
  id: "user-1",
  fullName: "Mohd Kaif",
  email: "mohd@example.com",
};

const renderNavbar = (initialEntry) =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Navbar />
    </MemoryRouter>
  );

beforeEach(() => {
  mockUseAuth.mockReturnValue({
    user: authenticatedUser,
    token: "token-123",
    isAuthenticated: true,
    authLoading: false,
    logout: vi.fn(),
  });
  mockUseDashboardSwitcher.mockReturnValue({
    currentDashboard: "freelancer",
    dashboardPath: "/freelancer",
    profilePath: "/freelancer/profile",
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Navbar service tab visibility", () => {
  it("hides the Service tab on freelancer routes", () => {
    renderNavbar("/freelancer");

    expect(screen.queryByText("Service")).toBeNull();
    expect(screen.getByText("Opportunity")).toBeTruthy();
  });

  it("keeps the desktop Service tab on public routes but hides Services in the freelancer mobile sidebar", () => {
    renderNavbar("/marketplace");

    expect(screen.getByText("Service")).toBeTruthy();
    expect(screen.queryByText("Services")).toBeNull();
    expect(screen.getByText("Opportunity")).toBeTruthy();
  });

  it("shows the Service tab on client routes", () => {
    mockUseDashboardSwitcher.mockReturnValue({
      currentDashboard: "client",
      dashboardPath: "/client",
      profilePath: "/client/profile",
    });

    renderNavbar("/client");

    expect(screen.getByText("Service")).toBeTruthy();
    expect(screen.getByText("Marketplace")).toBeTruthy();
  });

  it("opens the public mobile sheet menu for logged-out users", async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      authLoading: false,
      logout: vi.fn(),
    });

    renderNavbar("/");

    fireEvent.click(screen.getByRole("button", { name: /open navigation menu/i }));

    expect(await screen.findByRole("link", { name: "Log In" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Sign Up" })).toBeTruthy();
  });
});
