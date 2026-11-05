import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

const components = {
  a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
};

/** Rendered markdown for threads, replies and posts. */
export function Markdown({ children, className }) {
  return (
    <div
      className={cn(
        "prose-campus min-w-0 text-[15px] leading-7 break-words text-fg/90 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_pre]:text-[13px] [&_pre]:leading-6",
        className,
      )}
    >
      <ReactMarkdown components={components}>{children || ""}</ReactMarkdown>
    </div>
  );
}
