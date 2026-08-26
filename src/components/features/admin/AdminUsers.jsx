import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { AdminTopBar } from "./AdminTopBar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/shared/context/AuthContext";
import Search from "lucide-react/dist/esm/icons/search";
import Eye from "lucide-react/dist/esm/icons/eye";
import Ban from "lucide-react/dist/esm/icons/ban";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import ShieldX from "lucide-react/dist/esm/icons/shield-x";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Filter from "lucide-react/dist/esm/icons/filter";
import RotateCcw from "lucide-react/dist/esm/icons/rotate-ccw";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import ArrowUpDown from "lucide-react/dist/esm/icons/arrow-up-down";
import SlidersHorizontal from "lucide-react/dist/esm/icons/sliders-horizontal";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import PieChart from "lucide-react/dist/esm/icons/pie-chart";
import Users from "lucide-react/dist/esm/icons/users";
import Award from "lucide-react/dist/esm/icons/award";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import X from "lucide-react/dist/esm/icons/x";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import { toast } from "sonner";

const PAGE_SIZE = 12;
const STATUS_FILTERS = ["ALL", "ACTIVE", "PENDING", "SUSPENDED"];

const ONBOARDING_STEPS = [
  { id: "completed", label: "Completed (100%)", shortName: "Completed" },
  { id: "welcome", label: "Welcome & Intro", shortName: "Welcome" },
  { id: "workPreference", label: "Work Preference", shortName: "Work Pref" },
  { id: "basicProfile", label: "Basic Profile", shortName: "Basic Profile" },
  { id: "services", label: "Services Selection", shortName: "Services" },
  { id: "quickInfo", label: "Service Setup & Quick Info", shortName: "Service Setup" },
  { id: "caseStudy", label: "Case Study & Portfolio", shortName: "Case Study" },
  { id: "acceptInProgressProjects", label: "Work Availability", shortName: "Availability" },
  { id: "deliveryPolicy", label: "Policies & Terms", shortName: "Policies" },
];

const COMPLETION_TIERS = [
  { key: "100", label: "100% Completed", min: 100, max: 100, color: "emerald", tone: "bg-emerald-500 text-emerald-950 dark:text-emerald-100", border: "border-emerald-500/30" },
  { key: "75-99", label: "75% - 99%", min: 75, max: 99, color: "blue", tone: "bg-blue-500 text-blue-950 dark:text-blue-100", border: "border-blue-500/30" },
  { key: "50-74", label: "50% - 74%", min: 50, max: 74, color: "indigo", tone: "bg-indigo-500 text-indigo-950 dark:text-indigo-100", border: "border-indigo-500/30" },
  { key: "25-49", label: "25% - 49%", min: 25, max: 49, color: "amber", tone: "bg-amber-500 text-amber-950 dark:text-amber-100", border: "border-amber-500/30" },
  { key: "0-24", label: "0% - 24%", min: 0, max: 24, color: "rose", tone: "bg-rose-500 text-rose-950 dark:text-rose-100", border: "border-rose-500/30" },
];

const getFreelancerAvailability = (u) => {
  const fp = u.freelancerProfile || {};
  let pd = {};
  if (typeof u.profileDetails === "string") {
    try { pd = JSON.parse(u.profileDetails); } catch { pd = {}; }
  } else if (u.profileDetails && typeof u.profileDetails === "object") {
    pd = u.profileDetails;
  } else if (fp?.serviceDetails?.__profileDetails) {
    pd = fp.serviceDetails.__profileDetails;
  }
  const draft = pd.onboardingDraft || {};

  const openToWork = fp?.openToWork ?? u?.openToWork ?? true;
  const acceptInProgress = draft.acceptInProgressProjectsValue ?? fp?.acceptInProgressProjects ?? pd?.acceptInProgressProjects ?? u?.acceptInProgressProjects;

  if (openToWork === false) return "BUSY";
  if (acceptInProgress === true || acceptInProgress === "yes" || acceptInProgress === "true") return "ACCEPTING_PROJECTS";
  return "OPEN_TO_WORK";
};

const getDisplayStatus = (user) => {
  if (user.status === "SUSPENDED") return "SUSPENDED";
  if (user.status === "PENDING_APPROVAL" || (user.role === "FREELANCER" && !user.isVerified)) {
    return "PENDING";
  }
  return "ACTIVE";
};

const buildUsersQuery = ({
  page = 1,
  limit = PAGE_SIZE,
  search = "",
  role,
  status,
  isVerified,
}) => {
  const params = new URLSearchParams();
  const useFreelancerApprovalView = role === "FREELANCER" && status === "PENDING";

  params.set("page", String(page));
  params.set("limit", String(limit));

  if (search.trim()) {
    params.set("search", search.trim());
  }

  if (role) {
    params.set("role", role);
  }

  if (useFreelancerApprovalView) {
    params.set("view", "approvals");
  } else if (status && status !== "ALL") {
    params.set("status", status === "PENDING" ? "PENDING_APPROVAL" : status);
  }

  if (typeof isVerified === "boolean") {
    params.set("isVerified", String(isVerified));
  }

  return params.toString();
};

