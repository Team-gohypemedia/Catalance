/** Shared constants for the admin course list + editor. Cover hexes are data-driven art (allowed by BUILD_GUIDE). */
export const LEVELS = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

export const COVER_PRESETS = [
  { from: "#FF5A1F", to: "#6B4EFF", name: "Marigold dusk" },
  { from: "#1F9BFF", to: "#12A150", name: "Monsoon" },
  { from: "#6B4EFF", to: "#E5484D", name: "Jaipur night" },
  { from: "#D98E00", to: "#FF5A1F", name: "Haldi" },
  { from: "#3CC6C0", to: "#1F9BFF", name: "Goa coast" },
  { from: "#E5484D", to: "#C2793F", name: "Terracotta" },
  { from: "#12A150", to: "#C8F542", name: "Tea garden" },
  { from: "#14121F", to: "#6B4EFF", name: "Ink" },
  { from: "#8B74FF", to: "#3CC6C0", name: "Peacock" },
  { from: "#C2793F", to: "#14121F", name: "Coffee" },
];

export const PATTERNS = ["dots", "grid", "waves", "rings"];

export const LESSON_TYPES = [
  { value: "VIDEO", label: "Video" },
  { value: "ARTICLE", label: "Article" },
  { value: "QUIZ", label: "Quiz" },
  { value: "ASSIGNMENT", label: "Assignment" },
];
