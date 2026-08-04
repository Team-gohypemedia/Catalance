import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const MetaPixelPageTracker = () => {
  const { pathname, search, hash } = useLocation();
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.fbq !== "function") {
      return;
    }

    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;

      if (window.__META_PIXEL_INITIAL_PAGEVIEW_SENT__) {
        return;
      }
    }

    window.fbq("track", "PageView");
  }, [pathname, search, hash]);

  return null;
};

export default MetaPixelPageTracker;
