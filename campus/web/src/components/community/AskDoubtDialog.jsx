import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/primitives";
import { Dialog, DialogContent } from "@/components/ui/overlays";
import { MarkdownEditor } from "./MarkdownEditor";
import { TagInput } from "./TagInput";
import { TRACKS } from "./constants";

const normalizeTag = (t) =>
  t
    .trim()
    .toLowerCase()
    .replace(/^#/, "")
    .replace(/\s+/g, "-")
    .slice(0, 24);

const SUGGESTED = ["react", "javascript", "figma", "pricing", "clients", "sql", "canva", "career", "hinglish", "freelancing"];

/** "Ask a doubt" composer in a dialog. Controlled via open/onOpenChange. */
export function AskDoubtDialog({ open, onOpenChange }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: "", body: "", tags: [], trackId: "" });
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const create = useMutation({
    mutationFn: () => api.post("/api/threads", { ...form, trackId: form.trackId || null }),
    onSuccess: (thread) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      toast.success("Doubt posted. Helpers have been notified.");
      setForm({ title: "", body: "", tags: [], trackId: "" });
      onOpenChange(false);
      navigate(`/app/community/${thread.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const titleOk = form.title.trim().length >= 8;
  const bodyOk = form.body.trim().length >= 10;
  const suggestions = SUGGESTED.filter((s) => !form.tags.includes(s)).slice(0, 6);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" title="Ask a doubt" description="Code, clients, pricing or career. Seniors and mentors answer.">
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (titleOk && bodyOk) create.mutate();
          }}
        >
          <Field label="Title" htmlFor="ask-title" hint="One line that says what's stuck, e.g. “useEffect running twice on page load”.">
            <Input id="ask-title" value={form.title} maxLength={160} onChange={(e) => set("title")(e.target.value)} placeholder="What do you need help with?" autoFocus />
          </Field>
          <Field label="Details" htmlFor="ask-body">
            <MarkdownEditor
              id="ask-body"
              value={form.body}
              onChange={set("body")}
              placeholder={"What did you try? Paste code or the client's message.\n\n```js\n// code here\n```"}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Track" htmlFor="ask-track">
              <Select id="ask-track" value={form.trackId} onChange={(e) => set("trackId")(e.target.value)}>
                <option value="">General or career</option>
                {TRACKS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tags" htmlFor="ask-tags" hint="Up to 5. Press Enter to add.">
              <TagInput id="ask-tags" value={form.tags} onChange={set("tags")} normalize={normalizeTag} placeholder="react, pricing" />
            </Field>
          </div>
          {suggestions.length > 0 && form.tags.length < 5 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs text-subtle">Suggested</span>
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => form.tags.length < 5 && set("tags")([...form.tags, s])}
                  className="cursor-pointer rounded-full border border-line px-2.5 py-0.5 text-xs text-muted transition-colors hover:border-line-strong hover:text-fg"
                >
                  #{s}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-start gap-3 rounded-xl bg-surface-2 px-4 py-3 text-sm text-muted">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>Good doubts get answered faster: share what you tried, the exact error, and what you expected.</p>
          </div>
          <div className="flex justify-end gap-2 border-t border-line pt-5">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending} disabled={!titleOk || !bodyOk}>
              Post doubt
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
