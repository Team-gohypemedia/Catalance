import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Mail } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/primitives";
import { AuthShell, DemoChips, PasswordInput, postAuthPath } from "@/components/auth/AuthShell";
import { CatalanceRedirect } from "@/components/auth/CatalanceRedirect";
import { IS_DEMO } from "@/lib/api/client";
import { catalanceSigninUrl } from "@/lib/catalance";

/** Campus uses Catalance accounts; the email/password form below only serves the in-browser demo. */
export default function Login() {
  const [params] = useSearchParams();
  if (!IS_DEMO) return <CatalanceRedirect to={catalanceSigninUrl(params.get("next"))} />;
  return <DemoLogin />;
}

function DemoLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next");
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoEmail, setDemoEmail] = useState(null);

  const validate = (f) => {
    const e = {};
    if (!f.email.trim()) e.email = "Enter your email.";
    else if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = "That doesn't look like an email.";
    if (!f.password) e.password = "Enter your password.";
    return e;
  };

  const doLogin = async (email, password, isDemo = false) => {
    setFormError("");
    isDemo ? setDemoEmail(email) : setLoading(true);
    try {
      const user = await login(email.trim(), password);
      toast.success(`Welcome back, ${user.name?.split(" ")[0] || "friend"}!`);
      navigate(postAuthPath(user, next), { replace: true });
    } catch (err) {
      setFormError(err.message || "Couldn't log you in. Try again.");
    } finally {
      setLoading(false);
      setDemoEmail(null);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length) return;
    doLogin(form.email, form.password);
  };

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  return (
    <AuthShell
      title="Welcome back"
      description="Log in to pick up where you left off. Your streak is waiting."
      footer={
        <>
          New to Campus?{" "}
          <Link to={`/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-medium text-primary hover:underline">
            Create a free account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-5">
        {formError && (
          <p role="alert" className="rounded-lg border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
            {formError}
          </p>
        )}
        <Field label="Email" htmlFor="login-email" error={errors.email}>
          <Input id="login-email" type="email" leftIcon={Mail} autoComplete="email" placeholder="you@college.edu" className="h-12" value={form.email} onChange={set("email")} aria-invalid={!!errors.email} autoFocus />
        </Field>
        <Field label="Password" htmlFor="login-password" error={errors.password}>
          <PasswordInput id="login-password" autoComplete="current-password" placeholder="Your password" className="h-12" value={form.password} onChange={set("password")} aria-invalid={!!errors.password} />
        </Field>
        <div className="-mt-2 flex justify-end">
          <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" size="xl" className="w-full" loading={loading} disabled={!!demoEmail} rightIcon={ArrowRight}>
          Log in
        </Button>
        <DemoChips onPick={(email, pw) => doLogin(email, pw, true)} loadingEmail={demoEmail} />
      </form>
    </AuthShell>
  );
}
