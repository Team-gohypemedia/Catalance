import { cn } from "@/lib/utils";
import { iconForTrackSlug } from "./meta";

/**
 * Calm course cover: a soft warm tone, a faint highlight and one thin-line track icon.
 * Uses semantic tokens only, so it adapts to light and dark themes.
 */
const TONES = [
  "bg-primary-soft text-primary dark:bg-surface-2",
  "bg-surface-2 text-primary",
  "bg-accent-soft text-primary dark:bg-surface-3",
  "bg-surface-3 text-primary",
];

const SLUG_TONE = {
  "web-development": 0,
  "app-development": 1,
  "ui-ux-design": 2,
  "data-analytics": 3,
  "ai-automation": 0,
  "digital-marketing": 2,
  "content-writing": 1,
  "graphic-design": 0,
  "video-editing": 3,
  "excel-for-aspirants": 2,
  "translation-hindi-english": 1,
  "accounting-tally-gst": 3,
};

export function toneFor(slug = "") {
  if (slug in SLUG_TONE) return TONES[SLUG_TONE[slug]];
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}

/** <CalmCover slug="web-development" size="card|sm|xs" /> */
export function CalmCover({ slug, icon, size = "card", className, children }) {
  const Icon = icon || iconForTrackSlug(slug);
  const iconWrap = {
    card: "size-14",
    hero: "size-16",
    sm: "size-10",
    xs: "size-8",
  }[size];
  const iconSize = { card: "size-6", hero: "size-7", sm: "size-[18px]", xs: "size-4" }[size];
  return (
    <div className={cn("relative isolate flex items-center justify-center overflow-hidden", toneFor(slug), className)}>
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-70"
        style={{ background: "radial-gradient(120% 90% at 100% 0%, var(--surface) 0%, transparent 60%)" }}
      />
      <span className={cn("flex items-center justify-center rounded-full bg-surface/70 ring-1 ring-line", iconWrap)}>
        <Icon className={iconSize} strokeWidth={1.4} aria-hidden="true" />
      </span>
      {children}
    </div>
  );
}
