import { useEffect } from "react";
import { FullPageLoader } from "@/components/layout/guards";

/** Leaves Campus for a Catalance account page (sign in, sign up, reset password). */
export function CatalanceRedirect({ to, before }) {
  useEffect(() => {
    before?.();
    window.location.replace(to);
  }, [to, before]);
  return <FullPageLoader />;
}