const buildSummaryCards = (summary = {}, roleFilter) => {
  const items = [
    {
      key: "total",
      title: "Total",
      value: summary.total,
      tone: "text-foreground",
    },
    {
      key: "active",
      title: "Active",
      value: summary.active,
      tone: "text-green-700 dark:text-green-400",
    },
    {
      key: "pending",
      title: "Pending",
      value: summary.pending,
      tone: "text-amber-700 dark:text-amber-400",
    },
    {
      key: "suspended",
      title: "Suspended",
      value: summary.suspended,
      tone: "text-red-700 dark:text-red-400",
    },
  ];

  if (roleFilter === "FREELANCER") {
    items.push({
      key: "openToWork",
      title: "Open To Work",
      value: summary.openToWork ?? summary.active ?? summary.total,
      tone: "text-emerald-600 dark:text-emerald-400",
    });
  }

  return items;
};

const computeUserOnboardingStats = (user) => {
  if (!user) return { percentage: 0, stepTitle: "Welcome & Intro", stepId: "welcome", isComplete: false };

  const fp = user.freelancerProfile || {};
  let pd = {};
  if (typeof user.profileDetails === "string") {
    try { pd = JSON.parse(user.profileDetails); } catch { pd = {}; }
  } else if (user.profileDetails && typeof user.profileDetails === "object") {
    pd = user.profileDetails;
  } else if (fp?.serviceDetails?.__profileDetails) {
    pd = fp.serviceDetails.__profileDetails;
  }
  const draft = pd.onboardingDraft || {};
  const progressObj = pd.onboardingProgress || fp?.serviceDetails?.__profileDetails?.onboardingProgress || fp?.serviceDetails?.onboardingProgress || {};

  const isComplete = Boolean(user.onboardingComplete || progressObj?.isCompleted);
  if (isComplete) {
    return { percentage: 100, stepTitle: "Completed", stepId: "completed", isComplete: true };
  }

  // Work Preference
  const workPref = draft.selectedWorkPreference || pd.workPreference || fp.workPreference || user.workPreference;

  // Basic Profile (8 fields)
  const photo = user.avatar || fp.profilePhoto || draft.basicProfilePhoto;
  const fullName = user.fullName;
  const username = user.username || fp.username || draft.basicProfileUsername;
  const bio = user.bio || fp.bio || pd.bio || draft.basicProfileBio;
  const country = user.country || pd.country || draft.basicProfileCountry;
  const stateVal = user.location || pd.state || draft.basicProfileState;
  const languages = pd.languages || draft.basicProfileLanguages || [];
  const resume = pd.resumeUrl || pd.resume || draft.basicProfileResume;

  // Services
  const services = user.services || pd.services || fp.services || draft.selectedServices || [];

  // Service entries
  const serviceDraftsByKey = draft.serviceDraftsByKey || pd?.serviceDetails || fp?.serviceDetails || {};
  const serviceEntries = Object.entries(serviceDraftsByKey)
    .filter(([k]) => k !== "__profileDetails" && k !== "onboardingProgress")
    .map(([k, v]) => ({ key: k, ...(typeof v === "object" ? v : {}) }));

  // Case Studies
  const allCaseStudies = [
    ...(serviceEntries.flatMap(s => s?.caseStudies || (s?.caseStudy ? [s.caseStudy] : []))),
    ...(Array.isArray(fp?.portfolio) ? fp.portfolio : []),
    ...(Array.isArray(pd?.portfolioProjects) ? pd.portfolioProjects : []),
    ...(Array.isArray(fp?.portfolioProjects) ? fp.portfolioProjects : []),
    ...(Array.isArray(user?.portfolioProjects) ? user.portfolioProjects : [])
  ].filter(c => c && typeof c === "object" && (c.title || c.name || c.description || c.projectLink || c.link));

  const acceptInProgress = draft.acceptInProgressProjectsValue ?? fp?.acceptInProgressProjects ?? pd?.acceptInProgressProjects ?? user?.acceptInProgressProjects;
  const deliveryPolicy = draft.deliveryPolicyAccepted ?? pd?.deliveryPolicyAccepted;
  const commPolicy = draft.communicationPolicyAccepted ?? pd?.communicationPolicyAccepted;

  // Calculate fields filled / total
  let total = 0;
  let filled = 0;

  // Step 1: Welcome (1 field)
  total += 1; filled += 1;

  // Step 2: Work Preference (1 field)
  total += 1; if (workPref) filled += 1;

  // Step 3: Basic Profile (8 fields)
  const basicFields = [photo, fullName, username, bio, country, stateVal, (Array.isArray(languages) && languages.length > 0), resume];
  total += 8;
  filled += basicFields.filter(Boolean).length;

  // Step 4: Services (1 field)
  total += 1; if (Array.isArray(services) && services.length > 0) filled += 1;

  // Step 5: Quick Info per service
  if (serviceEntries.length > 0) {
    serviceEntries.forEach(srv => {
      total += 7;
      if (srv.title || srv.serviceTitle || srv.key) filled += 1;
      if ((srv.subcategories?.length || srv.skills?.length || 0) > 0) filled += 1;
      if ((srv.serviceTools?.length || srv.tools?.length || 0) > 0) filled += 1;
      if (srv.description || srv.serviceDescription) filled += 1;
      if (srv.experience || srv.serviceExperience) filled += 1;
      if (srv.startingPrice || srv.price) filled += 1;
      if (srv.serviceMedia?.length || srv.visuals?.length || srv.images?.length || srv.media?.length) filled += 1;
    });
  } else {
    total += 7;
    if (fp?.serviceTitle || user?.serviceTitle) filled += 1;
    if (Array.isArray(fp?.skills) && fp.skills.length > 0) filled += 1;
    if (fp?.serviceDescription) filled += 1;
    if (fp?.experienceLevel || user?.experienceYears) filled += 1;
    if (fp?.startingPrice || user?.startingPrice) filled += 1;
  }

  // Step 6: Case Study per project
  if (allCaseStudies.length > 0) {
    allCaseStudies.forEach(cs => {
      total += 9;
      if (cs.title || cs.caseStudyTitle || cs.name) filled += 1;
      if (cs.description || cs.overview) filled += 1;
      if (cs.niche || cs.category) filled += 1;
      if (cs.projectLink || cs.link || cs.url) filled += 1;
      if (cs.role || cs.yourRole) filled += 1;
      if (cs.timeline || cs.projectTimeline || cs.duration) filled += 1;
      if (cs.budget || cs.price || cs.projectBudget) filled += 1;
      if (cs.projectFile || cs.file || cs.documentUrl) filled += 1;
      if (cs.bannerImage || cs.image || cs.coverImage || cs.media?.length) filled += 1;
    });
  } else {
    total += 9;
  }

  // Step 7: Availability (1 field)
  total += 1; if (typeof acceptInProgress === "boolean" || Boolean(acceptInProgress)) filled += 1;

  // Step 8: Policies (2 fields)
  total += 2;
  if (deliveryPolicy) filled += 1;
  if (commPolicy) filled += 1;

  const grandPercentage = Math.round((filled / Math.max(total, 1)) * 100);
  const percentage = Math.max(grandPercentage, Number(progressObj.progressPercentage) || 0);

  // Step titles list
  const STEP_TITLES = [
    { id: "welcome", title: "Welcome & Intro", hasFields: true },
    { id: "workPreference", title: "Work Preference", hasFields: Boolean(workPref) },
    { id: "basicProfile", title: "Basic Profile", hasFields: basicFields.some(Boolean) },
    { id: "services", title: "Services Selection", hasFields: Array.isArray(services) && services.length > 0 },
    { id: "quickInfo", title: "Service Setup & Quick Info", hasFields: serviceEntries.some(s => s.title || s.description) },
    { id: "caseStudy", title: "Case Study & Portfolio", hasFields: allCaseStudies.length > 0 },
    { id: "acceptInProgressProjects", title: "Work Availability", hasFields: typeof acceptInProgress === "boolean" || Boolean(acceptInProgress) },
    { id: "deliveryPolicy", title: "Policies & Terms", hasFields: Boolean(deliveryPolicy || commPolicy) },
  ];

  const lastActiveStepIndex = STEP_TITLES.findLastIndex(s => s.hasFields);
  const serverStepIndex = STEP_TITLES.findIndex(s => s.id === progressObj.currentStep);
  const activeIndex = Math.max(0, serverStepIndex, lastActiveStepIndex);

  const activeStep = STEP_TITLES[activeIndex] || STEP_TITLES[0];

  return {
    percentage: Math.min(percentage, 100),
    stepTitle: activeStep.title,
    stepId: activeStep.id,
    isComplete: percentage >= 100
  };
};

