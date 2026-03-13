"use client";

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Clock from "lucide-react/dist/esm/icons/clock";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import Circle from "lucide-react/dist/esm/icons/circle";
import Zap from "lucide-react/dist/esm/icons/zap";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import { motion } from "framer-motion";

import { RoleAwareSidebar } from "@/components/layout/RoleAwareSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClientTopBar } from "@/components/features/client/ClientTopBar";
import ClientDashboardFooter from "@/components/features/client/ClientDashboardFooter";
import { useAuth } from "@/shared/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { processProjectInstallmentPayment } from "@/shared/lib/project-payment";
import { toast } from "sonner";

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

const normalizeClientProjects = (remote = []) =>
  remote
    .map((p) => {
      const proposals = Array.isArray(p.proposals) ? p.proposals : [];
      const accepted = proposals.find(
        (pr) => (pr.status || "").toUpperCase() === "ACCEPTED"
      );
      const pending = proposals
        .filter((pr) => (pr.status || "").toUpperCase() === "PENDING")
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        );

      if (!accepted && pending.length === 0) return null;

      const rawStatus = (p.status || "").toUpperCase();
      const awaitingFreelancerAcceptance = !accepted;
      const paymentPlan =
        p.paymentPlan && typeof p.paymentPlan === "object" ? p.paymentPlan : null;
      const dueInstallment = paymentPlan?.nextDueInstallment || null;
      const initialPaymentPending = Boolean(accepted) && dueInstallment?.sequence === 1;
      const projectProgress = typeof p.progress === "number" ? p.progress : 0;

      let displayStatus = "pending";
      if (!awaitingFreelancerAcceptance) {
        if (rawStatus === "COMPLETED" || paymentPlan?.isFullyPaid || projectProgress === 100) {
          displayStatus = "completed";
        } else if (projectProgress > 0 || rawStatus === "IN_PROGRESS") {
          displayStatus = "in-progress";
        }
      }

      const acceptedFreelancerName =
        accepted?.freelancer?.fullName ||
        accepted?.freelancer?.name ||
        accepted?.freelancer?.email;
      const pendingFreelancerName =
        pending[0]?.freelancer?.fullName ||
        pending[0]?.freelancer?.name ||
        pending[0]?.freelancer?.email;
      const freelancerLabel = accepted
        ? acceptedFreelancerName || "Freelancer"
        : pending.length > 1
          ? `${pending.length} invited freelancers`
          : pendingFreelancerName || "Invited freelancer";

      return {
        id: p.id,
        title: p.title || "Project",
        freelancer: freelancerLabel,
        status: displayStatus,
        budget: p.budget || 0,
        deadline: p.deadline || "",
        progress:
          awaitingFreelancerAcceptance || initialPaymentPending ? 0 : projectProgress,
        paymentPending: Boolean(dueInstallment),
        initialPaymentPending,
        awaitingFreelancerAcceptance,
        paymentPlan,
        dueInstallment,
      };
    })
    .filter(Boolean);

