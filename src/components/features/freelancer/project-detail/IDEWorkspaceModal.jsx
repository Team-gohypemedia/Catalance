import React, { useEffect, useRef, useState, useCallback } from "react";
import sdk from "@stackblitz/sdk";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/shared/context/AuthContext";
import { toast } from "sonner";
import X from "lucide-react/dist/esm/icons/x";
import Send from "lucide-react/dist/esm/icons/send";
import Bot from "lucide-react/dist/esm/icons/bot";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Code2 from "lucide-react/dist/esm/icons/code-2";
import GitBranch from "lucide-react/dist/esm/icons/git-branch";
import RotateCcw from "lucide-react/dist/esm/icons/rotate-ccw";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import BrainCircuit from "lucide-react/dist/esm/icons/brain-circuit";
import Zap from "lucide-react/dist/esm/icons/zap";
import Play from "lucide-react/dist/esm/icons/play";
import FileCode from "lucide-react/dist/esm/icons/file-code";
import GitCommit from "lucide-react/dist/esm/icons/git-commit";
import { cn } from "@/shared/lib/utils";



const renderMarkdown = (text, onApplyFile, applyingStates = {}) => {
  if (!text) return null;
  const lines = text.split("\n");
  let insideCode = false;
  let codeLines = [];
  const elements = [];
  let key = 0;
  let currentWriteFilePath = null;

  const flushCode = () => {
    const codeContent = codeLines.join("\n");
    const filePath = currentWriteFilePath;

    if (filePath && onApplyFile) {
      const isApplying = applyingStates[filePath];
      elements.push(
        <div key={`write-file-${key++}`} className="my-2.5 rounded-lg border border-primary/20 bg-[#0d1117]/80 overflow-hidden text-left">
          <div className="flex items-center justify-between gap-2 border-b border-primary/15 bg-primary/5 px-2.5 py-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <FileCode className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-[10px] font-semibold text-white/90 truncate" title={filePath}>
                {filePath}
              </span>
            </div>
            <button
              disabled={isApplying}
              onClick={() => onApplyFile(filePath, codeContent)}
              className="h-5 px-2 text-[9px] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded flex items-center gap-1 disabled:opacity-50 transition-all shrink-0"
            >
              {isApplying ? (
                <>
                  <Loader2 className="h-2 w-2 animate-spin" />
                  Writing…
                </>
              ) : (
                <>
                  <Play className="h-2 w-2" />
                  Write File
                </>
              )}
            </button>
          </div>
          <pre className="overflow-x-auto p-2 text-[10px] leading-relaxed text-emerald-300 bg-black/40 max-h-[160px] overflow-y-auto font-mono">
            <code>{codeContent}</code>
          </pre>
        </div>
      );
    } else {
      elements.push(
        <pre
          key={`code-${key++}`}
          className="my-2 overflow-x-auto rounded-lg border border-white/[0.08] bg-black/40 p-2.5 text-[11px] leading-relaxed text-emerald-300 font-mono text-left"
        >
          <code>{codeContent}</code>
        </pre>
      );
    }

    codeLines = [];
    insideCode = false;
    currentWriteFilePath = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect [WRITE_FILE:path]
    if (line.trim().startsWith("[WRITE_FILE:") && line.trim().endsWith("]")) {
      const match = line.trim().match(/^\[WRITE_FILE:(.+)\]$/);
      if (match) {
        currentWriteFilePath = match[1];
        // If next line starts code block, skip it
        if (lines[i + 1]?.startsWith("```")) {
          insideCode = true;
          i++; // skip the ``` line
        }
        continue;
      }
    }

    if (line.startsWith("```")) {
      if (insideCode) {
        flushCode();
      } else {
        insideCode = true;
      }
      continue;
    }

    if (insideCode) {
      codeLines.push(line);
      continue;
    }

    // H1/H2
    if (line.startsWith("## ")) {
      elements.push(
        <p key={key++} className="mt-3 mb-1 text-[11px] font-bold uppercase tracking-wider text-primary/80 text-left">
          {line.slice(3)}
        </p>
      );
      continue;
    }
    if (line.startsWith("# ")) {
      elements.push(
        <p key={key++} className="mt-2 mb-1 text-[12px] font-bold text-white text-left">
          {line.slice(2)}
        </p>
      );
      continue;
    }

    // Horizontal rule
    if (line.startsWith("---")) {
      elements.push(<hr key={key++} className="my-2 border-white/[0.08]" />);
      continue;
    }

    // Bullet points
    if (line.startsWith("- ") || line.startsWith("• ")) {
      const content = line.slice(2);
      elements.push(
        <div key={key++} className="flex gap-1.5 leading-relaxed text-left">
          <span className="mt-[3px] text-primary shrink-0">•</span>
          <span className="text-xs text-white/75">{formatInline(content)}</span>
        </div>
      );
      continue;
    }

    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.+)/);
      if (match) {
        elements.push(
          <div key={key++} className="flex gap-2 leading-relaxed text-left">
            <span className="shrink-0 text-xs font-bold text-primary">{match[1]}.</span>
            <span className="text-xs text-white/75">{formatInline(match[2])}</span>
          </div>
        );
        continue;
      }
    }

    // Empty line
    if (!line.trim()) {
      elements.push(<div key={key++} className="h-1" />);
      continue;
    }

    // Normal paragraph
    elements.push(
      <p key={key++} className="text-xs leading-relaxed text-white/75 text-left">
        {formatInline(line)}
      </p>
    );
  }

  if (insideCode && codeLines.length) flushCode();

  return elements;
};


