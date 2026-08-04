import React, { useCallback, useEffect, useMemo, useState } from "react";
import Bot from "lucide-react/dist/esm/icons/bot";
import Download from "lucide-react/dist/esm/icons/download";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import RefreshCcw from "lucide-react/dist/esm/icons/refresh-ccw";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Users from "lucide-react/dist/esm/icons/users";
import Wallet from "lucide-react/dist/esm/icons/wallet";
import { toast } from "sonner";

import AdminLayout from "./AdminLayout";
import { AdminTopBar } from "./AdminTopBar";
import { useAuth } from "@/shared/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DEFAULT_FILTERS = {
  days: "30",
  visitorType: "ALL",
  pagePath: "",
  featureKey: "",
  userId: "",
};

const DEFAULT_RECORDS = {
  usage: [],
  total: 0,
  totalPages: 1,
  page: 1,
  limit: 25,
  window: null,
};

const normalizeFilterValue = (value) => String(value || "").trim();

const buildUsageQueryString = (filters, { page, limit } = {}) => {
  const query = new URLSearchParams();

  Object.entries(filters || {}).forEach(([key, rawValue]) => {
    const value = normalizeFilterValue(rawValue);
    if (!value || value === "ALL") return;
    query.set(key, value);
  });

  if (filters?.days) {
    query.set("days", normalizeFilterValue(filters.days));
  }

  if (page) query.set("page", String(page));
  if (limit) query.set("limit", String(limit));

  return query.toString();
};

const formatCount = (value) => Number(value || 0).toLocaleString("en-IN");

const formatCurrency = (value) =>
  `INR ${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: value > 0 && value < 1 ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusBadgeClasses = (status) => {
  const normalized = String(status || "").toUpperCase();

  if (normalized.startsWith("2")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalized.startsWith("4")) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (normalized.startsWith("5")) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-border bg-muted text-muted-foreground";
};

const toCsvValue = (value) => {
  const normalized = String(value ?? "").replace(/"/g, '""');
  return `"${normalized}"`;
};

const downloadCsvFile = (rows) => {
  const csvContent = rows.map((row) => row.map(toCsvValue).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = blobUrl;
  link.download = `ai-usage-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
};

const ListPanel = ({ title, description, items, emptyLabel, renderItem }) => (
  <Card className="border-border/70">
    <CardHeader className="pb-4">
      <CardTitle className="text-base">{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          {emptyLabel}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(renderItem)}
        </div>
      )}
    </CardContent>
  </Card>
);

