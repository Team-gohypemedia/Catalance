import { useEffect, useRef, useState } from "react";
import BadgeCheck from "lucide-react/dist/esm/icons/badge-check";
import { cn } from "@/shared/lib/utils";
import { ONBOARDING_FIELD_LABEL_CLASS } from "../typography";

const ONBOARDING_PAGE_TITLE_CLASS =
  "text-balance text-2xl font-semibold leading-[1.12] tracking-[-0.03em] sm:text-[34px] md:text-[40px]";
const ONBOARDING_SECTION_TITLE_CLASS = "text-2xl font-medium leading-tight tracking-[-0.02em]";
const ONBOARDING_SECTION_DESCRIPTION_CLASS = "text-base font-normal leading-7";

const FreelancerCommunicationPolicySlide = ({ onCommunicationPolicyReadinessChange, continueButton }) => {
  const agreementRef = useRef(null);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const [isAgreementChecked, setIsAgreementChecked] = useState(false);

  const handleAgreementScroll = () => {
    const agreementNode = agreementRef.current;
    if (!agreementNode) {
      return;
    }

    const reachedEnd =
      agreementNode.scrollTop + agreementNode.clientHeight >=
      agreementNode.scrollHeight - 8;
    setHasReachedEnd(reachedEnd);
    if (reachedEnd) {
      setIsAgreementChecked(true);
    }
  };

  useEffect(() => {
    const agreementNode = agreementRef.current;
    if (!agreementNode) {
      return;
    }

    if (agreementNode.scrollHeight <= agreementNode.clientHeight + 8) {
      setHasReachedEnd(true);
      setIsAgreementChecked(true);
    }
  }, []);

  useEffect(() => {
    if (typeof onCommunicationPolicyReadinessChange === "function") {
      onCommunicationPolicyReadinessChange(hasReachedEnd && isAgreementChecked);
    }
  }, [hasReachedEnd, isAgreementChecked, onCommunicationPolicyReadinessChange]);

  return (
    <section className="mx-auto flex min-h-[68vh] w-full max-w-6xl flex-col items-center justify-center px-4 sm:min-h-[70vh] sm:px-6">
      <div className="w-full max-w-5xl space-y-6">
        <div className="space-y-2 text-center">
          <h1 className={cn(ONBOARDING_PAGE_TITLE_CLASS, "text-primary")}>
            Freelancer Agreement &amp; Terms And Conditions
          </h1>
        </div>

        <div
          ref={agreementRef}
          onScroll={handleAgreementScroll}
          className="max-h-[430px] space-y-4 overflow-y-auto subtle-scrollbar rounded-2xl border border-border bg-card p-6 sm:p-7"
        >
          <div className="space-y-2">
            <h3 className={cn(ONBOARDING_SECTION_TITLE_CLASS, "text-2xl")}>Freelancer Agreement</h3>
            <p className={cn(ONBOARDING_SECTION_DESCRIPTION_CLASS, "text-muted-foreground text-sm font-regular")}>
              This Freelancer Agreement ("Agreement") governs the relationship
              between Catalance ("Company") and the independent freelancer
              ("Freelancer") engaged for project-based services.
            </p>
            <p className={cn(ONBOARDING_SECTION_DESCRIPTION_CLASS, "text-muted-foreground text-sm font-regular")}>
              By accepting any project, assignment, or task from Catalance, the
              Freelancer acknowledges that they have read, understood, and agreed
              to the terms outlined below.
            </p>
          </div>

          <section className="space-y-2">
            <h4 className={cn(ONBOARDING_SECTION_TITLE_CLASS, "text-2xl")}>1. Engagement &amp; Scope of Work</h4>
            <ul className={cn("list-disc space-y-1 pl-6", ONBOARDING_SECTION_DESCRIPTION_CLASS, "text-muted-foreground text-sm font-regular")}>
              <li>The Freelancer is engaged on a project-by-project basis.</li>
              <li>
                Each project will have a defined scope, timeline, deliverables,
                and compensation agreed upon prior to commencement.
              </li>
              <li>
                The Freelancer agrees to perform services professionally,
                diligently, and in accordance with the instructions provided by
                Catalance.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className={cn(ONBOARDING_SECTION_TITLE_CLASS, "text-2xl")}>2. Project Completion &amp; Payment</h4>
            <ul className={cn("list-disc space-y-1 pl-6", ONBOARDING_SECTION_DESCRIPTION_CLASS, "text-muted-foreground text-sm font-regular")}>
              <li>
                Payment shall be made only upon successful completion and final
                approval of the assigned project, as per the agreed scope,
                timeline, and quality standards.
              </li>
              <li>
                If the Freelancer fails to complete the project, misses deadlines
                without prior written approval, or delivers incomplete,
                plagiarized, or substandard work, Catalance shall not be liable
                to make any payment (partial or full).
              </li>
              <li>
                Payment will be processed only after internal review and formal
                approval by Catalance.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className={cn(ONBOARDING_SECTION_TITLE_CLASS, "text-2xl")}>3. No Advance Payments</h4>
            <ul className={cn("list-disc space-y-1 pl-6", ONBOARDING_SECTION_DESCRIPTION_CLASS, "text-muted-foreground text-sm font-regular")}>
              <li>
                Catalance does not provide advance or upfront payments unless
                explicitly agreed in writing.
              </li>
              <li>
                All payments are strictly subject to final approval of completed
                deliverables.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className={cn(ONBOARDING_SECTION_TITLE_CLASS, "text-2xl")}>4. Ownership &amp; Intellectual Property</h4>
            <ul className={cn("list-disc space-y-1 pl-6", ONBOARDING_SECTION_DESCRIPTION_CLASS, "text-muted-foreground text-sm font-regular")}>
              <li>
                Upon full payment, all rights, title, and interest in the
                completed work shall transfer exclusively to Catalance.
              </li>
              <li>
                The Freelancer confirms that all work delivered will be original
                and free from third-party claims or copyright infringement.
              </li>
              <li>Catalance will not use unfinished or unpaid work.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className={cn(ONBOARDING_SECTION_TITLE_CLASS, "text-2xl")}>5. Quality Standards &amp; Revisions</h4>
            <ul className={cn("list-disc space-y-1 pl-6", ONBOARDING_SECTION_DESCRIPTION_CLASS, "text-muted-foreground text-sm font-regular")}>
              <li>
                The Freelancer must adhere strictly to project briefs, brand
                guidelines, technical specifications, and revision instructions.
              </li>
              <li>
                Catalance reserves the right to request reasonable revisions to
                ensure quality standards are met.
              </li>
              <li>
                Revisions must be completed within the specified timeframe.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className={cn(ONBOARDING_SECTION_TITLE_CLASS, "text-2xl")}>6. Communication &amp; Deadlines</h4>
            <ul className={cn("list-disc space-y-1 pl-6", ONBOARDING_SECTION_DESCRIPTION_CLASS, "text-muted-foreground text-sm font-regular")}>
              <li>
                The Freelancer must maintain timely and professional
                communication.
              </li>
              <li>Any anticipated delay must be communicated in advance.</li>
              <li>
                Deadline extensions are subject to approval at the sole
                discretion of Catalance. Failure to communicate delays may
                result in project termination without payment.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className={cn(ONBOARDING_SECTION_TITLE_CLASS, "text-2xl")}>7. Confidentiality</h4>
            <ul className={cn("list-disc space-y-1 pl-6", ONBOARDING_SECTION_DESCRIPTION_CLASS, "text-muted-foreground text-sm font-regular")}>
              <li>
                The Freelancer agrees to maintain strict confidentiality of all
                project materials, strategies, client information, credentials,
                and proprietary data.
              </li>
              <li>
                Confidential information shall not be disclosed, reused, or
                shared without prior written consent.
              </li>
              <li>
                This obligation continues even after termination of engagement.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className={cn(ONBOARDING_SECTION_TITLE_CLASS, "text-2xl")}>8. Non-Solicitation &amp; Non-Compete</h4>
            <div className={cn("space-y-2", ONBOARDING_SECTION_DESCRIPTION_CLASS, "text-muted-foreground")}>
              <p className="font-semibold">8.1 Non-Solicitation of Clients</p>
              <p>
                The Freelancer agrees that during the engagement period and for
                12 months after completion or termination of any project, they
                shall not:
              </p>
              <ul className="list-disc space-y-1 pl-6">
                <li>
                  Directly or indirectly approach, solicit, or accept work from
                  any client introduced by Catalance.
                </li>
                <li>
                  Establish independent business relationships with Catalance
                  clients.
                </li>
                <li>
                  Circumvent Catalance for direct or indirect benefit.
                </li>
              </ul>
              <p>
                All client relationships initiated through Catalance remain the
                exclusive property of Catalance.
              </p>
              <p className="font-semibold">8.2 Non-Solicitation of Team Members</p>
              <p>
                The Freelancer shall not recruit, hire, or engage any Catalance
                employee or contractor for independent work during engagement and
                for 12 months thereafter.
              </p>
              <p className="font-semibold">8.3 Conflict of Interest</p>
              <p>
                The Freelancer must disclose any potential conflict of interest
                in writing.
              </p>
            </div>
          </section>

          <section className="space-y-2">
            <h4 className={cn(ONBOARDING_SECTION_TITLE_CLASS, "text-2xl")}>9. Termination</h4>
            <ul className={cn("list-disc space-y-1 pl-6", ONBOARDING_SECTION_DESCRIPTION_CLASS, "text-muted-foreground text-sm font-regular")}>
              <li>
                Catalance reserves the right to terminate any project or
                engagement if the Freelancer fails to meet agreed requirements.
              </li>
              <li>
                In case of termination due to non-performance, no payment shall
                be due.
              </li>
              <li>
                Catalance may terminate engagement at its discretion in case of
                misconduct, breach of confidentiality, or violation of this
                Agreement.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className={cn(ONBOARDING_SECTION_TITLE_CLASS, "text-2xl")}>10. Independent Contractor Status</h4>
            <ul className={cn("list-disc space-y-1 pl-6", ONBOARDING_SECTION_DESCRIPTION_CLASS, "text-muted-foreground text-sm font-regular")}>
              <li>The Freelancer is engaged as an independent contractor.</li>
              <li>
                Nothing in this Agreement creates an employment, partnership, or
                joint venture relationship.
              </li>
              <li>
                The Freelancer is responsible for their own taxes, compliance,
                and statutory obligations.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className={cn(ONBOARDING_SECTION_TITLE_CLASS, "text-2xl")}>11. Limitation of Liability</h4>
            <p className={cn(ONBOARDING_SECTION_DESCRIPTION_CLASS, "text-muted-foreground")}>
              Catalance shall not be liable for any indirect, incidental, or
              consequential damages arising from project engagement. Total
              liability, if any, shall not exceed the agreed project fee.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className={cn(ONBOARDING_SECTION_TITLE_CLASS, "text-2xl")}>12. Acceptance of Agreement</h4>
            <p className={cn(ONBOARDING_SECTION_DESCRIPTION_CLASS, "text-muted-foreground")}>
              By accepting any assignment or continuing work with Catalance, the
              Freelancer confirms that:
            </p>
            <ul className={cn("space-y-2", ONBOARDING_SECTION_DESCRIPTION_CLASS, "text-muted-foreground")}>
              <li className="flex items-start gap-2.5">
                <BadgeCheck className="mt-[0.6rem] h-4 w-4 shrink-0 text-[var(--primary)]" aria-hidden="true" />
                <span>They have read and understood this Agreement.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <BadgeCheck className="mt-[0.6rem] h-4 w-4 shrink-0 text-[var(--primary)]" aria-hidden="true" />
                <span>They agree to comply with all terms and conditions stated herein.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <BadgeCheck className="mt-[0.6rem] h-4 w-4 shrink-0 text-[var(--primary)]" aria-hidden="true" />
                <span>This Agreement is binding upon acceptance of work.</span>
              </li>
            </ul>
          </section>
        </div>

        <label
          className={cn(
            "flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
            hasReachedEnd
              ? "border-primary/35 bg-card"
              : "border-border bg-muted/40",
            ONBOARDING_FIELD_LABEL_CLASS,
          )}
        >
          <input
            type="checkbox"
            checked={isAgreementChecked}
            onChange={(event) => setIsAgreementChecked(event.target.checked)}
            disabled={!hasReachedEnd}
            className="h-4 w-4 rounded border-border bg-transparent text-primary focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <span>I have read and accept the Freelancer Agreement and Terms.</span>
        </label>

        <p className={cn("text-center", ONBOARDING_SECTION_DESCRIPTION_CLASS, "text-muted-foreground")}>
          {hasReachedEnd
            ? "Check the box to enable Agree & Continue."
            : "Scroll to the end to enable the confirmation checkbox."}
        </p>

        {continueButton}
      </div>
    </section>
  );
};

export default FreelancerCommunicationPolicySlide;
