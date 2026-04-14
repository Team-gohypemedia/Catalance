import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import Settings from "lucide-react/dist/esm/icons/settings";

import { Button } from "@/components/ui/button";
import { updateProfile } from "@/shared/lib/api-client";

import { FREELANCER_ONBOARDING_SLIDES } from "./constants";
import FreelancerWelcomeSlide from "./slides/FreelancerWelcomeSlide";
import FreelancerWorkPreferenceSlide from "./slides/FreelancerWorkPreferenceSlide";
import FreelancerIndividualProofSlide from "./slides/FreelancerIndividualProofSlide";
import FreelancerBasicProfileSlide from "./slides/FreelancerBasicProfileSlide";
import FreelancerServicesSlide from "./slides/FreelancerServicesSlide";

const slideRegistry = {
  welcome: FreelancerWelcomeSlide,
  workPreference: FreelancerWorkPreferenceSlide,
  individualProof: FreelancerIndividualProofSlide,
  basicProfile: FreelancerBasicProfileSlide,
  services: FreelancerServicesSlide,
};

const FreelancerOnboardingShell = () => {
  const navigate = useNavigate();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedWorkPreference, setSelectedWorkPreference] = useState("");
  const [basicProfileForm, setBasicProfileForm] = useState({
    username: "artisan_max",
    profileDetails: "",
    country: "India",
    state: "Maharashtra",
    language: "",
  });
  const [selectedServices, setSelectedServices] = useState([]);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");

  const totalSlides = FREELANCER_ONBOARDING_SLIDES.length;
  const currentSlide =
    FREELANCER_ONBOARDING_SLIDES[currentSlideIndex] ||
    FREELANCER_ONBOARDING_SLIDES[0];
  const ActiveSlide = slideRegistry[currentSlide.id];
  const progressValue =
    currentSlide.progressValue ??
    ((currentSlideIndex + 1) / Math.max(totalSlides, 1)) * 100;
  const isFirstSlide = currentSlideIndex === 0;
  const isLastSlide = currentSlideIndex >= totalSlides - 1;
  const isWorkPreferenceSlide = currentSlide.id === "workPreference";
  const isServicesSlide = currentSlide.id === "services";
  const isProfileActionFooter = currentSlide.footerMode === "profileActions";
  const isContinueDisabled = isWorkPreferenceSlide
    ? selectedWorkPreference !== "individual"
    : isServicesSlide
      ? selectedServices.length === 0
      : false;

  const handleBack = () => {
    if (isFirstSlide) {
      return;
    }

    setCurrentSlideIndex((currentIndex) => Math.max(currentIndex - 1, 0));
  };

  const handleContinue = () => {
    if (isContinueDisabled) {
      return;
    }

    if (isLastSlide) {
      navigate("/freelancer");
      return;
    }

    setCurrentSlideIndex((currentIndex) =>
      Math.min(currentIndex + 1, totalSlides - 1)
    );
  };

  const handleWorkPreferenceSelect = (nextValue) => {
    setSelectedWorkPreference(nextValue);

    if (nextValue === "individual" && isWorkPreferenceSlide) {
      setCurrentSlideIndex((currentIndex) =>
        Math.min(currentIndex + 1, totalSlides - 1)
      );
    }
  };

  const handleBasicProfileFieldChange = (field, value) => {
    const normalizedValue =
      field === "username"
        ? value.toLowerCase().replace(/[^a-z0-9_]/g, "")
        : value;

    setBasicProfileForm((currentForm) => ({
      ...currentForm,
      [field]: normalizedValue,
    }));
  };

  const handleServiceToggle = (serviceId) => {
    setSelectedServices((current) =>
      current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId]
    );
  };

  const handleBasicProfileSkip = () => {
    navigate("/freelancer");
  };

  const handleBasicProfileNext = async () => {
    setProfileError("");
    if (currentSlide.id === "basicProfile") {
      setIsProfileSaving(true);
      try {
        await updateProfile({
          freelancerProfile: {
            username: basicProfileForm.username,
            profileDetails: basicProfileForm.profileDetails,
            country: basicProfileForm.country,
            state: basicProfileForm.state,
            language: basicProfileForm.language,
            profileRole: selectedWorkPreference || "individual",
          },
        });
        setIsProfileSaving(false);
        setCurrentSlideIndex((currentIndex) =>
          Math.min(currentIndex + 1, totalSlides - 1)
        );
      } catch (err) {
        setIsProfileSaving(false);
        setProfileError(err.message || "Failed to save profile");
      }
    } else {
      setCurrentSlideIndex((currentIndex) =>
        Math.min(currentIndex + 1, totalSlides - 1)
      );
    }
  };

  const footerPrimaryAction = isProfileActionFooter
    ? handleBasicProfileNext
    : handleContinue;
  const footerPrimaryLabel = isProfileActionFooter
    ? "Continue"
    : currentSlide.continueLabel || "Continue";
  const footerPrimaryDisabled = isProfileActionFooter
    ? false
    : isContinueDisabled;

  return (
    <main className="relative flex h-screen min-h-screen flex-col overflow-hidden bg-background text-[#f1f5f9] h-[100dvh]">
      <header className="relative z-20 shrink-0 border-b border-white/8 bg-card">
        <div
          className="absolute left-0 top-0 h-1 bg-[#facc15] transition-all duration-300"
          style={{ width: `${progressValue}%` }}
        />
        <div className="relative flex items-center justify-between px-4 py-4 sm:px-6">
          {isFirstSlide ? (
            <Button
              asChild
              variant="secondary"
              className="h-10 rounded-full border border-white/10 bg-card px-4 text-sm font-semibold text-foreground shadow-none hover:bg-accent/10"
            >
              <Link to="/freelancer">
                <ChevronLeft className="h-4 w-4" />
                Back to dashboard
              </Link>
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={handleBack}
              className="h-10 w-10 rounded-full border border-white/10 bg-card text-foreground shadow-none hover:bg-accent/10"
              aria-label={`Go back to slide ${currentSlideIndex}`}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}

          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-10 w-10 rounded-full border border-white/10 bg-card text-foreground shadow-none hover:bg-accent/10"
            aria-label={`Onboarding settings for slide ${currentSlideIndex + 1} of ${totalSlides}`}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <section className="subtle-scrollbar relative min-h-0 flex-1 overflow-y-auto">
        <div className="min-h-full px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          {profileError && (
            <div className="mb-4 rounded-xl bg-red-900/60 px-4 py-3 text-sm text-red-200">
              {profileError}
            </div>
          )}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="w-full"
            >
              <ActiveSlide
                slide={currentSlide}
                selectedWorkPreference={selectedWorkPreference}
                onSelectWorkPreference={handleWorkPreferenceSelect}
                basicProfileForm={basicProfileForm}
                onBasicProfileFieldChange={handleBasicProfileFieldChange}
                selectedServices={selectedServices}
                onToggleService={handleServiceToggle}
                onBasicProfileBack={handleBack}
                onBasicProfileSkip={handleBasicProfileSkip}
                onBasicProfileNext={handleBasicProfileNext}
                isProfileSaving={isProfileSaving}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <footer className="relative z-20 shrink-0 border-t border-white/8 bg-card px-4 py-4 sm:px-6">
        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div />

          <Button
            type="button"
            size="lg"
            onClick={footerPrimaryAction}
            disabled={footerPrimaryDisabled}
            className="px-10"
          >
            {footerPrimaryLabel}
          </Button>

          {isProfileActionFooter ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleBasicProfileSkip}
              className="justify-self-end bg-card px-10 text-base font-medium text-white hover:bg-accent/10"
            >
              Skip for now
            </Button>
          ) : (
            <div />
          )}
        </div>
      </footer>
    </main>
  );
};

export default FreelancerOnboardingShell;
