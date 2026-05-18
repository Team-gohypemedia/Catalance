import React, { useCallback, useEffect, useMemo, useState } from "react";
import Check from "lucide-react/dist/esm/icons/check";
import Edit from "lucide-react/dist/esm/icons/edit";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Github from "lucide-react/dist/esm/icons/github";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Plus from "lucide-react/dist/esm/icons/plus";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import Search from "lucide-react/dist/esm/icons/search";
import Link2 from "lucide-react/dist/esm/icons/link-2";
import X from "lucide-react/dist/esm/icons/x";
import AdminLayout from "@/components/features/admin/AdminLayout";
import { AdminTopBar } from "@/components/features/admin/AdminTopBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/shared/context/AuthContext";
import { toast } from "sonner";
import AdminEngagementScheduleCard from "./admin-engagement/AdminEngagementScheduleCard";
import AdminEngagementPersonalizedHistoryCard from "./admin-engagement/AdminEngagementPersonalizedHistoryCard";
import {
  AdminEngagementContestSubmissionsCard,
  AdminEngagementContestsCard,
} from "./admin-engagement/AdminEngagementContestsPanel";
import AdminEngagementQuestionBank from "./admin-engagement/AdminEngagementQuestionBank";
import {
  CATEGORY_OPTIONS,
  DIFFICULTY_OPTIONS,
  STATUS_OPTIONS,
  TYPE_OPTIONS,
  cloneQuestionToForm,
  contestSubmissionStatusOptions,
  createTodayKey,
  emptyContestForm,
  emptyContestReviewForm,
  emptyForm,
  statusClassName,
  toLineArray,
  toLinkArray,
} from "./admin-engagement/shared";

