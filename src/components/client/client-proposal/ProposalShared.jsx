import React, { memo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/shared/lib/utils";
import {
  getInitials,
  isAssignedFreelancerName,
} from "./proposal-utils.js";

export const ProposalSectionCard = memo(function ProposalSectionCard({
  title,
  description,
  children,
  className,
}) {
  return (
    <Card className={cn("rounded-xl border p-4 border-black/10 bg-white shadow-none dark:border-white/10 dark:bg-white/[0.02]", className)}>
      <CardContent className="p-0">
        <div className="space-y-0.5">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-[#181711] dark:text-primary">{title}</h4>
          {description ? (
            <p className="text-xs sm:text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
          ) : null}
        </div>
        <div className="mt-3">
          {children}
        </div>
      </CardContent>
    </Card>
  );
});

export const ProposalStructuredList = memo(function ProposalStructuredList({
  items,
  emptyMessage = "No items added yet.",
}) {
  if (!Array.isArray(items) || items.length === 0) {
    return <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">{emptyMessage}</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex items-start gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <span className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
});

export const ProposalMetric = memo(function ProposalMetric({
  icon: Icon,
  label,
  value,
  valueClassName,
}) {
  return (
    <div className="rounded-xl border px-4 py-3 border-black/10 bg-[#faf9f5] dark:border-white/10 dark:bg-white/[0.03]">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#bab59c]">
        {label}
      </p>
      <div className={cn("mt-1 text-sm font-medium leading-relaxed text-[#181711] dark:text-white", valueClassName)}>
        {value}
      </div>
    </div>
  );
});

export const ProposalSummaryItem = memo(function ProposalSummaryItem({
  label,
  value,
  valueClassName,
  className,
  bordered = true,
}) {
  return (
    <div
      className={cn(
        "space-y-1",
        bordered && "border-b border-border pb-2 last:border-b-0 last:pb-0 dark:border-white/8",
        className,
      )}
    >
      <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <div className={cn("text-xs sm:text-sm font-medium leading-6 text-foreground", valueClassName)}>
        {value}
      </div>
    </div>
  );
});

export const ProposalFreelancerAvatars = memo(function ProposalFreelancerAvatars({
  proposal,
  avatarClassName = "h-10 w-10",
  stackClassName,
  maxVisible = 5,
}) {
  const sentFreelancers = Array.isArray(proposal?.sentFreelancers)
    ? proposal.sentFreelancers.filter(Boolean)
    : [];
  const fallbackAvatarName = isAssignedFreelancerName(proposal?.recipientName)
    ? proposal.recipientName
    : "Not assigned";
  const initials = getInitials(fallbackAvatarName);
  const additionalCount = Math.max(sentFreelancers.length - maxVisible, 0);

  if (sentFreelancers.length > 0) {
    return (
      <div className={cn("flex items-center -space-x-3", stackClassName)}>
        {sentFreelancers.slice(0, maxVisible).map((freelancer) => (
          <Avatar
            key={freelancer.id}
            className={cn(avatarClassName, "border-2 border-border dark:border-[#2b2b2d]")}
          >
            <AvatarImage src={freelancer.avatar} alt={freelancer.name} />
            <AvatarFallback className="bg-muted text-xs font-bold text-primary dark:bg-[#111214]">
              {getInitials(freelancer.name)}
            </AvatarFallback>
          </Avatar>
        ))}
        {additionalCount > 0 ? (
          <div
            className={cn(
              "flex items-center justify-center rounded-full border-2 border-border bg-muted text-[11px] font-semibold text-foreground dark:border-[#2b2b2d] dark:bg-[#171718] dark:text-white",
              avatarClassName,
            )}
          >
            +{additionalCount}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <Avatar className={cn(avatarClassName, "border border-border dark:border-white/10")}>
      <AvatarImage src={proposal?.avatar} alt={fallbackAvatarName} />
      <AvatarFallback className="bg-muted text-xs font-bold text-primary dark:bg-[#111214]">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
});
