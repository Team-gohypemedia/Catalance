import Layers from "lucide-react/dist/esm/icons/layers";

import { cn } from "@/shared/lib/utils";
import { useTheme } from "@/components/providers/theme-provider";

/* ── PNG asset maps by service name ── */

const BASE = "https://assets.catalance.in/services";
const BASE_DARK = "https://assets.catalance.in/catalance%20gif%20dark";

const SERVICE_IMAGE_MAP_LIGHT = {
  advertising: `${BASE}/advertising.gif`,
  "ai automation": `${BASE}/ai%20automation.gif`,
  "app development": `${BASE}/app%20development.gif`,
  "branding kit": `${BASE}/branding.gif`,
  branding: `${BASE}/branding.gif`,
  "customer support": `${BASE}/customer%20support.gif`,
  "influencer marketing": `${BASE}/influencer%20maketing.gif`,
  "lead generation": `${BASE}/lead%20genration.gif`,
  "paid advertising": `${BASE}/paid%20advertisment.gif`,
  seo: `${BASE}/seo.gif`,
  "seo / gmb": `${BASE}/seo.gif`,
  "seo/gmb": `${BASE}/seo.gif`,
  "social media management": `${BASE}/social%20media.gif`,
  "social media marketing": `${BASE}/social%20media.gif`,
  "mobile app development": `${BASE}/app%20development.gif`,
  "software development": `${BASE}/software%20development.gif`,
  "video services": `${BASE}/video%20service.gif`,
  "web development": `${BASE}/web%20development.gif`,
  "website development": `${BASE}/web%20development.gif`,
  "whatsapp chatbot": `${BASE}/whatsapp%20chatbot.gif`,
  "writing & content": `${BASE}/writing%20%26%20content.gif`,
  "ugc marketing": `${BASE}/ugc%20marketing.gif`,
  "3d modeling": `${BASE}/3d-modeling.gif`,
  "3d animation/cgi videos/vfx": `${BASE}/cgicfx.gif`,
  "cgi / vfx": `${BASE}/cgicfx.gif`,
  "cgi video services": `${BASE}/cgicfx.gif`,
  "creative & design": `${BASE}/creative%20design.gif`,
  "crm & erp": `${BASE}/crm-epr.gif`,
  "crm & erp solutions": `${BASE}/crm-epr.gif`,
  "voice agent": `${BASE}/ai%20voice.gif`,
  "voice ai / ai calling": `${BASE}/ai%20voice.gif`,
  "voice agent / ai calling": `${BASE}/ai%20voice.gif`,
};

const SERVICE_IMAGE_MAP_DARK = {
  advertising: `${BASE_DARK}/advertising.gif`,
  "ai automation": `${BASE_DARK}/ai%20automation.gif`,
  "app development": `${BASE_DARK}/app%20dev.gif`,
  "branding kit": `${BASE_DARK}/brand-kit.gif`,
  branding: `${BASE_DARK}/brand-kit.gif`,
  "customer support": `${BASE_DARK}/customer%20services.gif`,
  "influencer marketing": `${BASE_DARK}/influencer%20marketign.gif`,
  "lead generation": `${BASE_DARK}/lead%20gen.gif`,
  "paid advertising": `${BASE_DARK}/paid%20advertisign.gif`,
  seo: `${BASE_DARK}/seo.gif`,
  "seo / gmb": `${BASE_DARK}/seo.gif`,
  "seo/gmb": `${BASE_DARK}/seo.gif`,
  "social media management": `${BASE_DARK}/social-media.gif`,
  "social media marketing": `${BASE_DARK}/social-media.gif`,
  "mobile app development": `${BASE_DARK}/app%20dev.gif`,
  "software development": `${BASE_DARK}/software%20dev.gif`,
  "video services": `${BASE_DARK}/video%20services.gif`,
  "web development": `${BASE_DARK}/software.gif`,
  "website development": `${BASE_DARK}/software.gif`,
  "whatsapp chatbot": `${BASE_DARK}/chat-bot.gif`,
  "writing & content": `${BASE_DARK}/writing.gif`,
  "3d modeling": `${BASE_DARK}/3d-modeling.gif`,
  "creative & design": `${BASE_DARK}/creative-design.gif`,
  "crm & erp": `${BASE_DARK}/crm-erp.gif`,
  "crm & erp solutions": `${BASE_DARK}/crm-erp.gif`,
  "ugc marketing": `${BASE_DARK}/ugc-marketing.gif`,
  "3d animation/cgi videos/vfx": `${BASE_DARK}/cgi-vfx.gif`,
  "cgi / vfx": `${BASE_DARK}/cgi-vfx.gif`,
  "cgi video services": `${BASE_DARK}/cgi-vfx.gif`,
  "voice agent": `${BASE_DARK}/voice-assistant.gif`,
  "voice ai / ai calling": `${BASE_DARK}/voice-assistant.gif`,
  "voice agent / ai calling": `${BASE_DARK}/voice-assistant.gif`,
};

const resolveImage = (serviceName, isDark) => {
  const key = String(serviceName || "").toLowerCase().trim();
  const map = isDark ? SERVICE_IMAGE_MAP_DARK : SERVICE_IMAGE_MAP_LIGHT;
  return map[key] || null;
};

const resolveServiceKey = (service) =>
  String(service?.key || service?.name || service?.label || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

/* ── Service card icon: PNG if available, Lucide fallback ── */

const ServiceIcon = ({ serviceName, isSelected }) => {
  const { isDark } = useTheme();
  const imageSrc = resolveImage(serviceName, isDark);

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

const renderTitle = (title) => {
  if (typeof title !== "string") return title;

  // Highlight "Help Clients" if present
  let target = "Help Clients";
  let index = title.indexOf(target);
  if (index !== -1) {
    const before = title.slice(0, index);
    const after = title.slice(index + target.length);
    return (
      <>
        {before}
        <span className="text-primary">{target}</span>
        {after}
      </>
    );
  }

  // Highlight "Services" or "services" if present
  target = title.includes("Services") ? "Services" : title.includes("services") ? "services" : null;
  if (target) {
    index = title.indexOf(target);
    const before = title.slice(0, index);
    const after = title.slice(index + target.length);
    return (
      <>
        {before}
        <span className="text-primary">{target}</span>
        {after}
      </>
    );
  }

  return title;
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
    <section className="mx-auto flex w-full max-w-[340px] flex-col items-center px-4 mt-[10px] sm:max-w-[600px] md:max-w-6xl md:px-0 mt-[20px] sm:mt-0">
      <div className="w-full space-y-8">
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-medium text-foreground mb-1 md:mb-2 lg:mb-2 sm:whitespace-nowrap md:whitespace-normal">
            {renderTitle(slide.title)}
          </h1>
          <p className="text-muted-foreground font-regular text-sm md:text-lg lg:text-base">
            {slide.description}
          </p>
        </div>

        {services.length > 0 ? (
          <div className="grid w-full grid-cols-2 justify-center gap-3.5 sm:[grid-template-columns:repeat(3,172px)] xl:[grid-template-columns:repeat(5,172px)]">
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
                    {service.name === "App Development"
                      ? "Mobile App Development"
                      : service.name === "Social Media Management"
                      ? "Social Media Marketing"
                      : service.name}
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
