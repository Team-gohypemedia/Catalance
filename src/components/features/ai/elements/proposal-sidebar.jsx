import { useState } from "react";
import X from "lucide-react/dist/esm/icons/x";
import Download from "lucide-react/dist/esm/icons/download";
import Check from "lucide-react/dist/esm/icons/check";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import IndianRupee from "lucide-react/dist/esm/icons/indian-rupee";
import DollarSign from "lucide-react/dist/esm/icons/dollar-sign";
import Euro from "lucide-react/dist/esm/icons/euro";
import PoundSterling from "lucide-react/dist/esm/icons/pound-sterling";
import FileText from "lucide-react/dist/esm/icons/file-text";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronUp from "lucide-react/dist/esm/icons/chevron-up";
import Target from "lucide-react/dist/esm/icons/target";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Phone from "lucide-react/dist/esm/icons/phone";
import Clock from "lucide-react/dist/esm/icons/clock";

// Helper to get currency icon
const getCurrencyIcon = (currency) => {
    switch (currency) {
        case "USD": return DollarSign;
        case "EUR": return Euro;
        case "GBP": return PoundSterling;
        default: return IndianRupee;
    }
}

// Helper to format currency
const formatCurrency = (amount, currency) => {
    const localeMap = {
        "USD": "en-US",
        "EUR": "de-DE",
        "GBP": "en-GB",
        "INR": "en-IN"
    };
    const locale = localeMap[currency] || "en-US";
    return amount?.toLocaleString(locale);
}

