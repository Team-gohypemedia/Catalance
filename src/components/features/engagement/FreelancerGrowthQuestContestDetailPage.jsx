import { useEffect, useMemo, useRef, useState } from "react";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import CalendarDays from "lucide-react/dist/esm/icons/calendar-days";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Github from "lucide-react/dist/esm/icons/github";
import Link2 from "lucide-react/dist/esm/icons/link-2";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Paperclip from "lucide-react/dist/esm/icons/paperclip";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Trophy from "lucide-react/dist/esm/icons/trophy";
import Upload from "lucide-react/dist/esm/icons/upload";
import Image from "lucide-react/dist/esm/icons/image";
import Tag from "lucide-react/dist/esm/icons/tag";
import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/shared/context/AuthContext";
import { cn } from "@/shared/lib/utils";
import { toast } from "sonner";
import "@/components/features/engagement/FreelancerGrowthQuestPage.css";

const createAttachmentId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `attachment-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const formatDate = (value) => {
  if (!value) return "Pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Pending";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatDayKey = (value) => {
  const normalized = String(value || "").trim();
  if (!normalized) return "Pending";
  const date = new Date(`${normalized}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return normalized;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const isImageUrl = (value) => /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(String(value || ""));

const statusTone = {
  PENDING: "border-amber-500/20 bg-amber-500/10 text-amber-200",
  APPROVED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
  NEEDS_CHANGES: "border-primary/20 bg-primary/10 text-primary",
  REJECTED: "border-red-500/20 bg-red-500/10 text-red-200",
};

const defaultSubmissionForm = {
  title: "",
  githubUrl: "",
  portfolioUrl: "",
  notes: "",
};

