import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";
import {
  applyServiceTemplate,
  DEFAULT_FREELANCER_ONBOARDING_CONTENT,
  resolveServicePricingFields,
} from "@/shared/lib/freelancer-onboarding-content";
import {
  ONBOARDING_FIELD_LABEL_CLASS,
  ONBOARDING_SERVICE_SKIP_BUTTON_CLASS,
} from "../typography";
import { ServiceInfoStepper, CustomSelect } from "./shared/ServiceInfoComponents";

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

const fieldClassName =
  "h-10 w-full rounded-xl border bg-card px-4 !text-[14px] !leading-5 text-foreground outline-none transition-colors placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground/50 placeholder:font-normal [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 [&::placeholder]:font-normal focus:ring-1";
const textareaClassName =
  "w-full resize-none rounded-xl border bg-card px-4 py-3 !text-[14px] !leading-5 text-foreground outline-none transition-colors placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground/50 placeholder:font-normal [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 [&::placeholder]:font-normal focus:ring-1";

const FreelancerServicePricingSlide = ({
  currentServiceName,
  onboardingContent,
  servicePricingFields = [],
  serviceDraft,
  servicePricingForm,
  onServicePricingFieldChange,
  onServiceStepChange,
  onSkipServices,
  servicePricingValidationErrors = {},
  continueButton,
}) => {
  const serviceName = currentServiceName || "Service";
  const pricingContent =
    onboardingContent?.servicePricing ||
    DEFAULT_FREELANCER_ONBOARDING_CONTENT.servicePricing;
  const stepperSteps =
    onboardingContent?.stepper?.steps ||
    DEFAULT_FREELANCER_ONBOARDING_CONTENT.stepper.steps;
  const resolvedFields =
    Array.isArray(servicePricingFields) && servicePricingFields.length > 0
      ? servicePricingFields
      : resolveServicePricingFields(onboardingContent);
  const fieldMap = Object.fromEntries(resolvedFields.map((field) => [field.id, field]));
  const deliveryTimelineOptions =
    fieldMap.deliveryTimeline?.options ||
    pricingContent?.fields?.deliveryTimeline?.options ||
    DELIVERY_TIMELINE_OPTIONS;
  const customPricingFields = resolvedFields.filter(
    (field) =>
      !["description", "deliveryTimeline", "priceRange"].includes(field.id) &&
      field.visible !== false,
  );

  const renderInputField = (field, value, error, onChange, { numeric = false } = {}) => (
    <div className="space-y-0">
      <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
        {field.label}
      </label>
      <div className="relative">
        {field.prefix ? (
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-muted-foreground/50">
            {field.prefix}
          </span>
        ) : null}
        <input
          type="text"
          inputMode={numeric ? "numeric" : undefined}
          value={value}
          onChange={(event) =>
            onChange(numeric ? event.target.value.replace(/\D/g, "") : event.target.value)
          }
          placeholder={field.placeholder || ""}
          className={cn(
            fieldClassName,
            field.prefix ? "pl-8 pr-4" : "",
            error
              ? "border-destructive/70 focus:border-destructive/60 focus:ring-destructive/20"
              : "border-border focus:border-primary/50 focus:ring-primary/20",
          )}
          aria-invalid={Boolean(error)}
        />
      </div>
      {error ? <p className="mt-1 text-sm text-destructive">{error}</p> : null}
    </div>
  );

  const renderTextareaField = (field, value, error, onChange) => (
    <div className="space-y-0">
      <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
        {field.label}
      </label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder || ""}
        rows={4}
        className={cn(
          textareaClassName,
          error
            ? "border-destructive/70 focus:border-destructive/60 focus:ring-destructive/20"
            : "border-border focus:border-primary/50 focus:ring-primary/20",
        )}
        aria-invalid={Boolean(error)}
      />
      {error ? <p className="mt-1 text-sm text-destructive">{error}</p> : null}
    </div>
  );

  const renderSelectField = (field, value, error, onChange, options = []) => (
    <div className="space-y-0">
      <label className={cn(ONBOARDING_FIELD_LABEL_CLASS, "mb-1 block")}>
        {field.label}
      </label>
      <CustomSelect
        value={value}
        onChange={onChange}
        options={options}
        placeholder={field.placeholder || "Select option"}
        hasError={Boolean(error)}
        className="h-10"
      />
      {error ? <p className="mt-1 text-sm text-destructive">{error}</p> : null}
    </div>
  );

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col items-center">
      <div className="w-full space-y-8">
        <div className="text-center">
          <h1 className={ONBOARDING_PAGE_TITLE_CLASS}>
            {applyServiceTemplate(pricingContent?.headingTitleTemplate, serviceName)}
          </h1>
        </div>

        <div className="mx-auto w-full max-w-3xl">
          <ServiceInfoStepper
            activeStepId="pricing"
            onStepChange={onServiceStepChange}
            steps={stepperSteps}
          />
        </div>

        <div className="mx-auto w-full max-w-3xl space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <h2 className={cn(ONBOARDING_SECTION_TITLE_CLASS, "text-foreground")}>
                {pricingContent?.sectionTitle || "Set Your Price"}
              </h2>
              <p className={cn(ONBOARDING_SECTION_DESCRIPTION_CLASS, "text-muted-foreground")}>
                {pricingContent?.sectionDescription || "Provide the details of the service you will offer."}
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

          <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
            {fieldMap.description?.visible !== false
              ? renderTextareaField(
                  fieldMap.description,
                  servicePricingForm.description,
                  String(servicePricingValidationErrors.description || "").trim(),
                  (value) => onServicePricingFieldChange("description", value),
                )
              : null}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {fieldMap.deliveryTimeline?.visible !== false
                ? renderSelectField(
                    fieldMap.deliveryTimeline,
                    servicePricingForm.deliveryTimeline,
                    String(servicePricingValidationErrors.deliveryTimeline || "").trim(),
                    (value) => onServicePricingFieldChange("deliveryTimeline", value),
                    deliveryTimelineOptions,
                  )
                : null}

              {fieldMap.priceRange?.visible !== false
                ? renderInputField(
                    fieldMap.priceRange,
                    servicePricingForm.priceRange || "",
                    String(servicePricingValidationErrors.priceRange || "").trim(),
                    (value) => onServicePricingFieldChange("priceRange", value),
                    { numeric: true },
                  )
                : null}
            </div>

            {customPricingFields.map((field) => {
              const value = serviceDraft?.customFields?.servicePricing?.[field.id] ?? "";
              const error = String(servicePricingValidationErrors[field.id] || "").trim();

              if (field.type === "textarea") {
                return renderTextareaField(field, value, error, (nextValue) =>
                  onServicePricingFieldChange(field.id, nextValue),
                );
              }

              if (field.type === "select") {
                return renderSelectField(
                  field,
                  value,
                  error,
                  (nextValue) => onServicePricingFieldChange(field.id, nextValue),
                  field.options || [],
                );
              }

              return renderInputField(field, value, error, (nextValue) =>
                onServicePricingFieldChange(field.id, nextValue),
              );
            })}
          </div>
        </div>
      </div>

      {continueButton}
    </section>
  );
};

export default FreelancerServicePricingSlide;
