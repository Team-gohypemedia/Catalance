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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/shared/context/AuthContext";
import Search from "lucide-react/dist/esm/icons/search";
import MessageSquare from "lucide-react/dist/esm/icons/message-square";
import Send from "lucide-react/dist/esm/icons/send";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import RotateCcw from "lucide-react/dist/esm/icons/rotate-ccw";
import Download from "lucide-react/dist/esm/icons/download";
import IndianRupee from "lucide-react/dist/esm/icons/indian-rupee";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import Bell from "lucide-react/dist/esm/icons/bell";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Users from "lucide-react/dist/esm/icons/users";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import Activity from "lucide-react/dist/esm/icons/activity";
import X from "lucide-react/dist/esm/icons/x";
import { toast } from "sonner";

const AdminWhatsappAnalytics = () => {
  const { authFetch } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const [timeframe, setTimeframe] = useState("all"); // 'today' | '7d' | '30d' | 'all'
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [directionFilter, setDirectionFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState("12");

  // Recipient details modal state
  const [selectedRecipient, setSelectedRecipient] = useState(null);

  const fetchAnalytics = useCallback(
    async (tf = timeframe) => {
      setLoading(true);
      setError("");
      try {
        const res = await authFetch(`/admin/whatsapp/analytics?timeframe=${tf}`);
        const json = await res.json();

        if (json?.success) {
          setData(json.data);
        } else {
          setError(json?.error || "Failed to load WhatsApp analytics");
        }
      } catch (err) {
        console.error("Failed to fetch WhatsApp analytics:", err);
        setError("Failed to connect to backend service");
      } finally {
        setLoading(false);
      }
    },
    [authFetch, timeframe]
  );

  useEffect(() => {
    void fetchAnalytics(timeframe);
  }, [fetchAnalytics, timeframe]);

  const summary = data?.summary || {
    totalSent: 0,
    totalReceived: 0,
    totalDelivered: 0,
    totalFailed: 0,
    totalCostInr: 0,
    totalCostUsd: 0,
  };

  const categoryStats = data?.categoryStats || {
    otp: { count: 0, costInr: 0, rateInr: 0.15, label: "Authentication (OTP)" },
    notification: { count: 0, costInr: 0, rateInr: 0.30, label: "Utility & System Alerts" },
    marketing: { count: 0, costInr: 0, rateInr: 0.75, label: "Marketing & Reminders" },
    text: { count: 0, costInr: 0, rateInr: 0.15, label: "Support & Direct Replies" },
  };

  const dailyTrends = data?.dailyTrends || [];
  const allLogs = useMemo(() => data?.logs || [], [data]);

  // Compute total volume across all categories for progress bars
  const totalCategoryCount = Math.max(
    (categoryStats.otp?.count || 0) +
      (categoryStats.notification?.count || 0) +
      (categoryStats.marketing?.count || 0) +
      (categoryStats.text?.count || 0),
    1
  );

  // Client-side filtering & search
  const filteredLogs = useMemo(() => {
    let result = [...allLogs];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (l) =>
          l.recipientName?.toLowerCase().includes(q) ||
          l.recipientEmail?.toLowerCase().includes(q) ||
          l.phone?.includes(q) ||
          l.bodySnippet?.toLowerCase().includes(q)
      );
    }

    if (categoryFilter !== "ALL") {
      result = result.filter((l) => l.category === categoryFilter);
    }

    if (roleFilter !== "ALL") {
      result = result.filter((l) => l.recipientRole === roleFilter);
    }

    if (statusFilter !== "ALL") {
      result = result.filter((l) => l.status === statusFilter);
    }

    if (directionFilter !== "ALL") {
      result = result.filter((l) => l.direction === directionFilter);
    }

    return result;
  }, [allLogs, categoryFilter, directionFilter, roleFilter, search, statusFilter]);

  const currentLimit = pageSize === "ALL" ? Math.max(filteredLogs.length, 1) : Number(pageSize) || 12;
  const totalPages = Math.max(Math.ceil(filteredLogs.length / currentLimit), 1);
  const validPage = Math.min(page, totalPages);
  const startIndex = (validPage - 1) * currentLimit;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + currentLimit);
  const pageStart = filteredLogs.length === 0 ? 0 : startIndex + 1;
  const pageEnd = Math.min(startIndex + currentLimit, filteredLogs.length);

  const hasActiveFilters =
    search.trim() !== "" ||
    categoryFilter !== "ALL" ||
    roleFilter !== "ALL" ||
    statusFilter !== "ALL" ||
    directionFilter !== "ALL";

  const handleClearFilters = () => {
    setSearch("");
    setCategoryFilter("ALL");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
    setDirectionFilter("ALL");
    setPage(1);
    toast.success("Filters cleared");
  };

  const exportToCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error("No notification logs available to export");
      return;
    }

    const headers = ["ID", "Phone", "Recipient Name", "Recipient Email", "Role", "Direction", "Category", "Message Snippet", "Status", "Cost (INR ₹)", "Date"];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.phone,
      `"${l.recipientName || ""}"`,
      `"${l.recipientEmail || ""}"`,
      l.recipientRole,
      l.direction,
      l.categoryLabel,
      `"${(l.bodySnippet || "").replace(/"/g, '""')}"`,
      l.status,
      l.costInr,
      new Date(l.createdAt).toLocaleString(),
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `whatsapp_notification_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Notification analytics exported successfully!");
  };

  // Recipient details calculations
  const recipientHistory = useMemo(() => {
    if (!selectedRecipient) return [];
    return allLogs.filter((l) => l.phone === selectedRecipient.phone);
  }, [allLogs, selectedRecipient]);

  const recipientTotalCost = useMemo(() => {
    return recipientHistory.reduce((acc, l) => acc + (l.costInr || 0), 0);
  }, [recipientHistory]);

  const maxDailyCount = useMemo(() => {
    if (dailyTrends.length === 0) return 1;
    return Math.max(...dailyTrends.map((d) => d.totalCount), 1);
  }, [dailyTrends]);

  return (
    <AdminLayout>
      <div className="relative flex flex-col gap-6 p-6">
        <AdminTopBar label="WhatsApp Analytics" />

        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header & Tab Switcher Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">WhatsApp Analytics & Spend</h1>
                <Badge variant="secondary" className="px-2.5 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <Sparkles className="mr-1 h-3.5 w-3.5 text-emerald-500 inline" />
                  Meta API Rate Card Active
                </Badge>
              </div>
              <p className="mt-1 text-muted-foreground text-sm">
                Full analytics on WhatsApp notifications sent to users, recipient audit log, and financial spend breakdown.
              </p>
            </div>

            {/* Top Navigation Tabs */}
            <div className="flex items-center gap-2 bg-muted/60 p-1 rounded-xl border shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin/whatsapp-inbox")}
                className="text-xs gap-1.5 h-8 font-medium"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Conversations Inbox
              </Button>
              <Button
                variant="default"
                size="sm"
                className="text-xs gap-1.5 h-8 font-semibold shadow-sm"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                Analytics & Spend
              </Button>
            </div>
          </div>

          {/* Timeframe Filter Bar */}
          <div className="flex items-center justify-between gap-3 bg-card p-3 rounded-xl border shadow-sm">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <Calendar className="h-4 w-4 text-primary" />
              <span>Timeframe Window:</span>
            </div>

            <div className="flex items-center gap-1.5 bg-muted/70 p-1 rounded-lg">
              {[
                { key: "today", label: "Today" },
                { key: "7d", label: "Last 7 Days" },
                { key: "30d", label: "Last 30 Days" },
                { key: "all", label: "All Time" },
              ].map((tf) => (
                <button
                  key={tf.key}
                  onClick={() => setTimeframe(tf.key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    timeframe === tf.key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="shadow-sm border-emerald-500/20 bg-gradient-to-br from-card to-emerald-500/5">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Spend (Est.)
                </CardTitle>
                <IndianRupee className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {loading ? "--" : `₹${summary.totalCostInr}`}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Approx. ${summary.totalCostUsd} USD total
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Outbound Notifications
                </CardTitle>
                <Send className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {loading ? "--" : summary.totalSent}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Messages dispatched to users
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Inbound Customer Msgs
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {loading ? "--" : summary.totalReceived}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  User replies & bot queries
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Delivery Health Rate
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {loading
                    ? "--"
                    : summary.totalSent > 0
                      ? `${Math.round((summary.totalDelivered / Math.max(summary.totalSent, 1)) * 100)}%`
                      : "100%"}
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Activity className="h-3 w-3 text-emerald-500 inline" />
                  {summary.totalFailed > 0 ? `${summary.totalFailed} failed` : "Healthy operation"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Daily Notification Volume & Cost Visual Trend Chart */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Daily Notification Dispatch Volume & Spend Trend
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Visual timeline of WhatsApp notifications sent and calculated cost over time.
                  </p>
                </div>
                <Badge variant="outline" className="text-xs font-mono font-semibold">
                  {dailyTrends.length} Active Days
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              {loading ? (
                <div className="h-36 flex items-center justify-center text-muted-foreground text-sm">
                  Loading trend visualizer...
                </div>
              ) : dailyTrends.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center text-muted-foreground text-sm">
                  <Calendar className="h-6 w-6 opacity-40 mb-1" />
                  <p>No activity logged for the selected timeframe window.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-end gap-2 h-40 pt-4 px-2 border-b border-border/50">
                    {dailyTrends.map((trend) => {
                      const heightPercent = Math.max(Math.round((trend.totalCount / maxDailyCount) * 100), 12);
                      return (
                        <div key={trend.date} className="flex-1 flex flex-col items-center group relative min-w-[28px]">
                          {/* Tooltip */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 bg-popover text-popover-foreground border text-[11px] p-1.5 rounded-md shadow-md pointer-events-none whitespace-nowrap z-20">
                            <p className="font-bold">{trend.label}</p>
                            <p className="text-emerald-600 dark:text-emerald-400 font-mono">
                              {trend.totalCount} msgs • ₹{trend.costInr}
                            </p>
                          </div>

                          {/* Bar */}
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className="w-full max-w-[36px] bg-gradient-to-t from-primary/80 to-emerald-500 rounded-t-md transition-all group-hover:brightness-110 shadow-sm"
                          />
                          <span className="text-[10px] text-muted-foreground font-mono mt-2 truncate w-full text-center">
                            {trend.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-end gap-4 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
                      Daily Dispatched Messages
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Meta Category Rate Card & Progress Breakdown Grid */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-primary" />
                    Category Volume & Spend Breakdown
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Meta WhatsApp conversation tiers and cost contribution per category.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-1.5 text-xs">
                  <Download className="h-3.5 w-3.5" />
                  Export CSV Report
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* OTP */}
                <div className="rounded-xl border bg-card p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
                      {categoryStats.otp?.label}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      ₹{categoryStats.otp?.rateInr}/msg
                    </Badge>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-2xl font-bold text-foreground">
                      {categoryStats.otp?.count || 0}
                    </span>
                    <span className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono">
                      ₹{(categoryStats.otp?.costInr || 0).toFixed(2)}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all"
                      style={{
                        width: `${Math.round(((categoryStats.otp?.count || 0) / totalCategoryCount) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Authentication verification passcodes</p>
                </div>

                {/* Notifications */}
                <div className="rounded-xl border bg-card p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <Bell className="h-3.5 w-3.5 text-blue-500" />
                      {categoryStats.notification?.label}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      ₹{categoryStats.notification?.rateInr}/msg
                    </Badge>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-2xl font-bold text-foreground">
                      {categoryStats.notification?.count || 0}
                    </span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono">
                      ₹{(categoryStats.notification?.costInr || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all"
                      style={{
                        width: `${Math.round(((categoryStats.notification?.count || 0) / totalCategoryCount) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Order, proposal & project updates</p>
                </div>

                {/* Marketing */}
                <div className="rounded-xl border bg-card p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                      {categoryStats.marketing?.label}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      ₹{categoryStats.marketing?.rateInr}/msg
                    </Badge>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-2xl font-bold text-foreground">
                      {categoryStats.marketing?.count || 0}
                    </span>
                    <span className="text-sm font-bold text-purple-600 dark:text-purple-400 font-mono">
                      ₹{(categoryStats.marketing?.costInr || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-500 h-full rounded-full transition-all"
                      style={{
                        width: `${Math.round(((categoryStats.marketing?.count || 0) / totalCategoryCount) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Profile completion & re-engagement</p>
                </div>

                {/* Support Replies */}
                <div className="rounded-xl border bg-card p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />
                      {categoryStats.text?.label}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      ₹{categoryStats.text?.rateInr}/msg
                    </Badge>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-2xl font-bold text-foreground">
                      {categoryStats.text?.count || 0}
                    </span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      ₹{(categoryStats.text?.costInr || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{
                        width: `${Math.round(((categoryStats.text?.count || 0) / totalCategoryCount) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Admin direct chat replies</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* "To Whom" Recipient Audit Log Toolbar & Table */}
          <div className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[260px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search recipient name, email, phone, or content snippet..."
                  className="pl-9 pr-4"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
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

              {/* Filters Toolbar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* Category Filter */}
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Categories</SelectItem>
                    <SelectItem value="otp">Authentication (OTP)</SelectItem>
                    <SelectItem value="notification">Utility Alerts</SelectItem>
                    <SelectItem value="marketing">Reminders</SelectItem>
                    <SelectItem value="text">Direct Support</SelectItem>
                  </SelectContent>
                </Select>

                {/* Recipient Role Filter */}
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All User Roles</SelectItem>
                    <SelectItem value="FREELANCER">Freelancers</SelectItem>
                    <SelectItem value="CLIENT">Clients</SelectItem>
                    <SelectItem value="PROJECT_MANAGER">PMs</SelectItem>
                  </SelectContent>
                </Select>

                {/* Direction Filter */}
                <Select value={directionFilter} onValueChange={setDirectionFilter}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Direction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Directions</SelectItem>
                    <SelectItem value="OUTBOUND">Outbound Sent</SelectItem>
                    <SelectItem value="INBOUND">Inbound Received</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" size="sm" className="h-9 text-xs gap-1" onClick={() => void fetchAnalytics(timeframe)}>
                  Refresh
                </Button>
              </div>
            </div>

            {/* Active Filters Badges */}
            {hasActiveFilters && (
              <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-border/40">
                <span className="text-xs font-semibold text-muted-foreground">Active Filters:</span>
                {categoryFilter !== "ALL" && (
                  <Badge variant="secondary" className="text-[11px] gap-1 px-2 py-0.5">
                    Category: {categoryFilter}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setCategoryFilter("ALL")} />
                  </Badge>
                )}
                {roleFilter !== "ALL" && (
                  <Badge variant="secondary" className="text-[11px] gap-1 px-2 py-0.5">
                    Role: {roleFilter}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setRoleFilter("ALL")} />
                  </Badge>
                )}
                {directionFilter !== "ALL" && (
                  <Badge variant="secondary" className="text-[11px] gap-1 px-2 py-0.5">
                    Direction: {directionFilter}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setDirectionFilter("ALL")} />
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
                  Reset Filters
                </Button>
              </div>
            )}
          </div>

          {/* Audit Log Table */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead>Recipient ("To Whom")</TableHead>
                  <TableHead>Phone & Role</TableHead>
                  <TableHead>Category & Type</TableHead>
                  <TableHead>Message Content Preview</TableHead>
                  <TableHead>Status & Cost</TableHead>
                  <TableHead className="text-right">Sent Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell><div className="h-4 w-32 animate-pulse rounded bg-muted" /></TableCell>
                      <TableCell><div className="h-4 w-24 animate-pulse rounded bg-muted" /></TableCell>
                      <TableCell><div className="h-4 w-28 animate-pulse rounded bg-muted" /></TableCell>
                      <TableCell><div className="h-4 w-40 animate-pulse rounded bg-muted" /></TableCell>
                      <TableCell><div className="h-4 w-20 animate-pulse rounded bg-muted" /></TableCell>
                      <TableCell><div className="ml-auto h-4 w-20 animate-pulse rounded bg-muted" /></TableCell>
                    </TableRow>
                  ))
                ) : paginatedLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2 py-4">
                        <AlertCircle className="h-8 w-8 text-muted-foreground/60" />
                        <p className="text-sm font-medium text-foreground">
                          No WhatsApp notification records match your filter criteria.
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
                  paginatedLogs.map((log) => {
                    const isOutbound = log.direction === "OUTBOUND";

                    return (
                      <TableRow
                        key={log.id}
                        onClick={() => setSelectedRecipient(log)}
                        className="hover:bg-muted/50 transition-colors cursor-pointer"
                      >
                        {/* Recipient User info */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary overflow-hidden shrink-0">
                              {log.recipientAvatar ? (
                                <img src={log.recipientAvatar} alt={log.recipientName} className="h-full w-full object-cover" />
                              ) : (
                                log.recipientName?.charAt(0)?.toUpperCase() || "U"
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate hover:underline text-foreground">
                                {log.recipientName}
                              </p>
                              {log.recipientEmail ? (
                                <p className="text-xs text-muted-foreground truncate">{log.recipientEmail}</p>
                              ) : null}
                            </div>
                          </div>
                        </TableCell>

                        {/* Phone & Role */}
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-xs font-mono font-medium text-foreground">
                              +{log.phone}
                            </p>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                log.recipientRole === "FREELANCER"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                  : log.recipientRole === "CLIENT"
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                    : log.recipientRole === "PROJECT_MANAGER"
                                      ? "bg-primary/10 text-primary"
                                      : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {log.recipientRole}
                            </span>
                          </div>
                        </TableCell>

                        {/* Category & Type */}
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant="outline" className="text-[10px] font-semibold capitalize">
                              {log.categoryLabel}
                            </Badge>
                            <p className="text-[10px] text-muted-foreground font-mono uppercase">
                              {log.direction} • {log.messageType}
                            </p>
                          </div>
                        </TableCell>

                        {/* Message Content Preview */}
                        <TableCell className="max-w-[280px]">
                          <p className="text-xs text-foreground line-clamp-2" title={log.bodySnippet}>
                            {log.bodySnippet}
                          </p>
                        </TableCell>

                        {/* Status & Cost */}
                        <TableCell>
                          <div className="space-y-1">
                            <Badge
                              className={`text-[10px] ${
                                log.status === "DELIVERED" || log.status === "READ"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-0"
                                  : log.status === "FAILED"
                                    ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-0"
                                    : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-0"
                              }`}
                            >
                              {log.status}
                            </Badge>
                            {isOutbound ? (
                              <p className="text-xs font-mono font-bold text-foreground">
                                ₹{log.costInr}{" "}
                                <span className="text-[10px] text-muted-foreground font-normal">
                                  (${log.costUsd})
                                </span>
                              </p>
                            ) : (
                              <p className="text-[10px] text-emerald-600 font-semibold">FREE (Inbound)</p>
                            )}
                          </div>
                        </TableCell>

                        {/* Time */}
                        <TableCell className="text-right">
                          <div className="text-xs space-y-0.5 font-mono">
                            <p className="text-foreground">
                              {new Date(log.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
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
                <span className="font-semibold text-foreground font-mono">{filteredLogs.length}</span> records.
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
                  <SelectTrigger className="h-7 w-[70px] text-xs font-semibold">
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
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() =>
                  setPage((currentPage) => Math.min(currentPage + 1, totalPages))
                }
              >
                Next
              </Button>
            </div>
          </div>
        </div>

        {/* Recipient Profile & Notification Audit Dialog */}
        <Dialog open={!!selectedRecipient} onOpenChange={() => setSelectedRecipient(null)}>
          <DialogContent className="max-w-md sm:max-w-lg">
            {selectedRecipient && (
              <div className="space-y-4">
                <DialogHeader className="space-y-1">
                  <DialogTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-primary" />
                    Recipient Notification Details
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Comprehensive WhatsApp notification dispatch history & spend for this user.
                  </DialogDescription>
                </DialogHeader>

                {/* Recipient Profile Info */}
                <div className="flex items-center justify-between bg-muted/50 p-3.5 rounded-xl border">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-base overflow-hidden shrink-0">
                      {selectedRecipient.recipientAvatar ? (
                        <img src={selectedRecipient.recipientAvatar} alt={selectedRecipient.recipientName} className="h-full w-full object-cover" />
                      ) : (
                        selectedRecipient.recipientName?.charAt(0)?.toUpperCase() || "U"
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{selectedRecipient.recipientName}</p>
                      {selectedRecipient.recipientEmail && (
                        <p className="text-xs text-muted-foreground">{selectedRecipient.recipientEmail}</p>
                      )}
                      <p className="text-xs font-mono text-emerald-600 font-semibold mt-0.5">
                        +{selectedRecipient.phone}
                      </p>
                    </div>
                  </div>

                  <Badge variant="outline" className="text-xs font-semibold">
                    {selectedRecipient.recipientRole}
                  </Badge>
                </div>

                {/* User WhatsApp Spend Metric Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border bg-card space-y-1">
                    <span className="text-[11px] font-medium text-muted-foreground">Total Notifications</span>
                    <p className="text-xl font-bold text-foreground">{recipientHistory.length} msgs</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-card space-y-1">
                    <span className="text-[11px] font-medium text-muted-foreground">Total Spend on User</span>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      ₹{recipientTotalCost.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Message snippet preview */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground">Latest Message Snippet:</span>
                  <div className="p-3 rounded-lg border bg-muted/30 text-xs space-y-1">
                    <p className="font-medium text-foreground">{selectedRecipient.bodySnippet}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      Category: {selectedRecipient.categoryLabel} • Status: {selectedRecipient.status} • Cost: ₹{selectedRecipient.costInr}
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <Button variant="outline" size="sm" onClick={() => setSelectedRecipient(null)}>
                    Close
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => {
                      setSelectedRecipient(null);
                      navigate("/admin/whatsapp-inbox");
                    }}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Open Chat Inbox
                    <ExternalLink className="h-3.5 w-3.5 ml-0.5" />
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminWhatsappAnalytics;
