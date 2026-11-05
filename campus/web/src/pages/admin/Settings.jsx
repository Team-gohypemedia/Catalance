import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Lock, Plus, Save, Trash2 } from "lucide-react";
import { api } from "@/lib/api/client";
import { usePlatformConfig } from "@/lib/platform";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Skeleton, Textarea } from "@/components/ui/primitives";
import { Switch } from "@/components/ui/overlays";
import { ErrorState } from "@/components/ui/campus";
import { AdminHeader, IconBtn, Panel } from "@/components/admin/kit";

/**
 * Platform settings (spec §1.1 "editable from admin without code changes", §11, §19).
 * GET/PUT /api/admin/settings. Only changed keys are sent; every save is audited by the API.
 */

const FLAGS = [
  { key: "flags.aiTutor", label: "AI Tutor", description: "Chat tutor inside lessons. Not in the first release." },
  { key: "flags.gamification", label: "Points and leaderboards", description: "XP, coins, streaks, divisions and rankings." },
  { key: "flags.gigs", label: "Practice gigs", description: "Legacy Campus gigs and the earn ladder." },
  { key: "flags.wallet", label: "Campus wallet", description: "Legacy wallet and UPI withdrawals. Needs legal review." },
  { key: "flags.community", label: "Community Q&A", description: "Threads, replies and accepted answers." },
  { key: "flags.mentorBooking", label: "Mentor booking", description: "Book 1:1 sessions. Mentor profiles stay visible." },
  { key: "flags.cohorts", label: "Cohorts", description: "Study groups with a lead mentor." },
  { key: "flags.aspirants", label: "Aspirant mode", description: "Bridge tracks for government-exam aspirants." },
];

const LEVELS = [
  ["BEGINNER", "Beginner"],
  ["INTERMEDIATE", "Intermediate"],
  ["ADVANCED", "Advanced"],
  ["STANDARD", "Standard"],
];

const POLICIES = [
  ["TERMS", "Terms of use"],
  ["PRIVACY", "Privacy policy"],
  ["REFUND", "Refund and cancellation"],
  ["ASSESSMENT_POLICY", "Assessment policy"],
  ["PROJECT_POLICY", "Freelancer and project policy"],
];

const SPLIT_BASES = [
  ["CLIENT_PRICE_EX_TAX", "Client price excluding tax"],
  ["CLIENT_PRICE_INC_TAX", "Client price including tax"],
  ["NET_AFTER_FEES", "Net after payment fees"],
];

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const toNum = (v) => (v === "" || v === null || v === undefined ? "" : Number(v));

function NumberField({ id, label, hint, value, onChange, min, max, suffix }) {
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <div className="relative">
        <Input id={id} type="number" inputMode="numeric" min={min} max={max} value={value ?? ""} onChange={(e) => onChange(toNum(e.target.value))} className={suffix ? "pr-14" : ""} />
        {suffix && <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-subtle">{suffix}</span>}
      </div>
    </Field>
  );
}

