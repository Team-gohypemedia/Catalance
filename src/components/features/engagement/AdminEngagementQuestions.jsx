import React, { useCallback, useEffect, useState } from "react";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import Check from "lucide-react/dist/esm/icons/check";
import Edit from "lucide-react/dist/esm/icons/edit";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Plus from "lucide-react/dist/esm/icons/plus";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import X from "lucide-react/dist/esm/icons/x";
import AdminLayout from "@/components/features/admin/AdminLayout";
import { AdminTopBar } from "@/components/features/admin/AdminTopBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/shared/context/AuthContext";
import { toast } from "sonner";

const CATEGORY_OPTIONS = [
  { value: "CLIENT_COMMUNICATION", label: "Client Communication" },
  { value: "SCOPE_MANAGEMENT", label: "Scope Management" },
  { value: "DELIVERY", label: "Delivery" },
  { value: "QUALITY_CONTROL", label: "Quality Control" },
  { value: "PLATFORM_RULES", label: "Platform Rules" },
  { value: "BUSINESS_BASICS", label: "Business Basics" },
];

const DIFFICULTY_OPTIONS = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

const TYPE_OPTIONS = [
  { value: "MCQ", label: "MCQ (4 options)" },
  { value: "TRUE_FALSE", label: "True / False" },
  { value: "SCENARIO_MCQ", label: "Scenario MCQ" },
];

const TRUE_FALSE_OPTIONS = [
  { id: "A", text: "True" },
  { id: "B", text: "False" },
];

const MCQ_OPTIONS = [
  { id: "A", text: "" },
  { id: "B", text: "" },
  { id: "C", text: "" },
  { id: "D", text: "" },
];

const todayKey = () => new Date().toISOString().slice(0, 10);

const emptyForm = {
  questionText: "",
  type: "MCQ",
  category: "CLIENT_COMMUNICATION",
  skillTag: "client_readiness",
  difficulty: "BEGINNER",
  options: MCQ_OPTIONS,
  correctOptionId: "A",
  explanation: "",
  status: "APPROVED",
};

const getOptionsForType = (type) =>
  type === "TRUE_FALSE" ? TRUE_FALSE_OPTIONS : MCQ_OPTIONS;

const statusColor = {
  APPROVED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
  PENDING_APPROVAL: "border-yellow-500/20 bg-yellow-500/10 text-yellow-200",
  DRAFT: "border-white/10 bg-white/[0.04] text-muted-foreground",
  REJECTED: "border-red-500/20 bg-red-500/10 text-red-200",
};

