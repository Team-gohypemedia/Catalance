import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";

const GITHUB_API = "https://api.github.com";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_OAUTH_URL = "https://github.com/login/oauth/authorize";

// ─── OAuth URL Builder ──────────────────────────────────────────────────────

/**
 * Build GitHub OAuth redirect URL.
 * We embed the user's ID + projectId in a signed JWT state param
 * so the callback can identify who authorized without needing the JWT header.
 */
export const buildOAuthUrl = (userId, projectId) => {
  const state = jwt.sign(
    { userId, projectId, iat: Math.floor(Date.now() / 1000) },
    env.JWT_SECRET,
    { expiresIn: "10m" }
  );

  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: env.GITHUB_CALLBACK_URL,
    scope: "repo read:user user:email",
    state,
  });

  return `${GITHUB_OAUTH_URL}?${params.toString()}`;
};

/**
 * Verify the state param from the OAuth callback.
 * Returns { userId, projectId } or throws if invalid/expired.
 */
export const verifyOAuthState = (state) => {
  try {
    return jwt.verify(state, env.JWT_SECRET);
  } catch {
    throw new Error("Invalid or expired OAuth state parameter");
  }
};

// ─── Token Exchange ──────────────────────────────────────────────────────────

/**
 * Exchange a GitHub authorization code for an access token.
 */
export const exchangeCodeForToken = async (code) => {
  const response = await fetch(GITHUB_TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: env.GITHUB_CALLBACK_URL,
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`);
  }

  if (!data.access_token) {
    throw new Error("No access token returned from GitHub");
  }

  return data.access_token;
};

// ─── GitHub API Helpers ──────────────────────────────────────────────────────

/**
 * Fetch the authenticated GitHub user's info.
 */
export const getGitHubUser = async (accessToken) => {
  const response = await fetch(`${GITHUB_API}/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

/**
 * Create a new GitHub repository for the given user.
 */
export const createGitHubRepo = async (accessToken, repoName, description = "") => {
  // Sanitize repo name per GitHub rules:
  // - Lowercase only
  // - Spaces/underscores → hyphens
  // - Strip anything not a-z 0-9 hyphen or dot
  // - Strip leading/trailing hyphens and dots (GitHub rejects them)
  // - Collapse consecutive hyphens
  // - Max 100 chars
  let sanitizedName = repoName
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-.]/g, "")
    .replace(/^[-.]+/, "")
    .replace(/[-.]+$/, "")
    .replace(/--+/g, "-")
    .slice(0, 100)
    .trim();

  // Fallback if name is empty after sanitization
  if (!sanitizedName) {
    sanitizedName = `catalance-project-${Date.now()}`;
  }

  // GitHub caps description at 255 chars AND rejects control characters (newlines, tabs, etc.)
  const safeDescription = (description || `Catalance project: ${repoName}`)
    .replace(/[\x00-\x1F\x7F]/g, " ")  // replace all control chars with a space
    .replace(/\s+/g, " ")               // collapse multiple spaces
    .trim()
    .slice(0, 255);

  console.log(`[GitHub] Creating repo: "${sanitizedName}" (original: "${repoName}")`);

  const response = await fetch(`${GITHUB_API}/user/repos`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      name: sanitizedName,
      description: safeDescription,
      private: false,
      auto_init: true,
      has_issues: true,
      has_projects: false,
      has_wiki: false,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    // Log full details for debugging
    console.error("[GitHub] createGitHubRepo failed:", {
      status: response.status,
      message: data.message,
      errors: data.errors,
      sanitizedName,
    });

    if (response.status === 422) {
      const errorMessages = (data.errors || []).map((e) => e.message).filter(Boolean);
      if (errorMessages.some((m) => m.toLowerCase().includes("already exists"))) {
        throw new Error(
          `Repo "${sanitizedName}" already exists on your GitHub. Link it using the "Link Existing Repo" option instead.`
        );
      }
      const detail = errorMessages.join(", ") || data.message || "Validation failed";
      throw new Error(`GitHub rejected repo name "${sanitizedName}": ${detail}`);
    }

    if (response.status === 401) {
      throw new Error("GitHub token expired. Disconnect and reconnect your GitHub account.");
    }

    if (response.status === 403) {
      throw new Error(
        "GitHub permission denied — your token may lack repo creation scope. Disconnect and reconnect GitHub."
      );
    }

    throw new Error(`GitHub API error (${response.status}): ${data.message || "Unknown error"}`);
  }

  console.log(`[GitHub] Repo created: ${data.full_name}`);

  return {
    repoUrl: data.html_url,
    repoName: data.name,
    fullName: data.full_name,
    defaultBranch: data.default_branch,
    cloneUrl: data.clone_url,
  };
};