const ProjectCard = ({ project, onPay, isPaying }) => {
  const config = statusConfig[project.status] || statusConfig.pending;
  const StatusIcon = config.icon;
  const budgetValue =
    typeof project.budget === "number" ? project.budget : Number(project.budget) || 0;
  const deadlineValue =
    project.deadline && typeof project.deadline === "string" ? project.deadline : "";
  const timelineSteps = [
    ...(project.awaitingFreelancerAcceptance
      ? [
          {
            id: "proposal-sent",
            label: "Proposal Sent",
            state: "done",
          },
          {
            id: "freelancer-acceptance",
            label: "Freelancer Acceptance",
            state: "current",
          },
          {
            id: "client-payment",
            label: "Client Payment",
            state: "upcoming",
          },
        ]
      : [
          {
            id: "proposal-accepted",
            label: "Proposal Accepted",
            state: "done",
          },
          {
            id: "freelancer-active",
            label: "Freelance Active",
            state: project.initialPaymentPending ? "upcoming" : "done",
          },
          {
            id: "pending-payment",
            label: "Pending your payment",
            state: project.initialPaymentPending ? "current" : "done",
          },
        ]),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -6 }}
      className="h-full">
      <Card className="group relative h-full overflow-hidden border border-border/50 bg-card/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:shadow-[0_25px_80px_-50px_rgba(253,200,0,0.65)]">
        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${config.gradient}`} />
        <CardContent className="relative z-10 flex h-full flex-col gap-6 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <p className="text-xs uppercase tracking-[0.35em] text-primary/70">
                {project.awaitingFreelancerAcceptance
                  ? "Proposal in review"
                  : "Active project"}
              </p>
              <h3 className="line-clamp-2 text-xl font-semibold text-foreground transition-colors duration-300 group-hover:text-primary">
                {project.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                Freelancer{" "}
                <span className="font-medium text-foreground">
                  {project.freelancer}
                </span>
              </p>
            </div>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Badge
                variant="outline"
                className={`flex items-center gap-1.5 border px-3 py-1 text-xs font-medium ${config.badgeClass}`}>
                <StatusIcon className="h-3.5 w-3.5" />
                {config.label}
              </Badge>
            </motion.div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-b border-border/40 pb-5 text-sm">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground/80">
                Budget
              </p>
              <p className="text-2xl font-semibold text-foreground">
                {budgetValue ? `₹${budgetValue.toLocaleString()}` : "TBD"}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground/80">
                Deadline
              </p>
              <p className="text-sm font-semibold text-foreground">
                {deadlineValue || "TBD"}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-background/30 p-4">
            <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground/80">
              Project steps
            </p>
            <ol className="mt-3 space-y-2">
              {timelineSteps.map((step) => {
                const isDone = step.state === "done";
                const isCurrent = step.state === "current";
                const StepIcon = isDone ? CheckCircle2 : isCurrent ? Clock : Circle;

                return (
                  <li
                    key={step.id}
                    className={`flex items-center gap-2 text-sm ${
                      isDone
                        ? "text-emerald-400"
                        : isCurrent
                        ? "text-amber-300"
                        : "text-muted-foreground"
                    }`}
                  >
                    <StepIcon className="h-4 w-4 shrink-0" />
                    <span>{step.label}</span>
                  </li>
                );
              })}
            </ol>

            {project.awaitingFreelancerAcceptance ? (
              <p className="mt-3 text-xs text-amber-300/90">
                Waiting for freelancer acceptance.
              </p>
            ) : null}

            {project.initialPaymentPending ? (
              <p className="mt-3 text-xs text-amber-300/90">
                Messages will start after the initial 20% payment.
              </p>
            ) : null}

            {project.paymentPending && !project.initialPaymentPending ? (
              <p className="mt-3 text-xs text-amber-300/90">
                Payment due: {project.dueInstallment?.label} ({project.dueInstallment?.percentage}%).
              </p>
            ) : null}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground/80">
                Progress
              </p>
              <span className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Zap className="h-4 w-4" />
                {project.progress}%
              </span>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${config.gradient}`}
                initial={{ width: 0 }}
                animate={{ width: `${project.progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>

          <div className="mt-auto space-y-2">
            {project.paymentPending && onPay ? (
              <Button
                onClick={() => onPay(project)}
                disabled={isPaying}
                className="w-full gap-2 rounded-full bg-primary py-5 font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90"
              >
                {isPaying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                {isPaying ? "Processing..." : project.dueInstallment ? `Pay ${project.dueInstallment.percentage}%` : "Pay now"}
              </Button>
            ) : null}

            {project.awaitingFreelancerAcceptance ? (
              <Button
                asChild
                variant="outline"
                className="w-full gap-2 rounded-full border-border/60 bg-card/50 py-5 font-semibold text-foreground hover:bg-card/70"
              >
                <Link
                  to={`/client/proposal?projectId=${encodeURIComponent(project.id)}&tab=pending&action=view`}
                >
                  Review Proposal
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : null}

            <Button
              asChild
              className={`w-full gap-2 rounded-full bg-gradient-to-r ${config.gradient} py-5 font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-primary/30`}
            >
              <Link to={`/client/project/${project.id}`}>
                View details
                <motion.div
                  animate={{ x: [0, 6, 0] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                >
                  <ArrowRight className="h-4 w-4" />
                </motion.div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ClientProjectsContent = () => {
  const { authFetch, isAuthenticated } = useAuth();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingProjectId, setProcessingProjectId] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        const response = await authFetch("/projects");
        const payload = await response.json().catch(() => null);
        const remote = Array.isArray(payload?.data) ? payload.data : [];
        setProjects(normalizeClientProjects(remote));
      } catch (error) {
        console.error("Failed to load projects from API:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [authFetch, isAuthenticated]);

  const handleApproveAndPay = async (project) => {
    if (!project?.id) return;

    setProcessingProjectId(project.id);
    try {
      const paymentResult = await processProjectInstallmentPayment({
        authFetch,
        projectId: project.id,
        description: `${project.dueInstallment?.label || "Project payment"} for ${
          project.title || "project"
        }`,
      });

      toast.success(
        paymentResult?.message || "Payment completed successfully."
      );

      const response = await authFetch("/projects");
      const payload = await response.json().catch(() => null);
      const remote = Array.isArray(payload?.data) ? payload.data : [];
      setProjects(normalizeClientProjects(remote));
    } catch (error) {
      console.error("Project payment failed:", error);
      toast.error(error?.message || "Failed to process payment");
    } finally {
      setProcessingProjectId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative h-full overflow-hidden bg-background transition-colors duration-300">
      <ClientTopBar />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 z-10 relative scroll-smooth">
        <div className="max-w-[1600px] mx-auto space-y-6">
          <header className="space-y-3">
            <p className="text-sm uppercase tracking-[0.4em] text-primary/70">
              Client projects
            </p>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-semibold">Project tracker</h1>
                <p className="text-muted-foreground">
                  Monitor freelancer work, budgets, and deadlines in one place.
                </p>
              </div>
            </div>
          </header>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {isLoading ? (
              // Show skeleton cards while loading
              [1, 2, 3].map((i) => <ProjectCardSkeleton key={i} />)
            ) : projects.length ? (
              projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onPay={handleApproveAndPay}
                  isPaying={processingProjectId === project.id}
                />
              ))
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-6 text-muted-foreground">
                  No projects yet. Pending and accepted proposals will appear here.
                </CardContent>
              </Card>
            )}
          </div>

          <ClientDashboardFooter />
        </div>
      </main>
    </div>
  );
};

const ClientProjects = () => {
  return (
    <RoleAwareSidebar>
      <ClientProjectsContent />
    </RoleAwareSidebar>
  );
};

export default ClientProjects;







