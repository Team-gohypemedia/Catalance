import { useCallback, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Info, Mail, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { AuthShell, DemoChips, PasswordInput, postAuthPath } from "@/components/auth/AuthShell";
import { CatalanceRedirect } from "@/components/auth/CatalanceRedirect";
import { IS_DEMO } from "@/lib/api/client";
import { catalanceSigninUrl } from "@/lib/catalance";

function strength(pw) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const STRENGTH = ["Too short", "Okay", "Good", "Strong", "Very strong"];

/** Stash ?track / ?college / ?goal from a signup link; onboarding reads them after the user is signed in. */
function stashOnboardingCarry(params) {
  const stash = new URLSearchParams();
  for (const key of ["track", "college", "goal"]) if (params.get(key)) stash.set(key, params.get(key));
  try {
    if (stash.size) sessionStorage.setItem("campus_onboarding_carry", stash.toString());
    else sessionStorage.removeItem("campus_onboarding_carry");
  } catch {}
}

/** Campus uses Catalance accounts: new people create one on Catalance. The form below only serves the in-browser demo. */
export default function Signup() {
  const [params] = useSearchParams();
  const stash = useCallback(() => stashOnboardingCarry(params), [params]);
  if (!IS_DEMO) return <CatalanceRedirect to={catalanceSigninUrl(params.get("next"))} before={stash} />;
  return <DemoSignup />;
}

function DemoSignup() {
  const { signup, login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next");
  const track = params.get("track");
  const college = params.get("college"); // from a classmate's college invite link
  const goal = params.get("goal"); // e.g. "aspirant" from /aspirants
  const isAspirant = goal === "aspirant";
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoEmail, setDemoEmail] = useState(null);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const v = {};
    if (form.name.trim().length < 2) v.name = "Tell us your name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) v.email = "Enter a valid email.";
    if (form.password.length < 8) v.password = "Use at least 8 characters.";
    setErrors(v);
    if (Object.keys(v).length) return;
    setFormError("");
    setLoading(true);
    try {
      // The guest guard may redirect to /onboarding before we navigate, so stash the carry-through params too.
      stashOnboardingCarry(params);
      const user = await signup({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      toast.success(`Welcome to Campus, ${user.name.split(" ")[0]}!`);
      const dest = postAuthPath(user, next);
      const carry = new URLSearchParams();
      if (track) carry.set("track", track);
      if (college) carry.set("college", college);
      if (goal) carry.set("goal", goal);
      navigate(dest === "/onboarding" && carry.size ? `/onboarding?${carry}` : dest, { replace: true });
    } catch (err) {
      setFormError(err.message || "Couldn't create your account. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const demo = async (email, pw) => {
    setDemoEmail(email);
    try {
      const user = await login(email, pw);
      navigate(postAuthPath(user, next), { replace: true });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setDemoEmail(null);
    }
  };

  const pwScore = strength(form.password);

  return (
    <AuthShell
      title={isAspirant ? "Taiyari bhi, career bhi" : "Create your free account"}
      description={isAspirant ? "Keep preparing for your exam. Add 45 minutes a day and build a career backup." : "One Catalance account for learning, assessment and projects."}
      footer={
        <>
          Already on Campus?{" "}
          <Link to={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-5">
        {formError && (
          <p role="alert" className="rounded-lg border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
            {formError}{" "}
            {/exists/i.test(formError) && (
              <Link to="/login" className="underline">
                Log in instead
              </Link>
            )}
          </p>
        )}
        <Field label="Full name" htmlFor="su-name" error={errors.name}>
          <Input id="su-name" leftIcon={User} autoComplete="name" placeholder="e.g. Priya Sharma" className="h-12" value={form.name} onChange={set("name")} aria-invalid={!!errors.name} autoFocus />
        </Field>
        <Field label="Email" htmlFor="su-email" error={errors.email}>
          <Input id="su-email" type="email" leftIcon={Mail} autoComplete="email" placeholder="you@gmail.com" className="h-12" value={form.email} onChange={set("email")} aria-invalid={!!errors.email} />
        </Field>
        <Field label="Password" htmlFor="su-password" error={errors.password}>
          <PasswordInput id="su-password" autoComplete="new-password" placeholder="At least 8 characters" className="h-12" value={form.password} onChange={set("password")} aria-invalid={!!errors.password} />
          {form.password && (
            <div className="flex items-center gap-2 pt-1" aria-live="polite">
              <div className="flex flex-1 gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i < pwScore ? (pwScore >= 3 ? "bg-success" : pwScore === 2 ? "bg-warning" : "bg-danger") : "bg-surface-3")} />
                ))}
              </div>
              <span className="text-xs text-muted">{STRENGTH[pwScore]}</span>
            </div>
          )}
        </Field>

        <p className="flex items-start gap-2 text-xs text-muted">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          Demo mode: on the live site, Campus uses your Catalance account.
        </p>

        <Button type="submit" size="xl" className="w-full" loading={loading} rightIcon={ArrowRight}>
          Create free account
        </Button>
        <p className="text-center text-xs text-muted">By signing up you agree to our terms and privacy policy.</p>
        <DemoChips onPick={demo} loadingEmail={demoEmail} />
      </form>
    </AuthShell>
  );
}
