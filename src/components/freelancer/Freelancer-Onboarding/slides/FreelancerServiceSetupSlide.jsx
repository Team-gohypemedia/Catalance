const FreelancerServiceSetupSlide = ({ currentServiceName = "Service" }) => (
  <section className="mx-auto flex min-h-[68vh] w-full max-w-6xl flex-col items-center justify-center px-4 text-center sm:min-h-[70vh] sm:px-6">
    <div>
      <h1 className="text-3xl md:text-5xl lg:text-6xl font-medium mb-1 md:mb-2 lg:mb-4">
        <span>Let&#39;s Start Your </span>
        <br className="hidden sm:block" />
        <span className="text-primary">{currentServiceName}</span>
        <span> Setup</span>
      </h1>

      <p className={`text-muted-foreground font-regular text-sm md:text-lg lg:text-base mx-auto max-w-sm sm:max-w-md md:max-w-xl lg:max-w-2xl`}>
        Quickly describe what you offer to get matched with clients. You can
        skip this for now.
      </p>
    </div>
  </section>
);

export default FreelancerServiceSetupSlide;
