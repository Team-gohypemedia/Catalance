import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/shared/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Activity from "lucide-react/dist/esm/icons/activity";
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import Bot from "lucide-react/dist/esm/icons/bot";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import Check from "lucide-react/dist/esm/icons/check";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import DollarSign from "lucide-react/dist/esm/icons/dollar-sign";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Mail from "lucide-react/dist/esm/icons/mail";
import MessageSquare from "lucide-react/dist/esm/icons/message-square";
import Newspaper from "lucide-react/dist/esm/icons/newspaper";
import ShieldAlert from "lucide-react/dist/esm/icons/shield-alert";
import UserCheck from "lucide-react/dist/esm/icons/user-check";
import User from "lucide-react/dist/esm/icons/user";
import Users from "lucide-react/dist/esm/icons/users";
import AdminLayout from "./AdminLayout";
import { AdminTopBar } from "./AdminTopBar";

const formatINR = (value) =>
  `INR ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const formatCount = (value) => Number(value || 0).toLocaleString("en-IN");

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const extractUsers = (payload) =>
  Array.isArray(payload?.data?.users) ? payload.data.users : [];

const AdminDashboard = () => {
  const { authFetch } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    totalProposals: 0,
    totalRevenue: 0,
  });
  const [freelancerCount, setFreelancerCount] = useState(0);
  const [clientCount, setClientCount] = useState(0);
  const [aiUsageOverview, setAiUsageOverview] = useState(null);
  const [activeProjectsCount, setActiveProjectsCount] = useState(0);

  const [recentUsers, setRecentUsers] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);
  const [pendingFreelancers, setPendingFreelancers] = useState([]);
  const [activeDisputes, setActiveDisputes] = useState([]);
  const [contactInquiries, setContactInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        statsRes,
        pendingRes,
        disputesRes,
        inquiriesRes,
        freelancersRes,
        clientsRes,
        aiUsageRes,
        projectsRes,
      ] = await Promise.all([
        authFetch("/admin/stats"),
        authFetch("/admin/users?role=FREELANCER&status=PENDING_APPROVAL&limit=10"),
        authFetch("/disputes"),
        authFetch("/admin/contact-inquiries?limit=5"),
        authFetch("/admin/users?role=FREELANCER&limit=1"),
        authFetch("/admin/users?role=CLIENT&limit=1"),
        authFetch("/admin/ai-usage/summary?days=30&limit=1"),
        authFetch("/admin/projects"),
      ]);

      const statsData = await statsRes.json().catch(() => null);
      const pendingData = await pendingRes.json().catch(() => null);
      const disputesData = await disputesRes.json().catch(() => null);
      const inquiriesData = await inquiriesRes.json().catch(() => null);
      const freelancersData = await freelancersRes.json().catch(() => null);
      const clientsData = await clientsRes.json().catch(() => null);
      const aiUsageData = await aiUsageRes.json().catch(() => null);
      const projectsData = await projectsRes.json().catch(() => null);

      if (statsData?.data) {
        if (statsData.data.stats) setStats(statsData.data.stats);
        if (Array.isArray(statsData.data.recentUsers)) setRecentUsers(statsData.data.recentUsers.slice(0, 5));
        if (Array.isArray(statsData.data.recentProjects)) setRecentProjects(statsData.data.recentProjects.slice(0, 5));
      }

      setPendingFreelancers(extractUsers(pendingData));

      if (Array.isArray(disputesData?.data)) {
        setActiveDisputes(disputesData.data.filter((d) => d.status !== "RESOLVED").slice(0, 5));
      }

      if (Array.isArray(inquiriesData?.data?.inquiries)) {
        setContactInquiries(inquiriesData.data.inquiries.slice(0, 5));
      }

      if (freelancersData?.data?.pagination?.total !== undefined) {
        setFreelancerCount(freelancersData.data.pagination.total);
      }

      if (clientsData?.data?.pagination?.total !== undefined) {
        setClientCount(clientsData.data.pagination.total);
      }

      if (aiUsageData?.data?.overview) {
        setAiUsageOverview(aiUsageData.data.overview);
      }

      if (Array.isArray(projectsData?.data?.projects)) {
        const activeCount = projectsData.data.projects.filter((p) =>
          ["OPEN", "IN_PROGRESS", "ASSIGNED"].includes(String(p.status || "").toUpperCase())
        ).length;
        setActiveProjectsCount(activeCount);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to load dashboard statistics");
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

      toast.success("Freelancer approved successfully");
      await fetchDashboardData();
    } catch (error) {
      console.error("Failed to approve user:", error);
      toast.error("Failed to approve user");
    }
  };

  const primaryStatCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      description: "Registered platform users",
      link: "/admin/users",
      actionLabel: "Manage Users",
    },
    {
      title: "Projects Posted",
      value: stats.totalProjects,
      icon: Briefcase,
      description: "Total projects created",
      link: "/admin/projects",
      actionLabel: "View Projects",
    },
    {
      title: "Proposals Sent",
      value: stats.totalProposals,
      icon: FileText,
      description: "Submitted proposals",
      link: "/admin/projects",
      actionLabel: "View Activity",
    },
    {
      title: "Total Revenue",
      value: formatINR(stats.totalRevenue),
      icon: DollarSign,
      description: "Gross completed payments",
      link: "/admin/payout-requests",
      actionLabel: "Payout Requests",
    },
  ];

  const secondaryStatCards = [
    {
      title: "Total Clients",
      value: clientCount,
      icon: Users,
      description: "Registered client accounts",
      link: "/admin/clients",
    },
    {
      title: "Total Freelancers",
      value: freelancerCount,
      icon: User,
      description: "Registered freelancer accounts",
      link: "/admin/freelancers",
    },
    {
      title: "Active Open Projects",
      value: activeProjectsCount,
      icon: Activity,
      description: "Projects currently active",
      link: "/admin/projects",
    },
    {
      title: "AI Calls (30d)",
      value: formatCount(aiUsageOverview?.totalCalls || 0),
      icon: Bot,
      description: `${formatCount(aiUsageOverview?.totalTokens || 0)} tokens tracked`,
      link: "/admin/ai-usage",
    },
  ];

  const quickNavModules = [
    {
      title: "Payout Requests",
      description: "Review and approve freelancer withdrawal requests",
      icon: CreditCard,
      link: "/admin/payout-requests",
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400",
    },
    {
      title: "User Management",
      description: "Manage clients, freelancers, roles & limits",
      icon: Users,
      link: "/admin/users",
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400",
    },
    {
      title: "Projects & Services",
      description: "Oversee project postings & service catalog",
      icon: Briefcase,
      link: "/admin/projects",
      color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400",
    },
    {
      title: "Dispute Center",
      description: "Resolve client-freelancer project disputes",
      icon: ShieldAlert,
      link: "/admin/disputes",
      color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400",
    },
    {
      title: "AI Intelligence",
      description: "Track AI token usage, costs, and calls",
      icon: Bot,
      link: "/admin/ai-usage",
      color: "text-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400",
    },
    {
      title: "Contact Inquiries",
      description: "View messages sent from the public website",
      icon: Mail,
      link: "/admin/contact-inquiries",
      color: "text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400",
    },
    {
      title: "Blogs & SEO",
      description: "Manage public blogs and SEO content",
      icon: Newspaper,
      link: "/admin/blogs",
      color: "text-teal-600 bg-teal-50 dark:bg-teal-950/40 dark:text-teal-400",
    },
    {
      title: "WhatsApp Inbox",
      description: "Monitor WhatsApp chats & campaign analytics",
      icon: MessageSquare,
      link: "/admin/whatsapp-inbox",
      color: "text-green-600 bg-green-50 dark:bg-green-950/40 dark:text-green-400",
    },
  ];

  return (
    <AdminLayout>
      <div className="relative flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
        <AdminTopBar label="Dashboard" />

        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-5">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
              <p className="mt-1 text-muted-foreground">
                Real-time platform overview and system management shortcuts.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate("/admin/payout-requests")}
                className="h-10 rounded-lg bg-emerald-600 font-semibold text-white hover:bg-emerald-700 shadow-sm"
              >
                <CreditCard className="mr-2 h-4 w-4" /> Payout Requests
              </Button>
            </div>
          </div>

          {/* Primary Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {primaryStatCards.map((stat) => (
              <Card key={stat.title} className="hover:border-primary/30 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <div className="p-2 rounded-lg bg-muted">
                    <stat.icon className="h-4 w-4 text-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="text-2xl font-bold">
                    {loading ? <div className="h-8 w-24 animate-pulse rounded bg-muted" /> : stat.value}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                    <button
                      onClick={() => navigate(stat.link)}
                      className="text-xs font-medium text-primary hover:underline flex items-center gap-0.5"
                    >
                      {stat.actionLabel} <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Platform Breakdown Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {secondaryStatCards.map((stat) => (
              <Card
                key={stat.title}
                onClick={() => navigate(stat.link)}
                className="cursor-pointer hover:border-primary/40 hover:shadow-xs transition-all border-border/70"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="pt-1">
                  <div className="text-xl font-bold">
                    {loading ? <div className="h-7 w-20 animate-pulse rounded bg-muted" /> : stat.value}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Navigation Hub */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Quick Navigation</h2>
              <p className="text-sm text-muted-foreground">Direct links to access any admin portal module</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {quickNavModules.map((item) => (
                <Card
                  key={item.title}
                  onClick={() => navigate(item.link)}
                  className="group cursor-pointer hover:border-primary/50 hover:shadow-md transition-all border-border/80"
                >
                  <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                    <div className="flex items-start justify-between">
                      <div className={`p-2.5 rounded-xl ${item.color}`}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Platform Activity */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Recent Users */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-lg">Recent Registered Users</CardTitle>
                  <CardDescription>Latest users joined on platform</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate("/admin/users")}>
                  View All <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-12 animate-pulse rounded bg-muted" />
                    ))}
                  </div>
                ) : recentUsers.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">No recent users.</div>
                ) : (
                  <div className="divide-y border-t border-b">
                    {recentUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary text-sm">
                            {user.fullName?.charAt(0) || "U"}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-sm">{user.fullName}</p>
                            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className="text-xs">
                            {user.role}
                          </Badge>
                          <span className="text-xs text-muted-foreground hidden sm:inline">
                            {formatDate(user.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Projects */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-lg">Recent Projects</CardTitle>
                  <CardDescription>Latest projects posted by clients</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate("/admin/projects")}>
                  View All <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-12 animate-pulse rounded bg-muted" />
                    ))}
                  </div>
                ) : recentProjects.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">No recent projects.</div>
                ) : (
                  <div className="divide-y border-t border-b">
                    {recentProjects.map((project) => (
                      <div key={project.id} className="flex items-center justify-between py-3">
                        <div className="min-w-0 mr-2">
                          <p className="truncate font-medium text-sm">{project.title}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            By {project.owner?.fullName || "Client"} • {formatINR(project.budget)}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className="shrink-0 text-xs uppercase text-[10px]"
                        >
                          {project.status || "OPEN"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Action Summaries: Active Disputes & Contact Inquiries */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Active Disputes Summary */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-amber-600" /> Active Disputes
                  </CardTitle>
                  <CardDescription>Disputes requiring admin mediation</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate("/admin/disputes")}>
                  Open Disputes Center
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-20 animate-pulse rounded bg-muted" />
                ) : activeDisputes.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
                    No active disputes requiring resolution.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeDisputes.map((dispute) => (
                      <div key={dispute.id} className="rounded-lg border p-3 flex items-center justify-between">
                        <div className="min-w-0 mr-3">
                          <p className="font-medium text-sm truncate">{dispute.project?.title || "Project Dispute"}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            Raised by {dispute.raisedBy?.fullName || "User"}: {dispute.description}
                          </p>
                        </div>
                        <Badge variant="destructive" className="shrink-0 text-xs">
                          {dispute.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Contact Inquiries */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-600" /> Recent Contact Messages
                  </CardTitle>
                  <CardDescription>Inquiries sent from public website</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate("/admin/contact-inquiries")}>
                  View All Messages
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-20 animate-pulse rounded bg-muted" />
                ) : contactInquiries.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
                    No contact inquiries submitted yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {contactInquiries.map((inquiry) => (
                      <div key={inquiry.id} className="rounded-lg border p-3 flex items-center justify-between">
                        <div className="min-w-0 mr-3">
                          <p className="font-medium text-sm truncate">{inquiry.subject}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            From {inquiry.name} ({inquiry.email})
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDate(inquiry.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pending Approvals Section (MOVED TO BOTTOM AS REQUESTED) */}
          <Card className="border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-400 text-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Freelancers Awaiting Approval
                  {pendingFreelancers.length > 0 && (
                    <Badge variant="secondary" className="bg-amber-200 text-amber-900 font-bold ml-2">
                      {pendingFreelancers.length}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-amber-700/80 dark:text-amber-400/80">
                  Review new freelancer registrations and enable their platform profiles.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-amber-300 text-amber-800 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/40"
                onClick={() => navigate("/admin/approvals")}
              >
                View Full Approvals Queue <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-20 animate-pulse rounded bg-muted" />
              ) : pendingFreelancers.length === 0 ? (
                <div className="py-6 text-center text-sm text-amber-800/70 dark:text-amber-400/70 border border-dashed border-amber-300 rounded-lg">
                  No freelancers currently awaiting approval.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {pendingFreelancers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between rounded-md border border-amber-200 bg-background p-3 shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0 mr-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 font-bold text-amber-800 text-sm">
                          {user.fullName?.charAt(0) || "U"}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{user.fullName}</p>
                          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="shrink-0 bg-green-600 hover:bg-green-700 h-8 text-xs"
                        onClick={() => handleApproveUser(user.id)}
                      >
                        <Check className="mr-1 h-3.5 w-3.5" /> Approve
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
