import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { useAuth } from "@/shared/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import Check from "lucide-react/dist/esm/icons/check";
import DollarSign from "lucide-react/dist/esm/icons/dollar-sign";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import ShieldAlert from "lucide-react/dist/esm/icons/shield-alert";
import Users from "lucide-react/dist/esm/icons/users";
import Wallet from "lucide-react/dist/esm/icons/wallet";
import AdminLayout from "./AdminLayout";
import { AdminTopBar } from "./AdminTopBar";

const formatINR = (value) =>
  `INR ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const getRecentMonthKeys = (count = 6) => {
  const keys = [];
  const now = new Date();

  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    keys.push(key);
  }
  return keys;
};

const monthLabelFromKey = (key) => {
  const [year, month] = key.split("-").map(Number);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString("en-IN", { month: "short" });
};

const toMonthKey = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const AdminDashboard = () => {
  const { authFetch } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    totalProposals: 0,
    totalRevenue: 0,
  });
  const [allProjects, setAllProjects] = useState([]);
  const [allDisputes, setAllDisputes] = useState([]);
  const [recentDisputes, setRecentDisputes] = useState([]);
  const [recentFreelancers, setRecentFreelancers] = useState([]);
  const [pendingFreelancers, setPendingFreelancers] = useState([]);
  const [recentClients, setRecentClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [overrideLoadingId, setOverrideLoadingId] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, disputesRes, freelancersRes, clientsRes, projectsRes] = await Promise.all([
        authFetch("/admin/stats"),
        authFetch("/disputes"),
        authFetch("/admin/users?role=FREELANCER"),
        authFetch("/admin/users?role=CLIENT"),
        authFetch("/admin/projects"),
      ]);

      const statsData = await statsRes.json().catch(() => null);
      const disputesData = await disputesRes.json().catch(() => null);
      const freelancersData = await freelancersRes.json().catch(() => null);
      const clientsData = await clientsRes.json().catch(() => null);
      const projectsData = await projectsRes.json().catch(() => null);

      if (statsData?.data?.stats) {
        setStats(statsData.data.stats);
      }

      if (Array.isArray(disputesData?.data)) {
        const all = disputesData.data;
        setAllDisputes(all);
        setRecentDisputes(all.filter((d) => d.status !== "RESOLVED").slice(0, 6));
      }

      if (Array.isArray(projectsData?.data?.projects)) {
        setAllProjects(projectsData.data.projects);
      }

      if (Array.isArray(freelancersData?.data?.users)) {
        const activeFreelancers = freelancersData.data.users.filter((u) => u.status === "ACTIVE");
        const pending = freelancersData.data.users.filter((u) => u.status === "PENDING_APPROVAL");
        setRecentFreelancers(activeFreelancers.slice(0, 4));
        setPendingFreelancers(pending);
      }

      if (Array.isArray(clientsData?.data?.users)) {
        const activeClients = clientsData.data.users.filter((u) => u.status === "ACTIVE");
        setRecentClients(activeClients.slice(0, 4));
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to load admin dashboard data");
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleApproveUser = async (userId) => {
    try {
      const response = await authFetch(`/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });

      if (!response.ok) {
        toast.error("Failed to approve user");
        return;
      }

      setPendingFreelancers((prev) => prev.filter((u) => u.id !== userId));
      toast.success("Freelancer approved");
    } catch (error) {
      console.error("Failed to approve user:", error);
      toast.error("Failed to approve user");
    }
  };

  const financialSummary = useMemo(() => {
    const grossVolume = Number(stats.totalRevenue || 0);
    const platformRevenue = Math.round(grossVolume * 0.3);

    const escrowStatuses = new Set(["OPEN", "IN_PROGRESS", "AWAITING_PAYMENT", "PAUSED"]);
    const escrowLocked = allProjects
      .filter((project) => escrowStatuses.has(String(project?.status || "").toUpperCase()))
      .reduce((sum, project) => sum + Number(project?.budget || 0), 0);

    const activeDisputeLiability = allDisputes
      .filter((dispute) => dispute?.status !== "RESOLVED")
      .reduce((sum, dispute) => sum + Number(dispute?.project?.budget || 0), 0);

    return {
      grossVolume,
      platformRevenue,
      escrowLocked,
      activeDisputeLiability,
    };
  }, [allDisputes, allProjects, stats.totalRevenue]);

  const trendData = useMemo(() => {
    const monthKeys = getRecentMonthKeys(6);
    const map = new Map(
      monthKeys.map((key) => [
        key,
        {
          month: monthLabelFromKey(key),
          projectVolume: 0,
          grossVolume: 0,
          platformFees: 0,
        },
      ])
    );

    allProjects.forEach((project) => {
      const key = toMonthKey(project?.createdAt);
      if (!key || !map.has(key)) return;
      const row = map.get(key);
      const budget = Number(project?.budget || 0);
      row.projectVolume += 1;
      row.grossVolume += budget;
      row.platformFees = Math.round(row.grossVolume * 0.3);
      map.set(key, row);
    });

    return monthKeys.map((key) => map.get(key));
  }, [allProjects]);

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      description: "Active users on platform",
    },
    {
      title: "Projects Posted",
      value: stats.totalProjects,
      icon: Briefcase,
      description: "Total projects created",
    },
    {
      title: "Proposals Sent",
      value: stats.totalProposals,
      icon: FileText,
      description: "Total proposals submitted",
    },
    {
      title: "Total Revenue",
      value: formatINR(stats.totalRevenue),
      icon: DollarSign,
      description: "Amount paid by clients",
    },
  ];

  const financeCards = [
    {
      title: "Gross Volume",
      value: formatINR(financialSummary.grossVolume),
      icon: Wallet,
      description: "Total transaction volume",
    },
    {
      title: "Platform Revenue (30%)",
      value: formatINR(financialSummary.platformRevenue),
      icon: DollarSign,
      description: "Estimated fee collection",
    },
    {
      title: "Funds in Escrow",
      value: formatINR(financialSummary.escrowLocked),
      icon: Wallet,
      description: "Budget tied to active projects",
    },
    {
      title: "Active Dispute Liability",
      value: formatINR(financialSummary.activeDisputeLiability),
      icon: ShieldAlert,
      description: "Exposure on unresolved disputes",
    },
  ];

  const getDisputeStatusBadge = (status) => {
    const colors = {
      OPEN: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      IN_PROGRESS: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      RESOLVED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    };
    return <Badge className={`${colors[status] || "bg-gray-100"} border-0`}>{status}</Badge>;
  };

  const resolveDisputeWithNote = async (disputeId, note) => {
    const patchRes = await authFetch(`/disputes/${disputeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "RESOLVED",
        resolutionNotes: note,
      }),
    });

    return patchRes.ok;
  };

  const handleForcePayout = async (dispute) => {
    setOverrideLoadingId(dispute.id);
    try {
      const acceptedProposal =
        dispute?.project?.proposals?.find((proposal) => proposal?.status === "ACCEPTED") ||
        dispute?.project?.proposals?.[0];
      const freelancerId = acceptedProposal?.freelancerId || acceptedProposal?.freelancer?.id;
      const amount = Number(acceptedProposal?.amount || dispute?.project?.budget || 0);

      if (!freelancerId || amount <= 0) {
        const done = await resolveDisputeWithNote(
          dispute.id,
          "[ADMIN_OVERRIDE] FORCE_PAYOUT requested but payout payload was incomplete."
        );
        if (done) {
          toast.success("Dispute resolved with override note");
          await fetchDashboardData();
        } else {
          toast.error("Unable to resolve dispute");
        }
        return;
      }

      const createRes = await authFetch("/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: dispute.projectId,
          freelancerId,
          amount,
          description: `Force payout by admin for dispute ${dispute.id}`,
        }),
      });

      if (!createRes.ok) {
        toast.error("Failed to create payout payment");
        return;
      }

      const createData = await createRes.json().catch(() => null);
      const paymentId = createData?.data?.id;

      if (paymentId) {
        await authFetch(`/payments/${paymentId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "COMPLETED" }),
        });
      }

      await resolveDisputeWithNote(
        dispute.id,
        `[ADMIN_OVERRIDE] FORCE_PAYOUT executed. Payment ${paymentId || "created"} marked for payout.`
      );
      toast.success("Force payout completed");
      await fetchDashboardData();
    } catch (error) {
      console.error("Force payout failed:", error);
      toast.error("Force payout failed");
    } finally {
      setOverrideLoadingId(null);
    }
  };

  const handleForceRefund = async (dispute) => {
    setOverrideLoadingId(dispute.id);
    try {
      const paymentRes = await authFetch(`/payments/project/${dispute.projectId}`);
      let refunded = false;

      if (paymentRes.ok) {
        const paymentData = await paymentRes.json().catch(() => null);
        const payments = Array.isArray(paymentData?.data) ? paymentData.data : [];
        const latestPaid =
          payments.find((payment) => payment.status === "COMPLETED") ||
          payments.find((payment) => payment.status === "PROCESSING") ||
          payments.find((payment) => payment.status === "PENDING");

        if (latestPaid?.id) {
          const refundRes = await authFetch(`/payments/${latestPaid.id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "REFUNDED" }),
          });
          refunded = refundRes.ok;
        }
      }

      const note = refunded
        ? "[ADMIN_OVERRIDE] FORCE_REFUND_CLIENT executed and payment marked REFUNDED."
        : "[ADMIN_OVERRIDE] FORCE_REFUND_CLIENT requested. No eligible payment record was found.";

      const resolved = await resolveDisputeWithNote(dispute.id, note);
      if (resolved) {
        toast.success(refunded ? "Client refund override executed" : "Dispute resolved with refund override note");
        await fetchDashboardData();
      } else {
        toast.error("Unable to resolve dispute");
      }
    } catch (error) {
      console.error("Force refund failed:", error);
      toast.error("Force refund failed");
    } finally {
      setOverrideLoadingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="relative flex flex-col gap-6 p-6">
        <AdminTopBar label="Dashboard" />

        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="mt-2 text-muted-foreground">Overview of your platform performance.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? <div className="h-8 w-24 animate-pulse rounded bg-muted" /> : stat.value}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {financeCards.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? <div className="h-8 w-24 animate-pulse rounded bg-muted" /> : stat.value}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Gross Volume vs Platform Fees</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="grossFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="feeFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatINR(value)} />
                    <Legend />
                    <Area type="monotone" dataKey="grossVolume" name="Gross Volume" stroke="#10b981" fill="url(#grossFill)" />
                    <Area type="monotone" dataKey="platformFees" name="Platform Fees" stroke="#3b82f6" fill="url(#feeFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Volume Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="projectVolume" name="Projects" stroke="#f59e0b" strokeWidth={2} />
                    <Line type="monotone" dataKey="platformFees" name="Fee Collection (Est.)" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {pendingFreelancers.length > 0 && (
              <Card className="border-yellow-500/50 bg-yellow-500/5 md:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                    <AlertTriangle className="h-5 w-5" />
                    Pending Approvals
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-yellow-700 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300"
                    onClick={() => navigate("/admin/approvals")}
                  >
                    See More
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {pendingFreelancers.map((user) => (
                      <div
                        key={user.id}
                        className="flex cursor-pointer items-center justify-between rounded-lg border bg-background p-4 transition-colors hover:border-yellow-500/50"
                        onClick={() => navigate(`/admin/users/${user.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted font-bold">
                            {user.fullName.charAt(0)}
                          </div>
                          <div className="overflow-hidden">
                            <p className="truncate font-medium">{user.fullName}</p>
                            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApproveUser(user.id);
                          }}
                        >
                          <Check className="mr-1 h-4 w-4" /> Approve
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Dispute Command Center</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Active disputes and admin override controls for emergency resolution.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate("/admin/project-managers")}>
                  See More
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project</TableHead>
                        <TableHead>Raised By</TableHead>
                        <TableHead>Issue</TableHead>
                        <TableHead>Manager</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Overrides</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        [...Array(3)].map((_, i) => (
                          <TableRow key={i}>
                            <TableCell><div className="h-4 w-32 animate-pulse rounded bg-muted" /></TableCell>
                            <TableCell><div className="h-4 w-24 animate-pulse rounded bg-muted" /></TableCell>
                            <TableCell><div className="h-4 w-48 animate-pulse rounded bg-muted" /></TableCell>
                            <TableCell><div className="h-4 w-24 animate-pulse rounded bg-muted" /></TableCell>
                            <TableCell><div className="h-4 w-16 animate-pulse rounded bg-muted" /></TableCell>
                            <TableCell><div className="ml-auto h-4 w-28 animate-pulse rounded bg-muted" /></TableCell>
                          </TableRow>
                        ))
                      ) : recentDisputes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                            No active disputes found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        recentDisputes.map((dispute) => (
                          <TableRow key={dispute.id}>
                            <TableCell className="font-medium">{dispute.project?.title || "Unknown"}</TableCell>
                            <TableCell>{dispute.raisedBy?.fullName}</TableCell>
                            <TableCell className="max-w-[220px] truncate text-muted-foreground">
                              {dispute.description}
                            </TableCell>
                            <TableCell>
                              {dispute.manager ? (
                                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                  {dispute.manager.fullName}
                                </span>
                              ) : (
                                <span className="italic text-muted-foreground">Unassigned</span>
                              )}
                            </TableCell>
                            <TableCell>{getDisputeStatusBadge(dispute.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs"
                                  disabled={overrideLoadingId === dispute.id}
                                  onClick={() => handleForceRefund(dispute)}
                                >
                                  {overrideLoadingId === dispute.id ? (
                                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                                  ) : null}
                                  Force Refund
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-8 bg-emerald-600 text-xs hover:bg-emerald-700"
                                  disabled={overrideLoadingId === dispute.id}
                                  onClick={() => handleForcePayout(dispute)}
                                >
                                  {overrideLoadingId === dispute.id ? (
                                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                                  ) : null}
                                  Force Payout
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

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Active Freelancers</CardTitle>
                  <p className="text-sm text-muted-foreground">Recently active freelancers</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate("/admin/freelancers")}>
                  See More
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    [...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                        </div>
                      </div>
                    ))
                  ) : recentFreelancers.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">No freelancers found.</div>
                  ) : (
                    recentFreelancers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                            {user.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{user.fullName}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div
                          className={`rounded-full px-2 py-1 text-xs ${
                            user.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}
                        >
                          {user.status}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Active Clients</CardTitle>
                  <p className="text-sm text-muted-foreground">Recently active clients</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate("/admin/clients")}>
                  See More
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    [...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                        </div>
                      </div>
                    ))
                  ) : recentClients.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">No clients found.</div>
                  ) : (
                    recentClients.map((user) => (
                      <div key={user.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                            {user.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{user.fullName}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div
                          className={`rounded-full px-2 py-1 text-xs ${
                            user.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}
                        >
                          {user.status}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
