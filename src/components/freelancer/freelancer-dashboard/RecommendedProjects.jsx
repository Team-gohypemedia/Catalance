import React from "react";
import { useNavigate } from "react-router-dom";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import Clock from "lucide-react/dist/esm/icons/clock";
import IndianRupee from "lucide-react/dist/esm/icons/indian-rupee";
import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import { cn } from "@/shared/lib/utils";
import { FreelancerDashboardPanel } from "./shared.jsx";

const MOCK_RECOMMENDED_PROJECTS = [
  {
    id: "mock-proj-1",
    title: "React Developer for SaaS Dashboard",
    clientName: "CloudScale Inc.",
    summary: "Build an interactive analytics dashboard with real-time charting, dark mode toggling, and clean responsive flex grids.",
    budget: "₹2,800",
    timeline: "4 Weeks",
    serviceName: "Web Development",
    tags: ["React", "TailwindCSS", "Recharts"]
  },
  {
    id: "mock-proj-2",
    title: "E-Commerce Page Refactoring",
    clientName: "GreenGrocer Co.",
    summary: "Optimize landing page load performance and modernise visual style with high-end Tailwind layout and slide show animations.",
    budget: "₹1,500",
    timeline: "2 Weeks",
    serviceName: "Web Development",
    tags: ["JavaScript", "SEO", "TailwindCSS"]
  },
  {
    id: "mock-proj-3",
    title: "Next.js Blog Integration",
    clientName: "FutureTech Media",
    summary: "Configure a headless CMS with a server-side rendered Next.js blog template. Fast loading times and semantic HTML structure required.",
    budget: "₹3,200",
    timeline: "5 Weeks",
    serviceName: "Web Development",
    tags: ["Next.js", "CMS", "API"]
  }
];

