import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import Send from "lucide-react/dist/esm/icons/send";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import CalendarIcon from "lucide-react/dist/esm/icons/calendar";
import Search from "lucide-react/dist/esm/icons/search";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle";
import User from "lucide-react/dist/esm/icons/user";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import Slash from "lucide-react/dist/esm/icons/slash";
import { useAuth } from "@/shared/context/AuthContext";
import { useNotifications } from "@/shared/context/NotificationContext";
import { PmShell } from "@/modules/project-manager/components/PmShell";
import { useAsyncResource } from "@/modules/project-manager/hooks/use-async-resource";
import { pmApi } from "@/modules/project-manager/services/pm-api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/shared/lib/utils";

const POLL_INTERVAL_MS = 10000;

const resolveNotificationProjectId = (notification) => {
  const directProjectId = notification?.data?.projectId;
  if (directProjectId) {
    return String(directProjectId);
  }

  const service = String(notification?.data?.service || "");
  const parts = service.split(":");
  if (parts.length >= 4 && parts[0] === "CHAT") {
    return parts[1];
  }

  return "";
};

const getInitials = (name = "") => {
  const words = String(name).trim().split(/\s+/);
  if (!words[0]) return "P";
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

const resolveClientName = (project) => {
  if (!project) return "Client";
  if (typeof project.clientName === "string" && project.clientName.trim()) {
    return project.clientName.trim();
  }
  if (project.owner?.fullName?.trim()) {
    return project.owner.fullName.trim();
  }
  if (project.client?.fullName?.trim()) {
    return project.client.fullName.trim();
  }
  if (project.client?.name?.trim()) {
    return project.client.name.trim();
  }
  return "Client";
};

const resolveFreelancerName = (project) => {
  if (!project) return "Unassigned";

  if (typeof project.assignedFreelancer === "string" && project.assignedFreelancer.trim()) {
    return project.assignedFreelancer.trim();
  }
  if (typeof project.assignedFreelancerName === "string" && project.assignedFreelancerName.trim()) {
    return project.assignedFreelancerName.trim();
  }
  if (typeof project.freelancerName === "string" && project.freelancerName.trim() && project.freelancerName.trim() !== "Unassigned") {
    return project.freelancerName.trim();
  }
  if (typeof project.freelancer === "string" && project.freelancer.trim()) {
    return project.freelancer.trim();
  }
  if (project.freelancer?.fullName?.trim()) {
    return project.freelancer.fullName.trim();
  }
  if (project.freelancer?.name?.trim()) {
    return project.freelancer.name.trim();
  }

  const proposalRows = Array.isArray(project.proposals) ? project.proposals : [];
  const acceptedProposal =
    proposalRows.find((p) => String(p?.status || "").toUpperCase() === "ACCEPTED" && p?.freelancer) ||
    proposalRows.find((p) => String(p?.status || "").toUpperCase() === "REPLACED" && p?.freelancer) ||
    proposalRows.find((p) => p?.freelancer);

  if (acceptedProposal?.freelancer?.fullName?.trim()) {
    return acceptedProposal.freelancer.fullName.trim();
  }
  if (acceptedProposal?.freelancer?.name?.trim()) {
    return acceptedProposal.freelancer.name.trim();
  }

  return "Unassigned";
};

const getProjectMessagePreview = (project) => {
  if (!project) return "No messages yet";

  const rawText =
    project.lastMessage ||
    project.lastMessageText ||
    project.latestMessage ||
    project.previewText ||
    "";

  if (!rawText) {
    return "No messages yet";
  }

  const clean = String(rawText)
    .replace(/^\[SCOPE:\w+\]\s*/i, "")
    .replace(/^\[System\]/i, "[Project Manager]")
    .trim();

  if (/meeting/i.test(clean) && (clean.includes("scheduled") || clean.includes("Invitation") || clean.includes("Join"))) {
    const titleMatch = clean.match(/"([^"]+)"/);
    const title = titleMatch ? titleMatch[1] : "Project Sync";
    return `📅 Meeting Scheduled: ${title}`;
  }

  return clean;
};

