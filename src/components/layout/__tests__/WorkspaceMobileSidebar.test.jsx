import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockSwitchDashboard = vi.hoisted(() => vi.fn());

vi.mock("@/shared/hooks/use-dashboard-switcher", () => ({
  useDashboardSwitcher: ({ currentDashboard }) => ({
    canSwitchDashboard: true,
    currentDashboardLabel: currentDashboard === "client" ? "Client" : "Freelancer",
    switchDashboard: mockSwitchDashboard,
    switchLabel: currentDashboard === "client" ? "Switch to Freelancer" : "Switch to Client",
  }),
}));

vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children }) => <div>{children}</div>,
  SheetClose: ({ children }) => <div>{children}</div>,
  SheetContent: ({ children }) => <div>{children}</div>,
  SheetDescription: ({ children }) => <div>{children}</div>,
  SheetHeader: ({ children }) => <div>{children}</div>,
  SheetTitle: ({ children }) => <div>{children}</div>,
  SheetTrigger: ({ children }) => <div>{children}</div>,
}));

import WorkspaceMobileSidebar from "@/components/layout/WorkspaceMobileSidebar";

const marketingNavItems = [
  { label: "Home", key: "home", to: "/" },
  { label: "Contact", key: "contact", to: "/contact" },
];

const clientWorkspaceNavItems = [
  { label: "Dashboard", key: "dashboard", to: "/client" },
  { label: "Proposals", key: "proposals", to: "/client/proposal" },
  { label: "Projects", key: "projects", to: "/client/project" },
  { label: "Messages", key: "messages", to: "/client/messages" },
  { label: "Payments", key: "payments", to: "/client/payments" },
  { label: "Profile", key: "profile", to: "/client/profile" },
];

const freelancerWorkspaceNavItems = [
  { label: "Dashboard", key: "dashboard", to: "/freelancer" },
  { label: "Proposals", key: "proposals", to: "/freelancer/proposals" },
  { label: "Projects", key: "projects", to: "/freelancer/project" },
  { label: "Messages", key: "messages", to: "/freelancer/messages" },
  { label: "Payments", key: "payments", to: "/freelancer/payments" },
  { label: "Profile", key: "profile", to: "/freelancer/profile" },
];

const renderSidebar = ({ currentDashboard, workspaceNavItems }) =>
  render(
    <MemoryRouter>
      <WorkspaceMobileSidebar
        currentDashboard={currentDashboard}
        displayName="Mohd Kaif"
        profile={{}}
        profileInitial="M"
        profileTo={`/${currentDashboard}/profile`}
        marketingNavItems={marketingNavItems}
        workspaceNavItems={workspaceNavItems}
        onLogout={vi.fn()}
      />
    </MemoryRouter>,
  );

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("WorkspaceMobileSidebar", () => {
  it("shows the client profile option in the mobile workspace menu", () => {
    renderSidebar({
      currentDashboard: "client",
      workspaceNavItems: clientWorkspaceNavItems,
    });

    expect(screen.getByRole("link", { name: /^profile$/i }).getAttribute("href")).toBe(
      "/client/profile",
    );
  });

  it("shows the freelancer profile option in the mobile workspace menu", () => {
    renderSidebar({
      currentDashboard: "freelancer",
      workspaceNavItems: freelancerWorkspaceNavItems,
    });

    expect(screen.getByRole("link", { name: /^profile$/i }).getAttribute("href")).toBe(
      "/freelancer/profile",
    );
  });

  it("renders the client mode switch card", () => {
    renderSidebar({
      currentDashboard: "client",
      workspaceNavItems: clientWorkspaceNavItems,
    });

    expect(screen.queryByText("Client mode active")).toBeNull();
    expect(screen.getByText("Switch to Freelancer")).toBeTruthy();
    expect(screen.getByText("Currently in Client mode")).toBeTruthy();

    const switchControl = screen.getByRole("switch", {
      name: /switch to freelancer dashboard/i,
    });
    expect(switchControl.getAttribute("aria-checked")).toBe("false");

    fireEvent.click(switchControl);
    expect(mockSwitchDashboard).toHaveBeenCalledTimes(1);
  });

  it("renders the freelancer mode switch card", () => {
    renderSidebar({
      currentDashboard: "freelancer",
      workspaceNavItems: freelancerWorkspaceNavItems,
    });

    expect(screen.queryByText("Freelancer mode active")).toBeNull();
    expect(screen.getByText("Switch to Client")).toBeTruthy();
    expect(screen.getByText("Currently in Freelancer mode")).toBeTruthy();

    const switchControl = screen.getByRole("switch", {
      name: /switch to client dashboard/i,
    });
    expect(switchControl.getAttribute("aria-checked")).toBe("true");
  });

  it("makes only the freelancer contact tile full width", () => {
    const { rerender } = render(
      <MemoryRouter>
        <WorkspaceMobileSidebar
          currentDashboard="client"
          displayName="Mohd Kaif"
          profile={{}}
          profileInitial="M"
          profileTo="/client/profile"
          marketingNavItems={marketingNavItems}
          workspaceNavItems={clientWorkspaceNavItems}
          onLogout={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /^contact$/i }).className).not.toContain(
      "col-span-2",
    );

    rerender(
      <MemoryRouter>
        <WorkspaceMobileSidebar
          currentDashboard="freelancer"
          displayName="Mohd Kaif"
          profile={{}}
          profileInitial="M"
          profileTo="/freelancer/profile"
          marketingNavItems={marketingNavItems}
          workspaceNavItems={freelancerWorkspaceNavItems}
          onLogout={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /^contact$/i }).className).toContain(
      "col-span-2 [&>div]:justify-center",
    );
  });

  it("can flush dashboard container padding for workspace pages", () => {
    const { container } = render(
      <MemoryRouter>
        <WorkspaceMobileSidebar
          currentDashboard="client"
          displayName="Mohd Kaif"
          flushContainerPadding
          profile={{}}
          profileInitial="M"
          profileTo="/client/profile"
          marketingNavItems={marketingNavItems}
          workspaceNavItems={clientWorkspaceNavItems}
          onLogout={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(container.firstElementChild?.className).toContain("-mx-4");
  });
});
