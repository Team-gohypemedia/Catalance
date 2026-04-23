import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import FreelancerOnboardingWelcomeModal from "../FreelancerOnboardingWelcomeModal.jsx";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("FreelancerOnboardingWelcomeModal", () => {
  it("renders the required onboarding CTA when open", () => {
    render(
      <FreelancerOnboardingWelcomeModal
        open
        onStartOnboarding={vi.fn()}
      />
    );

    expect(
      screen.getByRole("heading", { name: /welcome to catalance/i })
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: /start onboarding/i })).toBeTruthy();
    expect(screen.queryByLabelText(/close/i)).toBeNull();
  });

  it("calls the onboarding CTA handler", () => {
    const handleStartOnboarding = vi.fn();

    render(
      <FreelancerOnboardingWelcomeModal
        open
        onStartOnboarding={handleStartOnboarding}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /start onboarding/i }));

    expect(handleStartOnboarding).toHaveBeenCalledTimes(1);
  });
});
