import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockUseAuth = vi.fn();

vi.mock("@/shared/context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/components/layout/WorkspaceProfileDropdown", () => ({
  default: () => <div>Profile Menu</div>,
}));

vi.mock("@/components/layout/WorkspaceMobileSidebar", () => ({
  default: () => null,
}));

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children }) => <div>{children}</div>,
  SheetClose: ({ children }) => <div>{children}</div>,
  SheetContent: ({ children }) => <div>{children}</div>,
  SheetDescription: ({ children }) => <div>{children}</div>,
  SheetFooter: ({ children }) => <div>{children}</div>,
  SheetHeader: ({ children }) => <div>{children}</div>,
  SheetTitle: ({ children }) => <div>{children}</div>,
  SheetTrigger: ({ children }) => <div>{children}</div>,
}));

import FreelancerWorkspaceHeader from "@/components/features/freelancer/FreelancerWorkspaceHeader";

beforeEach(() => {
  mockUseAuth.mockReturnValue({
    logout: vi.fn(),
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("FreelancerWorkspaceHeader", () => {
  it("does not show the Service tab in freelancer marketing navigation", () => {
    render(
      <MemoryRouter>
        <FreelancerWorkspaceHeader
          profile={{ name: "Mohd Kaif", email: "mohd@example.com" }}
        />
      </MemoryRouter>
    );

    expect(screen.getByText("Home")).toBeTruthy();
    expect(screen.getByText("Opportunity")).toBeTruthy();
    expect(screen.getByText("Contact")).toBeTruthy();
    expect(screen.queryByText("Service")).toBeNull();
  });
});
