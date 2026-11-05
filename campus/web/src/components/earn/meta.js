/** Shared display metadata for the Earn & Rank screens. Data-driven colours live here (tracks, statuses). */
import {
  Code2, Smartphone, Palette, BarChart3, Bot, Megaphone, PenLine, Shapes, Clapperboard,
  Rocket, Flame, Trophy, HeartHandshake, GraduationCap, Target, Medal, Star, Award, Zap, BadgeCheck,
  BookOpen, Dumbbell, Briefcase, Building2, Sparkles, FileSpreadsheet, Languages, Calculator, TrendingUp,
} from "lucide-react";

export const TRACKS = {
  "web-development": { label: "Web development", short: "Web dev", color: "#FF5A1F", icon: Code2 },
  "app-development": { label: "App development", short: "App dev", color: "#1F9BFF", icon: Smartphone },
  "ui-ux-design": { label: "UI/UX design", short: "UI/UX", color: "#6B4EFF", icon: Palette },
  "data-analytics": { label: "Data analytics", short: "Data", color: "#12A150", icon: BarChart3 },
  "ai-automation": { label: "AI & automation", short: "AI", color: "#3CC6C0", icon: Bot },
  "digital-marketing": { label: "Digital marketing", short: "Marketing", color: "#E5484D", icon: Megaphone },
  "content-writing": { label: "Content writing", short: "Writing", color: "#D98E00", icon: PenLine },
  "graphic-design": { label: "Graphic design", short: "Graphic", color: "#C2408C", icon: Shapes },
  "video-editing": { label: "Video editing", short: "Video", color: "#8B74FF", icon: Clapperboard },
  "excel-for-aspirants": { label: "Excel for aspirants", short: "Excel", color: "#0F9D58", icon: FileSpreadsheet },
  "translation-hindi-english": { label: "Hindi ↔ English translation", short: "Translation", color: "#E8590C", icon: Languages },
  "accounting-tally-gst": { label: "Accounting, Tally & GST", short: "Tally & GST", color: "#B45309", icon: Calculator },
};
export const trackMeta = (slug) => TRACKS[slug] || { label: slug || "General", short: slug || "General", color: "#8A8699", icon: Briefcase };

export const DIFFICULTY = {
  EASY: { label: "Easy", tone: "success" },
  MEDIUM: { label: "Medium", tone: "warning" },
  HARD: { label: "Hard", tone: "danger" },
};

export const APP_STATUS = {
  APPLIED: { label: "Applied", tone: "sky", hint: "Mentor is reviewing your pitch" },
  ACCEPTED: { label: "Accepted", tone: "violet", hint: "You're in. Start the work" },
  SUBMITTED: { label: "Submitted", tone: "warning", hint: "Mentor is reviewing your work" },
  APPROVED: { label: "Approved", tone: "success", hint: "Payout is on its way" },
  PAID: { label: "Paid", tone: "accent", hint: "Money is in your wallet" },
  REJECTED: { label: "Not selected", tone: "danger", hint: "Read the feedback and try another gig" },
};
export const APP_FLOW = ["APPLIED", "ACCEPTED", "SUBMITTED", "APPROVED", "PAID"];

export const BADGE_ICONS = { Rocket, Flame, Trophy, HeartHandshake, GraduationCap, Target, Medal, Star, Award, Zap, BadgeCheck, BookOpen, Dumbbell, Sparkles, Building2, TrendingUp };
export const badgeIcon = (name) => BADGE_ICONS[name] || Award;

export const STAGE_KEYS = {
  LEARN: { color: "#1F9BFF" },
  PRACTICE: { color: "#6B4EFF" },
  MICRO_GIG: { color: "#FF5A1F" },
  REAL_PROJECT: { color: "#12A150" },
  HIRED: { color: "#E8B100" },
};

export const CITIES = ["Jabalpur", "Dehradun", "Bikaner", "Tiruchirappalli", "Patna", "Pune", "Guwahati", "Indore", "Kolhapur", "Howrah", "Rajahmundry", "Udaipur", "Ratnagiri", "Rewa", "Nellore", "Jalandhar"];

/** Pay-later split for a payout. */
export function payoutSplit(amount, payLater) {
  const remaining = payLater?.remainingINR ?? 0;
  const pct = payLater?.deductionPercent ?? 20;
  const deduction = remaining > 0 ? Math.min(remaining, Math.round((amount * pct) / 100)) : 0;
  return { now: amount - deduction, deduction, pct };
}
