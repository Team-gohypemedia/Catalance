import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import format from "date-fns/format";
import AdminLayout from "./AdminLayout";
import { AdminTopBar } from "./AdminTopBar";
import { useAuth } from "@/shared/context/AuthContext";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import ArrowRightLeft from "lucide-react/dist/esm/icons/arrow-right-left";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import Eye from "lucide-react/dist/esm/icons/eye";
import Mail from "lucide-react/dist/esm/icons/mail";
import Search from "lucide-react/dist/esm/icons/search";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import User from "lucide-react/dist/esm/icons/user";
import DisputeDetailsDialog from "./DisputeDetailsDialog";

const initialPmFormState = {
  fullName: "",
  email: "",
  password: "",
  phoneNumber: "",
  note: "",
};

const initialEditPmFormState = {
  fullName: "",
  email: "",
  phoneNumber: "",
  password: "",
  status: "ACTIVE",
};

const formatDate = (value) => {
  if (!value) return "N/A";
  try {
    return format(new Date(value), "MMM d, yyyy");
  } catch {
    return "N/A";
  }
};

const formatDateTime = (value) => {
  if (!value) return "N/A";
  try {
    return format(new Date(value), "MMM d, yyyy p");
  } catch {
    return "N/A";
  }
};

const formatHourRange = (startHour, endHour) => {
  const formatHour = (hour) => {
    if (!Number.isFinite(hour)) return "";
    const normalized = ((hour % 24) + 24) % 24;
    const suffix = normalized >= 12 ? "PM" : "AM";
    const displayHour = normalized % 12 || 12;
    return `${displayHour}:00 ${suffix}`;
  };

  const start = formatHour(startHour);
  const end = formatHour(endHour);
  if (!start && !end) return "Time not set";
  if (!end) return start;
  return `${start} - ${end}`;
};

const formatCurrency = (amount) => `INR ${(amount || 0).toLocaleString("en-IN")}`;

const toTitle = (value) => String(value || "").replaceAll("_", " ");

const getProfileSummary = (profileDetails) => {
  if (!profileDetails || typeof profileDetails !== "object") {
    return [];
  }

  const identity = profileDetails.identity && typeof profileDetails.identity === "object"
    ? profileDetails.identity
    : {};
  const professional = profileDetails.professional && typeof profileDetails.professional === "object"
    ? profileDetails.professional
    : {};
  const contact = profileDetails.contact && typeof profileDetails.contact === "object"
    ? profileDetails.contact
    : {};

  return [
    { label: "Headline", value: professional.headline || professional.title || null },
    { label: "Location", value: contact.city || contact.location || null },
    { label: "Experience", value: professional.experience || professional.experienceYears || null },
    { label: "Identity", value: identity.legalName || identity.name || null },
  ].filter((item) => item.value);
};

const StatusBadge = ({ value }) => (
  <Badge variant={String(value).toUpperCase() === "ACTIVE" ? "default" : "secondary"}>
    {toTitle(value)}
  </Badge>
);

