import {
  ONBOARDING_SERVICE_SETUP_TITLE_CLASS,
  ONBOARDING_PAGE_SUBTITLE_CLASS,
} from "../typography";

const FreelancerServiceSetupSlide = ({ currentServiceName = "Service" }) => (
  <section className="mx-auto flex min-h-[68vh] w-full max-w-6xl flex-col items-center justify-center px-4 text-center sm:min-h-[70vh] sm:px-6">
    <div className="space-y-5 sm:space-y-6">
      <h1 className={ONBOARDING_SERVICE_SETUP_TITLE_CLASS}>
        <span>Let&#39;s Start Your </span>
        <br className="hidden sm:block" />
        <span className="text-primary">{currentServiceName}</span>
        <span> Setup</span>
      </h1>

      <p className={`mx-auto max-w-3xl text-pretty ${ONBOARDING_PAGE_SUBTITLE_CLASS} text-muted-foreground`}>
        Provide the details of what you&#39;ll offer. It only takes a few
        minutes and will help you get matched with clients. You can skip this
        for now if you&#39;re not ready to start.
      </p>
    </div>
  </section>
);

export default FreelancerServiceSetupSlide;
