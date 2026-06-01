import React, { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import ProcessVideoAsset from "@/assets/videos/follow_this_img_and_animtion_p.mp4";
import { Search, Users, Rocket, ArrowRight, Play, Pause } from "lucide-react";
import { motion } from "framer-motion";

const STEPS = [
  {
    id: "discover",
    step: "01",
    title: "Explore & Brief",
    description: "Focused categories, tools, and budget filters surface the right specialist in minutes.",
    icon: Search,
    color: "from-sky-500/20 to-cyan-500/5",
    border: "border-sky-500/20",
    iconColor: "text-sky-400",
    iconBg: "bg-sky-500/10 border-sky-500/20",
  },
  {
    id: "shortlist",
    step: "02",
    title: "Shortlist Talent",
    description: "Review verified portfolios, trust signals, and delivery windows to lock in your top match.",
    icon: Users,
    color: "from-violet-500/20 to-purple-500/5",
    border: "border-violet-500/20",
    iconColor: "text-violet-400",
    iconBg: "bg-violet-500/10 border-violet-500/20",
  },
  {
    id: "launch",
    step: "03",
    title: "Launch Execution",
    description: "Structured briefs and clear deliverable expectations drive fast, accountable results.",
    icon: Rocket,
    color: "from-primary/20 to-primary/5",
    border: "border-primary/30",
    iconColor: "text-primary",
    iconBg: "bg-primary/10 border-primary/30",
    active: true,
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const ProcessVideo = () => {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(true);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  return (
    <section
      id="how-it-works"
      className="relative w-full overflow-hidden bg-background py-10 sm:py-14"
    >
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/6 blur-[140px]" />
        <div className="absolute right-[-10%] top-0 h-[400px] w-[400px] rounded-full bg-sky-500/5 blur-[120px]" />
        <div className="absolute left-[-5%] bottom-0 h-[350px] w-[350px] rounded-full bg-violet-500/5 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          className="mb-16 flex flex-col items-center text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <Badge className="mb-5 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
            How It Works
          </Badge>
          <h2 className="max-w-2xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl lg:text-[56px] lg:leading-[1.05]">
            A cleaner path from{" "}
            <span className="italic font-medium text-primary">search to execution</span>
          </h2>
          <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-slate-400">
            Three focused stages designed to get you from discovery to delivered results — fast.
          </p>
        </motion.div>

        {/* Main layout: video left, steps right on large screens */}
        <div className="grid items-stretch gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
          {/* ── LEFT: Video Card ── */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex flex-col"
          >
            {/* Outer glow ring */}
            <div className="absolute -inset-[1px] rounded-[44px] bg-gradient-to-br from-primary/30 via-sky-500/10 to-violet-500/20 blur-[1px]" />

            <div className="relative flex h-full flex-col overflow-hidden rounded-[42px] border border-white/10 bg-[#050810] shadow-[0_60px_120px_-30px_rgba(2,6,23,0.9)]">
              {/* Video */}
              <div className="relative flex-1 overflow-hidden">
                <video
                  ref={videoRef}
                  src={ProcessVideoAsset}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="h-full w-full object-cover"
                  style={{ minHeight: "340px" }}
                />

                {/* Top fade */}
                <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#050810] to-transparent" />
                {/* Bottom fade */}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#050810] via-[#050810]/60 to-transparent" />

                {/* Play/Pause control */}
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={playing ? "Pause video" : "Play video"}
                  className="absolute right-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur-md transition hover:bg-black/70"
                >
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-px" />}
                </button>
              </div>

              {/* Bottom info panel */}
              <div className="relative px-7 pb-7 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                      Stage 03 — Launch Execution
                    </p>
                    <h3 className="mt-1 text-xl font-semibold text-white">
                      Connect and deploy with confidence
                    </h3>
                  </div>
                  <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
                    <Rocket className="h-5 w-5" />
                  </div>
                </div>

                {/* Stage dots */}
                <div className="mt-5 flex items-center gap-3">
                  {STEPS.map((s, i) => (
                    <div
                      key={s.id}
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        i === 2
                          ? "w-10 bg-primary"
                          : "w-4 bg-white/20"
                      }`}
                    />
                  ))}
                  <span className="ml-1 text-[12px] font-medium text-slate-500">3 / 3</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── RIGHT: Steps ── */}
          <motion.div
            className="flex flex-col justify-center gap-5"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.id}
                  variants={itemVariants}
                  className={`group relative overflow-hidden rounded-[28px] border p-6 transition-all duration-300 ${
                    step.active
                      ? `${step.border} bg-gradient-to-br ${step.color} shadow-[0_0_40px_-15px_rgba(var(--brand-rgb),0.3)]`
                      : "border-white/8 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05]"
                  }`}
                >
                  {/* Subtle grid overlay */}
                  <div
                    className="pointer-events-none absolute inset-0 opacity-[0.025]"
                    style={{
                      backgroundImage: "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
                      backgroundSize: "28px 28px",
                    }}
                  />

                  {/* Connector line between cards */}
                  {index < STEPS.length - 1 && (
                    <div className="absolute -bottom-[22px] left-[35px] z-10 h-[22px] w-px bg-gradient-to-b from-white/15 to-transparent" />
                  )}

                  <div className="relative flex items-start gap-5">
                    {/* Icon */}
                    <div
                      className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${step.iconBg} ${step.iconColor}`}
                    >
                      <Icon className="h-5 w-5" />
                      {step.active && (
                        <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                          <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-primary" />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-3">
                        <span
                          className={`font-mono text-[11px] font-bold tracking-[0.25em] ${
                            step.active ? "text-primary" : "text-slate-600"
                          }`}
                        >
                          {step.step}
                        </span>
                        {step.active && (
                          <span className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            Live
                          </span>
                        )}
                      </div>
                      <h3 className="text-[18px] font-semibold leading-snug text-white">
                        {step.title}
                      </h3>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">
                        {step.description}
                      </p>
                    </div>

                    <ArrowRight
                      className={`mt-0.5 h-4 w-4 shrink-0 transition-all duration-300 ${
                        step.active
                          ? "text-primary"
                          : "text-slate-700 group-hover:translate-x-1 group-hover:text-slate-400"
                      }`}
                    />
                  </div>
                </motion.div>
              );
            })}

            {/* CTA row */}
            <motion.div variants={itemVariants} className="mt-2">
              <a
                href="#marketplace-results"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("marketplace-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="group inline-flex items-center gap-2.5 rounded-full border border-primary/30 bg-primary/10 px-6 py-3 text-[14px] font-semibold text-primary transition-all hover:bg-primary/15 hover:border-primary/50"
              >
                Start exploring services
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </a>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ProcessVideo;
