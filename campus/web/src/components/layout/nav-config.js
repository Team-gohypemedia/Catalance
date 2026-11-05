import {
  LayoutDashboard, BookOpen, Compass, Bot, Award, TrendingUp, Briefcase, Wallet, Trophy, FolderKanban,
  MessagesSquare, Users, GraduationCap, Presentation, BarChart3, Library, ClipboardCheck, School, UserCog, Settings2,
  BadgeCheck, FileCheck2, Inbox, FolderOpen, Receipt, LifeBuoy, Shapes, ScrollText, UserSearch, Send, IndianRupee, LineChart,
  ShieldCheck, Headset,
} from "lucide-react";

// Items may declare `flag` (hidden when that platform feature flag is off) and `roles` (who may see it).
// Filter with navItemVisible() from @/lib/platform. Spec v1.0 §4.2 student pages come first.

/** Student app sidebar. */
export const APP_NAV = [
  { items: [{ to: "/app", label: "Home", icon: LayoutDashboard, end: true }] },
  {
    label: "Learn",
    items: [
      { to: "/app/learn", label: "My courses", icon: BookOpen },
      { to: "/app/catalog", label: "Explore courses", icon: Compass },
      { to: "/app/assessments", label: "Assessments", icon: FileCheck2 },
      { to: "/app/skills", label: "My skills", icon: BadgeCheck },
      { to: "/app/certificates", label: "Certificates", icon: Award },
      { to: "/app/tutor", label: "AI Tutor", icon: Bot, flag: "aiTutor" },
    ],
  },
  {
    label: "Work",
    items: [
      { to: "/app/opportunities", label: "Project opportunities", icon: Inbox },
      { to: "/app/projects", label: "My projects", icon: FolderOpen },
      { to: "/app/portfolio", label: "Portfolio", icon: FolderKanban },
      { to: "/app/ladder", label: "Earn ladder", icon: TrendingUp, flag: "gigs" },
      { to: "/app/gigs", label: "Gigs", icon: Briefcase, flag: "gigs" },
      { to: "/app/wallet", label: "Wallet", icon: Wallet, flag: "wallet" },
      { to: "/app/leaderboard", label: "Leaderboard", icon: Trophy, flag: "gamification" },
    ],
  },
  {
    label: "Together",
    items: [
      { to: "/app/community", label: "Community", icon: MessagesSquare, flag: "community" },
      { to: "/app/mentors", label: "Mentors", icon: GraduationCap, flag: "mentorBooking" },
      { to: "/app/cohorts", label: "Cohorts", icon: Users, flag: "cohorts" },
    ],
  },
  {
    label: "Account",
    items: [
      { to: "/app/payments", label: "Payments", icon: Receipt },
      { to: "/app/help", label: "Help & support", icon: LifeBuoy },
    ],
  },
];

export const MENTOR_NAV_ITEM = { to: "/app/mentor", label: "Mentor studio", icon: Presentation };

/** Mobile bottom bar (5 slots). */
export const MOBILE_NAV = [
  { to: "/app", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/app/learn", label: "Learn", icon: BookOpen },
  { to: "/app/assessments", label: "Assess", icon: FileCheck2 },
  { to: "/app/opportunities", label: "Work", icon: Inbox },
  { to: "/app/skills", label: "Skills", icon: BadgeCheck },
];

/** Staff console (/admin). `roles` = who may open the page; the route guard in App.jsx uses the same lists. */
const A = ["ADMIN"];
export const ADMIN_NAV = [
  { to: "/admin", label: "Overview", icon: BarChart3, end: true, roles: A },
  // catalogue & learning (spec §4.3 Admin — catalogue, cohorts, assessments)
  { to: "/admin/catalogue", label: "Categories & skills", icon: Shapes, roles: A },
  { to: "/admin/courses", label: "Courses", icon: Library, roles: A },
  { to: "/admin/assessments", label: "Assessments & rubrics", icon: ScrollText, roles: A },
  { to: "/admin/evaluations", label: "Evaluation queue", icon: ClipboardCheck, roles: ["ADMIN", "EVALUATOR", "MENTOR"] },
  { to: "/admin/verifications", label: "Verifications", icon: ShieldCheck, roles: A },
  { to: "/admin/submissions", label: "Lesson reviews", icon: FileCheck2, roles: A }, // mentors review in Mentor Studio (/app/mentor)
  // talent & projects (Admin — talent, projects; PM workspace)
  { to: "/admin/talent", label: "Verified talent", icon: UserSearch, roles: ["ADMIN", "PROJECT_MANAGER"] },
  { to: "/admin/offers", label: "Project offers", icon: Send, roles: ["ADMIN", "PROJECT_MANAGER"] },
  { to: "/admin/students", label: "Students", icon: Users, roles: A },
  // finance (Admin — finance)
  { to: "/admin/payments", label: "Course payments", icon: Receipt, roles: ["ADMIN", "FINANCE"] },
  { to: "/admin/payouts", label: "Project finance", icon: IndianRupee, roles: ["ADMIN", "FINANCE"] },
  { to: "/admin/reports", label: "Reports", icon: LineChart, roles: ["ADMIN", "FINANCE"] },
  // operations
  { to: "/admin/support", label: "Support", icon: Headset, roles: ["ADMIN", "PROJECT_MANAGER", "FINANCE"] },
  { to: "/admin/audit", label: "Audit log", icon: ScrollText, roles: A },
  { to: "/admin/gigs", label: "Gigs (legacy)", icon: Briefcase, roles: A, flag: "gigs" },
  { to: "/admin/applications", label: "Gig applications", icon: FolderKanban, roles: A, flag: "gigs" },
  { to: "/admin/colleges", label: "Colleges", icon: School, roles: A },
  { to: "/admin/mentors", label: "Mentors", icon: UserCog, roles: A },
  { to: "/admin/settings", label: "Settings", icon: Settings2, roles: A },
];
