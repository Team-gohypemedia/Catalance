import React, { useCallback, useEffect, useMemo, useState } from "react";
import Check from "lucide-react/dist/esm/icons/check";
import Edit from "lucide-react/dist/esm/icons/edit";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Plus from "lucide-react/dist/esm/icons/plus";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import Search from "lucide-react/dist/esm/icons/search";
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

const STATUS_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING_APPROVAL", label: "Pending approval" },
  { value: "APPROVED", label: "Approved" },
  { value: "DRAFT", label: "Draft" },
  { value: "REJECTED", label: "Rejected" },
];

const CATEGORY_OPTIONS = [
  { value: "CLIENT_COMMUNICATION", label: "Client communication" },
  { value: "SCOPE_MANAGEMENT", label: "Scope management" },
  { value: "DELIVERY", label: "Delivery" },
  { value: "QUALITY_CONTROL", label: "Quality control" },
  { value: "PLATFORM_RULES", label: "Platform rules" },
  { value: "BUSINESS_BASICS", label: "Business basics" },
];

const DIFFICULTY_OPTIONS = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

const TYPE_OPTIONS = [
  { value: "MCQ", label: "MCQ" },
  { value: "TRUE_FALSE", label: "True / false" },
  { value: "SCENARIO_MCQ", label: "Scenario MCQ" },
];

const emptyForm = {
  questionText: "",
  type: "MCQ",
  category: "CLIENT_COMMUNICATION",
  skillTag: "client_readiness",
  difficulty: "BEGINNER",
  options: [
    { id: "A", text: "" },
    { id: "B", text: "" },
    { id: "C", text: "" },
    { id: "D", text: "" },
  ],
  correctOptionId: "A",
  explanation: "",
  status: "PENDING_APPROVAL",
};

const DAILY_SET_SIZE = 5;
const createTodayKey = () => new Date().toISOString().slice(0, 10);
const emptyContestForm = {
  title: "",
  description: "",
  detailsContent: "",
  imageUrl: "",
  category: "Contest",
  ctaLabel: "View Contest",
  startDayKey: createTodayKey(),
  endDayKey: "",
  status: "DRAFT",
};

const statusClassName = {
  APPROVED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
  PUBLISHED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
  PENDING_APPROVAL: "border-[#facc15]/20 bg-[#facc15]/10 text-[#fde68a]",
  DRAFT: "border-white/10 bg-white/[0.04] text-muted-foreground",
  REJECTED: "border-red-500/20 bg-red-500/10 text-red-200",
  ARCHIVED: "border-white/10 bg-white/[0.04] text-muted-foreground",
};