// Inline formatting: **bold**, `code`, and emoji pass-through
const formatInline = (text) => {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-black/40 px-1 py-0.5 font-mono text-[10px] text-emerald-300">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
};

// Parse response for [WRITE_FILE:path] blocks
const parseWriteFileBlocks = (text) => {
  if (!text) return [];
  const blocks = [];
  const lines = text.split("\n");
  let insideCode = false;
  let codeLines = [];
  let currentFilePath = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith("[WRITE_FILE:") && line.trim().endsWith("]")) {
      const match = line.trim().match(/^\[WRITE_FILE:(.+)\]$/);
      if (match) {
        currentFilePath = match[1];
        if (lines[i + 1]?.startsWith("```")) {
          insideCode = true;
          i++; // skip code block delimiter
        }
        continue;
      }
    }

    if (line.startsWith("```")) {
      if (insideCode) {
        blocks.push({ filePath: currentFilePath, content: codeLines.join("\n") });
        codeLines = [];
        insideCode = false;
        currentFilePath = null;
      } else {
        insideCode = true;
      }
      continue;
    }

    if (insideCode) {
      codeLines.push(line);
    }
  }

  return blocks;
};

// ─────────────────────────────────────────────────────────────────────────────
// Build the Project Manager kickoff prompt sent to OpenRouter
// ─────────────────────────────────────────────────────────────────────────────

