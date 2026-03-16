"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import ClipboardList from "lucide-react/dist/esm/icons/clipboard-list";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import { Link } from "react-router-dom";
import ClientDashboardFooter from "@/components/features/client/ClientDashboardFooter";
import ClientWorkspaceHeader from "@/components/features/client/ClientWorkspaceHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/shared/context/AuthContext";
import { useNotifications } from "@/shared/context/NotificationContext";
import { formatINR } from "@/shared/lib/currency";
import { processProjectInstallmentPayment } from "@/shared/lib/project-payment";
import { cn } from "@/shared/lib/utils";
import { toast } from "sonner";

const PROJECT_PROGRESS_BY_STATUS = Object.freeze({
  COMPLETED: 100,
  IN_PROGRESS: 45,
  AWAITING_PAYMENT: 76,
  OPEN: 24,
  DRAFT: 14,
});

const projectStatusToneMap = {
  success: "border-[#14532d] bg-[#0c2616] text-[#34d399]",
  warning: "border-[#5a3b0d] bg-[#2f1e05] text-[#fbbf24]",
  slate: "border-white/[0.08] bg-white/[0.04] text-[#cbd5e1]",
};

const projectActionToneMap = {
  amber: "bg-[#ffc107] text-black hover:bg-[#ffd54f] disabled:bg-[#ffc107]/70",
  slate: "bg-white/[0.08] text-white hover:bg-white/[0.12] disabled:bg-white/[0.08]",
};

const projectFilterOptions = [
  { key: "ongoing", label: "Ongoing Projects" },
  { key: "completed", label: "Completed Projects" },
];

const getDisplayName = (user) =>
  user?.fullName || user?.name || user?.email?.split("@")[0] || "Client";

