/**
 * Marketing building blocks (Catalance design language: calm, centered, font-medium headlines):
 * Reveal, Eyebrow, SectionTitle, Pill, TrackIcon, Marquee, Faq, CountUp, PageHero, InkCta, ContactForm, TrackCard, Feature.
 */
import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, animate, motion, useInView } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bot,
  BookOpen,
  Briefcase,
  Calculator,
  ClipboardCheck,
  Clapperboard,
  Code2,
  FileSpreadsheet,
  Languages,
  Megaphone,
  Minus,
  Palette,
  PenLine,
  PenTool,
  Plus,
  Smartphone,
  Sparkles,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/primitives";
import { cn, formatCompact, formatINR } from "@/lib/utils";

/* ── Reveal on scroll (subtle fade-up, once) ── */
export function Reveal({ as = "div", delay = 0, y = 12, className, children, ...props }) {
  const M = motion[as] || motion.div;
  return (
    <M
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      {...props}
    >
      {children}
    </M>
  );
}

export const staggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
export const staggerChild = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

/* ── Eyebrow flanked by hairlines (Catalance "OUR PARTNERS") ── */
export function Eyebrow({ children, className, lines = true }) {
  return (
    <p className={cn("eyebrow flex items-center justify-center gap-4", className)}>
      {lines && <span className="h-px w-10 bg-line-strong sm:w-16" aria-hidden="true" />}
      <span>{children}</span>
      {lines && <span className="h-px w-10 bg-line-strong sm:w-16" aria-hidden="true" />}
    </p>
  );
}

/* ── Section title: font-medium headline + muted line, centered by default ── */
export function SectionTitle({ eyebrow, title, description, align = "center", as: H = "h2", className, children }) {
  const center = align === "center";
  return (
    <div className={cn(center ? "mx-auto max-w-3xl text-center" : "max-w-2xl", className)}>
      {eyebrow && (center ? <Eyebrow className="mb-5">{eyebrow}</Eyebrow> : <p className="eyebrow mb-4">{eyebrow}</p>)}
      <H className="text-3xl leading-[1.1] font-medium tracking-tight text-balance sm:text-5xl">{title}</H>
      {description && <p className={cn("mt-4 text-base text-muted sm:text-lg", center && "mx-auto max-w-2xl")}>{description}</p>}
      {children}
    </div>
  );
}

/* ── Outline pill (Catalance "22,008+ Projects delivered") ── */
export function Pill({ children, className }) {
  return <span className={cn("inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1.5 text-sm text-fg shadow-sm", className)}>{children}</span>;
}

/* ── Icons by name (tracks use lucide icon names) ── */
const ICONS = {
  Code2,
  Code: Code2,
  Smartphone,
  PenTool,
  Figma: PenTool,
  BarChart3,
  BarChart: BarChart3,
  ChartBar: BarChart3,
  Bot,
  Sparkles,
  Megaphone,
  PenLine,
  FileText: PenLine,
  Palette,
  Clapperboard,
  Video: Clapperboard,
  Film: Clapperboard,
  BookOpen,
  ClipboardCheck,
  Wallet,
  Briefcase,
  Trophy,
  Users,
  FileSpreadsheet,
  Languages,
  Calculator,
};
const SLUG_ICONS = {
  "web-development": Code2,
  "app-development": Smartphone,
  "ui-ux-design": PenTool,
  "data-analytics": BarChart3,
  "ai-automation": Bot,
  "digital-marketing": Megaphone,
  "content-writing": PenLine,
  "graphic-design": Palette,
  "video-editing": Clapperboard,
  "excel-for-aspirants": FileSpreadsheet,
  "translation-hindi-english": Languages,
  "accounting-tally-gst": Calculator,
};
export function iconFor(name, slug) {
  return ICONS[name] || SLUG_ICONS[slug] || Sparkles;
}
export function TrackIcon({ name, slug, className, ...props }) {
  const Icon = iconFor(name, slug);
  return <Icon className={className} {...props} />;
}

/* ── Marquee (calm, slow, pauses on hover) ── */
export function Marquee({ items, className, itemClassName, separator = "·" }) {
  const row = (hidden) => (
    <div className="flex shrink-0 items-center gap-10 pr-10" aria-hidden={hidden || undefined}>
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-10 whitespace-nowrap">
          <span className={itemClassName}>{it}</span>
          {separator ? (
            <span className="text-line-strong" aria-hidden="true">
              {separator}
            </span>
          ) : null}
        </span>
      ))}
    </div>
  );
  return (
    <div className={cn("relative flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]", className)}>
      <div className="flex w-max animate-[marquee_70s_linear_infinite] hover:[animation-play-state:paused]">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}

/* ── Count up when in view ── */
export function CountUp({ value, format = (n) => Math.round(n).toLocaleString("en-IN"), duration = 1.4, className }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(() => format(0));
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, Number(value) || 0, { duration, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setDisplay(format(v)) });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value]);
  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
