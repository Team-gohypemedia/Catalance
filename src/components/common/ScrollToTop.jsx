import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    const prevPath = prevPathnameRef.current;
    prevPathnameRef.current = pathname;

    // Do not scroll to top if navigating between marketplace filter views
    const isMarketplaceFilterTransition =
      (prevPath === "/marketplace" || prevPath.startsWith("/marketplace/")) &&
      !prevPath.startsWith("/marketplace/service/") &&
      (pathname === "/marketplace" || pathname.startsWith("/marketplace/")) &&
      !pathname.startsWith("/marketplace/service/");

    if (!isMarketplaceFilterTransition) {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
};

export default ScrollToTop;
