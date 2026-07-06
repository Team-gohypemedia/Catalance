import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/shared/context/AuthContext";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import Github from "lucide-react/dist/esm/icons/github";
import Code2 from "lucide-react/dist/esm/icons/code-2";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Check from "lucide-react/dist/esm/icons/check";
import Plus from "lucide-react/dist/esm/icons/plus";
import Link2 from "lucide-react/dist/esm/icons/link-2";
import Unlink from "lucide-react/dist/esm/icons/unlink";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";

// ─────────────────────────────────────────────────────────────────────────────
// GitHubConnectCard
// Sidebar card for connecting GitHub, creating/linking repos, and opening IDE
// ─────────────────────────────────────────────────────────────────────────────
const GitHubConnectCard = ({
  project,
  panelClassName,
  eyebrowClassName,
  onOpenIDE,
  onRepoLinked,
}) => {
  const { authFetch } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // GitHub connection state
  const [githubStatus, setGithubStatus] = useState(null); // { connected, login, avatarUrl }
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Repo state
  const [repoUrl, setRepoUrl] = useState(project?.externalLink || "");
  const [repoInfo, setRepoInfo] = useState(null); // { fullName, repoName, isPrivate, ... }

  // UI state
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCreatingRepo, setIsCreatingRepo] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkInput, setLinkInput] = useState(project?.externalLink || "");
  const [isJustCreated, setIsJustCreated] = useState(false);


  // ── Fetch GitHub status on mount ─────────────────────────────────────────
  const fetchStatus = useCallback(async () => {
    try {
      const res = await authFetch("/github/status");
      if (res.ok) {
        const data = await res.json();
        setGithubStatus(data);
      }
    } catch (err) {
      console.error("[GitHubCard] status fetch error:", err);
    } finally {
      setIsLoadingStatus(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // ── Detect OAuth callback success/failure in URL ─────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const githubParam = params.get("github");

    if (githubParam === "connected") {
      toast.success("GitHub connected successfully! 🎉");
      fetchStatus();
      // Clean up the URL param
      params.delete("github");
      navigate({ search: params.toString() }, { replace: true });
    } else if (githubParam === "denied") {
      toast.error("GitHub authorization was denied.");
      params.delete("github");
      navigate({ search: params.toString() }, { replace: true });
    } else if (githubParam === "error") {
      const reason = params.get("reason");
      toast.error(`GitHub connection failed: ${reason || "Unknown error"}`);
      params.delete("github");
      params.delete("reason");
      navigate({ search: params.toString() }, { replace: true });
    }
  }, [location.search, fetchStatus, navigate]);

  // ── Fetch repo info when project has externalLink ────────────────────────
  useEffect(() => {
    if (!project?.id || !githubStatus?.connected) return;

    const fetchRepoInfo = async () => {
      try {
        const res = await authFetch(`/github/repo/${project.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.repoUrl) setRepoUrl(data.repoUrl);
          if (data.repoInfo) setRepoInfo(data.repoInfo);
        }
      } catch (err) {
        console.error("[GitHubCard] repo fetch error:", err);
      }
    };

    fetchRepoInfo();
  }, [project?.id, githubStatus?.connected, authFetch]);

  // ── Connect GitHub (initiates OAuth) ────────────────────────────────────
  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const res = await authFetch(`/github/oauth/url?projectId=${project?.id || ""}`);
      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || "Failed to get OAuth URL");
      }

      // Redirect to GitHub OAuth
      window.location.href = data.url;
    } catch (err) {
      console.error("[GitHubCard] connect error:", err);
      toast.error(err.message || "Failed to start GitHub connection");
      setIsConnecting(false);
    }
  };

  // ── Create GitHub repo for this project ─────────────────────────────────
  const handleCreateRepo = async () => {
    if (!project?.id) return;
    setIsCreatingRepo(true);

    try {
      const res = await authFetch("/github/repo/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create repository");
      }

      setRepoUrl(data.repoUrl);
      setRepoInfo({ fullName: data.fullName, repoName: data.repoName });
      setIsJustCreated(true);
      onRepoLinked?.(data.repoUrl);
      toast.success(`Repo "${data.repoName}" created on GitHub! 🎉`);
    } catch (err) {
      console.error("[GitHubCard] createRepo error:", err);
      toast.error(err.message || "Failed to create repository");
    } finally {
      setIsCreatingRepo(false);

    }
  };

  // ── Save manually entered repo link ─────────────────────────────────────
  const handleSaveLink = async () => {
    const url = linkInput.trim();
    if (!url || !url.includes("github.com")) {
      toast.error("Please enter a valid GitHub repository URL");
      return;
    }

    try {
      // Save via project update (re-use existing handleProjectLinkUpdate pattern)
      const res = await authFetch(`/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ externalLink: url }),
      });

      if (!res.ok) throw new Error("Failed to save link");

      setRepoUrl(url);
      onRepoLinked?.(url);
      setShowLinkInput(false);
      toast.success("Repository linked successfully!");

      // Extract fullName from URL for display
      const match = url.match(/github\.com\/([^/]+\/[^/?#]+)/);
      if (match) {
        setRepoInfo({ fullName: match[1], repoName: match[1].split("/")[1] });
      }
    } catch (err) {
      toast.error("Failed to save repository link");
    }
  };

  // ── Disconnect GitHub ────────────────────────────────────────────────────
  const handleDisconnect = async () => {
    if (!confirm("Disconnect your GitHub account from Catalance?")) return;
    setIsDisconnecting(true);

    try {
      const res = await authFetch("/github/disconnect", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to disconnect");

      setGithubStatus({ connected: false });
      setRepoUrl("");
      setRepoInfo(null);
      toast.success("GitHub disconnected.");
    } catch (err) {
      toast.error("Failed to disconnect GitHub");
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Extract fullName from repo URL for StackBlitz
  const repoFullName = (() => {
    if (repoInfo?.fullName) return repoInfo.fullName;
    if (repoUrl?.includes("github.com")) {
      const m = repoUrl.match(/github\.com\/([^/]+\/[^/?#]+)/);
      return m?.[1] || null;
    }
    return null;
  })();

  const canOpenIDE = githubStatus?.connected && repoFullName;

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (isLoadingStatus) {
    return (
      <Card className={cn(panelClassName, "overflow-hidden")}>
        <CardHeader className="border-b border-border dark:border-white/[0.06] px-4 pb-3 pt-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-pulse rounded bg-muted" />
            <div className="h-3 w-28 animate-pulse rounded bg-muted" />
          </div>
        </CardHeader>
        <CardContent className="px-4 py-3">
          <div className="h-8 w-full animate-pulse rounded-lg bg-muted" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(panelClassName, "overflow-hidden")}>
      <CardHeader className="space-y-1.5 border-b border-border dark:border-white/[0.06] px-4 pb-3 pt-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Github className="h-3.5 w-3.5 text-foreground dark:text-white" />
            <CardTitle className={cn(eyebrowClassName, "flex items-center gap-1.5")}>
              GitHub Workspace
            </CardTitle>
          </div>

          {githubStatus?.connected && (
            <Badge className="border-emerald-200 dark:border-emerald-500/20 bg-emerald-100/50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium px-2 py-0.5">
              <Check className="mr-1 h-2.5 w-2.5" />
              Connected
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          {githubStatus?.connected
            ? "Open your project in VS Code online"
            : "Connect GitHub to work in VS Code online"}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-4 py-3 space-y-3">
        {/* ── NOT Connected State ── */}
        {!githubStatus?.connected && (
          <div className="space-y-2.5">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Connect your GitHub account to create a project repository and open it directly in a VS Code online IDE — without leaving Catalance.
            </p>
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full gap-2 text-sm h-9"
              size="sm"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Connecting…
                </>
              ) : (
                <>
                  <Github className="h-3.5 w-3.5" />
                  Connect GitHub Account
                </>
              )}
            </Button>
          </div>
        )}

        {/* ── Connected, No Repo Yet ── */}
        {githubStatus?.connected && !repoUrl && (
          <div className="space-y-3">
            {/* User info */}
            <div className="flex items-center gap-2 rounded-xl border border-border dark:border-white/[0.06] bg-muted/30 dark:bg-white/[0.03] px-3 py-2">
              <Avatar className="h-6 w-6">
                <AvatarImage
                  src={githubStatus.avatarUrl}
                  alt={githubStatus.login}
                />
                <AvatarFallback className="text-[10px]">
                  {githubStatus.login?.[0]?.toUpperCase() || "G"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium text-foreground dark:text-white">
                @{githubStatus.login}
              </span>
            </div>

            {/* Create repo button */}
            <Button
              onClick={handleCreateRepo}
              disabled={isCreatingRepo}
              className="w-full gap-2 text-sm h-9"
              size="sm"
            >
              {isCreatingRepo ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Creating Repo…
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Create Repo for This Project
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border dark:bg-white/[0.06]" />
              <span className="text-[10px] text-muted-foreground">or link existing</span>
              <div className="h-px flex-1 bg-border dark:bg-white/[0.06]" />
            </div>

            {/* Link existing repo */}
            {!showLinkInput ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 h-9 border-border dark:border-white/[0.08] text-sm"
                onClick={() => setShowLinkInput(true)}
              >
                <Link2 className="h-3.5 w-3.5" />
                Link Existing GitHub Repo
              </Button>
            ) : (
              <div className="space-y-2">
                <Input
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  placeholder="https://github.com/user/repo"
                  className="h-8 text-xs border-border dark:border-white/[0.08]"
                  onKeyDown={(e) => e.key === "Enter" && handleSaveLink()}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 h-7 text-xs" onClick={handleSaveLink}>
                    Save Link
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setShowLinkInput(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Connected + Repo Linked ── */}
        {githubStatus?.connected && repoUrl && (
          <div className="space-y-3">
            {/* User + repo info */}
            <div className="rounded-xl border border-border dark:border-white/[0.06] bg-muted/30 dark:bg-white/[0.03] p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={githubStatus.avatarUrl} alt={githubStatus.login} />
                  <AvatarFallback className="text-[9px]">
                    {githubStatus.login?.[0]?.toUpperCase() || "G"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[11px] text-muted-foreground">@{githubStatus.login}</span>
              </div>

              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <Github className="h-3 w-3 shrink-0" />
                <span className="truncate">{repoFullName || repoUrl}</span>
                <ExternalLink className="h-2.5 w-2.5 shrink-0" />
              </a>
            </div>

            {/* Open IDE button — primary CTA */}
            <Button
              onClick={() => onOpenIDE?.({ repoUrl, repoFullName, isNewRepo: isJustCreated })}

              className="w-full gap-2 h-10 text-sm font-medium relative overflow-hidden"
              size="sm"
              disabled={!canOpenIDE}
            >
              <span className="relative flex items-center gap-2">
                <Code2 className="h-4 w-4" />
                Open in VS Code IDE
                <Sparkles className="h-3.5 w-3.5 opacity-70" />
              </span>
            </Button>
          </div>
        )}

        {/* Disconnect link */}
        {githubStatus?.connected && (
          <button
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            className="flex w-full items-center justify-center gap-1 text-[10px] text-muted-foreground hover:text-destructive transition-colors pt-1"
          >
            {isDisconnecting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Unlink className="h-3 w-3" />
            )}
            {isDisconnecting ? "Disconnecting…" : "Disconnect GitHub"}
          </button>
        )}
      </CardContent>
    </Card>
  );
};

export default GitHubConnectCard;