const buildKickoffMessages = (project) => {
  const fields = [
    project?.title && `**Project Title:** ${project.title}`,
    project?.description && `**Description:**\n${project.description}`,
    project?.serviceType && `**Service Type:** ${project.serviceType}`,
    project?.projectOverview && `**Project Overview:** ${project.projectOverview}`,
    project?.primaryObjectives?.length && `**Primary Objectives:**\n${project.primaryObjectives.map((o) => `- ${o}`).join("\n")}`,
    project?.featuresDeliverables?.length && `**Features & Deliverables:**\n${project.featuresDeliverables.map((f) => `- ${f}`).join("\n")}`,
    project?.frontendFramework && `**Frontend Framework:** ${project.frontendFramework}`,
    project?.backendTechnology && `**Backend Technology:** ${project.backendTechnology}`,
    project?.databaseType && `**Database:** ${project.databaseType}`,
    project?.hosting && `**Hosting:** ${project.hosting}`,
    project?.websiteType && `**Website Type:** ${project.websiteType}`,
    project?.appType && `**App Type:** ${project.appType}`,
    project?.appFeatures?.length && `**App Features:** ${project.appFeatures.join(", ")}`,
    project?.timeline && `**Timeline:** ${project.timeline}`,
    project?.budget && `**Budget:** ₹${Number(project.budget).toLocaleString()}`,
    project?.targetAudience && `**Target Audience:** ${project.targetAudience}`,
  ].filter(Boolean).join("\n\n");

  return [
    {
      role: "system",
      content: `You are a Senior Project Manager AI and Technical Architect on the Catalance freelancing platform.

A freelancer has just been assigned a fresh project and opened their VS Code workspace. Your job is to analyze the project brief and produce a DETAILED, ACTIONABLE PROJECT KICKOFF GUIDE that sets them up for success from day one.

Your response MUST be structured with these exact sections:

# 🚀 Project Kickoff Guide

## 📋 Project Summary
(2–3 sentences: what this project is, who it's for, and the core goal)

## 🏗️ Recommended Architecture & Tech Stack
(Specific tech choices — framework, state management, database, hosting, APIs)

## 📁 Project Structure
(Full directory tree with a code block — be specific to this project type)

## 🗺️ Development Roadmap
(4–5 milestones with specific, numbered tasks under each)

## ⚡ Start Right Now — First 3 Tasks
(The exact 3 things the freelancer should do immediately)

## ⚠️ Client Clarifications Needed
(2–3 questions to ask the client before building)

## 💡 Pro Tips for This Project
(2–3 specific tips based on the project type and stack)

---
Be SPECIFIC to this project. Do NOT give generic advice. Every section should reference actual details from the project brief.
Format using markdown with **bold** for emphasis and \`code\` for technical terms.`,
    },
    {
      role: "user",
      content: `Here is the project brief. Please generate my complete kickoff guide:\n\n${fields || "Project details not fully filled in — please analyze based on the title and description and give best-practice recommendations."}`,
    },
  ];
};

