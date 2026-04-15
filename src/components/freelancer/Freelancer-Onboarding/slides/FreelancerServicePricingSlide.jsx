import {
  ServiceInfoStepper,
  CustomSelect,
} from "./shared/ServiceInfoComponents";

const DELIVERY_TIMELINE_OPTIONS = [
  { value: "1_day", label: "1 Day" },
  { value: "2_3_days", label: "2–3 Days" },
  { value: "1_week", label: "1 Week" },
  { value: "2_weeks", label: "2 Weeks" },
  { value: "1_month", label: "1 Month" },
  { value: "2_months", label: "2 Months" },
  { value: "3_months", label: "3+ Months" },
  { value: "ongoing", label: "Ongoing / Retainer" },
];

const PRICE_RANGE_OPTIONS = [
  { value: "under_5k", label: "Under ₹5,000" },
  { value: "5k_15k", label: "₹5,000 – ₹15,000" },
  { value: "15k_30k", label: "₹15,000 – ₹30,000" },
  { value: "30k_50k", label: "₹30,000 – ₹50,000" },
  { value: "50k_1l", label: "₹50,000 – ₹1,00,000" },
  { value: "1l_3l", label: "₹1,00,000 – ₹3,00,000" },
  { value: "3l_plus", label: "₹3,00,000+" },
  { value: "custom", label: "Custom / Negotiable" },
];

/* ──────────────────── Main Slide ──────────────────── */

const FreelancerServicePricingSlide = ({
  selectedServices,
  dbServices,
  servicePricingForm,
  onServicePricingFieldChange,
}) => {
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
    <section className="mx-auto flex w-full max-w-4xl flex-col items-center">
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
          <ServiceInfoStepper activeStepId="pricing" />
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

            {/* Price */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                Price
              </label>
              <CustomSelect
                value={servicePricingForm.priceRange}
                onChange={(val) =>
                  onServicePricingFieldChange("priceRange", val)
                }
                options={PRICE_RANGE_OPTIONS}
                placeholder="Select price range"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FreelancerServicePricingSlide;