const AdminAiUsage = () => {
  const { authFetch } = useAuth();
  const [draftFilters, setDraftFilters] = useState(DEFAULT_FILTERS);
  const [activeFilters, setActiveFilters] = useState(DEFAULT_FILTERS);
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState(DEFAULT_RECORDS);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchUsageData = useCallback(
    async ({ silent = false, nextFilters = activeFilters, nextPage = page } = {}) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const summaryQuery = buildUsageQueryString(nextFilters, { limit: 5 });
        const recordsQuery = buildUsageQueryString(nextFilters, { page: nextPage, limit: 25 });

        const [summaryResponse, recordsResponse] = await Promise.all([
          authFetch(`/admin/ai-usage/summary?${summaryQuery}`),
          authFetch(`/admin/ai-usage?${recordsQuery}`),
        ]);

        const [summaryPayload, recordsPayload] = await Promise.all([
          summaryResponse.json().catch(() => null),
          recordsResponse.json().catch(() => null),
        ]);

        if (!summaryResponse.ok) {
          throw new Error(summaryPayload?.message || "Failed to load AI usage summary.");
        }

        if (!recordsResponse.ok) {
          throw new Error(recordsPayload?.message || "Failed to load AI usage records.");
        }

        setSummary(summaryPayload?.data || null);
        setRecords({
          ...DEFAULT_RECORDS,
          ...(recordsPayload?.data || {}),
          usage: Array.isArray(recordsPayload?.data?.usage) ? recordsPayload.data.usage : [],
        });
      } catch (error) {
        console.error("Failed to load AI usage:", error);
        toast.error(error.message || "Failed to load AI usage.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeFilters, authFetch, page],
  );

  useEffect(() => {
    void fetchUsageData({ nextFilters: activeFilters, nextPage: page });
  }, [activeFilters, fetchUsageData, page]);

  const handleDraftFilterChange = (key, value) => {
    setDraftFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleApplyFilters = (event) => {
    event.preventDefault();
    setPage(1);
    setActiveFilters({
      days: normalizeFilterValue(draftFilters.days) || DEFAULT_FILTERS.days,
      visitorType: normalizeFilterValue(draftFilters.visitorType) || DEFAULT_FILTERS.visitorType,
      pagePath: normalizeFilterValue(draftFilters.pagePath),
      featureKey: normalizeFilterValue(draftFilters.featureKey),
      userId: normalizeFilterValue(draftFilters.userId),
    });
  };

  const handleResetFilters = () => {
    setDraftFilters(DEFAULT_FILTERS);
    setActiveFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  const handleRefresh = () => {
    void fetchUsageData({ silent: true, nextFilters: activeFilters, nextPage: page });
  };

  const handleExportCurrentPage = () => {
    if (!records.usage.length) {
      toast.error("There is no usage data on the current page to export.");
      return;
    }

    setExporting(true);

    try {
      downloadCsvFile([
        [
          "Created At",
          "User",
          "Email",
          "Visitor Type",
          "Page Path",
          "Feature",
          "Model",
          "Status",
          "Prompt Tokens",
          "Completion Tokens",
          "Total Tokens",
          "Cost (INR)",
        ],
        ...records.usage.map((entry) => [
          formatDateTime(entry.createdAt),
          entry.user?.fullName || entry.userId || "Guest",
          entry.user?.email || "",
          entry.visitorType || "",
          entry.pagePath || "",
          entry.featureKey || "",
          entry.model || "",
          entry.responseStatus || entry.responseStatusCode || "",
          entry.promptTokens || 0,
          entry.completionTokens || 0,
          entry.totalTokens || 0,
          entry.costInRupees || 0,
        ]),
      ]);

      toast.success("AI usage CSV downloaded.");
    } catch (error) {
      console.error("Failed to export AI usage:", error);
      toast.error("Failed to export AI usage.");
    } finally {
      setExporting(false);
    }
  };

  const overview = summary?.overview || null;
  const activeFilterBadges = useMemo(() => {
    const badges = [`Last ${activeFilters.days} days`];

    if (activeFilters.visitorType !== "ALL") {
      badges.push(activeFilters.visitorType);
    }

    if (activeFilters.pagePath) {
      badges.push(`Page: ${activeFilters.pagePath}`);
    }

    if (activeFilters.featureKey) {
      badges.push(`Feature: ${activeFilters.featureKey}`);
    }

    if (activeFilters.userId) {
      badges.push(`User: ${activeFilters.userId}`);
    }

    return badges;
  }, [activeFilters]);

  const statCards = [
    {
      title: "AI Calls",
      value: formatCount(overview?.totalCalls),
      description: "All tracked requests in the selected window",
      icon: Bot,
    },
    {
      title: "Total Tokens",
      value: formatCount(overview?.totalTokens),
      description: "Prompt and completion tokens combined",
      icon: FileText,
    },
    {
      title: "Estimated Spend",
      value: formatCurrency(overview?.totalCostInRupees),
      description: "Tracked provider spend",
      icon: Wallet,
    },
    {
      title: "Known Visitors",
      value: formatCount((overview?.uniqueUsers || 0) + (overview?.uniqueGuestSessions || 0)),
      description: `${formatCount(overview?.uniqueUsers)} users and ${formatCount(overview?.uniqueGuestSessions)} guest sessions`,
      icon: Users,
    },
  ];

  const recentUsage = Array.isArray(summary?.recentUsage) ? summary.recentUsage : [];
  const topPages = Array.isArray(summary?.topPages) ? summary.topPages : [];
  const topFeatures = Array.isArray(summary?.topFeatures) ? summary.topFeatures : [];
  const topUsers = Array.isArray(summary?.topUsers) ? summary.topUsers : [];

  return (
    <AdminLayout>
      <div className="relative flex flex-col gap-6 p-6">
        <AdminTopBar label="AI Usage" />

        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-[28px] border border-border/70 bg-gradient-to-br from-amber-50 via-background to-orange-50 p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <Badge className="w-fit border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-100">
                  Admin telemetry
                </Badge>
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight">AI usage command center</h1>
                  <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                    Track AI usage by page, feature, logged-in user, and guest session across the platform.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeFilterBadges.map((badge) => (
                    <Badge key={badge} variant="outline" className="bg-background/80">
                      {badge}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
                  {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                  Refresh
                </Button>
                <Button onClick={handleExportCurrentPage} disabled={exporting || !records.usage.length}>
                  {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  Export current page
                </Button>
              </div>
            </div>
          </div>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Slice usage by date range, visitor type, page, feature, or user id.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4 lg:grid-cols-5" onSubmit={handleApplyFilters}>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Window</label>
                  <Select value={draftFilters.days} onValueChange={(value) => handleDraftFilterChange("days", value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select days" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Last 7 days</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="90">Last 90 days</SelectItem>
                      <SelectItem value="180">Last 180 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Visitor type</label>
                  <Select
                    value={draftFilters.visitorType}
                    onValueChange={(value) => handleDraftFilterChange("visitorType", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select visitor type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All visitors</SelectItem>
                      <SelectItem value="AUTHENTICATED">Authenticated</SelectItem>
                      <SelectItem value="GUEST">Guest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Page path</label>
                  <Input
                    value={draftFilters.pagePath}
                    onChange={(event) => handleDraftFilterChange("pagePath", event.target.value)}
                    placeholder="/client/ai-chat"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Feature key</label>
                  <Input
                    value={draftFilters.featureKey}
                    onChange={(event) => handleDraftFilterChange("featureKey", event.target.value)}
                    placeholder="proposal-shortlist"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">User id</label>
                  <Input
                    value={draftFilters.userId}
                    onChange={(event) => handleDraftFilterChange("userId", event.target.value)}
                    placeholder="Optional specific user"
                  />
                </div>

                <div className="flex flex-wrap gap-2 lg:col-span-5">
                  <Button type="submit" disabled={loading && !refreshing}>
                    Apply filters
                  </Button>
                  <Button type="button" variant="outline" onClick={handleResetFilters}>
                    Reset
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {statCards.map((card) => (
                  <Card key={card.title} className="border-border/70">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                      <card.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-semibold">
                        {loading ? <div className="h-8 w-28 animate-pulse rounded bg-muted" /> : card.value}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{card.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-3">
                <ListPanel
                  title="Top pages"
                  description="Where AI is being used most"
                  items={topPages}
                  emptyLabel="No page-level AI activity found for this filter."
                  renderItem={(item) => (
                    <div key={item.pagePath} className="rounded-2xl border border-border/70 bg-background p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{item.pagePath || "Unknown page"}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            Last used {formatDateTime(item.lastUsedAt)}
                          </div>
                        </div>
                        <Badge variant="outline">{formatCount(item.calls)} calls</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span>{formatCount(item.totalTokens)} tokens</span>
                        <span>{formatCurrency(item.totalCostInRupees)}</span>
                      </div>
                    </div>
                  )}
                />

                <ListPanel
                  title="Top features"
                  description="Most active AI feature buckets"
                  items={topFeatures}
                  emptyLabel="No feature-level AI activity found for this filter."
                  renderItem={(item) => (
                    <div key={item.featureKey} className="rounded-2xl border border-border/70 bg-background p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{item.featureKey || "Unknown feature"}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            Last used {formatDateTime(item.lastUsedAt)}
                          </div>
                        </div>
                        <Badge variant="outline">{formatCount(item.calls)} calls</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span>{formatCount(item.totalTokens)} tokens</span>
                        <span>{formatCurrency(item.totalCostInRupees)}</span>
                      </div>
                    </div>
                  )}
                />

                <ListPanel
                  title="Top users"
                  description="Authenticated users consuming the most AI"
                  items={topUsers}
                  emptyLabel="No authenticated AI usage found for this filter."
                  renderItem={(item) => (
                    <div key={item.userId} className="rounded-2xl border border-border/70 bg-background p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{item.fullName || "Unknown user"}</div>
                          <div className="truncate text-xs text-muted-foreground">{item.email || item.userId}</div>
                        </div>
                        <Badge variant="outline">{formatCount(item.calls)} calls</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span>{formatCount(item.totalTokens)} tokens</span>
                        <span>{formatCurrency(item.totalCostInRupees)}</span>
                        <span>{item.role || "No role"}</span>
                      </div>
                    </div>
                  )}
                />
              </div>

              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Recent AI activity
                  </CardTitle>
                  <CardDescription>Latest AI requests captured by the tracker.</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentUsage.length === 0 ? (
                    <div className="rounded-2xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                      No recent AI activity found for the selected filter window.
                    </div>
                  ) : (
                    <ScrollArea className="h-[340px] pr-4">
                      <div className="space-y-3">
                        {recentUsage.map((entry) => (
                          <div
                            key={entry.id}
                            className="rounded-2xl border border-border/70 bg-background p-4"
                          >
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div className="min-w-0 space-y-1">
                                <div className="truncate text-sm font-medium">
                                  {entry.title || entry.featureKey || entry.pagePath || "AI event"}
                                </div>
                                <div className="truncate text-xs text-muted-foreground">
                                  {entry.user?.fullName || entry.user?.email || entry.visitorType || "Unknown visitor"}
                                </div>
                                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                  <span>{entry.pagePath || "No page path"}</span>
                                  <span>{entry.model || "Unknown model"}</span>
                                  <span>{formatDateTime(entry.createdAt)}</span>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="outline">{formatCount(entry.totalTokens)} tokens</Badge>
                                <Badge variant="outline">{formatCurrency(entry.costInRupees)}</Badge>
                                <Badge className={getStatusBadgeClasses(entry.responseStatus || entry.responseStatusCode)}>
                                  {entry.responseStatus || entry.responseStatusCode || "Unknown"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="events" className="space-y-4">
              <Card className="border-border/70">
                <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <CardTitle>Tracked events</CardTitle>
                    <CardDescription>
                      Detailed request log for the current filter set.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="w-fit">
                    {formatCount(records.total)} total events
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="overflow-x-auto rounded-2xl border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Page</TableHead>
                          <TableHead>Feature</TableHead>
                          <TableHead>Model</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Tokens</TableHead>
                          <TableHead className="text-right">Cost</TableHead>
                          <TableHead className="text-right">Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          [...Array(6)].map((_, index) => (
                            <TableRow key={`skeleton-${index}`}>
                              <TableCell><div className="h-4 w-32 animate-pulse rounded bg-muted" /></TableCell>
                              <TableCell><div className="h-4 w-28 animate-pulse rounded bg-muted" /></TableCell>
                              <TableCell><div className="h-4 w-24 animate-pulse rounded bg-muted" /></TableCell>
                              <TableCell><div className="h-4 w-20 animate-pulse rounded bg-muted" /></TableCell>
                              <TableCell><div className="h-4 w-16 animate-pulse rounded bg-muted" /></TableCell>
                              <TableCell><div className="ml-auto h-4 w-16 animate-pulse rounded bg-muted" /></TableCell>
                              <TableCell><div className="ml-auto h-4 w-16 animate-pulse rounded bg-muted" /></TableCell>
                              <TableCell><div className="ml-auto h-4 w-24 animate-pulse rounded bg-muted" /></TableCell>
                            </TableRow>
                          ))
                        ) : records.usage.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                              No AI events match the current filters.
                            </TableCell>
                          </TableRow>
                        ) : (
                          records.usage.map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell>
                                <div className="max-w-[220px]">
                                  <div className="truncate font-medium">
                                    {entry.user?.fullName || entry.userId || "Guest"}
                                  </div>
                                  <div className="truncate text-xs text-muted-foreground">
                                    {entry.user?.email || entry.guestSessionId || entry.visitorType || "Unknown"}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="max-w-[240px] truncate">
                                {entry.pagePath || entry.pageUrl || "Unknown page"}
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate">
                                {entry.featureKey || entry.title || "-"}
                              </TableCell>
                              <TableCell>{entry.model || "-"}</TableCell>
                              <TableCell>
                                <Badge className={getStatusBadgeClasses(entry.responseStatus || entry.responseStatusCode)}>
                                  {entry.responseStatus || entry.responseStatusCode || "Unknown"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">{formatCount(entry.totalTokens)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(entry.costInRupees)}</TableCell>
                              <TableCell className="text-right text-sm text-muted-foreground">
                                {formatDateTime(entry.createdAt)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="text-sm text-muted-foreground">
                      Page {records.page} of {records.totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                        disabled={page <= 1 || loading}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setPage((current) => Math.min(records.totalPages || 1, current + 1))}
                        disabled={page >= (records.totalPages || 1) || loading}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAiUsage;
