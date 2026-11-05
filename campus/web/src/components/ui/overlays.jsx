/**
 * Radix-based interactive pieces: Dialog, DropdownMenu, Tabs, Tooltip, Popover, Switch, Progress, Avatar.
 */
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { X } from "lucide-react";
import { cn, initials } from "@/lib/utils";

/* ── Dialog ──
   <Dialog open onOpenChange><DialogContent title="…" description="…">…</DialogContent></Dialog> */
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export function DialogContent({ title, description, className, children, size = "md" }) {
  const widths = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" />
      <DialogPrimitive.Content
        className={cn(
          "fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-line bg-surface p-6 shadow-lg focus:outline-none sm:p-7",
          widths[size],
          className,
        )}
      >
        {(title || description) && (
          <div className="mb-5 pr-8">
            {title && <DialogPrimitive.Title className="font-display text-xl font-medium tracking-tight">{title}</DialogPrimitive.Title>}
            {description && <DialogPrimitive.Description className="mt-1 text-sm text-muted">{description}</DialogPrimitive.Description>}
          </div>
        )}
        {children}
        <DialogPrimitive.Close className="absolute top-5 right-5 rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-fg" aria-label="Close">
          <X className="size-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/* ── Dropdown ── */
export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;
export function DropdownMenuContent({ className, align = "end", ...props }) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        align={align}
        sideOffset={8}
        className={cn("z-50 min-w-48 rounded-xl border border-line bg-surface p-1.5 shadow-lg", className)}
        {...props}
      />
    </DropdownPrimitive.Portal>
  );
}
export function DropdownMenuItem({ className, ...props }) {
  return (
    <DropdownPrimitive.Item
      className={cn("flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-fg outline-none [&_svg]:text-muted data-[highlighted]:bg-surface-2", className)}
      {...props}
    />
  );
}
export const DropdownMenuSeparator = () => <DropdownPrimitive.Separator className="my-1 h-px bg-line" />;
export const DropdownMenuLabel = ({ className, ...p }) => <DropdownPrimitive.Label className={cn("px-3 py-2 text-xs text-muted", className)} {...p} />;

/* ── Tabs ──
   <Tabs defaultValue="a"><TabsList><TabsTrigger value="a">A</TabsTrigger></TabsList><TabsContent value="a">…</TabsContent></Tabs> */
export const Tabs = TabsPrimitive.Root;
/** <TabsList variant="pill|underline"> — pill (default) is a Catalance-style white pill bar with an orange active pill. */
export function TabsList({ className, variant = "pill", ...props }) {
  return (
    <TabsPrimitive.List
      data-variant={variant}
      className={cn(
        "group/tabs scrollbar-none inline-flex max-w-full items-center overflow-x-auto",
        variant === "underline" ? "w-full gap-6 border-b border-line" : "gap-1 rounded-full border border-line bg-surface p-1",
        className,
      )}
      {...props}
    />
  );
}
export function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "cursor-pointer text-sm font-medium whitespace-nowrap text-muted transition-colors hover:text-fg",
        // pill
        "rounded-full px-4 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-fg data-[state=active]:hover:text-primary-fg",
        // underline
        "group-data-[variant=underline]/tabs:-mb-px group-data-[variant=underline]/tabs:rounded-none group-data-[variant=underline]/tabs:border-b-2 group-data-[variant=underline]/tabs:border-transparent group-data-[variant=underline]/tabs:px-0.5 group-data-[variant=underline]/tabs:pt-1 group-data-[variant=underline]/tabs:pb-3",
        "group-data-[variant=underline]/tabs:data-[state=active]:border-primary group-data-[variant=underline]/tabs:data-[state=active]:bg-transparent group-data-[variant=underline]/tabs:data-[state=active]:text-fg",
        className,
      )}
      {...props}
    />
  );
}
export const TabsContent = ({ className, ...p }) => <TabsPrimitive.Content className={cn("mt-5 focus:outline-none", className)} {...p} />;

/* ── Tooltip ── <Tooltip content="…"><button/></Tooltip> (TooltipProvider is mounted in main.jsx) */
export const TooltipProvider = TooltipPrimitive.Provider;
export function Tooltip({ content, side = "top", children }) {
  if (!content) return children;
  return (
    <TooltipPrimitive.Root delayDuration={200}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content side={side} sideOffset={6} className="z-50 max-w-64 rounded-lg bg-fg px-2.5 py-1.5 text-xs font-medium text-bg shadow-md">
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

/* ── Popover ── */
export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export function PopoverContent({ className, align = "end", ...props }) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content align={align} sideOffset={8} className={cn("z-50 rounded-xl border border-line bg-surface p-4 shadow-lg focus:outline-none", className)} {...props} />
    </PopoverPrimitive.Portal>
  );
}

/* ── Switch ── */
export function Switch({ className, ...props }) {
  return (
    <SwitchPrimitive.Root
      className={cn("relative h-6 w-11 shrink-0 cursor-pointer rounded-full bg-surface-3 transition-colors data-[state=checked]:bg-primary", className)}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-5 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-[22px]" />
    </SwitchPrimitive.Root>
  );
}

/* ── Progress ── <Progress value={40} tone="primary|accent|violet|success" /> */
const progressTones = { primary: "bg-primary", accent: "bg-accent", violet: "bg-violet", success: "bg-success", fg: "bg-fg" };
export function Progress({ value = 0, tone = "primary", className, barClassName }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-2", className)} role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full transition-[width] duration-700 ease-out", progressTones[tone], barClassName)} style={{ width: `${v}%` }} />
    </div>
  );
}

/* ── Avatar ── <Avatar name="Aarav Sharma" src={url} size="sm|md|lg|xl" /> — colorful initials fallback */
const avatarSizes = { xs: "size-6 text-[10px]", sm: "size-8 text-xs", md: "size-10 text-sm", lg: "size-14 text-lg", xl: "size-20 text-2xl", "2xl": "size-28 text-3xl" };
const avatarHues = ["#C8693A", "#7A6AB8", "#3F8F6B", "#4A82B8", "#B98A2E", "#B85A5A", "#3E9A96", "#8C6A4F"];
export function Avatar({ name = "", src, size = "md", className, ring = false }) {
  const hue = avatarHues[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % avatarHues.length];
  return (
    <AvatarPrimitive.Root className={cn("relative inline-flex shrink-0 overflow-hidden rounded-full", avatarSizes[size], ring && "ring-2 ring-surface", className)}>
      {src && <AvatarPrimitive.Image src={src} alt={name} className="size-full object-cover" />}
      <AvatarPrimitive.Fallback className="flex size-full items-center justify-center font-medium text-white" style={{ background: hue }}>
        {initials(name) || "?"}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
