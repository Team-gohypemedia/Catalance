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

const statusClassName = {
  APPROVED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
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
      </div>
    </AdminLayout>
  );
};

export default AdminEngagementQuestions;
