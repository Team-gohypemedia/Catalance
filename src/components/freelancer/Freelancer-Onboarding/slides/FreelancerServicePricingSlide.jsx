import {
  ServiceInfoStepper,
  CustomSelect,
} from "./shared/ServiceInfoComponents";

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
}) => {
  const serviceName = currentServiceName || "Service";

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col items-center">
      <div className="w-full space-y-8">
        {/* Heading */}
        <div className="text-center">
          <h1 className="text-balance text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl lg:text-[3.1rem] lg:leading-[1.04]">
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
        <div className="w-full space-y-7">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">
              Set Your Price
            </h2>
            <p className="text-sm text-muted-foreground sm:text-base">
              Provide the details of the service you will offer.
            </p>
          </div>

          <div className="space-y-6 rounded-2xl border border-white/8 bg-card/50 p-5 sm:p-7">
            {/* Service Description */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                Service Description
              </label>
              <textarea
                value={servicePricingForm.description}
                onChange={(e) =>
                  onServicePricingFieldChange("description", e.target.value)
                }
                placeholder="Description..."
                rows={4}
                className="w-full resize-none rounded-xl border border-white/10 bg-card px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              />
            </div>

            {/* Delivery Timeline */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                Delivery Timeline
              </label>
              <CustomSelect
                value={servicePricingForm.deliveryTimeline}
                onChange={(val) =>
                  onServicePricingFieldChange("deliveryTimeline", val)
                }
                options={DELIVERY_TIMELINE_OPTIONS}
                placeholder="Select delivery time"
              />
            </div>

            {/* Starting Price */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                Starting Price
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-white/40">₹</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={servicePricingForm.priceRange || ""}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D/g, "");
                    onServicePricingFieldChange("priceRange", digitsOnly);
                  }}
                  placeholder="Enter starting price"
                  className="w-full rounded-xl border border-white/10 bg-card pl-8 pr-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FreelancerServicePricingSlide;
