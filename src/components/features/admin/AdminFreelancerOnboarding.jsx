import { useCallback, useEffect, useMemo, useState } from "react";
import Archive from "lucide-react/dist/esm/icons/archive";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import Eye from "lucide-react/dist/esm/icons/eye";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Filter from "lucide-react/dist/esm/icons/filter";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Pencil from "lucide-react/dist/esm/icons/pencil";
import Plus from "lucide-react/dist/esm/icons/plus";
import RotateCcw from "lucide-react/dist/esm/icons/rotate-ccw";
import Search from "lucide-react/dist/esm/icons/search";
import XCircle from "lucide-react/dist/esm/icons/x-circle";
import { toast } from "sonner";

import AdminLayout from "./AdminLayout";
import { AdminTopBar } from "./AdminTopBar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { normalizeServiceKey } from "@/components/freelancer/Freelancer-Onboarding/service-details";
import { useAuth } from "@/shared/context/AuthContext";

const STATUS_FILTERS = [
  { value: "ALL", label: "All submissions" },
  { value: "DRAFT", label: "Draft" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "APPROVED", label: "Approved" },
  { value: "ARCHIVED", label: "Archived" },
];
const PROFILE_ROLE_OPTIONS = [
  { value: "individual", label: "Individual Freelancer" },
  { value: "agency", label: "Agency / Studio" },
  { value: "part_time", label: "Part-Time Freelancer" },
];
const COUNTRY_OPTIONS = [
  "India",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Singapore",
  "United Arab Emirates",
];
const STATE_OPTIONS_BY_COUNTRY = {
  India: ["Maharashtra", "Karnataka", "Delhi NCR", "Tamil Nadu", "Gujarat", "Telangana"],
  "United States": ["California", "New York", "Texas", "Florida", "Washington"],
  "United Kingdom": ["England", "Scotland", "Wales", "Northern Ireland"],
  Canada: ["Ontario", "British Columbia", "Alberta", "Quebec"],
  Australia: ["New South Wales", "Victoria", "Queensland", "Western Australia"],
  Singapore: ["Singapore"],
  "United Arab Emirates": ["Dubai", "Abu Dhabi", "Sharjah"],
};
const LANGUAGE_OPTIONS = ["English", "Hindi", "Marathi", "Spanish", "French", "German", "Arabic"];
const ACCOUNT_STATUS_OPTIONS = [
  { value: "PENDING_APPROVAL", label: "Pending approval" },
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Archived" },
];
const BOOLEAN_SELECT_OPTIONS = [
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
];
const EMPTY_SERVICE_DETAILS = "{}";
const EMPTY_FORM = {
  fullName: "",
  email: "",
  phoneNumber: "",
  password: "",
  status: "PENDING_APPROVAL",
  onboardingComplete: "false",
  isVerified: "false",
  profileVerified: "false",
  profileRole: "individual",
  professionalTitle: "",
  username: "",
  country: "India",
  city: "",
  languagesText: "English",
  professionalBio: "",
  servicesText: "",
  serviceDetailsText: EMPTY_SERVICE_DETAILS,
  avatar: "",
  coverImage: "",
  resume: "",
  portfolioUrl: "",
  linkedinUrl: "",
  githubUrl: "",
  otherLanguage: "",
  availabilityHoursPerWeek: "",
  availabilityStartTimeline: "",
  availabilityWorkingSchedule: "",
  reliabilityDelayHandling: "",
  reliabilityMissedDeadlines: "",
  acceptInProgressProjects: "false",
  deliveryPolicyAccepted: "false",
  communicationPolicyAccepted: "false",
  termsAccepted: "false",
};

const toTitleLabel = (value = "") =>
  String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatDate = (value) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const parseListText = (value = "") =>
  String(value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

const parseServiceText = (value = "") =>
  Array.from(new Set(parseListText(value).map(normalizeServiceKey).filter(Boolean)));

const safeJsonStringify = (value) => {
  try {
    return JSON.stringify(value && typeof value === "object" ? value : {}, null, 2);
  } catch {
    return EMPTY_SERVICE_DETAILS;
  }
};

const getStateOptionsForCountry = (country) => STATE_OPTIONS_BY_COUNTRY[String(country || "").trim()] || [];

const parseJsonObject = (value) => {
  const parsed = JSON.parse(value || EMPTY_SERVICE_DETAILS);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Service details must be a JSON object.");
  }
  return parsed;
};