/**
 * Get info for a specific repo by full name (owner/repo).
 */
export const getRepoInfo = async (accessToken, fullName) => {
  const response = await fetch(`${GITHUB_API}/repos/${fullName}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return {
    repoUrl: data.html_url,
    repoName: data.name,
    fullName: data.full_name,
    defaultBranch: data.default_branch,
    isPrivate: data.private,
    updatedAt: data.updated_at,
    description: data.description,
  };
};

// ─── DB Operations ───────────────────────────────────────────────────────────

/**
 * Save GitHub connection to the User row.
 */
export const saveGitHubConnection = async (userId, { githubId, githubLogin, accessToken, avatarUrl }) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      githubId: String(githubId),
      githubLogin,
      githubAccessToken: accessToken,
    },
    select: {
      id: true,
      githubLogin: true,
      githubId: true,
    },
  });
};

/**
 * Get the stored GitHub access token for a user.
 */
export const getStoredToken = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { githubAccessToken: true, githubLogin: true, githubId: true },
  });
  return user;
};

/**
 * Get GitHub connection status for a user.
 */
export const getConnectionStatus = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { githubId: true, githubLogin: true, githubAccessToken: true },
  });

  if (!user?.githubId) {
    return { connected: false };
  }

  // Fetch fresh avatar from GitHub
  let avatarUrl = null;
  try {
    if (user.githubLogin) {
      avatarUrl = `https://avatars.githubusercontent.com/${user.githubLogin}`;
    }
  } catch {
    // Non-critical
  }

  return {
    connected: true,
    login: user.githubLogin,
    avatarUrl,
  };
};

/**
 * Remove GitHub connection from a user's record.
 */
export const disconnectGitHub = async (userId) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      githubId: null,
      githubLogin: null,
      githubAccessToken: null,
    },
  });
};

// ─── AI Assist (OpenRouter Proxy) ────────────────────────────────────────────

/**
 * Proxy a chat message to OpenRouter for AI coding assistance.
 * Uses the same OPENROUTER_API_KEY and OPENROUTER_MODEL as the rest of the app.
 */
