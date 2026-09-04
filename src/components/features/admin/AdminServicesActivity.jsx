import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import AdminLayout from "./AdminLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useAuth } from "@/shared/context/AuthContext";
import Activity from "lucide-react/dist/esm/icons/activity";
import Bot from "lucide-react/dist/esm/icons/bot";
import Copy from "lucide-react/dist/esm/icons/copy";
import Cpu from "lucide-react/dist/esm/icons/cpu";
import Download from "lucide-react/dist/esm/icons/download";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import Eye from "lucide-react/dist/esm/icons/eye";
import FileCheck from "lucide-react/dist/esm/icons/file-check";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Filter from "lucide-react/dist/esm/icons/filter";
import Layers from "lucide-react/dist/esm/icons/layers";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Mail from "lucide-react/dist/esm/icons/mail";
import MessageSquare from "lucide-react/dist/esm/icons/message-square";
import Paperclip from "lucide-react/dist/esm/icons/paperclip";
import Phone from "lucide-react/dist/esm/icons/phone";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import Search from "lucide-react/dist/esm/icons/search";
import Send from "lucide-react/dist/esm/icons/send";
import UserX from "lucide-react/dist/esm/icons/user-x";
import X from "lucide-react/dist/esm/icons/x";
import { toast } from "sonner";
import cataLogo from "@/assets/logos/logo.svg";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dateString;
  }
};

const getClientInitials = (name = "") => {
  const clean = String(name || "").trim();
  if (!clean || clean.toLowerCase().includes("guest")) return "C";
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return clean.slice(0, 2).toUpperCase();
};

const getCleanPhoneNumber = (phone = "") => {
  if (!phone || phone === "N/A") return "";
  return phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
};

