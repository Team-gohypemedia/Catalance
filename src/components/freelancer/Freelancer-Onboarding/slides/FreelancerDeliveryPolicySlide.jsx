import Loader2 from "lucide-react/dist/esm/icons/loader-2";

const FreelancerDeliveryPolicySlide = ({
  isProfileSaving,
  onDeliveryPolicyAgreeAndContinue,
}) => (
  <section className="mx-auto flex min-h-[68vh] w-full max-w-6xl flex-col items-center justify-center px-4 sm:min-h-[70vh] sm:px-6">
    <div className="w-full max-w-5xl space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-balance text-3xl font-semibold tracking-[-0.03em] text-[#facc15] sm:text-4xl lg:text-[3rem] lg:leading-[1.06]">
          Do You Agree To Catalance Delivery &amp; Revision SOP?
        </h1>
        <p className="text-sm text-[#d1d5db] sm:text-base">
          Required To Continue
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#4b4b4e]/95 p-6 sm:p-7">
        <p className="text-base leading-8 text-[#e5e7eb]">
          Catalance maintains standardized delivery and revision policies to ensure
          fairness, transparency, and dispute protection for both clients and
          freelancers.
        </p>

        <ul className="mt-5 list-disc space-y-2 pl-5 text-base leading-8 text-[#e5e7eb]">
          <li>Up to 3 revisions included per milestone.</li>
          <li>Scope changes are handled through milestone modification SOP.</li>
          <li>
            Final deliverables are submitted through the Catalance milestone
            system.
          </li>
          <li>Reporting and updates follow the platform workflow.</li>
        </ul>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onDeliveryPolicyAgreeAndContinue}
          disabled={isProfileSaving}
          className="inline-flex min-w-[230px] items-center justify-center gap-2 rounded-2xl bg-[#facc15] px-10 py-4 text-lg font-semibold text-black transition-colors hover:bg-[#f6c800] disabled:cursor-not-allowed disabled:bg-[#facc15]/70"
        >
          {isProfileSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {isProfileSaving ? "Saving..." : "Agree & Continue"}
        </button>
      </div>
    </div>
  </section>
);

export default FreelancerDeliveryPolicySlide;
