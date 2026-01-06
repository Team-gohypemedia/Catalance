import React, { useEffect, useMemo, useState } from "react";
import {
  LayoutGrid,
  FolderOpen,
  CreditCard,
  Users,
  Settings,
  Search,
  Bell,
  TrendingUp,
  PieChart,
  CheckCircle,
  ArrowRight,
  MoreHorizontal,
  Plus,
  Filter,
  ChevronRight,
  Clock,
  Briefcase,
  Sparkles,
  Banknote,
  Sun,
  Moon,
  Menu,
  X,
  Gavel,
  MessageSquare,
  Video,
} from "lucide-react";
import { RoleAwareSidebar } from "@/components/dashboard/RoleAwareSidebar";
import { getSession } from "@/lib/auth-storage";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { SuspensionAlert } from "@/components/ui/suspension-alert";
import { useTheme } from "@/components/theme-provider";
import { useNotifications } from "@/context/NotificationContext";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSidebar } from "@/components/ui/sidebar";

export const DashboardContent = ({ roleOverride }) => {
  const [sessionUser, setSessionUser] = useState(null);
  const { authFetch } = useAuth();
  const [metrics, setMetrics] = useState({
    activeProjects: 0,
    proposalsReceived: 0,
    acceptedProposals: [],
    pendingProposals: [],
    earnings: 0,
    receivedEarnings: 0,
    pendingEarnings: 0,
    totalProposals: 0,
  });
  const [upcomingMeeting, setUpcomingMeeting] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuspensionAlert, setShowSuspensionAlert] = useState(false);
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const { toggleSidebar } = useSidebar();

  useEffect(() => {
    const session = getSession();
    setSessionUser(session?.user ?? null);

    if (session?.user?.status === "SUSPENDED") {
      setShowSuspensionAlert(true);
    }
  }, []);

  useEffect(() => {
    const loadMetrics = async () => {
      if (!authFetch) return;
      setIsLoading(true);
      try {
        const response = await authFetch("/proposals?as=freelancer");
        const payload = await response.json().catch(() => null);
        const list = Array.isArray(payload?.data) ? payload.data : [];

        const pending = list.filter(
          (p) => (p.status || "").toUpperCase() === "PENDING"
        );
        const accepted = list.filter(
          (p) => (p.status || "").toUpperCase() === "ACCEPTED"
        );

        let totalReceived = 0;
        let totalPending = 0;

        accepted.forEach((p) => {
          const amount = Number(p.amount) || 0;
          const spent = Number(p.project?.spent) || 0;
          const status = p.project?.status || "";

          // Reverting to strict logic: Only count as 'Received' if project is COMPLETED.
          // Even if client paid upfront (spent > 0), it's not "Received" by freelancer until completion.
          let paidAmount = 0;
          if (status === "COMPLETED") {
            paidAmount = amount;
          }

          totalReceived += paidAmount;
          totalPending += Math.max(0, amount - paidAmount);
        });

        console.log(
          "DEBUG: Accepted Proposals:",
          accepted.map((p) => ({
            id: p.id,
            amount: p.amount,
            projectSpent: p.project?.spent,
            projectStatus: p.project?.status,
          }))
        );
        console.log(
          "DEBUG: totalReceived:",
          totalReceived,
          "totalPending:",
          totalPending
        );

        // Freelancer 70% share of the calculated amounts
        const receivedEarnings = Math.round(totalReceived * 0.7);
        const pendingEarnings = Math.round(totalPending * 0.7);
        const totalEarnings = receivedEarnings + pendingEarnings;

        setMetrics({
          activeProjects: accepted.length,
          proposalsReceived: pending.length,
          acceptedProposals: accepted,
          pendingProposals: pending,
          earnings: totalEarnings,
          receivedEarnings,
          pendingEarnings,
          totalProposals: list.length,
        });
      } catch (error) {
        console.error("Failed to load freelancer metrics", error);
      } finally {
        setIsLoading(false);
      }
    };

    const loadAppointments = async () => {
      if (!authFetch) return;
      try {
        const today = new Date().toISOString().split("T")[0];
        // Fetch APPROVED appointments from today onwards
        const res = await authFetch(
          `/appointments?status=APPROVED&startDate=${today}`
        );
        const data = await res.json();

        if (data?.data && Array.isArray(data.data)) {
          // Find the first future meeting
          const now = new Date();
          const future = data.data
            .map((a) => ({
              ...a,
              dateObj: new Date(
                `${a.date.split("T")[0]}T${a.startHour
                  .toString()
                  .padStart(2, "0")}:00:00`
              ),
            }))
            .filter((a) => a.dateObj > now)
            .sort((a, b) => a.dateObj - b.dateObj);

          if (future.length > 0) {
            setUpcomingMeeting(future[0]);
          } else {
            setUpcomingMeeting(null);
          }
        }
      } catch (err) {
        console.error("Failed to load appointments:", err);
      }
    };

    loadMetrics();
    loadAppointments();
  }, [authFetch]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.type === "chat" && notification.data) {
      const service = notification.data.service || "";
      const parts = service.split(":");
      let projectId = notification.data.projectId;
      if (!projectId && parts.length >= 4 && parts[0] === "CHAT") {
        projectId = parts[1];
      }
      navigate(
        projectId
          ? `/freelancer/messages?projectId=${projectId}`
          : "/freelancer/messages"
      );
    } else if (notification.type === "proposal") {
      navigate("/freelancer/proposals");
    }
  };

  return (
    <div className="flex-1 flex flex-col relative h-full overflow-hidden bg-zinc-50 dark:bg-black transition-colors duration-300">
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-[0.08]"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      ></div>

      <SuspensionAlert
        open={showSuspensionAlert}
        onOpenChange={setShowSuspensionAlert}
        suspendedAt={sessionUser?.suspendedAt}
      />

      {/* Glass Header */}
      <header className="sticky top-0 z-40 px-6 py-4 flex items-center justify-between transition-colors duration-300 border-b border-border/40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-zinc-900/60">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="lg:hidden text-muted-foreground"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <h2 className="text-xl font-bold tracking-tight text-foreground hidden md:block">
            Freelancer<span className="text-primary font-normal">OS</span>
          </h2>
          <div className="h-6 w-px bg-border hidden md:block"></div>

          {/* Search Bar - Visual only for now */}
          <div className="relative group hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 group-focus-within:text-primary transition-colors" />
            <input
              className="bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-2 text-sm w-64 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-background transition-all placeholder:text-muted-foreground outline-none"
              placeholder="Search projects..."
              type="text"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground hover:text-foreground"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-full text-muted-foreground hover:text-foreground"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 h-2 w-2 bg-primary rounded-full ring-2 ring-background"></span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h4 className="text-sm font-semibold">Notifications</h4>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-xs text-primary"
                    onClick={markAllAsRead}
                  >
                    Mark all as read
                  </Button>
                )}
              </div>
              <ScrollArea className="h-72">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                    <Bell className="mb-2 h-8 w-8 opacity-40" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.slice(0, 20).map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-muted/50 ${
                          !notification.read ? "bg-primary/5" : ""
                        }`}
                      >
                        <div
                          className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                            !notification.read ? "bg-primary" : "bg-transparent"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {/* Profile */}
          <div
            className="text-right hidden sm:block cursor-pointer"
            onClick={() => navigate("/freelancer/profile")}
          >
            <p className="text-sm font-bold text-foreground leading-none">
              {sessionUser?.fullName || "Freelancer"}
            </p>
            <p className="text-xs text-muted-foreground">Frontend Developer</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-10 z-10 relative scroll-smooth">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column (Stats + Pipeline + Table) */}
            <div className="flex-1 min-w-0 flex flex-col gap-8">
              {/* Page Title */}
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-foreground mb-2">
                    Dashboard
                  </h1>
                  <p className="text-muted-foreground font-medium">
                    Overview of your freelance activity.
                  </p>
                </div>
                <div className="hidden sm:flex gap-2">
                  <Badge
                    variant="outline"
                    className="px-3 py-1 rounded-full bg-primary/10 text-primary-dark border-primary/20 gap-1.5 font-bold"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                    Live Updates
                  </Badge>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Total Earnings */}
                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-[100px] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                  <div className="relative z-10">
                    <p className="text-muted-foreground text-sm font-bold mb-1 uppercase tracking-wide">
                      Total Amount
                    </p>
                    <h3 className="text-3xl font-black tracking-tight text-foreground">
                      {formatCurrency(metrics.earnings)}
                    </h3>
                    <p className="text-xs text-green-500 mt-2 flex items-center font-bold">
                      <TrendingUp className="h-3 w-3 mr-1" /> Estimated (70%
                      share)
                    </p>
                  </div>
                </div>

                {/* Active Projects */}
                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-blue-500/30 transition-all relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-[100px] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                  <div className="relative z-10">
                    <p className="text-muted-foreground text-sm font-bold mb-1 uppercase tracking-wide">
                      Active Projects
                    </p>
                    <h3 className="text-3xl font-black tracking-tight text-foreground">
                      {metrics.activeProjects}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{
                            width: `${Math.min(
                              (metrics.activeProjects / 5) * 100,
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium text-blue-500">
                        Utilization
                      </span>
                    </div>
                  </div>
                </div>

                {/* Proposals Sent */}
                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-purple-500/30 transition-all relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-bl-[100px] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                  <div className="relative z-10">
                    <p className="text-muted-foreground text-sm font-bold mb-1 uppercase tracking-wide">
                      Pending Proposals
                    </p>
                    <h3 className="text-3xl font-black tracking-tight text-foreground">
                      {metrics.proposalsReceived}
                    </h3>
                    <p className="text-xs text-purple-500 mt-2 flex items-center font-bold">
                      <Clock className="h-3 w-3 mr-1" /> Awaiting client
                      response
                    </p>
                  </div>
                </div>
              </div>

              {/* Active Projects Table */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-foreground">
                    Active Jobs Overview
                  </h3>
                  <Button
                    variant="link"
                    className="text-primary hover:text-primary/80 h-auto p-0 font-semibold"
                    onClick={() => navigate("/freelancer/project")}
                  >
                    View All <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>

                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-secondary/30 border-b border-border">
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Project Name
                        </th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Status
                        </th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Client
                        </th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Budget
                        </th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {metrics.acceptedProposals.length === 0 ? (
                        <tr>
                          <td
                            colSpan="5"
                            className="px-6 py-8 text-center text-muted-foreground text-sm"
                          >
                            No active jobs yet.
                          </td>
                        </tr>
                      ) : (
                        metrics.acceptedProposals.map((proposal) => (
                          <tr
                            key={proposal.id}
                            className="group hover:bg-secondary/30 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="font-bold text-foreground">
                                {proposal.project?.title || "Untitled Project"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(
                                  proposal.project?.createdAt || Date.now()
                                ).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/50">
                                Active
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold border border-border">
                                  {(
                                    proposal.project?.owner?.fullName || "C"
                                  ).charAt(0)}
                                </div>
                                <span className="text-sm font-medium">
                                  {proposal.project?.owner?.fullName ||
                                    "Client"}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-bold text-foreground">
                                {formatCurrency(proposal.amount * 0.7)}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                onClick={() =>
                                  navigate(
                                    `/freelancer/project/${proposal.project?.id}`
                                  )
                                }
                              >
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Sidebar - Widgets (Merged) */}
            <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-6">
              {/* Dynamic Upcoming Meeting Widget (Moved to TOP for visibility) */}
              {/* Dynamic Upcoming Meeting Widget (Moved to TOP for visibility) */}
              {(() => {
                // If no upcoming meeting, hide the widget
                if (!upcomingMeeting) return null;

                const meetingDate = new Date(upcomingMeeting.date);
                const isToday =
                  new Date().toDateString() === meetingDate.toDateString();
                const dateDisplay = isToday
                  ? "Today"
                  : meetingDate.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    });
                const timeDisplay = `${upcomingMeeting.startHour}:00 - ${upcomingMeeting.endHour}:00`;

                return (
                  <div className="bg-card rounded-2xl border border-border p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -mr-6 -mt-6"></div>
                    <h3 className="font-bold text-lg text-foreground mb-2 flex items-center gap-2 relative z-10">
                      <Video className="h-5 w-5 text-primary" />
                      Upcoming Meeting
                    </h3>
                    <div className="relative z-10 mb-4">
                      <p className="text-sm font-bold text-foreground">
                        {upcomingMeeting.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {dateDisplay} • {timeDisplay}
                      </p>
                      {upcomingMeeting.manager && (
                        <p className="text-xs text-muted-foreground mt-1">
                          with {upcomingMeeting.manager.fullName}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 relative z-10">
                      <Button
                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-lg shadow-primary/20 text-xs sm:text-sm"
                        onClick={() =>
                          window.open(
                            upcomingMeeting.meetingLink ||
                              "https://meet.google.com/",
                            "_blank"
                          )
                        }
                        disabled={
                          !upcomingMeeting.meetingLink &&
                          !upcomingMeeting.meetingLink?.startsWith("http")
                        }
                      >
                        Join Meeting
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 font-bold text-xs sm:text-sm"
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                );
              })()}

              {/* Pending Proposals Widget */}
              <div className="bg-primary/5 dark:bg-card rounded-2xl p-6 border border-primary/10 dark:border-border shadow-lg relative overflow-hidden">
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-foreground relative z-10">
                  <Gavel className="text-primary h-5 w-5" /> Pending Proposals
                  <Badge className="bg-primary text-black hover:bg-primary/90 ml-auto font-bold">
                    {metrics.proposalsReceived}
                  </Badge>
                </h3>

                <div className="flex flex-col gap-3 relative z-10">
                  {metrics.pendingProposals.length === 0 ? (
                    <div className="text-sm text-muted-foreground italic">
                      No pending proposals.
                    </div>
                  ) : (
                    metrics.pendingProposals.slice(0, 3).map((p) => (
                      <div
                        key={p.id}
                        className="bg-background/80 backdrop-blur-sm p-4 rounded-xl border border-border hover:border-primary/30 transition-all"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="text-sm font-bold text-foreground truncate">
                              {p.project?.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Client: {p.project?.owner?.fullName}
                            </p>
                          </div>
                          <span className="text-xs font-bold text-foreground whitespace-nowrap">
                            {formatCurrency(p.amount * 0.7)}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-xs h-7 font-bold"
                            onClick={() => navigate("/freelancer/proposals")}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Earnings Goal / Payment Status Widget */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <h3 className="font-bold text-lg text-foreground mb-6">
                  Earnings Goal
                </h3>
                <div className="flex items-center gap-6">
                  {/* Circular Progress */}
                  <div className="relative w-28 h-28 flex-shrink-0">
                    <svg
                      className="w-full h-full transform -rotate-90"
                      viewBox="0 0 100 100"
                    >
                      {/* Track */}
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        className="text-secondary dark:text-zinc-800"
                      />
                      {/* Progress */}
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray={263.89}
                        strokeDashoffset={
                          263.89 -
                          263.89 *
                            (metrics.earnings > 0
                              ? metrics.receivedEarnings / metrics.earnings
                              : 0)
                        }
                        className="text-primary transition-all duration-1000 ease-out"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-black text-foreground">
                        {metrics.earnings > 0
                          ? Math.round(
                              (metrics.receivedEarnings / metrics.earnings) *
                                100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-col gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                        Received Payment
                      </p>
                      <p className="text-xl font-black text-foreground leading-none">
                        {formatCurrency(metrics.receivedEarnings || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                        Pending Payment
                      </p>
                      <p className="text-xl font-black text-foreground leading-none">
                        {formatCurrency(metrics.pendingEarnings || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Clients (Was Assigned Talent) */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg text-foreground">
                    Active Clients
                  </h3>
                  <Button
                    variant="link"
                    className="text-primary hover:text-primary/80 h-auto p-0 font-semibold text-sm"
                    onClick={() => navigate("/freelancer/messages")}
                  >
                    View All
                  </Button>
                </div>
                <ul className="flex flex-col gap-4">
                  {metrics.acceptedProposals.length === 0 ? (
                    <div className="text-sm text-muted-foreground italic">
                      No active clients yet.
                    </div>
                  ) : (
                    // List all accepted proposals (Active Clients/Projects)
                    metrics.acceptedProposals.slice(0, 5).map((proposal) => (
                      <li key={proposal.id} className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground font-bold border-2 border-background ring-2 ring-border/20">
                            {(proposal.project?.owner?.fullName || "C").charAt(
                              0
                            )}
                          </div>
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full"></span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">
                            {proposal.project?.owner?.fullName || "Client"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {proposal.project?.title}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary rounded-full transition-colors"
                          onClick={() =>
                            navigate(
                              `/freelancer/messages?projectId=${proposal.projectId}`
                            )
                          }
                        >
                          <MessageSquare className="h-5 w-5" />
                        </Button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const FreelancerDashboard = () => {
  return (
    <RoleAwareSidebar>
      <DashboardContent />
    </RoleAwareSidebar>
  );
};

export const ClientDashboard = () => {
  return (
    <RoleAwareSidebar>
      <DashboardContent roleOverride="CLIENT" />
    </RoleAwareSidebar>
  );
};

export default FreelancerDashboard;
