import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
    HOURS_PER_WEEK_OPTIONS,
    WORKING_SCHEDULE_OPTIONS,
    START_TIMELINE_OPTIONS,
    DEADLINE_HISTORY_OPTIONS,
    DELAY_HANDLING_OPTIONS,
    IN_PROGRESS_PROJECT_OPTIONS,
} from "./constants";
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

export const DeliveryPolicyStep = ({ formData, updateFormField }) => (
    <div className="space-y-6">
        <StepHeader
            title="Do You Agree To Catalance Delivery & Revision SOP?"
            subtitle="Required To Continue"
        />
        <div className="rounded-xl border border-white/10 bg-accent dark:bg-accent p-6 space-y-4">
            <p className="text-white/70 text-sm">
                Catalance maintains standardized delivery and revision policies to ensure fairness, transparency, and dispute
                protection for both clients and freelancers.
            </p>
            <div className="space-y-2 text-sm text-white/70">
                <p>• Up to 3 revisions included per milestone</p>
                <p>• Scope changes handled through milestone modification SOP</p>
                <p>• Final deliverables submitted through Catalance milestone system</p>
                <p>• Reporting and updates follow platform workflow</p>
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

export const CommunicationPolicyStep = ({ formData, updateFormField }) => (
    <div className="space-y-6">
        <StepHeader
            title="Do You Agree To Catalance Communication Policy?"
            subtitle="Required To Continue"
        />
        <div className="rounded-xl border border-white/10 bg-accent dark:bg-accent p-6 space-y-4">
            <p className="text-white/70 text-sm">
                To ensure project transparency, client protection, and freelancer dispute coverage, all communication must remain
                within Catalance.
            </p>
            <div className="space-y-2 text-sm text-white/70">
                <p>• All project discussions must remain inside Catalance</p>
                <p>• External contact sharing is restricted during active projects</p>
                <p>• Project updates must follow Catalance reporting SOP</p>
                <p>• Freelancers must maintain response time within 12 hours</p>
            </div>
        </div>

        <button
            type="button"
            onClick={() => updateFormField("communicationPolicyAccepted", true, 0)}
            className="w-full md:w-auto md:px-12 mx-auto block py-4 rounded-xl font-medium transition-all duration-200 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
        >
            Agree & Continue
        </button>
    </div>
);

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



