import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import catalanceLogo from "@/assets/catalance-logo.svg";

/** The Catalance mark in a brand circle — identical to the main Catalance navbar. */
export function LogoMark({ className }) {
  return (
    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full bg-primary", className)}>
      <img src={catalanceLogo} alt="" className="size-[78%] object-contain invert dark:invert-0" draggable="false" />
    </span>
  );
}

/** "CATALANCE Campus" wordmark. `dark` = render on a dark surface. */
export function Logo({ to = "/", className, dark = false, compact = false }) {
  return (
    <Link to={to} className={cn("inline-flex shrink-0 items-center gap-2.5", className)} aria-label="Catalance Campus home">
      <LogoMark />
      {!compact && (
        <span className={cn("flex items-baseline gap-1.5 leading-none", dark ? "text-ink-fg" : "text-fg")}>
          <span className="text-[17px] font-bold tracking-tight uppercase">Catalance</span>
          <span className="font-accent text-[19px]">Campus</span>
        </span>
      )}
    </Link>
  );
}
