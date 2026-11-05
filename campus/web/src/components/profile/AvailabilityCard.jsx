import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { api } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, Field, Input, Skeleton } from "@/components/ui/primitives";
import { Switch } from "@/components/ui/overlays";
import { ErrorState } from "@/components/ui/campus";
import { TagInput } from "@/components/community/TagInput";
import { DAYS } from "@/components/projects/meta";

const EMPTY = { openToProjects: false, hoursPerWeek: 0, days: [], preferredTaskTypes: [], tools: [], communication: "" };
const TASK_SUGGESTIONS = ["Landing pages", "Bug fixes", "App screens", "Social posts", "Blog posts", "Video edits", "Logos", "Data cleanup"];
const TOOL_SUGGESTIONS = ["Figma", "React", "WordPress", "Canva", "Premiere Pro", "Excel", "Google Docs", "Illustrator"];

const fromData = (a) => ({ ...EMPTY, ...(a || {}), hoursPerWeek: String(a?.hoursPerWeek ?? 0) });

/**
 * Availability for project matching (spec §4.2 Availability, §13.2): PMs see this in talent search.
 * GET/PATCH /api/me/availability. Anchor: /app/profile#availability.
 */
export function AvailabilityCard({ className }) {
  const { setUser } = useAuth();
  const qc = useQueryClient();
  const location = useLocation();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["my-availability"], queryFn: () => api.get("/api/me/availability") });
  const [form, setForm] = useState(EMPTY);
  useEffect(() => {
    if (data) setForm(fromData(data.availability));
  }, [data]);
  useEffect(() => {
    if (location.hash !== "#availability") return;
    const t = setTimeout(() => document.getElementById("availability")?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    return () => clearTimeout(t);
  }, [location.hash]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const hours = Number(form.hoursPerWeek);
  const hoursError = !Number.isInteger(hours) || hours < 0 || hours > 60 ? "Enter 0 to 60." : null;
  const dirty = data && JSON.stringify(form) !== JSON.stringify(fromData(data.availability));

  const save = useMutation({
    mutationFn: () =>
      api.patch("/api/me/availability", {
        openToProjects: form.openToProjects,
        hoursPerWeek: hours,
        days: form.days,
        preferredTaskTypes: form.preferredTaskTypes,
        tools: form.tools,
        communication: form.communication.trim(),
      }),
    onSuccess: ({ user }) => {
      if (user) setUser(user);
      qc.setQueryData(["my-availability"], { availability: user?.availability || { ...form, hoursPerWeek: hours } });
      toast.success("Availability saved");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Card id="availability" className={cn("scroll-mt-24", className)}>
      <CardContent className="space-y-5 p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-medium tracking-tight">Availability for projects</h2>
            <p className="mt-1 text-sm text-muted">Project managers see this when they match verified students to work.</p>
          </div>
          {data && <Switch checked={form.openToProjects} onCheckedChange={set("openToProjects")} aria-label="Open to projects" />}
        </div>

        {isLoading ? (
          <Skeleton className="h-40" />
        ) : error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : (
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!hoursError) save.mutate();
            }}
          >
            <p className={cn("rounded-xl px-4 py-2.5 text-sm", form.openToProjects ? "bg-success-soft text-success" : "bg-surface-2/70 text-muted")}>
              {form.openToProjects ? "Open to projects" : "Not taking projects right now"}
            </p>
            <div className="grid gap-4 sm:grid-cols-[160px_minmax(0,1fr)]">
              <Field label="Hours per week" htmlFor="av-hours" error={hoursError}>
                <Input id="av-hours" type="number" inputMode="numeric" min={0} max={60} value={form.hoursPerWeek} onChange={(e) => set("hoursPerWeek")(e.target.value)} />
              </Field>
              <fieldset>
                <legend className="mb-1.5 text-sm font-medium text-fg">Days</legend>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS.map(([key, label]) => {
                    const on = form.days.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        aria-pressed={on}
                        onClick={() => set("days")(on ? form.days.filter((d) => d !== key) : [...form.days, key])}
                        className={cn(
                          "h-9 min-w-11 cursor-pointer rounded-full border px-3 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none",
                          on ? "border-primary bg-primary-soft text-primary" : "border-line text-muted hover:border-line-strong hover:text-fg",
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </div>
            <Field label="Preferred task types" htmlFor="av-tasks">
              <TagInput id="av-tasks" value={form.preferredTaskTypes} onChange={set("preferredTaskTypes")} max={10} suggestions={TASK_SUGGESTIONS} placeholder="e.g. Landing pages" />
            </Field>
            <Field label="Tools you use" htmlFor="av-tools">
              <TagInput id="av-tools" value={form.tools} onChange={set("tools")} max={20} suggestions={TOOL_SUGGESTIONS} placeholder="e.g. Figma" />
            </Field>
            <Field label="How to reach you" htmlFor="av-comm" hint="Channel and best time. Your contact details stay private.">
              <Input id="av-comm" maxLength={200} value={form.communication} onChange={(e) => set("communication")(e.target.value)} placeholder="e.g. WhatsApp, evenings after 6 pm" />
            </Field>
            <div className="flex justify-end">
              <Button type="submit" leftIcon={Save} loading={save.isPending} disabled={!dirty || !!hoursError}>
                Save availability
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default AvailabilityCard;
