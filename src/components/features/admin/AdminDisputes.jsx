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

const initialProfileFormState = {
  fullName: "",
  contactEmail: "",
  contactPhone: "",
  skillsInput: "",
  expertiseSummary: "",
  yearsExperience: "",
  availabilityStatus: "",
  availabilityHours: "",
  availabilitySchedule: "",
  availabilityTimezone: "",
  location: "",
  identityType: "",
  identityNumber: "",
  identityDocumentUrl: "",
};

const buildProfileFormState = (manager) => {
  const details = manager?.profileDetails && typeof manager.profileDetails === "object"
    ? manager.profileDetails
    : {};
  const availability = details.availability && typeof details.availability === "object" ? details.availability : {};
  const identification = details.identification && typeof details.identification === "object" ? details.identification : {};
  const identity = details.identity && typeof details.identity === "object" ? details.identity : {};
  const skills = Array.isArray(details.skills) ? details.skills : [];

  return {
    fullName: manager?.fullName || "",
    contactEmail: manager?.email || "",
    contactPhone: manager?.phone || "",
    skillsInput: skills.join(", "),
    expertiseSummary: details.expertise || identity.professionalSummary || "",
    yearsExperience: String(details.yearsOfExperience || details?.experience?.years || ""),
    availabilityStatus: availability.status || "",
    availabilityHours: availability.hoursPerWeek || "",
    availabilitySchedule: availability.workingSchedule || "",
    availabilityTimezone: availability.timezone || "",
    location: identity.location || "",
    identityType: identification.type || "",
    identityNumber: identification.number || "",
    identityDocumentUrl: identification.documentUrl || "",
  };
};

