import React, { useCallback, useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import Edit from "lucide-react/dist/esm/icons/edit";
import ImageIcon from "lucide-react/dist/esm/icons/image";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Plus from "lucide-react/dist/esm/icons/plus";
import Search from "lucide-react/dist/esm/icons/search";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
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

const STATUS_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const CATEGORY_OPTIONS = [
  { value: "SKILL_BUILDING", label: "Skill Building" },
  { value: "LIVE_CONTRACT", label: "Live Contract" },
  { value: "SPEED_TRIAL", label: "Speed Trial" },
];

const DIFFICULTY_OPTIONS = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

const emptyForm = {
  title: "",
  description: "",
  category: "SKILL_BUILDING",
  difficulty: "BEGINNER",
  xpReward: 500,
  coinReward: 150,
  status: "DRAFT",
  startsAt: "",
  endsAt: "",
  imageUrl: "",
};

const statusClassName = {
  ACTIVE: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
  DRAFT: "border-white/10 bg-white/[0.04] text-muted-foreground",
  COMPLETED: "border-blue-500/20 bg-blue-500/10 text-blue-200",
  CANCELLED: "border-red-500/20 bg-red-500/10 text-red-200",
};

const AdminEngagementContests = () => {
  const { authFetch } = useAuth();
  const [contests, setContests] = useState([]);
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContest, setEditingContest] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadContests = useCallback(async () => {
    if (!authFetch) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status !== "ALL") params.set("status", status);
      if (search.trim()) params.set("search", search.trim());
      
      const response = await authFetch(`/admin/engagement/contests?${params.toString()}`);
      
      if (!response.ok) throw new Error("Failed to load contests.");

      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || "Failed to load contests.");
      setContests(Array.isArray(payload?.data) ? payload.data : []);
    } catch (error) {
      console.error("Failed to load engagement contests", error);
      toast.error(error?.message || "Failed to load contests");
    } finally {
      setLoading(false);
    }
  }, [authFetch, search, status]);

  useEffect(() => {
    const timeoutId = window.setTimeout(loadContests, 250);
    return () => window.clearTimeout(timeoutId);
  }, [loadContests]);

  const counts = useMemo(() => contests.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {}), [contests]);

  const openNewDialog = () => {
    setEditingContest(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (contest) => {
    setEditingContest(contest);
    setForm({
      title: contest.title || "",
      description: contest.description || "",
      category: contest.category || "SKILL_BUILDING",
      difficulty: contest.difficulty || "BEGINNER",
      xpReward: contest.xpReward || 500,
      coinReward: contest.coinReward || 150,
      status: contest.status || "DRAFT",
      startsAt: contest.startsAt ? format(new Date(contest.startsAt), "yyyy-MM-dd'T'HH:mm") : "",
      endsAt: contest.endsAt ? format(new Date(contest.endsAt), "yyyy-MM-dd'T'HH:mm") : "",
      imageUrl: contest.imageUrl || "",
    });
    setDialogOpen(true);
  };

  const handleImageUpload = async (file) => {
    if (!file || !authFetch) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await authFetch("/upload/project-image", { method: "POST", body: fd });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.message || "Upload failed");
      const url = String(payload?.data?.url || "").trim();
      if (!url) throw new Error("No URL returned from upload");
      setForm((prev) => ({ ...prev, imageUrl: url }));
      toast.success("Image uploaded!");
    } catch (err) {
      toast.error(err?.message || "Image upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!authFetch) return;
    setActionLoading("save");
    try {
      const response = await authFetch(
        editingContest ? `/admin/engagement/contests/${editingContest.id}` : "/admin/engagement/contests",
        {
          method: editingContest ? "PATCH" : "POST",
          body: JSON.stringify(form),
        }
      );
      
      if (!response.ok) throw new Error("Failed to save contest.");

      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || "Failed to save contest.");
      
      toast.success(editingContest ? "Contest updated" : "Contest created");
      setDialogOpen(false);
      await loadContests();
    } catch (error) {
      console.error("Failed to save contest", error);
      toast.error(error?.message || "Failed to save contest");
    } finally {
      setActionLoading("");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this contest?")) return;
    setActionLoading(`delete-${id}`);
    try {
      const response = await authFetch(`/admin/engagement/contests/${id}`, { method: "DELETE" });
      
      

      if (!response.ok) throw new Error("Failed to delete contest.");
      toast.success("Contest deleted");
      await loadContests();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setActionLoading("");
    }
  };

  return (
    <AdminLayout>
      <div className="relative flex flex-col gap-6 p-6">
        <AdminTopBar label="Growth Quest Contests" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Contest Management</h1>
            <p className="mt-2 text-muted-foreground">
              Create and manage Available Contracts and Speed Trials for freelancers.
            </p>
          </div>
          <Button type="button" onClick={openNewDialog}>
            <Plus className="size-4" />
            New Contest
          </Button>
        </div>

        <Card className="border-white/10 bg-card">
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <CardTitle className="text-xl">Available Contracts Directory</CardTitle>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search contests..."
                    className="pl-8"
                  />
                </div>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-2">
              {Object.entries(counts).map(([key, value]) => (
                <Badge key={key} className={statusClassName[key] || statusClassName.DRAFT}>
                  {key.replace(/_/g, " ")}: {value}
                </Badge>
              ))}
            </div>
            
            <div className="rounded-md border border-white/10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contest</TableHead>
                    <TableHead>Category / Diff</TableHead>
                    <TableHead>Rewards</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <span className="inline-flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="size-4 animate-spin" /> Loading contests...
                        </span>
                      </TableCell>
                    </TableRow>
                  ) : contests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">No contests found.</TableCell>
                    </TableRow>
                  ) : (
                    contests.map((contest) => (
                      <TableRow key={contest.id}>
                        <TableCell className="max-w-[420px]">
                          <div className="flex items-center gap-3">
                            {contest.imageUrl ? (
                              <img src={contest.imageUrl} alt={contest.title} className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0" />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center shrink-0 border border-white/10">
                                <ImageIcon className="size-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-bold truncate">{contest.title}</p>
                              <p className="line-clamp-1 text-xs text-muted-foreground mt-0.5">{contest.description || "No description provided."}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">{contest.category.replace(/_/g, " ")}</p>
                          <p className="text-xs text-muted-foreground mt-1">{contest.difficulty}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-400"><span className="material-symbols-outlined text-[14px]">star</span> {contest.xpReward} XP</span>
                            <span className="flex items-center gap-1 text-xs font-bold text-primary"><span className="material-symbols-outlined text-[14px]">toll</span> {contest.coinReward}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusClassName[contest.status] || statusClassName.DRAFT}>
                            {contest.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(contest)}>
                              <Edit className="size-4" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" disabled={actionLoading === `delete-${contest.id}`} onClick={() => handleDelete(contest.id)}>
                              <Trash2 className="size-4 text-red-400" />
                            </Button>
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

        {/* Dialog Form */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingContest ? "Edit Contest" : "Create New Contest"}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-5 py-4">
              <div className="grid gap-2">
                <Label>Contest Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. React Component Deep Dive" />
              </div>

              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Brief objective for the freelancer..." />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(val) => setForm({ ...form, category: val })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Difficulty</Label>
                  <Select value={form.difficulty} onValueChange={(val) => setForm({ ...form, difficulty: val })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DIFFICULTY_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>XP Reward</Label>
                  <Input type="number" value={form.xpReward} onChange={(e) => setForm({ ...form, xpReward: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="grid gap-2">
                  <Label>Coin Reward</Label>
                  <Input type="number" value={form.coinReward} onChange={(e) => setForm({ ...form, coinReward: parseInt(e.target.value) || 0 })} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Start Date (Optional)</Label>
                  <Input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>End Date (Optional)</Label>
                  <Input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
                </div>
              </div>
              
              {/* Image Upload */}
              <div className="grid gap-2">
                <Label>Contest Image (Optional)</Label>
                {form.imageUrl ? (
                  <div className="relative w-full h-40 rounded-lg overflow-hidden border border-white/10">
                    <img src={form.imageUrl} alt="Contest" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, imageUrl: "" }))}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-red-500/80 transition-colors"
                    >
                      <X className="size-3 text-white" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border border-dashed border-white/20 rounded-lg cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all">
                    {uploadingImage ? (
                      <><Loader2 className="size-6 animate-spin text-primary mb-2" /><span className="text-xs text-muted-foreground">Uploading...</span></>
                    ) : (
                      <><ImageIcon className="size-6 text-muted-foreground mb-2" /><span className="text-xs text-muted-foreground">Click to upload contest image</span></>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingImage}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
                    />
                  </label>
                )}
              </div>

              <div className="grid gap-2 mt-2 border-t border-white/10 pt-4">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(val) => setForm({ ...form, status: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.filter(o => o.value !== "ALL").map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={actionLoading === "save" || !form.title.trim()}>
                {actionLoading === "save" ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Save Contest
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminEngagementContests;
