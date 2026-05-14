import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

let blockerState = { state: "unblocked", reset: vi.fn() };
let capturedShouldBlock = null;

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");

  return {
    ...actual,
    useBlocker: (shouldBlock) => {
      capturedShouldBlock = shouldBlock;
      return blockerState;
    },
  };
});

import useOnboardingHistoryGuard from "../useOnboardingHistoryGuard.js";

const TestComponent = ({
  enabled = true,
  onBlockedBack = vi.fn(),
  routePath = "/freelancer/onboarding",
}) => {
  useOnboardingHistoryGuard({
    routePath,
    enabled,
    onBlockedBack,
  });

  return null;
};

afterEach(() => {
  cleanup();
  blockerState = { state: "unblocked", reset: vi.fn() };
  capturedShouldBlock = null;
  vi.clearAllMocks();
});

describe("useOnboardingHistoryGuard", () => {
  it("blocks pop navigations that would leave the onboarding route", () => {
    render(<TestComponent />);

    expect(
      capturedShouldBlock({
        historyAction: "POP",
        nextLocation: { pathname: "/freelancer" },
      }),
    ).toBe(true);

    expect(
      capturedShouldBlock({
        historyAction: "PUSH",
        nextLocation: { pathname: "/freelancer" },
      }),
    ).toBe(false);

    expect(
      capturedShouldBlock({
        historyAction: "POP",
        nextLocation: { pathname: "/freelancer/onboarding" },
      }),
    ).toBe(false);
  });

  it("invokes the back handler when a blocked browser back event occurs", async () => {
    const onBlockedBack = vi.fn();
    blockerState = { state: "blocked", reset: vi.fn() };

    render(<TestComponent onBlockedBack={onBlockedBack} />);

    await waitFor(() => {
      expect(onBlockedBack).toHaveBeenCalledTimes(1);
      expect(blockerState.reset).toHaveBeenCalledTimes(1);
    });
  });
});
