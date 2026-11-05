import { BookOpen, Briefcase, GraduationCap, MessagesSquare, Trophy, Bell } from "lucide-react";

/** Track options for selects / filters (data-driven colours are allowed). */
export const TRACKS = [
  { id: "t_web-development", slug: "web-development", title: "Web Development", color: "#FF5A1F" },
  { id: "t_app-development", slug: "app-development", title: "App Development", color: "#1F9BFF" },
  { id: "t_ui-ux-design", slug: "ui-ux-design", title: "UI/UX Design", color: "#6B4EFF" },
  { id: "t_data-analytics", slug: "data-analytics", title: "Data Analytics", color: "#12A150" },
  { id: "t_ai-automation", slug: "ai-automation", title: "AI & Automation", color: "#0EA5A4" },
  { id: "t_digital-marketing", slug: "digital-marketing", title: "Digital Marketing", color: "#D98E00" },
  { id: "t_content-writing", slug: "content-writing", title: "Content Writing", color: "#C2793F" },
  { id: "t_graphic-design", slug: "graphic-design", title: "Graphic Design", color: "#E5487D" },
  { id: "t_video-editing", slug: "video-editing", title: "Video Editing", color: "#3B5BDB" },
];
export const trackById = (id) => TRACKS.find((t) => t.id === id || t.slug === id) || null;

export const EXPERTISE_CHIPS = [
  "Web Development",
  "UI/UX Design",
  "App Development",
  "Data Analytics",
  "Digital Marketing",
  "Content Writing",
  "Graphic Design",
  "Video Editing",
];

export const NOTIF_META = {
  COURSE: { icon: BookOpen, label: "Learning", className: "bg-sky-soft text-sky" },
  GIG: { icon: Briefcase, label: "Gigs", className: "bg-primary-soft text-primary" },
  COMMUNITY: { icon: MessagesSquare, label: "Community", className: "bg-violet-soft text-violet" },
  MENTOR: { icon: GraduationCap, label: "Mentors", className: "bg-success-soft text-success" },
  RANK: { icon: Trophy, label: "Rank", className: "bg-accent-soft text-fg dark:text-accent" },
  SYSTEM: { icon: Bell, label: "Campus", className: "bg-surface-2 text-muted" },
};

const LANG_LABELS = { en: "English", hinglish: "Hinglish", hi: "Hindi", ta: "Tamil", te: "Telugu", bn: "Bengali", mr: "Marathi" };
export const langLabel = (code) => LANG_LABELS[code] || code;

/** "2026-10-17" → Date in local time */
export const parseYMD = (s) => {
  const [y, m, d] = String(s).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

/** "18:30" → "6:30 pm" */
export function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const hh = h % 12 || 12;
  return `${hh}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function formatSlot(date, time) {
  const d = parseYMD(date);
  return `${d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} · ${formatTime(time)}`;
}
