import { Router } from "express";
import { requireAuth } from "../middlewares/require-auth.js";
import { env } from "../config/env.js";
import {
  buildOAuthUrl,
  verifyOAuthState,
  exchangeCodeForToken,
  getGitHubUser,
  createGitHubRepo,
  getRepoInfo,
  saveGitHubConnection,
  getStoredToken,
  getConnectionStatus,
  disconnectGitHub,
  aiAssistCode,
  pushFilesToGitHub,
  deployToVercel,
  auditProjectCodebase,
} from "../services/github.service.js";
import { prisma } from "../lib/prisma.js";

export const githubRouter = Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/github/oauth/url
// Returns the GitHub OAuth URL for the frontend to redirect to.
// Requires auth so we can embed userId in the state param.
// ─────────────────────────────────────────────────────────────────────────────
githubRouter.get("/oauth/url", requireAuth, (req, res) => {
  try {
    if (!env.GITHUB_CLIENT_ID) {
      return res.status(503).json({ error: "GitHub OAuth is not configured on this server." });
    }

    const projectId = req.query.projectId || "";
    const url = buildOAuthUrl(req.user.id, projectId);
    res.json({ url });
  } catch (err) {
    console.error("[GitHub] oauth/url error:", err);
    res.status(500).json({ error: "Failed to build OAuth URL" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/github/oauth/callback
// GitHub redirects here after user authorizes.
// Exchanges the code, saves token to DB, then redirects browser to frontend.
// ─────────────────────────────────────────────────────────────────────────────
githubRouter.get("/oauth/callback", async (req, res) => {
  const { code, state, error: oauthError } = req.query;
  const frontendBase = env.FRONTEND_URL || "http://localhost:5173";

  // User denied access on GitHub
  if (oauthError) {
    return res.redirect(`${frontendBase}?github=denied`);
  }

  if (!code || !state) {
    return res.redirect(`${frontendBase}?github=error&reason=missing_params`);
  }

  try {
    // 1. Verify the signed state (contains userId + projectId)
    const { userId, projectId } = verifyOAuthState(state);

    // 2. Exchange code for GitHub access token
    const accessToken = await exchangeCodeForToken(code);

    // 3. Get GitHub user info
    const ghUser = await getGitHubUser(accessToken);

    // 4. Save to DB (githubId, githubLogin, githubAccessToken on User)
    await saveGitHubConnection(userId, {
      githubId: ghUser.id,
      githubLogin: ghUser.login,
      accessToken,
      avatarUrl: ghUser.avatar_url,
    });

    // 5. Redirect back to the project page with success flag
    const redirectPath = projectId
      ? `/freelancer/project/${projectId}?github=connected`
      : `/freelancer/dashboard?github=connected`;

    return res.redirect(`${frontendBase}${redirectPath}`);
  } catch (err) {
    console.error("[GitHub] OAuth callback error:", err);
    const frontendBase2 = env.FRONTEND_URL || "http://localhost:5173";
    return res.redirect(`${frontendBase2}?github=error&reason=${encodeURIComponent(err.message)}`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/github/status
// Returns whether the user has connected GitHub, and their username.
// ─────────────────────────────────────────────────────────────────────────────
githubRouter.get("/status", requireAuth, async (req, res) => {
  try {
    const status = await getConnectionStatus(req.user.id);
    res.json({ success: true, ...status });
  } catch (err) {
    console.error("[GitHub] status error:", err);
    res.status(500).json({ error: "Failed to get GitHub status" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/github/repo/create
// Creates a new GitHub repo for the project, saves URL to project.externalLink.
// Body: { projectId, repoName? }
// ─────────────────────────────────────────────────────────────────────────────
githubRouter.post("/repo/create", requireAuth, async (req, res) => {
  const { projectId, repoName } = req.body || {};

  if (!projectId) {
    return res.status(400).json({ error: "projectId is required" });
  }

  try {
    // Get stored GitHub token
    const userRecord = await getStoredToken(req.user.id);
    if (!userRecord?.githubAccessToken) {
      return res.status(401).json({ error: "GitHub account not connected. Please connect GitHub first." });
    }

    // ── Verify token has 'repo' scope ────────────────────────────────────
    // GitHub returns the granted scopes in the X-OAuth-Scopes header
    const scopeCheck = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${userRecord.githubAccessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    const grantedScopes = (scopeCheck.headers.get("x-oauth-scopes") || "").split(",").map((s) => s.trim());
    console.log("[GitHub] Token granted scopes:", grantedScopes);

    const hasRepoScope = grantedScopes.includes("repo") || grantedScopes.includes("public_repo");
    if (!hasRepoScope) {
      return res.status(403).json({
        error:
          "Your GitHub token doesn't have repository creation permissions. Please disconnect GitHub and reconnect to grant the required permissions.",
        grantedScopes,
      });
    }

    // Get the project to use its title as the default repo name
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, title: true, description: true, ownerId: true },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const finalRepoName = repoName || `catalance-${project.title}`;
    const description = project.description?.slice(0, 255) || "";

    // Create the repo
    const repoData = await createGitHubRepo(
      userRecord.githubAccessToken,
      finalRepoName,
      description
    );

    // Save the repo URL to project.externalLink
    await prisma.project.update({
      where: { id: projectId },
      data: { externalLink: repoData.repoUrl },
    });

    res.json({
      success: true,
      repoUrl: repoData.repoUrl,
      repoName: repoData.repoName,
      fullName: repoData.fullName,
      defaultBranch: repoData.defaultBranch,
    });
  } catch (err) {
    console.error("[GitHub] repo/create error:", err.message);
    res.status(500).json({ error: err.message || "Failed to create repository" });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// POST /api/github/repo/push
// Commits and pushes the complete virtual workspace files snapshot directly to GitHub
// Body: { projectId, files, commitMessage? }
// ─────────────────────────────────────────────────────────────────────────────
githubRouter.post("/repo/push", requireAuth, async (req, res) => {
  const { projectId, files, commitMessage } = req.body || {};

  if (!projectId) {
    return res.status(400).json({ error: "projectId is required" });
  }
  if (!files || typeof files !== "object") {
    return res.status(400).json({ error: "files object is required" });
  }

  try {
    // 1. Get stored GitHub token
    const userRecord = await getStoredToken(req.user.id);
    if (!userRecord?.githubAccessToken) {
      return res.status(401).json({ error: "GitHub account not connected." });
    }

    // 2. Retrieve project details
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, externalLink: true },
    });

    if (!project || !project.externalLink) {
      return res.status(404).json({ error: "Linked repository not found for this project." });
    }

    // Extract owner/repo name
    const match = project.externalLink.match(/github\.com\/([^/]+\/[^/?#]+)/);
    if (!match) {
      return res.status(400).json({ error: "Invalid repository URL format in project." });
    }
    const repoFullName = match[1];

    // 3. Trigger commit & push directly via GitHub API
    const pushResult = await pushFilesToGitHub(
      userRecord.githubAccessToken,
      repoFullName,
      files,
      commitMessage || "Update files via Catalance AI IDE"
    );

    // 4. Update the project with the staging sandbox URL
    const frontendUrl = env.FRONTEND_URL || "http://localhost:5173";
    const stagingUrl = `${frontendUrl}/project/${projectId}/staging`;
    await prisma.project.update({
      where: { id: projectId },
      data: { stagingUrl },
    });

    res.json({
      success: true,
      commitSha: pushResult.commitSha,
      branch: pushResult.branch,
      repoUrl: project.externalLink,
      stagingUrl,
    });
  } catch (err) {
    console.error("[GitHub] repo/push error:", err);
    res.status(500).json({ error: err.message || "Failed to push changes to GitHub" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/github/repo/deploy
// Triggers a Vercel deployment for the linked GitHub repository
// Body: { projectId, vercelToken? }
// ─────────────────────────────────────────────────────────────────────────────
githubRouter.post("/repo/deploy", requireAuth, async (req, res) => {
  const { projectId, vercelToken } = req.body || {};

  if (!projectId) {
    return res.status(400).json({ error: "projectId is required" });
  }

  try {
    // 1. Get stored GitHub token
    const userRecord = await getStoredToken(req.user.id);
    if (!userRecord?.githubAccessToken) {
      return res.status(401).json({ error: "GitHub account not connected." });
    }

    // 2. Retrieve project details
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, externalLink: true },
    });

    if (!project || !project.externalLink) {
      return res.status(404).json({ error: "Linked repository not found for this project." });
    }

    // Extract owner/repo name
    const match = project.externalLink.match(/github\.com\/([^/]+\/[^/?#]+)/);
    if (!match) {
      return res.status(400).json({ error: "Invalid repository URL format in project." });
    }
    const repoFullName = match[1];

    // 3. Deploy to Vercel
    const deployResult = await deployToVercel(
      userRecord.githubAccessToken,
      repoFullName,
      vercelToken || env.VERCEL_TOKEN
    );

    // 4. Update the project with the live production Vercel URL
    await prisma.project.update({
      where: { id: projectId },
      data: { stagingUrl: deployResult.url },
    });

    res.json({
      success: true,
      url: deployResult.url,
      deploymentId: deployResult.deploymentId,
    });
  } catch (err) {
    console.error("[GitHub] repo/deploy error:", err);
    res.status(500).json({ error: err.message || "Vercel deployment failed" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/github/repo/files/:projectId
// Fetches the live files snapshot recursively from the GitHub repository contents
// ─────────────────────────────────────────────────────────────────────────────
githubRouter.get("/repo/files/:projectId", requireAuth, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.projectId },
      select: { id: true, externalLink: true },
    });

    if (!project || !project.externalLink) {
      return res.status(404).json({ error: "No repository linked to this project" });
    }

    const match = project.externalLink.match(/github\.com\/([^/]+\/[^/?#]+)/);
    if (!match) {
      return res.status(400).json({ error: "Invalid repository URL format" });
    }
    const repoFullName = match[1];

    const userRecord = await getStoredToken(req.user.id);
    if (!userRecord?.githubAccessToken) {
      return res.status(401).json({ error: "GitHub account not connected" });
    }

    // 1. Get repository metadata to retrieve the default branch
    const repoRes = await fetch(`https://api.github.com/repos/${repoFullName}`, {
      headers: {
        Authorization: `Bearer ${userRecord.githubAccessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!repoRes.ok) throw new Error("Failed to fetch repository information");
    const repoData = await repoRes.json();
    const branch = repoData.default_branch || "main";

    // 2. Fetch recursive git tree using default branch SHA
    const branchRes = await fetch(`https://api.github.com/repos/${repoFullName}/git/trees/${branch}?recursive=1`, {
      headers: {
        Authorization: `Bearer ${userRecord.githubAccessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!branchRes.ok) throw new Error("Failed to load repository tree");
    const treeData = await branchRes.json();

    // 3. Construct files dictionary.
    // For local preview, we can fetch contents on demand or load small text files.
    // Let's gather all file paths that are of type "blob" (excluding node_modules, assets, images)
    const filesList = {};
    const textExtensions = [".html", ".css", ".js", ".jsx", ".ts", ".tsx", ".json", ".md", ".yml", ".yaml", ".txt"];

    const textBlobs = (treeData.tree || []).filter((node) => {
      if (node.type !== "blob") return false;
      const lower = node.path.toLowerCase();
      if (lower.includes("node_modules") || lower.includes(".git/")) return false;
      return textExtensions.some((ext) => lower.endsWith(ext));
    });

    // Fetch the contents of these blobs in parallel (capped at first 12 files to avoid API secondary limits)
    const activeBlobs = textBlobs.slice(0, 12);
    await Promise.all(
      activeBlobs.map(async (node) => {
        try {
          const rawUrl = `https://raw.githubusercontent.com/${repoFullName}/${branch}/${node.path}`;
          const contentRes = await fetch(rawUrl, {
            headers: {
              Authorization: `Bearer ${userRecord.githubAccessToken}`,
            },
          });
          if (contentRes.ok) {
            filesList[node.path] = await contentRes.text();
          }
        } catch (fetchErr) {
          console.warn(`Failed fetching file content for ${node.path}:`, fetchErr);
        }
      })
    );

    res.json({
      success: true,
      branch,
      files: filesList,
    });
  } catch (err) {
    console.error("[GitHub] repo/files error:", err);
    res.status(500).json({ error: err.message || "Failed to load files from GitHub" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/github/repo/audit
// Performs a comprehensive quality and milestone checklist audit on repo code
// Body: { projectId }
// ─────────────────────────────────────────────────────────────────────────────
githubRouter.post("/repo/audit", requireAuth, async (req, res) => {
  const { projectId } = req.body || {};

  if (!projectId) {
    return res.status(400).json({ error: "projectId is required" });
  }

  try {
    // 1. Get stored GitHub token
    const userRecord = await getStoredToken(req.user.id);
    if (!userRecord?.githubAccessToken) {
      return res.status(401).json({ error: "GitHub account not connected." });
    }

    // 2. Retrieve project details and requirements
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        description: true,
        featuresDeliverables: true,
        externalLink: true,
      },
    });

    if (!project || !project.externalLink) {
      return res.status(404).json({ error: "Linked repository not found for this project." });
    }

    // Extract owner/repo name
    const match = project.externalLink.match(/github\.com\/([^/]+\/[^/?#]+)/);
    if (!match) {
      return res.status(400).json({ error: "Invalid repository URL format in project." });
    }
    const repoFullName = match[1];

    // 3. Load live files from GitHub to perform audit
    // Retrieve default branch metadata
    const repoRes = await fetch(`https://api.github.com/repos/${repoFullName}`, {
      headers: {
        Authorization: `Bearer ${userRecord.githubAccessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!repoRes.ok) throw new Error("Failed to load repository branch metadata");
    const repoData = await repoRes.json();
    const branch = repoData.default_branch || "main";

    // Retrieve recursive git tree
    const treeRes = await fetch(`https://api.github.com/repos/${repoFullName}/git/trees/${branch}?recursive=1`, {
      headers: {
        Authorization: `Bearer ${userRecord.githubAccessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!treeRes.ok) throw new Error("Failed to load repository file tree");
    const treeData = await treeRes.json();

    const filesDict = {};
    const textExtensions = [".html", ".css", ".js", ".jsx", ".ts", ".tsx", ".json", ".md"];
    const textBlobs = (treeData.tree || []).filter((node) => {
      if (node.type !== "blob") return false;
      const lower = node.path.toLowerCase();
      if (lower.includes("node_modules") || lower.includes(".git/")) return false;
      return textExtensions.some((ext) => lower.endsWith(ext));
    });

    // Fetch raw contents of the first 10 source files
    await Promise.all(
      textBlobs.slice(0, 10).map(async (node) => {
        try {
          const rawUrl = `https://raw.githubusercontent.com/${repoFullName}/${branch}/${node.path}`;
          const contentRes = await fetch(rawUrl, {
            headers: { Authorization: `Bearer ${userRecord.githubAccessToken}` },
          });
          if (contentRes.ok) {
            filesDict[node.path] = await contentRes.text();
          }
        } catch (err) {
          console.warn(`Failed reading file: ${node.path}`, err);
        }
      })
    );

    // 4. Trigger AI Audit
    const auditReport = await auditProjectCodebase(
      userRecord.githubAccessToken,
      repoFullName,
      project,
      filesDict
    );

    // 5. Save the audit report in database
    const savedAudit = await prisma.projectAudit.create({
      data: {
        projectId,
        score: auditReport.score || 0,
        checklistScore: auditReport.checklistScore || 0,
        securityScore: auditReport.securityScore || 0,
        passedChecks: auditReport.passedChecks || 0,
        failedChecks: auditReport.failedChecks || 0,
        reportJson: auditReport.findings || [],
        status: auditReport.status || "PASSED",
      },
    });

    res.json({
      success: true,
      audit: savedAudit,
    });
  } catch (err) {
    console.error("[GitHub] repo/audit error:", err);
    res.status(500).json({ error: err.message || "Quality audit failed" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/github/repo/audit/:projectId
// Returns list of audit history logs for a project
// ─────────────────────────────────────────────────────────────────────────────
githubRouter.get("/repo/audit/:projectId", requireAuth, async (req, res) => {
  try {
    const audits = await prisma.projectAudit.findMany({
      where: { projectId: req.params.projectId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, audits });
  } catch (err) {
    console.error("[GitHub] repo/audit/history error:", err);
    res.status(500).json({ error: "Failed to load audit history" });
  }
});




// ─────────────────────────────────────────────────────────────────────────────
// GET /api/github/repo/:projectId
// Returns the GitHub repo URL stored in project.externalLink, plus repo metadata.
// ─────────────────────────────────────────────────────────────────────────────

githubRouter.get("/repo/:projectId", requireAuth, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.projectId },
      select: { id: true, title: true, externalLink: true },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const repoUrl = project.externalLink;

    if (!repoUrl || !repoUrl.includes("github.com")) {
      return res.json({ success: true, repoUrl: null, repoInfo: null });
    }

    // Try to get live repo info
    let repoInfo = null;
    const userRecord = await getStoredToken(req.user.id);
    if (userRecord?.githubAccessToken) {
      // Extract owner/repo from URL
      const match = repoUrl.match(/github\.com\/([^/]+\/[^/]+)/);
      if (match) {
        repoInfo = await getRepoInfo(userRecord.githubAccessToken, match[1]).catch(() => null);
      }
    }

    res.json({ success: true, repoUrl, repoInfo });
  } catch (err) {
    console.error("[GitHub] repo/get error:", err);
    res.status(500).json({ error: "Failed to fetch repo info" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/github/usage/:projectId
// Returns total token usage and total Rupees spent on AI for a project
// ─────────────────────────────────────────────────────────────────────────────
githubRouter.get("/usage/:projectId", requireAuth, async (req, res) => {
  try {
    const usages = await prisma.aIUsage.findMany({
      where: { projectId: req.params.projectId },
      select: { promptTokens: true, completionTokens: true, costInRupees: true },
    });

    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalSpendInRupees = 0;

    usages.forEach((u) => {
      totalPromptTokens += u.promptTokens;
      totalCompletionTokens += u.completionTokens;
      totalSpendInRupees += u.costInRupees;
    });

    res.json({
      success: true,
      totalPromptTokens,
      totalCompletionTokens,
      totalTokens: totalPromptTokens + totalCompletionTokens,
      totalSpendInRupees: Number(totalSpendInRupees.toFixed(2)),
    });
  } catch (err) {
    console.error("[GitHub] usage error:", err);
    res.status(500).json({ error: "Failed to get AI usage summary" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/github/ai-assist
// Proxies chat messages to OpenRouter for IDE AI coding assistance.
// Body: { messages: [{role, content}], projectContext?: {} }
// ─────────────────────────────────────────────────────────────────────────────

githubRouter.post("/ai-assist", requireAuth, async (req, res) => {
  const { messages, projectContext } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required" });
  }

  try {
    const projectId = projectContext?.id || null;
    const reply = await aiAssistCode(messages, projectContext || {}, req.user.id, projectId);
    res.json({ success: true, reply });
  } catch (err) {
    console.error("[GitHub] ai-assist error:", err);
    res.status(500).json({ error: err.message || "AI assistant error" });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/github/disconnect
// Removes the GitHub token from the user's record.
// ─────────────────────────────────────────────────────────────────────────────
githubRouter.delete("/disconnect", requireAuth, async (req, res) => {
  try {
    await disconnectGitHub(req.user.id);
    res.json({ success: true, message: "GitHub disconnected successfully" });
  } catch (err) {
    console.error("[GitHub] disconnect error:", err);
    res.status(500).json({ error: "Failed to disconnect GitHub" });
  }
});
