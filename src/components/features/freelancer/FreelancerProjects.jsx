"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Clock from "lucide-react/dist/esm/icons/clock";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import Zap from "lucide-react/dist/esm/icons/zap";
import { motion } from "framer-motion";

import { RoleAwareSidebar } from "@/components/layout/RoleAwareSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FreelancerTopBar } from "@/components/features/freelancer/FreelancerTopBar";
import { useAuth } from "@/shared/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

// Skeleton for project cards while loading
const ProjectCardSkeleton = () => (
  <Card className="border border-border/60 bg-card/80">
    <CardContent className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-10" />
        </div>
        <Skeleton className="h-2 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
    </CardContent>
  </Card>
);

const statusConfig = {
  "in-progress": {
    label: "In Progress",
    icon: Clock,
    gradient: "from-primary to-yellow-400",
    badgeClass:
      "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    gradient: "from-emerald-500 to-teal-500",
    badgeClass:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  },
  pending: {
    label: "Pending",
    icon: AlertCircle,
    gradient: "from-orange-500 to-red-500",
    badgeClass:
      "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  },
};

const CircularProgress = ({ progress, gradient, size = 52, strokeWidth = 4 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/40"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="text-primary"
          style={{
            stroke: "url(#progressGradient)",
          }}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          strokeDasharray={circumference}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="#facc15" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-foreground">{progress}%</span>
      </div>
    </div>
  );
};

const ProjectCard = ({ project }) => {
  const config = statusConfig[project.status];
  const StatusIcon = config.icon;
  const budgetValue =
    typeof project.budget === "number"
      ? project.budget
      : Number(project.budget) || 0;
  const deadlineValue =
    project.deadline && typeof project.deadline === "string"
      ? project.deadline
      : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -8, transition: { duration: 0.25 } }}
      className="h-full"
    >
      <Card className="group relative h-full overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-br from-card/95 via-card/80 to-card/60 shadow-lg backdrop-blur-xl transition-all duration-500 hover:border-primary/50 hover:shadow-[0_20px_60px_-15px_rgba(253,200,0,0.25)]">
        {/* Animated top accent */}
        <div className="absolute inset-x-0 top-0 h-[2px] overflow-hidden">
          <motion.div
            className={`h-full w-[200%] bg-gradient-to-r ${config.gradient} via-transparent`}
            animate={{ x: ["-50%", "0%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* Hover shine sweep */}
        <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <motion.div
            className="absolute -top-1/2 left-0 h-[200%] w-16 rotate-12 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent"
            initial={{ x: "-100px" }}
            whileInView={{ x: "500px" }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
        </div>

        {/* Corner glow */}
        <div className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${config.gradient} opacity-[0.07] blur-2xl transition-opacity duration-500 group-hover:opacity-[0.15]`} />

        <CardContent className="relative z-10 flex h-full flex-col gap-5 p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-primary/60">
                Active project
              </p>
              <h3 className="line-clamp-2 text-lg font-bold tracking-tight text-foreground transition-colors duration-300 group-hover:text-primary">
                {project.title}
              </h3>
              <p className="text-xs text-muted-foreground">
                for{" "}
                <span className="font-semibold text-foreground/80">
                  {project.client}
                </span>
              </p>
            </div>
            <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
              <Badge
                variant="outline"
                className={`flex shrink-0 items-center gap-1.5 border px-2.5 py-1 text-[10px] font-semibold backdrop-blur-sm ${config.badgeClass}`}
              >
                <StatusIcon className="h-3 w-3" />
                {config.label}
              </Badge>
            </motion.div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="group/stat rounded-xl border border-border/20 bg-muted/20 px-4 py-3 transition-colors duration-200 hover:border-border/40 hover:bg-muted/30">
              <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground/60">
                Budget
              </p>
              <p className="text-lg font-bold tabular-nums text-foreground">
                {budgetValue
                  ? `₹${Math.floor(budgetValue * 0.7).toLocaleString()}`
                  : "TBD"}
              </p>
            </div>
            <div className="group/stat rounded-xl border border-border/20 bg-muted/20 px-4 py-3 transition-colors duration-200 hover:border-border/40 hover:bg-muted/30">
              <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground/60">
                Deadline
              </p>
              <p className="text-sm font-bold text-foreground">
                {deadlineValue || "TBD"}
              </p>
            </div>
          </div>

          {/* Progress section */}
          <div className="flex items-center gap-4 rounded-xl border border-border/20 bg-muted/10 px-4 py-3">
            <CircularProgress
              progress={project.progress}
              gradient={config.gradient}
            />
            <div className="flex-1 space-y-1.5">
              <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground/60">
                Progress
              </p>
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${config.gradient}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${project.progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                />
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            asChild
            className={`mt-auto w-full gap-2 rounded-xl bg-gradient-to-r ${config.gradient} py-5 text-sm font-bold text-background shadow-md transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 hover:brightness-110`}
          >
            <Link to={`/freelancer/project/${project.id}`}>
              View details
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{
                  duration: 1.8,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              >
                <ArrowRight className="h-4 w-4" />
              </motion.div>
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const FreelancerProjectsContent = () => {
  const { authFetch, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const view = (searchParams.get("view") || "").toLowerCase();
  const showOnlyOngoing = view === "ongoing";
  const visibleProjects = useMemo(() => {
    if (!showOnlyOngoing) return projects;
    return projects.filter((project) => project.status !== "completed");
  }, [projects, showOnlyOngoing]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        const response = await authFetch("/proposals");
        const payload = await response.json().catch(() => null);
        const proposals = Array.isArray(payload?.data) ? payload.data : [];
        const accepted = proposals.filter(
          (p) => (p.status || "").toUpperCase() === "ACCEPTED" && p.project
        );
        const uniqueProjects = new Map();
        accepted.forEach((p) => {
          const project = p.project;
          if (!project?.id) return;
          if (!uniqueProjects.has(project.id)) {
            // Calculate progress - use project.progress if available, default to 0
            const projectProgress = typeof project.progress === "number"
              ? project.progress
              : 0;

            // Determine status based on progress
            let projectStatus = "pending";
            if (projectProgress === 100) {
              projectStatus = "completed";
            } else if (projectProgress > 0) {
              projectStatus = "in-progress";
            }

            uniqueProjects.set(project.id, {
              id: project.id,
              title: project.title || "Project",
              client:
                project.owner?.fullName ||
                project.owner?.name ||
                project.owner?.email ||
                "Client",
              status: projectStatus,
              budget: project.budget || 0,
              deadline: project.deadline || "",
              progress: projectProgress,
            });
          }
        });
        setProjects(Array.from(uniqueProjects.values()));
      } catch (error) {
        console.error("Failed to load projects from API:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [authFetch, isAuthenticated]);

  return (
    <div className="flex-1 flex flex-col relative h-full overflow-hidden bg-background transition-colors duration-300">
      <FreelancerTopBar />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 z-10 relative scroll-smooth">
        <div className="max-w-[1600px] mx-auto space-y-6">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm uppercase tracking-[0.4em] text-primary/70">
                Freelancer projects
              </p>
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                {showOnlyOngoing ? "Ongoing Projects" : "All Projects"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {showOnlyOngoing
                  ? "Showing active and pending projects only."
                  : "Showing every project in your pipeline."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                asChild
                size="sm"
                variant={showOnlyOngoing ? "default" : "outline"}
                className="rounded-full px-4"
              >
                <Link to="/freelancer/project?view=ongoing">Ongoing</Link>
              </Button>
              <Button
                asChild
                size="sm"
                variant={showOnlyOngoing ? "outline" : "default"}
                className="rounded-full px-4"
              >
                <Link to="/freelancer/project">All</Link>
              </Button>
            </div>
          </header>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {isLoading ? (
              [1, 2, 3].map((i) => <ProjectCardSkeleton key={i} />)
            ) : visibleProjects.length ? (
              visibleProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))
            ) : (
              <div className="col-span-full rounded-xl border border-dashed border-border/60 bg-card/40 px-4 py-6 text-sm text-muted-foreground">
                {showOnlyOngoing ? "No ongoing projects yet." : "No projects yet."}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const FreelancerProjects = () => {
  return (
    <RoleAwareSidebar>
      <FreelancerProjectsContent />
    </RoleAwareSidebar>
  );
};

export default FreelancerProjects;
