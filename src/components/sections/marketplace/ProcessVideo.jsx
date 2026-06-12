import React, { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/providers/theme-provider";
import { Search, Users, Rocket, ArrowRight, Play, Pause } from "lucide-react";
import { motion } from "framer-motion";

const STEPS = [
  {
    id: "discover",
    step: "01",
    title: "Discover Talent",
    description: "Explore curated categories and verified professionals tailored to your project needs.",
    icon: Search,
  },
  {
    id: "shortlist",
    step: "02",
    title: "Compare & Shortlist",
    description: "Review portfolios, ratings, skills, and experience to find the perfect match.",
    icon: Users,
  },
  {
    id: "launch",
    step: "03",
    title: "Launch With Confidence",
    description: "Collaborate through clear milestones, secure payments, and reliable delivery.",
    icon: Rocket,
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
  const { theme } = useTheme();
  const isDarkMode = 
    theme === "dark" || 
    (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const videoSrc = "https://assets.catalance.in/assets/Catalance.mp4";

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
            Three focused stages designed to get you from discovery to delivered results â€” fast.
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

            <div className="relative flex h-full flex-col overflow-hidden rounded-[42px] border border-white/10 bg-[#050810] dark:bg-black shadow-[0_60px_120px_-30px_rgba(2,6,23,0.9)]">
              {/* Video */}
              <div className="relative flex-1 overflow-hidden">
                <video
                  key={videoSrc}
                  ref={videoRef}
                  src={videoSrc}
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
                      Stage 03 — Launch With Confidence
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
                        i === 2 ? "w-10 bg-primary" : "w-4 bg-white/20"
                      }`}
                    />
                  ))}
                  <span className="ml-1 text-[12px] font-medium text-slate-500">3 / 3</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── RIGHT: Steps (redesigned to match reference image) ── */}
          <motion.div
            className="flex flex-col justify-center gap-3"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.id}
                  variants={itemVariants}
                  className="group flex items-center gap-4 rounded-[20px] border border-border bg-card px-5 py-5 shadow-[0_2px_10px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_4px_18px_rgba(0,0,0,0.07)] dark:border-white/8 dark:bg-white/[0.03] dark:hover:border-white/14 dark:hover:bg-white/[0.05]"
                >
                  {/* Large decorative step number */}
                  <span
                    className="w-10 shrink-0 select-none font-mono text-[2.4rem] font-extrabold leading-none tracking-tight text-primary/30 dark:text-primary/20"
                    aria-hidden="true"
                  >
                    {step.step}
                  </span>

                  {/* Circular icon container */}
                  <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary dark:bg-primary/15">
                    <Icon className="h-[22px] w-[22px] stroke-[1.65]" />
                  </div>

                  {/* Title + Description */}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[15.5px] font-bold leading-snug text-foreground dark:text-white">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground dark:text-slate-400">
                      {step.description}
                    </p>
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