// Phase Card Component
function PhaseCard({ phase, isExpanded, onToggle }) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden transition-all duration-300">
            {/* Phase Header */}
            <button
                onClick={onToggle}
                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                        {phase.number}
                    </div>
                    <div className="text-left">
                        <h4 className="text-sm font-semibold text-foreground">{phase.name}</h4>
                        <p className="text-xs text-muted-foreground">{phase.estimatedDuration}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Cost hidden as per requirement */}
                    {isExpanded ? (
                        <ChevronUp className="size-4 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="size-4 text-muted-foreground" />
                    )}
                </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-4 pb-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <p className="text-xs text-muted-foreground">{phase.description}</p>

                    {/* Deliverables */}
                    <div>
                        <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                            What&apos;s Included
                        </h5>
                        <ul className="space-y-1.5">
                            {phase.deliverables?.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-xs text-foreground/90">
                                    <Check className="size-3 text-green-500 mt-0.5 shrink-0" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Value Delivered */}
                    {phase.value && phase.value.length > 0 && (
                        <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                            <h5 className="text-xs font-semibold text-primary mb-2 flex items-center gap-1.5">
                                <Sparkles className="size-3" />
                                Value Delivered
                            </h5>
                            <ul className="space-y-1">
                                {phase.value.map((item, idx) => (
                                    <li key={idx} className="text-xs text-muted-foreground">• {item}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export function ProposalSidebar({ proposal, isOpen, onClose, progress, embedded = false, inline = false }) {
    console.log("ProposalSidebar Render:", {
        embedded,
        show: isOpen,
        hasProposal: !!proposal,
        investment: proposal?.totalInvestment,
        currency: proposal?.currency,
        timeline: proposal?.timeline
    });
    const [expandedPhases, setExpandedPhases] = useState(new Set([1]));

    const togglePhase = (phaseNumber) => {
        setExpandedPhases(prev => {
            const next = new Set(prev);
            if (next.has(phaseNumber)) {
                next.delete(phaseNumber);
            } else {
                next.add(phaseNumber);
            }
            return next;
        });
    };

    const expandAll = () => {
        if (proposal?.phases) {
            setExpandedPhases(new Set(proposal.phases.map(p => p.number)));
        }
    };

    const collapseAll = () => {
        setExpandedPhases(new Set());
    };

    if (!proposal) return null;

    const CurrencyIcon = getCurrencyIcon(proposal.currency);
    const currencyCode = proposal.currency || "INR";
    const currencySymbol = proposal.currency === "USD" ? "$" : proposal.currency === "EUR" ? "€" : proposal.currency === "GBP" ? "£" : "₹";
    const projectDetails = Array.isArray(proposal.projectDetails) && proposal.projectDetails.length > 0
        ? proposal.projectDetails
        : proposal.pages
            ? [{ label: "Pages", value: proposal.pages }]
            : [];

    // Inline mode: render as a static container (no positioning, fills parent)
    if (inline) {
        return (
            <div className="h-full flex flex-col bg-zinc-950">
                {/* Header */}
                <div className="p-5 border-b border-white/10 bg-linear-to-r from-primary/10 to-transparent">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <FileText className="size-4 text-primary" />
                                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                    {proposal.isComplete ? "Complete" : "Draft"}
                                </span>
                            </div>
                            <h2 className="text-lg font-bold text-foreground">
                                Project Proposal
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5">{proposal.projectTitle}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-muted-foreground hover:text-foreground"
                        >
                            <X className="size-4" />
                        </button>
                    </div>

                    {/* Progress bar if not complete */}
                    {progress && !proposal.isComplete && (
                        <div className="mt-3">
                            <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="text-primary font-medium">{progress.collected}/{progress.total}</span>
                            </div>
                            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-linear-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
                                    style={{ width: `${(progress.collected / progress.total) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:hsl(var(--primary))_transparent]">
                    <div className="p-5 space-y-5">
                        {/* Client & Timeline */}
                        <section className="space-y-3">
                            {/* Row 1: Client & Timeline */}
                            <div className="flex items-center gap-3">
                                <div className="flex-1 bg-white/5 rounded-lg p-2.5 border border-white/10">
                                    <p className="text-[10px] text-muted-foreground mb-0.5">Client</p>
                                    <p className="text-sm font-semibold text-foreground">{proposal.clientName}</p>
                                </div>
                                {proposal.timeline?.total && (
                                    <div className="flex-1 bg-white/5 rounded-lg p-2.5 border border-white/10">
                                        <p className="text-[10px] text-muted-foreground mb-0.5">Timeline</p>
                                        <p className="text-sm font-semibold text-foreground">{proposal.timeline.total}</p>
                                    </div>
                                )}
                            </div>

                            {/* Row 2: Total Budget (Requested by User) */}
                            <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20 flex items-center justify-between">
                                <div>
                                    <h3 className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500 mb-0.5 flex items-center gap-1">
                                        <CurrencyIcon className="size-3" />
                                        Total Investment
                                    </h3>
                                    <p className="text-xs text-emerald-400/80">Tailored to your budget</p>
                                </div>
                                <p className="text-lg font-bold text-emerald-400">
                                    {currencySymbol}{formatCurrency(proposal.totalInvestment, currencyCode)}
                                </p>
                            </div>

                            {/* Project Objective */}
                            <div className="bg-linear-to-br from-primary/10 to-primary/5 rounded-lg p-3 border border-primary/20">
                                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1.5 flex items-center gap-1">
                                    <Target className="size-3" />
                                    Objective
                                </h3>
                                <p className="text-xs text-foreground/90 leading-relaxed">
                                    {proposal.objective}
                                </p>
                            </div>
                        </section>

                        {/* New Details: Project Details, Tech, Integrations */}
                        <section className="space-y-3">
                            {/* Project Details - Enhanced */}
                            {projectDetails.length > 0 && (() => {
                                // Group details by category (Budget excluded from scope)
                                const overviewFields = ['Service', 'Project Type', 'Business', 'Website Requirement', 'Primary Objective'];
                                const techFields = ['Frontend Framework', 'Backend Technology', 'Database', 'Hosting', 'Build Type'];
                                const scopeFields = ['Design Experience', 'Features', 'Page Count', 'Timeline'];
                                const excludeFields = ['Budget']; // Excluded fields

                                const groupDetails = (fields) => projectDetails.filter(d => fields.includes(d.label));
                                const overview = groupDetails(overviewFields);
                                const tech = groupDetails(techFields);
                                const scope = groupDetails(scopeFields);
                                const other = projectDetails.filter(d =>
                                    !overviewFields.includes(d.label) &&
                                    !techFields.includes(d.label) &&
                                    !scopeFields.includes(d.label) &&
                                    !excludeFields.includes(d.label)
                                );

                                return (
                                    <div className="space-y-2.5">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1.5">
                                            <FileText className="size-3" />
                                            Project Details
                                        </p>

                                        {/* Overview */}
                                        {overview.length > 0 && (
                                            <div className="rounded-lg p-3 bg-white/5 border border-white/10">
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                                    {overview.map((detail, idx) => (
                                                        <div key={idx} className={detail.value?.length > 35 ? 'col-span-2' : ''}>
                                                            <p className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">{detail.label}</p>
                                                            <p className="text-xs text-foreground font-medium mt-0.5">{detail.value}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Tech Stack - Improved */}
                                        {tech.length > 0 && (
                                            <div className="rounded-lg p-3 bg-white/5 border border-white/10">
                                                <p className="text-[9px] text-muted-foreground/50 uppercase tracking-wider mb-2.5">Tech Stack</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {tech.map((detail, idx) => (
                                                        <div key={idx} className="flex items-center gap-2 px-2.5 py-1.5 bg-zinc-800/50 rounded-md">
                                                            <span className="text-[9px] text-muted-foreground/50 uppercase shrink-0">{detail.label.replace(' Framework', '').replace(' Technology', '')}</span>
                                                            <span className="text-[11px] text-foreground font-medium truncate">{detail.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Scope & Preferences */}
                                        {scope.length > 0 && (
                                            <div className="rounded-lg p-3 bg-white/5 border border-white/10">
                                                <p className="text-[9px] text-muted-foreground/50 uppercase tracking-wider mb-2">Scope & Preferences</p>
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                                    {scope.map((detail, idx) => {
                                                        const isLong = detail.value?.length > 35;
                                                        return (
                                                            <div key={idx} className={isLong ? 'col-span-2' : ''}>
                                                                <p className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">{detail.label}</p>
                                                                <p className="text-xs text-foreground font-medium mt-0.5">{detail.value}</p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Other */}
                                        {other.length > 0 && (
                                            <div className="rounded-lg p-3 bg-white/5 border border-white/10">
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                                    {other.map((detail, idx) => (
                                                        <div key={idx} className={detail.value?.length > 35 ? 'col-span-2' : ''}>
                                                            <p className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">{detail.label}</p>
                                                            <p className="text-xs text-foreground font-medium mt-0.5">{detail.value}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Technologies */}
                            {proposal.technologies && proposal.technologies.length > 0 && (
                                <div>
                                    <p className="text-[10px] text-muted-foreground mb-2">Technologies</p>
                                    <div className="flex flex-wrap gap-2">
                                        {proposal.technologies.map((tech, idx) => (
                                            <span key={idx} className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded border border-blue-500/20 font-medium">
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Integrations */}
                            {proposal.integrations && proposal.integrations.length > 0 && (
                                <div>
                                    <p className="text-[10px] text-muted-foreground mb-2">Integrations</p>
                                    <div className="flex flex-wrap gap-2">
                                        {proposal.integrations.map((item, idx) => (
                                            <span key={idx} className="px-2 py-1 bg-purple-500/10 text-purple-400 text-xs rounded border border-purple-500/20 font-medium">
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* Phases */}
                        {proposal.phases && proposal.phases.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Phases
                                    </h3>
                                    <div className="flex gap-2">
                                        <button onClick={expandAll} className="text-[10px] text-primary hover:underline">Expand</button>
                                        <span className="text-muted-foreground/50">|</span>
                                        <button onClick={collapseAll} className="text-[10px] text-primary hover:underline">Collapse</button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {proposal.phases.map((phase) => (
                                        <PhaseCard
                                            key={phase.number}
                                            phase={phase}
                                            isExpanded={expandedPhases.has(phase.number)}
                                            onToggle={() => togglePhase(phase.number)}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-white/10 bg-zinc-950/80 backdrop-blur-xl space-y-2">
                    <button className="w-full py-2.5 px-4 bg-linear-to-r from-primary to-primary/80 text-primary-foreground rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20 cursor-pointer">
                        <Check className="size-4" />
                        Accept Proposal
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                        {/* Download/Call buttons removed */}
                    </div>
                    <p className="text-center text-[10px] text-muted-foreground/60">
                        Generated by CATA AI
                    </p>
                </div>
            </div>
        );
    }

    // Use absolute positioning when embedded in a dialog, fixed when standalone
    const positionClass = embedded
        ? "absolute inset-y-0 right-0"
        : "fixed inset-y-0 right-0";

    return (
        <>
            {/* Backdrop - only show for fixed (non-embedded) mode */}
            {isOpen && !embedded && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div
                className={`${positionClass} w-[500px] max-w-[90%] bg-zinc-950 border-l border-white/10 shadow-2xl transform transition-transform duration-300 ease-out ${embedded ? 'z-30' : 'z-50'} flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10 bg-gradient-to-r from-primary/10 to-transparent">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <FileText className="size-5 text-primary" />
                                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                    {proposal.isComplete ? "Complete" : "Draft"}
                                </span>
                            </div>
                            <h2 className="text-xl font-bold text-foreground">
                                Project Proposal
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">{proposal.projectTitle}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-muted-foreground hover:text-foreground"
                        >
                            <X className="size-5" />
                        </button>
                    </div>

                    {/* Progress bar if not complete */}
                    {progress && !proposal.isComplete && (
                        <div className="mt-4">
                            <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className="text-muted-foreground">Data Collection Progress</span>
                                <span className="text-primary font-medium">{progress.collected}/{progress.total} fields</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
                                    style={{ width: `${(progress.collected / progress.total) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:hsl(var(--primary))_transparent]">
                    <div className="p-6 space-y-6">

                        {/* Client & Objective */}
                        <section className="space-y-3">
                            {/* Row 1: Client & Timeline */}
                            <div className="flex items-center gap-4">
                                <div className="flex-1 bg-white/5 rounded-xl p-3 border border-white/10">
                                    <p className="text-xs text-muted-foreground mb-0.5">Client</p>
                                    <p className="text-sm font-semibold text-foreground">{proposal.clientName}</p>
                                </div>
                                {proposal.timeline?.total && (
                                    <div className="flex-1 bg-white/5 rounded-xl p-3 border border-white/10">
                                        <p className="text-xs text-muted-foreground mb-0.5">Timeline</p>
                                        <p className="text-sm font-semibold text-foreground">{proposal.timeline.total}</p>
                                    </div>
                                )}
                            </div>

                            {/* Row 2: Total Budget (Requested by User) */}
                            <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-500 mb-1 flex items-center gap-1.5">
                                        <CurrencyIcon className="size-3.5" />
                                        Total Project Value
                                    </h3>
                                    <p className="text-sm text-emerald-400/80">Optimized for your budget</p>
                                </div>
                                <p className="text-2xl font-bold text-emerald-400">
                                    {currencySymbol}{formatCurrency(proposal.totalInvestment, currencyCode)}
                                </p>
                            </div>

                            {/* Project Objective */}
                            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5">
                                    <Target className="size-3.5" />
                                    Project Objective
                                </h3>
                                <p className="text-sm text-foreground/90 leading-relaxed">
                                    {proposal.objective}
                                </p>
                            </div>
                        </section>

                        {/* New Details: Project Details, Tech, Integrations (Sidebar Mode) */}
                        <section className="space-y-4">
                            {/* Project Details - Enhanced */}
                            {projectDetails.length > 0 && (() => {
                                const overviewFields = ['Service', 'Project Type', 'Business', 'Website Requirement', 'Primary Objective'];
                                const techFields = ['Frontend Framework', 'Backend Technology', 'Database', 'Hosting', 'Build Type'];
                                const scopeFields = ['Design Experience', 'Features', 'Page Count', 'Timeline'];
                                const excludeFields = ['Budget'];

                                const groupDetails = (fields) => projectDetails.filter(d => fields.includes(d.label));
                                const overview = groupDetails(overviewFields);
                                const tech = groupDetails(techFields);
                                const scope = groupDetails(scopeFields);
                                const other = projectDetails.filter(d =>
                                    !overviewFields.includes(d.label) &&
                                    !techFields.includes(d.label) &&
                                    !scopeFields.includes(d.label) &&
                                    !excludeFields.includes(d.label)
                                );

                                return (
                                    <div className="space-y-3">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-2">
                                            <FileText className="size-3.5" />
                                            Project Details
                                        </p>

                                        {/* Overview */}
                                        {overview.length > 0 && (
                                            <div className="rounded-xl p-4 bg-white/5 border border-white/10">
                                                <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                                                    {overview.map((detail, idx) => (
                                                        <div key={idx} className={detail.value?.length > 35 ? 'col-span-2' : ''}>
                                                            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">{detail.label}</p>
                                                            <p className="text-sm text-foreground font-medium mt-0.5">{detail.value}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Tech Stack - Improved Grid */}
                                        {tech.length > 0 && (
                                            <div className="rounded-xl p-4 bg-white/5 border border-white/10">
                                                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider mb-3">Tech Stack</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {tech.map((detail, idx) => (
                                                        <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 rounded-lg">
                                                            <span className="text-[9px] text-muted-foreground/50 uppercase shrink-0">{detail.label.replace(' Framework', '').replace(' Technology', '')}</span>
                                                            <span className="text-xs text-foreground font-medium truncate">{detail.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Scope & Preferences */}
                                        {scope.length > 0 && (
                                            <div className="rounded-xl p-4 bg-white/5 border border-white/10">
                                                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider mb-3">Scope & Preferences</p>
                                                <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                                                    {scope.map((detail, idx) => {
                                                        const isLong = detail.value?.length > 35;
                                                        return (
                                                            <div key={idx} className={isLong ? 'col-span-2' : ''}>
                                                                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">{detail.label}</p>
                                                                <p className="text-sm text-foreground font-medium mt-0.5">{detail.value}</p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Other */}
                                        {other.length > 0 && (
                                            <div className="rounded-xl p-4 bg-white/5 border border-white/10">
                                                <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                                                    {other.map((detail, idx) => (
                                                        <div key={idx} className={detail.value?.length > 35 ? 'col-span-2' : ''}>
                                                            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">{detail.label}</p>
                                                            <p className="text-sm text-foreground font-medium mt-0.5">{detail.value}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Technologies */}
                            {proposal.technologies && proposal.technologies.length > 0 && (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold">Technologies</p>
                                    <div className="flex flex-wrap gap-2">
                                        {proposal.technologies.map((tech, idx) => (
                                            <span key={idx} className="px-2.5 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/20 font-medium">
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Integrations */}
                            {proposal.integrations && proposal.integrations.length > 0 && (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold">Integrations</p>
                                    <div className="flex flex-wrap gap-2">
                                        {proposal.integrations.map((item, idx) => (
                                            <span key={idx} className="px-2.5 py-1 bg-purple-500/10 text-purple-400 text-xs rounded-full border border-purple-500/20 font-medium">
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* Phases */}
                        {proposal.phases && proposal.phases.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                        Project Phases
                                    </h3>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={expandAll}
                                            className="text-xs text-primary hover:underline"
                                        >
                                            Expand All
                                        </button>
                                        <span className="text-muted-foreground/50">|</span>
                                        <button
                                            onClick={collapseAll}
                                            className="text-xs text-primary hover:underline"
                                        >
                                            Collapse
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {proposal.phases.map((phase) => (
                                        <PhaseCard
                                            key={phase.number}
                                            phase={phase}
                                            isExpanded={expandedPhases.has(phase.number)}
                                            onToggle={() => togglePhase(phase.number)}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Timeline Summary */}
                        {proposal.timeline && (
                            <section>
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                    <Clock className="size-4" />
                                    Timeline
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {proposal.timeline.branding && (
                                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                                            <p className="text-xs text-muted-foreground">Branding & UI/UX</p>
                                            <p className="text-sm font-semibold text-foreground">{proposal.timeline.branding}</p>
                                        </div>
                                    )}
                                    {proposal.timeline.development && (
                                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                                            <p className="text-xs text-muted-foreground">Development</p>
                                            <p className="text-sm font-semibold text-foreground">{proposal.timeline.development}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-3 bg-gradient-to-r from-green-500/10 to-green-500/5 rounded-lg p-3 border border-green-500/20">
                                    <p className="text-xs text-green-400">Total Duration</p>
                                    <p className="text-lg font-bold text-green-400">{proposal.timeline.total}</p>
                                </div>
                            </section>
                        )}

                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-white/10 bg-zinc-950/80 backdrop-blur-xl space-y-3">
                    <button className="w-full py-3.5 px-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20 cursor-pointer">
                        <Check className="size-4" />
                        Accept Proposal
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                        {/* Download/Call buttons removed */}
                    </div>
                    <p className="text-center text-xs text-muted-foreground/60">
                        Generated by CATA AI • {proposal.generatedAt ? new Date(proposal.generatedAt).toLocaleDateString() : "Today"}
                    </p>
                </div>
            </div>
        </>
    );
}