const FreelancerGrowthQuestContestDetailPage = () => {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const fileInputRef = useRef(null);
  const [contest, setContest] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submissionLoading, setSubmissionLoading] = useState(true);
  const [error, setError] = useState("");
  const [submissionError, setSubmissionError] = useState("");
  const [submissionSuccess, setSubmissionSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submissionForm, setSubmissionForm] = useState(defaultSubmissionForm);
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    let active = true;

    const loadContest = async () => {
      if (!authFetch || !contestId) return;
      setLoading(true);
      setSubmissionLoading(true);
      setError("");
      setSubmissionError("");
      try {
        const [contestResponse, submissionsResponse] = await Promise.all([
          authFetch(`/engagement/contests/${contestId}`),
          authFetch(`/engagement/contests/${contestId}/submissions`),
        ]);
        const contestPayload = await contestResponse.json().catch(() => null);
        const submissionsPayload = await submissionsResponse.json().catch(() => null);

        if (!contestResponse.ok) {
          throw new Error(contestPayload?.message || "Failed to load contest details.");
        }
        if (!submissionsResponse.ok) {
          throw new Error(submissionsPayload?.message || "Failed to load submission history.");
        }

        if (active) {
          setContest(contestPayload?.data || null);
          setSubmissions(Array.isArray(submissionsPayload?.data) ? submissionsPayload.data : []);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError?.message || "Failed to load contest details.");
        }
      } finally {
        if (active) {
          setLoading(false);
          setSubmissionLoading(false);
        }
      }
    };

    loadContest();
    return () => {
      active = false;
    };
  }, [authFetch, contestId]);

  const attachmentCount = attachments.length;
  const contestChecklist = useMemo(
    () => [
      "Include a GitHub repository or code link.",
      "Attach screenshots, mockups, docs, or sample files.",
      "Add a short note explaining what the admin should review.",
    ],
    [],
  );
  const resourceLinks = Array.isArray(contest?.resourceLinks) ? contest.resourceLinks : [];
  const deliverables = Array.isArray(contest?.deliverables) ? contest.deliverables : [];
  const reviewCriteria = Array.isArray(contest?.reviewCriteria) ? contest.reviewCriteria : [];
  const acceptedAssetTypes = Array.isArray(contest?.acceptedAssetTypes)
    ? contest.acceptedAssetTypes
    : [];
  const contestRewardBadges = [
    contest?.rewardCoins ? `${contest.rewardCoins} coins` : null,
    contest?.rewardXp ? `${contest.rewardXp} XP` : null,
    contest?.badgeTitle ? contest.badgeTitle : null,
  ].filter(Boolean);

  const handleAttachmentUpload = async (fileList) => {
    if (!authFetch || !fileList?.length) return;
    setUploading(true);
    setSubmissionError("");
    try {
      const uploaded = [];
      for (const file of fileList) {
        const data = new FormData();
        data.append("file", file);
        const response = await authFetch("/upload/chat", {
          method: "POST",
          body: data,
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.message || `Failed to upload ${file.name}`);
        }
        uploaded.push({
          id: createAttachmentId(),
          url: payload?.data?.url || "",
          name: payload?.data?.name || file.name,
          type: payload?.data?.type || file.type,
          size: payload?.data?.size || file.size || 0,
        });
      }
      setAttachments((current) => [...uploaded, ...current]);
      toast.success(`Uploaded ${uploaded.length} file${uploaded.length === 1 ? "" : "s"}`);
    } catch (uploadError) {
      setSubmissionError(uploadError?.message || "Failed to upload files.");
      toast.error(uploadError?.message || "Failed to upload files");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = async () => {
    if (!authFetch || !contestId) return;
    setSubmitting(true);
    setSubmissionError("");
    setSubmissionSuccess("");

    try {
      const response = await authFetch(`/engagement/contests/${contestId}/submissions`, {
        method: "POST",
        body: JSON.stringify({
          ...submissionForm,
          attachments: attachments.map((attachment) => ({
            url: attachment.url,
            name: attachment.name,
            type: attachment.type,
            size: attachment.size,
          })),
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to submit contest entry.");
      }

      setSubmissionForm(defaultSubmissionForm);
      setAttachments([]);
      setSubmissions((current) => [payload?.data, ...current.filter((entry) => entry.id !== payload?.data?.id)]);
      setSubmissionSuccess("Submission sent to admin review.");
      toast.success("Submission sent for review");
    } catch (submitError) {
      setSubmissionError(submitError?.message || "Failed to submit contest entry.");
      toast.error(submitError?.message || "Failed to submit contest entry");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="growth-quest-shell">
        <div className="growth-quest-page">
          <div className="flex min-h-[420px] items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="size-7 animate-spin text-primary" />
              <p className="text-sm">Loading contest details.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="growth-quest-shell">
        <div className="growth-quest-page">
          <div className="growth-quest-panel p-8">
            <Button type="button" variant="outline" onClick={() => navigate("/freelancer/growth-quest")}>
              <ArrowLeft className="size-4" />
              Back to Growth Quest
            </Button>
            <p className="mt-6 text-sm text-red-300">{error || "Contest not found."}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="growth-quest-shell">
      <div className="growth-quest-page">
        <div className="growth-quest-dashboard gap-6">
          <section className="growth-quest-panel overflow-hidden p-0">
            <div className="border-b border-white/10 bg-white/[0.02] px-6 py-5 sm:px-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-3">
                  <Button type="button" variant="outline" onClick={() => navigate("/freelancer/growth-quest")}>
                    <ArrowLeft className="size-4" />
                    Back to Growth Quest
                  </Button>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                      <Tag className="size-4" />
                      {contest.category}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                      <CalendarDays className="size-4" />
                      {formatDayKey(contest.startDayKey)}
                      {contest.endDayKey ? ` to ${formatDayKey(contest.endDayKey)}` : ""}
                    </span>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <p className="text-[0.7rem] font-black uppercase tracking-[0.18em] text-muted-foreground">
                      Submission readiness
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {attachmentCount} file{attachmentCount === 1 ? "" : "s"} attached
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <p className="text-[0.7rem] font-black uppercase tracking-[0.18em] text-muted-foreground">
                      Admin review
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white">Freelancer submission inbox</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-0 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-6 p-6 sm:p-8">
                {contest.imageUrl ? (
                  <img
                    src={contest.imageUrl}
                    alt={contest.title}
                    className="h-[280px] w-full rounded-3xl border border-white/10 object-cover shadow-[0_24px_80px_rgba(0,0,0,0.25)]"
                  />
                ) : (
                  <div className="flex h-[280px] items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.03] text-muted-foreground">
                    Contest preview image not set.
                  </div>
                )}

                <div>
                  <p className="text-[0.7rem] font-black uppercase tracking-[0.18em] text-primary">
                    Admin Contest
                  </p>
                  <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
                    {contest.title}
                  </h1>
                  <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
                    {contest.description}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    {
                      label: "Brief format",
                      value: contest.ctaLabel || "View Contest",
                      hint: "Use the submission pack below",
                    },
                    {
                      label: "Review style",
                      value: "Mixed links + files",
                      hint: "GitHub, visuals, docs, or demos",
                    },
                    {
                      label: "Status",
                      value: contest.status,
                      hint: "Active during the visible date range",
                    },
                    {
                      label: "Reward coins",
                      value: contest.rewardCoins || 0,
                      hint: "Transferred by admin after approval",
                    },
                    {
                      label: "Reward XP",
                      value: contest.rewardXp || 0,
                      hint: "Added to your Growth Quest profile",
                    },
                    {
                      label: "Contest badge",
                      value: contest.badgeTitle || "Not set",
                      hint: contest.badgeTitle
                        ? "Admin can award this badge on approval"
                        : "No badge reward configured",
                    },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="mt-2 text-lg font-bold text-white">{item.value}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.hint}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-primary" />
                    <h2 className="text-lg font-black text-white">Contest Details</h2>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                    {contest.detailsContent || contest.description}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border-white/10 bg-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-black text-white">Goal summary</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm leading-7 text-muted-foreground">
                      {contest.goalSummary || contest.description}
                    </CardContent>
                  </Card>
                  <Card className="border-white/10 bg-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-black text-white">Reward summary</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm leading-7 text-muted-foreground">
                      {contest.rewardSummary || "The admin will share the review outcome and next steps after checking your submission."}
                      {contestRewardBadges.length ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {contestRewardBadges.map((item) => (
                            <Badge key={item} className="border-primary/20 bg-primary/10 text-primary">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="border-white/10 bg-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-black text-white">Deliverables</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      {deliverables.length ? (
                        deliverables.map((item) => (
                          <div key={item} className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                            <span>{item}</span>
                          </div>
                        ))
                      ) : (
                        <p>No deliverables set yet.</p>
                      )}
                    </CardContent>
                  </Card>
                  <Card className="border-white/10 bg-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-black text-white">Review criteria</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      {reviewCriteria.length ? (
                        reviewCriteria.map((item) => (
                          <div key={item} className="flex items-start gap-2">
                            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                            <span>{item}</span>
                          </div>
                        ))
                      ) : (
                        <p>No review criteria set yet.</p>
                      )}
                    </CardContent>
                  </Card>
                  <Card className="border-white/10 bg-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-black text-white">References</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      {resourceLinks.length ? (
                        resourceLinks.map((link, index) => (
                          <a
                            key={`${link.url}-${index}`}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-start gap-2 hover:text-primary"
                          >
                            <Link2 className="mt-0.5 size-4 shrink-0" />
                            <span>{link.label || link.url}</span>
                          </a>
                        ))
                      ) : (
                        <p>No reference links added yet.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="border-white/10 bg-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-black text-white">What to include</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      {contestChecklist.map((item) => (
                        <div key={item} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  <Card className="border-white/10 bg-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-black text-white">Accepted uploads</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      {acceptedAssetTypes.length ? (
                        <div className="flex flex-wrap gap-2">
                          {acceptedAssetTypes.map((type) => (
                            <Badge key={type} className="border-white/10 bg-white/[0.03] text-muted-foreground">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                      <div className="flex items-start gap-2">
                        <Image className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span>Images, mockups, screenshots, and visual proof.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <FileText className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span>PDF, DOC, DOCX, TXT, or ZIP files for deeper context.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Github className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span>GitHub repo links and live project URLs.</span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-white/10 bg-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-black text-white">How admin reviews</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                        <span>Review title, links, file previews, and notes together.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Paperclip className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span>Attachments stay grouped with the contest entry.</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <aside className="space-y-6 border-t border-white/10 bg-white/[0.02] p-6 xl:border-l xl:border-t-0 sm:p-8">
                <Card className="border-white/10 bg-card">
                  <CardHeader>
                    <CardTitle className="text-2xl font-black text-white">Your Submission</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Fill out the details and attach all the work an admin should review.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-5">
                      <div className="grid gap-2">
                        <label className="text-xs font-black uppercase tracking-[0.16em] text-white">
                          Submission title
                        </label>
                        <Input
                          value={submissionForm.title}
                          onChange={(event) => setSubmissionForm((current) => ({ ...current, title: event.target.value }))}
                          placeholder="Short title for the entry"
                          className="rounded-lg border-white/10 bg-white/[0.03]"
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-xs font-black uppercase tracking-[0.16em] text-white">
                          GitHub URL
                        </label>
                        <Input
                          value={submissionForm.githubUrl}
                          onChange={(event) => setSubmissionForm((current) => ({ ...current, githubUrl: event.target.value }))}
                          placeholder="https://github.com/..."
                          className="rounded-lg border-white/10 bg-white/[0.03]"
                        />
                        <p className="text-xs text-muted-foreground">Link to your GitHub repository with the project code.</p>
                      </div>
                      <div className="grid gap-2">
                        <label className="text-xs font-black uppercase tracking-[0.16em] text-white">
                          Portfolio or live URL
                        </label>
                        <Input
                          value={submissionForm.portfolioUrl}
                          onChange={(event) => setSubmissionForm((current) => ({ ...current, portfolioUrl: event.target.value }))}
                          placeholder="https://your-site.com/..."
                          className="rounded-lg border-white/10 bg-white/[0.03]"
                        />
                        <p className="text-xs text-muted-foreground">Direct link to your live project or portfolio piece.</p>
                      </div>
                      <div className="grid gap-2">
                        <label className="text-xs font-black uppercase tracking-[0.16em] text-white">
                          Admin notes
                        </label>
                        <Textarea
                          value={submissionForm.notes}
                          onChange={(event) => setSubmissionForm((current) => ({ ...current, notes: event.target.value }))}
                          placeholder="What should the admin focus on when reviewing this entry?"
                          className="min-h-[100px] rounded-lg border-white/10 bg-white/[0.03]"
                        />
                        <p className="text-xs text-muted-foreground">Help the admin understand what to look for in your submission.</p>
                      </div>
                    </div>

                    {submissionError ? <p className="text-sm text-red-300 rounded-lg bg-red-500/10 p-3">{submissionError}</p> : null}
                    {submissionSuccess ? <p className="text-sm text-emerald-300 rounded-lg bg-emerald-500/10 p-3">{submissionSuccess}</p> : null}

                    <Button type="button" className="w-full bg-primary font-black text-lg py-6 rounded-xl" onClick={handleSubmit} disabled={submitting}>
                      {submitting ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-5" />}
                      Submit for Admin Review
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-card">
                  <CardHeader>
                    <CardTitle className="text-xl font-black text-white">Your Submissions</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Your recent entries and the latest admin review status.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {submissionLoading ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="size-4 animate-spin text-primary" />
                        Loading submissions
                      </div>
                    ) : submissions.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-4 text-center text-sm text-muted-foreground">
                        No contest submissions yet.
                      </div>
                    ) : (
                      submissions.map((submission) => (
                        <div key={submission.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-all hover:bg-white/[0.05]">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-white">{submission.title}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Submitted {formatDate(submission.createdAt)}
                              </p>
                            </div>
                            <Badge className={cn("shrink-0", statusTone[submission.status] || statusTone.PENDING)}>
                              {submission.status}
                            </Badge>
                          </div>
                          <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                            {submission.githubUrl ? (
                              <a className="inline-flex items-center gap-1 text-primary hover:text-primary-light" href={submission.githubUrl} target="_blank" rel="noreferrer">
                                <Github className="size-3.5" />
                                GitHub
                              </a>
                            ) : null}
                            {submission.portfolioUrl ? (
                              <a className="inline-flex items-center gap-1 text-primary hover:text-primary-light" href={submission.portfolioUrl} target="_blank" rel="noreferrer">
                                <Link2 className="size-3.5" />
                                Portfolio
                              </a>
                            ) : null}
                            <div className="flex flex-wrap gap-2">
                              <span>{submission.attachments?.length || 0} file(s)</span>
                              <span>{submission.otherLinks?.length || 0} extra link(s)</span>
                            </div>
                            {submission.reviewNote ? (
                              <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs leading-6 text-emerald-200">
                                <span className="font-semibold">Admin feedback:</span> {submission.reviewNote}
                              </p>
                            ) : null}
                            {submission.status === "APPROVED" ? (
                              <div className="rounded-lg border border-primary/20 bg-primary/10 p-3 text-xs leading-6 text-primary">
                                <div className="flex flex-wrap gap-2">
                                  <span>+{submission.rewardCoins || 0} coins</span>
                                  <span>+{submission.rewardXp || 0} XP</span>
                                  {submission.badgeTitle ? (
                                    <span className="inline-flex items-center gap-1">
                                      <Trophy className="size-3.5" />
                                      {submission.badgeTitle}
                                    </span>
                                  ) : null}
                                </div>
                                <p className="mt-1 text-[11px] text-primary/80">
                                  {submission.rewardTransferredAt
                                    ? `Reward transferred ${formatDate(submission.rewardTransferredAt)}`
                                    : "Reward will reflect after admin transfer."}
                                </p>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </aside>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default FreelancerGrowthQuestContestDetailPage;