const AdminDisputes = () => {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [projectManagers, setProjectManagers] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [selectedManagerDetails, setSelectedManagerDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [createPmOpen, setCreatePmOpen] = useState(false);
  const [creatingPm, setCreatingPm] = useState(false);
  const [pmForm, setPmForm] = useState(initialPmFormState);
  const [editPmOpen, setEditPmOpen] = useState(false);
  const [editingPm, setEditingPm] = useState(false);
  const [editPmForm, setEditPmForm] = useState(initialEditPmFormState);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [reassignProject, setReassignProject] = useState(null);
  const [reassignTargetId, setReassignTargetId] = useState("");
  const [reassigning, setReassigning] = useState(false);

  const loadProjectManagers = async () => {
    const res = await authFetch("/admin/users?role=PROJECT_MANAGER&limit=100");
    const data = await res.json();
    return data?.data?.users || [];
  };

  const loadDisputes = async () => {
    const res = await authFetch("/disputes");
    const data = await res.json();
    return data?.data || [];
  };

  const loadManagerDetails = async (managerId) => {
    const res = await authFetch(`/admin/users/${managerId}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || data?.error || "Failed to fetch project manager details.");
    }
    return data?.data || null;
  };

  const refreshPageData = async ({ keepSelection = true } = {}) => {
    setLoading(true);
    try {
      const [pmUsers, allDisputes] = await Promise.all([
        loadProjectManagers(),
        loadDisputes(),
      ]);
      setProjectManagers(pmUsers);
      setDisputes(allDisputes);

      if (keepSelection && selectedManagerId) {
        const stillExists = pmUsers.some((pm) => pm.id === selectedManagerId);
        if (stillExists) {
          await handleManagerSelect(selectedManagerId, { skipState: true });
        } else {
          setSelectedManagerId("");
          setSelectedManagerDetails(null);
        }
      }
    } catch (error) {
      console.error("Failed to refresh project manager dashboard:", error);
      toast.error("Failed to load Project Manager dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshPageData({ keepSelection: false });
  }, []);

  const handleManagerSelect = async (managerId, options = {}) => {
    const { skipState = false } = options;
    if (!skipState) {
      setSelectedManagerId(managerId);
    }

    setLoadingDetails(true);
    try {
      const details = await loadManagerDetails(managerId);
      setSelectedManagerDetails(details);
    } catch (error) {
      console.error("Failed to load project manager details:", error);
      toast.error(error?.message || "Failed to load Project Manager details.");
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredManagers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return projectManagers;
    return projectManagers.filter((pm) =>
      pm.fullName?.toLowerCase().includes(query) || pm.email?.toLowerCase().includes(query)
    );
  }, [projectManagers, search]);

  const selectedManager = selectedManagerDetails?.user || null;
  const selectedManagerStats = selectedManagerDetails?.stats || {};
  const profileSummary = getProfileSummary(selectedManager?.profileDetails);
  const assignedProjects = selectedManagerDetails?.projects || [];
  const managerDisputes = useMemo(
    () => disputes.filter((dispute) => dispute.manager?.id === selectedManagerId),
    [disputes, selectedManagerId]
  );
  const managerAppointments = selectedManagerDetails?.appointments || [];
  const managerReports = selectedManagerDetails?.reports || [];
  const profileRequests = selectedManagerDetails?.profileRequests || [];
  const managerNotifications = selectedManagerDetails?.notifications || [];
  const dashboardSnapshot = selectedManagerDetails?.dashboard || {};
  const dashboardProjects = dashboardSnapshot.projects || [];
  const reassignOptions = projectManagers.filter(
    (pm) => pm.id !== selectedManagerId && String(pm.status || "").toUpperCase() === "ACTIVE"
  );

  const updatePmField = (key, value) => {
    setPmForm((current) => ({ ...current, [key]: value }));
  };

  const resetPmForm = () => {
    setPmForm(initialPmFormState);
  };

  const resetEditPmForm = () => {
    setEditPmForm(initialEditPmFormState);
  };

  const openEditPmDialog = () => {
    if (!selectedManager) return;
    setEditPmForm({
      fullName: selectedManager.fullName || "",
      email: selectedManager.email || "",
      phoneNumber: selectedManager.phone || "",
      password: "",
      status: String(selectedManager.status || "ACTIVE").toUpperCase(),
    });
    setEditPmOpen(true);
  };

  const handleCreatePm = async () => {
    if (creatingPm) return;

    const payload = {
      fullName: pmForm.fullName.trim(),
      email: pmForm.email.trim().toLowerCase(),
      password: pmForm.password,
      phoneNumber: pmForm.phoneNumber.trim(),
    };

    if (!payload.fullName || !payload.email || !payload.password) {
      toast.error("Full name, email, and password are required.");
      return;
    }

    setCreatingPm(true);
    try {
      const res = await authFetch("/admin/project-managers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Failed to create Project Manager.");
      }

      const createdManager = data?.data || null;
      toast.success("Project Manager created successfully.");
      resetPmForm();
      setCreatePmOpen(false);
      await refreshPageData({ keepSelection: false });
      if (createdManager?.id) {
        await handleManagerSelect(createdManager.id);
      }
    } catch (error) {
      toast.error(error?.message || "Failed to create Project Manager.");
    } finally {
      setCreatingPm(false);
    }
  };

  const handleUpdateStatus = async (nextStatus) => {
    if (!selectedManagerId || !nextStatus || statusUpdating) return;

    setStatusUpdating(true);
    try {
      const res = await authFetch(`/admin/users/${selectedManagerId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Failed to update Project Manager status.");
      }

      toast.success(`Project Manager marked as ${toTitle(nextStatus)}.`);
      await refreshPageData();
    } catch (error) {
      toast.error(error?.message || "Failed to update Project Manager status.");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleSavePmChanges = async () => {
    if (!selectedManagerId || editingPm) return;

    const payload = {
      fullName: editPmForm.fullName.trim(),
      email: editPmForm.email.trim().toLowerCase(),
      phoneNumber: editPmForm.phoneNumber.trim(),
      status: String(editPmForm.status || "ACTIVE").toUpperCase(),
    };

    if (editPmForm.password) {
      payload.password = editPmForm.password;
    }

    if (!payload.fullName || !payload.email) {
      toast.error("Full name and email are required.");
      return;
    }

    setEditingPm(true);
    try {
      const res = await authFetch(`/admin/project-managers/${selectedManagerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Failed to update Project Manager.");
      }

      toast.success("Project Manager updated successfully.");
      setEditPmOpen(false);
      resetEditPmForm();
      await refreshPageData();
    } catch (error) {
      toast.error(error?.message || "Failed to update Project Manager.");
    } finally {
      setEditingPm(false);
    }
  };

  const openReassignDialog = (project) => {
    setReassignProject(project);
    setReassignTargetId(reassignOptions[0]?.id || "");
    setReassignOpen(true);
  };

  const handleReassignProject = async () => {
    if (!reassignProject?.id || !reassignTargetId || reassigning) {
      return;
    }

    setReassigning(true);
    try {
      const res = await authFetch(`/projects/${reassignProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerId: reassignTargetId }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Failed to reassign project.");
      }

      const nextManager = projectManagers.find((pm) => pm.id === reassignTargetId);
      toast.success(
        `Project reassigned to ${nextManager?.fullName || "the selected Project Manager"}.`
      );
      setReassignOpen(false);
      setReassignProject(null);
      setReassignTargetId("");
      await refreshPageData();
    } catch (error) {
      toast.error(error?.message || "Failed to reassign project.");
    } finally {
      setReassigning(false);
    }
  };

  const summaryCards = [
    { label: "Active Projects", value: selectedManagerStats.activeProjects || 0 },
    { label: "Completed Projects", value: selectedManagerStats.completedProjects || 0 },
    { label: "Open Disputes", value: selectedManagerStats.openDisputes || 0 },
    { label: "Upcoming Meetings", value: selectedManagerStats.upcomingMeetings || 0 },
    { label: "Reports Raised", value: selectedManagerStats.reportsRaised || 0 },
    { label: "Profile Requests", value: selectedManagerStats.profileUpdateRequests || 0 },
    { label: "Unread Notifications", value: selectedManagerStats.unreadNotifications || 0 },
  ];

  return (
    <AdminLayout>
      <div className="relative flex flex-col gap-6 p-6">
        <AdminTopBar label="Project Manager Control" />

        <div className="space-y-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Project Managers</h1>
              <p className="mt-2 text-muted-foreground">
                Full admin control for Project Managers, assigned work, disputes, and reassignment.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search project managers..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="button" onClick={() => setCreatePmOpen(true)} className="min-w-[190px]">
                Add Project Manager
              </Button>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <Card className="h-fit">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Project Manager List</CardTitle>
                    <CardDescription>{projectManagers.length} managers in admin control</CardDescription>
                  </div>
                  <Badge variant="secondary">{projectManagers.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">Loading managers...</div>
                ) : filteredManagers.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    No Project Managers found.
                  </div>
                ) : (
                  filteredManagers.map((pm) => {
                    const isSelected = selectedManagerId === pm.id;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => handleManagerSelect(pm.id)}
                        className={`w-full rounded-xl border p-4 text-left transition ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border bg-background hover:border-primary/30 hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{pm.fullName}</p>
                            <p className="truncate text-sm text-muted-foreground">{pm.email}</p>
                          </div>
                          <StatusBadge value={pm.status} />
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                          <span>Joined {formatDate(pm.createdAt)}</span>
                          <span>{pm.isVerified ? "Verified" : "Unverified"}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              {!selectedManagerId ? (
                <Card>
                  <CardContent className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-center">
                    <ShieldCheck className="h-10 w-10 text-muted-foreground/70" />
                    <div>
                      <p className="font-medium">Select a Project Manager</p>
                      <p className="text-sm text-muted-foreground">
                        Admin controls, workload, projects, meetings, disputes, and reassignment will appear here.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : loadingDetails ? (
                <Card>
                  <CardContent className="py-20 text-center text-sm text-muted-foreground">
                    Loading Project Manager details...
                  </CardContent>
                </Card>
              ) : selectedManager ? (
                <>
                  <Card>
                    <CardHeader className="pb-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <CardTitle className="text-2xl">{selectedManager.fullName}</CardTitle>
                            <StatusBadge value={selectedManager.status} />
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              {selectedManager.email}
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Role: {toTitle(selectedManager.role)}
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Joined: {formatDate(selectedManager.createdAt)}
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4" />
                              {selectedManager.isVerified ? "Verified" : "Not verified"}
                            </span>
                            {selectedManager.phone ? (
                              <span className="inline-flex items-center gap-2">
                                <Briefcase className="h-4 w-4" />
                                {selectedManager.phone}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={openEditPmDialog}
                          >
                            Edit PM
                          </Button>
                          {String(selectedManager.status || "").toUpperCase() === "ACTIVE" ? (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleUpdateStatus("SUSPENDED")}
                              disabled={statusUpdating}
                            >
                              {statusUpdating ? "Updating..." : "Suspend PM"}
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              onClick={() => handleUpdateStatus("ACTIVE")}
                              disabled={statusUpdating}
                            >
                              {statusUpdating ? "Updating..." : "Activate PM"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {summaryCards.map((card) => (
                        <div key={card.label} className="rounded-xl border bg-muted/20 p-4">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">{card.label}</p>
                          <p className="mt-2 text-2xl font-semibold">{card.value}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle>Profile Snapshot</CardTitle>
                        <CardDescription>Current PM profile data available to admin.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {profileSummary.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No structured Project Manager profile details have been submitted yet.
                          </p>
                        ) : (
                          profileSummary.map((item) => (
                            <div key={item.label} className="rounded-lg border p-3">
                              <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
                              <p className="mt-1 text-sm font-medium">{String(item.value)}</p>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle>Admin Signals</CardTitle>
                        <CardDescription>Items that need admin attention for this PM.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="rounded-lg border p-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Password</p>
                          <p className="mt-1 text-sm font-medium">Current password cannot be viewed</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Passwords are stored as secure hashes. Use Edit PM to set a new temporary password.
                          </p>
                        </div>
                        <div className="rounded-lg border p-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Latest Profile Request</p>
                          <p className="mt-1 text-sm font-medium">
                            {selectedManagerStats.latestProfileRequestStatus
                              ? toTitle(selectedManagerStats.latestProfileRequestStatus)
                              : "No request"}
                          </p>
                        </div>
                        <div className="rounded-lg border p-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Meetings Scheduled</p>
                          <p className="mt-1 text-sm font-medium">{managerAppointments.length}</p>
                        </div>
                        <div className="rounded-lg border p-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Reports Raised</p>
                          <p className="mt-1 text-sm font-medium">{managerReports.length}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle>PM Dashboard Snapshot</CardTitle>
                        <CardDescription>
                          The same top operational view the Project Manager works from.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {dashboardProjects.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No dashboard projects available for this PM.</p>
                        ) : (
                          dashboardProjects.slice(0, 6).map((project) => (
                            <div key={project.id} className="rounded-xl border p-4">
                              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold">{project.title}</p>
                                    <Badge variant="outline">{project.displayStatus || toTitle(project.status)}</Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Client: {project.owner?.fullName || "Unknown"}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Freelancer: {project.freelancer?.fullName || "Not assigned"}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/admin/projects/${project.id}`)}
                                >
                                  View Project
                                </Button>
                              </div>

                              <div className="mt-4 grid gap-3 md:grid-cols-3">
                                <div className="rounded-lg bg-muted/30 p-3">
                                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Chat Messages</p>
                                  <p className="mt-1 text-lg font-semibold">{project.chatMetrics?.totalMessages || 0}</p>
                                </div>
                                <div className="rounded-lg bg-muted/30 p-3">
                                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Last Sender</p>
                                  <p className="mt-1 text-sm font-medium">
                                    {project.chatMetrics?.lastMessageSender || "No activity"}
                                  </p>
                                </div>
                                <div className="rounded-lg bg-muted/30 p-3">
                                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Last Activity</p>
                                  <p className="mt-1 text-sm font-medium">
                                    {project.chatMetrics?.lastInteractionTime
                                      ? formatDateTime(project.chatMetrics.lastInteractionTime)
                                      : "No activity"}
                                  </p>
                                </div>
                              </div>

                              {project.chatMetrics?.lastMessagePreview ? (
                                <div className="mt-3 rounded-lg border border-dashed p-3">
                                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Latest Message</p>
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    {project.chatMetrics.lastMessagePreview}
                                  </p>
                                </div>
                              ) : null}
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle>Recent Notifications</CardTitle>
                        <CardDescription>
                          PM-side notification feed visible from admin.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {managerNotifications.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No notifications for this PM.</p>
                        ) : (
                          managerNotifications.map((notification) => (
                            <div key={notification.id} className="rounded-lg border p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-medium">{notification.title}</p>
                                  <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                                </div>
                                <Badge variant={notification.read ? "secondary" : "default"}>
                                  {notification.read ? "Read" : "Unread"}
                                </Badge>
                              </div>
                              <p className="mt-2 text-xs text-muted-foreground">
                                {formatDateTime(notification.createdAt)}
                              </p>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <CardTitle>Assigned Projects</CardTitle>
                          <CardDescription>
                            Admin can inspect each project and reassign it to another Project Manager.
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">{assignedProjects.length} assigned</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Project</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Budget</TableHead>
                            <TableHead>Spent</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {assignedProjects.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                No projects assigned to this Project Manager.
                              </TableCell>
                            </TableRow>
                          ) : (
                            assignedProjects.map((project) => (
                              <TableRow key={project.id}>
                                <TableCell className="font-medium">
                                <div className="space-y-1">
                                  <p>{project.title}</p>
                                  <p className="text-xs text-muted-foreground">Created {formatDate(project.createdAt)}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Freelancer: {project.freelancer?.fullName || "Not assigned"}
                                  </p>
                                </div>
                              </TableCell>
                                <TableCell>{project.owner?.fullName || "Unknown"}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{toTitle(project.status)}</Badge>
                                </TableCell>
                                <TableCell>{formatCurrency(project.budget)}</TableCell>
                                <TableCell>{formatCurrency(project.spent)}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => navigate(`/admin/projects/${project.id}`)}
                                    >
                                      View
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() => openReassignDialog(project)}
                                      disabled={reassignOptions.length === 0}
                                    >
                                      Reassign
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <div className="grid gap-6 xl:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle>Assigned Disputes</CardTitle>
                        <CardDescription>Disputes currently routed to this PM.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Project</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Raised By</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {managerDisputes.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                  No disputes assigned to this Project Manager.
                                </TableCell>
                              </TableRow>
                            ) : (
                              managerDisputes.map((dispute) => (
                                <TableRow key={dispute.id}>
                                  <TableCell>{dispute.project?.title || "Unknown Project"}</TableCell>
                                  <TableCell>{toTitle(dispute.status)}</TableCell>
                                  <TableCell>{dispute.raisedBy?.fullName || "Unknown"}</TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedDispute(dispute);
                                        setDetailsOpen(true);
                                      }}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle>Meetings And Reports</CardTitle>
                        <CardDescription>Recent PM-side operational activity.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        <div className="space-y-3">
                          <p className="text-sm font-semibold">Upcoming Meetings</p>
                          {managerAppointments.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No meetings scheduled.</p>
                          ) : (
                            managerAppointments.slice(0, 4).map((appointment) => (
                              <div key={appointment.id} className="rounded-lg border p-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-medium">{appointment.title || "Meeting"}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {formatDate(appointment.date)} • {formatHourRange(appointment.startHour, appointment.endHour)}
                                    </p>
                                    {appointment.project?.title ? (
                                      <p className="mt-1 text-xs text-muted-foreground">
                                        Project: {appointment.project.title}
                                      </p>
                                    ) : null}
                                  </div>
                                  <Badge variant="outline">{toTitle(appointment.status)}</Badge>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="space-y-3">
                          <p className="text-sm font-semibold">Reports Raised</p>
                          {managerReports.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No reports raised by this PM.</p>
                          ) : (
                            managerReports.slice(0, 4).map((report) => (
                              <div key={report.id} className="rounded-lg border p-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-medium">{report.project?.title || "Project report"}</p>
                                    <p className="text-sm text-muted-foreground">{report.reason}</p>
                                  </div>
                                  <Badge variant="outline">{toTitle(report.status)}</Badge>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle>Profile Update Requests</CardTitle>
                      <CardDescription>Requests submitted by this PM for admin approval.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Request ID</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Submitted</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {profileRequests.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                No profile requests from this PM.
                              </TableCell>
                            </TableRow>
                          ) : (
                            profileRequests.map((request) => (
                              <TableRow key={request.id}>
                                <TableCell className="font-mono text-xs">{request.id}</TableCell>
                                <TableCell>{toTitle(request.status)}</TableCell>
                                <TableCell>{formatDate(request.createdAt)}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="py-20 text-center text-sm text-muted-foreground">
                    Project Manager details are unavailable right now.
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        <DisputeDetailsDialog
          dispute={selectedDispute}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />

        <Dialog
          open={createPmOpen}
          onOpenChange={(open) => {
            setCreatePmOpen(open);
            if (!open && !creatingPm) {
              resetPmForm();
            }
          }}
        >
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Add Project Manager</DialogTitle>
              <DialogDescription>
                Create a new Project Manager account directly from the admin panel.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground" htmlFor="pm-full-name">
                  Full Name
                </label>
                <Input
                  id="pm-full-name"
                  value={pmForm.fullName}
                  onChange={(event) => updatePmField("fullName", event.target.value)}
                  placeholder="Project manager full name"
                  disabled={creatingPm}
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="pm-email">
                    Email
                  </label>
                  <Input
                    id="pm-email"
                    type="email"
                    value={pmForm.email}
                    onChange={(event) => updatePmField("email", event.target.value)}
                    placeholder="manager@catalance.com"
                    disabled={creatingPm}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="pm-phone">
                    Phone Number
                  </label>
                  <Input
                    id="pm-phone"
                    value={pmForm.phoneNumber}
                    onChange={(event) => updatePmField("phoneNumber", event.target.value)}
                    placeholder="+91 98765 43210"
                    disabled={creatingPm}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground" htmlFor="pm-password">
                  Temporary Password
                </label>
                <Input
                  id="pm-password"
                  type="password"
                  value={pmForm.password}
                  onChange={(event) => updatePmField("password", event.target.value)}
                  placeholder="At least 8 characters"
                  disabled={creatingPm}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground" htmlFor="pm-note">
                  Internal Note
                </label>
                <Textarea
                  id="pm-note"
                  value={pmForm.note}
                  onChange={(event) => updatePmField("note", event.target.value)}
                  placeholder="Optional note for admin use. This is not stored yet."
                  disabled={creatingPm}
                  className="min-h-24"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreatePmOpen(false)}
                disabled={creatingPm}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCreatePm}
                disabled={creatingPm}
              >
                {creatingPm ? "Creating..." : "Create Project Manager"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={editPmOpen}
          onOpenChange={(open) => {
            setEditPmOpen(open);
            if (!open && !editingPm) {
              resetEditPmForm();
            }
          }}
        >
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Edit Project Manager</DialogTitle>
              <DialogDescription>
                Update PM account details, status, and set a new temporary password if needed.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground" htmlFor="edit-pm-full-name">
                  Full Name
                </label>
                <Input
                  id="edit-pm-full-name"
                  value={editPmForm.fullName}
                  onChange={(event) => setEditPmForm((current) => ({ ...current, fullName: event.target.value }))}
                  placeholder="Project manager full name"
                  disabled={editingPm}
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="edit-pm-email">
                    Email
                  </label>
                  <Input
                    id="edit-pm-email"
                    type="email"
                    value={editPmForm.email}
                    onChange={(event) => setEditPmForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="manager@catalance.com"
                    disabled={editingPm}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="edit-pm-phone">
                    Phone Number
                  </label>
                  <Input
                    id="edit-pm-phone"
                    value={editPmForm.phoneNumber}
                    onChange={(event) => setEditPmForm((current) => ({ ...current, phoneNumber: event.target.value }))}
                    placeholder="+91 98765 43210"
                    disabled={editingPm}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground" htmlFor="edit-pm-status">
                  Account Status
                </label>
                <Select
                  value={editPmForm.status}
                  onValueChange={(value) => setEditPmForm((current) => ({ ...current, status: value }))}
                >
                  <SelectTrigger id="edit-pm-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground" htmlFor="edit-pm-password">
                  New Temporary Password
                </label>
                <Input
                  id="edit-pm-password"
                  type="text"
                  value={editPmForm.password}
                  onChange={(event) => setEditPmForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Leave blank to keep current password"
                  disabled={editingPm}
                />
                <p className="text-xs text-muted-foreground">
                  The current password cannot be shown. Enter a new one here only when you want to reset it.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditPmOpen(false)}
                disabled={editingPm}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSavePmChanges}
                disabled={editingPm}
              >
                {editingPm ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={reassignOpen}
          onOpenChange={(open) => {
            setReassignOpen(open);
            if (!open && !reassigning) {
              setReassignProject(null);
              setReassignTargetId("");
            }
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Reassign Project</DialogTitle>
              <DialogDescription>
                Move this project from the current Project Manager to another active Project Manager.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-lg border p-3">
                <p className="text-sm font-semibold">{reassignProject?.title || "Selected project"}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Current PM: {selectedManager?.fullName || "Unknown"}
                </p>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">New Project Manager</label>
                <Select value={reassignTargetId} onValueChange={setReassignTargetId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a Project Manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {reassignOptions.map((pm) => (
                      <SelectItem key={pm.id} value={pm.id}>
                        {pm.fullName} ({pm.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {reassignOptions.length === 0 ? (
                <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                  No other active Project Manager is available for reassignment.
                </div>
              ) : null}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setReassignOpen(false)}
                disabled={reassigning}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleReassignProject}
                disabled={reassigning || !reassignTargetId}
              >
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                {reassigning ? "Reassigning..." : "Reassign Project"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminDisputes;
