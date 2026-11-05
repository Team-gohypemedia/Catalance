import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

const components = {
  a: ({ href, children }) => (
    <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
      {children}
    </a>
  ),
};

/**
 * Markdown rendered in the Campus prose style, refined for long-form reading:
 * medium-weight headings, calm light code blocks and a quiet blockquote.
 */
const READER = [
  "[&_h1]:font-medium [&_h1]:tracking-tight",
  "[&_h2]:font-medium [&_h2]:tracking-tight [&_h2]:text-[1.375rem] [&_h2]:mt-[1.8em]",
  "[&_h3]:font-medium [&_h3]:tracking-tight",
  "[&_strong]:font-semibold",
  "[&_pre]:max-w-full [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-line [&_pre]:bg-surface-2 [&_pre]:text-fg [&_pre]:text-[0.84em] [&_pre]:leading-relaxed",
  "[&_:not(pre)>code]:border [&_:not(pre)>code]:border-line [&_:not(pre)>code]:bg-surface-2",
  "[&_blockquote]:rounded-r-xl [&_blockquote]:border-l-2 [&_blockquote]:bg-surface-2/70 [&_blockquote]:px-5 [&_blockquote]:py-4",
  "[&_li::marker]:text-subtle",
  "[&_hr]:my-8 [&_hr]:border-line",
].join(" ");

export function Markdown({ children, className }) {
  return (
    <div className={cn("prose-campus min-w-0 break-words", READER, className)}>
      <ReactMarkdown components={components}>{children || ""}</ReactMarkdown>
    </div>
  );
}

/** Split VIDEO lesson markdown into key points and the rest (transcript/notes). */
export function splitVideoContent(md = "") {
  const kp = md.match(/##\s*Key points\s*\n([\s\S]*?)(?=\n##\s|$)/i);
  const points = kp
    ? kp[1]
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => /^[-*] /.test(l))
        .map((l) => l.replace(/^[-*] /, ""))
    : [];
  const transcriptMatch = md.match(/##\s*Transcript\s*\n([\s\S]*)$/i);
  const transcript = transcriptMatch ? transcriptMatch[1].trim() : kp ? md.replace(kp[0], "").trim() : md;
  return { points, transcript };
}
