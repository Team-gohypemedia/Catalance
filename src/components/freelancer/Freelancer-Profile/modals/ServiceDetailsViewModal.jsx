import React, { useState } from "react";
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog";
import { 
  X, 
  User, 
  Briefcase, 
  IndianRupee, 
  Cpu,
  FileText, 
  FlaskConical, 
  LayoutGrid, 
  Layers3,
  ChevronDown,
  ChevronUp,
  MessageSquare
} from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

const INITIAL_PILL_COUNT = 8;

const CollapsiblePillList = ({ items, renderPill, emptyMessage }) => {
  const [expanded, setExpanded] = useState(false);

  if (!items || items.length === 0) {
    return <p className="text-xs text-muted-foreground/60">{emptyMessage}</p>;
  }

  const visibleItems = expanded ? items : items.slice(0, INITIAL_PILL_COUNT);
  const hasMore = items.length > INITIAL_PILL_COUNT;

  return (
    <div>
      <div className="flex flex-wrap gap-2 mt-2">
        {visibleItems.map((item, i) => renderPill(item, i))}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-2.5 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          {expanded ? "Show less" : `Show ${items.length - INITIAL_PILL_COUNT} more`}
        </button>
      )}
    </div>
  );
};

const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 mb-3">
    <div className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
      <Icon className="size-3.5" />
    </div>
    <h4 className="text-[10px] font-bold uppercase tracking-wider text-foreground">
      {title}
    </h4>
  </div>
);

const OutlinePill = ({ children }) => (
  <span className="inline-flex items-center rounded-md border border-border/60 bg-transparent px-2.5 py-1 text-[11px] md:text-xs font-medium text-muted-foreground">
    {children}
  </span>
);

