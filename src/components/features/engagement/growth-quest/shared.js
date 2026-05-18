export const PAGE_CLASS = "growth-quest-page";
export const CARD_CLASS = "growth-quest-panel";
export const SUBTLE_CARD_CLASS = "growth-quest-subpanel";
export const PRIMARY_BUTTON_CLASS = "growth-quest-button growth-quest-button--primary";
export const SECONDARY_BUTTON_CLASS = "growth-quest-button growth-quest-button--secondary";
export const EYEBROW_CLASS = "growth-quest-eyebrow";
export const LABEL_CLASS = "growth-quest-label";
export const LABELS = ["A", "B", "C", "D", "E"];

export const HOW_IT_WORKS = [
  {
    title: "1. Start today's practice",
    desc: "Answer 5 common questions plus 1 personalized question in one short practice quiz.",
  },
  {
    title: "2. One scored attempt",
    desc: "Your daily streak, XP, and coins are locked after one completed quest each day.",
  },
  {
    title: "3. Track improvement",
    desc: "Earn XP, coins, improve weak topics, and check your weekly rank.",
  },
];

export const PROGRESS_SECTIONS = [
  {
    title: "Daily goal",
    desc: "Complete today's questions and keep your streak moving.",
  },
  {
    title: "Profile growth",
    desc: "Earn XP and coins that reflect regular activity on the platform.",
  },
  {
    title: "Learning loop",
    desc: "Use the review section to understand mistakes and improve tomorrow.",
  },
];

export const SKILL_BREAKDOWN = [
  { label: "Execution", value: 85, barClass: "bg-emerald-500" },
  { label: "Strategy", value: 65, barClass: "bg-primary" },
  { label: "Knowledge", value: 40, barClass: "bg-amber-500" },
];

export const WEAK_AREA_GUIDANCE = {
  client_communication: {
    headline: "Improve how you confirm and update clients.",
    tips: [
      "Confirm scope, timeline, and deliverables before starting.",
      "Share short progress updates before the client has to ask.",
      "Use clear next steps when a revision or delay appears.",
    ],
  },
  scope_management: {
    headline: "Reduce confusion around what is and is not included.",
    tips: [
      "Restate the agreed deliverables before work begins.",
      "Flag extra requests early before they become unpaid work.",
      "Keep revisions tied to the original brief and milestones.",
    ],
  },
  delivery: {
    headline: "Make handoff and completion more reliable.",
    tips: [
      "Send work with a short summary of what was completed.",
      "Highlight any pending item before final delivery.",
      "Attach files, links, and proof in one clean handoff.",
    ],
  },
  quality_control: {
    headline: "Tighten your review process before delivery.",
    tips: [
      "Run a final checklist before sending work to the client.",
      "Review details against the original brief, not memory.",
      "Catch small issues early so they do not turn into revisions.",
    ],
  },
  platform_rules: {
    headline: "Strengthen platform-safe decision making.",
    tips: [
      "Keep payment, scope, and proof inside the platform workflow.",
      "Follow the dispute and revision process instead of improvising.",
      "Avoid shortcuts that can break trust or policy.",
    ],
  },
  business_basics: {
    headline: "Sharpen fundamentals that protect long-term growth.",
    tips: [
      "Match your offer, pricing, and expectations clearly.",
      "Prioritize repeatable habits over one-off quick wins.",
      "Use every session to improve judgment, not just speed.",
    ],
  },
};

export const makeKey = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `gq-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const formatReset = (resetAt) => {
  if (!resetAt) return "UTC midnight";
  const d = new Date(resetAt);
  return Number.isNaN(d.getTime())
    ? "UTC midnight"
    : d.toLocaleString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        month: "short",
        day: "numeric",
      });
};

export const clampPercent = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
};

export const formatCompactDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Pending";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatDayKey = (value) => {
  const normalized = String(value || "").trim();
  if (!normalized) return "Pending";
  const date = new Date(`${normalized}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return normalized;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const getInitials = (value) =>
  String(value || "You")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