export const fmtCompactINR = (n) => `₹${formatCompact(n)}`;
export { formatINR };

/* ── FAQ accordion (calm card list) ── */
export function Faq({ items, className, dark = false }) {
  const [open, setOpen] = useState(0);
  const baseId = useId();
  return (
    <div className={cn("space-y-3", className)}>
      {items.map((it, i) => {
        const isOpen = open === i;
        const id = `${baseId}-${i}`;
        return (
          <div key={it.q} className={cn("rounded-2xl border transition-colors", dark ? "border-ink-line bg-ink-2 text-ink-fg" : "border-line bg-surface", isOpen && !dark && "border-line-strong")}>
            <h3>
              <button
                type="button"
                className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left text-base font-medium sm:px-6 sm:py-5 sm:text-lg"
                aria-expanded={isOpen}
                aria-controls={id}
                onClick={() => setOpen(isOpen ? -1 : i)}
              >
                {it.q}
                <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full transition-colors", isOpen ? "bg-primary text-primary-fg" : dark ? "bg-ink text-ink-fg" : "bg-surface-2 text-muted")}>
                  {isOpen ? <Minus className="size-3.5" /> : <Plus className="size-3.5" />}
                </span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={id}
                  role="region"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className={cn("max-w-3xl px-5 pb-5 text-[15px] leading-relaxed sm:px-6 sm:pb-6", dark ? "text-ink-muted" : "text-muted")}>{it.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Centered Catalance hero for inner marketing pages: outline pill, font-medium headline, muted line, actions.
 * `ink` is accepted for backwards compatibility but renders light (Catalance pages avoid dark heroes).
 * align="left" gives a left-aligned variant.
 */
// eslint-disable-next-line no-unused-vars
export function PageHero({ eyebrow, title, description, actions, children, ink = false, align = "center", className }) {
  const center = align === "center";
  return (
    <section className={cn("relative overflow-hidden", className)}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_50%_60%_at_50%_0%,var(--primary-soft),transparent)] opacity-70" aria-hidden="true" />
      <div className="container-campus relative pt-14 pb-14 sm:pt-20 sm:pb-20">
        <Reveal className={cn(center && "mx-auto flex max-w-4xl flex-col items-center text-center")}>
          {eyebrow && <Pill className="mb-6 text-muted">{eyebrow}</Pill>}
          <h1 className="text-4xl leading-[1.1] font-medium tracking-tight text-balance sm:text-6xl">{title}</h1>
          {description && <p className="mt-5 max-w-2xl text-base text-balance text-muted sm:text-lg">{description}</p>}
          {actions && <div className={cn("mt-8 flex flex-wrap gap-3", center && "justify-center")}>{actions}</div>}
        </Reveal>
        {children}
      </div>
    </section>
  );
}

/* ── Final CTA: soft brand gradient band (Catalance "Freelance services at your fingertips") ── */
export function InkCta({
  title = (
    <>
      Learn a skill. <em className="accent">Prove it.</em>
    </>
  ),
  description = "Practical lessons, one final assessment and a skill you can get verified.",
  primary = { to: "/tracks", label: "Explore Courses" },
  secondary = { to: "/how-it-works", label: "How It Works" },
  className,
}) {
  return (
    <section className={cn("container-campus py-16 sm:py-24", className)}>
      <Reveal className="relative isolate overflow-hidden rounded-3xl border border-line bg-surface px-6 pt-20 pb-14 text-center sm:px-14 sm:pt-28 sm:pb-20">
        <div
          className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,var(--primary)_0%,color-mix(in_srgb,var(--primary)_30%,var(--surface))_45%,var(--surface)_100%)] opacity-90 dark:opacity-30"
          aria-hidden="true"
        />
        <h2 className="mx-auto max-w-3xl text-3xl leading-[1.1] font-medium tracking-tight text-balance text-fg sm:text-5xl lg:text-6xl [&_em.accent]:text-fg dark:[&_em.accent]:text-primary">{title}</h2>
        {description && <p className="mx-auto mt-5 max-w-xl text-base text-balance text-muted sm:text-lg">{description}</p>}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button to={primary.to} size="lg">
            {primary.label}
          </Button>
          {secondary && (
            <Button to={secondary.to} size="lg" variant="brandOutline">
              {secondary.label}
            </Button>
          )}
        </div>
      </Reveal>
    </section>
  );
}

/* ── Track card (calm white card) ── */
export function TrackCard({ track, className }) {
  return (
    <Link
      to={`/tracks/${track.slug}`}
      className={cn("group flex h-full flex-col rounded-2xl border border-line bg-surface p-6 transition-colors duration-200 hover:border-line-strong sm:p-7", className)}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-11 items-center justify-center rounded-full bg-surface-2 text-primary">
          <TrackIcon name={track.icon} slug={track.slug} className="size-5" strokeWidth={1.75} />
        </span>
        <ArrowUpRight className="size-5 text-subtle transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
      </div>
      <h3 className="mt-6 text-lg font-medium tracking-tight">{track.title}</h3>
      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">{track.tagline}</p>
      <div className="mt-auto flex flex-wrap items-center gap-x-1.5 gap-y-1 pt-6 text-xs text-subtle">
        {[
          track.durationWeeks ? `${track.durationWeeks} weeks` : null,
          track.coursesCount ? `${track.coursesCount} courses` : null,
          track.studentsCount ? `${formatCompact(track.studentsCount)} learners` : null,
        ]
          .filter(Boolean)
          .join(" · ")}
      </div>
    </Link>
  );
}

/* ── Contact form (toast on submit) ── */
export function ContactForm({ kind = "college", className }) {
  const [form, setForm] = useState({ name: "", email: "", org: "", role: "", size: "", message: "" });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const ids = useId();
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const orgLabel = kind === "college" ? "College name" : "Company name";
  const roleLabel = kind === "college" ? "Your role (TPO, HOD, Principal…)" : "Your role";
  const sizeLabel = kind === "college" ? "Students in final two years" : "Hiring need";
  const sizeOptions = kind === "college" ? ["Under 300", "300–1,000", "1,000–3,000", "3,000+"] : ["1–5 interns", "5–20 hires", "Freelance talent on demand", "Bounty challenge"];

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = "Please tell us your name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid work email.";
    if (!form.org.trim()) next.org = `Please add your ${kind === "college" ? "college" : "company"}.`;
    setErrors(next);
    if (Object.keys(next).length) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 700));
    setSending(false);
    setSent(true);
    toast.success(kind === "college" ? "Thanks! Our campus partnerships team will call you within 2 working days." : "Thanks! A Campus talent partner will reach out within 1 working day.");
  };

  if (sent)
    return (
      <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-line bg-surface p-8 text-center", className)}>
        <span className="flex size-12 items-center justify-center rounded-full bg-surface-2 text-primary">
          <Sparkles className="size-5" />
        </span>
        <h3 className="mt-4 text-2xl font-medium tracking-tight">We've got it, {form.name.split(" ")[0]}.</h3>
        <p className="mt-2 max-w-sm text-sm text-muted">Expect an email at {form.email} soon. Meanwhile, see the skills learners can get verified in.</p>
        <Button to="/skills" variant="brandOutline" className="mt-5" rightIcon={ArrowRight}>
          View skills
        </Button>
      </div>
    );

  return (
    <form onSubmit={submit} noValidate className={cn("grid gap-4 rounded-2xl border border-line bg-surface p-6 sm:grid-cols-2 sm:p-8", className)}>
      <Field label="Full name" htmlFor={`${ids}-n`} error={errors.name}>
        <Input id={`${ids}-n`} value={form.name} onChange={set("name")} autoComplete="name" aria-invalid={!!errors.name} />
      </Field>
      <Field label="Work email" htmlFor={`${ids}-e`} error={errors.email}>
        <Input id={`${ids}-e`} type="email" value={form.email} onChange={set("email")} autoComplete="email" aria-invalid={!!errors.email} />
      </Field>
      <Field label={orgLabel} htmlFor={`${ids}-o`} error={errors.org}>
        <Input id={`${ids}-o`} value={form.org} onChange={set("org")} autoComplete="organization" aria-invalid={!!errors.org} />
      </Field>
      <Field label={roleLabel} htmlFor={`${ids}-r`}>
        <Input id={`${ids}-r`} value={form.role} onChange={set("role")} />
      </Field>
      <Field label={sizeLabel} htmlFor={`${ids}-s`} className="sm:col-span-2">
        <Select id={`${ids}-s`} value={form.size} onChange={set("size")}>
          <option value="">Choose one</option>
          {sizeOptions.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </Select>
      </Field>
      <Field label="Anything else?" htmlFor={`${ids}-m`} className="sm:col-span-2">
        <Textarea id={`${ids}-m`} value={form.message} onChange={set("message")} placeholder={kind === "college" ? "Tell us about your placement goals for this year." : "Which skills are you hiring for?"} />
      </Field>
      <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">We reply within 2 working days. No spam, promise.</p>
        <Button type="submit" size="lg" loading={sending} rightIcon={ArrowRight}>
          {kind === "college" ? "Book a partnership call" : "Talk to our team"}
        </Button>
      </div>
    </form>
  );
}

/* ── Small feature tile (icon in a plain circle; `tone` kept for compatibility) ── */
// eslint-disable-next-line no-unused-vars
export function Feature({ icon: Icon, title, children, tone = "primary", className }) {
  return (
    <div className={cn("rounded-2xl border border-line bg-surface p-6 sm:p-7", className)}>
      <span className="flex size-11 items-center justify-center rounded-full bg-surface-2 text-primary">
        <Icon className="size-5" strokeWidth={1.75} />
      </span>
      <h3 className="mt-5 text-lg font-medium tracking-tight">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{children}</p>
    </div>
  );
}
