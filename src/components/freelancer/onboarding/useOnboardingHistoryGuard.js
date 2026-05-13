import { useCallback, useEffect } from "react";
import { useBlocker } from "react-router-dom";

const useOnboardingHistoryGuard = ({
  routePath,
  enabled = true,
  onBlockedBack,
}) => {
  const shouldBlock = useCallback(
    ({ historyAction, nextLocation }) =>
      enabled &&
      historyAction === "POP" &&
      nextLocation.pathname !== routePath,
    [enabled, routePath],
  );

  const blocker = useBlocker(shouldBlock);

  useEffect(() => {
    if (!enabled || blocker.state !== "blocked") {
      return;
    }

    blocker.reset();
    onBlockedBack();
  }, [blocker, enabled, onBlockedBack]);
};

export default useOnboardingHistoryGuard;