const getInitials = (value = "") => {
  const parts = String(value)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "C";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const formatProjectDate = (value) => {
  if (!value) return "";

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "";

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const clampProgress = (value) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

const resolveProjectProgress = (project) => {
  const explicitProgress = Number(project.progress);
  if (Number.isFinite(explicitProgress) && explicitProgress > 0) {
    return clampProgress(explicitProgress);
  }

  if (project.awaitingFreelancerAcceptance) {
    return 18;
  }

  if (project.initialPaymentPending) {
    return 24;
  }

  return PROJECT_PROGRESS_BY_STATUS[project.rawStatus] ?? 18;
};

const resolveProjectStatusMeta = (project) => {
  if (project.rawStatus === "COMPLETED" || resolveProjectProgress(project) >= 100) {
    return { label: "Completed", tone: "success" };
  }

  if (project.awaitingFreelancerAcceptance) {
    return { label: "Pending Review", tone: "slate" };
  }

  return { label: "In Progress", tone: "warning" };
};

const buildProjectMilestones = (project) => {
  if (project.rawStatus === "COMPLETED") {
    return [
      { label: "Proposal Accepted", state: "complete" },
      { label: "Freelancer Started", state: "complete" },
      { label: "Payment Received", state: "complete" },
    ];
  }

  if (project.awaitingFreelancerAcceptance) {
    return [
      { label: "Proposal Sent", state: "complete" },
      { label: "Freelancer Acceptance", state: "current" },
      { label: "Project Kickoff", state: "pending" },
    ];
  }

  if (project.paymentPending) {
    return [
      { label: "Proposal Accepted", state: "complete" },
      {
        label: project.initialPaymentPending ? "Freelancer Onboarding" : "Work Delivered",
        state: project.initialPaymentPending ? "current" : "complete",
      },
      {
        label: project.initialPaymentPending ? "Release Kickoff Payment" : "Release Payment",
        state: "current",
      },
    ];
  }

  return [
    { label: "Proposal Accepted", state: "complete" },
    { label: "Work in Progress", state: "current" },
    { label: "Final Handover", state: "pending" },
  ];
};

const normalizeClientProjects = (remote = []) =>
  remote
    .map((project) => {
      const proposals = Array.isArray(project?.proposals) ? project.proposals : [];
      const acceptedProposal = proposals.find(
        (proposal) => String(proposal?.status || "").toUpperCase() === "ACCEPTED",
      );
      const pendingProposals = proposals
        .filter((proposal) => String(proposal?.status || "").toUpperCase() === "PENDING")
        .sort(
          (left, right) =>
            new Date(right?.createdAt || 0).getTime() -
            new Date(left?.createdAt || 0).getTime(),
        );

      if (!acceptedProposal && pendingProposals.length === 0) {
        return null;
      }

      const spotlightFreelancer =
        acceptedProposal?.freelancer || pendingProposals[0]?.freelancer || null;
      const paymentPlan =
        project?.paymentPlan && typeof project.paymentPlan === "object"
          ? project.paymentPlan
          : null;
      const dueInstallment = paymentPlan?.nextDueInstallment || null;
      const budgetValue = Number(project?.budget) || 0;
      const rawStatus = String(project?.status || "").toUpperCase();

      return {
        id: project?.id,
        rawStatus,
        title: project?.title || "Untitled Project",
        sectionLabel: acceptedProposal ? "Active Project" : "Proposal In Review",
        freelancerName:
          spotlightFreelancer?.fullName ||
          spotlightFreelancer?.name ||
          (pendingProposals.length > 1
            ? `${pendingProposals.length} invited freelancers`
            : "Freelancer review"),
        freelancerAvatar: spotlightFreelancer?.avatar || "",
        freelancerRole:
          spotlightFreelancer?.jobTitle ||
          spotlightFreelancer?.professionalTitle ||
          spotlightFreelancer?.headline ||
          (acceptedProposal
            ? "Assigned Freelancer"
            : pendingProposals.length > 1
              ? `${pendingProposals.length} proposals pending`
              : "Awaiting acceptance"),
        freelancerInitial: getInitials(
          spotlightFreelancer?.fullName ||
            spotlightFreelancer?.name ||
            project?.title ||
            "Project",
        ),
        budgetValue,
        budgetLabel: budgetValue > 0 ? formatINR(budgetValue) : "TBD",
        timelineLabel: formatProjectDate(
          project?.deadline ||
            project?.dueDate ||
            project?.targetDate ||
            acceptedProposal?.deadline,
        ),
        paymentPending: Boolean(dueInstallment),
        initialPaymentPending: Boolean(acceptedProposal) && dueInstallment?.sequence === 1,
        awaitingFreelancerAcceptance: !acceptedProposal,
        dueInstallment,
        progress: Number(project?.progress) || 0,
      };
    })
    .filter(Boolean);

const buildProjectCardModel = (project) => {
  const statusMeta = resolveProjectStatusMeta(project);
  const progressValue = resolveProjectProgress(project);
  const milestones = buildProjectMilestones(project);

  if (project.paymentPending) {
    return {
      ...project,
      statusMeta,
      progressValue,
      milestones,
      dateLabel: project.timelineLabel ? "Deadline" : "Timeline",
      dateValue: project.timelineLabel || "To be finalized",
      actionType: "pay",
      actionLabel: `Pay ${project.dueInstallment?.percentage || ""}%`,
      actionTone: "amber",
    };
  }

  if (project.awaitingFreelancerAcceptance) {
    return {
      ...project,
      statusMeta,
      progressValue,
      milestones,
      dateLabel: project.timelineLabel ? "Deadline" : "Timeline",
      dateValue: project.timelineLabel || "To be finalized",
      actionType: "link",
      actionHref: `/client/proposal?projectId=${encodeURIComponent(project.id)}&tab=pending&action=view`,
      actionLabel: "Review Proposal",
      actionTone: "slate",
    };
  }

  if (project.rawStatus === "COMPLETED") {
    return {
      ...project,
      statusMeta,
      progressValue,
      milestones,
      dateLabel: project.timelineLabel ? "Deadline" : "Timeline",
      dateValue: project.timelineLabel || "To be finalized",
      actionType: "link",
      actionHref: `/client/project/${project.id}`,
      actionLabel: "View Summary",
      actionTone: "slate",
    };
  }

  return {
    ...project,
    statusMeta,
    progressValue,
    milestones,
    dateLabel: project.timelineLabel ? "Deadline" : "Timeline",
    dateValue: project.timelineLabel || "To be finalized",
    actionType: "link",
    actionHref: `/client/project/${project.id}`,
    actionLabel: "View Details",
    actionTone: "amber",
  };
};

const ProjectCardSkeleton = () => (
  <div className="rounded-[28px] border border-white/[0.06] bg-accent p-6">
    <Skeleton className="h-6 w-32 bg-white/8" />
    <Skeleton className="mt-5 h-10 w-56 bg-white/8" />
    <div className="mt-6 flex items-center gap-3">
      <Skeleton className="size-11 rounded-full bg-white/8" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-36 bg-white/8" />
        <Skeleton className="h-4 w-28 bg-white/8" />
      </div>
    </div>
    <div className="mt-6 grid grid-cols-2 gap-4">
      <Skeleton className="h-24 rounded-[14px] bg-white/8" />
      <Skeleton className="h-24 rounded-[14px] bg-white/8" />
    </div>
    <Skeleton className="mt-7 h-2 w-full rounded-full bg-white/8" />
    <div className="mt-6 space-y-3">
      <Skeleton className="h-5 w-40 bg-white/8" />
      <Skeleton className="h-5 w-36 bg-white/8" />
      <Skeleton className="h-5 w-32 bg-white/8" />
    </div>
    <Skeleton className="mt-8 h-12 w-full rounded-[14px] bg-white/8" />
  </div>
);

const ProjectMilestone = ({ item }) => {
  const isComplete = item.state === "complete";
  const isCurrent = item.state === "current";

  return (
    <div className="flex items-center gap-3">
      {isComplete ? (
        <CheckCircle2 className="size-5 shrink-0 fill-[#ffc107] text-[#ffc107]" />
      ) : isCurrent ? (
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-[#ffc107]/50">
          <span className="size-1.5 rounded-full bg-[#ffc107]" />
        </span>
      ) : (
        <span className="size-5 shrink-0 rounded-full border border-white/[0.1]" />
      )}

      <span
        className={cn(
          "text-[0.98rem] leading-6",
          isComplete || isCurrent ? "text-[#f3f4f6]" : "text-[#6b7280]",
        )}
      >
        {item.label}
      </span>
    </div>
  );
};

const ProjectProposalCard = ({ project, onPay, isPaying }) => {
  const progressText = `${project.progressValue}%`;
  const actionClassName = cn(
    "mt-8 flex w-full items-center justify-center rounded-[14px] px-4 py-3.5 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-80",
    projectActionToneMap[project.actionTone] || projectActionToneMap.slate,
  );

  return (
    <article className="flex h-full flex-col rounded-[28px] border border-white/[0.06] bg-accent p-6 transition-transform duration-200 hover:-translate-y-1">
      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-4">
          <span className="rounded-[8px] bg-white/[0.06] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-[#9ca3af]">
            {project.sectionLabel}
          </span>

          <span
            className={cn(
              "inline-flex rounded-full border px-3 py-1 text-[0.82rem] font-semibold",
              projectStatusToneMap[project.statusMeta.tone] || projectStatusToneMap.slate,
            )}
          >
            {project.statusMeta.label}
          </span>
        </div>

        <h2 className="mt-5 text-[clamp(1.75rem,2vw,2.15rem)] font-semibold tracking-[-0.04em] text-white">
          {project.title}
        </h2>

        <div className="mt-6 flex items-center gap-3">
          <Avatar className="size-11 shrink-0 border border-white/10 shadow-[0_12px_24px_rgba(0,0,0,0.24)]">
            <AvatarImage src={project.freelancerAvatar} alt={project.freelancerName} />
            <AvatarFallback className="bg-[#1f2937] text-sm text-white">
              {project.freelancerInitial}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <p className="truncate text-[1rem] font-medium text-white">{project.freelancerName}</p>
            <p className="truncate text-sm text-[#8f96a3]">{project.freelancerRole}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-[14px] border border-white/[0.05] bg-black/20 p-4">
            <p className="text-[0.76rem] uppercase tracking-[0.16em] text-[#7f8794]">Budget</p>
            <p className="mt-3 text-[1.1rem] font-semibold tracking-[-0.02em] text-white">
              {project.budgetLabel}
            </p>
          </div>

          <div className="rounded-[14px] border border-white/[0.05] bg-black/20 p-4">
            <p className="text-[0.76rem] uppercase tracking-[0.16em] text-[#7f8794]">
              {project.dateLabel}
            </p>
            <p className="mt-3 text-[1.1rem] font-semibold tracking-[-0.02em] text-white">
              {project.dateValue}
            </p>
          </div>
        </div>

        <div className="mt-7 flex items-center justify-between gap-3">
          <span className="text-sm text-[#9ca3af]">Overall Progress</span>
          <span className="text-sm font-semibold text-[#ffc107]">{progressText}</span>
        </div>

        <div className="mt-3 h-2 rounded-full bg-white/[0.08]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.92),rgba(255,255,255,0.62))]"
            style={{ width: `${project.progressValue}%` }}
          />
        </div>

        <div className="mt-6 space-y-3">
          {project.milestones.map((milestone) => (
            <ProjectMilestone key={`${project.id}-${milestone.label}`} item={milestone} />
          ))}
        </div>

        {project.actionType === "pay" ? (
          <button
            type="button"
            onClick={() => onPay(project)}
            disabled={isPaying}
            className={actionClassName}
          >
            {isPaying ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 size-4" />
                {project.actionLabel}
              </>
            )}
          </button>
        ) : (
          <Link to={project.actionHref} className={actionClassName}>
            {project.actionLabel}
          </Link>
        )}
      </div>
    </article>
  );
};

const EmptyProjectsState = ({
  title = "No projects yet",
  description = "Active and pending collaborations will appear here once freelancers accept your proposals.",
  showAction = true,
}) => (
  <div className="rounded-[28px] border border-white/[0.06] bg-accent p-8 text-center">
    <div className="mx-auto flex max-w-md flex-col items-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-white/[0.06] text-[#94a3b8]">
        <ClipboardList className="size-7" />
      </div>
      <h2 className="mt-6 text-[1.35rem] font-semibold tracking-[-0.03em] text-white">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-6 text-[#94a3b8]">
        {description}
      </p>
      {showAction ? (
        <Link
          to="/client/proposal"
          className="mt-6 inline-flex items-center justify-center rounded-[14px] bg-[#ffc107] px-5 py-3 text-sm font-semibold text-black transition-colors hover:bg-[#ffd54f]"
        >
          Create New Proposal
        </Link>
      ) : null}
    </div>
  </div>
);

const ClientProjects = () => {
  const { authFetch, isAuthenticated, user } = useAuth();
  const { unreadCount } = useNotifications();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingProjectId, setProcessingProjectId] = useState(null);
  const [activeFilter, setActiveFilter] = useState("ongoing");

  const loadProjects = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await authFetch("/projects");
      const payload = await response.json().catch(() => null);
      const remote = Array.isArray(payload?.data) ? payload.data : [];
      setProjects(normalizeClientProjects(remote));
    } catch (error) {
      console.error("Failed to load projects from API:", error);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadProjects();
  }, [isAuthenticated, loadProjects]);

  const handleApproveAndPay = useCallback(
    async (project) => {
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

        toast.success(paymentResult?.message || "Payment completed successfully.");
        await loadProjects();
      } catch (error) {
        console.error("Project payment failed:", error);
        toast.error(error?.message || "Failed to process payment");
      } finally {
        setProcessingProjectId(null);
      }
    },
    [authFetch, loadProjects],
  );

  const headerDisplayName = useMemo(() => getDisplayName(user), [user]);
  const projectCards = useMemo(
    () => projects.map((project) => buildProjectCardModel(project)),
    [projects],
  );
  const ongoingProjectCount = useMemo(
    () =>
      projectCards.filter((project) => project.statusMeta.label !== "Completed").length,
    [projectCards],
  );
  const completedProjectCount = useMemo(
    () =>
      projectCards.filter((project) => project.statusMeta.label === "Completed").length,
    [projectCards],
  );
  const visibleProjectCards = useMemo(
    () =>
      projectCards.filter((project) =>
        activeFilter === "completed"
          ? project.statusMeta.label === "Completed"
          : project.statusMeta.label !== "Completed",
      ),
    [activeFilter, projectCards],
  );

  useEffect(() => {
    if (isLoading) return;

    if (activeFilter === "ongoing" && ongoingProjectCount === 0 && completedProjectCount > 0) {
      setActiveFilter("completed");
    }

    if (activeFilter === "completed" && completedProjectCount === 0 && ongoingProjectCount > 0) {
      setActiveFilter("ongoing");
    }
  }, [activeFilter, completedProjectCount, isLoading, ongoingProjectCount]);

  return (
    <div className="min-h-screen bg-[#212121] text-[#f1f5f9]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1536px] flex-col px-4 pt-5 sm:px-6 lg:px-[40px] xl:w-[85%] xl:max-w-none">
        <ClientWorkspaceHeader
          profile={{
            avatar: user?.avatar,
            name: headerDisplayName,
            initial: getInitials(headerDisplayName),
          }}
          activeWorkspaceKey="projects"
          unreadCount={unreadCount}
        />

        <main className="flex-1 pb-12">
          <section className="mt-14">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-[clamp(2rem,4vw,3rem)] font-bold tracking-[-0.75px] text-[#f1f5f9]">
                  Project Proposals
                </h1>
                <p className="mt-2 max-w-[34rem] text-sm text-[#94a3b8]">
                  Manage your active, pending, and completed project collaborations in one place.
                </p>
              </div>

              <div className="flex justify-start lg:justify-end">
                <div className="inline-flex h-auto flex-wrap gap-2 rounded-full border border-white/[0.08] bg-accent p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  {projectFilterOptions.map((option) => {
                    const count =
                      option.key === "completed" ? completedProjectCount : ongoingProjectCount;
                    const isActive = activeFilter === option.key;

                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setActiveFilter(option.key)}
                        className={cn(
                          "h-11 rounded-full border border-transparent px-5 text-[0.95rem] font-semibold transition",
                          isActive
                            ? "border-[#ffc107]/70 bg-[#ffc107] text-[#141414]"
                            : "text-[#a3a6ad] hover:text-white",
                        )}
                      >
                        {option.label} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-12">
            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <ProjectCardSkeleton key={item} />
                ))}
              </div>
            ) : visibleProjectCards.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {visibleProjectCards.map((project) => (
                  <ProjectProposalCard
                    key={project.id}
                    project={project}
                    onPay={handleApproveAndPay}
                    isPaying={processingProjectId === project.id}
                  />
                ))}
              </div>
            ) : projectCards.length > 0 ? (
              <EmptyProjectsState
                title={
                  activeFilter === "completed"
                    ? "No completed projects yet"
                    : "No ongoing projects right now"
                }
                description={
                  activeFilter === "completed"
                    ? "Completed projects will appear here after final delivery and payment closure."
                    : "Ongoing and in-review projects will appear here as soon as collaboration starts."
                }
                showAction={false}
              />
            ) : (
              <EmptyProjectsState />
            )}
          </section>
        </main>

        <ClientDashboardFooter variant="workspace" />
      </div>
    </div>
  );
};

export default ClientProjects;
