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
    <Card className={cn("border-border/60 bg-background/35 shadow-none", className)}>
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div className="space-y-1">
          <h4 className="text-base font-semibold tracking-tight text-white">{title}</h4>
          {description ? (
            <p className="text-sm leading-6 text-[#94a3b8]">{description}</p>
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
    return <p className="text-sm leading-6 text-[#94a3b8]">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={`${item}-${index}`}
          className="flex items-start gap-3 rounded-2xl border border-white/8 bg-background/40 px-4 py-3"
        >
          <span className="mt-0.5 text-xs font-semibold text-[#ffc107]">
            {String(index + 1).padStart(2, "0")}
          </span>
          <p className="text-sm leading-6 text-white">{item}</p>
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
    <div className="rounded-2xl border border-border/60 bg-background/35 p-4">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" />
        <span>{label}</span>
      </div>
      <div className={cn("mt-3 text-base font-semibold text-foreground", valueClassName)}>
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
        "space-y-2",
        bordered && "border-b border-white/8 pb-3 last:border-b-0 last:pb-0",
        className,
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">
        {label}
      </p>
      <div className={cn("text-sm font-medium leading-6 text-white", valueClassName)}>
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
            className={cn(avatarClassName, "border-2 border-[#2b2b2d]")}
          >
            <AvatarImage src={freelancer.avatar} alt={freelancer.name} />
            <AvatarFallback className="bg-[#111214] text-xs font-bold text-primary">
              {getInitials(freelancer.name)}
            </AvatarFallback>
          </Avatar>
        ))}
        {additionalCount > 0 ? (
          <div
            className={cn(
              "flex items-center justify-center rounded-full border-2 border-[#2b2b2d] bg-[#171718] text-[11px] font-semibold text-white",
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
    <Avatar className={cn(avatarClassName, "border border-white/10")}>
      <AvatarImage src={proposal?.avatar} alt={fallbackAvatarName} />
      <AvatarFallback className="bg-[#111214] text-xs font-bold text-primary">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
});
