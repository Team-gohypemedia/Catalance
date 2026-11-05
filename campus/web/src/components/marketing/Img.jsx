import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { PHOTOS, photoSrc, photoSrcSet } from "./photos";

export const UNSPLASH_URL = "https://unsplash.com/?utm_source=catalance_campus&utm_medium=referral";

/** Resolve a PHOTOS key or a photo object. */
export const resolvePhoto = (photo) => (typeof photo === "string" ? PHOTOS[photo] : photo) || null;

/** "Photo: Name / Unsplash" attribution (Unsplash API guidelines). */
export function PhotoCredit({ photo, className }) {
  const p = resolvePhoto(photo);
  if (!p?.credit) return null;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] leading-4 text-white/90 backdrop-blur", className)}>
      Photo:
      <a href={p.credit.url} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none">
        {p.credit.name}
      </a>
      /
      <a href={UNSPLASH_URL} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none">
        Unsplash
      </a>
    </span>
  );
}

const CREDIT_POS = {
  br: "right-2 bottom-2",
  tr: "top-2 right-2",
  bl: "bottom-2 left-2",
  tl: "top-2 left-2",
};

/**
 * Marketing photo (hotlinked from Unsplash via photos.js): aspect-ratio box, responsive srcSet,
 * lazy loading, the photo's dominant colour as placeholder, object-cover with an adjustable focus.
 * Falls back to a soft brand-tinted icon tile if the photo is missing or fails.
 *
 * <Img photo="graduate" ratio="4/3" sizes="(min-width:1024px) 33vw, 100vw" position="50% 30%" credit="br">…overlays…</Img>
 *
 * credit: "br" | "tr" | "bl" | "tl" | false — shows "Photo: Name / Unsplash" on hover or keyboard focus
 * (always on touch screens, where hover doesn't exist).
 */
export function Img({
  photo,
  alt,
  ratio = "4/3",
  sizes = "100vw",
  widths = [480, 800, 1200, 1600],
  icon: Icon = ImageIcon,
  priority = false,
  position = "center",
  credit = "br",
  className,
  imgClassName,
  children,
}) {
  const p = resolvePhoto(photo);
  const [state, setState] = useState(p ? "loading" : "error");
  useEffect(() => setState(p ? "loading" : "error"), [p]);
  const label = alt ?? p?.alt ?? "";

  return (
    <div
      className={cn("group/photo relative isolate overflow-hidden rounded-2xl border border-line bg-surface-2", className)}
      style={{ aspectRatio: ratio || undefined, backgroundColor: state !== "error" && p?.color ? p.color : undefined }}
    >
      {state !== "error" && (
        <img
          src={photoSrc(p, 1200)}
          srcSet={photoSrcSet(p, widths)}
          sizes={sizes}
          alt={label}
          width={p.width}
          height={p.height}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchpriority={priority ? "high" : undefined}
          onLoad={() => setState("loaded")}
          onError={() => setState("error")}
          style={{ objectPosition: position }}
          className={cn(
            "absolute inset-0 -z-10 size-full object-cover transition-opacity duration-700 motion-reduce:transition-none",
            state === "loaded" ? "opacity-100" : "opacity-0",
            imgClassName,
          )}
        />
      )}
      {state === "error" && (
        <div
          role={label ? "img" : undefined}
          aria-label={label || undefined}
          className="absolute inset-0 -z-10 flex items-center justify-center bg-[radial-gradient(ellipse_at_30%_20%,var(--primary-soft),var(--surface-2)_70%)]"
        >
          <span className="flex size-14 items-center justify-center rounded-full bg-surface/70 text-primary/70 ring-1 ring-line">
            <Icon className="size-6" strokeWidth={1.5} aria-hidden="true" />
          </span>
        </div>
      )}
      {children}
      {credit && state !== "error" && (
        <PhotoCredit
          photo={p}
          className={cn(
            "absolute z-20 opacity-0 transition-opacity duration-300 group-hover/photo:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-90",
            CREDIT_POS[credit] || CREDIT_POS.br,
          )}
        />
      )}
    </div>
  );
}

/** Small white chip that sits on top of a photo. */
export function PhotoChip({ icon: Icon, children, className, tone = "default" }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-surface/95 px-3 py-1.5 text-xs font-medium text-fg shadow-sm backdrop-blur",
        className,
      )}
    >
      {Icon && (
        <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full", tone === "success" ? "bg-success-soft text-success" : "bg-primary-soft text-primary")}>
          <Icon className="size-3" strokeWidth={2} aria-hidden="true" />
        </span>
      )}
      <span className="truncate">{children}</span>
    </span>
  );
}
