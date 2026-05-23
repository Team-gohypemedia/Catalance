import {
  ServiceInfoStepper,
  CustomSelect,
} from "./shared/ServiceInfoComponents";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";
import {
  ONBOARDING_FIELD_LABEL_CLASS,
  ONBOARDING_SERVICE_SKIP_BUTTON_CLASS,
} from "../typography";

const ONBOARDING_PAGE_TITLE_CLASS =
  "text-balance text-[34px] font-semibold leading-[1.08] tracking-[-0.04em] sm:text-[40px]";
const ONBOARDING_SECTION_TITLE_CLASS = "text-2xl font-medium leading-tight tracking-[-0.02em]";
const ONBOARDING_SECTION_DESCRIPTION_CLASS = "text-base font-normal leading-7";

const DELIVERY_TIMELINE_OPTIONS = [
  { value: "1_week", label: "1 Week" },
  { value: "2_weeks", label: "2 Weeks" },
  { value: "3_weeks", label: "3 Weeks" },
  { value: "4_weeks", label: "4 Weeks" },
  { value: "6_weeks", label: "6 Weeks" },
  { value: "8_weeks", label: "8 Weeks" },
  { value: "12_weeks", label: "12 Weeks" },
  { value: "ongoing", label: "Ongoing / Retainer" },
];



/* ──────────────────── Main Slide ──────────────────── */

const FreelancerServicePricingSlide = ({
  currentServiceName,
  servicePricingForm,
  onServicePricingFieldChange,
  onServiceStepChange,
  onSkipServices,
  servicePricingValidationErrors = {},
}) => {
  const serviceName = currentServiceName || "Service";
  const descriptionError = String(servicePricingValidationErrors.description || "").trim();
  const deliveryTimelineError = String(
    servicePricingValidationErrors.deliveryTimeline || "",
  ).trim();
  const priceRangeError = String(servicePricingValidationErrors.priceRange || "").trim();

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col items-center">
      <div className="w-full space-y-8">
        {/* Heading */}
        <div className="text-center">
          <h1 className={ONBOARDING_PAGE_TITLE_CLASS}>
            <span>Set Your </span>
            <span className="text-primary">{serviceName}</span>
            <span> Service Price</span>
          </h1>
        </div>

        {/* Stepper */}
        <div className="w-full">
          <ServiceInfoStepper
            activeStepId="pricing"
            onStepChange={onServiceStepChange}
          />
        </div>

        {/* Step Content */}
        <div className="w-full space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <h2 className={cn(ONBOARDING_SECTION_TITLE_CLASS, "text-foreground")}>
                Set Your Price
              </h2>
              <p className={cn(ONBOARDING_SECTION_DESCRIPTION_CLASS, "text-muted-foreground")}>
                Provide the details of the service you will offer.
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onSkipServices?.()}
              className={cn(
                ONBOARDING_SERVICE_SKIP_BUTTON_CLASS,
                "self-start px-3 py-2 text-sm sm:px-6 sm:py-0 sm:text-base",
              )}
            >
              Skip
            </Button>
          </div>

          <div className="space-y-6 rounded-2xl border border-border bg-card p-5 sm:p-7">
            {/* Service Description */}
            <div className="space-y-0">
              <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
                Service Description
              </label>
              <textarea
                value={servicePricingForm.description}
                onChange={(e) =>
                  onServicePricingFieldChange("description", e.target.value)
                }
                placeholder="Description..."
                rows={4}
                className={cn(
                  "w-full resize-none rounded-xl border bg-card px-4 py-3 !text-[14px] !leading-5 text-foreground outline-none transition-colors placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 focus:ring-1",
                  descriptionError
                    ? "border-destructive/70 focus:border-destructive/60 focus:ring-destructive/20"
                    : "border-border focus:border-primary/50 focus:ring-primary/20",
                )}
                aria-invalid={Boolean(descriptionError)}
              />
              {descriptionError ? (
                <p className="mt-1 text-sm text-destructive">{descriptionError}</p>
              ) : null}
            </div>

            {/* Delivery Timeline */}
            <div className="space-y-0">
              <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
                Delivery Timeline
              </label>
              <CustomSelect
                value={servicePricingForm.deliveryTimeline}
                onChange={(val) =>
                  onServicePricingFieldChange("deliveryTimeline", val)
                }
                options={DELIVERY_TIMELINE_OPTIONS}
                placeholder="Select delivery time"
                hasError={Boolean(deliveryTimelineError)}
              />
              {deliveryTimelineError ? (
                <p className="mt-1 text-sm text-destructive">
                  {deliveryTimelineError}
                </p>
              ) : null}
            </div>

            {/* Starting Price */}
            <div className="space-y-0">
              <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
                Starting Price
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-muted-foreground/50">₹</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={servicePricingForm.priceRange || ""}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D/g, "");
                  onServicePricingFieldChange("priceRange", digitsOnly);
                  }}
                  placeholder="Enter starting price"
                  className={cn(
                    "w-full rounded-xl border bg-card pl-8 pr-4 py-3 !text-[14px] !leading-5 text-foreground outline-none transition-colors placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 focus:ring-1",
                    priceRangeError
                      ? "border-destructive/70 focus:border-destructive/60 focus:ring-destructive/20"
                      : "border-border focus:border-primary/50 focus:ring-primary/20",
                  )}
                  aria-invalid={Boolean(priceRangeError)}
                />
              </div>
              {priceRangeError ? (
                <p className="mt-1 text-sm text-destructive">{priceRangeError}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FreelancerServicePricingSlide;