const buildProfilePayload = (profileForm) => {
  const skills = String(profileForm.skillsInput || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const years = Number(profileForm.yearsExperience || 0);

  return {
    skills,
    expertise: profileForm.expertiseSummary.trim(),
    yearsOfExperience: Number.isFinite(years) ? years : 0,
    experience: {
      years: Number.isFinite(years) ? years : 0,
    },
    availability: {
      status: profileForm.availabilityStatus.trim(),
      hoursPerWeek: profileForm.availabilityHours.trim(),
      workingSchedule: profileForm.availabilitySchedule.trim(),
      timezone: profileForm.availabilityTimezone.trim(),
    },
    identification: {
      type: profileForm.identityType.trim(),
      number: profileForm.identityNumber.trim(),
      documentUrl: profileForm.identityDocumentUrl.trim(),
    },
    identity: {
      professionalTitle: "Project Manager",
      professionalSummary: profileForm.expertiseSummary.trim(),
      location: profileForm.location.trim(),
    },
  };
};

const initialMeetingFormState = {
  projectId: "",
  title: "Project Sync",
  startsAt: "",
  endsAt: "",
  participantScope: "BOTH",
  platform: "INTERNAL",
  notes: "",
};

const initialWorkspaceState = {
  details: null,
  messages: [],
  conversation: null,
  conversations: [],
};

const toLocalDateTimeInputValue = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
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
  const [profileOpen, setProfileOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState(initialProfileFormState);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [savingMeeting, setSavingMeeting] = useState(false);
  const [meetingForm, setMeetingForm] = useState(initialMeetingFormState);
  const [editingMeetingId, setEditingMeetingId] = useState("");
  const [notificationSavingId, setNotificationSavingId] = useState("");
  const [markingAllNotificationsRead, setMarkingAllNotificationsRead] = useState(false);
  const [reportSavingId, setReportSavingId] = useState("");
  const [reportDrafts, setReportDrafts] = useState({});
  const [projectActionOpen, setProjectActionOpen] = useState(false);
  const [activeProjectAction, setActiveProjectAction] = useState(null);
  const [projectActionSaving, setProjectActionSaving] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState("2");
  const [handoverForm, setHandoverForm] = useState({
    handoverConfirmed: false,
    deliverablesConfirmed: false,
    finalFilesDelivered: false,
    receiptConfirmed: false,
    noIssuesConfirmed: false,
  });
  const [reassignOpen, setReassignOpen] = useState(false);
  const [reassignProject, setReassignProject] = useState(null);
  const [reassignTargetId, setReassignTargetId] = useState("");
  const [reassigning, setReassigning] = useState(false);
  const [selectedWorkspaceProjectId, setSelectedWorkspaceProjectId] = useState("");
  const [workspaceData, setWorkspaceData] = useState(initialWorkspaceState);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceComposer, setWorkspaceComposer] = useState("");
  const [workspaceSending, setWorkspaceSending] = useState(false);

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

  const loadProjectWorkspace = async (managerId, projectId) => {
    const [detailsRes, messagesRes] = await Promise.all([
      authFetch(`/admin/project-managers/${managerId}/projects/${projectId}/details`),
      authFetch(`/admin/project-managers/${managerId}/projects/${projectId}/messages`),
    ]);
    const [detailsData, messagesData] = await Promise.all([
      detailsRes.json().catch(() => null),
      messagesRes.json().catch(() => null),
    ]);

    if (!detailsRes.ok) {
      throw new Error(detailsData?.message || detailsData?.error || "Failed to fetch project workspace.");
    }
    if (!messagesRes.ok) {
      throw new Error(messagesData?.message || messagesData?.error || "Failed to fetch project messages.");
    }

    return {
      details: detailsData?.data || null,
      messages: messagesData?.data?.messages || [],
      conversation: messagesData?.data?.conversation || null,
      conversations: messagesData?.data?.conversations || [],
    };
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
  const workspaceProject = workspaceData?.details?.project || null;
  const workspaceMessages = workspaceData?.messages || [];
  const workspaceClient = workspaceData?.details?.clientProfile || null;
  const workspaceFreelancer = workspaceData?.details?.freelancerProfile || null;
  const workspaceMilestones = workspaceData?.details?.milestones || [];
  const workspaceAppointments = workspaceData?.details?.appointments || [];
  const workspaceNotifications = workspaceData?.details?.notifications || [];
  const workspaceDisputes = workspaceData?.details?.disputes || [];
  const reassignOptions = projectManagers.filter(
    (pm) => pm.id !== selectedManagerId && String(pm.status || "").toUpperCase() === "ACTIVE"
  );

  useEffect(() => {
    if (!selectedManagerId) {
      setSelectedWorkspaceProjectId("");
      setWorkspaceData(initialWorkspaceState);
      return;
    }

    if (!assignedProjects.length) {
      setSelectedWorkspaceProjectId("");
      setWorkspaceData(initialWorkspaceState);
      return;
    }

    const nextProjectId = assignedProjects.some((project) => project.id === selectedWorkspaceProjectId)
      ? selectedWorkspaceProjectId
      : assignedProjects[0]?.id || "";

    if (!nextProjectId) {
      setWorkspaceData(initialWorkspaceState);
      return;
    }

    let active = true;
    if (nextProjectId !== selectedWorkspaceProjectId) {
      setSelectedWorkspaceProjectId(nextProjectId);
    }
    setWorkspaceLoading(true);

    loadProjectWorkspace(selectedManagerId, nextProjectId)
      .then((payload) => {
        if (!active) return;
        setWorkspaceData(payload);
      })
      .catch((error) => {
        if (!active) return;
        console.error("Failed to load PM project workspace:", error);
        toast.error(error?.message || "Failed to load PM project workspace.");
        setWorkspaceData(initialWorkspaceState);
      })
      .finally(() => {
        if (!active) return;
        setWorkspaceLoading(false);
      });

    return () => {
      active = false;
    };
  }, [assignedProjects, selectedManagerId, selectedWorkspaceProjectId]);

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

  const openProfileDialog = () => {
    if (!selectedManager) return;
    setProfileForm(buildProfileFormState(selectedManager));
    setProfileOpen(true);
  };

  const openCreateMeetingDialog = (projectId = "") => {
    const now = new Date();
    const startsAt = new Date(now.getTime() + 60 * 60 * 1000);
    const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);
    setEditingMeetingId("");
    setMeetingForm({
      projectId: projectId || assignedProjects[0]?.id || "",
      title: "Project Sync",
      startsAt: toLocalDateTimeInputValue(startsAt),
      endsAt: toLocalDateTimeInputValue(endsAt),
      participantScope: "BOTH",
      platform: "INTERNAL",
      notes: "",
    });
    setMeetingOpen(true);
  };

  const openEditMeetingDialog = (meeting) => {
    const baseDate = meeting?.date ? new Date(meeting.date) : new Date();
    const startDate = new Date(baseDate);
    startDate.setHours(Number(meeting?.startHour || 0), 0, 0, 0);
    const endDate = new Date(baseDate);
    endDate.setHours(Number(meeting?.endHour || Number(meeting?.startHour || 0) + 1), 0, 0, 0);
    setEditingMeetingId(meeting.id);
    setMeetingForm({
      projectId: meeting.project?.id || "",
      title: meeting.title || "Project Sync",
      startsAt: toLocalDateTimeInputValue(startDate),
      endsAt: toLocalDateTimeInputValue(endDate),
      participantScope: "BOTH",
      platform: "INTERNAL",
      notes: "",
    });
    setMeetingOpen(true);
  };

  const openProjectActionDialog = (project) => {
    setActiveProjectAction(project);
    setSelectedPhase("2");
    setHandoverForm({
      handoverConfirmed: false,
      deliverablesConfirmed: false,
      finalFilesDelivered: false,
      receiptConfirmed: false,
      noIssuesConfirmed: false,
    });
    setProjectActionOpen(true);
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

  const handleSaveProfile = async () => {
    if (!selectedManagerId || savingProfile) return;

    setSavingProfile(true);
    try {
      const basicRes = await authFetch(`/admin/project-managers/${selectedManagerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: profileForm.fullName.trim(),
          email: profileForm.contactEmail.trim().toLowerCase(),
          phoneNumber: profileForm.contactPhone.trim(),
        }),
      });
      const basicData = await basicRes.json().catch(() => null);
      if (!basicRes.ok) {
        throw new Error(basicData?.message || basicData?.error || "Failed to update PM basics.");
      }

      const profileRes = await authFetch(`/admin/project-managers/${selectedManagerId}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileDetails: buildProfilePayload(profileForm),
        }),
      });
      const profileData = await profileRes.json().catch(() => null);
      if (!profileRes.ok) {
        throw new Error(profileData?.message || profileData?.error || "Failed to update PM profile.");
      }

      toast.success("Project Manager profile updated.");
      setProfileOpen(false);
      await refreshPageData();
    } catch (error) {
      toast.error(error?.message || "Failed to update Project Manager profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveMeeting = async () => {
    if (!selectedManagerId || savingMeeting) return;

    setSavingMeeting(true);
    try {
      const payload = {
        projectId: meetingForm.projectId,
        title: meetingForm.title.trim(),
        startsAt: new Date(meetingForm.startsAt).toISOString(),
        endsAt: new Date(meetingForm.endsAt).toISOString(),
        participantScope: meetingForm.participantScope,
        platform: meetingForm.platform,
        notes: meetingForm.notes.trim(),
      };

      const path = editingMeetingId
        ? `/admin/project-managers/${selectedManagerId}/meetings/${editingMeetingId}`
        : `/admin/project-managers/${selectedManagerId}/meetings`;
      const method = editingMeetingId ? "PATCH" : "POST";

      const res = await authFetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Failed to save meeting.");
      }

      toast.success(editingMeetingId ? "Meeting updated." : "Meeting created.");
      setMeetingOpen(false);
      setEditingMeetingId("");
      await refreshPageData();
    } catch (error) {
      toast.error(error?.message || "Failed to save meeting.");
    } finally {
      setSavingMeeting(false);
    }
  };

  const handleMeetingStatus = async (meetingId, status) => {
    if (!selectedManagerId || !meetingId) return;
    try {
      const res = await authFetch(`/admin/project-managers/${selectedManagerId}/meetings/${meetingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Failed to update meeting.");
      }
      toast.success(`Meeting marked ${toTitle(status)}.`);
      await refreshPageData();
    } catch (error) {
      toast.error(error?.message || "Failed to update meeting.");
    }
  };

  const handleNotificationReadState = async (notificationId, read) => {
    if (!selectedManagerId || !notificationId) return;
    setNotificationSavingId(notificationId);
    try {
      const res = await authFetch(`/admin/project-managers/${selectedManagerId}/notifications/${notificationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Failed to update notification.");
      }
      await refreshPageData();
    } catch (error) {
      toast.error(error?.message || "Failed to update notification.");
    } finally {
      setNotificationSavingId("");
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    if (!selectedManagerId) return;
    setMarkingAllNotificationsRead(true);
    try {
      const res = await authFetch(`/admin/project-managers/${selectedManagerId}/notifications/mark-all-read`, {
        method: "POST",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Failed to mark notifications.");
      }
      toast.success("All notifications marked as read.");
      await refreshPageData();
    } catch (error) {
      toast.error(error?.message || "Failed to update notifications.");
    } finally {
      setMarkingAllNotificationsRead(false);
    }
  };

  const handleReportDraftChange = (reportId, field, value) => {
    setReportDrafts((current) => ({
      ...current,
      [reportId]: {
        status: current[reportId]?.status || "OPEN",
        notes: current[reportId]?.notes || "",
        [field]: value,
      },
    }));
  };

  const handleSaveReport = async (report) => {
    if (!selectedManagerId || !report?.id) return;
    const draft = reportDrafts[report.id] || {
      status: report.status || "OPEN",
      notes: "",
    };

    setReportSavingId(report.id);
    try {
      const res = await authFetch(`/admin/project-managers/${selectedManagerId}/reports/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Failed to update report.");
      }
      toast.success("Report updated.");
      await refreshPageData();
    } catch (error) {
      toast.error(error?.message || "Failed to update report.");
    } finally {
      setReportSavingId("");
    }
  };

  const handleApproveMilestone = async () => {
    if (!selectedManagerId || !activeProjectAction?.id || projectActionSaving) return;
    setProjectActionSaving(true);
    try {
      const res = await authFetch(
        `/admin/project-managers/${selectedManagerId}/projects/${activeProjectAction.id}/milestone-approval`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phase: Number(selectedPhase), pmNote: "Approved from admin PM control" }),
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Failed to approve milestone.");
      }
      toast.success(`Phase ${selectedPhase} approved.`);
      await refreshPageData();
    } catch (error) {
      toast.error(error?.message || "Failed to approve milestone.");
    } finally {
      setProjectActionSaving(false);
    }
  };

  const handleFinalizeHandover = async () => {
    if (!selectedManagerId || !activeProjectAction?.id || projectActionSaving) return;
    setProjectActionSaving(true);
    try {
      const res = await authFetch(
        `/admin/project-managers/${selectedManagerId}/projects/${activeProjectAction.id}/finalize-handover`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(handoverForm),
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Failed to finalize handover.");
      }
      toast.success("Handover updated.");
      await refreshPageData();
    } catch (error) {
      toast.error(error?.message || "Failed to finalize handover.");
    } finally {
      setProjectActionSaving(false);
    }
  };

  const handleWorkspaceProjectChange = (projectId) => {
    setSelectedWorkspaceProjectId(projectId);
    setWorkspaceComposer("");
  };

  const handleWorkspaceSendMessage = async () => {
    if (!selectedManagerId || !selectedWorkspaceProjectId || !workspaceComposer.trim() || workspaceSending) return;

    setWorkspaceSending(true);
    try {
      const res = await authFetch(
        `/admin/project-managers/${selectedManagerId}/projects/${selectedWorkspaceProjectId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: workspaceComposer.trim() }),
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Failed to send message.");
      }

      setWorkspaceComposer("");
      const refreshed = await loadProjectWorkspace(selectedManagerId, selectedWorkspaceProjectId);
      setWorkspaceData(refreshed);
      toast.success("Message sent to the project conversation.");
    } catch (error) {
      toast.error(error?.message || "Failed to send message.");
    } finally {
      setWorkspaceSending(false);
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
                            onClick={openProfileDialog}
                          >
                            Edit Profile
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => openCreateMeetingDialog()}
                          >
                            Schedule Meeting
                          </Button>
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
                                       onClick={() => handleWorkspaceProjectChange(project.id)}
                                     >
                                       Open Workspace
                                     </Button>
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
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openProjectActionDialog(project)}
                                    >
                                      PM Actions
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

                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <CardTitle>PM Project Workspace Mirror</CardTitle>
                          <CardDescription>
                            Admin can inspect the PM-style project workspace, including milestones, handover, meetings, notifications, and messages.
                          </CardDescription>
                        </div>
                        <div className="w-full lg:w-80">
                          <Select value={selectedWorkspaceProjectId} onValueChange={handleWorkspaceProjectChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select project workspace" />
                            </SelectTrigger>
                            <SelectContent>
                              {assignedProjects.map((project) => (
                                <SelectItem key={project.id} value={project.id}>
                                  {project.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {!assignedProjects.length ? (
                        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                          No assigned project workspace is available for this PM.
                        </div>
                      ) : workspaceLoading ? (
                        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                          Loading PM project workspace...
                        </div>
                      ) : workspaceProject ? (
                        <>
                          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                            <div className="rounded-xl border p-4">
                              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-semibold">{workspaceProject.title}</h3>
                                    <Badge variant="outline">{workspaceProject.displayStatus || toTitle(workspaceProject.status)}</Badge>
                                  </div>
                                  <p className="mt-2 text-sm text-muted-foreground">
                                    {workspaceProject.description || "No project description available."}
                                  </p>
                                </div>
                                <Button type="button" variant="outline" onClick={() => navigate(`/admin/projects/${workspaceProject.id}`)}>
                                  Open Admin Project
                                </Button>
                              </div>
                              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                <div className="rounded-lg bg-muted/30 p-3">
                                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Budget</p>
                                  <p className="mt-1 text-lg font-semibold">{formatCurrency(workspaceProject.budget)}</p>
                                </div>
                                <div className="rounded-lg bg-muted/30 p-3">
                                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Spent</p>
                                  <p className="mt-1 text-lg font-semibold">{formatCurrency(workspaceProject.spent)}</p>
                                </div>
                                <div className="rounded-lg bg-muted/30 p-3">
                                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Progress</p>
                                  <p className="mt-1 text-lg font-semibold">{Number(workspaceProject.progress || 0)}%</p>
                                </div>
                                <div className="rounded-lg bg-muted/30 p-3">
                                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Messages</p>
                                  <p className="mt-1 text-lg font-semibold">{workspaceMessages.length}</p>
                                </div>
                              </div>
                            </div>

                            <div className="rounded-xl border p-4">
                              <p className="text-sm font-semibold">Participants</p>
                              <div className="mt-3 space-y-3">
                                <div className="rounded-lg bg-muted/30 p-3">
                                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Client</p>
                                  <p className="mt-1 font-medium">{workspaceClient?.clientName || "Unknown client"}</p>
                                  <p className="text-sm text-muted-foreground">{workspaceClient?.email || "No email"}</p>
                                </div>
                                <div className="rounded-lg bg-muted/30 p-3">
                                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Freelancer</p>
                                  <p className="mt-1 font-medium">{workspaceFreelancer?.freelancerName || "Not assigned"}</p>
                                  <p className="text-sm text-muted-foreground">{workspaceFreelancer?.email || "No email"}</p>
                                  {Array.isArray(workspaceFreelancer?.services) && workspaceFreelancer.services.length ? (
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      Services: {workspaceFreelancer.services.slice(0, 3).join(", ")}
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid gap-6 xl:grid-cols-2">
                            <div className="rounded-xl border p-4">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold">Milestones And Handover</p>
                                <Button type="button" variant="outline" size="sm" onClick={() => openProjectActionDialog(workspaceProject)}>
                                  Manage PM Actions
                                </Button>
                              </div>
                              <div className="mt-3 space-y-3">
                                {workspaceMilestones.map((milestone) => (
                                  <div key={milestone.phase} className="rounded-lg border p-3">
                                    <div className="flex items-center justify-between gap-3">
                                      <div>
                                        <p className="font-medium">{milestone.title}</p>
                                        <p className="text-xs text-muted-foreground">{milestone.validationNotes}</p>
                                      </div>
                                      <Badge variant="outline">{milestone.status}</Badge>
                                    </div>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                      Phase {milestone.phase} · {milestone.percentage}% · {formatCurrency(milestone.amount)}
                                    </p>
                                  </div>
                                ))}
                                <div className="rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground">
                                  Handover:
                                  {" "}
                                  {[
                                    workspaceData?.details?.handoverChecklist?.handoverConfirmed ? "source code" : null,
                                    workspaceData?.details?.handoverChecklist?.deliverablesConfirmed ? "docs" : null,
                                    workspaceData?.details?.handoverChecklist?.receiptConfirmed ? "credentials" : null,
                                    workspaceData?.details?.handoverChecklist?.noIssuesConfirmed ? "no issues" : null,
                                  ].filter(Boolean).join(", ") || "No final handover confirmations yet."}
                                </div>
                              </div>
                            </div>

                            <div className="rounded-xl border p-4">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold">Meetings And Notifications</p>
                                <Button type="button" variant="outline" size="sm" onClick={() => openCreateMeetingDialog(workspaceProject.id)}>
                                  Schedule Meeting
                                </Button>
                              </div>
                              <div className="mt-3 space-y-3">
                                <div>
                                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Meetings</p>
                                  <div className="mt-2 space-y-2">
                                    {workspaceAppointments.length === 0 ? (
                                      <p className="text-sm text-muted-foreground">No meetings scheduled for this project.</p>
                                    ) : (
                                      workspaceAppointments.slice(0, 4).map((appointment) => (
                                        <div key={appointment.id} className="rounded-lg border p-3">
                                          <div className="flex items-start justify-between gap-3">
                                            <div>
                                              <p className="font-medium">{appointment.title || "Meeting"}</p>
                                              <p className="text-sm text-muted-foreground">
                                                {formatDate(appointment.date)} · {formatHourRange(appointment.startHour, appointment.endHour)}
                                              </p>
                                            </div>
                                            <Badge variant="outline">{toTitle(appointment.status)}</Badge>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Project Notifications</p>
                                  <div className="mt-2 space-y-2">
                                    {workspaceNotifications.length === 0 ? (
                                      <p className="text-sm text-muted-foreground">No project-specific notifications for this PM.</p>
                                    ) : (
                                      workspaceNotifications.slice(0, 4).map((notification) => (
                                        <div key={notification.id} className="rounded-lg border p-3">
                                          <div className="flex items-start justify-between gap-3">
                                            <div>
                                              <p className="font-medium">{notification.title}</p>
                                              <p className="text-sm text-muted-foreground">{notification.message}</p>
                                            </div>
                                            <Badge variant={notification.read ? "secondary" : "default"}>
                                              {notification.read ? "Read" : "Unread"}
                                            </Badge>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
                            <div className="rounded-xl border p-4">
                              <p className="text-sm font-semibold">Disputes In This Project</p>
                              <div className="mt-3 space-y-2">
                                {workspaceDisputes.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">No disputes raised on this project.</p>
                                ) : (
                                  workspaceDisputes.map((dispute) => (
                                    <div key={dispute.id} className="rounded-lg border p-3">
                                      <div className="flex items-center justify-between gap-3">
                                        <p className="font-medium">{toTitle(dispute.status)}</p>
                                        <p className="text-xs text-muted-foreground">{formatDate(dispute.createdAt)}</p>
                                      </div>
                                      <p className="mt-2 text-sm text-muted-foreground">{dispute.description || "No dispute description."}</p>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>

                            <div className="rounded-xl border p-4">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold">Project Conversation</p>
                                <Badge variant="secondary">
                                  {workspaceData?.conversation?.service ? "Live thread" : "No thread yet"}
                                </Badge>
                              </div>
                              <div className="mt-3 max-h-[360px] space-y-3 overflow-y-auto pr-1">
                                {workspaceMessages.length === 0 ? (
                                  <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                                    No messages yet for this project.
                                  </div>
                                ) : (
                                  workspaceMessages.map((message) => (
                                    <div key={message.id} className="rounded-lg border p-3">
                                      <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm font-medium">{message.senderLabel || toTitle(message.senderRole)}</p>
                                        <p className="text-xs text-muted-foreground">{formatDateTime(message.createdAt)}</p>
                                      </div>
                                      <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{message.content}</p>
                                    </div>
                                  ))
                                )}
                              </div>
                              <div className="mt-4 space-y-3">
                                <Textarea
                                  value={workspaceComposer}
                                  onChange={(event) => setWorkspaceComposer(event.target.value)}
                                  placeholder="Send an admin message into this PM project conversation"
                                  className="min-h-24"
                                />
                                <div className="flex justify-end">
                                  <Button type="button" onClick={handleWorkspaceSendMessage} disabled={workspaceSending || !workspaceComposer.trim()}>
                                    {workspaceSending ? "Sending..." : "Send Message"}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                          Project workspace data is unavailable right now.
                        </div>
                      )}
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
                                  <div className="flex flex-col items-end gap-2">
                                    <Badge variant="outline">{toTitle(appointment.status)}</Badge>
                                    <div className="flex gap-2">
                                      <Button type="button" variant="outline" size="sm" onClick={() => openEditMeetingDialog(appointment)}>
                                        Reschedule
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleMeetingStatus(appointment.id, "CANCELLED")}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
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
                                <div className="mt-3 grid gap-3 md:grid-cols-[180px_minmax(0,1fr)_auto]">
                                  <Select
                                    value={reportDrafts[report.id]?.status || report.status || "OPEN"}
                                    onValueChange={(value) => handleReportDraftChange(report.id, "status", value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="OPEN">Open</SelectItem>
                                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                      <SelectItem value="RESOLVED">Resolved</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    value={reportDrafts[report.id]?.notes || ""}
                                    onChange={(event) => handleReportDraftChange(report.id, "notes", event.target.value)}
                                    placeholder="Admin review note"
                                  />
                                  <Button
                                    type="button"
                                    onClick={() => handleSaveReport(report)}
                                    disabled={reportSavingId === report.id}
                                  >
                                    {reportSavingId === report.id ? "Saving..." : "Save"}
                                  </Button>
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
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <CardTitle>Profile Update Requests</CardTitle>
                          <CardDescription>Requests submitted by this PM for admin approval.</CardDescription>
                        </div>
                       </div>
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

                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <CardTitle>Notification Control</CardTitle>
                          <CardDescription>Admin can manage PM notification state directly.</CardDescription>
                        </div>
                        <Button type="button" variant="outline" onClick={handleMarkAllNotificationsRead} disabled={markingAllNotificationsRead}>
                          {markingAllNotificationsRead ? "Updating..." : "Mark All Notifications Read"}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {managerNotifications.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No notifications for this PM.</p>
                      ) : (
                        managerNotifications.slice(0, 8).map((notification) => (
                          <div key={notification.id} className="rounded-lg border p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-medium">{notification.title}</p>
                                <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <Badge variant={notification.read ? "secondary" : "default"}>
                                  {notification.read ? "Read" : "Unread"}
                                </Badge>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={notificationSavingId === notification.id}
                                  onClick={() => handleNotificationReadState(notification.id, !notification.read)}
                                >
                                  {notificationSavingId === notification.id
                                    ? "Saving..."
                                    : notification.read
                                      ? "Mark Unread"
                                      : "Mark Read"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
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
          open={profileOpen}
          onOpenChange={(open) => {
            setProfileOpen(open);
            if (!open && !savingProfile) {
              setProfileForm(initialProfileFormState);
            }
          }}
        >
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Project Manager Profile</DialogTitle>
              <DialogDescription>Edit the PM onboarding/profile data visible in the PM workspace.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid gap-4 md:grid-cols-2">
                <Input value={profileForm.fullName} onChange={(e) => setProfileForm((c) => ({ ...c, fullName: e.target.value }))} placeholder="Full name" />
                <Input value={profileForm.contactEmail} onChange={(e) => setProfileForm((c) => ({ ...c, contactEmail: e.target.value }))} placeholder="Email" />
                <Input value={profileForm.contactPhone} onChange={(e) => setProfileForm((c) => ({ ...c, contactPhone: e.target.value }))} placeholder="Phone" />
                <Input value={profileForm.location} onChange={(e) => setProfileForm((c) => ({ ...c, location: e.target.value }))} placeholder="Location" />
                <Input value={profileForm.yearsExperience} onChange={(e) => setProfileForm((c) => ({ ...c, yearsExperience: e.target.value }))} placeholder="Years of experience" />
                <Input value={profileForm.skillsInput} onChange={(e) => setProfileForm((c) => ({ ...c, skillsInput: e.target.value }))} placeholder="Skills comma separated" />
              </div>
              <Textarea value={profileForm.expertiseSummary} onChange={(e) => setProfileForm((c) => ({ ...c, expertiseSummary: e.target.value }))} placeholder="Expertise summary" className="min-h-24" />
              <div className="grid gap-4 md:grid-cols-2">
                <Input value={profileForm.availabilityStatus} onChange={(e) => setProfileForm((c) => ({ ...c, availabilityStatus: e.target.value }))} placeholder="Availability status" />
                <Input value={profileForm.availabilityHours} onChange={(e) => setProfileForm((c) => ({ ...c, availabilityHours: e.target.value }))} placeholder="Hours per week" />
                <Input value={profileForm.availabilitySchedule} onChange={(e) => setProfileForm((c) => ({ ...c, availabilitySchedule: e.target.value }))} placeholder="Working schedule" />
                <Input value={profileForm.availabilityTimezone} onChange={(e) => setProfileForm((c) => ({ ...c, availabilityTimezone: e.target.value }))} placeholder="Timezone" />
                <Input value={profileForm.identityType} onChange={(e) => setProfileForm((c) => ({ ...c, identityType: e.target.value }))} placeholder="Identity type" />
                <Input value={profileForm.identityNumber} onChange={(e) => setProfileForm((c) => ({ ...c, identityNumber: e.target.value }))} placeholder="Identity number" />
              </div>
              <Input value={profileForm.identityDocumentUrl} onChange={(e) => setProfileForm((c) => ({ ...c, identityDocumentUrl: e.target.value }))} placeholder="Identity document URL" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setProfileOpen(false)} disabled={savingProfile}>Cancel</Button>
              <Button type="button" onClick={handleSaveProfile} disabled={savingProfile}>{savingProfile ? "Saving..." : "Save Profile"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={meetingOpen}
          onOpenChange={(open) => {
            setMeetingOpen(open);
            if (!open && !savingMeeting) {
              setEditingMeetingId("");
              setMeetingForm(initialMeetingFormState);
            }
          }}
        >
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingMeetingId ? "Reschedule Meeting" : "Create Meeting"}</DialogTitle>
              <DialogDescription>Manage PM meetings directly from the admin dashboard.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <Select value={meetingForm.projectId} onValueChange={(value) => setMeetingForm((c) => ({ ...c, projectId: value }))}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {assignedProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>{project.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="grid gap-4 md:grid-cols-2">
                <Input value={meetingForm.title} onChange={(e) => setMeetingForm((c) => ({ ...c, title: e.target.value }))} placeholder="Meeting title" />
                <Select value={meetingForm.participantScope} onValueChange={(value) => setMeetingForm((c) => ({ ...c, participantScope: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLIENT">Client</SelectItem>
                    <SelectItem value="FREELANCER">Freelancer</SelectItem>
                    <SelectItem value="BOTH">Both</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="datetime-local" value={meetingForm.startsAt} onChange={(e) => setMeetingForm((c) => ({ ...c, startsAt: e.target.value }))} />
                <Input type="datetime-local" value={meetingForm.endsAt} onChange={(e) => setMeetingForm((c) => ({ ...c, endsAt: e.target.value }))} />
              </div>
              <Select value={meetingForm.platform} onValueChange={(value) => setMeetingForm((c) => ({ ...c, platform: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTERNAL">Internal</SelectItem>
                  <SelectItem value="ZOOM">Zoom</SelectItem>
                  <SelectItem value="GOOGLE_MEET">Google Meet</SelectItem>
                </SelectContent>
              </Select>
              <Textarea value={meetingForm.notes} onChange={(e) => setMeetingForm((c) => ({ ...c, notes: e.target.value }))} placeholder="Meeting notes" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setMeetingOpen(false)} disabled={savingMeeting}>Cancel</Button>
              <Button type="button" onClick={handleSaveMeeting} disabled={savingMeeting || !meetingForm.projectId}>
                {savingMeeting ? "Saving..." : editingMeetingId ? "Update Meeting" : "Create Meeting"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={projectActionOpen}
          onOpenChange={(open) => {
            setProjectActionOpen(open);
            if (!open && !projectActionSaving) {
              setActiveProjectAction(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Project Manager Actions</DialogTitle>
              <DialogDescription>
                Approve milestones and finalize handover for {activeProjectAction?.title || "the selected project"}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-5">
              <div className="rounded-lg border p-4">
                <p className="text-sm font-semibold">Milestone Approval</p>
                <div className="mt-3 flex gap-3">
                  <Select value={selectedPhase} onValueChange={setSelectedPhase}>
                    <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">Phase 2</SelectItem>
                      <SelectItem value="3">Phase 3</SelectItem>
                      <SelectItem value="4">Phase 4</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={handleApproveMilestone} disabled={projectActionSaving}>
                    {projectActionSaving ? "Saving..." : "Approve Phase"}
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-sm font-semibold">Handover Checklist</p>
                {[
                  ["handoverConfirmed", "Source code transferred"],
                  ["deliverablesConfirmed", "Documentation finalized"],
                  ["finalFilesDelivered", "Final files delivered"],
                  ["receiptConfirmed", "Credentials shared"],
                  ["noIssuesConfirmed", "No pending issues"],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(handoverForm[key])}
                      onChange={(e) => setHandoverForm((c) => ({ ...c, [key]: e.target.checked }))}
                    />
                    <span>{label}</span>
                  </label>
                ))}
                <div className="pt-2">
                  <Button type="button" onClick={handleFinalizeHandover} disabled={projectActionSaving}>
                    {projectActionSaving ? "Saving..." : "Finalize Handover"}
                  </Button>
                </div>
              </div>
            </div>
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