const AdminEngagementQuestions = () => {
  const { authFetch } = useAuth();

  // ── Date state ──────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState(todayKey());

  // ── Daily set for selected date ─────────────────────────
  const [dayData, setDayData] = useState(null);
  const [loadingDay, setLoadingDay] = useState(false);
  const [savingSet, setSavingSet] = useState(false);

  // ── Question form dialog ────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [actionLoading, setActionLoading] = useState("");

  // ── Selection for assigning to day ─────────────────────
  const [selectedIds, setSelectedIds] = useState(new Set());

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm("Permanently delete this question from the pool?")) return;
    setActionLoading(`delete-${id}`);
    try {
      const res = await authFetch(`/admin/engagement/questions/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const p = await res.json().catch(() => null);
        throw new Error(p?.message || "Failed to delete");
      }
      toast.success("Question deleted");
      // Remove from selectedIds too
      setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
      await loadDay();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading("");
    }
  };

  // Load daily set when date changes
  const loadDay = useCallback(async () => {
    if (!authFetch || !selectedDate) return;
    setLoadingDay(true);
    try {
      const res = await authFetch(`/admin/engagement/daily-sets/${selectedDate}`);
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.message || "Failed to load day");
      setDayData(payload.data);
      setSelectedIds(new Set(payload.data.assignedIds || []));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingDay(false);
    }
  }, [authFetch, selectedDate]);

  useEffect(() => { loadDay(); }, [loadDay]);

  // Handle type change — auto-fill True/False options
  const handleTypeChange = (type) => {
    setForm((prev) => ({
      ...prev,
      type,
      options: getOptionsForType(type),
      correctOptionId: "A",
    }));
  };

  const openNew = () => {
    setEditingQuestion(null);
    setForm({ ...emptyForm, options: MCQ_OPTIONS });
    setDialogOpen(true);
  };

  const openEdit = (q) => {
    setEditingQuestion(q);
    setForm({
      questionText: q.questionText || "",
      type: q.type || "MCQ",
      category: q.category || "CLIENT_COMMUNICATION",
      skillTag: q.skillTag || "client_readiness",
      difficulty: q.difficulty || "BEGINNER",
      options: Array.isArray(q.options) && q.options.length
        ? q.options.map((o, i) => ({ id: o.id || String.fromCharCode(65 + i), text: o.text || "" }))
        : getOptionsForType(q.type || "MCQ"),
      correctOptionId: q.correctOptionId || "A",
      explanation: q.explanation || "",
      status: "APPROVED",
    });
    setDialogOpen(true);
  };

  const setOptionText = (idx, text) => {
    if (form.type === "TRUE_FALSE") return; // locked
    setForm((p) => ({ ...p, options: p.options.map((o, i) => i === idx ? { ...o, text } : o) }));
  };

  const handleSave = async () => {
    if (!form.questionText.trim()) return toast.error("Question text is required");
    setActionLoading("save");
    try {
      const url = editingQuestion
        ? `/admin/engagement/questions/${editingQuestion.id}`
        : "/admin/engagement/questions";
      const res = await authFetch(url, {
        method: editingQuestion ? "PATCH" : "POST",
        body: JSON.stringify({ ...form, status: "APPROVED" }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.message || "Failed to save");
      const saved = payload.data;
      toast.success(editingQuestion ? "Question updated" : "Question created & approved");
      setDialogOpen(false);
      // Auto-add new question to current day selection
      if (!editingQuestion && saved?.id) {
        setSelectedIds((prev) => new Set([...prev, saved.id]));
      }
      await loadDay();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading("");
    }
  };

  const handleRemoveFromDay = (id) => {
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  };

  const handlePublish = async () => {
    if (selectedIds.size === 0) return toast.error("Add at least one question to publish");
    setSavingSet(true);
    try {
      const res = await authFetch(`/admin/engagement/daily-sets/${selectedDate}/assign`, {
        method: "POST",
        body: JSON.stringify({ questionIds: [...selectedIds] }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.message || "Failed to publish");
      toast.success(`Day ${selectedDate} published with ${selectedIds.size} questions!`);
      await loadDay();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingSet(false);
    }
  };

  const allApproved = dayData?.allApproved || [];
  const assigned = allApproved.filter((q) => selectedIds.has(q.id));
  const unassigned = allApproved.filter((q) => !selectedIds.has(q.id));

  return (
    <AdminLayout>
      <div className="relative flex flex-col gap-6 p-6">
        <AdminTopBar label="Growth Quest Questions" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Daily Question Scheduler</h1>
            <p className="mt-1 text-muted-foreground">Select a date, add questions, then publish to make them live for freelancers.</p>
          </div>
          <Button onClick={openNew}><Plus className="size-4" /> New Question</Button>
        </div>

        {/* Date Picker */}
        <Card className="border-white/10 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="size-5 text-primary" /> Select Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="grid gap-1.5">
                <Label>Quest Date</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-48"
                />
              </div>
              {dayData && (
                <Badge className={dayData.status === "PUBLISHED" ? statusColor.APPROVED : statusColor.DRAFT}>
                  {dayData.status}
                </Badge>
              )}
              <Button
                onClick={handlePublish}
                disabled={savingSet || selectedIds.size === 0}
                className="bg-primary text-black hover:bg-primary/90"
              >
                {savingSet ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Publish {selectedIds.size > 0 ? `(${selectedIds.size} Qs)` : ""}
              </Button>
            </div>
          </CardContent>
        </Card>

        {loadingDay ? (
          <div className="flex items-center gap-2 text-muted-foreground py-10 justify-center">
            <Loader2 className="size-5 animate-spin" /> Loading questions for {selectedDate}...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Assigned to this day */}
            <Card className="border-white/10 bg-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>📅 Assigned to {selectedDate}</span>
                  <Badge className="ml-2 border-emerald-500/20 bg-emerald-500/10 text-emerald-200">{assigned.length} questions</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {assigned.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">No questions assigned yet. Pick from the pool →</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {assigned.map((q, idx) => (
                      <div key={q.id} className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/30 p-3">
                        <span className="shrink-0 text-xs font-black text-primary w-5 mt-0.5">{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-2">{q.questionText}</p>
                          <div className="flex gap-2 mt-1">
                            <span className="text-[10px] text-muted-foreground">{q.type}</span>
                            <span className="text-[10px] text-muted-foreground">{q.difficulty}</span>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button variant="ghost" size="icon-sm" onClick={() => openEdit(q)}><Edit className="size-3.5" /></Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => handleRemoveFromDay(q.id)}>
                            <X className="size-3.5 text-red-400" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Question Pool */}
            <Card className="border-white/10 bg-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>🗃 Question Pool (Approved)</span>
                  <Badge className="ml-2 border-white/10 bg-white/[0.04] text-muted-foreground">{unassigned.length} available</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {unassigned.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">All approved questions are already assigned!</p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1">
                    {unassigned.map((q) => (
                      <div key={q.id} className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/30 p-3 hover:border-primary/30 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-2">{q.questionText}</p>
                          <div className="flex gap-2 mt-1">
                            <span className="text-[10px] text-muted-foreground">{q.type}</span>
                            <span className="text-[10px] text-muted-foreground">{q.difficulty}</span>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            title="Add to today"
                            className="text-emerald-400 hover:bg-emerald-500/10"
                            onClick={() => setSelectedIds((prev) => new Set([...prev, q.id]))}
                          >
                            <Plus className="size-4" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            title="Delete from pool"
                            className="text-red-400 hover:bg-red-500/10"
                            disabled={actionLoading === `delete-${q.id}`}
                            onClick={() => handleDeleteQuestion(q.id)}
                          >
                            {actionLoading === `delete-${q.id}` ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Question Form Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingQuestion ? "Edit Question" : "New Question"}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>Question Text</Label>
                <Textarea
                  value={form.questionText}
                  onChange={(e) => setForm((p) => ({ ...p, questionText: e.target.value }))}
                  rows={3}
                  placeholder="Write the question..."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={handleTypeChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Difficulty</Label>
                  <Select value={form.difficulty} onValueChange={(v) => setForm((p) => ({ ...p, difficulty: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DIFFICULTY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Options */}
              <div className="grid gap-3">
                <Label>Answer Options</Label>
                {form.type === "TRUE_FALSE" ? (
                  <div className="flex gap-3">
                    {TRUE_FALSE_OPTIONS.map((o) => (
                      <div key={o.id} className="flex-1 flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-4 py-2.5">
                        <span className="font-black text-primary text-sm">{o.id}</span>
                        <span className="text-sm font-medium">{o.text}</span>
                        <span className="ml-auto text-[10px] text-muted-foreground">(default)</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  form.options.map((opt, idx) => (
                    <div key={opt.id} className="grid gap-2 grid-cols-[44px_1fr]">
                      <div className="flex h-10 items-center justify-center rounded-md border border-white/10 bg-black/40 text-sm font-black text-primary">
                        {opt.id}
                      </div>
                      <Input
                        value={opt.text}
                        onChange={(e) => setOptionText(idx, e.target.value)}
                        placeholder={`Option ${opt.id} text...`}
                      />
                    </div>
                  ))
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Correct Answer</Label>
                  <Select value={form.correctOptionId} onValueChange={(v) => setForm((p) => ({ ...p, correctOptionId: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {form.options.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.id} — {o.text || "(no text)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Skill Tag</Label>
                  <Input value={form.skillTag} onChange={(e) => setForm((p) => ({ ...p, skillTag: e.target.value }))} />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Explanation (shown after answer)</Label>
                <Textarea
                  value={form.explanation}
                  onChange={(e) => setForm((p) => ({ ...p, explanation: e.target.value }))}
                  rows={2}
                  placeholder="Why is this the correct answer?"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={actionLoading === "save" || !form.questionText.trim()}>
                {actionLoading === "save" ? <Loader2 className="size-4 animate-spin mr-2" /> : <Check className="size-4 mr-2" />}
                Save & Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminEngagementQuestions;
