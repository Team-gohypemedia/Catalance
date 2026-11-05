import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Chip-style tag input. Enter or comma adds, Backspace removes the last. */
export function TagInput({ id, value = [], onChange, placeholder = "Add a tag", max = 5, normalize = (t) => t.trim(), suggestions = [], className }) {
  const [draft, setDraft] = useState("");

  const add = (raw) => {
    const t = normalize(raw);
    if (!t || value.includes(t) || value.length >= max) return;
    onChange([...value, t]);
    setDraft("");
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  const remaining = suggestions.filter((s) => !value.includes(s)).slice(0, 8);

  return (
    <div className={className}>
      <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-line bg-surface px-2.5 py-1.5 focus-within:border-primary focus-within:ring-4 focus-within:ring-[var(--ring)] transition-colors">
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium">
            {t}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} aria-label={`Remove ${t}`} className="cursor-pointer rounded text-muted hover:text-fg">
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => draft && add(draft)}
          disabled={value.length >= max}
          placeholder={value.length >= max ? `Max ${max}` : placeholder}
          className="min-w-24 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-subtle"
        />
      </div>
      {remaining.length > 0 && value.length < max && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {remaining.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className={cn("cursor-pointer rounded-full border border-line px-2.5 py-0.5 text-xs text-muted hover:border-line-strong hover:text-fg")}
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
