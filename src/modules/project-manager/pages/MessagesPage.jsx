import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import Send from "lucide-react/dist/esm/icons/send";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import { useAuth } from "@/shared/context/AuthContext";
import { PmShell } from "@/modules/project-manager/components/PmShell";
import { useAsyncResource } from "@/modules/project-manager/hooks/use-async-resource";
import { pmApi } from "@/modules/project-manager/services/pm-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const MessagesPage = () => {
  const { authFetch } = useAuth();
  const [searchParams] = useSearchParams();
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [composer, setComposer] = useState("");
  const [sending, setSending] = useState(false);
  const listEndRef = useRef(null);

  const dashboard = useAsyncResource(() => pmApi.getDashboard(authFetch), [authFetch]);
  const messages = useAsyncResource(
    () => (selectedProjectId ? pmApi.getProjectMessages(authFetch, selectedProjectId) : Promise.resolve({ messages: [] })),
    [authFetch, selectedProjectId]
  );

  const projects = useMemo(() => dashboard.data?.projects || [], [dashboard.data?.projects]);
  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );
  const conversationRows = useMemo(
    () => (Array.isArray(messages.data?.messages) ? messages.data.messages : []),
    [messages.data?.messages]
  );

  useEffect(() => {
    const projectIdFromQuery = searchParams.get("projectId");
    if (!projectIdFromQuery) return;
    setSelectedProjectId(projectIdFromQuery);
  }, [searchParams]);

  useEffect(() => {
    if (!projects.length) return;
    const isValidSelection = projects.some((project) => project.id === selectedProjectId);
    if (!isValidSelection) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conversationRows.length, selectedProjectId]);

  const sendMessage = async () => {
    if (!selectedProjectId || !composer.trim()) return;
    setSending(true);
    try {
      await pmApi.sendProjectMessage(authFetch, selectedProjectId, composer.trim());
      setComposer("");
      await messages.refresh();
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
      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <Card className="flex max-h-[calc(100vh-230px)] min-h-[420px] flex-col overflow-hidden rounded-3xl border-slate-200 bg-white shadow-sm lg:min-h-[560px]">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="text-base font-black text-slate-900">
              Projects ({projects.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-2 overflow-y-auto p-4">
            {dashboard.loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading chats...
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
                  onClick={() => setSelectedProjectId(project.id)}
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

        <Card className="flex max-h-[calc(100vh-230px)] min-h-[420px] flex-col overflow-hidden rounded-3xl border-slate-200 bg-white shadow-sm lg:min-h-[560px]">
          <CardHeader className="border-b border-slate-100 pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base font-black text-slate-900">Conversation</CardTitle>
              {selectedProject ? (
                <Badge className="bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-600">
                  {selectedProject.projectName}
                </Badge>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col p-4">
            {!selectedProjectId ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-muted-foreground">
                Select a project chat to continue.
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/40 p-3">
                  {messages.loading ? (
                    <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading conversation...
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
                            className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
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
                <form
                  className="mt-3 flex items-end gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    sendMessage();
                  }}
                >
                  <Textarea
                    placeholder="Write as Project Manager"
                    value={composer}
                    onChange={(event) => setComposer(event.target.value)}
                    className="min-h-[80px] resize-none border-slate-200 bg-white"
                  />
                  <Button
                    type="submit"
                    className="h-10 w-10 shrink-0 rounded-xl bg-blue-600 p-0 hover:bg-blue-700"
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
