import { useEffect, useMemo, useState } from "react";
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

  const dashboard = useAsyncResource(() => pmApi.getDashboard(authFetch), [authFetch]);
  const messages = useAsyncResource(
    () => (selectedProjectId ? pmApi.getProjectMessages(authFetch, selectedProjectId) : Promise.resolve({ messages: [] })),
    [authFetch, selectedProjectId]
  );

  const projects = useMemo(() => dashboard.data?.projects || [], [dashboard.data?.projects]);

  useEffect(() => {
    const projectIdFromQuery = searchParams.get("projectId");
    if (!projectIdFromQuery) return;
    setSelectedProjectId(projectIdFromQuery);
  }, [searchParams]);

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
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Projects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {dashboard.loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading chats...
              </div>
            ) : projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No assigned projects.</p>
            ) : (
              projects.map((project) => (
                <button
                  type="button"
                  key={project.id}
                  className={`w-full rounded-lg border p-3 text-left text-sm ${
                    selectedProjectId === project.id
                      ? "border-primary bg-primary/5"
                      : "border-border/60 bg-muted/20"
                  }`}
                  onClick={() => setSelectedProjectId(project.id)}
                >
                  <p className="line-clamp-1 font-medium">{project.projectName}</p>
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Conversation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!selectedProjectId ? (
              <div className="rounded border border-dashed p-8 text-center text-sm text-muted-foreground">
                Select a project chat to continue.
              </div>
            ) : (
              <>
                <div className="max-h-[480px] space-y-2 overflow-y-auto rounded border border-border/70 p-3">
                  {(messages.data?.messages || []).map((message) => (
                    <div key={message.id} className="rounded bg-muted/30 p-2">
                      <p className="text-xs font-medium">{message.senderLabel}</p>
                      <p className="text-sm">{message.content}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {message.createdAt ? new Date(message.createdAt).toLocaleString() : ""}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Write as Project Manager"
                    value={composer}
                    onChange={(event) => setComposer(event.target.value)}
                  />
                  <Button onClick={sendMessage} disabled={sending || !composer.trim()}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </PmShell>
  );
};

export default MessagesPage;