export const aiAssistCode = async (messages, projectContext = {}, userId = null, projectId = null) => {
  if (!env.OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key is not configured");
  }

  const systemPrompt = buildAISystemPrompt(projectContext);

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": env.FRONTEND_URL || "https://catalance.in",
      "X-Title": "Catalance IDE Assistant",
    },
    body: JSON.stringify({
      model: env.OPENROUTER_MODEL || "openai/gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      max_tokens: 2048,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenRouter error (${response.status}): ${errorData?.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content;

  if (!reply) {
    throw new Error("No response from AI");
  }

  // ── Log AI usage in DB ────────────────────────────────────────────────────
  if (userId) {
    try {
      const promptTokens = data.usage?.prompt_tokens || 0;
      const completionTokens = data.usage?.completion_tokens || 0;

      // Estimate cost: $2.50 per 1M prompt, $10.00 per 1M completion
      // USD to INR rate: 85.0
      const costUSD = (promptTokens * 0.0000025) + (completionTokens * 0.00001);
      const costInRupees = costUSD * 85.0;

      await prisma.aIUsage.create({
        data: {
          userId,
          projectId: projectId || null,
          promptTokens,
          completionTokens,
          costInRupees,
        },
      });
      console.log(`[AIUsage logged] User: ${userId}, Project: ${projectId}, Tokens: ${promptTokens + completionTokens}, Cost: ₹${costInRupees.toFixed(4)}`);
    } catch (logErr) {
      console.error("[AIUsage logging failed]:", logErr);
    }
  }

  return reply;
};


/**
 * Build a rich system prompt for the IDE AI assistant from project context.
 */
const buildAISystemPrompt = (ctx = {}) => {
  const lines = [
    "You are an expert software engineering assistant inside the Catalance platform.",
    "You are helping a freelance developer who is actively working on a client project.",
    "",
    "Your role:",
    "- Answer coding questions clearly and concisely",
    "- Help debug errors and suggest fixes",
    "- Recommend best practices for the tech stack",
    "- Review code snippets and suggest improvements",
    "- Explain complex concepts simply",
    "",
  ];

  if (ctx.title) {
    lines.push(`Project: ${ctx.title}`);
  }
  if (ctx.description) {
    lines.push(`Description: ${ctx.description}`);
  }
  if (ctx.frontendFramework) {
    lines.push(`Frontend: ${ctx.frontendFramework}`);
  }
  if (ctx.backendTechnology) {
    lines.push(`Backend: ${ctx.backendTechnology}`);
  }
  if (ctx.databaseType) {
    lines.push(`Database: ${ctx.databaseType}`);
  }

  lines.push(
    "",
    "CRITICAL CODE WRITING INSTRUCTION:",
    "If you want to create, modify, or rewrite a file in the workspace, you MUST output the COMPLETE file content wrapped in this exact format (you can output multiple files if needed):",
    "",
    "[WRITE_FILE:relative/path/to/file.ext]",
    "```language-code",
    "// complete file content",
    "```",
    "",
    "Always provide the FULL file content inside the [WRITE_FILE] block. Never use comments like '// ... rest of code' or placeholders, as this code will be written directly into the workspace files. If the file already exists, output the modified version in full.",
    "",
    "Format your normal conversational responses clearly. Use standard markdown. Be concise and professional."
  );

  return lines.join("\n");
};

/**
 * Commit and push multiple virtual files to a GitHub repository branch.
 */
export const pushFilesToGitHub = async (accessToken, repoFullName, files, commitMessage = "Update files via Catalance AI IDE") => {
  const GITHUB_API = "https://api.github.com";

  // 1. Get repository default branch
  const repoRes = await fetch(`${GITHUB_API}/repos/${repoFullName}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!repoRes.ok) throw new Error("Failed to fetch repository metadata from GitHub");
  const repoData = await repoRes.json();
  const defaultBranch = repoData.default_branch || "main";

  // 2. Get reference SHA of default branch
  const refRes = await fetch(`${GITHUB_API}/repos/${repoFullName}/git/ref/heads/${defaultBranch}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!refRes.ok) throw new Error(`Failed to fetch branch ref for ${defaultBranch}`);
  const refData = await refRes.json();
  const baseCommitSha = refData.object.sha;

  // 3. Create blob items for each source file
  const treeItems = [];
  for (const [path, content] of Object.entries(files)) {
    const lower = path.toLowerCase();
    // Skip binary files, node_modules, .git directories
    if (
      lower.includes("node_modules") ||
      lower.includes(".git/") ||
      lower.endsWith(".png") ||
      lower.endsWith(".jpg") ||
      lower.endsWith(".jpeg") ||
      lower.endsWith(".ico") ||
      lower.endsWith(".gif")
    ) {
      continue;
    }

    treeItems.push({
      path,
      mode: "100644", // Normal file
      type: "blob",
      content,
    });
  }

  if (treeItems.length === 0) {
    throw new Error("No text files available to push");
  }

  // 4. Retrieve base commit's tree SHA
  const commitRes = await fetch(`${GITHUB_API}/repos/${repoFullName}/git/commits/${baseCommitSha}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!commitRes.ok) throw new Error("Failed to retrieve base commit tree from GitHub");
  const commitData = await commitRes.json();
  const baseTreeSha = commitData.tree.sha;

  // 5. Create a new virtual git tree
  const createTreeRes = await fetch(`${GITHUB_API}/repos/${repoFullName}/git/trees`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: treeItems,
    }),
  });
  if (!createTreeRes.ok) {
    const errData = await createTreeRes.json().catch(() => ({}));
    throw new Error(`Failed to create Git tree: ${errData.message || createTreeRes.statusText}`);
  }
  const newTreeData = await createTreeRes.json();
  const newTreeSha = newTreeData.sha;

  // 6. Create commit pointing to the new tree & parent commit
  const createCommitRes = await fetch(`${GITHUB_API}/repos/${repoFullName}/git/commits`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      message: commitMessage,
      tree: newTreeSha,
      parents: [baseCommitSha],
    }),
  });
  if (!createCommitRes.ok) throw new Error("Failed to create Git commit on GitHub");
  const newCommitData = await createCommitRes.json();
  const newCommitSha = newCommitData.sha;

  // 7. Update branch ref
  const updateRefRes = await fetch(`${GITHUB_API}/repos/${repoFullName}/git/refs/heads/${defaultBranch}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      sha: newCommitSha,
      force: false,
    }),
  });
  if (!updateRefRes.ok) {
    const errData = await updateRefRes.json().catch(() => ({}));
    throw new Error(`Failed to update branch reference: ${errData.message || updateRefRes.statusText}`);
  }

  return {
    success: true,
    commitSha: newCommitSha,
    branch: defaultBranch,
  };
};

/**
 * Trigger a Vercel deployment for the linked GitHub repository.
 */