const RecommendedProjectCard = ({ item }) => {
  const navigate = useNavigate();

  // Normalize fields between live database models and mock models
  const title = item.title || "Untitled Project";
  const clientName = item.clientName || item.companyName || "Verified Client";
  const summary = item.summary || item.description || "No project summary provided.";
  const rawBudget = item.budget || (item.minBudget ? `₹${item.minBudget} - ₹${item.maxBudget}` : "Negotiable");
  const budget = typeof rawBudget === "string" ? rawBudget.replace(/\$/g, "₹") : rawBudget;
  const timeline = item.timeline || item.duration || "Flexible";
  const serviceName = item.serviceName || "General Services";
  const tags = Array.isArray(item.tags) ? item.tags : [serviceName];

  return (
    <FreelancerDashboardPanel className="flex flex-col p-5 bg-card border border-border/55 dark:border-white/[0.06] hover:border-[#D9692A]/30 dark:hover:border-[#F9D949]/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-md relative overflow-hidden group">
      {/* Sparkle decorative element on hover */}
      <div className="absolute top-3 right-3 text-[#D9692A]/40 dark:text-[#F9D949]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <Sparkles className="size-4 animate-pulse" />
      </div>

      {/* Main Category / Tag */}
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        <Briefcase className="size-3 text-muted-foreground/75" />
        <span>{serviceName}</span>
      </div>

      {/* Project Title */}
      <h3 className="mt-2.5 text-base font-extrabold text-foreground tracking-tight line-clamp-1 group-hover:text-[#D9692A] dark:group-hover:text-[#F9D949] transition-colors">
        {title}
      </h3>

      {/* Client Subtitle */}
      <p className="text-xs text-muted-foreground mt-1 font-medium">
        Client: <span className="text-foreground/90 font-semibold">{clientName}</span>
      </p>

      {/* Brief Summary Description */}
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground/90 line-clamp-2 h-8.5">
        {summary}
      </p>

      {/* Budget and Timeline Badges */}
      <div className="mt-4 grid grid-cols-2 gap-2 bg-black/[0.015] dark:bg-white/[0.015] p-2.5 rounded-xl border border-border/30 dark:border-white/[0.02]">
        <div className="flex flex-col">
          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-0.5">
            <IndianRupee className="size-2.5" /> Budget
          </span>
          <span className="text-sm font-extrabold text-foreground mt-0.5">{budget}</span>
        </div>
        <div className="flex flex-col pl-2 border-l border-border/40 dark:border-white/[0.04]">
          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-0.5">
            <Clock className="size-2.5" /> Timeline
          </span>
          <span className="text-sm font-extrabold text-foreground mt-0.5">{timeline}</span>
        </div>
      </div>

      {/* Tag Badges List */}
      <div className="mt-4 flex flex-wrap gap-1.5 min-h-[22px]">
        {tags.slice(0, 3).map((tag, idx) => (
          <span
            key={`tag-${idx}`}
            className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-black/[0.03] dark:bg-white/[0.03] text-muted-foreground border border-border/30 dark:border-white/[0.02]"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Apply Action Button */}
      <div className="mt-5 pt-3 border-t border-border/45 dark:border-white/[0.04]">
        <button
          type="button"
          onClick={() => navigate("/marketplace/web_development")}
          className="w-full flex items-center justify-center gap-1.5 h-10 rounded-full text-xs font-bold bg-transparent border border-[#D9692A] text-[#D9692A] hover:bg-[#D9692A] hover:text-white dark:border-[#F9D949] dark:text-[#F9D949] dark:hover:bg-[#F9D949] dark:hover:text-[#1C1B1F] transition-all duration-200"
        >
          <span>View & Apply</span>
          <ArrowUpRight className="size-3.5" />
        </button>
      </div>
    </FreelancerDashboardPanel>
  );
};

const RecommendedProjects = ({ liveProjects = [], userServices = [], className = "" }) => {
  const navigate = useNavigate();
  const filterByServices = (projects) => {
    if (!userServices || userServices.length === 0) return projects;
    
    return projects.filter(p => {
       const rawService = p.serviceName || p.service || p.category || "";
       const pService = String(typeof rawService === 'object' ? (rawService.name || rawService.title || rawService.label) : rawService).toLowerCase().trim();
       if (!pService) return true;
       
       return userServices.some(us => {
          const usStr = String(us || "").toLowerCase().trim();
          
          const normalize = (str) => {
            return str
              .replace(/[-_&/]/g, ' ')
              .replace(/\s+/g, ' ')
              .replace(/website/g, 'web')
              .replace(/mobile app/g, 'app')
              .trim();
          };
          
          const nUs = normalize(usStr);
          const nP = normalize(pService);
          
          return nP.includes(nUs) || nUs.includes(nP) || nP === nUs;
       });
    });
  };

  const validLive = filterByServices(Array.isArray(liveProjects) ? liveProjects : []);
  const validMocks = filterByServices(MOCK_RECOMMENDED_PROJECTS);
  
  const projectsToDisplay = validLive.length > 0
    ? validLive.slice(0, 3)
    : validMocks.slice(0, 3);

  if (projectsToDisplay.length === 0) {
    return (
      <section className={cn("w-full min-w-0", className)}>
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-[22px] sm:text-[1.75rem] font-semibold tracking-[-0.02em] dark:text-white text-[#1C1B1F]">
            Recommended Projects
          </h2>
          <button
            type="button"
            onClick={() => navigate("/marketplace")}
            className="ml-auto shrink-0 text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary)] transition-colors hover:text-[#ffd54f]"
          >
            View All
          </button>
        </div>
        <FreelancerDashboardPanel className="flex min-h-[140px] flex-col items-center justify-center p-6 text-center sm:p-8">
          <div className="flex size-12 items-center justify-center rounded-full bg-black/[0.05] dark:bg-white/[0.06] text-muted-foreground">
            <Briefcase className="size-6" />
          </div>
          <p className="mt-4 text-sm font-semibold dark:text-white text-[#1C1B1F]">No perfect matches right now</p>
          <p className="mt-2 max-w-[280px] text-xs text-[#8f8f8f]">
            We're searching for projects that match your exact services. Check back soon!
          </p>
        </FreelancerDashboardPanel>
      </section>
    );
  }

  return (
    <section className={cn("w-full min-w-0", className)}>
      {/* Outside Heading */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-[22px] sm:text-[1.75rem] font-semibold tracking-[-0.02em] dark:text-white text-[#1C1B1F]">
          Recommended Projects
        </h2>
        <button
          type="button"
          onClick={() => navigate("/marketplace")}
          className="ml-auto shrink-0 text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary)] transition-colors hover:text-[#ffd54f]"
        >
          View All
        </button>
      </div>

      {/* Grid container for cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {projectsToDisplay.map((project) => (
          <RecommendedProjectCard key={project.id} item={project} />
        ))}
      </div>
    </section>
  );
};

export default RecommendedProjects;
