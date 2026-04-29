import ReactMarkdown from "react-markdown";

import { cn } from "@/shared/lib/utils";

const markdownClassName =
  "prose prose-invert max-w-none text-base prose-headings:scroll-mt-28 prose-headings:font-semibold prose-headings:text-white prose-h1:mb-6 prose-h1:text-4xl prose-h1:leading-tight prose-h2:mt-12 prose-h2:mb-4 prose-h2:text-3xl prose-h3:mt-10 prose-h3:mb-3 prose-h3:text-2xl prose-h4:mt-8 prose-h4:mb-3 prose-h4:text-xl prose-p:my-5 prose-p:text-slate-300 prose-p:leading-8 prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6 prose-ol:my-6 prose-ol:list-decimal prose-ol:pl-6 prose-li:my-2 prose-li:pl-1 prose-li:text-slate-300 prose-li:leading-7 prose-a:font-medium prose-a:text-[#ffc800] prose-a:no-underline hover:prose-a:text-[#ffd84d] prose-strong:text-white prose-blockquote:border-l-[#ffc800] prose-blockquote:bg-white/[0.03] prose-blockquote:py-1 prose-blockquote:pr-4 prose-blockquote:text-slate-300 prose-hr:my-10 prose-hr:border-white/10 prose-img:rounded-3xl prose-img:border prose-img:border-white/10 prose-img:shadow-[0_18px_60px_rgba(0,0,0,0.35)] prose-pre:overflow-x-auto prose-pre:rounded-3xl prose-pre:border prose-pre:border-white/10 prose-pre:bg-[#050505] prose-pre:px-5 prose-pre:py-4 prose-pre:text-sm prose-code:rounded prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[0.95em] prose-code:text-[#ffc800] prose-code:before:content-none prose-code:after:content-none";

const BlogMarkdown = ({ content = "", className = "" }) => (
  <div className={cn(markdownClassName, className)}>
    <ReactMarkdown
      components={{
        a: ({ node: _node, ...props }) => (
          <a
            {...props}
            target="_blank"
            rel="noreferrer"
          />
        ),
        img: ({ node: _node, alt, src, ...props }) => (
          <img
            {...props}
            src={src}
            alt={alt || "Blog image"}
            loading="lazy"
          />
        ),
        code: ({ node: _node, inline, className: codeClassName, children, ...props }) =>
          inline ? (
            <code {...props} className={codeClassName}>
              {children}
            </code>
          ) : (
            <code {...props} className={cn("block min-w-full", codeClassName)}>
              {children}
            </code>
          )
      }}
    >
      {content}
    </ReactMarkdown>
  </div>
);

export default BlogMarkdown;
