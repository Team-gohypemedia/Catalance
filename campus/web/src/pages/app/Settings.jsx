import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Bell, KeyRound, Languages, LogOut, Monitor, Moon, Palette, RotateCcw, ShieldCheck, Sun, TriangleAlert, User } from "lucide-react";
import { toast } from "sonner";
import { api, IS_DEMO } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { cn, LANGUAGES } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, Field, Input, Select, Skeleton } from "@/components/ui/primitives";
import { Switch } from "@/components/ui/overlays";
import { PageHeader } from "@/components/ui/campus";
import { ConsentsList } from "@/components/legal/ConsentsList";

function Section({ icon: Icon, title, description, children, tone }) {
  return (
    <Card className={cn(tone === "danger" && "border-danger/25")}>
      <CardContent className="grid gap-6 p-6 sm:p-8 md:grid-cols-[240px_minmax(0,1fr)] md:gap-10">
        <div>
          <p className={cn("flex items-center gap-2.5 font-medium tracking-tight", tone === "danger" && "text-danger")}>
            <span className={cn("flex size-8 items-center justify-center rounded-full bg-surface-2", tone === "danger" ? "text-danger" : "text-muted")}><Icon className="size-4" strokeWidth={1.75} /></span> {title}
          </p>
          {description && <p className="mt-2 text-sm text-muted">{description}</p>}
        </div>
        <div className="min-w-0">{children}</div>
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  const { user, setUser, logout } = useAuth();
  const { preference: pref, setPreference: choose } = useTheme();
  const navigate = useNavigate();
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirm: "" });

  const patchMe = useMutation({
    mutationFn: (body) => api.patch("/api/me", body),
    onSuccess: ({ user: u }) => {
      setUser(u);
      toast.success("Saved");
    },
    onError: (e) => toast.error(e.message),
  });

  const changePw = useMutation({
    mutationFn: () => api.post("/api/me/password", { currentPassword: pw.currentPassword, newPassword: pw.newPassword }),
    onSuccess: () => {
      setPw({ currentPassword: "", newPassword: "", confirm: "" });
      toast.success("Password updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const resetDemo = useMutation({
    mutationFn: async () => {
      const { db } = await import("@/mocks/db");
      db.reset();
    },
    onSuccess: () => {
      toast.success("Demo data reset. Reloading…");
      setTimeout(() => window.location.reload(), 600);
    },
    onError: (e) => toast.error(e.message),
  });

  if (!user) return <Skeleton className="h-96 rounded-3xl" />;

  const prefs = user.notificationPrefs || { email: true, whatsapp: true, push: true };
  const pwMismatch = pw.confirm && pw.newPassword !== pw.confirm;
  const pwValid = pw.currentPassword && pw.newPassword.length >= 8 && pw.newPassword === pw.confirm;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow="Account" title="Settings" description="Your account, notifications and how Campus looks." />
      <div className="space-y-5">
        <Section icon={User} title="Account" description="Your login details.">
          <Field label="Email" htmlFor="st-email" hint="Contact support to change your email.">
            <Input id="st-email" value={user.email} readOnly disabled />
          </Field>
          {!IS_DEMO ? (
            <p className="mt-5 flex items-center gap-2 border-t border-line pt-5 text-sm text-muted">
              <KeyRound className="size-4 shrink-0" strokeWidth={1.75} /> You sign in to Campus with your Catalance account, so your login details are managed on Catalance.
            </p>
          ) : (
          <form
            className="mt-5 space-y-3 border-t border-line pt-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (pwValid) changePw.mutate();
            }}
          >
            <p className="flex items-center gap-2 text-sm font-medium">
              <KeyRound className="size-4 text-muted" strokeWidth={1.75} /> Change password
            </p>
            <Field label="Current password" htmlFor="st-cur">
              <Input id="st-cur" type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="New password" htmlFor="st-new" hint="At least 8 characters" error={pw.newPassword && pw.newPassword.length < 8 ? "Too short" : null}>
                <Input id="st-new" type="password" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
              </Field>
              <Field label="Confirm new password" htmlFor="st-confirm" error={pwMismatch ? "Passwords don't match" : null}>
                <Input id="st-confirm" type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
              </Field>
            </div>
            <Button type="submit" loading={changePw.isPending} disabled={!pwValid}>
              Update password
            </Button>
          </form>
          )}
        </Section>

        <Section icon={Bell} title="Notifications" description="Where we reach you about replies, gigs and sessions.">
          <ul className="divide-y divide-line">
            {[
              ["email", "Email", "Weekly digest, session reminders, receipts"],
              ["whatsapp", "WhatsApp", "Gig updates and mentor session reminders"],
              ["push", "Push", "Replies to your doubts and rank changes"],
            ].map(([key, label, hint]) => (
              <li key={key} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium" id={`np-${key}`}>
                    {label}
                  </p>
                  <p className="text-xs text-muted">{hint}</p>
                </div>
                <Switch
                  aria-labelledby={`np-${key}`}
                  checked={!!prefs[key]}
                  disabled={patchMe.isPending}
                  onCheckedChange={(v) => patchMe.mutate({ notificationPrefs: { ...prefs, [key]: v } })}
                />
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={ShieldCheck} title="Consents" description="What you agreed to, and when.">
          <ConsentsList />
        </Section>

        <Section icon={Palette} title="Appearance" description="Light, dark, or follow your device.">
          <div className="grid grid-cols-3 gap-2">
            {[
              ["light", "Light", Sun],
              ["dark", "Dark", Moon],
              ["system", "System", Monitor],
            ].map(([key, label, Icon]) => (
              <button
                key={key}
                type="button"
                aria-pressed={pref === key}
                onClick={() => choose(key)}
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-colors",
                  pref === key ? "border-primary bg-primary-soft text-primary" : "border-line text-muted hover:border-line-strong hover:text-fg",
                )}
              >
                <Icon className="size-5" strokeWidth={1.75} />
                {label}
              </button>
            ))}
          </div>
        </Section>

        <Section icon={Languages} title="Language" description="Used by the AI Tutor and for recommendations.">
          <Field label="Learning language" htmlFor="st-lang">
            <Select id="st-lang" value={user.language || "en"} disabled={patchMe.isPending} onChange={(e) => patchMe.mutate({ language: e.target.value })}>
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </Select>
          </Field>
        </Section>

        <Section icon={TriangleAlert} title="Danger zone" tone="danger" description="Session and demo controls.">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              leftIcon={LogOut}
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              Log out
            </Button>
            {IS_DEMO && (
              <Button variant="danger" leftIcon={RotateCcw} loading={resetDemo.isPending} onClick={() => resetDemo.mutate()}>
                Reset demo data
              </Button>
            )}
          </div>
          {IS_DEMO && <p className="mt-2 text-xs text-muted">Demo mode: resets every course, gig, doubt and booking back to the original seed.</p>}
        </Section>
      </div>
    </div>
  );
}
