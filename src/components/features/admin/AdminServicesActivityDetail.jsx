import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useAuth } from "@/shared/context/AuthContext";
import Activity from "lucide-react/dist/esm/icons/activity";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import Bot from "lucide-react/dist/esm/icons/bot";
import Copy from "lucide-react/dist/esm/icons/copy";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import FileCheck from "lucide-react/dist/esm/icons/file-check";
import Layers from "lucide-react/dist/esm/icons/layers";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import MessageSquare from "lucide-react/dist/esm/icons/message-square";
import Phone from "lucide-react/dist/esm/icons/phone";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import User from "lucide-react/dist/esm/icons/user";
import UserX from "lucide-react/dist/esm/icons/user-x";
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

const AdminServicesActivityDetail = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [loading, setLoading] = useState(true);
  const [sessionDetail, setSessionDetail] = useState(null);

  const fetchSessionDetail = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
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
      toast.error(err.message || "Failed to load services chat detail.");
    } finally {
      setLoading(false);
    }
  }, [authFetch, sessionId]);

  useEffect(() => {
    fetchSessionDetail();
  }, [fetchSessionDetail]);

  const copyToClipboard = (text, label = "Text") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard.`);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-6 max-w-6xl mx-auto">
        {/* Navigation & Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/admin/services-activity")}
              className="rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back to Services Activity
            </Button>
            <div className="h-4 w-[1px] bg-slate-300 hidden sm:block" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Bot className="h-5 w-5 text-orange-500" />
              Chat Session Detail
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSessionDetail}
              disabled={loading}
              className="rounded-xl border-slate-200 bg-white text-slate-700"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            {sessionId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(sessionId, "Session ID")}
                className="rounded-xl border-slate-200 bg-white text-slate-700 font-mono text-xs"
              >
                <Copy className="h-3.5 w-3.5 mr-1" />
                Copy ID
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 space-y-3 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <p className="text-sm font-medium text-slate-500">Loading session transcript and details...</p>
          </div>
        ) : sessionDetail ? (
          <div className="space-y-6">
            {/* Top Light Theme Client Summary Card */}
            <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Column 1: Client Profile */}
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white font-extrabold text-lg shadow-md shadow-orange-500/20">
                    {getClientInitials(sessionDetail.client?.name)}
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-slate-900 truncate">
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
                  </div>
                </div>

                {/* Column 2: Service & Status */}
                <div className="flex flex-col gap-2 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Service</span>
                    <Badge variant="outline" className="bg-slate-50 text-slate-800 border-slate-200 text-xs font-semibold">
                      {sessionDetail.serviceLabel}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Status</span>
                    {sessionDetail.status === "PROPOSAL_GENERATED" ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold">
                        <FileCheck className="h-3 w-3 mr-1" />
                        Proposal Created
                      </Badge>
                    ) : sessionDetail.status === "DROPPED_OFF" ? (
                      <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-semibold">
                        <UserX className="h-3 w-3 mr-1" />
                        Dropped Off
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-semibold">
                        <Activity className="h-3 w-3 mr-1" />
                        In Progress
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Column 3: Live Chat Action */}
                <div className="flex flex-col gap-2.5 items-stretch md:items-end border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
                  <span className="text-xs text-slate-500 font-medium">
                    Started: {formatDate(sessionDetail.createdAt)}
                  </span>
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

            {/* Tabbed View: Transcript vs Extracted Answers */}
            <Tabs defaultValue="transcript" className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-slate-100 p-1 border border-slate-200">
                <TabsTrigger value="transcript" className="rounded-xl text-xs font-semibold py-2.5 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                  <MessageSquare className="h-4 w-4 mr-2 text-orange-500" />
                  Chat Message Transcript ({sessionDetail.messages?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="answers" className="rounded-xl text-xs font-semibold py-2.5 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                  <Layers className="h-4 w-4 mr-2 text-orange-500" />
                  Extracted Brief & Captured Answers
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Chat Messages Transcript */}
              <TabsContent value="transcript" className="mt-6 space-y-4">
                <Card className="border-slate-200 rounded-3xl p-6 shadow-sm bg-white">
                  <div className="space-y-5">
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
                            {/* Assistant Avatar */}
                            {isAssistant && (
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 shadow-sm mt-1">
                                <img src={cataLogo} alt="AI logo" className="h-5 w-5 object-contain" />
                              </div>
                            )}

                            {/* Message Box */}
                            <div
                              className={`flex flex-col gap-1.5 max-w-[85%] rounded-2xl p-4.5 shadow-sm border ${
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
                            </div>

                            {/* User Avatar */}
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
                </Card>
              </TabsContent>

              {/* Tab 2: Extracted Answers & Brief */}
              <TabsContent value="answers" className="mt-6">
                <Card className="border-slate-200 rounded-3xl p-6 shadow-sm bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.keys(sessionDetail.answers?.bySlug || {}).length === 0 ? (
                      <div className="col-span-2 text-center py-12 text-slate-400">
                        No specific questionnaire answers captured yet.
                      </div>
                    ) : (
                      Object.entries(sessionDetail.answers?.bySlug || {}).map(([key, val]) => (
                        <div
                          key={key}
                          className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-1"
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
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
};

export default AdminServicesActivityDetail;
