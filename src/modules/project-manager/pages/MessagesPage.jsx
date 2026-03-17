import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import Send from "lucide-react/dist/esm/icons/send";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import { useAuth } from "@/shared/context/AuthContext";
import { useNotifications } from "@/shared/context/NotificationContext";
import { PmShell } from "@/modules/project-manager/components/PmShell";
import { useAsyncResource } from "@/modules/project-manager/hooks/use-async-resource";
import { pmApi } from "@/modules/project-manager/services/pm-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const POLL_INTERVAL_MS = 3000;

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

const MessagesPage = () => {
  const { authFetch } = useAuth();
  const { notifications, markChatAsRead } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [composer, setComposer] = useState("");
  const [sending, setSending] = useState(false);
  const listEndRef = useRef(null);

  const dashboard = useAsyncResource(() => pmApi.getDashboard(authFetch), [authFetch]);
  const projects = useMemo(() => dashboard.data?.projects || [], [dashboard.data?.projects]);
  const selectedProjectExists = useMemo(
    () => projects.some((project) => project.id === selectedProjectId),
    [projects, selectedProjectId]
  );
  const messages = useAsyncResource(
    () => {
      if (!selectedProjectId) {
        return Promise.resolve({ messages: [] });
      }

      if (!dashboard.loading && projects.length > 0 && !selectedProjectExists) {
        return Promise.resolve({ messages: [] });
      }

      return pmApi.getProjectMessages(authFetch, selectedProjectId);
    },
    [authFetch, dashboard.loading, projects.length, selectedProjectExists, selectedProjectId]
  );

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );
  const conversationRows = useMemo(
    () => (Array.isArray(messages.data?.messages) ? messages.data.messages : []),
    [messages.data?.messages]
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
      setSelectedProjectId(projectId);
      syncProjectQuery(projectId);
    },
    [syncProjectQuery]
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

  const refreshChatState = useCallback(async () => {
    if (!selectedProjectId || !selectedProjectExists) {
      await dashboard.refresh();
      return;
    }

    await Promise.all([dashboard.refresh(), messages.refresh()]);
  }, [
    dashboard.refresh,
    messages.refresh,
    selectedProjectExists,
    selectedProjectId,
  ]);

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
      refreshChatState().catch(() => null);
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
      refreshChatState().catch(() => null);
    } else {
      dashboard.refresh().catch(() => null);
    }

    markChatAsRead().catch(() => null);
  }, [
    dashboard.refresh,
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
  }, [dashboard.refresh, messages.error, selectedProjectId, syncProjectQuery]);

  const sendMessage = async () => {
    if (!selectedProjectId || !composer.trim()) return;
    setSending(true);
    try {
      await pmApi.sendProjectMessage(authFetch, selectedProjectId, composer.trim());
      setComposer("");
      await refreshChatState();
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
      <div className="grid min-w-0 gap-4 xl:h-[calc(100dvh-14.5rem)] xl:grid-cols-[300px_minmax(0,1fr)] 2xl:grid-cols-[340px_minmax(0,1fr)]">
        <Card className="flex min-h-[280px] min-w-0 flex-col overflow-hidden rounded-3xl border-slate-200 bg-white shadow-sm xl:h-full xl:min-h-0">
          <CardHeader className="border-b border-slate-100 pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base font-black text-slate-900">
                Projects ({projects.length})
              </CardTitle>
              {dashboard.loading && hasProjectRows ? (
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Syncing
                </div>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3 sm:p-4">
            {isDashboardInitialLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading chats...
              </div>
            ) : dashboard.error && !hasProjectRows ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Failed to load assigned project chats.
              </div>
            ) : projects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-muted-foreground">
                No assigned projects.
              </div>
            ) : (
              projects.map((project) => (
                <button
                  type="button"
                  key={project.id}
                  className={`w-full rounded-xl border p-3 text-left text-sm transition-colors ${
                    selectedProjectId === project.id
                      ? "border-blue-200 bg-blue-50/70"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                  onClick={() => selectProject(project.id)}
                >
                  <p className="line-clamp-1 font-semibold text-slate-900">{project.projectName}</p>
                  <p className="text-xs text-muted-foreground">{project.clientName}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <Badge variant="secondary">{project.totalMessages} msgs</Badge>
                    {project.unreadMessages > 0 ? (
                      <Badge variant="destructive">{project.unreadMessages} unread</Badge>
                    ) : null}
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="flex min-h-[420px] min-w-0 flex-col overflow-hidden rounded-3xl border-slate-200 bg-white shadow-sm xl:h-full xl:min-h-0">
          <CardHeader className="border-b border-slate-100 pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-base font-black text-slate-900">Conversation</CardTitle>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {messages.loading && selectedProjectId && (hasConversationRows || messages.data) ? (
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Syncing
                  </div>
                ) : null}
                {selectedProject ? (
                  <Badge className="bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-600">
                    {selectedProject.projectName}
                  </Badge>
                ) : null}
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
            {!selectedProjectId ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-muted-foreground">
                Select a project chat to continue.
              </div>
            ) : (
              <>
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50/40">
                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
                  {isMessagesInitialLoading ? (
                    <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading conversation...
                    </div>
                  ) : messages.error && !hasConversationRows ? (
                    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-center text-sm text-red-600">
                      <p>Conversation load failed. Please retry.</p>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-slate-200 bg-white text-slate-700"
                        onClick={() => messages.refresh().catch(() => null)}
                      >
                        Retry
                      </Button>
                    </div>
                  ) : conversationRows.length > 0 ? (
                    conversationRows.map((message) => {
                      const isPm = String(message.senderRole || "").toUpperCase() === "PROJECT_MANAGER";
                      return (
                        <div
                          key={message.id}
                          className={`flex flex-col ${isPm ? "items-end" : "items-start"}`}
                        >
                          <p className="mb-1 text-[11px] font-semibold text-slate-500">
                            {message.senderLabel}
                          </p>
                          <div
                            className={`max-w-[92%] break-words rounded-2xl px-3 py-2 text-sm sm:max-w-[85%] xl:max-w-[80%] ${
                              isPm
                                ? "rounded-tr-none bg-blue-600 text-white"
                                : "rounded-tl-none border border-slate-200 bg-white text-slate-900"
                            }`}
                          >
                            {message.content}
                          </div>
                          <p className="mt-1 text-[10px] text-slate-400">
                            {message.createdAt ? new Date(message.createdAt).toLocaleString() : ""}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-muted-foreground">
                      No messages yet for this project.
                    </div>
                  )}
                  <div ref={listEndRef} />
                  </div>
                </div>
                <form
                  className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end"
                  onSubmit={(event) => {
                    event.preventDefault();
                    sendMessage();
                  }}
                >
                  <Textarea
                    placeholder="Write as Project Manager"
                    value={composer}
                    onChange={(event) => setComposer(event.target.value)}
                    className="min-h-[72px] resize-none border-slate-200 bg-white sm:min-h-[80px]"
                  />
                  <Button
                    type="submit"
                    className="h-11 w-full shrink-0 rounded-xl bg-blue-600 p-0 hover:bg-blue-700 sm:h-10 sm:w-10"
                    disabled={sending || !composer.trim()}
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </PmShell>
  );
};

export default MessagesPage;