// ─────────────────────────────────────────────────────────────────────────────
// IDEWorkspaceModal
// ─────────────────────────────────────────────────────────────────────────────
const IDEWorkspaceModal = ({ isOpen, onClose, repoUrl, repoFullName, project, isNewRepo = false }) => {
  const { authFetch } = useAuth();
  const ideContainerRef = useRef(null);
  const [ideLoaded, setIdeLoaded] = useState(false);
  const [ideError, setIdeError] = useState(null);

  const vmRef = useRef(null);
  const [applyingFiles, setApplyingFiles] = useState({});
  const [historyStack, setHistoryStack] = useState([]);

  // Git Push/Commit states
  const [isPushing, setIsPushing] = useState(false);
  const [commitMessage, setCommitMessage] = useState("");
  const [showPushDialog, setShowPushDialog] = useState(false);

  // AI Chat state
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isGeneratingKickoff, setIsGeneratingKickoff] = useState(false);
  const chatBottomRef = useRef(null);
  const aiInputRef = useRef(null);
  const kickoffFiredRef = useRef(false);

  // ── Reset state when modal opens ─────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setIdeLoaded(false);
      setIdeError(null);
      setAiMessages([]);
      setAiInput("");
      setApplyingFiles({});
      setHistoryStack([]);
      setIsPushing(false);
      setCommitMessage("");
      setShowPushDialog(false);
      kickoffFiredRef.current = false;
    }
  }, [isOpen, repoFullName]);



  // ── Auto-generate Project Manager kickoff ────────────────────────────────
  const triggerPMKickoff = useCallback(async () => {
    if (isGeneratingKickoff) return;
    setIsGeneratingKickoff(true);
    setAiMessages([
      {
        id: "pm-thinking-" + Date.now(),
        role: "pm-thinking",
        content: "🧠 Analyzing your project brief and generating your kickoff guide…",
      },
    ]);

    try {
      const kickoffMessages = buildKickoffMessages(project);
      const res = await authFetch("/github/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: kickoffMessages,
          projectContext: project,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI error");

      setAiMessages([
        {
          id: "kickoff-" + Date.now(),
          role: "assistant",
          isKickoff: true,
          content: data.reply,
        },
      ]);
    } catch (err) {
      console.error("[IDE kickoff]", err);
      setAiMessages([
        {
          id: "kickoff-error-" + Date.now(),
          role: "assistant",
          content:
            "⚠️ I couldn't generate the kickoff guide right now. Ask me anything about your project and I'll help!",
        },
      ]);
    } finally {
      setIsGeneratingKickoff(false);
    }
  }, [project, authFetch, isGeneratingKickoff]);

  useEffect(() => {
    if (!isOpen || kickoffFiredRef.current) return;
    kickoffFiredRef.current = true;

    if (isNewRepo) {
      triggerPMKickoff();
    } else {
      setAiMessages([
        {
          id: "welcome-back",
          role: "assistant",
          content:
            "👋 **Welcome back to your project workspace!**\n\nI'm your AI coding assistant powered by OpenRouter. I have full context of your project.\n\nAsk me anything — debugging, code review, architecture questions, or how to implement a specific feature.",
        },
      ]);
    }
  }, [isOpen, isNewRepo, triggerPMKickoff]);

  // ── Apply changes to a file inside the StackBlitz VM ──────────────────────
  const handleApplyFile = useCallback(async (filePath, content) => {
    if (!vmRef.current) {
      toast.error("IDE is not fully loaded yet");
      return;
    }

    setApplyingFiles((prev) => ({ ...prev, [filePath]: true }));
    try {
      // 1. Capture snapshot of current file content before overwriting
      let previousContent = null;
      try {
        const snapshot = await vmRef.current.getFsSnapshot();
        if (snapshot && snapshot[filePath] !== undefined) {
          previousContent = snapshot[filePath];
        }
      } catch (fsErr) {
        console.warn("[IDE Snapshot before overwrite failed]:", fsErr);
      }

      // 2. Write the changes
      await vmRef.current.applyFsDiff({
        create: {
          [filePath]: content,
        },
        destroy: [], // StackBlitz requires destroy to be an array
      });

      // 3. Push to historyStack
      setHistoryStack((prev) => [
        ...prev,
        {
          timestamp: Date.now(),
          files: {
            [filePath]: previousContent,
          },
          description: `Wrote file: ${filePath}`,
        },
      ]);

      toast.success(`Successfully wrote changes to ${filePath}! 🚀`);
    } catch (err) {
      console.error("[IDE Apply File]", err);
      toast.error(`Failed to write file: ${err.message || "Unknown error"}`);
    } finally {
      setApplyingFiles((prev) => ({ ...prev, [filePath]: false }));
    }
  }, []);

  // ── Revert last code changes from historyStack ───────────────────────────
  const handleRevert = useCallback(async () => {
    if (!vmRef.current) {
      toast.error("IDE is not loaded");
      return;
    }
    if (historyStack.length === 0) {
      toast.error("No code changes to revert");
      return;
    }

    const lastChange = historyStack[historyStack.length - 1];
    const createDiff = {};
    const destroyDiff = [];

    Object.entries(lastChange.files).forEach(([filePath, content]) => {
      if (content === null) {
        // File was newly created, so revert deletes it
        destroyDiff.push(filePath);
      } else {
        // File was modified, overwrite with previous content
        createDiff[filePath] = content;
      }
    });

    try {
      await vmRef.current.applyFsDiff({
        create: createDiff,
        destroy: destroyDiff,
      });

      // Pop from stack
      setHistoryStack((prev) => prev.slice(0, -1));
      toast.success("Successfully reverted last change! 🔄");
    } catch (err) {
      console.error("[IDE Revert failed]:", err);
      toast.error(`Revert failed: ${err.message || "Unknown error"}`);
    }
  }, [historyStack]);

  // ── Push all virtual files to GitHub repository ──────────────────────────
  const handlePushToGitHub = async () => {
    if (!vmRef.current) {
      toast.error("IDE is not fully loaded yet");
      return;
    }

    setIsPushing(true);
    const toastId = toast.loading("Capturing workspace snapshot...");

    try {
      // 1. Get snapshot of current workspace files
      const snapshot = await vmRef.current.getFsSnapshot();
      if (!snapshot || Object.keys(snapshot).length === 0) {
        throw new Error("No files found to push");
      }

      // 2. Push to remote repository via API
      toast.loading("Committing changes and pushing to GitHub...", { id: toastId });
      const res = await authFetch("/github/repo/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project?.id,
          files: snapshot,
          commitMessage: commitMessage.trim() || "Update files via Catalance AI IDE",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "GitHub commit failed");

      toast.success(`Successfully pushed to GitHub branch: ${data.branch}! 🎉`, { id: toastId });
      setShowPushDialog(false);
      setCommitMessage("");
    } catch (err) {
      console.error("[IDE Push]", err);
      toast.error(`Push failed: ${err.message || "Unknown error"}`, { id: toastId });
    } finally {
      setIsPushing(false);
    }
  };




  // ── Embed StackBlitz IDE ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !repoFullName || !ideContainerRef.current) return;

    const container = ideContainerRef.current;
    container.innerHTML = "";

    const embedId = "ide-embed-" + Date.now();
    const embedDiv = document.createElement("div");
    embedDiv.id = embedId;
    embedDiv.style.width = "100%";
    embedDiv.style.height = "100%";
    container.appendChild(embedDiv);

    const embedProject = async () => {
      try {
        const vm = await sdk.embedGithubProject(embedId, repoFullName, {
          height: "100%",
          width: "100%",
          clickToLoad: false,
          openFile: "README.md",
          view: "editor",
          theme: "dark",
          terminalHeight: 30,
          hideNavigation: false,
          forceEmbedLayout: true,
          showSidebar: true,
        });
        vmRef.current = vm;
        setIdeLoaded(true);
      } catch (err) {
        console.error("[IDE] StackBlitz embed error:", err);
        setIdeError(err.message || "Failed to load IDE");
      }
    };

    embedProject();
  }, [isOpen, repoFullName]);

  // ── Scroll to bottom ─────────────────────────────────────────────────────
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages, isGeneratingKickoff]);

  // ── Lock body scroll ─────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // ── Send regular AI message ──────────────────────────────────────────────
  const handleSendAI = useCallback(async () => {
    const content = aiInput.trim();
    if (!content || isAiLoading || isGeneratingKickoff) return;

    const userMsg = { id: Date.now().toString(), role: "user", content };
    setAiMessages((prev) => [...prev, userMsg]);
    setAiInput("");
    setIsAiLoading(true);

    try {
      // ── Retrieve workspace snapshot to inject codebase context ──────────────
      let codebaseSnapshotContext = "";
      if (vmRef.current) {
        try {
          const snapshot = await vmRef.current.getFsSnapshot();
          if (snapshot) {
            const files = Object.entries(snapshot)
              .filter(([path]) => {
                const lower = path.toLowerCase();
                return (
                  !lower.includes("node_modules") &&
                  !lower.includes(".git/") &&
                  !lower.includes("package-lock.json") &&
                  !lower.includes("yarn.lock") &&
                  !lower.includes("pnpm-lock.yaml") &&
                  !lower.endsWith(".png") &&
                  !lower.endsWith(".jpg") &&
                  !lower.endsWith(".jpeg") &&
                  !lower.endsWith(".ico") &&
                  !lower.endsWith(".svg")
                );
              })
              .slice(0, 30); // cap at 30 source files to fit context limit

            if (files.length > 0) {
              codebaseSnapshotContext = "\n\n[Active Workspace Files Context]:\n" + files
                .map(([path, fileContent]) => `File: ${path}\n\`\`\`\n${fileContent}\n\`\`\``)
                .join("\n\n");
            }
          }
        } catch (fsErr) {
          console.warn("[IDE Codebase Snapshot] Failed:", fsErr);
        }
      }

      const historyForApi = aiMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map(({ role, content }) => ({ role, content }));

      // Append codebase snapshot to user query so AI knows file contents
      const userMessageWithContext = content + codebaseSnapshotContext;

      const res = await authFetch("/github/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...historyForApi, { role: "user", content: userMessageWithContext }],
          projectContext: {
            title: project?.title,
            description: project?.description,
            frontendFramework: project?.frontendFramework,
            backendTechnology: project?.backendTechnology,
            databaseType: project?.databaseType,
            serviceType: project?.serviceType,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI assistant error");

      setAiMessages((prev) => [
        ...prev,
        { id: Date.now().toString() + "-ai", role: "assistant", content: data.reply },
      ]);

      // ── Automatically write/apply files to workspace ─────────────────────
      if (vmRef.current) {
        const blocks = parseWriteFileBlocks(data.reply);
        if (blocks.length > 0) {
          const createDiff = {};
          const previousContents = {};

          // Fetch current file system snapshot first
          let snapshot = null;
          try {
            snapshot = await vmRef.current.getFsSnapshot();
          } catch (fsErr) {
            console.warn("[IDE Auto-write snapshot failed]:", fsErr);
          }

          blocks.forEach(({ filePath, content }) => {
            createDiff[filePath] = content;
            previousContents[filePath] = (snapshot && snapshot[filePath] !== undefined) ? snapshot[filePath] : null;
          });

          try {
            await vmRef.current.applyFsDiff({
              create: createDiff,
              destroy: [], // StackBlitz requires destroy array
            });

            // Push to historyStack for rollback support
            setHistoryStack((prev) => [
              ...prev,
              {
                timestamp: Date.now(),
                files: previousContents,
                description: `Auto-wrote: ${blocks.map((b) => b.filePath).join(", ")}`,
              },
            ]);

            toast.success(`Automatically applied changes to ${blocks.length} file(s)! 🚀`);

            // ── Auto-commit & Push to GitHub in Background ────────────────────
            const updatedSnapshot = await vmRef.current.getFsSnapshot();
            const commitMessage = `AI Auto-Implementation: ${blocks.map((b) => b.filePath.split("/").pop()).join(", ")}`;

            authFetch("/github/repo/push", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                projectId: project?.id,
                files: updatedSnapshot,
                commitMessage,
              }),
            })
            .then(async (pushRes) => {
              if (pushRes.ok) {
                console.log("[IDE Auto-commit] Successfully pushed changes to GitHub");
                toast.success("Changes synced to GitHub! 🌐");
              } else {
                const pushErr = await pushRes.json().catch(() => ({}));
                console.error("[IDE Auto-commit failed]:", pushErr);
              }
            })
            .catch((err) => {
              console.error("[IDE Auto-commit error]:", err);
            });
          } catch (writeErr) {
            console.error("[IDE Auto-write error]:", writeErr);
            toast.error(`Auto-write failed: ${writeErr.message || "Unknown error"}`);
          }
        }
      }

    } catch (err) {
      console.error("[IDE AI]", err);
      setAiMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "-err",
          role: "assistant",
          content: `⚠️ Error: ${err.message}`,
        },
      ]);
      toast.error("AI assistant failed");
    } finally {
      setIsAiLoading(false);
      setTimeout(() => aiInputRef.current?.focus(), 100);
    }
  }, [aiInput, aiMessages, authFetch, isAiLoading, isGeneratingKickoff, project]);



  const handleAiKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendAI();
    }
  };

  if (!isOpen) return null;

  const repoDisplayName = repoFullName?.split("/")?.[1] || repoFullName || "Project";
  const repoOwner = repoFullName?.split("/")?.[0] || "";

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-[#0d1117]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-white/[0.08] bg-[#161b22] px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/20">
            <Code2 className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold text-white">Catalance IDE</span>
        </div>

        <div className="h-4 w-px bg-white/10" />

        <div className="flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1">
          <GitBranch className="h-3 w-3 text-white/50" />
          <span className="text-xs text-white/70">
            {repoOwner && <span className="text-white/40">{repoOwner}/</span>}
            <span className="font-medium text-white/80">{repoDisplayName}</span>
          </span>
        </div>

        {isNewRepo && (
          <Badge className="border-emerald-500/20 bg-emerald-500/10 text-[10px] text-emerald-300">
            <Zap className="mr-1 h-2.5 w-2.5" />
            New Project
          </Badge>
        )}

        {project?.title && (
          <Badge
            variant="outline"
            className="hidden border-white/[0.08] bg-white/[0.03] text-[10px] text-white/40 sm:flex"
          >
            {project.title}
          </Badge>
        )}

        <div className="flex-1" />

        {ideLoaded && (
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowPushDialog(true)}
            className="h-7 gap-1.5 px-2.5 text-[11px] font-medium"
          >
            <GitCommit className="h-3.5 w-3.5" />
            Commit to GitHub
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => repoUrl && window.open(repoUrl, "_blank", "noopener,noreferrer")}
          className="h-7 gap-1.5 border border-white/[0.08] bg-white/[0.04] px-2.5 text-[11px] text-white/60 hover:bg-white/[0.08] hover:text-white"
        >
          <ExternalLink className="h-3 w-3" />
          Open on GitHub
        </Button>


        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-7 w-7 p-0 text-white/50 hover:bg-white/[0.08] hover:text-white"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* IDE Panel */}
        <div className="relative flex-1 overflow-hidden">
          {!ideLoaded && !ideError && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0d1117]">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04]">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
              <p className="text-sm text-white/50">Loading VS Code IDE…</p>
              <p className="text-xs text-white/30">This may take 15–30 seconds on first load</p>
            </div>
          )}

          {ideError && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-[#0d1117] p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
                <Code2 className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <p className="mb-1 text-sm font-medium text-white">IDE failed to load</p>
                <p className="text-xs text-white/40">{ideError}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/[0.12] text-white/70"
                  onClick={() => { setIdeError(null); setIdeLoaded(false); }}
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  Retry
                </Button>
                <Button
                  size="sm"
                  onClick={() => repoUrl && window.open(repoUrl, "_blank")}
                  className="gap-1.5"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open on GitHub
                </Button>
              </div>
              <p className="text-xs text-white/30">
                StackBlitz requires a public GitHub repository and Chrome/Edge.
              </p>
            </div>
          )}

          <div ref={ideContainerRef} className="h-full w-full" />
        </div>

        {/* ── AI Chat Panel ─────────────────────────────────────────────── */}
        <div className="flex w-[340px] shrink-0 flex-col border-l border-white/[0.08] bg-[#161b22]">

          {/* Header */}
          <div className="flex items-center gap-2.5 border-b border-white/[0.08] px-4 py-3">
            <div className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg",
              isNewRepo ? "bg-primary/20" : "bg-white/[0.06]"
            )}>
              {isNewRepo
                ? <BrainCircuit className="h-4 w-4 text-primary" />
                : <Sparkles className="h-4 w-4 text-white/50" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">
                {isNewRepo ? "Project Manager AI" : "AI Assistant"}
              </p>
              <p className="text-[10px] text-white/35">
                {isGeneratingKickoff
                  ? "Analyzing project brief…"
                  : "Powered by OpenRouter"}
              </p>
            </div>
            {!isGeneratingKickoff && (
              <div className="flex gap-1.5 shrink-0">
                {historyStack.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRevert}
                    className="h-7 px-2 border border-red-500/20 hover:bg-red-500/5 text-[10px] text-red-400 hover:text-red-300 gap-1"
                    title="Undo last code changes"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Undo ({historyStack.length})
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={triggerPMKickoff}
                  className="h-7 px-2 border border-white/[0.08] hover:bg-white/[0.04] text-[10px] text-primary hover:text-primary gap-1"
                  title="Generate Project Kickoff Guide"
                >
                  <BrainCircuit className="h-3 w-3" />
                  PM Kickoff
                </Button>
              </div>
            )}
            {isGeneratingKickoff && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary/60 shrink-0" />
            )}


          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {aiMessages.map((msg) => {
              // PM "thinking" bubble
              if (msg.role === "pm-thinking") {
                return (
                  <div key={msg.id} className="flex gap-2 items-start">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 mt-0.5">
                      <BrainCircuit className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs text-white/50">
                      {msg.content}
                    </div>
                  </div>
                );
              }

              // User message
              if (msg.role === "user") {
                return (
                  <div key={msg.id} className="flex flex-row-reverse gap-2">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-xs leading-relaxed text-primary-foreground whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  </div>
                );
              }

              // Kickoff / assistant message
              const isKickoff = msg.isKickoff;
              return (
                <div key={msg.id} className="flex gap-2 items-start">
                  <div className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full mt-0.5",
                    isKickoff ? "bg-primary/20" : "bg-white/[0.06]"
                  )}>
                    {isKickoff
                      ? <BrainCircuit className="h-3.5 w-3.5 text-primary" />
                      : <Bot className="h-3.5 w-3.5 text-white/50" />
                    }
                  </div>
                  <div className={cn(
                    "flex-1 min-w-0 rounded-2xl rounded-tl-sm border px-3 py-2.5",
                    isKickoff
                      ? "border-primary/20 bg-primary/[0.06]"
                      : "border-white/[0.08] bg-white/[0.04]"
                  )}>
                    {isKickoff && (
                      <div className="mb-2 flex items-center gap-1.5">
                        <Zap className="h-3 w-3 text-primary" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-primary/80">
                          Project Kickoff Guide
                        </span>
                      </div>
                    )}
                    <div className="space-y-0.5">
                      {renderMarkdown(msg.content, handleApplyFile, applyingFiles)}
                    </div>

                  </div>
                </div>
              );
            })}

            {/* Generating kickoff animation */}
            {isGeneratingKickoff && (
              <div className="flex gap-2 items-start">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 mt-0.5">
                  <BrainCircuit className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1 rounded-2xl rounded-tl-sm border border-primary/20 bg-primary/[0.06] px-3 py-3">
                  <div className="mb-2 flex items-center gap-1.5">
                    <Zap className="h-3 w-3 text-primary" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary/80">
                      Generating Kickoff Guide…
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      "Reading project description…",
                      "Analyzing tech requirements…",
                      "Designing architecture…",
                      "Planning development roadmap…",
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Loader2
                          className="h-2.5 w-2.5 animate-spin text-primary/60 shrink-0"
                          style={{ animationDelay: `${i * 0.2}s` }}
                        />
                        <span className="text-[11px] text-white/40">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Regular AI loading */}
            {isAiLoading && (
              <div className="flex gap-2 items-start">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.06] mt-0.5">
                  <Bot className="h-3.5 w-3.5 text-white/50" />
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-white/[0.08] bg-white/[0.04] px-3 py-2">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40" />
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/[0.08] p-3">
            {isGeneratingKickoff ? (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] py-2.5 text-xs text-white/30">
                <Loader2 className="h-3 w-3 animate-spin" />
                Project Manager AI is writing your kickoff guide…
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <Input
                    ref={aiInputRef}
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={handleAiKeyDown}
                    placeholder="Ask about your code…"
                    disabled={isAiLoading}
                    className="h-9 border-white/[0.08] bg-white/[0.04] text-xs text-white placeholder:text-white/25 focus-visible:ring-primary/30"
                  />
                  <Button
                    size="sm"
                    onClick={handleSendAI}
                    disabled={isAiLoading || !aiInput.trim()}
                    className="h-9 w-9 shrink-0 p-0"
                  >
                    {isAiLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
                <p className="mt-2 text-center text-[10px] text-white/20">
                  Press Enter to send • Shift+Enter for new line
                </p>
              </>
            )}
          </div>
        </div>
      </div>
      {/* ── Commit Message Dialog Overlay ── */}
      {showPushDialog && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/65 backdrop-blur-sm">
          <div className="w-[380px] rounded-xl border border-white/[0.08] bg-[#161b22] p-5 shadow-2xl space-y-4 text-left">
            <div className="flex items-start gap-3 text-white">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <GitCommit className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white">Commit to GitHub</h3>
                <p className="text-[10px] text-white/40 mt-0.5">Saves all workspace files directly to the remote repository</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-white/40">Commit Message</label>
              <Input
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Update files via Catalance AI IDE"
                disabled={isPushing}
                className="h-9 border-white/[0.08] bg-white/[0.04] text-xs text-white placeholder:text-white/25 focus-visible:ring-primary/30"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isPushing) {
                    e.preventDefault();
                    handlePushToGitHub();
                  }
                }}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={isPushing}
                onClick={() => setShowPushDialog(false)}
                className="h-8 border border-white/[0.08] text-xs text-white/60 hover:bg-white/[0.04]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={isPushing}
                onClick={handlePushToGitHub}
                className="h-8 text-xs gap-1.5 font-semibold bg-primary text-primary-foreground hover:bg-primary/95"
              >
                {isPushing ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Pushing…
                  </>
                ) : (
                  <>
                    <GitCommit className="h-3.5 w-3.5" />
                    Commit & Push
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default IDEWorkspaceModal;
