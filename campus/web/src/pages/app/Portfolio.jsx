import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Copy, ExternalLink, FolderKanban, Plus, Share2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input, Skeleton, Textarea } from "@/components/ui/primitives";
import { Dialog, DialogContent, Tabs, TabsList, TabsTrigger } from "@/components/ui/overlays";
import { EmptyState, ErrorState, PageHeader } from "@/components/ui/campus";
import { PortfolioCard } from "@/components/earn/EarnUI";

const empty = { title: "", description: "", link: "", skills: "" };

function ItemDialog({ open, onOpenChange, item }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(() => (item ? { title: item.title, description: item.description || "", link: item.link || "", skills: (item.skills || []).join(", ") } : empty));
  const [touched, setTouched] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const titleError = form.title.trim().length < 3 ? "Give it a title (3+ characters)" : null;
  const linkError = form.link.trim() && !/^https?:\/\/\S+\.\S+/.test(form.link.trim()) ? "Start the link with https://" : null;

  const save = useMutation({
    mutationFn: () => {
      const body = { title: form.title.trim(), description: form.description.trim(), link: form.link.trim(), skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean) };
      return item ? api.patch(`/api/me/portfolio/${item.id}`, body) : api.post("/api/me/portfolio", body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portfolio"] });
      qc.invalidateQueries({ queryKey: ["passport"] });
      toast.success(item ? "Project updated" : "Added to your portfolio");
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={item ? "Edit project" : "Add a personal project"} description="Side projects, college work, freelance done outside Campus. It shows as self-reported until a mentor verifies similar work.">
        <form
          className="space-y-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            setTouched(true);
            if (!titleError && !linkError) save.mutate();
          }}
        >
          <Field label="Title" htmlFor="pf-title" error={touched ? titleError : null}>
            <Input id="pf-title" value={form.title} onChange={set("title")} placeholder="Hostel mess menu voting app" maxLength={120} autoFocus />
          </Field>
          <Field label="What did you build?" htmlFor="pf-desc" hint="The problem, what you did, and a result if you have one.">
            <Textarea id="pf-desc" value={form.description} onChange={set("description")} rows={4} maxLength={1000} placeholder="180 hostel-mates vote every Sunday…" />
          </Field>
          <Field label="Link" htmlFor="pf-link" error={linkError} hint="GitHub, Behance, Drive, live site…">
            <Input id="pf-link" type="url" value={form.link} onChange={set("link")} placeholder="https://" />
          </Field>
          <Field label="Skills" htmlFor="pf-skills" hint="Comma separated, up to 8">
            <Input id="pf-skills" value={form.skills} onChange={set("skills")} placeholder="React, Firebase, Figma" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" loading={save.isPending}>{item ? "Save changes" : "Add project"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Completeness({ items, user }) {
  const verified = items.filter((i) => i.verified).length;
  const checks = [
    { label: "3+ verified pieces", done: verified >= 3 },
    { label: "A client gig", done: items.some((i) => i.source === "GIG") },
    { label: "A mentor-reviewed assignment", done: items.some((i) => i.source === "ASSIGNMENT") },
    { label: "A personal project", done: items.some((i) => i.source === "PERSONAL") },
    { label: "Links on every piece", done: items.length > 0 && items.every((i) => i.link) },
    { label: "Headline on your profile", done: !!user?.headline },
  ];
  const pct = Math.round((checks.filter((c) => c.done).length / checks.length) * 100);
  const R = 34;
  const C = 2 * Math.PI * R;
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 80 80" className="size-16 shrink-0 -rotate-90" aria-hidden="true">
          <circle cx="40" cy="40" r={R} fill="none" stroke="var(--surface-2)" strokeWidth="5" />
          <circle cx="40" cy="40" r={R} fill="none" stroke="var(--primary)" strokeWidth="5" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} style={{ transition: "stroke-dashoffset 1s ease-out" }} />
        </svg>
        <div>
          <p className="text-sm text-muted">Passport strength</p>
          <p className="text-2xl font-medium tracking-tight tabular-nums">{pct}%</p>
          <p className="text-xs text-subtle">{pct === 100 ? "Ready for recruiters" : "Complete passports get shortlisted 3x more"}</p>
        </div>
      </div>
      <ul className="mt-5 space-y-2.5 border-t border-line pt-4">
        {checks.map((c) => (
          <li key={c.label} className={cn("flex items-center gap-2 text-sm", c.done ? "text-fg" : "text-muted")}>
            <span className={cn("flex size-4 shrink-0 items-center justify-center rounded-full", c.done ? "bg-primary text-primary-fg" : "border border-line-strong")}>{c.done && <Check className="size-2.5" strokeWidth={3} />}</span>
            {c.label}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Portfolio() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["portfolio"], queryFn: () => api.get("/api/me/portfolio") });
  const [dialog, setDialog] = useState({ open: false, item: null, key: 0 });
  const [toDelete, setToDelete] = useState(null);
  const [filter, setFilter] = useState("all");
  const passportUrl = `${window.location.origin}/u/${user?.username}`;

  const del = useMutation({
    mutationFn: (id) => api.delete(`/api/me/portfolio/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portfolio"] });
      toast.success("Project removed");
      setToDelete(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: `${user?.name} · Skill Passport`, url: passportUrl });
      else {
        await navigator.clipboard.writeText(passportUrl);
        toast.success("Passport link copied");
      }
    } catch {
      /* share cancelled */
    }
  };

  const items = data || [];
  const shown = items.filter((i) => filter === "all" || (filter === "verified" ? i.verified : !i.verified));
  const openNew = () => setDialog((d) => ({ open: true, item: null, key: d.key + 1 }));

  return (
    <div>
      <PageHeader
        eyebrow="Rank · Proof portfolio"
        title={<>Proof, not <em className="accent">PDFs</em></>}
        description="Verified work from mentor-reviewed assignments and approved client gigs. This is what companies see on your Skill Passport."
        actions={
          <>
            <Button variant="brandOutline" leftIcon={ExternalLink} to={`/u/${user?.username}`}>View passport</Button>
            <Button leftIcon={Plus} onClick={openNew}>Add project</Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="min-w-0">
          <Tabs value={filter} onValueChange={setFilter} className="mb-5">
            <TabsList>
              <TabsTrigger value="all">All <span className="ml-1 opacity-60">{items.length}</span></TabsTrigger>
              <TabsTrigger value="verified">Verified <span className="ml-1 opacity-60">{items.filter((i) => i.verified).length}</span></TabsTrigger>
              <TabsTrigger value="personal">Personal <span className="ml-1 opacity-60">{items.filter((i) => !i.verified).length}</span></TabsTrigger>
            </TabsList>
          </Tabs>
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-60 rounded-2xl" />)}</div>
          ) : error ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : !shown.length ? (
            <EmptyState
              icon={FolderKanban}
              title={items.length ? "Nothing in this view" : "Your portfolio is empty"}
              description="Assignments reviewed by mentors and approved gigs land here automatically. You can also add personal projects."
              action={<Button leftIcon={Plus} onClick={openNew}>Add a project</Button>}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {shown.map((item, i) => (
                <PortfolioCard key={item.id} item={item} index={i} onEdit={(it) => setDialog((d) => ({ open: true, item: it, key: d.key + 1 }))} onDelete={setToDelete} />
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
            <div>
              <p className="text-sm text-muted">Your public Skill Passport</p>
              <p className="mt-2 truncate rounded-lg bg-surface-2 px-3 py-2 text-sm text-fg">{passportUrl.replace(/^https?:\/\//, "")}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" leftIcon={Share2} onClick={share} className="flex-1">Share</Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={Copy}
                  onClick={() => navigator.clipboard?.writeText(passportUrl).then(() => toast.success("Link copied"), () => toast.error("Couldn't copy"))}
                >
                  Copy
                </Button>
              </div>
              <p className="mt-3 text-xs text-subtle">Add it to your resume, LinkedIn and Instagram bio.</p>
            </div>
          </section>
          {!isLoading && !error && <Completeness items={items} user={user} />}
        </aside>
      </div>

      {dialog.open && <ItemDialog key={dialog.key} open={dialog.open} item={dialog.item} onOpenChange={(open) => setDialog((d) => ({ ...d, open }))} />}

      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent title="Remove this project?" description={toDelete?.title} size="sm">
          <p className="text-sm text-muted">It will disappear from your portfolio and public passport.</p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setToDelete(null)}>Keep it</Button>
            <Button variant="danger" loading={del.isPending} onClick={() => del.mutate(toDelete.id)}>Remove</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
