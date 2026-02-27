import { memo } from "react";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import DollarSign from "lucide-react/dist/esm/icons/dollar-sign";
import Edit2 from "lucide-react/dist/esm/icons/edit-2";
import Eye from "lucide-react/dist/esm/icons/eye";
import X from "lucide-react/dist/esm/icons/x";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const parseProposalSectionsForView = (proposal) => {
  const rawContent = proposal?.summary || proposal?.content || "";
  const cleanContent = rawContent
    .replace(/```markdown\n?/gi, "")
    .replace(/```\n?/g, "")
    .trim();

  const sections = [];
  const lines = cleanContent.split("\n");
  let currentSection = { title: "Overview", items: [], content: "" };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const headerMatch = trimmed.match(
      /^(?:\*{1,2})?([^:*]+?)(?:\*{1,2})?:\s*(.*)$/,
    );
    const isListItem = trimmed.startsWith("- ") || trimmed.startsWith("* ");
    const sectionHeaders = [
      "project overview",
      "primary objectives",
      "features",
      "deliverables",
      "tech stack",
      "technology",
      "timeline",
      "budget",
      "scope",
      "preferences",
      "client name",
      "business name",
      "service type",
      "platform",
      "design",
      "payment",
      "milestones",
      "requirements",
      "additional notes",
    ];

    if (headerMatch && !isListItem) {
      const key = headerMatch[1].toLowerCase().trim();
      const value = headerMatch[2].trim();

      if (["client name", "business name", "service type"].includes(key)) return;

      if (sectionHeaders.some((header) => key.includes(header))) {
        if (
          currentSection.title !== "Overview" ||
          currentSection.items.length > 0 ||
          currentSection.content
        ) {
          sections.push({ ...currentSection });
        }
        currentSection = {
          title: headerMatch[1].trim(),
          items: [],
          content: value,
        };
      } else if (value) {
        currentSection.items.push({ key: headerMatch[1].trim(), value });
      }
      return;
    }

    if (isListItem) {
      currentSection.items.push({
        value: trimmed.replace(/^[-*]\s+/, ""),
      });
      return;
    }

    currentSection.content = currentSection.content
      ? `${currentSection.content} ${trimmed}`
      : trimmed;
  });

  if (currentSection.items.length > 0 || currentSection.content) {
    sections.push(currentSection);
  }

  return { cleanContent, sections };
};

const ViewProposalDialog = ({
  open,
  onOpenChange,
  savedProposal,
  resolveProposalTitle,
  formatBudget,
  onEditProposal,
}) => {
  const { cleanContent, sections } = parseProposalSectionsForView(savedProposal);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-6">
        <DialogHeader className="flex-shrink-0 mb-4">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Eye className="w-6 h-6 text-primary" />
            </div>
            {resolveProposalTitle(savedProposal)}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-8 pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm hover:border-primary/20 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <DollarSign className="w-4 h-4 text-green-500" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Estimate Budget
                </p>
              </div>
              <p className="text-xl font-bold text-foreground pl-1">
                {formatBudget(savedProposal?.budget)}
              </p>
            </div>

            <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm hover:border-blue-500/20 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Calendar className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Timeline
                </p>
              </div>
              <p className="text-xl font-bold text-foreground pl-1">
                {savedProposal?.timeline || "Not specified"}
              </p>
            </div>

            <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm hover:border-purple-500/20 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Briefcase className="w-4 h-4 text-purple-500" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Service Type
                </p>
              </div>
              <p className="text-xl font-bold text-foreground pl-1 truncate">
                {savedProposal?.service || savedProposal?.serviceKey || "General"}
              </p>
            </div>
          </div>

          {sections.length === 0 ? (
            <div className="bg-muted/50 rounded-xl p-6">
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {cleanContent || "No description available"}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {sections.map((section, idx) => (
                <div
                  key={idx}
                  className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm"
                >
                  <div className="px-6 py-3 bg-muted/30 border-b border-border/50 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary/50" />
                    <h4 className="font-semibold text-lg tracking-tight">
                      {section.title}
                    </h4>
                  </div>
                  <div className="p-6">
                    {section.content && (
                      <p className="text-muted-foreground mb-4 leading-relaxed">
                        {section.content}
                      </p>
                    )}
                    {section.items.length > 0 && (
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {section.items.map((item, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 text-sm bg-muted/20 p-2 rounded-md"
                          >
                            {item.key ? (
                              <>
                                <span className="font-medium text-foreground min-w-[120px]">
                                  {item.key}:
                                </span>
                                <span className="text-muted-foreground">
                                  {item.value}
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="text-primary mt-1.5">&bull;</span>
                                <span className="text-muted-foreground leading-relaxed">
                                  {item.value}
                                </span>
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 pt-4 border-t mt-4 gap-2">
          <Button
            variant="outline"
            size="lg"
            onClick={() => onOpenChange(false)}
            className="gap-2"
          >
            <X className="w-4 h-4" /> Close
          </Button>
          <Button size="lg" onClick={onEditProposal} className="gap-2">
            <Edit2 className="w-4 h-4" /> Edit Proposal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default memo(ViewProposalDialog);
