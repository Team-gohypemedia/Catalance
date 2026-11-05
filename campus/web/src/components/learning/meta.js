/** Shared learning metadata: track icons, lesson type metadata, level labels. */
import { BarChart3, Bot, Calculator, Clapperboard, FileSpreadsheet, Languages, ClipboardList, Code2, FileText, ListChecks, Megaphone, Palette, PenLine, PenTool, PlayCircle, Smartphone, BookOpen } from "lucide-react";

export const TRACK_ICONS = { Code2, Smartphone, PenTool, BarChart3, Bot, Megaphone, PenLine, Palette, Clapperboard, FileSpreadsheet, Languages, Calculator };
export const trackIcon = (name) => TRACK_ICONS[name] || BookOpen;

/** Track icon by slug — used when only course.track is available. */
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
export const iconForTrackSlug = (slug) => SLUG_ICONS[slug] || BookOpen;

export const LESSON_TYPES = {
  VIDEO: { label: "Video", icon: PlayCircle, tone: "primary" },
  ARTICLE: { label: "Article", icon: FileText, tone: "sky" },
  QUIZ: { label: "Quiz", icon: ListChecks, tone: "violet" },
  ASSIGNMENT: { label: "Assignment", icon: ClipboardList, tone: "accent" },
};

export const LEVELS = { BEGINNER: "Beginner", INTERMEDIATE: "Intermediate", ADVANCED: "Advanced", STANDARD: "Standard" };

export const LANGUAGE_SHORT = { en: "English", hinglish: "Hinglish", hi: "Hindi", ta: "Tamil", te: "Telugu", bn: "Bengali", mr: "Marathi" };
