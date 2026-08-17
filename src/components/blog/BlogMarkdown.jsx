import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import Check from "lucide-react/dist/esm/icons/check";
import Copy from "lucide-react/dist/esm/icons/copy";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import { cn } from "@/shared/lib/utils";

// Preprocessor to fix common markdown typos & syntax quirks from authors
const sanitizeMarkdown = (raw = "") => {
  if (!raw || typeof raw !== "string") return "";

  let processed = raw;

  // Fix nested double-bracket link syntax like [[text]](url) or [[text]] -> [text](url)
  processed = processed.replace(/\[\[([^\]]+)\]\]\(([^)]+)\)/g, "[$1]($2)");
  processed = processed.replace(/\[\[([^\]]+)\]\]/g, "$1");

  // Fix duplicate link brackets like [[link](url)](url)
  processed = processed.replace(/\[\[([^\]]+)\]\(([^)]+)\)\]\(([^)]+)\)/g, "[$1]($2)");

  // Ensure headings starting with # have a trailing space (e.g. #Heading -> # Heading)
  processed = processed.replace(/^(#{1,6})([^\s#])/gm, "$1 $2");

  return processed;
};

// Code block with 1-click copy
const CodeBlock = ({ children, className }) => {
  const [copied, setCopied] = useState(false);
  const codeText = String(children || "").replace(/\n$/, "");

  const handleCopy = () => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-6 overflow-hidden rounded-2xl border border-border bg-[#0d1117] text-slate-100 shadow-md">
      <div className="flex items-center justify-between border-b border-border/40 bg-white/[0.04] px-4 py-2 text-[11px] text-slate-400">
        <span className="font-mono">{className ? className.replace("language-", "") : "code"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs sm:text-sm font-mono leading-relaxed">
        <code>{children}</code>
      </pre>
    </div>
  );
};

const headingToId = (children) => {
  const text = Array.isArray(children)
    ? children.map((c) => (typeof c === "string" ? c : "")).join("")
    : String(children || "");
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const BlogMarkdown = ({ content = "", className = "" }) => {
  const sanitized = sanitizeMarkdown(content);

  return (
    <div className={cn("text-foreground space-y-4 max-w-none text-base", className)}>
      <ReactMarkdown
        components={{
          h1: ({ children, ...props }) => (
            <h1
              {...props}
              id={headingToId(children)}
              className="scroll-mt-28 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mt-8 mb-4 border-b border-border/50 pb-3"
            >
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2
              {...props}
              id={headingToId(children)}
              className="scroll-mt-28 text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-10 mb-4 border-b border-border/40 pb-2"
            >
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3
              {...props}
              id={headingToId(children)}
              className="scroll-mt-28 text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-8 mb-3"
            >
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4
              {...props}
              id={headingToId(children)}
              className="scroll-mt-28 text-lg sm:text-xl font-semibold tracking-tight text-foreground mt-6 mb-2"
            >
              {children}
            </h4>
          ),
          p: ({ children, ...props }) => (
            <p
              {...props}
              className="text-base sm:text-[17px] leading-relaxed text-muted-foreground dark:text-slate-300 my-4"
            >
              {children}
            </p>
          ),
          a: ({ href, children, ...props }) => (
            <a
              {...props}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 font-semibold text-primary underline underline-offset-4 decoration-primary/40 hover:decoration-primary hover:text-primary/90 transition"
            >
              <span>{children}</span>
              <ExternalLink className="h-3 w-3 inline opacity-70 ml-0.5" />
            </a>
          ),
          strong: ({ children, ...props }) => (
            <strong {...props} className="font-bold text-foreground">
              {children}
            </strong>
          ),
          em: ({ children, ...props }) => (
            <em {...props} className="italic text-foreground/90">
              {children}
            </em>
          ),
          ul: ({ children, ...props }) => (
            <ul {...props} className="my-5 ml-6 list-disc space-y-2 text-base leading-relaxed text-muted-foreground dark:text-slate-300">
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol {...props} className="my-5 ml-6 list-decimal space-y-2 text-base leading-relaxed text-muted-foreground dark:text-slate-300">
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li {...props} className="pl-1 leading-relaxed">
              {children}
            </li>
          ),
          blockquote: ({ children, ...props }) => (
            <blockquote
              {...props}
              className="my-6 border-l-4 border-primary bg-primary/5 dark:bg-white/[0.03] px-5 py-4 rounded-r-2xl text-foreground font-medium italic"
            >
              {children}
            </blockquote>
          ),
          hr: ({ ...props }) => <hr {...props} className="my-8 border-border" />,
          img: ({ src, alt, ...props }) => (
            <div className="my-8 overflow-hidden rounded-3xl border border-border bg-muted/30 shadow-sm">
              <img
                {...props}
                src={src}
                alt={alt || "Blog visual"}
                className="h-auto w-full object-cover"
                loading="lazy"
              />
              {alt && <p className="p-3 text-center text-xs text-muted-foreground italic border-t border-border/50">{alt}</p>}
            </div>
          ),
          code: ({ node: _node, inline, className: codeClassName, children, ...props }) => {
            if (inline) {
              return (
                <code
                  {...props}
                  className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs sm:text-sm font-medium text-primary dark:bg-white/10"
                >
                  {children}
                </code>
              );
            }
            return <CodeBlock className={codeClassName}>{children}</CodeBlock>;
          },
          table: ({ children, ...props }) => (
            <div className="my-6 overflow-x-auto rounded-2xl border border-border">
              <table {...props} className="w-full text-left text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead {...props} className="bg-muted/50 font-semibold border-b border-border">
              {children}
            </thead>
          ),
          tbody: ({ children, ...props }) => (
            <tbody {...props} className="divide-y divide-border">
              {children}
            </tbody>
          ),
          tr: ({ children, ...props }) => <tr {...props} className="hover:bg-muted/20">{children}</tr>,
          th: ({ children, ...props }) => <th {...props} className="p-3 text-xs font-bold uppercase">{children}</th>,
          td: ({ children, ...props }) => <td {...props} className="p-3 text-xs sm:text-sm">{children}</td>
        }}
      >
        {sanitized}
      </ReactMarkdown>
    </div>
  );
};

export default BlogMarkdown;