export default function Settings() {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["admin-settings"], queryFn: () => api.get("/api/admin/settings") });
  const [draft, setDraft] = useState(null);
  const [policy, setPolicy] = useState("TERMS");
  const config = usePlatformConfig();

  useEffect(() => {
    if (data?.settings) setDraft(structuredClone(data.settings));
  }, [data]);

  const changed = useMemo(() => {
    if (!draft || !data?.settings) return {};
    return Object.fromEntries(Object.entries(draft).filter(([k, v]) => !same(v, data.settings[k])));
  }, [draft, data]);
  const dirty = Object.keys(changed).length;

  const save = useMutation({
    mutationFn: (patch) => api.put("/api/admin/settings", patch),
    onSuccess: (res) => {
      qc.setQueryData(["admin-settings"], res);
      qc.invalidateQueries({ queryKey: ["platform-config"] });
      toast.success("Settings saved", { description: `${dirty} ${dirty === 1 ? "change" : "changes"} recorded in the audit log.` });
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading || (!draft && !error)) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <div className="grid gap-6 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const set = (key, value) => setDraft((d) => ({ ...d, [key]: value }));
  const setIn = (key, sub, value) => setDraft((d) => ({ ...d, [key]: { ...(d[key] || {}), [sub]: value } }));
  const faqs = draft["content.faqs"] || [];
  const levels = draft["pricing.levelDefaults"] || {};
  const gst = Number(draft["pricing.gstPercent"]) || 0;

  const submit = (e) => {
    e.preventDefault();
    if (!dirty) return toast("Nothing to save.");
    if (faqs.some((f) => !f.q?.trim() || !f.a?.trim())) return toast.error("Each FAQ needs a question and an answer.");
    save.mutate(changed);
  };

  return (
    <form onSubmit={submit}>
      <AdminHeader
        title="Settings"
        description="Feature switches, prices, rules and public copy. Changes apply without a deploy."
        actions={
          <>
            {dirty > 0 && (
              <Button type="button" variant="ghost" onClick={() => setDraft(structuredClone(data.settings))}>
                Discard
              </Button>
            )}
            <Button type="submit" leftIcon={Save} loading={save.isPending} disabled={!dirty}>
              {dirty ? `Save ${dirty} ${dirty === 1 ? "change" : "changes"}` : "Saved"}
            </Button>
          </>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Panel title="Features" description="Off hides the area everywhere: pages, menus and API." flush className="lg:col-span-2">
          <div className="grid divide-y divide-line sm:grid-cols-2 sm:divide-y-0">
            {FLAGS.map((f) => (
              <div key={f.key} className="flex items-center justify-between gap-4 px-5 py-3.5 sm:border-b sm:border-line sm:odd:border-r sm:[&:nth-last-child(-n+2)]:border-b-0">
                <div className="min-w-0">
                  <label htmlFor={f.key} className="text-sm font-medium text-fg">
                    {f.label}
                  </label>
                  <p className="text-xs text-muted">{f.description}</p>
                </div>
                <Switch id={f.key} checked={Boolean(draft[f.key])} onCheckedChange={(v) => set(f.key, v)} />
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Course pricing" description="Defaults for new courses. Fees exclude GST." bodyClassName="space-y-5 p-5">
          <NumberField id="gst" label="GST" value={draft["pricing.gstPercent"]} onChange={(v) => set("pricing.gstPercent", v)} min={0} max={100} suffix="%" />
          <div className="space-y-3">
            {LEVELS.map(([key, label]) => (
              <div key={key} className="grid grid-cols-[1fr_1fr] gap-3 sm:grid-cols-[7rem_1fr_1fr] sm:items-end">
                <p className="col-span-2 text-sm font-medium sm:col-span-1 sm:pb-3">{label}</p>
                <NumberField id={`lv-${key}-price`} label="Fee" value={levels[key]?.priceINR} onChange={(v) => setIn("pricing.levelDefaults", key, { ...levels[key], priceINR: v })} min={0} suffix="₹" />
                <NumberField id={`lv-${key}-days`} label="Duration" value={levels[key]?.durationDays} onChange={(v) => setIn("pricing.levelDefaults", key, { ...levels[key], durationDays: v })} min={1} suffix="days" />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted">
            Beginner with GST: {formatINR(Math.round((levels.BEGINNER?.priceINR || 0) * (1 + gst / 100)))}.
          </p>
        </Panel>

        <Panel title="Payments" description="Spec default is 100% advance." bodyClassName="space-y-5 p-5">
          <NumberField id="advance" label="Advance payment" value={draft["payments.advancePercent"]} onChange={(v) => set("payments.advancePercent", v)} min={0} max={100} suffix="%" />
          <div className="flex items-center justify-between gap-4">
            <div>
              <label htmlFor="offline" className="text-sm font-medium">
                Offline payment
              </label>
              <p className="text-xs text-muted">UPI or bank transfer, confirmed by Finance.</p>
            </div>
            <Switch id="offline" checked={Boolean(draft["payments.offlineEnabled"])} onCheckedChange={(v) => set("payments.offlineEnabled", v)} />
          </div>
          <Field label="Offline instructions" htmlFor="offline-text" hint="Shown at checkout when offline payment is on.">
            <Textarea id="offline-text" value={draft["payments.offlineInstructions"] || ""} onChange={(e) => set("payments.offlineInstructions", e.target.value)} className="min-h-20" />
          </Field>
        </Panel>

        <Panel title="Assessment and verification" description="Defaults for new assessments." bodyClassName="grid gap-4 p-5 sm:grid-cols-2">
          <NumberField id="pass" label="Pass mark" value={draft["assessment.passScore"]} onChange={(v) => set("assessment.passScore", v)} min={1} max={100} suffix="/100" />
          <NumberField id="attempts" label="Attempts" hint="First try plus reassessments." value={draft["assessment.maxAttempts"]} onChange={(v) => set("assessment.maxAttempts", v)} min={1} max={10} />
          <NumberField id="window" label="Reassessment window" value={draft["assessment.reassessWindowDays"]} onChange={(v) => set("assessment.reassessWindowDays", v)} min={1} max={365} suffix="days" />
          <NumberField
            id="expiry"
            label="Verification expiry"
            hint="Leave empty for no expiry."
            value={draft["verification.expiryMonths"]}
            onChange={(v) => set("verification.expiryMonths", v === "" ? null : v)}
            min={1}
            max={120}
            suffix="months"
          />
          <NumberField id="offer-expiry" label="Project offer expiry" value={draft["projects.offerExpiryHours"]} onChange={(v) => set("projects.offerExpiryHours", v)} min={1} max={720} suffix="hours" />
        </Panel>

        <Panel
          title="Finance split"
          description="Internal. Never shown publicly or to students."
          action={<Lock className="size-4 text-subtle" aria-label="Internal" />}
          bodyClassName="grid gap-4 p-5 sm:grid-cols-2"
        >
          <NumberField id="share" label="Freelancer share" value={draft["finance.freelancerSharePercent"]} onChange={(v) => set("finance.freelancerSharePercent", v)} min={0} max={100} suffix="%" />
          <Field label="Calculated on" htmlFor="basis">
            <Select id="basis" value={draft["finance.splitBasis"]} onChange={(e) => set("finance.splitBasis", e.target.value)}>
              {SPLIT_BASES.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
          <p className="text-xs text-muted sm:col-span-2">Finance decides the basis (spec §19). Changes apply to new project offers only.</p>
        </Panel>

        <Panel title="Policies" description="Empty text uses the default copy. Bump the version when the meaning changes." bodyClassName="space-y-4 p-5" className="lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
            <Field label="Policy" htmlFor="policy">
              <Select id="policy" value={policy} onChange={(e) => setPolicy(e.target.value)}>
                {POLICIES.map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Version" htmlFor="policy-version">
              <Input id="policy-version" value={draft["policies.versions"]?.[policy] || ""} onChange={(e) => setIn("policies.versions", policy, e.target.value)} placeholder="2026-11-01" />
            </Field>
          </div>
          <Field label="Text (Markdown)" htmlFor="policy-text" hint="Must be reviewed by legal advisers before publishing.">
            <Textarea id="policy-text" value={draft["policies.text"]?.[policy] || ""} onChange={(e) => setIn("policies.text", policy, e.target.value)} className="min-h-56 font-mono text-[13px]" placeholder="Leave empty to show the default text." />
          </Field>
        </Panel>

        <Panel title="Homepage and notices" bodyClassName="space-y-4 p-5">
          <Field label="Hero headline" htmlFor="hero-title">
            <Input id="hero-title" value={draft["content.hero"]?.title || ""} maxLength={120} onChange={(e) => setIn("content.hero", "title", e.target.value)} />
          </Field>
          <Field label="Hero line" htmlFor="hero-sub">
            <Textarea id="hero-sub" value={draft["content.hero"]?.subtitle || ""} maxLength={300} onChange={(e) => setIn("content.hero", "subtitle", e.target.value)} className="min-h-20" />
          </Field>
          <Field label="No-guarantee notice" htmlFor="noguarantee" hint="Shown near the journey, on courses, results and offers.">
            <Textarea id="noguarantee" value={draft["content.noGuarantee"] || ""} maxLength={500} onChange={(e) => set("content.noGuarantee", e.target.value)} className="min-h-20" />
          </Field>
          <Field label="Support email" htmlFor="support-email">
            <Input id="support-email" type="email" value={draft["support.email"] || ""} onChange={(e) => set("support.email", e.target.value)} />
          </Field>
        </Panel>

        <Panel
          title="FAQs"
          description={faqs.length ? `${faqs.length} questions` : "Empty uses the default questions."}
          action={
            <Button type="button" size="sm" variant="outline" leftIcon={Plus} onClick={() => set("content.faqs", [...faqs, { q: "", a: "" }])}>
              Add
            </Button>
          }
          bodyClassName="space-y-4 p-5"
        >
          {faqs.length === 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">Showing the built-in FAQs.</p>
              <Button type="button" size="sm" variant="ghost" onClick={() => set("content.faqs", structuredClone(config.content.faqs))}>
                Edit the built-in ones
              </Button>
            </div>
          )}
          {faqs.map((f, i) => (
            <div key={i} className="space-y-2 rounded-xl border border-line p-3">
              <div className="flex items-start gap-2">
                <Input
                  aria-label={`Question ${i + 1}`}
                  value={f.q}
                  placeholder="Question"
                  onChange={(e) => set("content.faqs", faqs.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))}
                />
                <IconBtn label="Remove question" icon={Trash2} danger onClick={() => set("content.faqs", faqs.filter((_, j) => j !== i))} />
              </div>
              <Textarea
                aria-label={`Answer ${i + 1}`}
                value={f.a}
                placeholder="Answer"
                className="min-h-20"
                onChange={(e) => set("content.faqs", faqs.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))}
              />
            </div>
          ))}
        </Panel>
      </div>
    </form>
  );
}