const AdminUsers = ({ roleFilter }) => {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [allFreelancers, setAllFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actionLoadingKey, setActionLoadingKey] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [completionFilter, setCompletionFilter] = useState("ALL");
  const [stepFilter, setStepFilter] = useState("ALL");
  const [availabilityFilter, setAvailabilityFilter] = useState("ALL");
  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [sortFilter, setSortFilter] = useState("COMPLETION_DESC");
  const [showAnalyticsPanel, setShowAnalyticsPanel] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState("12");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  });
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    pending: 0,
    suspended: 0,
    openToWork: 0,
  });

  const isFreelancerView = roleFilter === "FREELANCER";

  const pageTitle = roleFilter
    ? roleFilter === "CLIENT"
      ? "Clients"
      : roleFilter === "PROJECT_MANAGER"
        ? "Project Managers"
        : "Freelancers"
    : "Users";

  const pageDescription = roleFilter
    ? `Manage your platform's ${roleFilter === "PROJECT_MANAGER" ? "project managers" : roleFilter.toLowerCase() + "s"}.`
    : "Manage your platform's users.";

  const summaryCards = useMemo(
    () => buildSummaryCards(summary, roleFilter),
    [roleFilter, summary],
  );

  // Compute stats across all freelancers
  const freelancerAnalytics = useMemo(() => {
    if (!isFreelancerView || allFreelancers.length === 0) {
      return {
        total: 0,
        avgCompletion: 0,
        tiers: { "100": 0, "75-99": 0, "50-74": 0, "25-49": 0, "0-24": 0 },
        steps: {},
        availability: { OPEN_TO_WORK: 0, ACCEPTING_PROJECTS: 0, BUSY: 0 },
        services: [],
      };
    }

    const tiers = { "100": 0, "75-99": 0, "50-74": 0, "25-49": 0, "0-24": 0 };
    const steps = {};
    ONBOARDING_STEPS.forEach((s) => { steps[s.id] = 0; });
    const availability = { OPEN_TO_WORK: 0, ACCEPTING_PROJECTS: 0, BUSY: 0 };
    const servicesMap = new Map();
    let totalPercentageSum = 0;

    allFreelancers.forEach((u) => {
      const stats = computeUserOnboardingStats(u);
      const pct = stats.percentage;
      totalPercentageSum += pct;

      if (pct === 100) tiers["100"]++;
      else if (pct >= 75) tiers["75-99"]++;
      else if (pct >= 50) tiers["50-74"]++;
      else if (pct >= 25) tiers["25-49"]++;
      else tiers["0-24"]++;

      const stepId = stats.isComplete ? "completed" : stats.stepId;
      steps[stepId] = (steps[stepId] || 0) + 1;

      const availStatus = getFreelancerAvailability(u);
      availability[availStatus] = (availability[availStatus] || 0) + 1;

      const fp = u.freelancerProfile || {};
      const userServices = Array.isArray(fp.services) ? fp.services : (Array.isArray(u.services) ? u.services : []);
      userServices.forEach((s) => {
        if (s) {
          const key = String(s).trim();
          servicesMap.set(key, (servicesMap.get(key) || 0) + 1);
        }
      });
    });

    const uniqueServices = Array.from(servicesMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      total: allFreelancers.length,
      avgCompletion: Math.round(totalPercentageSum / Math.max(allFreelancers.length, 1)),
      tiers,
      steps,
      availability,
      services: uniqueServices,
    };
  }, [allFreelancers, isFreelancerView]);

  // Main data fetch callback
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      if (isFreelancerView) {
        // Fetch full freelancer dataset for analytics & client-side high performance filtering
        const res = await authFetch(`/admin/users?role=FREELANCER&limit=1000`);
        const data = await res.json();
        const nextUsers = Array.isArray(data?.data?.users) ? data.data.users : [];
        setAllFreelancers(nextUsers);
      } else {
        const query = buildUsersQuery({
          page,
          limit: pageSize === "ALL" ? 1000 : Number(pageSize) || 12,
          search,
          role: roleFilter,
          status: statusFilter,
        });
        const res = await authFetch(`/admin/users?${query}`);
        const data = await res.json();
        const nextUsers = Array.isArray(data?.data?.users) ? data.data.users : [];
        const nextPagination = data?.data?.pagination ?? {
          page,
          limit: Number(pageSize) || 12,
          total: nextUsers.length,
          totalPages: 1,
        };

        if (nextPagination.totalPages > 0 && page > nextPagination.totalPages) {
          setPage(nextPagination.totalPages);
          return;
        }

        setUsers(nextUsers);
        setPagination({
          page: nextPagination.page || page,
          limit: nextPagination.limit || (Number(pageSize) || 12),
          total: nextPagination.total || 0,
          totalPages: Math.max(nextPagination.totalPages || 1, 1),
        });
      }
    } catch (fetchError) {
      console.error("Failed to fetch users:", fetchError);
      setUsers([]);
      setAllFreelancers([]);
      setPagination({
        page: 1,
        limit: Number(pageSize) || 12,
        total: 0,
        totalPages: 1,
      });
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [authFetch, isFreelancerView, page, pageSize, roleFilter, search, statusFilter]);

  // Filter & Sort freelancers locally when in Freelancer view
  useEffect(() => {
    if (!isFreelancerView) return;

    let result = [...allFreelancers];

    // Status Filter
    if (statusFilter !== "ALL") {
      result = result.filter((user) => {
        const dispStatus = getDisplayStatus(user);
        return dispStatus === statusFilter;
      });
    }

    // Search query filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((u) => {
        const fp = u.freelancerProfile || {};
        const servicesList = Array.isArray(fp.services) ? fp.services.join(" ") : (Array.isArray(u.services) ? u.services.join(" ") : "");
        const matchName = u.fullName?.toLowerCase().includes(q);
        const matchEmail = u.email?.toLowerCase().includes(q);
        const matchUsername = fp.username?.toLowerCase().includes(q);
        const matchService = servicesList.toLowerCase().includes(q);
        return matchName || matchEmail || matchUsername || matchService;
      });
    }

    // Completion percentage range filter
    if (completionFilter !== "ALL") {
      const tierDef = COMPLETION_TIERS.find((t) => t.key === completionFilter);
      if (tierDef) {
        result = result.filter((u) => {
          const stats = computeUserOnboardingStats(u);
          return stats.percentage >= tierDef.min && stats.percentage <= tierDef.max;
        });
      }
    }

    // Onboarding step drop-off filter
    if (stepFilter !== "ALL") {
      result = result.filter((u) => {
        const stats = computeUserOnboardingStats(u);
        const effectiveStepId = stats.isComplete ? "completed" : stats.stepId;
        return effectiveStepId === stepFilter;
      });
    }

    // Availability status filter
    if (availabilityFilter !== "ALL") {
      result = result.filter((u) => {
        const avail = getFreelancerAvailability(u);
        return avail === availabilityFilter;
      });
    }

    // Service filter
    if (serviceFilter !== "ALL") {
      result = result.filter((u) => {
        const fp = u.freelancerProfile || {};
        const servicesList = Array.isArray(fp.services) ? fp.services : (Array.isArray(u.services) ? u.services : []);
        return servicesList.some((s) => String(s).trim().toLowerCase() === serviceFilter.toLowerCase());
      });
    }

    // Sorting
    result.sort((a, b) => {
      const statsA = computeUserOnboardingStats(a);
      const statsB = computeUserOnboardingStats(b);

      if (sortFilter === "COMPLETION_DESC") {
        return statsB.percentage - statsA.percentage;
      }
      if (sortFilter === "COMPLETION_ASC") {
        return statsA.percentage - statsB.percentage;
      }
      if (sortFilter === "CREATED_DESC") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortFilter === "CREATED_ASC") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (sortFilter === "NAME_ASC") {
        return (a.fullName || "").localeCompare(b.fullName || "");
      }
      return 0;
    });

    const currentLimit = pageSize === "ALL" ? Math.max(result.length, 1) : (Number(pageSize) || 12);
    const totalFiltered = result.length;
    const totalPages = Math.max(Math.ceil(totalFiltered / currentLimit), 1);
    const validPage = Math.min(page, totalPages);

    const startIndex = (validPage - 1) * currentLimit;
    const paginatedSlice = result.slice(startIndex, startIndex + currentLimit);

    setUsers(paginatedSlice);
    setPagination({
      page: validPage,
      limit: currentLimit,
      total: totalFiltered,
      totalPages: totalPages,
    });
  }, [allFreelancers, availabilityFilter, completionFilter, isFreelancerView, page, pageSize, search, serviceFilter, sortFilter, statusFilter, stepFilter]);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);

    const baseQuery = { role: roleFilter, limit: 1 };
    const queries = [
      buildUsersQuery(baseQuery),
      buildUsersQuery({ ...baseQuery, status: "ACTIVE" }),
      buildUsersQuery({ ...baseQuery, status: "PENDING" }),
      buildUsersQuery({ ...baseQuery, status: "SUSPENDED" }),
    ];

    try {
      const responses = await Promise.all(
        queries.map((query) => authFetch(`/admin/users?${query}`)),
      );
      const payloads = await Promise.all(
        responses.map((response) => response.json().catch(() => null)),
      );
      const totals = payloads.map(
        (payload) => Number(payload?.data?.pagination?.total || 0),
      );

      const openToWorkCount = allFreelancers.filter((u) => getFreelancerAvailability(u) !== "BUSY").length;

      setSummary({
        total: totals[0] || 0,
        active: totals[1] || 0,
        pending: totals[2] || 0,
        suspended: totals[3] || 0,
        openToWork: roleFilter === "FREELANCER" ? (openToWorkCount || totals[1] || totals[0]) : 0,
      });
    } catch (summaryError) {
      console.error("Failed to fetch admin user summary:", summaryError);
      setSummary({
        total: 0,
        active: 0,
        pending: 0,
        suspended: 0,
        openToWork: 0,
      });
    } finally {
      setSummaryLoading(false);
    }
  }, [allFreelancers, authFetch, roleFilter]);

  useEffect(() => {
    setPage(1);
  }, [roleFilter, search, statusFilter, completionFilter, stepFilter, availabilityFilter, serviceFilter]);

  useEffect(() => {
    const debounceId = setTimeout(() => {
      void fetchUsers();
    }, 350);

    return () => clearTimeout(debounceId);
  }, [fetchUsers]);

  useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  const refreshCurrentView = useCallback(async () => {
    await Promise.all([fetchUsers(), fetchSummary()]);
  }, [fetchSummary, fetchUsers]);

  const handleClearFilters = () => {
    setStatusFilter("ALL");
    setCompletionFilter("ALL");
    setStepFilter("ALL");
    setAvailabilityFilter("ALL");
    setServiceFilter("ALL");
    setSortFilter("COMPLETION_DESC");
    setSearch("");
    setPage(1);
    toast.success("Filters reset to default");
  };

  const handleStatusChange = async (userId, newStatus) => {
    setActionLoadingKey(`${userId}:status`);
    try {
      const res = await authFetch(`/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        toast.error("Failed to update user status");
        return;
      }

      toast.success(`User ${newStatus === "ACTIVE" ? "activated" : "suspended"} successfully`);
      await refreshCurrentView();
    } catch (statusError) {
      console.error("Failed to update status:", statusError);
      toast.error("Failed to update user status");
    } finally {
      setActionLoadingKey("");
    }
  };

  const handleView = (userId) => {
    navigate(`/admin/users/${userId}`);
  };

  const hasActiveFilters =
    statusFilter !== "ALL" ||
    completionFilter !== "ALL" ||
    stepFilter !== "ALL" ||
    availabilityFilter !== "ALL" ||
    serviceFilter !== "ALL" ||
    search.trim() !== "";

  const pageStart = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const pageEnd = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <AdminLayout>
      <div className="relative flex flex-col gap-6 p-6">
        <AdminTopBar label={pageTitle} />

        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header */}
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
                {isFreelancerView && (
                  <Badge variant="secondary" className="px-2.5 py-1 text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                    <Sparkles className="mr-1 h-3.5 w-3.5 text-primary inline" />
                    Analytics & Multi-Filter Active
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-muted-foreground">{pageDescription}</p>
            </div>

            {isFreelancerView ? (
              <div className="flex flex-wrap gap-2 items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAnalyticsPanel(!showAnalyticsPanel)}
                  className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                >
                  <PieChart className="h-4 w-4" />
                  {showAnalyticsPanel ? "Hide Analytics Dashboard" : "Show Analytics Dashboard"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate("/admin/approvals")}>
                  Approvals
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate("/admin/freelancer-limits")}>
                  Project Limits
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate("/admin/freelancer-onboarding")}>
                  Onboarding Setup
                </Button>
              </div>
            ) : null}
          </div>

          {/* Quick Summary Metric Cards */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {summaryCards.map((card) => (
              <Card key={card.key} className="shadow-sm transition-all hover:shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${card.tone}`}>
                    {summaryLoading ? "--" : card.value}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detailed Freelancer Analytics Dashboard (Completion Distribution & Onboarding Drop-off Funnel) */}
          {isFreelancerView && showAnalyticsPanel && (
            <Card className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-md">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Profile Completion & Drop-off Funnel Analytics
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Visual distribution of overall freelancer onboarding completion percentage and stage drop-offs. Click any card or step to filter instantly.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs font-mono px-2.5 py-1 bg-card">
                      Avg Completion: <span className="text-primary font-bold ml-1">{freelancerAnalytics.avgCompletion}%</span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-6">
                {/* 1. Completion Percentage Tiers Grid */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold tracking-wide text-foreground uppercase flex items-center gap-1.5">
                      <PieChart className="h-3.5 w-3.5 text-primary" />
                      Profile Completion Tiers (Click card to filter)
                    </span>
                    {completionFilter !== "ALL" && (
                      <button
                        onClick={() => setCompletionFilter("ALL")}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        Reset Tier Filter
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {COMPLETION_TIERS.map((tier) => {
                      const count = freelancerAnalytics.tiers[tier.key] || 0;
                      const pctOfTotal = freelancerAnalytics.total > 0
                        ? Math.round((count / freelancerAnalytics.total) * 100)
                        : 0;
                      const isSelected = completionFilter === tier.key;

                      return (
                        <div
                          key={tier.key}
                          onClick={() => setCompletionFilter(isSelected ? "ALL" : tier.key)}
                          className={`group cursor-pointer rounded-xl border p-3 transition-all duration-200 ${
                            isSelected
                              ? `ring-2 ring-primary ring-offset-2 bg-primary/10 border-primary ${tier.border}`
                              : `bg-card hover:bg-muted/40 hover:border-primary/40 ${tier.border}`
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">{tier.label}</span>
                            <Badge className={`text-[10px] px-1.5 py-0 font-bold ${tier.tone}`}>
                              {pctOfTotal}%
                            </Badge>
                          </div>
                          <div className="mt-2 flex items-baseline justify-between">
                            <span className="text-2xl font-bold tracking-tight text-foreground">
                              {count}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              freelancers
                            </span>
                          </div>
                          {/* Mini Progress Bar */}
                          <div className="mt-2.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${tier.tone.split(" ")[0]}`}
                              style={{ width: `${pctOfTotal}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Onboarding Drop-off Funnel Visualizer */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold tracking-wide text-foreground uppercase flex items-center gap-1.5">
                      <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                      Step-by-Step Onboarding Drop-off Funnel (Click step to view users)
                    </span>
                    {stepFilter !== "ALL" && (
                      <button
                        onClick={() => setStepFilter("ALL")}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        Reset Step Filter
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-2">
                    {ONBOARDING_STEPS.map((step, idx) => {
                      const count = freelancerAnalytics.steps[step.id] || 0;
                      const isSelected = stepFilter === step.id;
                      const isLast = idx === ONBOARDING_STEPS.length - 1;

                      return (
                        <div
                          key={step.id}
                          onClick={() => setStepFilter(isSelected ? "ALL" : step.id)}
                          className={`cursor-pointer rounded-lg border p-2 text-center transition-all ${
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : isLast
                                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 hover:border-emerald-500"
                                : "bg-card hover:bg-muted/60 border-border"
                          }`}
                        >
                          <p className={`text-[10px] font-semibold uppercase tracking-wider truncate ${isSelected ? "text-primary-foreground/90" : "text-muted-foreground"}`}>
                            Step {idx + 1}
                          </p>
                          <p className={`text-xs font-bold truncate mt-0.5 ${isSelected ? "text-primary-foreground" : "text-foreground"}`}>
                            {step.shortName}
                          </p>
                          <div className="mt-1.5 flex items-center justify-center gap-1">
                            <span className={`text-sm font-black ${isSelected ? "text-primary-foreground" : "text-foreground"}`}>
                              {count}
                            </span>
                            <span className={`text-[10px] ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                              ({freelancerAnalytics.total > 0 ? Math.round((count / freelancerAnalytics.total) * 100) : 0}%)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Advanced Multi-Param Control Bar */}
          <div className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              {/* Row 1: Search & Quick Refresh */}
              <div className="relative flex-1 min-w-[260px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`Search by name, email, username, or skill...`}
                  className="pl-9 pr-4"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Status Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-medium text-muted-foreground mr-1">Status:</span>
                {STATUS_FILTERS.map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                    className="h-8 text-xs px-2.5"
                    onClick={() => setStatusFilter(status)}
                  >
                    {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
                  </Button>
                ))}
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => void refreshCurrentView()}>
                  Refresh
                </Button>
              </div>
            </div>

            {/* Row 2: Deep Dropdown Filters (Only in Freelancer view) */}
            {isFreelancerView && (
              <div className="pt-2 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {/* 1. Completion Filter */}
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                    Completion Percentage:
                  </label>
                  <Select value={completionFilter} onValueChange={setCompletionFilter}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="All Completion %" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Completion Levels</SelectItem>
                      {COMPLETION_TIERS.map((tier) => (
                        <SelectItem key={tier.key} value={tier.key}>
                          {tier.label} ({freelancerAnalytics.tiers[tier.key] || 0})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 2. Onboarding Step Filter */}
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                    Drop-off Step:
                  </label>
                  <Select value={stepFilter} onValueChange={setStepFilter}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="All Drop-off Steps" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Steps & Phases</SelectItem>
                      {ONBOARDING_STEPS.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.label} ({freelancerAnalytics.steps[s.id] || 0})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 3. Work Availability Filter */}
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                    Work Availability:
                  </label>
                  <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="All Availability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Availability Statuses</SelectItem>
                      <SelectItem value="OPEN_TO_WORK">Open to Work / Available ({freelancerAnalytics.availability.OPEN_TO_WORK || 0})</SelectItem>
                      <SelectItem value="ACCEPTING_PROJECTS">Accepting In-Progress ({freelancerAnalytics.availability.ACCEPTING_PROJECTS || 0})</SelectItem>
                      <SelectItem value="BUSY">Not Available / Busy ({freelancerAnalytics.availability.BUSY || 0})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 4. Primary Service Filter */}
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                    Service / Skills:
                  </label>
                  <Select value={serviceFilter} onValueChange={setServiceFilter}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="All Services" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Services</SelectItem>
                      {freelancerAnalytics.services.map((srv) => (
                        <SelectItem key={srv.name} value={srv.name}>
                          {srv.name.replace(/[_-]+/g, " ")} ({srv.count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 5. Sort Order */}
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                    Sort By:
                  </label>
                  <Select value={sortFilter} onValueChange={setSortFilter}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Sort Order" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COMPLETION_DESC">Highest Completion %</SelectItem>
                      <SelectItem value="COMPLETION_ASC">Lowest Completion %</SelectItem>
                      <SelectItem value="CREATED_DESC">Recently Joined</SelectItem>
                      <SelectItem value="CREATED_ASC">Oldest Joined</SelectItem>
                      <SelectItem value="NAME_ASC">Name (A - Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Active Filters Badges & Reset Button */}
            {hasActiveFilters && (
              <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-border/40">
                <span className="text-xs font-semibold text-muted-foreground">Active Filters:</span>
                {statusFilter !== "ALL" && (
                  <Badge variant="secondary" className="text-[11px] gap-1 px-2 py-0.5">
                    Status: {statusFilter}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter("ALL")} />
                  </Badge>
                )}
                {completionFilter !== "ALL" && (
                  <Badge variant="secondary" className="text-[11px] gap-1 px-2 py-0.5 bg-primary/10 text-primary">
                    Completion: {completionFilter}%
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setCompletionFilter("ALL")} />
                  </Badge>
                )}
                {stepFilter !== "ALL" && (
                  <Badge variant="secondary" className="text-[11px] gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    Step: {ONBOARDING_STEPS.find((s) => s.id === stepFilter)?.shortName || stepFilter}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setStepFilter("ALL")} />
                  </Badge>
                )}
                {availabilityFilter !== "ALL" && (
                  <Badge variant="secondary" className="text-[11px] gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Availability: {availabilityFilter === "OPEN_TO_WORK" ? "Open to Work" : availabilityFilter === "ACCEPTING_PROJECTS" ? "Accepting Projects" : "Busy"}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setAvailabilityFilter("ALL")} />
                  </Badge>
                )}
                {serviceFilter !== "ALL" && (
                  <Badge variant="secondary" className="text-[11px] gap-1 px-2 py-0.5">
                    Service: {serviceFilter}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setServiceFilter("ALL")} />
                  </Badge>
                )}
                {search && (
                  <Badge variant="secondary" className="text-[11px] gap-1 px-2 py-0.5">
                    Query: "{search}"
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSearch("")} />
                  </Badge>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-6 text-xs text-destructive hover:bg-destructive/10 gap-1 ml-auto"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset All Filters
                </Button>
              </div>
            )}
          </div>

          {/* User Table */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role / Type</TableHead>
                  {isFreelancerView ? (
                    <>
                      <TableHead>Onboarding Phase & Drop-Off</TableHead>
                      <TableHead>Primary Service & Skills</TableHead>
                    </>
                  ) : (
                    <TableHead>Status</TableHead>
                  )}
                  <TableHead>Joined & Last Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><div className="h-4 w-32 animate-pulse rounded bg-muted" /></TableCell>
                      <TableCell><div className="h-4 w-16 animate-pulse rounded bg-muted" /></TableCell>
                      <TableCell><div className="h-4 w-28 animate-pulse rounded bg-muted" /></TableCell>
                      <TableCell><div className="h-4 w-24 animate-pulse rounded bg-muted" /></TableCell>
                      <TableCell><div className="h-4 w-24 animate-pulse rounded bg-muted" /></TableCell>
                      <TableCell><div className="ml-auto h-4 w-20 animate-pulse rounded bg-muted" /></TableCell>
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isFreelancerView ? 6 : 5} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2 py-4">
                        <AlertCircle className="h-8 w-8 text-muted-foreground/60" />
                        <p className="text-sm font-medium text-foreground">
                          No {pageTitle.toLowerCase()} match your active search or filter parameters.
                        </p>
                        {hasActiveFilters && (
                          <Button variant="outline" size="sm" onClick={handleClearFilters} className="mt-2 gap-1.5">
                            <RotateCcw className="h-3.5 w-3.5" />
                            Clear Filters
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => {
                    const displayStatus = getDisplayStatus(user);
                    const fp = user.freelancerProfile || {};
                    const stats = computeUserOnboardingStats(user);
                    const isComplete = stats.isComplete;
                    const stepId = stats.stepId;
                    const stepTitle = stats.stepTitle;
                    const percentage = stats.percentage;
                    const availStatus = getFreelancerAvailability(user);
                    const servicesList = Array.isArray(fp.services) ? fp.services : (Array.isArray(user.services) ? user.services : []);
                    const primaryService = servicesList[0] ? String(servicesList[0]).replace(/[_-]+/g, " ") : "Not set";
                    const lastActiveDate = fp.updatedAt || user.updatedAt || user.createdAt;

                    return (
                      <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary overflow-hidden shrink-0">
                              {user.avatar || fp.profilePhoto ? (
                                <img src={user.avatar || fp.profilePhoto} alt={user.fullName} className="h-full w-full object-cover" />
                              ) : (
                                user.fullName?.charAt(0)?.toUpperCase() || "U"
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="font-medium text-sm truncate">{user.fullName}</p>
                                {isFreelancerView && (
                                  <span
                                    className={`inline-block h-2 w-2 rounded-full shrink-0 ${
                                      availStatus === "OPEN_TO_WORK"
                                        ? "bg-emerald-500"
                                        : availStatus === "ACCEPTING_PROJECTS"
                                          ? "bg-blue-500"
                                          : "bg-muted-foreground/40"
                                    }`}
                                    title={availStatus === "OPEN_TO_WORK" ? "Open to Work" : availStatus === "ACCEPTING_PROJECTS" ? "Accepting Projects" : "Busy"}
                                  />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                              {fp.username ? (
                                <p className="text-[11px] text-primary/80 font-mono">@{fp.username}</p>
                              ) : null}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 items-start">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                user.role === "ADMIN"
                                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                  : user.role === "CLIENT"
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                    : user.role === "PROJECT_MANAGER"
                                      ? "bg-primary/10 text-primary dark:bg-primary/10 dark:text-primary"
                                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              }`}
                            >
                              {user.role === "PROJECT_MANAGER" ? "PM" : user.role}
                            </span>
                            {fp.profileRole ? (
                              <span className="text-[11px] text-muted-foreground capitalize">
                                {fp.profileRole}
                              </span>
                            ) : null}
                          </div>
                        </TableCell>

                        {isFreelancerView ? (
                          <>
                            {/* Onboarding Phase & Real-Time Drop-off */}
                            <TableCell className="min-w-[210px]">
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-medium capitalize text-foreground truncate max-w-[140px]" title={stepTitle}>
                                    {stepTitle}
                                  </span>
                                  <span className={`font-mono font-bold text-xs ${
                                    isComplete
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : percentage >= 75
                                        ? "text-blue-600 dark:text-blue-400"
                                        : percentage >= 50
                                          ? "text-indigo-600 dark:text-indigo-400"
                                          : "text-amber-600 dark:text-amber-400"
                                  }`}>
                                    {percentage}%
                                  </span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                  <div
                                    className={`h-full transition-all duration-500 ${
                                      isComplete
                                        ? "bg-emerald-500"
                                        : percentage >= 75
                                          ? "bg-blue-500"
                                          : percentage >= 50
                                            ? "bg-indigo-500"
                                            : percentage >= 25
                                              ? "bg-amber-500"
                                              : "bg-rose-500"
                                    }`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] px-1.5 py-0 font-normal ${
                                      isComplete
                                        ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                        : "border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                                    }`}
                                  >
                                    {isComplete ? "Onboarded (100%)" : `Backed up at ${stepId}`}
                                  </Badge>
                                </div>
                              </div>
                            </TableCell>

                            {/* Primary Service & Skills */}
                            <TableCell className="max-w-[200px]">
                              <div className="space-y-1">
                                <p className="text-xs font-medium capitalize text-foreground truncate" title={primaryService}>
                                  {primaryService}
                                </p>
                                {servicesList.length > 1 ? (
                                  <span className="text-[10px] text-muted-foreground">
                                    +{servicesList.length - 1} more services
                                  </span>
                                ) : null}
                              </div>
                            </TableCell>
                          </>
                        ) : (
                          <TableCell>
                            <Badge
                              className={
                                displayStatus === "SUSPENDED"
                                  ? "bg-red-100 text-red-700 border-0 dark:bg-red-900/30 dark:text-red-400"
                                  : displayStatus === "PENDING"
                                    ? "bg-amber-100 text-amber-700 border-0 dark:bg-amber-900/30 dark:text-amber-400"
                                    : "bg-green-100 text-green-700 border-0 dark:bg-green-900/30 dark:text-green-400"
                              }
                            >
                              {displayStatus === "PENDING" ? "Pending" : displayStatus === "SUSPENDED" ? "Suspended" : "Active"}
                            </Badge>
                          </TableCell>
                        )}

                        {/* Joined & Last Active */}
                        <TableCell>
                          <div className="text-xs space-y-0.5">
                            <p className="text-foreground font-mono">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </p>
                            {lastActiveDate ? (
                              <p className="text-[11px] text-muted-foreground">
                                Active {new Date(lastActiveDate).toLocaleDateString()}
                              </p>
                            ) : null}
                          </div>
                        </TableCell>

                        {/* Action: View Details */}
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(user.id)}
                            className="gap-1.5 hover:bg-primary hover:text-primary-foreground transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Bar */}
          <div className="flex flex-col gap-3 rounded-lg border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-semibold text-foreground font-mono">{pageStart}-{pageEnd}</span> of{" "}
                <span className="font-semibold text-foreground font-mono">{pagination.total}</span> {pageTitle.toLowerCase()}.
              </p>

              <div className="flex items-center gap-1.5 border-l border-border/60 pl-3">
                <span className="text-xs text-muted-foreground">Per page:</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(val) => {
                    setPageSize(val);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-7 w-[70px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12</SelectItem>
                    <SelectItem value="24">24</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="ALL">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 1))}
              >
                Previous
              </Button>
              <span className="min-w-24 text-center text-sm text-muted-foreground font-mono">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages || loading}
                onClick={() =>
                  setPage((currentPage) => Math.min(currentPage + 1, pagination.totalPages))
                }
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