const AdminServicesActivity = () => {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activityData, setActivityData] = useState(null);

  // Filters & Pagination State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [documentFilter, setDocumentFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  // Session Detail Modal State
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [sessionDetail, setSessionDetail] = useState(null);

  const fetchServicesActivity = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "20");
      if (search.trim()) params.append("search", search.trim());
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (serviceFilter !== "ALL") params.append("serviceId", serviceFilter);
      if (documentFilter === "DOCUMENTS_ONLY") params.append("hasDocument", "true");

      const response = await authFetch(`/admin/services-activity?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch services activity data.");
      }

      const result = await response.json();
      if (result.success) {
        setActivityData(result.data);
      }
    } catch (err) {
      toast.error(err.message || "Failed to load services chat activity.");
    } finally {
      setLoading(false);
    }
  }, [authFetch, page, search, statusFilter, serviceFilter, documentFilter]);

  useEffect(() => {
    fetchServicesActivity();
  }, [fetchServicesActivity]);

  const handleOpenDetail = async (sessionId) => {
    setSelectedSessionId(sessionId);
    setDetailModalOpen(true);
    setDetailLoading(true);
    setSessionDetail(null);

    try {
      const response = await authFetch(`/admin/services-activity/${sessionId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch session detail.");
      }

      const result = await response.json();
      if (result.success) {
        setSessionDetail(result.data);
      }
    } catch (err) {
      toast.error(err.message || "Failed to load session transcript.");
    } finally {
      setDetailLoading(false);
    }
  };

  const copyToClipboard = (text, label = "Text") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard.`);
  };

  const metrics = activityData?.metrics || {
    totalSessions: 0,
    totalProposals: 0,
    totalDocuments: 0,
    totalDropOffs: 0,
    totalInProgress: 0,
    topServices: [],
  };

  const sessions = activityData?.sessions || [];
  const pagination = activityData?.pagination || { page: 1, totalPages: 1, totalRecords: 0 };

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        {/* Top Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600">
                <Bot className="h-6 w-6" />
              </div>
              Client Activity & Lead Analytics
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Comprehensive tracking for client chats, contact details (Call, WhatsApp, Email), uploaded documents, and AI usage & cost analytics.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchServicesActivity}
            disabled={loading}
            className="flex items-center gap-1.5 self-start sm:self-auto rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
        </div>

        {/* KPI Grid - 6 Analytics Cards */}
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all rounded-2xl bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Sessions
              </CardTitle>
              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600">
                <MessageSquare className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-slate-900">
                {metrics.totalSessions}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Total client chats started
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all rounded-2xl bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Proposals Created
              </CardTitle>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                <FileCheck className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-emerald-600">
                {metrics.totalProposals}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Completed & proposal generated
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all rounded-2xl bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Docs Uploaded
              </CardTitle>
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600">
                <FileText className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-indigo-600">
                {metrics.totalDocuments}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Sessions with uploaded files
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all rounded-2xl bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                AI Usage & Cost
              </CardTitle>
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
                <Cpu className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-extrabold text-purple-700">
                {metrics.formattedTotalAiCostINR || "₹0.00"}
                <span className="text-[11px] font-normal text-slate-500 ml-1">({metrics.formattedTotalAiCostUSD || "$0.00"})</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 truncate">
                {(metrics.totalAiTokens || 0).toLocaleString()} tokens ({metrics.totalAiCalls || 0} calls)
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all rounded-2xl bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Dropped Off
              </CardTitle>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                <UserX className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-amber-600">
                {metrics.totalDropOffs}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Left chat before proposal
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all rounded-2xl bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                In Progress
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                <Activity className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-blue-600">
                {metrics.totalInProgress}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Active / ongoing chats
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Card */}
        <Card className="border-slate-200 rounded-2xl shadow-sm bg-white">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search by client name, phone, email, session ID..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10 rounded-xl border-slate-200 bg-white"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <Select
                    value={statusFilter}
                    onValueChange={(val) => {
                      setStatusFilter(val);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[170px] rounded-xl border-slate-200 bg-white">
                      <SelectValue placeholder="Status Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Statuses</SelectItem>
                      <SelectItem value="PROPOSAL_GENERATED">Proposal Generated</SelectItem>
                      <SelectItem value="DROPPED_OFF">Dropped Off</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Select
                  value={documentFilter}
                  onValueChange={(val) => {
                    setDocumentFilter(val);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[180px] rounded-xl border-slate-200 bg-white">
                    <SelectValue placeholder="Document Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Sessions</SelectItem>
                    <SelectItem value="DOCUMENTS_ONLY">📄 Uploaded Docs Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sessions Activity Table */}
        <Card className="border-slate-200 rounded-2xl shadow-sm bg-white overflow-hidden">
          <CardContent className="p-0 overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-16 space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                <p className="text-sm font-medium text-slate-500">Loading services chat activity & analytics...</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 text-center space-y-3">
                <div className="p-4 rounded-full bg-slate-100 text-slate-400">
                  <MessageSquare className="h-8 w-8" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  No Services Chat Activity Found
                </h3>
                <p className="text-sm text-slate-500 max-w-sm">
                  No sessions match your search or filter parameters. Try clearing your filters or refreshing data.
                </p>
              </div>
            ) : (
              <Table className="min-w-[1470px] w-full">
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700 whitespace-nowrap w-[250px] min-w-[250px]">Client & Direct Contact</TableHead>
                    <TableHead className="font-semibold text-slate-700 whitespace-nowrap w-[160px] min-w-[160px]">Uploaded Document</TableHead>
                    <TableHead className="font-semibold text-slate-700 whitespace-nowrap w-[180px] min-w-[180px]">Service & Session</TableHead>
                    <TableHead className="font-semibold text-slate-700 whitespace-nowrap w-[200px] min-w-[200px]">AI Consumption & Cost</TableHead>
                    <TableHead className="font-semibold text-slate-700 whitespace-nowrap w-[220px] min-w-[220px]">Progress & Stage</TableHead>
                    <TableHead className="font-semibold text-slate-700 whitespace-nowrap w-[150px] min-w-[150px]">Status</TableHead>
                    <TableHead className="font-semibold text-slate-700 whitespace-nowrap w-[150px] min-w-[150px]">Last Active</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700 whitespace-nowrap w-[160px] min-w-[160px] sticky right-0 bg-slate-50 z-20 shadow-[-6px_0_12px_-4px_rgba(0,0,0,0.08)]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => {
                    const { client, documentData } = session;
                    const cleanPhone = getCleanPhoneNumber(client.phone);

                    return (
                      <TableRow key={session.id} className="hover:bg-slate-50/80 transition-colors group">
                        {/* Client Name, Phone, Email & Direct Actions */}
                        <TableCell className="w-[250px] min-w-[250px]">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white font-bold text-xs shadow-sm mt-0.5">
                              {getClientInitials(client.name)}
                            </div>
                            <div className="flex flex-col gap-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900 text-sm truncate">
                                  {client.name}
                                </span>
                                {client.isRegisteredUser && (
                                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 font-medium">
                                    Account
                                  </Badge>
                                )}
                              </div>

                              {/* Phone & Direct Buttons */}
                              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 font-medium">
                                <span className="flex items-center gap-1 text-slate-700">
                                  <Phone className="h-3 w-3 text-emerald-500" />
                                  {client.phone}
                                </span>

                                {cleanPhone && (
                                  <div className="flex items-center gap-1 ml-1">
                                    <a
                                      href={`tel:${client.phone}`}
                                      className="p-1 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                      title="Call Client Direct"
                                    >
                                      <Phone className="h-3 w-3" />
                                    </a>
                                    <a
                                      href={`https://wa.me/${cleanPhone}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1 rounded-md bg-green-50 text-green-600 hover:bg-green-100 transition-colors font-bold text-[10px]"
                                      title="Open WhatsApp Chat"
                                    >
                                      WA
                                    </a>
                                  </div>
                                )}
                              </div>

                              {/* Email */}
                              {client.email && client.email !== "N/A" && (
                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                  <Mail className="h-3 w-3 text-slate-400" />
                                  <a
                                    href={`mailto:${client.email}`}
                                    className="hover:underline text-slate-600 truncate max-w-[180px]"
                                    title={client.email}
                                  >
                                    {client.email}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Uploaded Document Badge & Analytics */}
                        <TableCell className="w-[160px] min-w-[160px]">
                          {documentData?.hasDocument ? (
                            <div className="flex flex-col gap-1">
                              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 rounded-lg font-semibold w-fit flex items-center gap-1">
                                <FileText className="h-3.5 w-3.5 text-indigo-600" />
                                Doc Uploaded ({documentData.attachmentCount || 1})
                              </Badge>
                              {documentData.attachments?.[0]?.name && (
                                <span className="text-[11px] text-slate-500 truncate max-w-[150px]" title={documentData.attachments[0].name}>
                                  {documentData.attachments[0].name}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">No File Uploaded</span>
                          )}
                        </TableCell>

                        {/* Service & Session ID */}
                        <TableCell className="w-[180px] min-w-[180px]">
                          <div className="flex flex-col gap-1">
                            <Badge variant="outline" className="font-medium rounded-lg bg-slate-50 text-slate-800 border-slate-200 w-fit">
                              {session.serviceLabel}
                            </Badge>
                            <div className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                              <span className="truncate max-w-[100px]">{session.id}</span>
                              <button
                                onClick={() => copyToClipboard(session.id, "Session ID")}
                                className="p-0.5 text-slate-400 hover:text-slate-700 transition-colors"
                                title="Copy Session ID"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </TableCell>

                        {/* AI Consumption & Cost */}
                        <TableCell className="w-[200px] min-w-[200px]">
                          <div className="flex flex-col gap-1">
                            <Badge className="bg-purple-50 text-purple-700 border-purple-200 rounded-lg font-semibold w-fit flex items-center gap-1">
                              <Cpu className="h-3 w-3 text-purple-600" />
                              {session.aiUsage?.formattedCostINR || "₹0.00"}
                              <span className="text-[10px] opacity-80 font-mono">({session.aiUsage?.formattedCostUSD || "$0.0000"})</span>
                            </Badge>
                            <span className="text-[11px] text-slate-500 font-medium">
                              {(session.aiUsage?.totalTokens || 0).toLocaleString()} tokens • {session.aiUsage?.callCount || 0} calls
                            </span>
                          </div>
                        </TableCell>

                        {/* Progress Stage */}
                        <TableCell className="w-[220px] min-w-[220px]">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold text-slate-800">
                              {session.status === "PROPOSAL_GENERATED"
                                ? "Completed (Proposal Generated)"
                                : session.dropOffQuestion}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {session.messageCount} messages exchanged
                            </span>
                          </div>
                        </TableCell>

                        {/* Status Badge */}
                        <TableCell className="w-[150px] min-w-[150px]">
                          {session.status === "PROPOSAL_GENERATED" ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 rounded-lg font-semibold">
                              <FileCheck className="h-3 w-3 mr-1" />
                              Proposal Generated
                            </Badge>
                          ) : session.status === "DROPPED_OFF" ? (
                            <Badge className="bg-amber-50 text-amber-700 border-amber-200 rounded-lg font-semibold">
                              <UserX className="h-3 w-3 mr-1" />
                              Dropped Off
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-50 text-blue-700 border-blue-200 rounded-lg font-semibold">
                              <Activity className="h-3 w-3 mr-1" />
                              In Progress
                            </Badge>
                          )}
                        </TableCell>

                        {/* Timestamps */}
                        <TableCell className="text-xs text-slate-500 whitespace-nowrap w-[150px] min-w-[150px]">
                          {formatDate(session.updatedAt)}
                        </TableCell>

                        {/* Action - Sticky Right */}
                        <TableCell className="text-right whitespace-nowrap w-[160px] min-w-[160px] sticky right-0 bg-white group-hover:bg-slate-50 z-20 shadow-[-6px_0_12px_-4px_rgba(0,0,0,0.08)]">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenDetail(session.id)}
                              className="flex items-center gap-1 rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View Detail
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigate(`/admin/services-activity/${session.id}`)}
                              className="flex items-center gap-1 rounded-xl text-slate-500 hover:text-slate-900"
                              title="Open Full Page View"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-slate-500">
              Showing {sessions.length} of {pagination.totalRecords} sessions
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="rounded-xl border-slate-200 bg-white text-slate-700"
              >
                Previous
              </Button>
              <span className="text-xs text-slate-600 font-medium">
                Page {page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                className="rounded-xl border-slate-200 bg-white text-slate-700"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* --- SESSION DETAIL MODAL (WITH DIRECT CONTACT & DOCUMENT ANALYTICS) --- */}
        <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
          <DialogContent className="max-w-4xl max-h-[92vh] h-[92vh] overflow-hidden flex flex-col p-0 border border-slate-200 rounded-3xl shadow-2xl bg-white">
            {/* Modal Header Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white text-slate-900 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    Client Activity & AI Lead Analytics
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Session ID: {sessionDetail?.id || selectedSessionId}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {sessionDetail?.id && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/admin/services-activity/${sessionDetail.id}`)}
                      className="h-8 text-xs rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-1" /> Full Page
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(sessionDetail.id, "Session ID")}
                      className="h-8 text-xs rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                      <Copy className="h-3.5 w-3.5 mr-1" /> Copy ID
                    </Button>
                  </>
                )}
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body Viewport */}
            {detailLoading ? (
              <div className="flex flex-col items-center justify-center p-16 space-y-3 flex-1">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                <p className="text-sm font-medium text-slate-500">Loading chat transcript, document analytics, and client details...</p>
              </div>
            ) : sessionDetail ? (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Top Client Summary & Direct Contact Banner */}
                <div className="rounded-2xl bg-slate-50 p-5 border border-slate-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    {/* Column 1: Client Profile */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white font-extrabold text-base shadow-md shadow-orange-500/20">
                        {getClientInitials(sessionDetail.client?.name)}
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-slate-900 truncate">
                            {sessionDetail.client?.name || "Guest Client"}
                          </span>
                          {sessionDetail.client?.isRegisteredUser && (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                              Client Account
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-emerald-500" />
                          {sessionDetail.client?.phone || "Phone Not Provided"}
                        </span>
                        {sessionDetail.client?.email && sessionDetail.client.email !== "N/A" && (
                          <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5 truncate">
                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                            {sessionDetail.client.email}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Column 2: Direct Contact Actions */}
                    <div className="flex flex-col gap-2 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-6">
                      <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                        Direct Client Outreach
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {sessionDetail.client?.phone && sessionDetail.client.phone !== "N/A" && (
                          <>
                            <a
                              href={`tel:${sessionDetail.client.phone}`}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs px-3 py-1.5 border border-emerald-200 transition-colors"
                            >
                              <Phone className="h-3.5 w-3.5" /> Call Direct
                            </a>
                            {getCleanPhoneNumber(sessionDetail.client.phone) && (
                              <a
                                href={`https://wa.me/${getCleanPhoneNumber(sessionDetail.client.phone)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 font-semibold text-xs px-3 py-1.5 border border-green-200 transition-colors"
                              >
                                <Send className="h-3.5 w-3.5" /> WhatsApp
                              </a>
                            )}
                          </>
                        )}
                        {sessionDetail.client?.email && sessionDetail.client.email !== "N/A" && (
                          <a
                            href={`mailto:${sessionDetail.client.email}`}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs px-3 py-1.5 border border-blue-200 transition-colors"
                          >
                            <Mail className="h-3.5 w-3.5" /> Email Client
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Column 3: Live Chat & Service Status */}
                    <div className="flex flex-col gap-2 items-stretch md:items-end border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-6">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-white text-slate-800 border-slate-200 text-xs font-semibold">
                          {sessionDetail.serviceLabel}
                        </Badge>
                        {sessionDetail.documentData?.hasDocument && (
                          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs font-semibold">
                            📄 Doc Uploaded
                          </Badge>
                        )}
                      </div>
                      <a
                        href={`/services?service=${sessionDetail.serviceId}&chat=${sessionDetail.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs px-4 py-2.5 shadow-md shadow-orange-500/20 transition-all hover:scale-[1.02]"
                      >
                        <ExternalLink className="h-4 w-4" /> Open Live Chat Page
                      </a>
                    </div>
                  </div>
                </div>

                {/* 4-Tab System: Transcript vs Document Data vs AI Usage vs Extracted Answers */}
                <Tabs defaultValue={sessionDetail.documentData?.hasDocument ? "documents" : "transcript"} className="w-full">
                  <TabsList className="grid w-full grid-cols-4 rounded-xl bg-slate-100 p-1 border border-slate-200">
                    <TabsTrigger value="transcript" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                      <MessageSquare className="h-3.5 w-3.5 mr-1 text-orange-500" />
                      Transcript ({sessionDetail.messages?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                      <FileText className="h-3.5 w-3.5 mr-1 text-indigo-500" />
                      Documents ({sessionDetail.documentData?.attachmentCount || 0})
                    </TabsTrigger>
                    <TabsTrigger value="ai_usage" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                      <Cpu className="h-3.5 w-3.5 mr-1 text-purple-600" />
                      AI Cost & Tokens
                    </TabsTrigger>
                    <TabsTrigger value="answers" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                      <Layers className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                      Brief & Answers
                    </TabsTrigger>
                  </TabsList>

                  {/* Tab 1: Chat Messages Transcript */}
                  <TabsContent value="transcript" className="mt-4 space-y-4">
                    <div className="space-y-4">
                      {sessionDetail.messages?.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                          No messages recorded in this chat session transcript.
                        </div>
                      ) : (
                        sessionDetail.messages.map((msg, idx) => {
                          const isAssistant = msg.role === "assistant";
                          return (
                            <div
                              key={msg.id || idx}
                              className={`flex gap-3 items-start ${
                                isAssistant ? "justify-start" : "justify-end"
                              }`}
                            >
                              {isAssistant && (
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 shadow-sm mt-1">
                                  <img src={cataLogo} alt="AI logo" className="h-5 w-5 object-contain" />
                                </div>
                              )}

                              <div
                                className={`flex flex-col gap-1.5 max-w-[82%] rounded-2xl p-4 shadow-sm border ${
                                  isAssistant
                                    ? "bg-slate-50 border-slate-200 text-slate-900"
                                    : "bg-orange-50/90 border-orange-200 text-slate-900"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-4 font-semibold text-xs pb-2 border-b border-slate-200/80">
                                  <span className={isAssistant ? "text-orange-600 font-bold" : "text-orange-700 font-bold"}>
                                    {isAssistant ? "CATA AI Assistant" : `User (${sessionDetail.client?.name})`}
                                  </span>
                                  <span className="text-slate-400 font-normal text-[11px]">{formatDate(msg.createdAt)}</span>
                                </div>

                                <div className="prose prose-sm max-w-none break-words text-sm leading-relaxed text-slate-800 prose-p:my-1 prose-headings:text-slate-900 prose-headings:font-semibold prose-strong:text-slate-900 prose-li:text-slate-800">
                                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>

                                {/* Display Message Attachment if Present */}
                                {msg.attachment && typeof msg.attachment === "object" && (
                                  <div className="mt-2 p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                      <Paperclip className="h-4 w-4 text-indigo-500 shrink-0" />
                                      <span className="text-xs font-semibold text-slate-800 truncate" title={msg.attachment.name}>
                                        {msg.attachment.name || "Attachment"}
                                      </span>
                                    </div>
                                    {msg.attachment.url && (
                                      <a
                                        href={msg.attachment.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                                        title="Download Attachment"
                                      >
                                        <Download className="h-3.5 w-3.5" />
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>

                              {!isAssistant && (
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white font-bold text-xs shadow-md mt-1">
                                  {getClientInitials(sessionDetail.client?.name)}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </TabsContent>

                  {/* Tab 2: Uploaded Document Analytics & Content */}
                  <TabsContent value="documents" className="mt-4 space-y-4">
                    {!sessionDetail.documentData?.hasDocument ? (
                      <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                        <FileText className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-700">No Document Uploaded in this Session</p>
                        <p className="text-xs text-slate-500 mt-1">The user interacted directly via chat questionnaire prompts.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* File Cards Grid */}
                        {sessionDetail.documentData.attachments?.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                              Uploaded File Attachments ({sessionDetail.documentData.attachments.length})
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {sessionDetail.documentData.attachments.map((file, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
                                  <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                                      <FileText className="h-5 w-5" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-sm font-bold text-slate-900 truncate" title={file.name}>
                                        {file.name || `Document ${i + 1}`}
                                      </span>
                                      <span className="text-xs text-slate-500 font-medium">
                                        {file.type || "Document File"} {file.size ? `• ${Math.round(file.size / 1024)} KB` : ""}
                                      </span>
                                    </div>
                                  </div>
                                  {file.url && (
                                    <a
                                      href={file.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3 py-2 shadow-sm transition-all shrink-0"
                                    >
                                      <Download className="h-3.5 w-3.5" /> View / Download
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Extracted Document Context Text Box */}
                        {sessionDetail.documentData.extractedText && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs uppercase font-bold text-slate-500 tracking-wider flex items-center gap-2">
                                Extracted Document Context & AI Insights
                              </h4>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyToClipboard(sessionDetail.documentData.extractedText, "Document context")}
                                className="h-7 text-xs rounded-lg border-slate-200 text-slate-700"
                              >
                                <Copy className="h-3 w-3 mr-1" /> Copy Text
                              </Button>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-900 text-slate-100 p-5 font-mono text-xs leading-relaxed max-h-[300px] overflow-y-auto whitespace-pre-wrap shadow-inner">
                              {sessionDetail.documentData.extractedText}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>

                  {/* Tab 3: AI Usage & Token Cost Analytics */}
                  <TabsContent value="ai_usage" className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50/60 space-y-1">
                        <span className="text-xs uppercase font-bold text-purple-700 tracking-wider flex items-center gap-1.5">
                          <Cpu className="h-4 w-4 text-purple-600" /> Total Estimated Cost
                        </span>
                        <p className="text-2xl font-extrabold text-purple-950">
                          {sessionDetail.aiUsage?.formattedCostINR || "₹0.00"}
                        </p>
                        <p className="text-xs text-purple-700 font-mono font-medium">
                          {sessionDetail.aiUsage?.formattedCostUSD || "$0.0000"} USD
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-1">
                        <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                          Total Tokens Consumed
                        </span>
                        <p className="text-2xl font-extrabold text-slate-900">
                          {(sessionDetail.aiUsage?.totalTokens || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500">
                          Input: {(sessionDetail.aiUsage?.promptTokens || 0).toLocaleString()} • Output: {(sessionDetail.aiUsage?.completionTokens || 0).toLocaleString()}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-1">
                        <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                          AI Model & Call Count
                        </span>
                        <p className="text-base font-bold text-slate-900 truncate">
                          {sessionDetail.aiUsage?.modelName || "GPT-4o-mini / Gemini Flash"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {sessionDetail.aiUsage?.callCount || 0} total AI turns executed
                        </p>
                      </div>
                    </div>

                    {/* Detailed Token Breakdown Box */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-sm">
                      <h4 className="text-xs uppercase font-bold text-slate-700 tracking-wider flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-purple-600" /> AI Usage & Token Accounting Breakdown
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-slate-500 block mb-1">Prompt (Input) Tokens</span>
                          <span className="font-extrabold text-slate-900 text-sm">{(sessionDetail.aiUsage?.promptTokens || 0).toLocaleString()}</span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-slate-500 block mb-1">Completion (Output) Tokens</span>
                          <span className="font-extrabold text-slate-900 text-sm">{(sessionDetail.aiUsage?.completionTokens || 0).toLocaleString()}</span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200">
                          <span className="text-purple-700 block font-semibold mb-1">Cost in INR (₹)</span>
                          <span className="font-extrabold text-purple-900 text-sm">{sessionDetail.aiUsage?.formattedCostINR || "₹0.00"}</span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200">
                          <span className="text-purple-700 block font-semibold mb-1">Cost in USD ($)</span>
                          <span className="font-extrabold text-purple-900 text-sm">{sessionDetail.aiUsage?.formattedCostUSD || "$0.0000"}</span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Tab 4: Extracted Answers & Brief */}
                  <TabsContent value="answers" className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.keys(sessionDetail.answers?.bySlug || {}).length === 0 ? (
                        <div className="col-span-2 text-center py-12 text-slate-400">
                          No specific questionnaire answers captured yet.
                        </div>
                      ) : (
                        Object.entries(sessionDetail.answers?.bySlug || {}).map(([key, val]) => (
                          <div
                            key={key}
                            className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1"
                          >
                            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                              {key.replace(/_/g, " ")}
                            </span>
                            <p className="text-sm font-semibold text-slate-900 break-words">
                              {typeof val === "object" ? JSON.stringify(val) : String(val)}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminServicesActivity;
