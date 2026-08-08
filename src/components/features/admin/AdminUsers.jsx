import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { AdminTopBar } from "./AdminTopBar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/shared/context/AuthContext";
import Search from "lucide-react/dist/esm/icons/search";
import Eye from "lucide-react/dist/esm/icons/eye";
import Ban from "lucide-react/dist/esm/icons/ban";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import ShieldX from "lucide-react/dist/esm/icons/shield-x";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import { toast } from "sonner";

const PAGE_SIZE = 12;
const STATUS_FILTERS = ["ALL", "ACTIVE", "PENDING", "SUSPENDED"];

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
      key: "kycPending",
      title: "KYC Pending",
      value: summary.kycPending,
      tone: "text-primary",
    });
  }

  return items;
};

const AdminUsers = ({ roleFilter }) => {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actionLoadingKey, setActionLoadingKey] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    pending: 0,
    suspended: 0,
    kycPending: 0,
  });

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

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const query = buildUsersQuery({
        page,
        limit: PAGE_SIZE,
        search,
        role: roleFilter,
        status: statusFilter,
      });
      const res = await authFetch(`/admin/users?${query}`);
      const data = await res.json();
      const nextUsers = Array.isArray(data?.data?.users) ? data.data.users : [];
      const nextPagination = data?.data?.pagination ?? {
        page,
        limit: PAGE_SIZE,
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
        limit: nextPagination.limit || PAGE_SIZE,
        total: nextPagination.total || 0,
        totalPages: Math.max(nextPagination.totalPages || 1, 1),
      });
    } catch (fetchError) {
      console.error("Failed to fetch users:", fetchError);
      setUsers([]);
      setPagination({
        page: 1,
        limit: PAGE_SIZE,
        total: 0,
        totalPages: 1,
      });
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [authFetch, page, roleFilter, search, statusFilter]);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);

    const baseQuery = { role: roleFilter, limit: 1 };
    const queries = [
      buildUsersQuery(baseQuery),
      buildUsersQuery({ ...baseQuery, status: "ACTIVE" }),
      buildUsersQuery({ ...baseQuery, status: "PENDING" }),
      buildUsersQuery({ ...baseQuery, status: "SUSPENDED" }),
    ];

    if (roleFilter === "FREELANCER") {
      queries.push(buildUsersQuery({ ...baseQuery, isVerified: false }));
    }

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

      setSummary({
        total: totals[0] || 0,
        active: totals[1] || 0,
        pending: totals[2] || 0,
        suspended: totals[3] || 0,
        kycPending: roleFilter === "FREELANCER" ? totals[4] || 0 : 0,
      });
    } catch (summaryError) {
      console.error("Failed to fetch admin user summary:", summaryError);
      setSummary({
        total: 0,
        active: 0,
        pending: 0,
        suspended: 0,
        kycPending: 0,
      });
    } finally {
      setSummaryLoading(false);
    }
  }, [authFetch, roleFilter]);

  useEffect(() => {
    setPage(1);
  }, [roleFilter, search, statusFilter]);

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

  const handleVerificationChange = async (userId, isVerified) => {
    setActionLoadingKey(`${userId}:kyc`);
    try {
      const res = await authFetch(`/admin/users/${userId}/verification`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified }),
      });

      if (!res.ok) {
        toast.error(isVerified ? "Failed to approve KYC" : "Failed to revoke KYC");
        return;
      }

      toast.success(isVerified ? "KYC approved" : "KYC reverted");
      await refreshCurrentView();
    } catch (verificationError) {
      console.error("Failed to update verification:", verificationError);
      toast.error("Failed to update KYC status");
    } finally {
      setActionLoadingKey("");
    }
  };

  const handleView = (userId) => {
    navigate(`/admin/users/${userId}`);
  };

  const pageStart = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const pageEnd = Math.min(pagination.page * pagination.limit, pagination.total);
  const showFreelancerColumns = roleFilter === "FREELANCER";

  return (
    <AdminLayout>
      <div className="relative flex flex-col gap-6 p-6">
        <AdminTopBar label={pageTitle} />

        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
              <p className="mt-2 text-muted-foreground">{pageDescription}</p>
            </div>

            {roleFilter === "FREELANCER" ? (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => navigate("/admin/approvals")}>
                  Approvals
                </Button>
                <Button variant="outline" onClick={() => navigate("/admin/freelancer-limits")}>
                  Project Limits
                </Button>
                <Button variant="outline" onClick={() => navigate("/admin/freelancer-onboarding")}>
                  Onboarding
                </Button>
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {summaryCards.map((card) => (
              <Card key={card.key}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-semibold ${card.tone}`}>
                    {summaryLoading ? "--" : card.value}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {STATUS_FILTERS.map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`Search ${pageTitle.toLowerCase()}...`}
                  className="pl-8"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <Button variant="outline" onClick={() => void refreshCurrentView()}>
                Refresh
              </Button>
            </div>
          </div>

          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role / Type</TableHead>
                  {showFreelancerColumns ? (
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
                    <TableCell colSpan={showFreelancerColumns ? 6 : 5} className="h-24 text-center">
                      {error || `No ${pageTitle.toLowerCase()} found for this filter.`}
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => {
                    const displayStatus = getDisplayStatus(user);
                    const fp = user.freelancerProfile || {};
                    const progressObj = fp?.serviceDetails?.__profileDetails?.onboardingProgress || fp?.serviceDetails?.onboardingProgress || user?.profileDetails?.onboardingProgress || {};
                    const isComplete = Boolean(user.onboardingComplete || progressObj?.isCompleted);
                    const stepId = progressObj.currentStep || (isComplete ? "completed" : "welcome");
                    const stepTitle = progressObj.currentStepTitle || stepId;
                    const percentage = isComplete ? 100 : (Number(progressObj.progressPercentage) || (stepId === "welcome" ? 10 : 35));
                    const servicesList = Array.isArray(fp.services) ? fp.services : [];
                    const primaryService = servicesList[0] ? String(servicesList[0]).replace(/[_-]+/g, " ") : "Not set";
                    const lastActiveDate = progressObj.lastActiveAt || fp.updatedAt || user.updatedAt || user.createdAt;

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
                              <p className="font-medium text-sm truncate">{user.fullName}</p>
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

                        {showFreelancerColumns ? (
                          <>
                            {/* Onboarding Phase & Real-Time Drop-off */}
                            <TableCell className="min-w-[200px]">
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-medium capitalize text-foreground">
                                    {stepTitle}
                                  </span>
                                  <span className="text-muted-foreground font-mono font-semibold">
                                    {percentage}%
                                  </span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                  <div
                                    className={`h-full transition-all duration-300 ${
                                      isComplete
                                        ? "bg-emerald-500"
                                        : percentage > 50
                                          ? "bg-blue-500"
                                          : "bg-amber-500"
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
                                    {isComplete ? "Onboarded" : `Backed up at ${stepId}`}
                                  </Badge>
                                </div>
                              </div>
                            </TableCell>

                            {/* Primary Service & Skills */}
                            <TableCell className="max-w-[200px]">
                              <div className="space-y-1">
                                <p className="text-xs font-medium capitalize text-foreground truncate">
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
                            <p className="text-foreground">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </p>
                            {lastActiveDate ? (
                              <p className="text-[11px] text-muted-foreground">
                                Active {new Date(lastActiveDate).toLocaleDateString()}
                              </p>
                            ) : null}
                          </div>
                        </TableCell>

                        {/* Action: Clean View Details */}
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

          <div className="flex flex-col gap-3 rounded-lg border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {pageStart}-{pageEnd} of {pagination.total} {pageTitle.toLowerCase()}.
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 1))}
              >
                Previous
              </Button>
              <span className="min-w-24 text-center text-sm text-muted-foreground">
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
