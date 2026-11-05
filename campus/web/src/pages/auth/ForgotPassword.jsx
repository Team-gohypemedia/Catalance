import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, MailCheck, Mail } from "lucide-react";
import { api, IS_DEMO } from "@/lib/api/client";
import { catalanceForgotPasswordUrl } from "@/lib/catalance";
import { CatalanceRedirect } from "@/components/auth/CatalanceRedirect";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/primitives";
import { AuthShell } from "@/components/auth/AuthShell";

/** Passwords belong to the Catalance account, so resets happen there. The form below only serves the in-browser demo. */
export default function ForgotPassword() {
  if (!IS_DEMO) return <CatalanceRedirect to={catalanceForgotPasswordUrl()} />;
  return <DemoForgotPassword />;
}

function DemoForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Enter the email you signed up with.");
      return;
    }
    setError("");
    setFormError("");
    setLoading(true);
    try {
      await api.post("/api/auth/forgot-password", { email: email.trim() });
      setSent(true);
    } catch (err) {
      setFormError(err.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={sent ? "Check your inbox" : "Reset your password"}
      description={sent ? undefined : "Happens to the best of us. We'll email you a link to reset it."}
      footer={
        <Link to="/login" className="inline-flex items-center gap-1.5 font-medium text-muted hover:text-fg">
          <ArrowLeft className="size-4" /> Back to log in
        </Link>
      }
    >
      {sent ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <span className="flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary">
            <MailCheck className="size-5" strokeWidth={1.75} />
          </span>
          <p className="mt-5 leading-relaxed text-muted">
            If an account exists for <b className="text-fg">{email}</b>, a reset link is on its way. It expires in 30 minutes — check spam if you don't see it.
          </p>
          <Button variant="outline" size="lg" className="mt-6 w-full" onClick={() => setSent(false)}>
            Use a different email
          </Button>
        </motion.div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-5">
          {formError && (
            <p role="alert" className="rounded-lg border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
              {formError}
            </p>
          )}
          <Field label="Email" htmlFor="fp-email" error={error}>
            <Input id="fp-email" type="email" leftIcon={Mail} autoComplete="email" placeholder="you@college.edu" className="h-12" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!error} autoFocus />
          </Field>
          <Button type="submit" size="xl" className="w-full" loading={loading}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
