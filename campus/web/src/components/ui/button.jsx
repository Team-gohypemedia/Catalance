import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-primary text-primary-fg hover:bg-primary-hover shadow-[0_4px_14px_-10px_var(--primary)]",
  dark: "bg-fg text-bg hover:opacity-90",
  accent: "bg-accent text-accent-fg hover:brightness-95",
  secondary: "bg-surface-2 text-fg hover:bg-surface-3",
  outline: "border border-line-strong bg-surface text-fg hover:border-subtle/60 hover:bg-surface-2",
  /** Catalance secondary CTA: transparent with brand border ("Get Hired") */
  brandOutline: "border border-primary text-primary bg-transparent hover:bg-primary-soft",
  /** quiet tinted button */
  soft: "bg-primary-soft text-primary hover:brightness-[0.97] dark:hover:brightness-110",
  ghost: "text-fg hover:bg-surface-2",
  danger: "bg-danger text-white hover:opacity-90",
  link: "text-primary underline-offset-4 hover:underline px-0 h-auto",
  /** for use on always-dark ink panels */
  inkOutline: "border border-ink-line text-ink-fg hover:bg-ink-2",
};

const sizes = {
  sm: "h-8 px-3 text-sm gap-1.5 rounded-md",
  md: "h-10 px-4 text-sm gap-2 rounded-lg",
  lg: "h-11 px-6 text-[15px] gap-2 rounded-lg",
  xl: "h-12 px-7 text-base gap-2.5 rounded-lg",
  icon: "h-10 w-10 rounded-full",
  iconSm: "h-8 w-8 rounded-full",
};

/**
 * <Button variant="primary|brandOutline|soft|dark|accent|secondary|outline|ghost|danger|link|inkOutline" size="sm|md|lg|xl|icon|iconSm"
 *         to="/route" (renders Link) | href (renders <a>) loading leftIcon={Icon} rightIcon={Icon} />
 */
export const Button = forwardRef(function Button(
  { className, variant = "primary", size = "md", to, href, loading = false, disabled, leftIcon: Left, rightIcon: Right, children, ...props },
  ref,
) {
  const classes = cn(
    "inline-flex shrink-0 items-center justify-center whitespace-nowrap font-medium transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
    variants[variant],
    sizes[size],
    className,
  );
  const content = (
    <>
      {loading ? <Loader2 className="size-4 animate-spin" /> : Left ? <Left className="size-4" /> : null}
      {children}
      {Right && !loading ? <Right className="size-4" /> : null}
    </>
  );
  if (to)
    return (
      <Link ref={ref} to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  if (href)
    return (
      <a ref={ref} href={href} className={classes} {...props}>
        {content}
      </a>
    );
  return (
    <button ref={ref} className={classes} disabled={disabled || loading} {...props}>
      {content}
    </button>
  );
});
