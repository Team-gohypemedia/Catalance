import { applyServiceTemplate } from "@/shared/lib/freelancer-onboarding-content";

const FreelancerServiceSetupSlide = ({
  currentServiceName = "Service",
  onboardingContent,
}) => {
  const title = applyServiceTemplate(
    onboardingContent?.serviceSetup?.titleTemplate ||
      "Let's Start Your {serviceName} Setup",
    currentServiceName,
  );
  const description =
    onboardingContent?.serviceSetup?.description ||
    "Describe your services to get matched with clients.";

  return (
    <section className="mx-auto flex min-h-[68vh] w-full max-w-6xl flex-col items-center justify-center px-4 text-center sm:min-h-[70vh] sm:px-6">
      <div>
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-medium mb-1 md:mb-2 lg:mb-4">
          {title}
        </h1>

        <p className="text-muted-foreground font-regular text-sm md:text-lg lg:text-base mx-auto max-w-sm sm:max-w-md md:max-w-xl lg:max-w-2xl">
          {description}
        </p>
      </div>
    </section>
  );
};

export default FreelancerServiceSetupSlide;