export const deployToVercel = async (accessToken, repoFullName, vercelToken = null) => {
  const GITHUB_API = "https://api.github.com";

  // 1. Get Repo Details (specifically the repo ID)
  const repoRes = await fetch(`${GITHUB_API}/repos/${repoFullName}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!repoRes.ok) throw new Error("Failed to retrieve repository metadata from GitHub");
  const repoData = await repoRes.json();
  const repoId = repoData.id;

  // 2. Trigger deployment on Vercel
  const token = vercelToken || env.VERCEL_TOKEN;
  if (!token) {
    throw new Error("Vercel Access Token is required to deploy. Please supply your Vercel Token.");
  }

  const vercelRes = await fetch("https://api.vercel.com/v13/deployments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: repoData.name,
      gitSource: {
        type: "github",
        repoId: repoId.toString(),
        ref: repoData.default_branch || "main",
      },
    }),
  });

  if (!vercelRes.ok) {
    const errData = await vercelRes.json().catch(() => ({}));
    throw new Error(errData.error?.message || "Vercel deployment request failed");
  }

  const vercelData = await vercelRes.json();
  return {
    success: true,
    url: `https://${vercelData.url}`,
    deploymentId: vercelData.id,
  };
};

/**
 * Scan the project repository files and perform a comprehensive AI Quality, Security & Milestone Audit.
 */
export const auditProjectCodebase = async (accessToken, repoFullName, projectContext, filesDict) => {
  if (!env.OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key is not configured for auditing");
  }

  // 1. Construct audit context
  const filesList = Object.entries(filesDict)
    .map(([path, content]) => `File: ${path}\n\`\`\`\n${content.slice(0, 1500)}\n\`\`\``) // cap file length to prevent context bloat
    .join("\n\n");

  const checklistItems = Array.isArray(projectContext.featuresDeliverables)
    ? projectContext.featuresDeliverables.map((item, idx) => `${idx + 1}. ${item}`).join("\n")
    : "None defined";

  const systemPrompt = `You are a Senior Principal Software Quality Assurance Engineer and Cybersecurity Auditor.
Evaluate the developer's submitted code against the project specifications, security standards, and functional deliverables.

Project Description:
"${projectContext.description || "N/A"}"

Key Milestones/Deliverables Checklist:
${checklistItems}

Follow these strict JSON format requirements. Your response MUST be a single, valid JSON object and nothing else. No markdown wrapping like \`\`\`json, no introductory text, no conversational text.

Required JSON Structure:
{
  "score": 92, // Overall quality score from 0 to 100
  "checklistScore": 85, // Functional compliance score from 0 to 100
  "securityScore": 95, // Security health score from 0 to 100
  "passedChecks": 8, // Count of checks passed
  "failedChecks": 2, // Count of checks failed
  "status": "PASSED", // "PASSED" | "FAILED" | "WARNING" (FAILED if securityScore < 70 or score < 70)
  "findings": [
    {
      "file": "src/db.js",
      "line": 14,
      "type": "security", // "quality" | "security" | "functional"
      "severity": "high", // "high" | "medium" | "low"
      "message": "Hardcoded database password detected.",
      "fix": "Use process.env.DATABASE_URL instead of plain string credentials."
    }
  ]
}`;

  const userPrompt = `Perform the audit on these workspace files:\n\n${filesList || "No source files found in repository."}`;

  // 2. Call OpenRouter
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": env.FRONTEND_URL || "https://catalance.in",
      "X-Title": "Catalance Code Auditor",
    },
    body: JSON.stringify({
      model: env.OPENROUTER_MODEL || "openai/gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 1500,
      temperature: 0.1, // low temperature for absolute consistency
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenRouter audit failed: ${errorData?.error?.message || response.statusText}`);
  }

  const resJson = await response.json();
  const rawReply = resJson.choices?.[0]?.message?.content?.trim();

  if (!rawReply) {
    throw new Error("Auditor returned an empty report");
  }

  // 3. Sanitise response (extract JSON body between first '{' and last '}')
  try {
    const startIdx = rawReply.indexOf("{");
    const endIdx = rawReply.lastIndexOf("}");
    if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
      throw new Error("Response does not contain a valid JSON object block");
    }
    const cleanJsonString = rawReply.slice(startIdx, endIdx + 1);
    const report = JSON.parse(cleanJsonString);
    return report;
  } catch (parseErr) {
    console.error("[Audit JSON Parse Error] Raw content:", rawReply);
    throw new Error("Failed to parse structural audit report from AI");
  }
};