const formatProjectTime = (timestamp) => {
  if (!timestamp) return "";
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "";

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return "";
  }
};

const MessagesPage = () => {
  const { authFetch } = useAuth();
  const { notifications, markChatAsRead } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [composer, setComposer] = useState("");
  const [messageScope, setMessageScope] = useState("BOTH");
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [sending, setSending] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const listEndRef = useRef(null);

  const dashboard = useAsyncResource(() => pmApi.getDashboard(authFetch), [authFetch]);
  const rawProjects = useMemo(() => dashboard.data?.projects || [], [dashboard.data?.projects]);

  const messages = useAsyncResource(
    () => {
      if (!selectedProjectId) {
        return Promise.resolve({ messages: [] });
      }
      return pmApi.getProjectMessages(authFetch, selectedProjectId);
    },
    [authFetch, selectedProjectId]
  );

  const conversationRows = useMemo(
    () => (Array.isArray(messages.data?.messages) ? messages.data.messages : []),
    [messages.data?.messages]
  );

  const projects = useMemo(
    () =>
      rawProjects.map((p) => {
        const isCurrent = p.id === selectedProjectId;
        const lastConvMsg = isCurrent && conversationRows.length > 0
          ? conversationRows[conversationRows.length - 1]
          : null;

        return {
          ...p,
          clientName: resolveClientName(p),
          freelancerName: resolveFreelancerName(p),
          lastMessage: lastConvMsg?.content || p.lastMessage || p.latestMessage || p.previewText || "",
          lastActivityTime: lastConvMsg?.createdAt || p.lastActivityTime || p.lastMessageAt || p.updatedAt,
        };
      }),
    [conversationRows, rawProjects, selectedProjectId]
  );

  const filteredProjects = useMemo(() => {
    const query = projectSearch.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter(
      (p) =>
        String(p.projectName || "").toLowerCase().includes(query) ||
        String(p.clientName || "").toLowerCase().includes(query) ||
        String(p.freelancerName || "").toLowerCase().includes(query)
    );
  }, [projects, projectSearch]);

  const selectedProjectExists = useMemo(
    () => projects.some((project) => project.id === selectedProjectId),
    [projects, selectedProjectId]
  );

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  const latestChatNotification = useMemo(
    () =>
      notifications.find(
        (notification) => String(notification?.type || "").toLowerCase() === "chat"
      ) || null,
    [notifications]
  );
  const latestChatNotificationId = latestChatNotification?.id || "";
  const latestChatNotificationProjectId = useMemo(
    () => resolveNotificationProjectId(latestChatNotification),
    [latestChatNotification]
  );
  const isDashboardInitialLoading = dashboard.loading && !dashboard.data;
  const hasProjectRows = projects.length > 0;
  const isMessagesInitialLoading =
    messages.loading && !Array.isArray(messages.data?.messages);
  const hasConversationRows = conversationRows.length > 0;

  const syncProjectQuery = useCallback(
    (projectId) => {
      const nextParams = new URLSearchParams(searchParams);
      if (projectId) {
        nextParams.set("projectId", projectId);
      } else {
        nextParams.delete("projectId");
      }
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const selectProject = useCallback(
    (projectId) => {
      setComposer("");
      messages.setData({ messages: [] });
      setSelectedProjectId(projectId);
      syncProjectQuery(projectId);
    },
    [messages.setData, syncProjectQuery]
  );

  const clearSelectedProjectUnread = useCallback(() => {
    if (!selectedProjectId) return;

    dashboard.setData((current) => {
      if (!current || !Array.isArray(current.projects)) {
        return current;
      }

      let unreadDelta = 0;
      const nextProjects = current.projects.map((project) => {
        if (project.id !== selectedProjectId || Number(project.unreadMessages || 0) <= 0) {
          return project;
        }

        unreadDelta += Number(project.unreadMessages || 0);
        return {
          ...project,
          unreadMessages: 0,
        };
      });

      if (!unreadDelta) {
        return current;
      }

      return {
        ...current,
        stats: current.stats
          ? {
              ...current.stats,
              unreadMessages: Math.max(
                0,
                Number(current.stats.unreadMessages || 0) - unreadDelta
              ),
            }
          : current.stats,
        projects: nextProjects,
      };
    });
  }, [dashboard.setData, selectedProjectId]);

  const refreshChatState = useCallback(
    async (isSilent = true) => {
      if (!selectedProjectId || !selectedProjectExists) {
        if (isSilent) {
          await dashboard.silentRefresh();
        } else {
          await dashboard.refresh();
        }
        return;
      }

      if (isSilent) {
        await Promise.all([
          dashboard.silentRefresh(),
          messages.silentRefresh(),
        ]);
      } else {
        await Promise.all([dashboard.refresh(), messages.refresh()]);
      }
    },
    [
      dashboard,
      messages,
      selectedProjectExists,
      selectedProjectId,
    ]
  );

  useEffect(() => {
    const projectIdFromQuery = searchParams.get("projectId");
    if (!projectIdFromQuery) return;
    setSelectedProjectId(projectIdFromQuery);
  }, [searchParams]);

  useEffect(() => {
    if (dashboard.loading) return;

    if (!projects.length) {
      if (selectedProjectId) {
        setSelectedProjectId("");
        syncProjectQuery("");
      }
      return;
    }

    if (!selectedProjectExists) {
      selectProject(projects[0].id);
    }
  }, [dashboard.loading, projects, selectProject, selectedProjectExists, selectedProjectId, syncProjectQuery]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conversationRows.length, selectedProjectId]);

  useEffect(() => {
    markChatAsRead().catch(() => null);
  }, [markChatAsRead]);

  useEffect(() => {
    if (!selectedProjectId || !selectedProjectExists) return undefined;

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      refreshChatState(true).catch(() => null);
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [refreshChatState, selectedProjectExists, selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId || messages.loading || messages.error) return;
    clearSelectedProjectUnread();
  }, [
    clearSelectedProjectUnread,
    messages.error,
    messages.loading,
    selectedProjectId,
    conversationRows.length,
  ]);

  useEffect(() => {
    if (!latestChatNotificationId) return;

    const notificationProjectId = latestChatNotificationProjectId;
    const shouldRefreshConversation =
      !notificationProjectId || notificationProjectId === selectedProjectId;

    if (shouldRefreshConversation) {
      refreshChatState(true).catch(() => null);
    } else {
      dashboard.silentRefresh().catch(() => null);
    }

    markChatAsRead().catch(() => null);
  }, [
    dashboard,
    latestChatNotificationId,
    latestChatNotificationProjectId,
    markChatAsRead,
    refreshChatState,
    selectedProjectId,
  ]);

  useEffect(() => {
    if (messages.error?.status !== 404 || !selectedProjectId) return undefined;

    let cancelled = false;

    const recoverSelection = async () => {
      const nextDashboard = await dashboard.refresh().catch(() => null);
      if (cancelled) return;

      const nextProjects = Array.isArray(nextDashboard?.projects) ? nextDashboard.projects : [];
      const stillExists = nextProjects.some((project) => project.id === selectedProjectId);

      if (stillExists) return;

      const fallbackProjectId = nextProjects[0]?.id || "";
      setSelectedProjectId(fallbackProjectId);
      syncProjectQuery(fallbackProjectId);
      toast.error("Selected project chat is no longer available.");
    };

    recoverSelection().catch(() => null);

    return () => {
      cancelled = true;
    };
  }, [dashboard, messages.error, selectedProjectId, syncProjectQuery]);

  const handleComposerChange = (e) => {
    const val = e.target.value;
    setComposer(val);

    if (/^\/client(\s+|$)/i.test(val)) {
      setMessageScope("CLIENT");
      setComposer(val.replace(/^\/client(\s+|$)/i, ""));
      setShowSlashMenu(false);
      toast.success(`Target set: Client Only (${selectedProject?.clientName || "Client"})`);
      return;
    }
    if (/^\/freelancer(\s+|$)/i.test(val)) {
      setMessageScope("FREELANCER");
      setComposer(val.replace(/^\/freelancer(\s+|$)/i, ""));
      setShowSlashMenu(false);
      toast.success(`Target set: Freelancer Only (${selectedProject?.freelancerName || "Freelancer"})`);
      return;
    }

    if (val.trim().startsWith("/")) {
      setShowSlashMenu(true);
    } else {
      setShowSlashMenu(false);
    }
  };

  const selectSlashCommand = (scope) => {
    setMessageScope(scope);
    setComposer((prev) => prev.replace(/^\/\w*/, "").trimStart());
    setShowSlashMenu(false);
    const scopeLabel =
      scope === "CLIENT"
        ? `Client Only (${selectedProject?.clientName || "Client"})`
        : scope === "FREELANCER"
        ? `Freelancer Only (${selectedProject?.freelancerName || "Freelancer"})`
        : "Everyone";
    toast.success(`Target set: ${scopeLabel}`);
  };

  const sendMessage = async () => {
    if (!selectedProjectId || !composer.trim()) return;
    setSending(true);
    try {
      setShowSlashMenu(false);
      let content = composer.trim();
      if (messageScope === "CLIENT") {
        content = `[SCOPE:CLIENT] ${content}`;
      } else if (messageScope === "FREELANCER") {
        content = `[SCOPE:FREELANCER] ${content}`;
      } else {
        content = `[SCOPE:BOTH] ${content}`;
      }

      await pmApi.sendProjectMessage(authFetch, selectedProjectId, content);
      setComposer("");
      await refreshChatState(true);
    } catch (error) {
      toast.error(error.message || "Message failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <PmShell
      title="Project Messages"
      subtitle="View all client and freelancer communication for assigned projects."
    >
      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-border bg-card shadow-xs h-[calc(100vh-19.5rem)] min-h-[500px] lg:h-[calc(100vh-20rem)] lg:min-h-[560px] lg:flex-row">
        {/* Left Sidebar: Projects List */}
        <aside className="flex w-full shrink-0 flex-col border-b border-border bg-card lg:w-[340px] xl:w-[360px] lg:border-b-0 lg:border-r min-h-0">
          {/* Search Header */}
          <div className="p-4 sm:p-5 border-b border-border/60 shrink-0">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                placeholder="Search project chats..."
                className="h-11 rounded-[16px] border-border bg-muted/40 pl-10 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          </div>

          {/* List Body */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 subtle-scrollbar">
            {isDashboardInitialLoading ? (
              <div className="flex min-h-[280px] items-center justify-center gap-2.5 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-primary" />
                <span>Syncing project chats...</span>
              </div>
            ) : dashboard.error && !hasProjectRows ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-center text-xs font-semibold text-destructive">
                Failed to load assigned project chats.
              </div>
            ) : projects.length === 0 ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center p-6 text-center text-muted-foreground">
                <MessageCircle className="size-8 opacity-40 mb-2" />
                <p className="text-sm font-semibold text-foreground">No assigned projects</p>
                <p className="text-xs mt-1">Project chats will appear here when assigned.</p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center p-6 text-center text-muted-foreground">
                <Search className="size-7 opacity-40 mb-2" />
                <p className="text-sm font-semibold text-foreground">No matching projects</p>
                <p className="text-xs mt-1">Try a different client or project title.</p>
              </div>
            ) : (
              filteredProjects.map((project) => {
                const isActive = selectedProjectId === project.id;
                const previewText = getProjectMessagePreview(project);
                const timeStr = formatProjectTime(project.lastActivityTime || project.lastMessageAt || project.updatedAt);

                return (
                  <button
                    type="button"
                    key={project.id}
                    onClick={() => selectProject(project.id)}
                    className={cn(
                      "relative flex w-full items-center gap-3.5 rounded-[18px] border border-transparent p-3 text-left transition-all cursor-pointer",
                      isActive
                        ? "bg-primary/10 border-primary/20 text-foreground before:absolute before:inset-y-2 before:left-0 before:w-[3.5px] before:rounded-full before:bg-primary"
                        : "hover:bg-muted/60 text-foreground"
                    )}
                  >
                    <Avatar className={cn("size-11 shrink-0 border", isActive ? "border-primary/40" : "border-border")}>
                      <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                        {getInitials(project.projectName)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn("truncate text-sm font-bold", isActive ? "text-primary" : "text-foreground")}>
                          {project.projectName}
                        </p>
                        {timeStr ? (
                          <span className="shrink-0 text-[10px] font-semibold text-muted-foreground">
                            {timeStr}
                          </span>
                        ) : null}
                      </div>
                      <p className="truncate text-xs font-medium text-muted-foreground mt-0.5">
                        Client: {project.clientName || "Client"} • Freelancer: {project.freelancerName || "Unassigned"}
                      </p>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <p className="truncate text-xs text-muted-foreground/80 font-medium min-w-0">
                          {previewText}
                        </p>
                        {project.unreadMessages > 0 ? (
                          <Badge variant="destructive" className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 animate-pulse">
                            {project.unreadMessages} unread
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Main Chat Area */}
        <main className="flex min-h-0 flex-1 flex-col bg-card overflow-hidden">
          {!selectedProjectId ? (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <div className="flex size-14 items-center justify-center rounded-full bg-muted/60 text-muted-foreground mb-4 border border-border">
                <MessageCircle className="size-7 opacity-70" />
              </div>
              <h3 className="text-base font-bold text-foreground">No Chat Selected</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Select a project workspace chat from the left panel to view messages and schedule syncs.
              </p>
            </div>
          ) : (
            <>
              {/* Chat Top Header */}
              <div className="flex items-center justify-between gap-4 border-b border-border bg-card px-5 py-3.5 sm:px-6 shrink-0">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative shrink-0">
                    <Avatar className="size-10 border border-border">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                        {getInitials(selectedProject?.projectName || "Chat")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-card bg-emerald-500" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-foreground tracking-[-0.01em]">
                      {selectedProject?.projectName || "Project Chat"}
                    </h3>
                    <p className="truncate text-xs font-medium text-muted-foreground mt-0.5">
                      Client: <span className="text-foreground font-semibold">{selectedProject?.clientName || "Client"}</span>
                      {" • "}
                      Freelancer: <span className="text-foreground font-semibold">{selectedProject?.freelancerName || "Unassigned"}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {messages.loading && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-3 py-1 rounded-full border border-border">
                      <Loader2 className="size-3.5 animate-spin text-primary" />
                      <span>Syncing</span>
                    </div>
                  )}
                  {selectedProject?.status ? (
                    <Badge className="bg-primary/10 text-primary border border-primary/20 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      {selectedProject.status}
                    </Badge>
                  ) : null}
                </div>
              </div>

              {/* Messages Timeline */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 bg-muted/10 subtle-scrollbar">
                  {isMessagesInitialLoading ? (
                    <div className="flex h-full min-h-[250px] items-center justify-center gap-2.5 text-sm text-muted-foreground">
                      <Loader2 className="size-5 animate-spin text-primary" />
                      <span>Loading conversation history...</span>
                    </div>
                  ) : messages.error && !hasConversationRows ? (
                    <div className="flex min-h-[250px] flex-col items-center justify-center gap-3 text-center">
                      <p className="text-sm font-semibold text-destructive">Failed to load project conversation.</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full border-border bg-card text-foreground"
                        onClick={() => messages.refresh().catch(() => null)}
                      >
                        Retry Loading
                      </Button>
                    </div>
                  ) : conversationRows.length > 0 ? (
                    conversationRows.map((message) => {
                      const isPm = String(message.senderRole || "").toUpperCase() === "PROJECT_MANAGER";
                      const createdAtStr = message.createdAt
                        ? new Date(message.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "";

                      const raw = String(message.content || "");
                      const scopeMatch = raw.match(/^\[SCOPE:(\w+)\]/i);
                      const scope = scopeMatch ? scopeMatch[1].toUpperCase() : null;
                      const scopeBadgeLabel =
                        scope === "CLIENT"
                          ? "Client Only"
                          : scope === "FREELANCER"
                          ? "Freelancer Only"
                          : scope === "BOTH"
                          ? "Everyone"
                          : null;

                      return (
                        <div
                          key={message.id}
                          className={cn("flex flex-col", isPm ? "items-end" : "items-start")}
                        >
                          <p className={cn("mb-1 px-1 text-[11px] font-bold tracking-wide uppercase flex items-center gap-1.5 flex-wrap", isPm ? "text-primary justify-end" : "text-muted-foreground")}>
                            <span>{message.senderLabel || (isPm ? "Project Manager" : "Participant")}</span>
                            {createdAtStr ? <span>• {createdAtStr}</span> : null}
                            {isPm && scopeBadgeLabel ? (
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[9px] font-extrabold border",
                                scope === "CLIENT"
                                  ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                  : scope === "FREELANCER"
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                  : "bg-primary/10 text-primary border-primary/20"
                              )}>
                                {scopeBadgeLabel}
                              </span>
                            ) : null}
                          </p>
                          <div
                            className={cn(
                              "max-w-[88%] sm:max-w-[80%] rounded-[20px] p-3.5 text-sm font-medium shadow-xs transition-all",
                              isPm
                                ? "rounded-tr-none bg-primary text-primary-foreground"
                                : "rounded-tl-none border border-border bg-card text-foreground"
                            )}
                          >
                            {(() => {
                              const text = raw.replace(/^\[SCOPE:\w+\]\s*/i, "").replace(/^\[System\]/i, "[Project Manager]").trim();
                              const isMeeting = /meeting/i.test(text) && (text.includes("scheduled") || text.includes("Invitation") || text.includes("Join") || text.includes("Project Sync"));

                              if (isMeeting) {
                                const titleMatch = text.match(/"([^"]+)"/);
                                const title = titleMatch ? titleMatch[1] : "Project Sync";
                                const linkMatch = text.match(/https?:\/\/[^\s]+/);
                                const link = linkMatch ? linkMatch[0].replace(/[.,;)]+$/, "") : "https://meet.google.com/new";
                                const timeMatch = text.match(/scheduled for ([^\n.]+)/i);
                                let timeStr = timeMatch ? timeMatch[1].replace(/\.?\s*Join Meeting.*$/i, "").trim() : "";

                                if (!timeStr) {
                                  const fallbackTime = text.match(/\b\d{1,2}\/\d{1,2}\/\d{4}[^.]*/);
                                  if (fallbackTime) {
                                    timeStr = fallbackTime[0].trim();
                                  }
                                }

                                return (
                                  <div className="space-y-2.5 min-w-[220px] sm:min-w-[260px] p-0.5">
                                    <div className="flex items-center gap-2.5 border-b border-current/20 pb-2">
                                      <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                        <CalendarIcon className="h-4.5 w-4.5" />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-[10px] font-bold uppercase tracking-wider opacity-85">Meeting Scheduled</p>
                                        <p className="text-xs font-bold truncate">{title}</p>
                                      </div>
                                    </div>
                                    {timeStr && (
                                      <p className="text-xs font-semibold opacity-95">
                                        📅 {timeStr}
                                      </p>
                                    )}
                                    <div className="pt-1">
                                      <a
                                        href={link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-1.5 h-8.5 px-4 rounded-full bg-white text-primary text-xs font-bold shadow-xs hover:bg-white/90 transition-colors"
                                      >
                                        <span>Join Meeting</span>
                                        <ExternalLink className="h-3.5 w-3.5" />
                                      </a>
                                    </div>
                                  </div>
                                );
                              }

                              return text;
                            })()}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex h-full min-h-[250px] flex-col items-center justify-center p-6 text-center text-muted-foreground">
                      <MessageCircle className="size-8 opacity-40 mb-2" />
                      <p className="text-sm font-semibold text-foreground">No messages yet</p>
                      <p className="text-xs mt-1">Start the conversation with client and freelancer.</p>
                    </div>
                  )}
                  <div ref={listEndRef} />
                </div>

                {/* Chat Composer Footer */}
                <div className="relative border-t border-border bg-card p-4 sm:p-5 shrink-0">
                  {/* Slash Command Autocomplete Popover */}
                  {showSlashMenu && (
                    <div className="absolute bottom-full mb-3 left-4 z-50 w-76 rounded-2xl border border-border bg-card/95 p-2 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-150">
                      <div className="px-3 py-2 border-b border-border/50 mb-1 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Slash className="size-3.5 text-primary" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Target Recipient Commands
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1 p-0.5">
                        <button
                          type="button"
                          onClick={() => selectSlashCommand("CLIENT")}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition-all cursor-pointer group border",
                            messageScope === "CLIENT"
                              ? "bg-primary/10 text-primary border-primary/20"
                              : "hover:bg-muted text-foreground border-transparent"
                          )}
                        >
                          <div className="flex size-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                            <User className="size-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-sm leading-tight text-foreground group-hover:text-primary">/client</p>
                              <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">Client</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                              Send only to <span className="font-semibold text-foreground">{selectedProject?.clientName || "Client"}</span>
                            </p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => selectSlashCommand("FREELANCER")}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition-all cursor-pointer group border",
                            messageScope === "FREELANCER"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : "hover:bg-muted text-foreground border-transparent"
                          )}
                        >
                          <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
                            <Briefcase className="size-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-sm leading-tight text-foreground group-hover:text-emerald-600">/freelancer</p>
                              <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Freelancer</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                              Send only to <span className="font-semibold text-foreground">{selectedProject?.freelancerName || "Freelancer"}</span>
                            </p>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendMessage();
                    }}
                    className="relative flex items-center gap-2"
                  >
                    {messageScope !== "BOTH" && (
                      <span
                        className={cn(
                          "absolute left-3.5 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold shadow-2xs border animate-in fade-in zoom-in-95 duration-150 shrink-0 max-w-[70%] sm:max-w-none truncate",
                          messageScope === "CLIENT"
                            ? "bg-primary text-primary-foreground border-primary/30"
                            : "bg-emerald-600 text-white border-emerald-500/30"
                        )}
                      >
                        {messageScope === "CLIENT" ? (
                          <User className="size-3.5 shrink-0" />
                        ) : (
                          <Briefcase className="size-3.5 shrink-0" />
                        )}
                        <span className="truncate">
                          {messageScope === "CLIENT"
                            ? `To: Client (${selectedProject?.clientName || "Client"})`
                            : `To: Freelancer (${selectedProject?.freelancerName || "Freelancer"})`}
                        </span>
                        <button
                          type="button"
                          onClick={() => setMessageScope("BOTH")}
                          className="ml-0.5 hover:opacity-75 cursor-pointer font-extrabold shrink-0"
                          title="Reset to Everyone"
                        >
                          ✕
                        </button>
                      </span>
                    )}

                    <Input
                      value={composer}
                      onChange={handleComposerChange}
                      placeholder={
                        messageScope !== "BOTH"
                          ? ""
                          : "Message everyone (Client & Freelancer). Type / to target..."
                      }
                      disabled={sending}
                      className={cn(
                        "h-12 w-full rounded-full border border-border bg-background px-5 pr-14 text-sm font-medium text-foreground placeholder:text-muted-foreground shadow-xs focus-visible:ring-1 focus-visible:ring-primary transition-all",
                        messageScope === "CLIENT" && "pl-48 sm:pl-56",
                        messageScope === "FREELANCER" && "pl-52 sm:pl-64"
                      )}
                    />
                    <button
                      type="submit"
                      disabled={sending || !composer.trim()}
                      className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 disabled:opacity-40 transition-all cursor-pointer"
                    >
                      {sending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}
                    </button>
                  </form>
                </div>
              </>
            )}
          </main>
        </div>
    </PmShell>
  );
};

export default MessagesPage;
