import { useState } from "react";
import X from "lucide-react/dist/esm/icons/x";
import Download from "lucide-react/dist/esm/icons/download";
import Check from "lucide-react/dist/esm/icons/check";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import IndianRupee from "lucide-react/dist/esm/icons/indian-rupee";
import FileText from "lucide-react/dist/esm/icons/file-text";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronUp from "lucide-react/dist/esm/icons/chevron-up";
import Target from "lucide-react/dist/esm/icons/target";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Phone from "lucide-react/dist/esm/icons/phone";
import Clock from "lucide-react/dist/esm/icons/clock";

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
                    {phase.estimatedCost > 0 && (
                        <span className="text-sm font-medium text-primary">
                            ₹{phase.estimatedCost.toLocaleString('en-IN')}
                        </span>
                    )}
                    {phase.estimatedCost === 0 && (
                        <span className="text-xs text-green-500 font-medium">Included</span>
                    )}
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

export function ProposalSidebar({ proposal, isOpen, onClose, progress }) {
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

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div
                className={`fixed inset-y-0 right-0 w-[480px] max-w-[95vw] bg-zinc-950 border-l border-white/10 shadow-2xl transform transition-transform duration-300 ease-out z-50 flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"
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

                        {/* Investment Summary */}
                        {proposal.investmentSummary && proposal.investmentSummary.length > 0 && (
                            <section>
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                    <IndianRupee className="size-4" />
                                    Investment Summary
                                </h3>
                                <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/10">
                                                <th className="text-left text-xs font-medium text-muted-foreground p-3">Component</th>
                                                <th className="text-right text-xs font-medium text-muted-foreground p-3">Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {proposal.investmentSummary.map((item, idx) => (
                                                <tr key={idx} className="border-b border-white/5 last:border-0">
                                                    <td className="text-sm text-foreground/90 p-3">{item.component}</td>
                                                    <td className="text-sm text-foreground/90 p-3 text-right">
                                                        ₹{item.cost.toLocaleString('en-IN')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-primary/10">
                                                <td className="text-sm font-bold text-foreground p-3">Total Investment</td>
                                                <td className="text-sm font-bold text-primary p-3 text-right">
                                                    ₹{proposal.totalInvestment?.toLocaleString('en-IN')}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
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

                        {/* Features if extracted */}
                        {proposal.features && proposal.features.length > 0 && (
                            <section>
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                                    Identified Requirements
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {proposal.features.map((feature, idx) => (
                                        <span
                                            key={idx}
                                            className="px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-full border border-primary/20 capitalize"
                                        >
                                            {feature}
                                        </span>
                                    ))}
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
                        <button className="py-2.5 px-4 bg-white/5 border border-white/10 text-foreground rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-white/10 transition-colors cursor-pointer">
                            <Download className="size-4" />
                            Download PDF
                        </button>
                        <button className="py-2.5 px-4 bg-white/5 border border-white/10 text-foreground rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-white/10 transition-colors cursor-pointer">
                            <Phone className="size-4" />
                            Schedule Call
                        </button>
                    </div>
                    <p className="text-center text-xs text-muted-foreground/60">
                        Generated by CATA AI • {proposal.generatedAt ? new Date(proposal.generatedAt).toLocaleDateString() : "Today"}
                    </p>
                </div>
            </div>
        </>
    );
}