export const ServiceDetailsViewModal = ({ 
  isOpen, 
  onClose, 
  service, 
  labels, 
  onEdit 
}) => {
  const [caseStudiesOpen, setCaseStudiesOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  if (!service) return null;

  const {
    serviceKey,
    serviceTitle,
    serviceName,
    serviceImage,
    serviceDescription,
    metadataItems = [],
    selectedSubcategories = [],
    toolTags = [],
    skillTags = [],
    caseStudies = [],
  } = service;

  const experienceItem = metadataItems.find(
    (item) => item.label === labels?.serviceExperienceLabel || item.key === "experience"
  );
  const priceItem = metadataItems.find(
    (item) => item.label === labels?.startingPriceLabel || item.key === "startingPrice"
  );

  const categoriesCount = selectedSubcategories?.length || 0;
  const toolsCount = toolTags.length;
  const skillsCount = skillTags.length;
  const caseStudiesCount = caseStudies?.length || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="w-[94%] md:w-full md:max-w-[900px] p-0 overflow-y-auto md:overflow-hidden bg-background gap-0 rounded-[20px] flex flex-col md:flex-row border-none shadow-2xl max-h-[92vh] md:max-h-[85vh]">
        <VisuallyHidden>
          <DialogTitle>Service Details: {serviceTitle || serviceName}</DialogTitle>
        </VisuallyHidden>


        {/* Close Button on Phone View (Top Right absolute to modal container) */}
        <DialogClose asChild>
          <button className="absolute top-3 right-4 md:hidden flex size-8 items-center justify-center rounded-full border border-border/40 bg-background/90 backdrop-blur-xs text-muted-foreground hover:bg-muted/50 transition-colors z-50">
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogClose>

        {/* Left Sidebar */}
        <div className="w-full md:w-[380px] bg-background p-5 md:p-8 flex flex-col md:border-r border-border/40 relative shrink-0">

          {/* Image Placeholder */}
          <div className="relative w-full aspect-[4/3] rounded-xl bg-muted/30 mb-4 md:mb-6 flex items-center justify-center overflow-hidden">
            {serviceImage ? (
              <img src={serviceImage} alt={serviceTitle} className="w-full h-full object-cover" />
            ) : (
              <User className="size-20 text-muted-foreground/20" />
            )}
          </div>

          <div className="flex-1 flex flex-col">
            {/* Pill */}
            {serviceName && (
              <div className="mb-2 md:mb-4">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-primary">
                  {serviceName}
                </span>
              </div>
            )}

            {/* Title */}
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground mb-2 md:mb-3 leading-tight">
              {serviceTitle || serviceName}
            </h2>
            {/* About */}
            <div className="mb-4 md:mb-6">
              <p className="text-xs md:text-sm text-muted-foreground/80 leading-relaxed">
                {serviceDescription || "No description provided."}
              </p>
            </div>


            {/* Meta Blocks (Styled as separate rounded border cards) */}
            <div className="flex flex-row items-center gap-2 mt-auto">
              <div className="flex items-center gap-2.5 flex-1 border border-border/50 bg-card rounded-xl p-2.5 md:p-3">
                <div className="flex size-8 md:size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Briefcase className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 whitespace-nowrap">
                    Experience Level
                  </span>
                  <span className="text-xs md:text-sm font-bold text-foreground">
                    {experienceItem?.value || "Entry"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-1 border border-border/50 bg-card rounded-xl p-2.5 md:p-3">
                <div className="flex size-8 md:size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <IndianRupee className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 whitespace-nowrap">
                    Starting Price
                  </span>
                  <span className="text-xs md:text-sm font-bold text-foreground">
                    {priceItem?.value || "Not specified"}
                  </span>
                </div>
              </div>
            </div>

            <div className="h-px w-full bg-border/40 my-4 md:my-6" />

            {/* Bottom Stats */}
            <div className="grid grid-cols-3 gap-2 px-2">
              <div className="flex flex-col items-center gap-1">
                <span className="text-base md:text-lg font-bold text-muted-foreground/60 leading-none">{categoriesCount}</span>
                <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">
                  {categoriesCount === 1 ? "Category" : "Categories"}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-base md:text-lg font-bold text-muted-foreground/60 leading-none">{toolsCount}</span>
                <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">
                  {toolsCount === 1 ? "Tool" : "Tools"}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-base md:text-lg font-bold text-muted-foreground/60 leading-none">{skillsCount}</span>
                <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">
                  {skillsCount === 1 ? "Skill" : "Skills"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 bg-background p-5 md:p-8 flex flex-col relative md:overflow-y-auto md:max-h-[85vh]">
          {/* Close Button on Desktop View (Top Right) */}
          <DialogClose asChild>
            <button className="hidden md:flex absolute top-6 right-6 size-8 items-center justify-center rounded-full border border-border/40 bg-transparent text-muted-foreground hover:bg-muted/50 transition-colors">
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </button>
          </DialogClose>

          <div className="flex flex-col gap-6 pt-2">
            {/* CASE STUDIES */}
            <section className="border-b border-border/30 pb-5 md:border-none md:pb-0">
              <div 
                onClick={() => setCaseStudiesOpen(!caseStudiesOpen)}
                className="w-full flex items-center justify-between cursor-pointer md:cursor-default"
              >
                <SectionHeader 
                  icon={FlaskConical} 
                  title={`${labels?.caseStudiesTitle || "Service Case Studies"} (${caseStudiesCount})`} 
                />
                <span className="flex size-7 items-center justify-center rounded-full bg-muted/40 text-muted-foreground md:hidden mb-3">
                  {caseStudiesOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </span>
              </div>
              
              <div className={`flex-wrap gap-2 mt-1 ${caseStudiesOpen ? "flex" : "hidden md:flex"}`}>
                {caseStudiesCount > 0 ? (
                  caseStudies.map((cs, i) => (
                    <OutlinePill key={i}>{cs.title || "Case Study"}</OutlinePill>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground/60">
                    {labels?.noCaseStudies || "No case studies added yet."}
                  </p>
                )}
              </div>
            </section>

            <div className="hidden md:block h-px w-full bg-border/30" />

            {/* TOOLS */}
            <section className="border-b border-border/30 pb-5 md:border-none md:pb-0">
              <div 
                onClick={() => setToolsOpen(!toolsOpen)}
                className="w-full flex items-center justify-between cursor-pointer md:cursor-default"
              >
                <SectionHeader
                  icon={Cpu}
                  title={`${labels?.toolsTitle || "Tools"} (${toolsCount})`}
                />
                <span className="flex size-7 items-center justify-center rounded-full bg-muted/40 text-muted-foreground md:hidden mb-3">
                  {toolsOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </span>
              </div>

              <div className={`mt-1 ${toolsOpen ? "block" : "hidden md:block"}`}>
                <CollapsiblePillList
                  items={toolTags}
                  emptyMessage={labels?.noTools || "No tools added yet."}
                  renderPill={(tool, i) => <OutlinePill key={i}>{tool}</OutlinePill>}
                />
              </div>
            </section>

            <div className="hidden md:block h-px w-full bg-border/30" />

            {/* SKILLS */}
            <section className="border-b border-border/30 pb-5 md:border-none md:pb-0">
              <div 
                onClick={() => setSkillsOpen(!skillsOpen)}
                className="w-full flex items-center justify-between cursor-pointer md:cursor-default"
              >
                <SectionHeader
                  icon={LayoutGrid}
                  title={`${labels?.skillsTitle || "Skills"} (${skillsCount})`}
                />
                <span className="flex size-7 items-center justify-center rounded-full bg-muted/40 text-muted-foreground md:hidden mb-3">
                  {skillsOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </span>
              </div>

              <div className={`mt-1 ${skillsOpen ? "block" : "hidden md:block"}`}>
                <CollapsiblePillList
                  items={skillTags}
                  emptyMessage={labels?.noSkills || "No skills added yet."}
                  renderPill={(skill, i) => <OutlinePill key={i}>{skill}</OutlinePill>}
                />
              </div>
            </section>

            <div className="hidden md:block h-px w-full bg-border/30" />

            {/* CATEGORIES */}
            <section className="pb-5 md:pb-0">
              <div 
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                className="w-full flex items-center justify-between cursor-pointer md:cursor-default"
              >
                <SectionHeader
                  icon={Layers3}
                  title={labels?.categoriesTitle || "Categories"}
                />
                <span className="flex size-7 items-center justify-center rounded-full bg-muted/40 text-muted-foreground md:hidden mb-3">
                  {categoriesOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </span>
              </div>

              <div className={`mt-1 ${categoriesOpen ? "block" : "hidden md:block"}`}>
                <CollapsiblePillList
                  items={selectedSubcategories}
                  emptyMessage={labels?.noCategories || "No categories selected yet."}
                  renderPill={(cat, i) => <OutlinePill key={i}>{cat.label || cat}</OutlinePill>}
                />
              </div>
            </section>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
