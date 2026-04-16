const FreelancerServiceSetupSlide = ({ selectedServices, dbServices }) => {
  const firstServiceId =
    Array.isArray(selectedServices) && selectedServices.length > 0
      ? selectedServices[0]
      : null;

  const firstService =
    firstServiceId && Array.isArray(dbServices)
      ? dbServices.find((s) => s.id === firstServiceId)
      : null;

  const serviceName = firstService?.name ?? "Service";

  return (
    <section className="mx-auto flex min-h-[68vh] w-full max-w-5xl flex-col items-center justify-center px-4 text-center sm:min-h-[70vh] sm:px-6">
      <div className="space-y-5 sm:space-y-6">
        <h1 className="text-balance text-4xl font-semibold tracking-[-0.045em] text-white sm:text-5xl lg:text-[4.65rem] lg:leading-[1.02]">
          <span>Let&#39;s Start Your </span>
          <br className="hidden sm:block" />
          <span className="text-primary">{serviceName}</span>
          <span> Setup</span>
        </h1>

        <p className="mx-auto max-w-3xl text-pretty text-base leading-8 text-muted-foreground sm:text-lg">
          Provide the details of what you&#39;ll offer. It only takes a few
          minutes and will help you get matched with clients. You can skip this
          for now if you&#39;re not ready to start.
        </p>
      </div>
    </section>
  );
};

export default FreelancerServiceSetupSlide;
