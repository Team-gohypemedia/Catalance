import React, { useEffect, useRef, useState } from "react";
import { BadgeCheck, Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { IN_PROGRESS_PROJECT_OPTIONS } from "./constants";
import { StepHeader, OptionCard } from "./sub-components";

// ============================================================================
// SINGLE SELECT STEP (generic reusable)
// ============================================================================

export const SingleSelectStep = ({ title, subtitle, options, value, onSelect, compact = false, columns = 1 }) => (
    <div className="space-y-4">
        <StepHeader title={title} subtitle={subtitle} />
        <div className={cn(columns > 1 ? "grid gap-3" : "space-y-3", columns === 2 && "grid-cols-2", columns === 3 && "grid-cols-3")}>
            {options.map((option) => (
                <OptionCard
                    key={option.value}
                    compact={compact}
                    selected={value === option.value}
                    onClick={() => onSelect(option.value)}
                    label={option.label}
                    description={option.description}
                    icon={option.icon}
                    className={columns > 1 ? "justify-center" : ""}
                />
            ))}
        </div>
    </div>
);

// ============================================================================
// DELIVERY POLICY STEP
// ============================================================================

export const DeliveryPolicyStep = ({ formData: _formData, updateFormField }) => (
    <div className="space-y-6">
        <StepHeader
            title="Do You Agree To Catalance Delivery & Revision SOP?"
        />
        <div className="rounded-xl border border-white/10 bg-accent dark:bg-accent p-6 space-y-4">
            <div className="space-y-2">
                <h3 className="text-base font-semibold text-primary">Delivery & Revision Policy</h3>
                <p className="text-white/70 text-sm">
                    Catalance follows a structured delivery and revision process to maintain fairness, transparency,
                    and dispute protection for both clients and freelancers.
                </p>
            </div>
            <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-[0.08em] text-primary/90">Key SOP Rules</h4>
                <ul className="space-y-2 text-sm text-white/70">
                    <li className="flex items-start gap-2.5">
                        <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                        <span><span className="font-semibold text-white">Revision Limit:</span> Up to 3 revisions are included per milestone.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                        <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                        <span><span className="font-semibold text-white">Scope Changes:</span> Additional scope must follow the milestone modification SOP.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                        <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                        <span><span className="font-semibold text-white">Final Submission:</span> All final deliverables must be submitted through the Catalance milestone system.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                        <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                        <span><span className="font-semibold text-white">Progress Updates:</span> Reporting and project updates must follow the platform workflow.</span>
                    </li>
                </ul>
            </div>
        </div>

        <button
            type="button"
            onClick={() => updateFormField("deliveryPolicyAccepted", true, 0)}
            className="w-full md:w-auto md:px-12 mx-auto block py-4 rounded-xl font-medium transition-all duration-200 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
        >
            Agree & Continue
        </button>
    </div>
);

// ============================================================================
// COMMUNICATION POLICY STEP
// ============================================================================

export const CommunicationPolicyStep = ({ updateFormField, queueAdvance }) => {
    const agreementRef = useRef(null);
    const [hasReachedEnd, setHasReachedEnd] = useState(false);
    const [isAgreeing, setIsAgreeing] = useState(false);

    const handleAgreementScroll = () => {
        const agreementNode = agreementRef.current;
        if (!agreementNode) return;

        const reachedEnd =
            agreementNode.scrollTop + agreementNode.clientHeight >= agreementNode.scrollHeight - 8;
        if (reachedEnd) {
            setHasReachedEnd(true);
        }
    };

    useEffect(() => {
        const agreementNode = agreementRef.current;
        if (!agreementNode) return;

        if (agreementNode.scrollHeight <= agreementNode.clientHeight + 8) {
            setHasReachedEnd(true);
        }
    }, []);

    const handleAgreeAndContinue = () => {
        if (!hasReachedEnd || isAgreeing) return;

        setIsAgreeing(true);
        updateFormField("communicationPolicyAccepted", true);
        queueAdvance(250, true);
    };

    return (
        <div className="space-y-6">
            <StepHeader
                title="Freelancer Agreement & Terms And Conditions"
                subtitle="Read Completely And Scroll To The End To Continue"
            />

            <div
                ref={agreementRef}
                onScroll={handleAgreementScroll}
                className="rounded-xl border border-white/10 bg-accent dark:bg-accent p-6 space-y-4 max-h-[420px] overflow-y-auto"
            >
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-primary">Freelancer Agreement</h3>
                    <p className="text-sm font-medium text-white">Catalance</p>
                    <p className="text-sm text-white/70">
                        This Freelancer Agreement (&quot;Agreement&quot;) governs the relationship between Catalance
                        (&quot;Company&quot;) and the independent freelancer (&quot;Freelancer&quot;) engaged for project-based
                        services.
                    </p>
                    <p className="text-sm text-white/70">
                        By accepting any project, assignment, or task from Catalance, the Freelancer
                        acknowledges that they have read, understood, and agreed to the terms outlined below.
                    </p>
                </div>

                <section className="space-y-2">
                    <h4 className="text-sm font-semibold text-white">1. Engagement & Scope of Work</h4>
                    <ul className="list-disc pl-5 text-sm text-white/70 space-y-1">
                        <li>The Freelancer is engaged on a project-by-project basis.</li>
                        <li>
                            Each project will have a defined scope, timeline, deliverables, and compensation
                            agreed upon prior to commencement.
                        </li>
                        <li>
                            The Freelancer agrees to perform services professionally, diligently, and in
                            accordance with the instructions provided by Catalance.
                        </li>
                    </ul>
                </section>

                <section className="space-y-2">
                    <h4 className="text-sm font-semibold text-white">2. Project Completion & Payment</h4>
                    <ul className="list-disc pl-5 text-sm text-white/70 space-y-1">
                        <li>
                            Payment shall be made only upon successful completion and final approval of the
                            assigned project, as per the agreed scope, timeline, and quality standards.
                        </li>
                        <li>
                            If the Freelancer fails to complete the project, misses deadlines without prior
                            written approval, or delivers incomplete, plagiarized, or substandard work,
                            Catalance shall not be liable to make any payment (partial or full).
                        </li>
                        <li>
                            Payment will be processed only after internal review and formal approval by
                            Catalance.
                        </li>
                    </ul>
                </section>

                <section className="space-y-2">
                    <h4 className="text-sm font-semibold text-white">3. No Advance Payments</h4>
                    <ul className="list-disc pl-5 text-sm text-white/70 space-y-1">
                        <li>
                            Catalance does not provide advance or upfront payments unless explicitly agreed in
                            writing.
                        </li>
                        <li>All payments are strictly subject to final approval of completed deliverables.</li>
                    </ul>
                </section>

                <section className="space-y-2">
                    <h4 className="text-sm font-semibold text-white">4. Ownership & Intellectual Property</h4>
                    <ul className="list-disc pl-5 text-sm text-white/70 space-y-1">
                        <li>
                            Upon full payment, all rights, title, and interest in the completed work shall
                            transfer exclusively to Catalance.
                        </li>
                        <li>
                            The Freelancer confirms that all work delivered will be original and free from
                            third-party claims or copyright infringement.
                        </li>
                        <li>Catalance will not use unfinished or unpaid work.</li>
                    </ul>
                </section>

                <section className="space-y-2">
                    <h4 className="text-sm font-semibold text-white">5. Quality Standards & Revisions</h4>
                    <ul className="list-disc pl-5 text-sm text-white/70 space-y-1">
                        <li>
                            The Freelancer must adhere strictly to project briefs, brand guidelines, technical
                            specifications, and revision instructions.
                        </li>
                        <li>
                            Catalance reserves the right to request reasonable revisions to ensure quality
                            standards are met.
                        </li>
                        <li>Revisions must be completed within the specified timeframe.</li>
                    </ul>
                </section>

                <section className="space-y-2">
                    <h4 className="text-sm font-semibold text-white">6. Communication & Deadlines</h4>
                    <ul className="list-disc pl-5 text-sm text-white/70 space-y-1">
                        <li>The Freelancer must maintain timely and professional communication.</li>
                        <li>Any anticipated delay must be communicated in advance.</li>
                        <li>
                            Deadline extensions are subject to approval at the sole discretion of Catalance.
                            Failure to communicate delays may result in project termination without payment.
                        </li>
                    </ul>
                </section>

                <section className="space-y-2">
                    <h4 className="text-sm font-semibold text-white">7. Confidentiality</h4>
                    <ul className="list-disc pl-5 text-sm text-white/70 space-y-1">
                        <li>
                            The Freelancer agrees to maintain strict confidentiality of all project materials,
                            strategies, client information, credentials, and proprietary data.
                        </li>
                        <li>
                            Confidential information shall not be disclosed, reused, or shared without prior
                            written consent.
                        </li>
                        <li>This obligation continues even after termination of engagement.</li>
                    </ul>
                </section>

                <section className="space-y-2">
                    <h4 className="text-sm font-semibold text-white">8. Non-Solicitation & Non-Compete</h4>
                    <div className="space-y-1 text-sm text-white/70">
                        <p className="font-medium text-white/85">8.1 Non-Solicitation of Clients</p>
                        <p>
                            The Freelancer agrees that during the engagement period and for 12 months after
                            completion or termination of any project, they shall not:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>
                                Directly or indirectly approach, solicit, or accept work from any client
                                introduced by Catalance.
                            </li>
                            <li>
                                Establish independent business relationships with Catalance clients.
                            </li>
                            <li>Circumvent Catalance for direct or indirect benefit.</li>
                        </ul>
                        <p>
                            All client relationships initiated through Catalance remain the exclusive property
                            of Catalance.
                        </p>
                        <p className="font-medium text-white/85">8.2 Non-Solicitation of Team Members</p>
                        <p>
                            The Freelancer shall not recruit, hire, or engage any Catalance employee or
                            contractor for independent work during engagement and for 12 months thereafter.
                        </p>
                        <p className="font-medium text-white/85">8.3 Conflict of Interest</p>
                        <p>The Freelancer must disclose any potential conflict of interest in writing.</p>
                    </div>
                </section>

                <section className="space-y-2">
                    <h4 className="text-sm font-semibold text-white">9. Termination</h4>
                    <ul className="list-disc pl-5 text-sm text-white/70 space-y-1">
                        <li>
                            Catalance reserves the right to terminate any project or engagement if the
                            Freelancer fails to meet agreed requirements.
                        </li>
                        <li>In case of termination due to non-performance, no payment shall be due.</li>
                        <li>
                            Catalance may terminate engagement at its discretion in case of misconduct, breach
                            of confidentiality, or violation of this Agreement.
                        </li>
                    </ul>
                </section>

                <section className="space-y-2">
                    <h4 className="text-sm font-semibold text-white">10. Independent Contractor Status</h4>
                    <ul className="list-disc pl-5 text-sm text-white/70 space-y-1">
                        <li>The Freelancer is engaged as an independent contractor.</li>
                        <li>
                            Nothing in this Agreement creates an employment, partnership, or joint venture
                            relationship.
                        </li>
                        <li>
                            The Freelancer is responsible for their own taxes, compliance, and statutory
                            obligations.
                        </li>
                    </ul>
                </section>

                <section className="space-y-2">
                    <h4 className="text-sm font-semibold text-white">11. Limitation of Liability</h4>
                    <p className="text-sm text-white/70">
                        Catalance shall not be liable for any indirect, incidental, or consequential damages
                        arising from project engagement. Total liability, if any, shall not exceed the agreed
                        project fee.
                    </p>
                </section>

                <section className="space-y-2">
                    <h4 className="text-sm font-semibold text-white">12. Acceptance of Agreement</h4>
                    <p className="text-sm text-white/70">
                        By accepting any assignment or continuing work with Catalance, the Freelancer confirms
                        that:
                    </p>
                    <ul className="list-disc pl-5 text-sm text-white/70 space-y-1">
                        <li>They have read and understood this Agreement.</li>
                        <li>They agree to comply with all terms and conditions stated herein.</li>
                        <li>This Agreement is binding upon acceptance of work.</li>
                    </ul>
                </section>

                <p className="rounded-lg border border-white/10 bg-primary-foreground px-4 py-3 text-sm text-white/80">
                    I have read, understood, and agree to the Freelancer Agreement and Terms &
                    Conditions of Catalance. I acknowledge that this agreement is legally binding upon
                    accepting any project assignment.
                </p>
            </div>

            <p className="text-center text-xs text-white/60">
                {hasReachedEnd
                    ? "You can now agree and continue."
                    : "Scroll to the end of the agreement to enable the button."}
            </p>

            <button
                type="button"
                onClick={handleAgreeAndContinue}
                disabled={!hasReachedEnd || isAgreeing}
                className={cn(
                    "w-full md:w-auto md:px-12 mx-auto flex items-center justify-center gap-2 py-4 rounded-xl font-medium transition-all duration-200 shadow-lg",
                    !hasReachedEnd || isAgreeing
                        ? "bg-primary/40 text-primary-foreground/70 cursor-not-allowed shadow-primary/10"
                        : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20"
                )}
            >
                {isAgreeing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isAgreeing ? "Agreeing..." : "Agree & Continue"}
            </button>
        </div>
    );
};

// ============================================================================
// ACCEPT IN-PROGRESS PROJECTS STEP
// ============================================================================

export const AcceptInProgressProjectsStep = ({ formData, updateFormField }) => (
    <div className="space-y-4">
        <StepHeader title="Do You Accept Projects That Are Already In Progress Or Partially Completed?" />
        <div className="space-y-3">
            {IN_PROGRESS_PROJECT_OPTIONS.map((option) => (
                <OptionCard
                    key={option.value}
                    selected={formData.acceptInProgressProjects === option.value}
                    onClick={() => updateFormField("acceptInProgressProjects", option.value, 0)}
                    label={option.label}
                />
            ))}
        </div>
    </div>
);

// ============================================================================
// BIO STEP
// ============================================================================

export const BioStep = ({ formData, updateFormField, queueAdvance, renderContinueButton }) => (
    <div className="space-y-6">
        <StepHeader
            title="Write A Short Professional Bio"
            subtitle="Keep It Concise And Professional"
        />
        <Textarea
            value={formData.professionalBio}
            onChange={(e) => updateFormField("professionalBio", e.target.value)}
            onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && formData.professionalBio.trim()) {
                    e.preventDefault();
                    queueAdvance(0);
                }
            }}
            placeholder="Write 2-4 sentences about your experience, specialties, and the value you bring."
            className="bg-accent dark:bg-accent border-white/10 text-white placeholder:text-white/30 min-h-[160px] rounded-xl p-4"
        />
        <label className="flex items-start gap-3 text-white/70 text-sm cursor-pointer rounded-xl border border-white/10 bg-accent dark:bg-accent p-4">
            <input
                type="checkbox"
                checked={formData.termsAccepted}
                onChange={(e) => updateFormField("termsAccepted", e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/10 text-primary focus:ring-primary/40"
            />
            <span>Agree To The Terms & Conditions</span>
        </label>
        <p className="text-xs text-white/50 text-center">Tip: Press Ctrl+Enter or use Continue.</p>
        {renderContinueButton()}
    </div>
);

// ============================================================================
// OTP VERIFICATION STEP
// ============================================================================

export const OtpVerificationStep = ({ formData, otp, setOtp, isSubmitting }) => (
    <div className="space-y-6">
        <StepHeader title="Verify Your Email" subtitle={`We sent a code to ${formData.email}`} />
        <div>
            <Label className="text-white/70 text-sm">Verification Code</Label>
            <Input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="mt-2 bg-accent dark:bg-accent border-white/10 text-white placeholder:text-white/30 text-center text-2xl tracking-widest"
            />
        </div>
        {isSubmitting && (
            <div className="flex items-center justify-center gap-2 text-white/60 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
            </div>
        )}
    </div>
);
