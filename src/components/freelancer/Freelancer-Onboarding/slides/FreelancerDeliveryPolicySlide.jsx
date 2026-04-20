import BadgeCheck from "lucide-react/dist/esm/icons/badge-check";

const FreelancerDeliveryPolicySlide = () => (
  <section className="mx-auto flex min-h-[68vh] w-full max-w-6xl flex-col items-center justify-center px-4 sm:min-h-[70vh] sm:px-6">
    <div className="w-full max-w-5xl space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-balance text-3xl font-semibold tracking-[-0.03em] text-[#facc15] sm:text-4xl lg:text-[3rem] lg:leading-[1.06]">
          Do You Agree To Catalance Delivery &amp; Revision SOP?
        </h1>
      </div>

      <div className="rounded-2xl border border-white/10 bg-card p-6 sm:p-7">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-[#facc15]">Delivery &amp; Revision Policy</h2>
          <p className="text-base leading-8 text-[#e5e7eb]">
            Catalance follows a structured delivery and revision process to maintain
            fairness, transparency, and dispute protection for both clients and
            freelancers.
          </p>
        </div>

        <div className="mt-5 space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#facc15]/90">Key SOP Rules</h3>
          <ul className="space-y-2 text-base leading-8 text-[#e5e7eb]">
            <li className="flex items-start gap-3">
              <BadgeCheck className="mt-[0.55rem] h-4 w-4 shrink-0 text-[#facc15]" aria-hidden="true" />
              <span><span className="font-semibold text-white">Revision Limit:</span> Up to 3 revisions are included per milestone.</span>
            </li>
            <li className="flex items-start gap-3">
              <BadgeCheck className="mt-[0.55rem] h-4 w-4 shrink-0 text-[#facc15]" aria-hidden="true" />
              <span><span className="font-semibold text-white">Scope Changes:</span> Additional scope must follow the milestone modification SOP.</span>
            </li>
            <li className="flex items-start gap-3">
              <BadgeCheck className="mt-[0.55rem] h-4 w-4 shrink-0 text-[#facc15]" aria-hidden="true" />
              <span><span className="font-semibold text-white">Final Submission:</span> All final deliverables must be submitted through the Catalance milestone system.</span>
            </li>
            <li className="flex items-start gap-3">
              <BadgeCheck className="mt-[0.55rem] h-4 w-4 shrink-0 text-[#facc15]" aria-hidden="true" />
              <span><span className="font-semibold text-white">Progress Updates:</span> Reporting and project updates must follow the platform workflow.</span>
            </li>
          </ul>
        </div>
      </div>

    </div>
  </section>
);

export default FreelancerDeliveryPolicySlide;
