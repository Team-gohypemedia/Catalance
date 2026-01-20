import X from "lucide-react/dist/esm/icons/x";
import FileText from "lucide-react/dist/esm/icons/file-text";

const MarkdownContent = ({ content }) => {
  if (!content) {
    return <p className="text-sm text-muted-foreground">No proposal generated yet.</p>;
  }

  return (
    <div className="space-y-1 text-sm leading-6 text-foreground">
      {content.split("\n").map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={index} className="h-2" />;
        }

        if (/^#{3}\s+/.test(trimmed)) {
          return (
            <h4 key={index} className="text-sm font-semibold text-primary mt-3">
              {trimmed.replace(/^#{3}\s+/, "")}
            </h4>
          );
        }

        if (/^#{2}\s+/.test(trimmed)) {
          return (
            <h3 key={index} className="text-base font-semibold text-primary mt-4">
              {trimmed.replace(/^#{2}\s+/, "")}
            </h3>
          );
        }

        if (/^#\s+/.test(trimmed)) {
          return (
            <h2 key={index} className="text-lg font-bold text-foreground mt-2">
              {trimmed.replace(/^#\s+/, "")}
            </h2>
          );
        }

        if (/^[-*]\s+/.test(trimmed)) {
          return (
            <div key={index} className="flex items-start gap-2">
              <span className="text-muted-foreground">-</span>
              <span>{trimmed.replace(/^[-*]\s+/, "")}</span>
            </div>
          );
        }

        if (/^\d+\.\s+/.test(trimmed)) {
          const value = trimmed.replace(/^\d+\.\s+/, "");
          return (
            <div key={index} className="flex items-start gap-2">
              <span className="text-muted-foreground">{trimmed.match(/^\d+\./)?.[0]}</span>
              <span>{value}</span>
            </div>
          );
        }

        return <p key={index}>{trimmed}</p>;
      })}
    </div>
  );
};

export function ProposalSidebar({
  proposal,
  isOpen,
  onClose,
  embedded = false,
  inline = false
}) {
  if (!proposal) return null;

  const content = (
    <div className="h-full flex flex-col bg-zinc-950">
      <div className="p-5 border-b border-white/10 bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="size-4 text-primary" />
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                Proposal
              </span>
            </div>
            <h2 className="text-lg font-bold text-foreground">Project Proposal</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Generated from your chat details
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:hsl(var(--primary))_transparent]">
        <div className="p-5">
          <MarkdownContent content={proposal} />
        </div>
      </div>
    </div>
  );

  if (inline) {
    return content;
  }

  return (
    <div
      className={`fixed top-0 right-0 h-screen w-full sm:w-[460px] bg-zinc-950 border-l border-white/10 shadow-2xl transform transition-transform duration-300 ease-out ${
        embedded ? "z-30" : "z-50"
      } ${isOpen ? "translate-x-0" : "translate-x-full"}`}
    >
      {content}
    </div>
  );
}
