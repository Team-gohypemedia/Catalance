import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** The main Catalance site (Campus is a Catalance product). Override with VITE_CATALANCE_URL. */
export const CATALANCE_URL = (import.meta.env.VITE_CATALANCE_URL || (import.meta.env.DEV ? "http://localhost:5173" : "https://catalance.in")).replace(/\/$/, "");

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
/** formatINR(1500) → "₹1,500" */
export const formatINR = (amount) => inr.format(Number(amount) || 0);

const compact = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });
/** formatCompact(125000) → "1.3L" */
export const formatCompact = (n) => compact.format(Number(n) || 0);

export const formatNumber = (n) => new Intl.NumberFormat("en-IN").format(Number(n) || 0);

/** "2h 15m" from minutes */
export function formatDuration(minutes) {
  const m = Math.round(Number(minutes) || 0);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
}

export function formatDate(value, opts = { day: "numeric", month: "short", year: "numeric" }) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN", opts);
}

/** "3h ago", "2d ago" */
export function timeAgo(value) {
  if (!value) return "";
  const s = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return formatDate(value, { day: "numeric", month: "short" });
}

export function initials(name = "") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Divisions for ranked seasons, lowest → highest. `min` = season points needed. */
export const DIVISIONS = {
  BRONZE: { label: "Bronze", min: 0, color: "#C2793F" },
  SILVER: { label: "Silver", min: 500, color: "#9AA4B2" },
  GOLD: { label: "Gold", min: 1500, color: "#E8B100" },
  PLATINUM: { label: "Platinum", min: 3500, color: "#3CC6C0" },
  DIAMOND: { label: "Diamond", min: 7000, color: "#8B74FF" },
};

export function divisionFor(points = 0) {
  return Object.entries(DIVISIONS).reduce((acc, [key, d]) => (points >= d.min ? key : acc), "BRONZE");
}

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hinglish", label: "Hinglish" },
  { code: "hi", label: "हिन्दी" },
  { code: "ta", label: "தமிழ்" },
  { code: "te", label: "తెలుగు" },
  { code: "bn", label: "বাংলা" },
  { code: "mr", label: "मराठी" },
];
