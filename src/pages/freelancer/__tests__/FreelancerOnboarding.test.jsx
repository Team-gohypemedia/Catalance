import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockUseAuth = vi.fn();

vi.mock("@/shared/context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/shared/lib/api-client", () => ({
  API_BASE_URL: "http://localhost:3000",
  fetchStatesByCountry: vi.fn().mockResolvedValue({ states: [] }),
  listFreelancers: vi.fn().mockResolvedValue([]),
  updateProfile: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import FreelancerOnboarding from "../FreelancerOnboarding.jsx";

const renderFreelancerOnboarding = () => {
  const router = createMemoryRouter(
    [
      {
        path: "/freelancer/onboarding",
        element: <FreelancerOnboarding />,
      },
    ],
    {
      initialEntries: ["/freelancer/onboarding"],
    },
  );

  return render(<RouterProvider router={router} />);
};

beforeEach(() => {
  mockUseAuth.mockReturnValue({
    user: {
      id: "user-1",
      username: "btwitskaif69",
      fullName: "Mohd Kaif",
      role: "FREELANCER",
      onboardingComplete: false,
      profileDetails: {
        role: "individual",
        identity: {
          username: "btwitskaif69",
          country: "India",
          city: "Delhi",
          dateOfBirth: "1992-08-17",
          address: "12 Brick Lane, Mumbai",
          pincode: "400001",
        },
      },
    },
    authFetch: vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }),
    refreshUser: vi.fn().mockResolvedValue(undefined),
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("FreelancerOnboarding", () => {
  it("renders the onboarding shell without throwing", async () => {
    renderFreelancerOnboarding();

    expect(await screen.findByText("Complete Your Profile")).toBeTruthy();
  });
});