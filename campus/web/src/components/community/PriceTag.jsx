import { cn, formatINR } from "@/lib/utils";

/** "₹499 / session" or a subtle green "Free" badge. */
export function PriceTag({ price, className, suffix = " / session" }) {
  return price ? (
    <span className={cn("text-sm font-medium text-fg tabular-nums", className)}>
      {formatINR(price)}
      {suffix && <span className="font-normal text-subtle">{suffix}</span>}
    </span>
  ) : (
    <span className={cn("rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-medium text-success", className)}>Free</span>
  );
}