const AdminEngagementQuestions = () => {
  const { authFetch } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [status, setStatus] = useState("PENDING_APPROVAL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [approvedQuestions, setApprovedQuestions] = useState([]);
  const [dailySets, setDailySets] = useState([]);
  const [scheduleDayKey, setScheduleDayKey] = useState(createTodayKey);
  const [scheduleStatus, setScheduleStatus] = useState("PUBLISHED");
  const [scheduledQuestionIds, setScheduledQuestionIds] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [personalizedHistory, setPersonalizedHistory] = useState([]);
  const [personalizedHistoryLoading, setPersonalizedHistoryLoading] = useState(true);
  const [personalizedHistorySearch, setPersonalizedHistorySearch] = useState("");
  const [personalizedHistoryDayKey, setPersonalizedHistoryDayKey] = useState(createTodayKey);
  const [contests, setContests] = useState([]);
  const [contestDialogOpen, setContestDialogOpen] = useState(false);
  const [editingContest, setEditingContest] = useState(null);
  const [contestForm, setContestForm] = useState(emptyContestForm);
  const [contestLoading, setContestLoading] = useState(true);
  const [contestSaving, setContestSaving] = useState(false);
  const [contestImageUploading, setContestImageUploading] = useState(false);
  const [contestSubmissions, setContestSubmissions] = useState([]);
  const [contestSubmissionsLoading, setContestSubmissionsLoading] = useState(true);
  const [contestSubmissionContestId, setContestSubmissionContestId] = useState("ALL");
  const [contestSubmissionStatus, setContestSubmissionStatus] = useState("ALL");
  const [contestSubmissionReviewing, setContestSubmissionReviewing] = useState("");
  const [contestReviewDialogOpen, setContestReviewDialogOpen] = useState(false);
  const [contestReviewForm, setContestReviewForm] = useState(emptyContestReviewForm);

  const loadQuestions = useCallback(async () => {
    if (!authFetch) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("status", status);
      if (search.trim()) params.set("search", search.trim());
      const response = await authFetch(
        `/admin/engagement/questions?${params.toString()}`,
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to load questions.");
      }
      setQuestions(Array.isArray(payload?.data) ? payload.data : []);
    } catch (error) {
      console.error("Failed to load engagement questions", error);
      toast.error(error?.message || "Failed to load questions");
    } finally {
      setLoading(false);
    }
  }, [authFetch, search, status]);

  useEffect(() => {
    const timeoutId = window.setTimeout(loadQuestions, 250);
    return () => window.clearTimeout(timeoutId);
  }, [loadQuestions]);

  const loadScheduleData = useCallback(async () => {
    if (!authFetch) return;
    setScheduleLoading(true);
    try {
      const [approvedResponse, setsResponse] = await Promise.all([
        authFetch("/admin/engagement/questions?status=APPROVED&take=200"),
        authFetch("/admin/engagement/daily-sets?take=45"),
      ]);
      const approvedPayload = await approvedResponse.json().catch(() => null);
      const setsPayload = await setsResponse.json().catch(() => null);

      if (!approvedResponse.ok) {
        throw new Error(approvedPayload?.message || "Failed to load approved questions.");
      }
      if (!setsResponse.ok) {
        throw new Error(setsPayload?.message || "Failed to load scheduled daily sets.");
      }

      setApprovedQuestions(Array.isArray(approvedPayload?.data) ? approvedPayload.data : []);
      setDailySets(Array.isArray(setsPayload?.data) ? setsPayload.data : []);
    } catch (error) {
      console.error("Failed to load daily scheduling data", error);
      toast.error(error?.message || "Failed to load daily schedule data");
    } finally {
      setScheduleLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    loadScheduleData();
  }, [loadScheduleData]);

  const loadPersonalizedHistory = useCallback(async () => {
    if (!authFetch) return;
    setPersonalizedHistoryLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("take", "40");
      if (personalizedHistorySearch.trim()) params.set("search", personalizedHistorySearch.trim());
      if (personalizedHistoryDayKey.trim()) params.set("dayKey", personalizedHistoryDayKey.trim());

      const response = await authFetch(`/admin/engagement/personalized-history?${params.toString()}`);
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to load personalized question history.");
      }

      setPersonalizedHistory(Array.isArray(payload?.data) ? payload.data : []);
    } catch (error) {
      console.error("Failed to load personalized question history", error);
      toast.error(error?.message || "Failed to load personalized question history");
    } finally {
      setPersonalizedHistoryLoading(false);
    }
  }, [authFetch, personalizedHistoryDayKey, personalizedHistorySearch]);

  useEffect(() => {
    const timeoutId = window.setTimeout(loadPersonalizedHistory, 250);
    return () => window.clearTimeout(timeoutId);
  }, [loadPersonalizedHistory]);

  const loadContests = useCallback(async () => {
    if (!authFetch) return;
    setContestLoading(true);
    try {
      const response = await authFetch("/admin/engagement/contests?status=ALL");
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to load contests.");
      }
      setContests(Array.isArray(payload?.data) ? payload.data : []);
    } catch (error) {
      console.error("Failed to load contests", error);
      toast.error(error?.message || "Failed to load contests");
    } finally {
      setContestLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    loadContests();
  }, [loadContests]);

  const loadContestSubmissions = useCallback(async () => {
    if (!authFetch) return;
    setContestSubmissionsLoading(true);
    try {
      const params = new URLSearchParams();
      if (contestSubmissionContestId !== "ALL") params.set("contestId", contestSubmissionContestId);
      if (contestSubmissionStatus !== "ALL") params.set("status", contestSubmissionStatus);

      const response = await authFetch(`/admin/engagement/contest-submissions?${params.toString()}`);
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to load contest submissions.");
      }

      setContestSubmissions(Array.isArray(payload?.data) ? payload.data : []);
    } catch (error) {
      console.error("Failed to load contest submissions", error);
      toast.error(error?.message || "Failed to load contest submissions");
    } finally {
      setContestSubmissionsLoading(false);
    }
  }, [authFetch, contestSubmissionContestId, contestSubmissionStatus]);

  useEffect(() => {
    const timeoutId = window.setTimeout(loadContestSubmissions, 250);
    return () => window.clearTimeout(timeoutId);
  }, [loadContestSubmissions]);

  useEffect(() => {
    const existingDailySet = dailySets.find((entry) => entry.dayKey === scheduleDayKey);
    if (existingDailySet) {
      setScheduleStatus(existingDailySet.status || "PUBLISHED");
      setScheduledQuestionIds(existingDailySet.questionIds || []);
      return;
    }

    setScheduleStatus("PUBLISHED");
    setScheduledQuestionIds([]);
  }, [dailySets, scheduleDayKey]);

  const counts = useMemo(
    () =>
      questions.reduce(
        (acc, question) => {
          acc[question.status] = (acc[question.status] || 0) + 1;
          return acc;
        },
        {},
      ),
    [questions],
  );

  const selectedDailySet = useMemo(
    () => dailySets.find((entry) => entry.dayKey === scheduleDayKey) || null,
    [dailySets, scheduleDayKey],
  );

  const contestSubmissionCounts = useMemo(
    () =>
      contestSubmissions.reduce(
        (acc, submission) => {
          const key = submission.status || "PENDING";
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        },
        {},
      ),
    [contestSubmissions],
  );

  const openNewDialog = () => {
    setEditingQuestion(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (question) => {
    setEditingQuestion(question);
    setForm(cloneQuestionToForm(question));
    setDialogOpen(true);
  };

  const setOptionText = (index, text) => {
    setForm((previous) => ({
      ...previous,
      options: previous.options.map((option, optionIndex) =>
        optionIndex === index ? { ...option, text } : option,
      ),
    }));
  };

  const handleSave = async () => {
    if (!authFetch) return;
    setActionLoading("save");
    try {
      const response = await authFetch(
        editingQuestion
          ? `/admin/engagement/questions/${editingQuestion.id}`
          : "/admin/engagement/questions",
        {
          method: editingQuestion ? "PATCH" : "POST",
          body: JSON.stringify(form),
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to save question.");
      }
      toast.success(editingQuestion ? "Question updated" : "Question created");
      setDialogOpen(false);
      await loadQuestions();
    } catch (error) {
      console.error("Failed to save engagement question", error);
      toast.error(error?.message || "Failed to save question");
    } finally {
      setActionLoading("");
    }
  };

  const handleApprove = async (questionId) => {
    if (!authFetch) return;
    setActionLoading(`approve-${questionId}`);
    try {
      const response = await authFetch(
        `/admin/engagement/questions/${questionId}/approve`,
        { method: "PATCH" },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to approve question.");
      }
      toast.success("Question approved");
      await loadQuestions();
    } catch (error) {
      console.error("Failed to approve question", error);
      toast.error(error?.message || "Failed to approve question");
    } finally {
      setActionLoading("");
    }
  };

  const handleReject = async (questionId) => {
    if (!authFetch) return;
    const reason = window.prompt("Reason for rejecting this question?");
    if (!reason?.trim()) return;

    setActionLoading(`reject-${questionId}`);
    try {
      const response = await authFetch(
        `/admin/engagement/questions/${questionId}/reject`,
        {
          method: "PATCH",
          body: JSON.stringify({ reason: reason.trim() }),
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to reject question.");
      }
      toast.success("Question rejected");
      await loadQuestions();
    } catch (error) {
      console.error("Failed to reject question", error);
      toast.error(error?.message || "Failed to reject question");
    } finally {
      setActionLoading("");
    }
  };

  const handleSeed = async () => {
    if (!authFetch) return;
    setActionLoading("seed");
    try {
      const response = await authFetch("/admin/engagement/questions/seed", {
        method: "POST",
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to seed questions.");
      }
      toast.success(`Seeded ${payload?.data?.inserted || 0} fallback questions`);
      await loadQuestions();
    } catch (error) {
      console.error("Failed to seed questions", error);
      toast.error(error?.message || "Failed to seed questions");
    } finally {
      setActionLoading("");
    }
  };

  const openNewContestDialog = () => {
    setEditingContest(null);
    setContestForm({ ...emptyContestForm, startDayKey: createTodayKey() });
    setContestDialogOpen(true);
  };

  const openEditContestDialog = (contest) => {
    setEditingContest(contest);
    setContestForm({
      title: contest?.title || "",
      description: contest?.description || "",
      detailsContent: contest?.detailsContent || contest?.description || "",
      imageUrl: contest?.imageUrl || "",
      category: contest?.category || "Contest",
      ctaLabel: contest?.ctaLabel || "View Contest",
      goalSummary: contest?.goalSummary || "",
      submissionInstructions: contest?.submissionInstructions || "",
      rewardSummary: contest?.rewardSummary || "",
      rewardCoins: Number(contest?.rewardCoins || 0) || 0,
      rewardXp: Number(contest?.rewardXp || 0) || 0,
      badgeKey: contest?.badgeKey || "",
      badgeTitle: contest?.badgeTitle || "",
      badgeDescription: contest?.badgeDescription || "",
      badgeIcon: contest?.badgeIcon || "award",
      deliverables: Array.isArray(contest?.deliverables) && contest.deliverables.length ? contest.deliverables : [""],
      reviewCriteria: Array.isArray(contest?.reviewCriteria) && contest.reviewCriteria.length ? contest.reviewCriteria : [""],
      resourceLinks:
        Array.isArray(contest?.resourceLinks) && contest.resourceLinks.length
          ? contest.resourceLinks.map((link) => ({
              label: link?.label || "Reference",
              url: link?.url || "",
            }))
          : [{ label: "", url: "" }],
      acceptedAssetTypes:
        Array.isArray(contest?.acceptedAssetTypes) && contest.acceptedAssetTypes.length
          ? contest.acceptedAssetTypes
          : ["image", "document", "link"],
      maxAttachments: Number(contest?.maxAttachments || 0) || 8,
      startDayKey: contest?.startDayKey || createTodayKey(),
      endDayKey: contest?.endDayKey || "",
      status: contest?.status || "DRAFT",
    });
    setContestDialogOpen(true);
  };

  const toggleScheduledQuestion = (questionId) => {
    setScheduledQuestionIds((previous) => {
      if (previous.includes(questionId)) {
        return previous.filter((id) => id !== questionId);
      }
      if (previous.length >= DAILY_SET_SIZE) {
        toast.error(`Select exactly ${DAILY_SET_SIZE} questions for one daily set.`);
        return previous;
      }
      return [...previous, questionId];
    });
  };

  const handleSaveDailySet = async () => {
    if (!authFetch) return;
    if (scheduledQuestionIds.length !== DAILY_SET_SIZE) {
      toast.error(`Select exactly ${DAILY_SET_SIZE} approved questions for ${scheduleDayKey}.`);
      return;
    }

    setScheduleSaving(true);
    try {
      const response = await authFetch(`/admin/engagement/daily-sets/${scheduleDayKey}`, {
        method: "PUT",
        body: JSON.stringify({
          questionIds: scheduledQuestionIds,
          status: scheduleStatus,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to save the daily schedule.");
      }
      toast.success(`Daily set saved for ${scheduleDayKey}`);
      await loadScheduleData();
    } catch (error) {
      console.error("Failed to save daily set", error);
      toast.error(error?.message || "Failed to save daily set");
    } finally {
      setScheduleSaving(false);
    }
  };

  const handleSaveContest = async () => {
    if (!authFetch) return;
    setContestSaving(true);
    try {
      const response = await authFetch(
        editingContest
          ? `/admin/engagement/contests/${editingContest.id}`
          : "/admin/engagement/contests",
        {
          method: editingContest ? "PATCH" : "POST",
          body: JSON.stringify({
            ...contestForm,
            goalSummary: contestForm.goalSummary?.trim() || "",
            submissionInstructions: contestForm.submissionInstructions?.trim() || "",
            rewardSummary: contestForm.rewardSummary?.trim() || "",
            deliverables: (Array.isArray(contestForm.deliverables) ? contestForm.deliverables : [])
              .map((item) => String(item || "").trim())
              .filter(Boolean),
            reviewCriteria: (Array.isArray(contestForm.reviewCriteria) ? contestForm.reviewCriteria : [])
              .map((item) => String(item || "").trim())
              .filter(Boolean),
            resourceLinks: (Array.isArray(contestForm.resourceLinks) ? contestForm.resourceLinks : [])
              .map((link) => ({
                label: String(link?.label || "Reference").trim(),
                url: String(link?.url || "").trim(),
              }))
              .filter((link) => link.url),
            acceptedAssetTypes: (Array.isArray(contestForm.acceptedAssetTypes) ? contestForm.acceptedAssetTypes : [])
              .map((item) => String(item || "").trim())
              .filter(Boolean),
            maxAttachments: Number(contestForm.maxAttachments || 0) || 0,
            rewardCoins: Number(contestForm.rewardCoins || 0) || 0,
            rewardXp: Number(contestForm.rewardXp || 0) || 0,
            badgeKey: contestForm.badgeKey?.trim() || "",
            badgeTitle: contestForm.badgeTitle?.trim() || "",
            badgeDescription: contestForm.badgeDescription?.trim() || "",
            badgeIcon: contestForm.badgeIcon?.trim() || "award",
            endDayKey: contestForm.endDayKey || undefined,
          }),
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to save contest.");
      }
      toast.success(editingContest ? "Contest updated" : "Contest created");
      setContestDialogOpen(false);
      await loadContests();
    } catch (error) {
      console.error("Failed to save contest", error);
      toast.error(error?.message || "Failed to save contest");
    } finally {
      setContestSaving(false);
    }
  };

  const handleContestImageUpload = async (file) => {
    if (!authFetch || !file) return;
    setContestImageUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      const response = await authFetch("/upload/project-image", {
        method: "POST",
        body: data,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to upload contest image.");
      }
      const uploadedUrl = String(payload?.data?.url || "").trim();
      if (!uploadedUrl) {
        throw new Error("Contest image upload returned no URL.");
      }
      setContestForm((previous) => ({
        ...previous,
        imageUrl: uploadedUrl,
      }));
      toast.success("Contest image uploaded to R2");
    } catch (error) {
      console.error("Contest image upload failed", error);
      toast.error(error?.message || "Failed to upload contest image");
    } finally {
      setContestImageUploading(false);
    }
  };

  const handleOpenContestReviewDialog = (submissionId, status) => {
    const targetSubmission = contestSubmissions.find((entry) => entry.id === submissionId);
    if (!targetSubmission) {
      toast.error("Contest submission not found.");
      return;
    }

    setContestReviewForm({
      submissionId,
      status,
      reviewNote: targetSubmission.reviewNote || "",
      rewardCoins: Number(targetSubmission.rewardCoins ?? 0) || 0,
      rewardXp: Number(targetSubmission.rewardXp ?? 0) || 0,
    });
    setContestReviewDialogOpen(true);
  };

  const handleReviewContestSubmission = async () => {
    if (!authFetch) return;
    const submissionId = contestReviewForm.submissionId;
    const status = contestReviewForm.status;
    const reviewNote = String(contestReviewForm.reviewNote || "").trim();
    const rewardCoins = Number(contestReviewForm.rewardCoins ?? 0);
    const rewardXp = Number(contestReviewForm.rewardXp ?? 0);

    if (!submissionId) return;
    if (!reviewNote) {
      toast.error("Review note is required.");
      return;
    }
    if (status === "APPROVED") {
      if (!Number.isFinite(rewardCoins) || rewardCoins < 0) {
        toast.error("Coins must be a valid positive number or zero.");
        return;
      }
      if (!Number.isFinite(rewardXp) || rewardXp < 0) {
        toast.error("XP must be a valid positive number or zero.");
        return;
      }
    }

    setContestSubmissionReviewing(submissionId);
    try {
      const response = await authFetch(`/admin/engagement/contest-submissions/${submissionId}`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          reviewNote: reviewNote.trim(),
          ...(status === "APPROVED"
            ? {
                rewardCoins: Math.round(rewardCoins || 0),
                rewardXp: Math.round(rewardXp || 0),
              }
            : {}),
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to update contest submission.");
      }
      setContestReviewDialogOpen(false);
      setContestReviewForm(emptyContestReviewForm);
      toast.success("Contest submission updated");
      await loadContestSubmissions();
    } catch (error) {
      console.error("Failed to review contest submission", error);
      toast.error(error?.message || "Failed to update contest submission");
    } finally {
      setContestSubmissionReviewing("");
    }
  };

  return (
    <AdminLayout>
      <div className="relative flex flex-col gap-6 p-6">
        <AdminTopBar label="Growth Quest Questions" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Question Review</h1>
            <p className="mt-2 text-muted-foreground">
              Approve, edit, reject, and seed reusable Daily Growth Quest questions.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={handleSeed}
              disabled={actionLoading === "seed"}
            >
              {actionLoading === "seed" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Seed Fallback
            </Button>
            <Button type="button" onClick={openNewDialog}>
              <Plus className="size-4" />
              New Question
            </Button>
          </div>
        </div>

        <AdminEngagementScheduleCard
          scheduleDayKey={scheduleDayKey}
          setScheduleDayKey={setScheduleDayKey}
          scheduleStatus={scheduleStatus}
          setScheduleStatus={setScheduleStatus}
          scheduledQuestionIds={scheduledQuestionIds}
          selectedDailySet={selectedDailySet}
          scheduleLoading={scheduleLoading}
          approvedQuestions={approvedQuestions}
          toggleScheduledQuestion={toggleScheduledQuestion}
          handleSaveDailySet={handleSaveDailySet}
          scheduleSaving={scheduleSaving}
          dailySets={dailySets}
        />

        <AdminEngagementPersonalizedHistoryCard
          personalizedHistory={personalizedHistory}
          personalizedHistoryLoading={personalizedHistoryLoading}
          personalizedHistorySearch={personalizedHistorySearch}
          setPersonalizedHistorySearch={setPersonalizedHistorySearch}
          personalizedHistoryDayKey={personalizedHistoryDayKey}
          setPersonalizedHistoryDayKey={setPersonalizedHistoryDayKey}
        />

        <AdminEngagementContestsCard
          contests={contests}
          contestLoading={contestLoading}
          openNewContestDialog={openNewContestDialog}
          openEditContestDialog={openEditContestDialog}
        />

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
                  <SelectTrigger className="w-full sm:w-56 rounded-lg">
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
                  <SelectTrigger className="w-full sm:w-44 rounded-lg">
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
                <p className="text-sm font-medium text-muted-foreground">No contests created yet. Start by creating your first contest.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {contests.map((contest) => (
                  <div key={contest.id} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all hover:border-primary/30 hover:bg-white/[0.05]">
                    {contest.imageUrl ? (
                      <img src={contest.imageUrl} alt={contest.title} className="h-40 w-full object-cover" />
                    ) : (
                      <div className="h-40 bg-gradient-to-br from-primary/20 to-transparent" />
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">CONTEST</p>
                          <h3 className="mt-1 line-clamp-2 text-lg font-black text-white">{contest.title}</h3>
                          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{contest.description}</p>
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
                  <SelectTrigger className="w-full sm:w-56 rounded-lg">
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
                  <SelectTrigger className="w-full sm:w-44 rounded-lg">
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
                  <div key={submission.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-all hover:border-primary/20 hover:bg-white/[0.05]">
                    <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                      <div className="space-y-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex-1">
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">{submission.contestTitle}</p>
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
                            <a href={submission.githubUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-3 py-1.5 font-medium hover:text-primary hover:bg-white/[0.08]">
                              <Github className="size-4" /> GitHub
                            </a>
                          ) : null}
                          {submission.portfolioUrl ? (
                            <a href={submission.portfolioUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-3 py-1.5 font-medium hover:text-primary hover:bg-white/[0.08]">
                              <Link2 className="size-4" /> Portfolio
                            </a>
                          ) : null}
                          <div className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-3 py-1.5">
                            <FileText className="size-4" />
                            {submission.attachments?.length || 0} file{submission.attachments?.length !== 1 ? "s" : ""}
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
                              Reward transferred on {new Date(submission.rewardTransferredAt).toLocaleDateString()}
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

        <Card className="border-white/10 bg-card">
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <CardTitle className="text-xl">Question Bank</CardTitle>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search questions..."
                    className="pl-8"
                  />
                </div>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full sm:w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-2">
              {Object.entries(counts).map(([key, value]) => (
                <Badge
                  key={key}
                  className={statusClassName[key] || statusClassName.DRAFT}
                >
                  {key.replace(/_/g, " ")}: {value}
                </Badge>
              ))}
            </div>
            <div className="rounded-md border border-white/10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <span className="inline-flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="size-4 animate-spin" />
                          Loading questions
                        </span>
                      </TableCell>
                    </TableRow>
                  ) : questions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No questions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    questions.map((question) => (
                      <TableRow key={question.id}>
                        <TableCell className="max-w-[520px]">
                          <p className="line-clamp-2 font-medium">
                            {question.questionText}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Correct: {question.correctOptionId}
                          </p>
                        </TableCell>
                        <TableCell>{question.categoryLabel}</TableCell>
                        <TableCell>{question.difficulty}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              statusClassName[question.status] ||
                              statusClassName.DRAFT
                            }
                          >
                            {question.status.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              title="Edit"
                              onClick={() => openEditDialog(question)}
                            >
                              <Edit className="size-4" />
                            </Button>
                            {question.status !== "APPROVED" ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                title="Approve"
                                disabled={
                                  actionLoading === `approve-${question.id}`
                                }
                                onClick={() => handleApprove(question.id)}
                              >
                                <Check className="size-4 text-emerald-300" />
                              </Button>
                            ) : null}
                            {question.status !== "REJECTED" ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                title="Reject"
                                disabled={
                                  actionLoading === `reject-${question.id}`
                                }
                                onClick={() => handleReject(question.id)}
                              >
                                <X className="size-4 text-red-300" />
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                {editingQuestion ? "Edit Question" : "New Question"}
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-5 py-2">
              <div className="grid gap-2">
                <Label htmlFor="engagement-question-text">Question</Label>
                <Textarea
                  id="engagement-question-text"
                  value={form.questionText}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      questionText: event.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select
                    value={form.type}
                    onValueChange={(value) =>
                      setForm((previous) => ({ ...previous, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(value) =>
                      setForm((previous) => ({ ...previous, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Difficulty</Label>
                  <Select
                    value={form.difficulty}
                    onValueChange={(value) =>
                      setForm((previous) => ({
                        ...previous,
                        difficulty: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTY_OPTIONS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="engagement-skill-tag">Skill tag</Label>
                  <Input
                    id="engagement-skill-tag"
                    value={form.skillTag}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        skillTag: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-3">
                <Label>Options</Label>
                {form.options.map((option, index) => (
                  <div key={option.id} className="grid gap-2 sm:grid-cols-[56px_1fr]">
                    <Input value={option.id} disabled />
                    <Input
                      value={option.text}
                      onChange={(event) => setOptionText(index, event.target.value)}
                      placeholder={`Option ${option.id}`}
                    />
                  </div>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                <div className="grid gap-2">
                  <Label>Correct option</Label>
                  <Select
                    value={form.correctOptionId}
                    onValueChange={(value) =>
                      setForm((previous) => ({
                        ...previous,
                        correctOptionId: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {form.options.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(value) =>
                      setForm((previous) => ({ ...previous, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.filter((item) => item.value !== "ALL").map(
                        (item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="engagement-explanation">Explanation</Label>
                <Textarea
                  id="engagement-explanation"
                  value={form.explanation}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      explanation: event.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={actionLoading === "save"}
              >
                {actionLoading === "save" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Save Question
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={contestDialogOpen} onOpenChange={setContestDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {editingContest ? "Edit Contest" : "New Contest"}
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-5 py-2">
              <div className="grid gap-2">
                <Label htmlFor="engagement-contest-title">Title</Label>
                <Input
                  id="engagement-contest-title"
                  value={contestForm.title}
                  onChange={(event) =>
                    setContestForm((previous) => ({
                      ...previous,
                      title: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="engagement-contest-description">Description</Label>
                <Textarea
                  id="engagement-contest-description"
                  value={contestForm.description}
                  onChange={(event) =>
                    setContestForm((previous) => ({
                      ...previous,
                      description: event.target.value,
                    }))
                  }
                  rows={4}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="engagement-contest-details">Full details</Label>
                <Textarea
                  id="engagement-contest-details"
                  value={contestForm.detailsContent}
                  onChange={(event) =>
                    setContestForm((previous) => ({
                      ...previous,
                      detailsContent: event.target.value,
                    }))
                  }
                  rows={8}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="engagement-contest-goal">Goal summary</Label>
                  <Textarea
                    id="engagement-contest-goal"
                    value={contestForm.goalSummary}
                    onChange={(event) =>
                      setContestForm((previous) => ({
                        ...previous,
                        goalSummary: event.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="What is the contest asking freelancers to produce?"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="engagement-contest-reward">Reward summary</Label>
                  <Textarea
                    id="engagement-contest-reward"
                    value={contestForm.rewardSummary}
                    onChange={(event) =>
                      setContestForm((previous) => ({
                        ...previous,
                        rewardSummary: event.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="What should the freelancer expect after review?"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="grid gap-2">
                  <Label htmlFor="engagement-contest-reward-coins">Reward coins</Label>
                  <Input
                    id="engagement-contest-reward-coins"
                    type="number"
                    min="0"
                    value={contestForm.rewardCoins}
                    onChange={(event) =>
                      setContestForm((previous) => ({
                        ...previous,
                        rewardCoins: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="engagement-contest-reward-xp">Reward XP</Label>
                  <Input
                    id="engagement-contest-reward-xp"
                    type="number"
                    min="0"
                    value={contestForm.rewardXp}
                    onChange={(event) =>
                      setContestForm((previous) => ({
                        ...previous,
                        rewardXp: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="engagement-contest-badge-title">Badge title</Label>
                  <Input
                    id="engagement-contest-badge-title"
                    value={contestForm.badgeTitle}
                    onChange={(event) =>
                      setContestForm((previous) => ({
                        ...previous,
                        badgeTitle: event.target.value,
                      }))
                    }
                    placeholder="Contest winner badge"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="engagement-contest-badge-icon">Badge icon</Label>
                  <Input
                    id="engagement-contest-badge-icon"
                    value={contestForm.badgeIcon}
                    onChange={(event) =>
                      setContestForm((previous) => ({
                        ...previous,
                        badgeIcon: event.target.value,
                      }))
                    }
                    placeholder="award"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="engagement-contest-badge-key">Badge key</Label>
                  <Input
                    id="engagement-contest-badge-key"
                    value={contestForm.badgeKey}
                    onChange={(event) =>
                      setContestForm((previous) => ({
                        ...previous,
                        badgeKey: event.target.value,
                      }))
                    }
                    placeholder="Optional custom badge key"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="engagement-contest-badge-description">Badge description</Label>
                  <Textarea
                    id="engagement-contest-badge-description"
                    value={contestForm.badgeDescription}
                    onChange={(event) =>
                      setContestForm((previous) => ({
                        ...previous,
                        badgeDescription: event.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="Describe why this badge is awarded."
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="engagement-contest-instructions">Submission instructions</Label>
                <Textarea
                  id="engagement-contest-instructions"
                  value={contestForm.submissionInstructions}
                  onChange={(event) =>
                    setContestForm((previous) => ({
                      ...previous,
                      submissionInstructions: event.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Tell freelancers what to submit, how to structure files, and what the admin should review."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="engagement-contest-deliverables">Deliverables</Label>
                  <Textarea
                    id="engagement-contest-deliverables"
                    value={(contestForm.deliverables || []).join("\n")}
                    onChange={(event) =>
                      setContestForm((previous) => ({
                        ...previous,
                        deliverables: toLineArray(event.target.value),
                      }))
                    }
                    rows={4}
                    placeholder={"One deliverable per line\nExample: Landing page design\nExample: GitHub repo"}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="engagement-contest-criteria">Review criteria</Label>
                  <Textarea
                    id="engagement-contest-criteria"
                    value={(contestForm.reviewCriteria || []).join("\n")}
                    onChange={(event) =>
                      setContestForm((previous) => ({
                        ...previous,
                        reviewCriteria: toLineArray(event.target.value),
                      }))
                    }
                    rows={4}
                    placeholder={"One review criterion per line\nExample: Clarity of execution\nExample: Asset quality"}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="engagement-contest-links">Reference links</Label>
                  <Textarea
                    id="engagement-contest-links"
                    value={(contestForm.resourceLinks || [])
                      .map((link) => `${link?.label || "Reference"}|${link?.url || ""}`)
                      .join("\n")}
                    onChange={(event) =>
                      setContestForm((previous) => ({
                        ...previous,
                        resourceLinks: toLinkArray(event.target.value),
                      }))
                    }
                    rows={4}
                    placeholder={"Label | https://example.com\nDesign spec | https://figma.com/..."}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="engagement-contest-assets">Accepted asset types</Label>
                    <Textarea
                      id="engagement-contest-assets"
                      value={(contestForm.acceptedAssetTypes || []).join("\n")}
                      onChange={(event) =>
                        setContestForm((previous) => ({
                          ...previous,
                          acceptedAssetTypes: toLineArray(event.target.value),
                        }))
                      }
                      rows={4}
                      placeholder={"image\npdf\ndoc\nzip"}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="engagement-contest-max-attachments">Max attachments</Label>
                    <Input
                      id="engagement-contest-max-attachments"
                      type="number"
                      min="0"
                      max="20"
                      value={contestForm.maxAttachments}
                      onChange={(event) =>
                        setContestForm((previous) => ({
                          ...previous,
                          maxAttachments: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <Label>Contest image</Label>
                {contestForm.imageUrl ? (
                  <img
                    src={contestForm.imageUrl}
                    alt="Contest cover"
                    className="h-40 w-full rounded-xl border border-white/10 object-cover"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-muted-foreground">
                    No contest image uploaded yet
                  </div>
                )}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    value={contestForm.imageUrl}
                    onChange={(event) =>
                      setContestForm((previous) => ({
                        ...previous,
                        imageUrl: event.target.value,
                      }))
                    }
                    placeholder="https://..."
                  />
                  <Input
                    type="file"
                    accept="image/*"
                    disabled={contestImageUploading}
                    onChange={(event) => handleContestImageUpload(event.target.files?.[0])}
                    className="sm:max-w-64"
                  />
                </div>
                {contestImageUploading ? (
                  <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Uploading image to R2
                  </p>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="engagement-contest-category">Category</Label>
                  <Input
                    id="engagement-contest-category"
                    value={contestForm.category}
                    onChange={(event) =>
                      setContestForm((previous) => ({
                        ...previous,
                        category: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="engagement-contest-cta">CTA label</Label>
                  <Input
                    id="engagement-contest-cta"
                    value={contestForm.ctaLabel}
                    onChange={(event) =>
                      setContestForm((previous) => ({
                        ...previous,
                        ctaLabel: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="engagement-contest-start">Start date</Label>
                  <Input
                    id="engagement-contest-start"
                    type="date"
                    value={contestForm.startDayKey}
                    onChange={(event) =>
                      setContestForm((previous) => ({
                        ...previous,
                        startDayKey: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="engagement-contest-end">End date</Label>
                  <Input
                    id="engagement-contest-end"
                    type="date"
                    value={contestForm.endDayKey}
                    onChange={(event) =>
                      setContestForm((previous) => ({
                        ...previous,
                        endDayKey: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={contestForm.status}
                  onValueChange={(value) =>
                    setContestForm((previous) => ({
                      ...previous,
                      status: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setContestDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveContest}
                disabled={contestSaving}
              >
                {contestSaving ? <Loader2 className="size-4 animate-spin" /> : null}
                Save Contest
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={contestReviewDialogOpen}
          onOpenChange={(open) => {
            setContestReviewDialogOpen(open);
            if (!open && !contestSubmissionReviewing) {
              setContestReviewForm(emptyContestReviewForm);
            }
          }}
        >
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {contestReviewForm.status === "APPROVED"
                  ? "Approve Contest Submission"
                  : contestReviewForm.status === "NEEDS_CHANGES"
                    ? "Request Changes"
                    : "Reject Contest Submission"}
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-5 py-2">
              <div className="grid gap-2">
                <Label htmlFor="contest-review-note">Admin note</Label>
                <Textarea
                  id="contest-review-note"
                  rows={4}
                  value={contestReviewForm.reviewNote}
                  onChange={(event) =>
                    setContestReviewForm((previous) => ({
                      ...previous,
                      reviewNote: event.target.value,
                    }))
                  }
                  placeholder="Explain the approval, change request, or rejection."
                />
              </div>

              {contestReviewForm.status === "APPROVED" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="contest-review-coins">Coins to transfer</Label>
                    <Input
                      id="contest-review-coins"
                      type="number"
                      min="0"
                      value={contestReviewForm.rewardCoins}
                      onChange={(event) =>
                        setContestReviewForm((previous) => ({
                          ...previous,
                          rewardCoins: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="contest-review-xp">XP to award</Label>
                    <Input
                      id="contest-review-xp"
                      type="number"
                      min="0"
                      value={contestReviewForm.rewardXp}
                      onChange={(event) =>
                        setContestReviewForm((previous) => ({
                          ...previous,
                          rewardXp: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={Boolean(contestSubmissionReviewing)}
                onClick={() => {
                  setContestReviewDialogOpen(false);
                  setContestReviewForm(emptyContestReviewForm);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={Boolean(contestSubmissionReviewing)}
                onClick={handleReviewContestSubmission}
              >
                {contestSubmissionReviewing ? <Loader2 className="size-4 animate-spin" /> : null}
                {contestReviewForm.status === "APPROVED"
                  ? "Approve and Transfer Rewards"
                  : contestReviewForm.status === "NEEDS_CHANGES"
                    ? "Save Change Request"
                    : "Reject Submission"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminEngagementQuestions;
