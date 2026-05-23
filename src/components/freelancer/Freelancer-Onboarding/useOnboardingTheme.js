import { useEffect } from "react";

let onboardingPageCount = 0;

export function useOnboardingTheme() {
  useEffect(() => {
    onboardingPageCount++;
    document.documentElement.classList.add("onboarding-page");
    return () => {
      onboardingPageCount--;
      if (onboardingPageCount <= 0) {
        document.documentElement.classList.remove("onboarding-page");
        onboardingPageCount = 0; // Safeguard against underflow
      }
    };
  }, []);
}