const cloneQuestionToForm = (question) => ({
  questionText: question?.questionText || "",
  type: question?.type || "MCQ",
  category: question?.category || "CLIENT_COMMUNICATION",
  skillTag: question?.skillTag || "client_readiness",
  difficulty: question?.difficulty || "BEGINNER",
  options:
    Array.isArray(question?.options) && question.options.length
      ? question.options.map((option, index) => ({
          id: option.id || String.fromCharCode(65 + index),
          text: option.text || "",
        }))
      : emptyForm.options,
  correctOptionId: question?.correctOptionId || "A",
  explanation: question?.explanation || "",
  status:
    question?.status && ["DRAFT", "PENDING_APPROVAL", "APPROVED"].includes(question.status)
      ? question.status
      : "PENDING_APPROVAL",
});

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
  const [contests, setContests] = useState([]);
  const [contestDialogOpen, setContestDialogOpen] = useState(false);
  const [editingContest, setEditingContest] = useState(null);
  const [contestForm, setContestForm] = useState(emptyContestForm);
  const [contestLoading, setContestLoading] = useState(true);
  const [contestSaving, setContestSaving] = useState(false);
  const [contestImageUploading, setContestImageUploading] = useState(false);

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

        <Card id="contest-feed" className="border-white/10 bg-card">
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-xl">Calendar Daily Set</CardTitle>
                <p className="mt-2 text-sm text-muted-foreground">
                  Pick a date and assign the exact approved questions freelancers should see on
                  that day.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="grid gap-2">
                  <Label htmlFor="growth-quest-day-key">Date</Label>
                  <Input
                    id="growth-quest-day-key"
                    type="date"
                    value={scheduleDayKey}
                    onChange={(event) => setScheduleDayKey(event.target.value)}
                    className="w-full sm:w-48"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select value={scheduleStatus} onValueChange={setScheduleStatus}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Badge className="border-primary/20 bg-primary/10 text-primary">
                Selected {scheduledQuestionIds.length}/{DAILY_SET_SIZE}
              </Badge>
              {selectedDailySet ? (
                <Badge className={statusClassName[selectedDailySet.status] || statusClassName.DRAFT}>
                  Existing set: {selectedDailySet.status}
                </Badge>
              ) : (
                <Badge className="border-white/10 bg-white/[0.04] text-muted-foreground">
                  No set saved for this date yet
                </Badge>
              )}
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
              <div className="rounded-md border border-white/10">
                <div className="border-b border-white/10 px-4 py-3">
                  <p className="text-sm font-medium">Approved Questions</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Only approved questions can be scheduled to a calendar date.
                  </p>
                </div>
                <div className="max-h-[420px] overflow-y-auto p-3">
                  {scheduleLoading ? (
                    <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Loading approved questions
                    </div>
                  ) : approvedQuestions.length === 0 ? (
                    <div className="h-24 content-center text-center text-sm text-muted-foreground">
                      No approved questions available.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {approvedQuestions.map((question) => {
                        const checked = scheduledQuestionIds.includes(question.id);
                        return (
                          <label
                            key={question.id}
                            className="flex cursor-pointer gap-3 rounded-lg border border-white/10 bg-background/40 p-3 transition-colors hover:border-primary/20"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleScheduledQuestion(question.id)}
                              className="mt-1"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-2 text-sm font-medium">
                                {question.questionText}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <span>{question.categoryLabel}</span>
                                <span>{question.difficulty}</span>
                                <span>Correct: {question.correctOptionId}</span>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-md border border-white/10 p-4">
                  <p className="text-sm font-medium">Selected for {scheduleDayKey}</p>
                  <div className="mt-3 space-y-3">
                    {scheduledQuestionIds.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Choose {DAILY_SET_SIZE} approved questions to build this day&apos;s set.
                      </p>
                    ) : (
                      scheduledQuestionIds.map((questionId, index) => {
                        const question = approvedQuestions.find((entry) => entry.id === questionId);
                        return (
                          <div
                            key={questionId}
                            className="rounded-lg border border-white/10 bg-background/40 p-3"
                          >
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                              Slot {index + 1}
                            </p>
                            <p className="mt-2 text-sm font-medium">
                              {question?.questionText || questionId}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <Button
                    type="button"
                    className="mt-4 w-full"
                    onClick={handleSaveDailySet}
                    disabled={scheduleSaving || scheduleLoading}
                  >
                    {scheduleSaving ? <Loader2 className="size-4 animate-spin" /> : null}
                    Save Daily Set
                  </Button>
                </div>

                <div className="rounded-md border border-white/10 p-4">
                  <p className="text-sm font-medium">Upcoming Scheduled Dates</p>
                  <div className="mt-3 space-y-3">
                    {dailySets.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No scheduled calendar dates saved yet.
                      </p>
                    ) : (
                      dailySets.slice(0, 8).map((entry) => (
                        <button
                          key={entry.id}
                          type="button"
                          onClick={() => setScheduleDayKey(entry.dayKey)}
                          className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-background/40 px-3 py-3 text-left transition-colors hover:border-primary/20"
                        >
                          <div>
                            <p className="text-sm font-medium">{entry.dayKey}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {entry.questionCount} questions • {entry.generatedBy}
                            </p>
                          </div>
                          <Badge className={statusClassName[entry.status] || statusClassName.DRAFT}>
                            {entry.status}
                          </Badge>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-card">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-xl">Contest Feed</CardTitle>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add contest title, description, date range, and publish it to the freelancer
                  Growth Quest page.
                </p>
              </div>
              <Button type="button" onClick={openNewContestDialog}>
                <Plus className="size-4" />
                New Contest
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-white/10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contest</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contestLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <span className="inline-flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="size-4 animate-spin" />
                          Loading contests
                        </span>
                      </TableCell>
                    </TableRow>
                  ) : contests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No contests created yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    contests.map((contest) => (
                      <TableRow key={contest.id}>
                        <TableCell className="max-w-[420px]">
                          <p className="line-clamp-1 font-medium">{contest.title}</p>
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {contest.description}
                          </p>
                        </TableCell>
                        <TableCell>{contest.category}</TableCell>
                        <TableCell>
                          {contest.startDayKey}
                          {contest.endDayKey ? ` to ${contest.endDayKey}` : ""}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              statusClassName[contest.status] || statusClassName.DRAFT
                            }
                          >
                            {contest.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            title="Edit contest"
                            onClick={() => openEditContestDialog(contest)}
                          >
                            <Edit className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
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
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
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
      </div>
    </AdminLayout>
  );
};

export default AdminEngagementQuestions;
