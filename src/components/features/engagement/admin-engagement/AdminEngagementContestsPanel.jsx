import Check from "lucide-react/dist/esm/icons/check";
import Edit from "lucide-react/dist/esm/icons/edit";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Github from "lucide-react/dist/esm/icons/github";
import Link2 from "lucide-react/dist/esm/icons/link-2";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Plus from "lucide-react/dist/esm/icons/plus";
import X from "lucide-react/dist/esm/icons/x";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { contestSubmissionStatusOptions, statusClassName } from "./shared";

export const AdminEngagementContestsCard = ({
  contests,
  contestLoading,
  openNewContestDialog,
  openEditContestDialog,
}) => (
  <Card className="border-white/10 bg-card">
    <CardHeader>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-2xl font-black text-white">Active Contests</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            Create and manage contests for freelancers. Published contests appear on their Growth
            Quest page.
          </p>
        </div>
        <Button
          type="button"
          onClick={openNewContestDialog}
          className="rounded-xl bg-primary px-6 font-black"
        >
          <Plus className="size-4" />
          Create Contest
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      {contestLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            Loading contests
          </span>
        </div>
      ) : contests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            No contests created yet. Start by creating your first contest.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contests.map((contest) => (
            <div
              key={contest.id}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all hover:border-primary/30 hover:bg-white/[0.05]"
            >
              {contest.imageUrl ? (
                <img src={contest.imageUrl} alt={contest.title} className="h-40 w-full object-cover" />
              ) : (
                <div className="h-40 bg-gradient-to-br from-primary/20 to-transparent" />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">
                      CONTEST
                    </p>
                    <h3 className="mt-1 line-clamp-2 text-lg font-black text-white">
                      {contest.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {contest.description}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Badge className="border-white/10 bg-white/[0.04] text-xs font-semibold text-muted-foreground">
                    {contest.category}
                  </Badge>
                  <Badge className={statusClassName[contest.status] || statusClassName.DRAFT}>
                    {contest.status}
                  </Badge>
                  <Badge className="border-primary/20 bg-primary/10 text-primary">
                    {contest.rewardCoins || 0} coins
                  </Badge>
                  <Badge className="border-primary/20 bg-primary/10 text-primary">
                    {contest.rewardXp || 0} XP
                  </Badge>
                  {contest.badgeTitle ? (
                    <Badge className="border-white/10 bg-white/[0.04] text-xs font-semibold text-muted-foreground">
                      {contest.badgeTitle}
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  {contest.startDayKey}
                  {contest.endDayKey ? ` → ${contest.endDayKey}` : ""}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full rounded-lg border-white/10"
                  onClick={() => openEditContestDialog(contest)}
                >
                  <Edit className="size-4" />
                  Edit Contest
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

export const AdminEngagementContestSubmissionsCard = ({
  contests,
  contestSubmissionContestId,
  setContestSubmissionContestId,
  contestSubmissionStatus,
  setContestSubmissionStatus,
  contestSubmissionCounts,
  contestSubmissionsLoading,
  contestSubmissions,
  contestSubmissionReviewing,
  handleOpenContestReviewDialog,
}) => (
  <Card className="border-white/10 bg-card">
    <CardHeader>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle className="text-2xl font-black text-white">Freelancer Submissions</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            Review and approve contest submissions from freelancers. Filter by contest or status.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Select value={contestSubmissionContestId} onValueChange={setContestSubmissionContestId}>
            <SelectTrigger className="w-full rounded-lg sm:w-56">
              <SelectValue placeholder="All contests" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All contests</SelectItem>
              {contests.map((contest) => (
                <SelectItem key={contest.id} value={contest.id}>
                  {contest.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={contestSubmissionStatus} onValueChange={setContestSubmissionStatus}>
            <SelectTrigger className="w-full rounded-lg sm:w-44">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              {contestSubmissionStatusOptions.map((statusOption) => (
                <SelectItem key={statusOption} value={statusOption}>
                  {statusOption.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {Object.entries(contestSubmissionCounts).map(([key, value]) => (
          <Badge key={key} className={statusClassName[key] || statusClassName.PENDING}>
            {key.replace(/_/g, " ")}: {value}
          </Badge>
        ))}
      </div>

      <div className="grid gap-4">
        {contestSubmissionsLoading ? (
          <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02]">
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              Loading submissions
            </span>
          </div>
        ) : contestSubmissions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
            <p className="text-sm font-medium text-muted-foreground">No contest submissions yet.</p>
          </div>
        ) : (
          contestSubmissions.map((submission) => (
            <div
              key={submission.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-all hover:border-primary/20 hover:bg-white/[0.05]"
            >
              <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                <div className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">
                        {submission.contestTitle}
                      </p>
                      <h3 className="mt-1 text-lg font-black text-white">{submission.title}</h3>
                    </div>
                    <Badge className={statusClassName[submission.status] || statusClassName.PENDING}>
                      {submission.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-3 text-sm">
                    <div>
                      <p className="font-semibold text-white">{submission.userName}</p>
                      <p className="text-xs text-muted-foreground">{submission.userEmail}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {submission.githubUrl ? (
                      <a
                        href={submission.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-3 py-1.5 font-medium hover:bg-white/[0.08] hover:text-primary"
                      >
                        <Github className="size-4" /> GitHub
                      </a>
                    ) : null}
                    {submission.portfolioUrl ? (
                      <a
                        href={submission.portfolioUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-3 py-1.5 font-medium hover:bg-white/[0.08] hover:text-primary"
                      >
                        <Link2 className="size-4" /> Portfolio
                      </a>
                    ) : null}
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-3 py-1.5">
                      <FileText className="size-4" />
                      {submission.attachments?.length || 0} file
                      {submission.attachments?.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                  {submission.notes ? (
                    <div className="rounded-lg border border-white/10 bg-background/50 p-3">
                      <p className="text-xs font-semibold text-muted-foreground">Freelancer notes:</p>
                      <p className="mt-1 text-sm text-white">{submission.notes}</p>
                    </div>
                  ) : null}
                  {submission.reviewNote ? (
                    <div className="rounded-lg border border-white/10 bg-background/50 p-3">
                      <p className="text-xs font-semibold text-muted-foreground">Admin review:</p>
                      <p className="mt-1 text-sm text-white">{submission.reviewNote}</p>
                    </div>
                  ) : null}
                  <div className="rounded-lg border border-primary/10 bg-primary/5 p-3">
                    <p className="text-xs font-semibold text-muted-foreground">Reward package:</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge className="border-primary/20 bg-primary/10 text-primary">
                        {submission.rewardCoins || 0} coins
                      </Badge>
                      <Badge className="border-primary/20 bg-primary/10 text-primary">
                        {submission.rewardXp || 0} XP
                      </Badge>
                      {submission.badgeTitle ? (
                        <Badge className="border-white/10 bg-white/[0.04] text-muted-foreground">
                          {submission.badgeTitle}
                        </Badge>
                      ) : null}
                    </div>
                    {submission.rewardTransferredAt ? (
                      <p className="mt-2 text-xs text-emerald-300">
                        Reward transferred on{" "}
                        {new Date(submission.rewardTransferredAt).toLocaleDateString()}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex gap-2 md:flex-col">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    disabled={contestSubmissionReviewing === submission.id}
                    title="Approve"
                    onClick={() => handleOpenContestReviewDialog(submission.id, "APPROVED")}
                    className="rounded-lg border-emerald-500/20 hover:bg-emerald-500/10"
                  >
                    <Check className="size-4 text-emerald-400" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    disabled={contestSubmissionReviewing === submission.id}
                    title="Needs changes"
                    onClick={() => handleOpenContestReviewDialog(submission.id, "NEEDS_CHANGES")}
                    className="rounded-lg border-primary/20 hover:bg-primary/10"
                  >
                    <Edit className="size-4 text-primary" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    disabled={contestSubmissionReviewing === submission.id}
                    title="Reject"
                    onClick={() => handleOpenContestReviewDialog(submission.id, "REJECTED")}
                    className="rounded-lg border-red-500/20 hover:bg-red-500/10"
                  >
                    <X className="size-4 text-red-400" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </CardContent>
  </Card>
);