const getSubmissionStatusBadgeClass = (status = "") => {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "APPROVED") {
    return "border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  }
  if (normalized === "SUBMITTED") {
    return "border-0 bg-primary/10 text-primary";
  }
  if (normalized === "ARCHIVED" || normalized === "REJECTED") {
    return "border-0 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  }
  return "border-0 bg-muted text-muted-foreground";
};

const getAccountStatusBadgeClass = (status = "") => {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "ACTIVE") {
    return "border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  }
  if (normalized === "SUSPENDED") {
    return "border-0 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  }
  return "border-0 bg-primary/10 text-primary";
};

const getInitial = (name = "") =>
  String(name || "F").trim().charAt(0).toUpperCase() || "F";

const buildFormFromSubmission = (submission = null) => {
  if (!submission) {
    return { ...EMPTY_FORM };
  }

  const profileDetails =
    submission.profileDetails && typeof submission.profileDetails === "object"
      ? submission.profileDetails
      : {};
  const identity =
    profileDetails.identity && typeof profileDetails.identity === "object"
      ? profileDetails.identity
      : {};
  const services = Array.isArray(profileDetails.services)
    ? profileDetails.services
    : Array.isArray(submission.services)
      ? submission.services
      : [];
  const freelancerProfile =
    submission.freelancerProfile && typeof submission.freelancerProfile === "object"
      ? submission.freelancerProfile
      : {};

  return {
    fullName: submission.fullName || "",
    email: submission.email || "",
    phoneNumber: submission.phoneNumber || "",
    password: "",
    status: submission.accountStatus || "PENDING_APPROVAL",
    onboardingComplete: String(Boolean(submission.onboardingComplete)),
    isVerified: String(Boolean(submission.kycVerified)),
    profileVerified: String(Boolean(submission.profileVerified)),
    profileRole: profileDetails.role || submission.profileRole || "individual",
    username: identity.username || submission.username || "",
    country: identity.country || freelancerProfile.country || "India",
    city: identity.city || freelancerProfile.city || "",
    languagesText: Array.isArray(identity.languages)
      ? identity.languages.join(", ")
      : Array.isArray(freelancerProfile.languages)
        ? freelancerProfile.languages.join(", ")
        : "",
    professionalBio:
      profileDetails.professionalBio || submission.professionalBio || "",
    servicesText: services.join(", "),
    serviceDetailsText: safeJsonStringify(profileDetails.serviceDetails),
    avatar: submission.avatar || identity.profilePhoto || "",
    resume: freelancerProfile.resume || "",
    acceptInProgressProjects: String(Boolean(profileDetails.acceptInProgressProjects)),
    deliveryPolicyAccepted: String(Boolean(profileDetails.deliveryPolicyAccepted)),
    communicationPolicyAccepted: String(Boolean(profileDetails.communicationPolicyAccepted)),
  };
};

const validateForm = (form, { isCreate = false } = {}) => {
  const errors = {};
  const services = parseServiceText(form.servicesText);
  const onboardingComplete = form.onboardingComplete === "true";
  const statusActive = form.status === "ACTIVE";

  if (form.fullName.trim().length < 2) {
    errors.fullName = "Full name must be at least 2 characters.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (isCreate && form.password && form.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (form.username && !/^[a-z0-9]{3,20}$/.test(form.username)) {
    errors.username = "Use 3-20 lowercase letters or numbers.";
  }

  try {
    parseJsonObject(form.serviceDetailsText);
  } catch (error) {
    errors.serviceDetailsText = error.message;
  }

  if (onboardingComplete || statusActive) {
    if (!form.professionalBio.trim()) {
      errors.professionalBio = "Professional bio is required to complete onboarding.";
    }
    if (!services.length) {
      errors.servicesText = "Add at least one service to complete onboarding.";
    }
  }

  return errors;
};

const buildPayloadFromForm = (form) => {
  const services = parseServiceText(form.servicesText);
  const languages = parseListText(form.languagesText);
  const serviceDetails = parseJsonObject(form.serviceDetailsText);

  return {
    fullName: form.fullName.trim(),
    email: form.email.trim(),
    phoneNumber: form.phoneNumber.trim() || null,
    password: form.password || undefined,
    status: form.status,
    onboardingComplete: form.onboardingComplete === "true",
    isVerified: form.isVerified === "true",
    profileVerified: form.profileVerified === "true",
    profileRole: form.profileRole.trim() || "individual",
    professionalBio: form.professionalBio.trim(),
    username: form.username.trim().toLowerCase(),
    country: form.country.trim(),
    city: form.city.trim(),
    languages,
    services,
    avatar: form.avatar.trim() || null,
    resume: form.resume.trim() || null,
    acceptInProgressProjects: form.acceptInProgressProjects === "true",
    deliveryPolicyAccepted: form.deliveryPolicyAccepted === "true",
    communicationPolicyAccepted: form.communicationPolicyAccepted === "true",
    profileDetails: {
      profileDetailsVersion: 3,
      role: form.profileRole.trim() || "individual",
      profileRole: form.profileRole.trim() || "individual",
      fullName: form.fullName.trim(),
      professionalBio: form.professionalBio.trim(),
      services,
      serviceDetails,
      acceptInProgressProjects: form.acceptInProgressProjects === "true",
      deliveryPolicyAccepted: form.deliveryPolicyAccepted === "true",
      communicationPolicyAccepted: form.communicationPolicyAccepted === "true",
      identity: {
        fullName: form.fullName.trim(),
        username: form.username.trim().toLowerCase(),
        country: form.country.trim(),
        city: form.city.trim(),
        languages,
        profilePhoto: form.avatar.trim() || null,
      },
    },
  };
};

const FieldError = ({ message }) =>
  message ? <p className="mt-1 text-xs text-red-600">{message}</p> : null;

const AdminFreelancerOnboarding = () => {
  const { authFetch } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    drafts: 0,
    submitted: 0,
    approved: 0,
    archived: 0,
  });
  const [facets, setFacets] = useState({ services: [] });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = useState({
    search: "",
    submissionStatus: "ALL",
    accountStatus: "ALL",
    service: "ALL",
    kycVerified: "ALL",
  });
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [dialogMode, setDialogMode] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [formErrors, setFormErrors] = useState({});
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [generatedPassword, setGeneratedPassword] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      page: String(pagination.page),
      limit: String(pagination.limit),
    });

    if (filters.search.trim()) params.set("search", filters.search.trim());
    if (filters.submissionStatus !== "ALL") {
      params.set("submissionStatus", filters.submissionStatus);
    }
    if (filters.accountStatus !== "ALL") {
      params.set("accountStatus", filters.accountStatus);
    }
    if (filters.service !== "ALL") params.set("service", filters.service);
    if (filters.kycVerified !== "ALL") params.set("kycVerified", filters.kycVerified);

    return params.toString();
  }, [filters, pagination.limit, pagination.page]);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authFetch(`/admin/freelancer-onboarding?${queryString}`);
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to load onboarding submissions.");
      }

      setSubmissions(Array.isArray(payload?.data?.submissions) ? payload.data.submissions : []);
      setStats(payload?.data?.stats || {});
      setFacets(payload?.data?.facets || { services: [] });
      setPagination((current) => ({
        ...current,
        ...(payload?.data?.pagination || {}),
      }));
    } catch (error) {
      console.error("Failed to fetch freelancer onboarding submissions:", error);
      toast.error(error?.message || "Failed to load onboarding submissions");
    } finally {
      setLoading(false);
    }
  }, [authFetch, queryString]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchSubmissions();
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [fetchSubmissions]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPagination((current) => ({ ...current, page: 1 }));
  };

  const openCreateDialog = () => {
    setSelectedSubmission(null);
    setForm({ ...EMPTY_FORM });
    setFormErrors({});
    setGeneratedPassword("");
    setDialogMode("create");
  };

  const loadSubmission = async (submissionId, mode) => {
    setDetailLoading(true);
    setDialogMode(mode);
    setFormErrors({});
    setGeneratedPassword("");

    try {
      const response = await authFetch(`/admin/freelancer-onboarding/${submissionId}`);
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to load onboarding details.");
      }

      const submission = payload?.data?.submission || null;
      setSelectedSubmission(submission);
      setForm(buildFormFromSubmission(submission));
    } catch (error) {
      console.error("Failed to load onboarding details:", error);
      toast.error(error?.message || "Failed to load onboarding details");
      setDialogMode(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleFormFieldChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSave = async () => {
    const isCreate = dialogMode === "create";
    const errors = validateForm(form, { isCreate });
    setFormErrors(errors);

    if (Object.keys(errors).length) {
      toast.error("Please resolve the highlighted fields.");
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayloadFromForm(form);
      const endpoint = isCreate
        ? "/admin/freelancer-onboarding"
        : `/admin/freelancer-onboarding/${selectedSubmission?.id}`;
      const response = await authFetch(endpoint, {
        method: isCreate ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const responsePayload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(responsePayload?.message || "Failed to save onboarding submission.");
      }

      const nextSubmission = responsePayload?.data?.submission || null;
      setSelectedSubmission(nextSubmission);
      setForm(buildFormFromSubmission(nextSubmission));
      setDialogMode("view");
      setGeneratedPassword(responsePayload?.data?.generatedPassword || "");
      toast.success(isCreate ? "Onboarding submission created" : "Onboarding submission updated");
      await fetchSubmissions();
    } catch (error) {
      console.error("Failed to save onboarding submission:", error);
      toast.error(error?.message || "Failed to save onboarding submission");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusAction = async (submissionId, action) => {
    setActionLoadingId(`${submissionId}:${action}`);
    try {
      const response = await authFetch(`/admin/freelancer-onboarding/${submissionId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to update onboarding status.");
      }

      toast.success("Onboarding status updated");
      if (selectedSubmission?.id === submissionId) {
        setSelectedSubmission(payload?.data?.submission || selectedSubmission);
        setForm(buildFormFromSubmission(payload?.data?.submission));
      }
      await fetchSubmissions();
    } catch (error) {
      console.error("Failed to update onboarding status:", error);
      toast.error(error?.message || "Failed to update onboarding status");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleArchive = async () => {
    if (!archiveTarget?.id) return;
    setActionLoadingId(`${archiveTarget.id}:archive`);

    try {
      const response = await authFetch(`/admin/freelancer-onboarding/${archiveTarget.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Archived from admin onboarding module" }),
      });

      if (!response.ok && response.status !== 204) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || "Failed to archive onboarding submission.");
      }

      toast.success("Onboarding submission archived");
      if (selectedSubmission?.id === archiveTarget.id) {
        setDialogMode(null);
        setSelectedSubmission(null);
      }
      setArchiveTarget(null);
      await fetchSubmissions();
    } catch (error) {
      console.error("Failed to archive onboarding submission:", error);
      toast.error(error?.message || "Failed to archive onboarding submission");
    } finally {
      setActionLoadingId(null);
    }
  };

  const statCards = [
    { label: "Total", value: stats.total || 0, description: "Freelancer onboarding records" },
    { label: "Draft", value: stats.drafts || 0, description: "Incomplete or in progress" },
    { label: "Submitted", value: stats.submitted || 0, description: "Ready for admin review" },
    { label: "Approved", value: stats.approved || 0, description: "Active freelancer accounts" },
    { label: "Archived", value: stats.archived || 0, description: "Rejected or archived records" },
  ];

  const isDialogOpen = Boolean(dialogMode);
  const isFormMode = dialogMode === "create" || dialogMode === "edit";
  const dialogTitle =
    dialogMode === "create"
      ? "Create Onboarding Submission"
      : dialogMode === "edit"
        ? "Edit Onboarding Submission"
        : "Onboarding Submission";

  return (
    <AdminLayout>
      <div className="relative flex flex-col gap-6 p-6">
        <AdminTopBar label="Freelancer Onboarding" />

        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Freelancer Onboarding</h1>
              <p className="mt-2 max-w-3xl text-muted-foreground">
                Manage freelancer onboarding submissions, status review, profile data, services, and admin-created records.
              </p>
            </div>
            <Button onClick={openCreateDialog} className="w-full gap-2 sm:w-auto">
              <Plus className="h-4 w-4" />
              Create submission
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {statCards.map((card) => (
              <Card key={card.label}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">
                    {loading ? <span className="block h-8 w-14 animate-pulse rounded bg-muted" /> : card.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="rounded-md border bg-card">
            <div className="flex flex-col gap-3 border-b p-4 xl:flex-row xl:items-center">
              <div className="relative min-w-[240px] flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={filters.search}
                  onChange={(event) => updateFilter("search", event.target.value)}
                  placeholder="Search by name, email, phone, or username"
                  className="pl-9"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:items-center">
                <Select
                  value={filters.submissionStatus}
                  onValueChange={(value) => updateFilter("submissionStatus", value)}
                >
                  <SelectTrigger className="w-full xl:w-[180px]">
                    <SelectValue placeholder="Submission status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_FILTERS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.accountStatus}
                  onValueChange={(value) => updateFilter("accountStatus", value)}
                >
                  <SelectTrigger className="w-full xl:w-[180px]">
                    <SelectValue placeholder="Account status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All accounts</SelectItem>
                    {ACCOUNT_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.service}
                  onValueChange={(value) => updateFilter("service", value)}
                >
                  <SelectTrigger className="w-full xl:w-[190px]">
                    <SelectValue placeholder="Service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All services</SelectItem>
                    {(facets.services || []).map((serviceKey) => (
                      <SelectItem key={serviceKey} value={serviceKey}>
                        {toTitleLabel(serviceKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.kycVerified}
                  onValueChange={(value) => updateFilter("kycVerified", value)}
                >
                  <SelectTrigger className="w-full xl:w-[150px]">
                    <SelectValue placeholder="KYC" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All KYC</SelectItem>
                    <SelectItem value="true">Verified</SelectItem>
                    <SelectItem value="false">Unverified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Freelancer</TableHead>
                    <TableHead>Submission</TableHead>
                    <TableHead>Services</TableHead>
                    <TableHead>KYC</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    [...Array(6)].map((_, index) => (
                      <TableRow key={index}>
                        <TableCell><div className="h-10 w-56 animate-pulse rounded bg-muted" /></TableCell>
                        <TableCell><div className="h-7 w-28 animate-pulse rounded bg-muted" /></TableCell>
                        <TableCell><div className="h-7 w-44 animate-pulse rounded bg-muted" /></TableCell>
                        <TableCell><div className="h-7 w-20 animate-pulse rounded bg-muted" /></TableCell>
                        <TableCell><div className="h-5 w-24 animate-pulse rounded bg-muted" /></TableCell>
                        <TableCell><div className="ml-auto h-8 w-40 animate-pulse rounded bg-muted" /></TableCell>
                      </TableRow>
                    ))
                  ) : submissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Filter className="h-8 w-8 opacity-50" />
                          <span>No onboarding submissions match the current filters.</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    submissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                              {getInitial(submission.fullName)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium">{submission.fullName}</p>
                              <p className="truncate text-sm text-muted-foreground">{submission.email}</p>
                              {submission.username ? (
                                <p className="truncate text-xs text-muted-foreground">@{submission.username}</p>
                              ) : null}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-2">
                            <Badge className={getSubmissionStatusBadgeClass(submission.submissionStatus)}>
                              {toTitleLabel(submission.submissionStatus)}
                            </Badge>
                            <Badge className={getAccountStatusBadgeClass(submission.accountStatus)}>
                              {toTitleLabel(submission.accountStatus)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex max-w-[260px] flex-wrap gap-1.5">
                            {(submission.services || []).slice(0, 3).map((service) => (
                              <Badge key={service} variant="outline" className="font-normal">
                                {toTitleLabel(service)}
                              </Badge>
                            ))}
                            {submission.serviceCount > 3 ? (
                              <Badge variant="outline" className="font-normal">
                                +{submission.serviceCount - 3}
                              </Badge>
                            ) : null}
                            {!submission.serviceCount ? (
                              <span className="text-sm text-muted-foreground">No services</span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              submission.kycVerified
                                ? "border-0 bg-emerald-100 text-emerald-700"
                                : "border-0 bg-muted text-muted-foreground"
                            }
                          >
                            {submission.kycVerified ? "Verified" : "Unverified"}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {formatDate(submission.updatedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="View"
                              onClick={() => loadSubmission(submission.id, "view")}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Edit"
                              onClick={() => loadSubmission(submission.id, "edit")}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Approve"
                              disabled={actionLoadingId === `${submission.id}:approve`}
                              className="text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700"
                              onClick={() => handleStatusAction(submission.id, "approve")}
                            >
                              {actionLoadingId === `${submission.id}:approve` ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Reject"
                              disabled={actionLoadingId === `${submission.id}:reject`}
                              className="text-red-600 hover:bg-red-100 hover:text-red-700"
                              onClick={() => handleStatusAction(submission.id, "reject")}
                            >
                              {actionLoadingId === `${submission.id}:reject` ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Archive"
                              className="text-muted-foreground"
                              onClick={() => setArchiveTarget(submission)}
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages || 1} · {pagination.total || 0} records
              </p>
              <div className="flex items-center gap-2">
                <Select
                  value={String(pagination.limit)}
                  onValueChange={(value) =>
                    setPagination((current) => ({
                      ...current,
                      page: 1,
                      limit: Number(value),
                    }))
                  }
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 rows</SelectItem>
                    <SelectItem value="20">20 rows</SelectItem>
                    <SelectItem value="50">50 rows</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  disabled={loading || pagination.page <= 1}
                  onClick={() =>
                    setPagination((current) => ({
                      ...current,
                      page: Math.max(current.page - 1, 1),
                    }))
                  }
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={loading || pagination.page >= pagination.totalPages}
                  onClick={() =>
                    setPagination((current) => ({
                      ...current,
                      page: Math.min(current.page + 1, current.totalPages || 1),
                    }))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && setDialogMode(null)}>
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>
              {isFormMode
                ? "Create or update the freelancer profile data that powers onboarding, marketplace, and approval workflows."
                : "Review the submitted profile, services, marketplace data, and admin actions."}
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : isFormMode ? (
            <div className="space-y-6">
              {generatedPassword ? (
                <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
                  Temporary password returned once: <span className="font-mono">{generatedPassword}</span>
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Full name</label>
                  <Input
                    value={form.fullName}
                    onChange={(event) => handleFormFieldChange("fullName", event.target.value)}
                    placeholder="Freelancer name"
                  />
                  <FieldError message={formErrors.fullName} />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    value={form.email}
                    onChange={(event) => handleFormFieldChange("email", event.target.value)}
                    placeholder="name@example.com"
                  />
                  <FieldError message={formErrors.email} />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    value={form.phoneNumber}
                    onChange={(event) => handleFormFieldChange("phoneNumber", event.target.value)}
                    placeholder="+91..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Password {dialogMode === "create" ? "(optional)" : ""}</label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(event) => handleFormFieldChange("password", event.target.value)}
                    placeholder={dialogMode === "create" ? "Generate one if blank" : "Leave blank"}
                  />
                  <FieldError message={formErrors.password} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <label className="text-sm font-medium">Account status</label>
                  <Select
                    value={form.status}
                    onValueChange={(value) => handleFormFieldChange("status", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Onboarding complete</label>
                  <Select
                    value={form.onboardingComplete}
                    onValueChange={(value) => handleFormFieldChange("onboardingComplete", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BOOLEAN_SELECT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">KYC verified</label>
                  <Select
                    value={form.isVerified}
                    onValueChange={(value) => handleFormFieldChange("isVerified", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BOOLEAN_SELECT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Profile verified</label>
                  <Select
                    value={form.profileVerified}
                    onValueChange={(value) => handleFormFieldChange("profileVerified", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BOOLEAN_SELECT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Username</label>
                  <Input
                    value={form.username}
                    onChange={(event) => handleFormFieldChange("username", event.target.value.toLowerCase())}
                    placeholder="lowercaseusername"
                  />
                  <FieldError message={formErrors.username} />
                </div>
                <div>
                  <label className="text-sm font-medium">Profile role</label>
                  <Input
                    value={form.profileRole}
                    onChange={(event) => handleFormFieldChange("profileRole", event.target.value)}
                    placeholder="individual"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Country</label>
                  <Input
                    value={form.country}
                    onChange={(event) => handleFormFieldChange("country", event.target.value)}
                    placeholder="India"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">City / State</label>
                  <Input
                    value={form.city}
                    onChange={(event) => handleFormFieldChange("city", event.target.value)}
                    placeholder="Maharashtra"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Languages</label>
                  <Input
                    value={form.languagesText}
                    onChange={(event) => handleFormFieldChange("languagesText", event.target.value)}
                    placeholder="English, Hindi"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Services</label>
                  <Input
                    value={form.servicesText}
                    onChange={(event) => handleFormFieldChange("servicesText", event.target.value)}
                    placeholder="web_development, seo"
                  />
                  <FieldError message={formErrors.servicesText} />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Professional bio</label>
                <Textarea
                  value={form.professionalBio}
                  onChange={(event) => handleFormFieldChange("professionalBio", event.target.value)}
                  className="min-h-28"
                  placeholder="Short freelancer profile summary"
                />
                <FieldError message={formErrors.professionalBio} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Avatar URL</label>
                  <Input
                    value={form.avatar}
                    onChange={(event) => handleFormFieldChange("avatar", event.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Resume URL</label>
                  <Input
                    value={form.resume}
                    onChange={(event) => handleFormFieldChange("resume", event.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium">Accepts in-progress projects</label>
                  <Select
                    value={form.acceptInProgressProjects}
                    onValueChange={(value) => handleFormFieldChange("acceptInProgressProjects", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BOOLEAN_SELECT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Delivery policy</label>
                  <Select
                    value={form.deliveryPolicyAccepted}
                    onValueChange={(value) => handleFormFieldChange("deliveryPolicyAccepted", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BOOLEAN_SELECT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Communication policy</label>
                  <Select
                    value={form.communicationPolicyAccepted}
                    onValueChange={(value) => handleFormFieldChange("communicationPolicyAccepted", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BOOLEAN_SELECT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Service details JSON</label>
                <Textarea
                  value={form.serviceDetailsText}
                  onChange={(event) => handleFormFieldChange("serviceDetailsText", event.target.value)}
                  className="min-h-52 font-mono text-xs"
                  spellCheck={false}
                />
                <FieldError message={formErrors.serviceDetailsText} />
              </div>
            </div>
          ) : (
            <SubmissionDetails
              submission={selectedSubmission}
              generatedPassword={generatedPassword}
              actionLoadingId={actionLoadingId}
              onEdit={() => setDialogMode("edit")}
              onStatusAction={handleStatusAction}
              onArchive={() => setArchiveTarget(selectedSubmission)}
            />
          )}

          <DialogFooter>
            {isFormMode ? (
              <>
                <Button variant="outline" onClick={() => setDialogMode(selectedSubmission ? "view" : null)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save submission
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setDialogMode(null)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(archiveTarget)} onOpenChange={(open) => !open && setArchiveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive onboarding submission?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move {archiveTarget?.fullName || "this freelancer"} to archived status. The record stays available in admin filters.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={handleArchive}
              disabled={actionLoadingId === `${archiveTarget?.id}:archive`}
            >
              {actionLoadingId === `${archiveTarget?.id}:archive` ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

const SubmissionDetails = ({
  submission,
  generatedPassword,
  actionLoadingId,
  onEdit,
  onStatusAction,
  onArchive,
}) => {
  if (!submission) {
    return (
      <div className="flex min-h-[240px] items-center justify-center text-muted-foreground">
        Select a submission to view details.
      </div>
    );
  }

  const profileDetails =
    submission.profileDetails && typeof submission.profileDetails === "object"
      ? submission.profileDetails
      : {};
  const freelancerProfile =
    submission.freelancerProfile && typeof submission.freelancerProfile === "object"
      ? submission.freelancerProfile
      : {};
  const serviceDetails =
    profileDetails.serviceDetails && typeof profileDetails.serviceDetails === "object"
      ? profileDetails.serviceDetails
      : {};

  return (
    <div className="space-y-5">
      {generatedPassword ? (
        <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
          Temporary password returned once: <span className="font-mono">{generatedPassword}</span>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 rounded-md border p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
            {getInitial(submission.fullName)}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold">{submission.fullName}</h3>
            <p className="truncate text-sm text-muted-foreground">{submission.email}</p>
            {submission.phoneNumber ? (
              <p className="truncate text-xs text-muted-foreground">{submission.phoneNumber}</p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={getSubmissionStatusBadgeClass(submission.submissionStatus)}>
            {toTitleLabel(submission.submissionStatus)}
          </Badge>
          <Badge className={getAccountStatusBadgeClass(submission.accountStatus)}>
            {toTitleLabel(submission.accountStatus)}
          </Badge>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" className="gap-2" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-2 text-emerald-700"
          disabled={actionLoadingId === `${submission.id}:approve`}
          onClick={() => onStatusAction(submission.id, "approve")}
        >
          {actionLoadingId === `${submission.id}:approve` ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-2 text-red-700"
          disabled={actionLoadingId === `${submission.id}:reject`}
          onClick={() => onStatusAction(submission.id, "reject")}
        >
          {actionLoadingId === `${submission.id}:reject` ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          Reject
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-2"
          disabled={actionLoadingId === `${submission.id}:reopen`}
          onClick={() => onStatusAction(submission.id, "reopen")}
        >
          {actionLoadingId === `${submission.id}:reopen` ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RotateCcw className="h-4 w-4" />
          )}
          Reopen
        </Button>
        <Button size="sm" variant="outline" className="gap-2" onClick={onArchive}>
          <Archive className="h-4 w-4" />
          Archive
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="json">JSON</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <DetailItem label="Username" value={submission.username ? `@${submission.username}` : "Not set"} />
            <DetailItem label="Location" value={submission.location || "Not set"} />
            <DetailItem label="KYC" value={submission.kycVerified ? "Verified" : "Unverified"} />
            <DetailItem label="Profile verified" value={submission.profileVerified ? "Yes" : "No"} />
            <DetailItem label="Created" value={formatDate(submission.createdAt)} />
            <DetailItem label="Updated" value={formatDate(submission.updatedAt)} />
          </div>
          <div className="mt-4 rounded-md border p-4">
            <p className="text-sm font-medium">Professional bio</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
              {submission.professionalBio || "No bio provided."}
            </p>
          </div>
        </TabsContent>

        <TabsContent value="services" className="pt-4">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(submission.services || []).map((service) => (
                <Badge key={service} variant="outline">
                  {toTitleLabel(service)}
                </Badge>
              ))}
              {!submission.services?.length ? (
                <span className="text-sm text-muted-foreground">No services submitted.</span>
              ) : null}
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Delivery</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(serviceDetails).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-20 text-center text-muted-foreground">
                        No structured service details.
                      </TableCell>
                    </TableRow>
                  ) : (
                    Object.entries(serviceDetails).map(([serviceKey, detail]) => (
                      <TableRow key={serviceKey}>
                        <TableCell className="font-medium">{toTitleLabel(serviceKey)}</TableCell>
                        <TableCell>{detail?.title || detail?.serviceTitle || "Not set"}</TableCell>
                        <TableCell>{detail?.averageProjectPrice || detail?.averagePrice || "Not set"}</TableCell>
                        <TableCell>{detail?.deliveryTime || detail?.deliveryTimeline || "Not set"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="assets" className="pt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <DetailItem label="Avatar URL" value={submission.avatar || "Not uploaded"} />
            <DetailItem label="Resume URL" value={freelancerProfile.resume || "Not uploaded"} />
            <DetailItem label="Marketplace rows" value={String(submission.counts?.marketplace || 0)} />
            <DetailItem label="Portfolio projects" value={String(submission.counts?.freelancerProjects || 0)} />
            <DetailItem label="Recent proposals" value={String(submission.counts?.proposals || 0)} />
            <DetailItem label="Profile updated" value={formatDate(submission.profileUpdatedAt)} />
          </div>
        </TabsContent>

        <TabsContent value="json" className="pt-4">
          <div className="rounded-md border bg-muted/20 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4" />
              Profile details JSON
            </div>
            <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap text-xs">
              {safeJsonStringify(profileDetails)}
            </pre>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const DetailItem = ({ label, value }) => (
  <div className="rounded-md border p-3">
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="mt-1 break-words text-sm font-medium">{value}</p>
  </div>
);

export default AdminFreelancerOnboarding;
