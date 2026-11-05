import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { FullPageLoader } from "@/components/layout/guards";
import { AuthShell, postAuthPath } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { catalanceSigninUrl, safeNext } from "@/lib/catalance";

/**
 * /sso#token=…&next=/app/gigs — where Catalance's /campus route lands a signed-in user.
 * The token travels in the URL fragment (never sent to any server) and is wiped from the address bar right away.
 */
export default function Sso() {
  const { adoptToken } = useAuth();
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get("token");
    const next = safeNext(params.get("next"));
    window.history.replaceState(null, "", window.location.pathname);

    if (!token) {
      setFailed(true);
      return;
    }
    adoptToken(token)
      .then((user) => {
        toast.success(`Welcome, ${user.name?.split(" ")[0] || "friend"}!`);
        navigate(postAuthPath(user, next), { replace: true });
      })
      .catch(() => setFailed(true));
  }, [adoptToken, navigate]);

  if (!failed) return <FullPageLoader />;

  return (
    <AuthShell title="We couldn't sign you in" description="Your Catalance session may have expired. Sign in again to continue to Campus.">
      <div className="space-y-3">
        <Button href={catalanceSigninUrl("/app")} size="xl" className="w-full">
          Sign in with Catalance
        </Button>
        <Button to="/" variant="ghost" className="w-full">
          Back to Campus
        </Button>
      </div>
    </AuthShell>
  );
}
