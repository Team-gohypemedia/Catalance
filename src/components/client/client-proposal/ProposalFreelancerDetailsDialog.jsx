import React, { memo } from "react";
import Loader from "@/components/common/Loader";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/shared/lib/utils";
import Star from "lucide-react/dist/esm/icons/star";
import {
  canUnsendProposalInvitee,
  getInitials,
  getProposalFreelancerRecipients,
  proposalCardStatusClasses,
  resolveProposalTitle,
  statusLabels,
  formatRating,
} from "./proposal-utils.js";
import { useAuth } from "@/shared/context/AuthContext";

const FreelancerDetailCard = memo(({
  invitee,
  unsendingProposalId,
  onUnsend,
  onViewProfile,
  projectRequiredSkills,
}) => {
  const { authFetch } = useAuth();
  const [fetchedProfile, setFetchedProfile] = React.useState(null);
  const fetchedRef = React.useRef(false);

  // The real freelancer user ID (not the proposal ID)
  const freelancerId = invitee?.id || invitee?.freelancerId || invitee?.freelancer?.freelancerId || invitee?.freelancer?.recipientId || invitee?.freelancer?.id;

  React.useEffect(() => {
    if (fetchedRef.current || !freelancerId || !authFetch) return;
    fetchedRef.current = true;
    authFetch(`/users/${freelancerId}`)
      .then(res => res.json())
      .then(payload => {
        const data = payload?.data || payload;
        if (data && !data?.message) {
          setFetchedProfile(data);
        }
      })
      .catch(() => {});
  }, [freelancerId, authFetch]);

  const status = String(invitee?.status || "").toLowerCase();
  const canUnsend = canUnsendProposalInvitee(invitee);
  const isUnsending = unsendingProposalId === invitee?.proposalId;

  const displayName = invitee?.name || fetchedProfile?.name || "Freelancer";
  const displayInitials = getInitials(displayName);
  
  // Use fetched profile data for freelancer-specific fields, fall back to invitee data
  const rating = formatRating(fetchedProfile?.rating || fetchedProfile?.ratingScore || invitee?.freelancer?.rating);
  const budgetFitScore = fetchedProfile?.budgetFitScore ?? invitee?.freelancer?.budgetFitScore;
  const budgetFitLabel = Number.isFinite(budgetFitScore) ? `${Math.round(budgetFitScore)}%` : "N/A";
  const projectsDelivered = Number.isFinite(fetchedProfile?.projectsDelivered) ? fetchedProfile.projectsDelivered : Number.isFinite(invitee?.freelancer?.projectsDelivered) ? invitee.freelancer.projectsDelivered : "N/A";

  // Skills from fetched profile
  const safeFreelancerSkills = Array.isArray(fetchedProfile?.skills) ? fetchedProfile.skills : Array.isArray(invitee?.freelancer?.skills) ? invitee.freelancer.skills : (invitee?.freelancer?.tags || []);
  const safeRequiredSkills = Array.isArray(projectRequiredSkills) ? projectRequiredSkills : [];
  
  const matchedSkills = safeRequiredSkills.filter(req => 
    safeFreelancerSkills.some(fs => 
      String(fs || "").toLowerCase() === String(req || "").toLowerCase() ||
      String(fs || "").toLowerCase().includes(String(req || "").toLowerCase()) ||
      String(req || "").toLowerCase().includes(String(fs || "").toLowerCase())
    )
  );
  
  const isSkillMatch = matchedSkills.length > 0;

  // Cover image from fetched profile
  const coverImage = fetchedProfile?.coverImage || invitee?.freelancer?.coverImage || invitee?.coverImage;
  const avatarSrc = invitee?.avatar || fetchedProfile?.avatar;
  const bannerStyle = {
    backgroundImage: coverImage 
      ? `url(${coverImage})`
      : `linear-gradient(140deg, rgba(9,11,16,0.14) 0%, rgba(9,11,16,0.38) 100%), radial-gradient(100% 130% at 0% 0%, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0) 52%), radial-gradient(75% 100% at 100% 0%, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 55%), linear-gradient(135deg, #a1a1aa, #3f3f46)`,
    backgroundBlendMode: "normal,screen,screen,normal",
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  return (
    <Card
      className="group relative flex w-full shrink-0 flex-col overflow-hidden rounded-[20px] border border-border/70 bg-background/40 shadow-none transition-colors duration-200 hover:border-border hover:bg-background/55"
    >
      <div
        className="relative isolate h-24 min-h-24 shrink-0 overflow-visible rounded-t-[20px] border-b border-border/70 shadow-none"
        style={bannerStyle}
      >
        <Avatar className="absolute -bottom-6 left-3 z-10 h-16 w-16 border-4 border-card shadow-md">
          <AvatarImage
            src={avatarSrc}
            alt={displayName}
            className="object-cover"
          />
          <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold tracking-wide">
            {displayInitials}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="mt-8 flex min-h-0 flex-1 flex-col px-4 pb-4">
        <div className="flex items-start justify-between gap-2 border-b border-border dark:border-white/10 pb-1.5">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-1">
              <h3 className="min-w-0 truncate text-base leading-tight font-semibold tracking-tight text-foreground">
                {displayName}
              </h3>
            </div>
            <p className="mt-0.5 pr-1 text-[11px] leading-4 text-muted-foreground line-clamp-1">
              Freelancer
            </p>
            <div className="mt-0.5 flex flex-wrap gap-1">
              <Badge
                variant="outline"
                className={cn(
                  "h-5 border-border/80 bg-transparent px-2 text-[9px] whitespace-nowrap",
                  proposalCardStatusClasses[status] || proposalCardStatusClasses.pending
                )}
              >
                {statusLabels[status] || "Pending"}
              </Badge>
              <Badge
                variant="outline"
                className="h-5 border-border/80 bg-transparent px-2 text-[9px] whitespace-nowrap text-foreground"
              >
                Sent {invitee?.submittedDate || "recently"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-2 shrink-0 grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="h-8 rounded-[12px] border border-border bg-background/35 text-xs font-semibold text-foreground shadow-none hover:bg-background"
            onClick={() => onViewProfile?.({ ...fetchedProfile, id: freelancerId || invitee?.id || invitee?.proposalId })}
          >
            View Profile
          </Button>

          {canUnsend && onUnsend && (
            <Button
              variant="destructive"
              className="h-8 rounded-[12px] text-xs font-semibold shadow-none"
              disabled={isUnsending}
              onClick={() => onUnsend(invitee)}
            >
              {isUnsending ? (
                <>
                  <Loader className="mr-2 h-3.5 w-3.5 border-white" />
                  Unsending...
                </>
              ) : (
                "Unsend Proposal"
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
});

const ProposalFreelancerDetailsDialog = ({
  proposal,
  open,
  onOpenChange,
  onUnsend,
  unsendingProposalId,
  onViewProfile,
  projectRequiredSkills = [],
}) => {
  const recipients = getProposalFreelancerRecipients(proposal);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-[52rem] flex-col overflow-hidden border border-border/60 dark:border-white/10 bg-[linear-gradient(180deg,#ffffff,#faf9f6)] dark:bg-[linear-gradient(180deg,rgba(18,18,20,0.98),rgba(23,23,25,0.98))] p-0 text-foreground dark:text-white">
        <div className="flex-shrink-0 border-b border-border/60 dark:border-white/10 px-6 py-5">
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle className="text-xl font-semibold tracking-tight text-foreground dark:text-white">
              Freelancer details
            </DialogTitle>
            <DialogDescription className="text-sm leading-6 text-muted-foreground dark:text-[#94a3b8]">
              {recipients.length > 1
                ? `${recipients.length} freelancers have received this proposal for ${resolveProposalTitle(proposal) || "this project"}.`
                : `Review who received this proposal for ${resolveProposalTitle(proposal) || "this project"}.`}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {recipients.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {recipients.map((invitee) => (
                <FreelancerDetailCard
                  key={invitee?.proposalId || invitee?.id || Math.random()}
                  invitee={invitee}
                  unsendingProposalId={unsendingProposalId}
                  onUnsend={onUnsend}
                  onViewProfile={onViewProfile}
                  projectRequiredSkills={projectRequiredSkills}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[22px] border border-dashed border-border dark:border-white/10 bg-background/20 dark:bg-white/[0.02] px-5 py-8 text-center">
              <p className="text-sm text-muted-foreground dark:text-[#94a3b8]">
                No freelancers have been linked to this proposal yet.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default memo(ProposalFreelancerDetailsDialog);
