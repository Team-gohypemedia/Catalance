import { useState } from "react";
import { Bold, Code2, List, SquareCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { Markdown } from "./Markdown";

/** Markdown textarea with Write / Preview tabs and a small toolbar. */
export function MarkdownEditor({ id, value, onChange, placeholder, minRows = "min-h-40", className, autoFocus }) {
  const [tab, setTab] = useState("write");

  const wrap = (before, after = before, fallback = "text") => {
    const el = document.getElementById(id);
    if (!el) return onChange(`${value}${before}${fallback}${after}`);
    const { selectionStart: s, selectionEnd: e } = el;
    const sel = value.slice(s, e) || fallback;
    const next = value.slice(0, s) + before + sel + after + value.slice(e);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + before.length, s + before.length + sel.length);
    });
  };

  const tabBtn = (key, label) => (
    <button
      type="button"
      role="tab"
      onClick={() => setTab(key)}
      aria-selected={tab === key}
      className={cn(
        "relative -mb-px cursor-pointer border-b-2 px-1 py-2.5 text-sm font-medium transition-colors",
        tab === key ? "border-primary text-fg" : "border-transparent text-muted hover:text-fg",
      )}
    >
      {label}
    </button>
  );

  return (
    <div className={cn("overflow-hidden rounded-xl border border-line bg-surface transition-colors focus-within:border-line-strong", className)}>
      <div className="flex items-center justify-between gap-2 border-b border-line px-3">
        <div className="flex items-center gap-4" role="tablist" aria-label="Editor mode">
          {tabBtn("write", "Write")}
          {tabBtn("preview", "Preview")}
        </div>
        {tab === "write" && (
          <div className="flex items-center gap-0.5">
            <ToolBtn label="Bold" onClick={() => wrap("**")}>
              <Bold className="size-3.5" />
            </ToolBtn>
            <ToolBtn label="Inline code" onClick={() => wrap("`", "`", "code")}>
              <Code2 className="size-3.5" />
            </ToolBtn>
            <ToolBtn label="Code block" onClick={() => wrap("\n```js\n", "\n```\n", "// your code")}>
              <SquareCode className="size-3.5" />
            </ToolBtn>
            <ToolBtn label="Bullet list" onClick={() => wrap("\n- ", "", "point")}>
              <List className="size-3.5" />
            </ToolBtn>
          </div>
        )}
      </div>
      {tab === "write" ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={cn("block w-full resize-y bg-transparent px-4 py-3 text-sm leading-relaxed text-fg outline-none placeholder:text-subtle", minRows)}
        />
      ) : (
        <div className={cn("px-4 py-3", minRows)}>
          {value.trim() ? <Markdown>{value}</Markdown> : <p className="text-sm text-subtle">Nothing to preview yet.</p>}
        </div>
      )}
      <p className="border-t border-line px-4 py-2 text-[11px] text-subtle">Markdown supported. Wrap code in ``` for a code block.</p>
    </div>
  );
}

function ToolBtn({ label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex size-7 cursor-pointer items-center justify-center rounded-md text-subtle transition-colors hover:bg-surface-2 hover:text-fg"
    >
      {children}
    </button>
  );
}
