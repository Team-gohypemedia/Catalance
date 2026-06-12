import Layers from "lucide-react/dist/esm/icons/layers";

import { cn } from "@/shared/lib/utils";

/* ── PNG asset map by service name (light mode) ── */

const BASE = "https://assets.catalance.in/services";

const SERVICE_IMAGE_MAP = {
  advertising: `${BASE}/advertising.png`,
  "ai automation": `${BASE}/ai%20automation.png`,
  "app development": `${BASE}/app%20development.png`,
  branding: `${BASE}/branding.png`,
  "customer support": `${BASE}/customer%20support.png`,
  "influencer marketing": `${BASE}/influencer%20maketing.png`,
  "lead generation": `${BASE}/lead%20genration.png`,
  "paid advertising": `${BASE}/paid%20advertisment.png`,
  seo: `${BASE}/seo.png`,
  "social media management": `${BASE}/social%20media.png`,
  "software development": `${BASE}/software%20development.png`,
  "video services": `${BASE}/video%20service.png`,
  "web development": `${BASE}/web%20development.png`,
  "website development": `${BASE}/web%20development.png`,
  "whatsapp chatbot": `${BASE}/whatsapp%20chatbot.png`,
  "writing & content": `${BASE}/writing%20%26%20content.png`,
};

const resolveImage = (serviceName) => {
  const key = String(serviceName || "").toLowerCase().trim();
  return SERVICE_IMAGE_MAP[key] || null;
};

const resolveServiceKey = (service) =>
  String(service?.key || service?.name || service?.label || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

/* ── Service card icon: PNG if available, Lucide fallback ── */

const ServiceIcon = ({ serviceName, isSelected }) => {
  const imageSrc = resolveImage(serviceName);

  if (imageSrc) {
    return (
      <div
        className="mb-3 flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg"
        style={{ background: "transparent" }}
      >
        <img
          src={imageSrc}
          alt={serviceName}
          className="h-full w-full object-contain"
          draggable={false}
          style={{
            filter: isSelected ? "none" : "grayscale(0%)",
            opacity: isSelected ? 1 : 0.85,
            transition: "opacity 0.2s ease",
          }}
        />
      </div>
    );
  }

  return (
    <Layers
      className={cn(
        "mb-3 h-5 w-5",
        isSelected ? "text-primary" : "text-muted-foreground"
      )}
    />
  );
};

const FreelancerServicesSlide = ({
  slide,
  selectedServices,
  onToggleService,
  dbServices,
  continueButton,
}) => {
  const services = Array.isArray(dbServices) ? dbServices : [];

  return (
    <section className="mx-auto flex w-full max-w-[340px] flex-col items-center px-4 sm:max-w-[380px] md:max-w-6xl md:px-0">
      <div className="w-full space-y-8">
        <div className="text-center">
          <h1 className="text-xl md:text-4xl lg:text-5xl font-medium text-primary mb-1 md:mb-2 lg:mb-2">
            {slide.title}
          </h1>
          <p className="text-muted-foreground font-regular text-sm md:text-lg lg:text-base">
            {slide.description}
          </p>
        </div>

        {services.length > 0 ? (
          <div className="grid w-full grid-cols-2 justify-center gap-3.5 md:[grid-template-columns:repeat(3,172px)] xl:[grid-template-columns:repeat(5,172px)]">
            {services.map((service) => {
              const serviceKey = resolveServiceKey(service);
              const isSelected = selectedServices.includes(serviceKey);

              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => onToggleService(serviceKey)}
                  className={cn(
                    "flex aspect-[1.18] w-full flex-col items-center justify-center rounded-[18px] border bg-card px-3 py-2.5 text-center transition-all duration-200",
                    isSelected
                      ? "border-primary shadow-[0_0_0_1px_rgba(var(--brand-rgb),0.22)]"
                      : "border-border hover:border-primary/50"
                  )}
                  aria-pressed={isSelected}
                >
                  <ServiceIcon
                    serviceName={service.name}
                    isSelected={isSelected}
                  />
                  <span
                    className={cn(
                      "text-sm font-semibold leading-[1.3]",
                      isSelected ? "text-primary" : "text-foreground"
                    )}
                  >
                    {service.name}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card/40 px-5 py-4 text-center text-sm text-muted-foreground">
            Services are unavailable right now. Please try again.
          </div>
        )}
      </div>

      {continueButton}
    </section>
  );
};

export default FreelancerServicesSlide;
