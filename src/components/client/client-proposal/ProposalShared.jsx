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
    <Card className={cn("border-border bg-card shadow-none dark:border-border/60 dark:bg-background/35", className)}>
      <CardContent className="space-y-3 p-4 sm:p-5">
        <div className="space-y-0.5">
          <h4 className="text-sm sm:text-base font-semibold tracking-tight text-foreground">{title}</h4>
          {description ? (
            <p className="text-xs sm:text-sm leading-6 text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {children}
      </CardContent>
    </Card>
  );
});

export const ProposalStructuredList = memo(function ProposalStructuredList({
  items,
  emptyMessage = "No items added yet.",
}) {
  if (!Array.isArray(items) || items.length === 0) {
    return <p className="text-sm leading-6 text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div
          key={`${item}-${index}`}
          className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 px-3 py-2.5 dark:border-white/8 dark:bg-background/40"
        >
          <span className="mt-0.5 text-xs font-semibold text-[var(--primary)]">
            {String(index + 1).padStart(2, "0")}
          </span>
          <p className="text-sm leading-6 text-foreground">{item}</p>
        </div>
      ))}
    </div>
  );
});

export const ProposalMetric = memo(function ProposalMetric({
  icon: Icon,
  label,
  value,
  valueClassName,
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 dark:border-border/60 dark:bg-background/35">
      <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" />
        <span>{label}</span>
      </div>
      <div className={cn("mt-2 text-sm sm:text-base font-semibold text-foreground", valueClassName)}>
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
