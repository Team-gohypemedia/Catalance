import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/shared/context/AuthContext";
import Code2 from "lucide-react/dist/esm/icons/code-2";
import Laptop from "lucide-react/dist/esm/icons/laptop";
import Smartphone from "lucide-react/dist/esm/icons/smartphone";
import Tablet from "lucide-react/dist/esm/icons/tablet";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import File from "lucide-react/dist/esm/icons/file";
import Folder from "lucide-react/dist/esm/icons/folder";
import FolderOpen from "lucide-react/dist/esm/icons/folder-open";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import Eye from "lucide-react/dist/esm/icons/eye";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Server from "lucide-react/dist/esm/icons/server";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Send from "lucide-react/dist/esm/icons/send";
import Lock from "lucide-react/dist/esm/icons/lock";

const detectTechStack = (filesDict) => {
  const detected = [];
  
  // 1. Check package.json dependencies
  const pkgContent = filesDict["package.json"];
  if (pkgContent) {
    try {
      const pkg = JSON.parse(pkgContent);
      const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      
      if (allDeps["react"]) detected.push("React");
      if (allDeps["next"]) detected.push("Next.js");
      if (allDeps["vue"]) detected.push("Vue.js");
      if (allDeps["svelte"]) detected.push("Svelte");
      if (allDeps["tailwindcss"]) detected.push("TailwindCSS");
      if (allDeps["typescript"]) detected.push("TypeScript");
      if (allDeps["vite"]) detected.push("Vite");
      if (allDeps["expo"]) detected.push("Expo (React Native)");
      if (allDeps["@prisma/client"]) detected.push("Prisma ORM");
      if (allDeps["express"]) detected.push("Express.js");
      if (allDeps["firebase"]) detected.push("Firebase");
      if (allDeps["supabase"]) detected.push("Supabase");
    } catch (e) {
      console.warn("Failed to parse package.json for tech stack:", e);
    }
  }
  
  // 2. Extension fallbacks
  const paths = Object.keys(filesDict);
  if (detected.length === 0) {
    if (paths.some(p => p.endsWith(".swift"))) detected.push("Swift (iOS)");
    if (paths.some(p => p.endsWith(".kt") || p.endsWith(".kts"))) detected.push("Kotlin (Android)");
    if (paths.some(p => p.endsWith(".dart"))) detected.push("Flutter");
    if (paths.some(p => p.endsWith(".py"))) detected.push("Python");
    if (paths.some(p => p.endsWith(".go"))) detected.push("Go");
    if (paths.some(p => p.includes("index.html") || p.endsWith(".html"))) detected.push("HTML5 / JS");
  }
  
  return Array.from(new Set(detected));
};

const ClientStagingPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState({});
  const [selectedFilePath, setSelectedFilePath] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [currentTab, setCurrentTab] = useState("preview"); // 'preview' | 'code'
  const [viewportMode, setViewportMode] = useState("desktop"); // 'desktop' | 'tablet' | 'mobile'
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState({ "src": true, "public": true });

  // Staging Deployment States
  const [vercelToken, setVercelToken] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStep, setDeployStep] = useState("");

  const fetchProjectDetails = async () => {
    try {
      const res = await authFetch(`/projects/${projectId}`);
      if (!res.ok) throw new Error("Failed to load project details");
      const payload = await res.json();
      setProject(payload?.data);

      // Fetch actual repository files from backend proxy
      await fetchLiveFiles();
    } catch (err) {
      console.error(err);
      toast.error("Error loading project sandbox configuration");
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveFiles = async () => {
    try {
      const res = await authFetch(`/github/repo/files/${projectId}`);
      if (!res.ok) throw new Error("Could not download repository source files");
      const data = await res.json();
      if (data?.files && Object.keys(data.files).length > 0) {
        setFiles(data.files);
        // Pre-select first file
        const firstFile = Object.keys(data.files)[0];
        setSelectedFilePath(firstFile);
        setFileContent(data.files[firstFile]);
      }
    } catch (err) {
      console.warn("Failed fetching live files from repository. Using fallback templates.", err);
      // Fallback sample files
      const fallbacks = {
        "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sandbox Fallback</title>
</head>
<body style="background:#0f172a; color:#fff; text-align:center; padding-top:10%;">
  <h1>Workspace Sync Active</h1>
  <p>Commit code in the editor to see your files compile live here.</p>
</body>
</html>`
      };
      setFiles(fallbacks);
      setSelectedFilePath("index.html");
      setFileContent(fallbacks["index.html"]);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId]);

  const handleFileSelect = (path) => {
    setSelectedFilePath(path);
    setFileContent(files[path] || "");
    setCurrentTab("code");
  };

  const toggleFolder = (folderName) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderName]: !prev[folderName],
    }));
  };

  const handleDeployToVercel = async () => {
    setIsDeploying(true);
    setDeployStep("Connecting to Vercel secure container...");
    
    try {
      // Step simulation for visual excellence
      setTimeout(() => setDeployStep("Registering repository git references..."), 1500);
      setTimeout(() => setDeployStep("Provisioning SSL certificates..."), 3000);
      setTimeout(() => setDeployStep("Building source bundle and deploying..."), 4500);

      const res = await authFetch("/github/repo/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          vercelToken: vercelToken.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Deployment failed");

      // Success
      toast.success("Zero-Config Staging Server Deployed to Vercel! 🚀");
      setProject((prev) => ({ ...prev, stagingUrl: data.url }));
    } catch (err) {
      console.error(err);
      toast.error(`Deployment failed: ${err.message}`);
    } finally {
      setIsDeploying(false);
      setDeployStep("");
    }
  };

  const handleRefreshStaging = () => {
    setIsRebuilding(true);
    toast.loading("Reloading sandbox staging previews...");
    fetchLiveFiles().then(() => {
      setIsRebuilding(false);
      toast.dismiss();
      toast.success("Sandbox previews synchronized!");
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-white p-8 space-y-6">
        <Skeleton className="h-10 w-48 bg-white/5" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Skeleton className="h-[500px] bg-white/5 lg:col-span-1" />
          <Skeleton className="h-[500px] bg-white/5 lg:col-span-3" />
        </div>
      </div>
    );
  }

  // Group files into standard nested tree structure
  const fileTree = {};
  Object.keys(files).forEach((path) => {
    const parts = path.split("/");
    if (parts.length === 1) {
      fileTree[path] = { type: "file", name: path };
    } else {
      const folderName = parts[0];
      if (!fileTree[folderName]) {
        fileTree[folderName] = { type: "folder", name: folderName, children: [] };
      }
      fileTree[folderName].children.push(path);
    }
  });

  const isDeployed = !!project?.stagingUrl;
  const techStack = detectTechStack(files);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header className="h-14 shrink-0 bg-[#121824] border-b border-white/[0.08] px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/client/project/${projectId}`)}
            className="h-8 gap-1.5 border border-white/[0.08] bg-white/[0.03] text-xs text-white/70 hover:bg-white/[0.06] hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Project
          </Button>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{project?.title || "Staging Sandbox"}</span>
            <Badge className={`border text-[10px] ${isDeployed ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"}`}>
              <span className={`h-1.5 w-1.5 rounded-full mr-1 ${isDeployed ? "bg-emerald-400 animate-pulse" : "bg-yellow-400"}`} />
              {isDeployed ? "Live Preview Sandbox Active" : "Staging Server Offline"}
            </Badge>

            {/* Glowing Tech Stack Badges */}
            {techStack.map((tech) => (
              <Badge
                key={tech}
                variant="outline"
                className="border-primary/20 bg-primary/5 text-primary text-[9px] uppercase px-2 py-0.5 tracking-wider font-semibold"
              >
                {tech}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => project?.externalLink && window.open(project.externalLink, "_blank")}
            className="h-8 gap-1.5 border-white/[0.08] bg-white/[0.03] text-xs text-white/80 hover:bg-white/[0.06] hover:text-white"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Repository
          </Button>

          <Button
            size="sm"
            onClick={() => navigate(`/client/project/${projectId}`)}
            className="h-8 gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approve Milestone
          </Button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: File Explorer */}
        <aside className="w-64 shrink-0 bg-[#0f1420] border-r border-white/[0.08] flex flex-col">
          <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-white/40">File Explorer</span>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded font-mono">main</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {Object.keys(files).length === 0 ? (
              <p className="text-xs text-white/20 p-2 italic text-center">Loading code index...</p>
            ) : (
              Object.values(fileTree).map((item) => {
                if (item.type === "file") {
                  const isActive = selectedFilePath === item.name;
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleFileSelect(item.name)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "text-white/70 hover:bg-white/[0.04]"
                      }`}
                    >
                      <File className="h-3.5 w-3.5 opacity-60" />
                      <span className="truncate">{item.name}</span>
                    </button>
                  );
                }

                // Folder structure
                const isExpanded = expandedFolders[item.name];
                return (
                  <div key={item.name} className="space-y-1">
                    <button
                      onClick={() => toggleFolder(item.name)}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-white/60 hover:bg-white/[0.04] text-left transition-colors"
                    >
                      <ChevronRight
                        className={`h-3 w-3 shrink-0 opacity-55 transition-transform duration-200 ${
                          isExpanded ? "rotate-90" : ""
                        }`}
                      />
                      {isExpanded ? (
                        <FolderOpen className="h-3.5 w-3.5 text-yellow-500/80" />
                      ) : (
                        <Folder className="h-3.5 w-3.5 text-yellow-500/80" />
                      )}
                      <span className="font-semibold text-white/80">{item.name}</span>
                    </button>

                    {isExpanded && (
                      <div className="pl-4 space-y-1">
                        {item.children.map((childPath) => {
                          const childName = childPath.split("/").pop();
                          const isActive = selectedFilePath === childPath;
                          return (
                            <button
                              key={childPath}
                              onClick={() => handleFileSelect(childPath)}
                              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors ${
                                isActive
                                  ? "bg-primary text-primary-foreground font-semibold"
                                  : "text-white/70 hover:bg-white/[0.04]"
                              }`}
                            >
                              <File className="h-3.5 w-3.5 opacity-60" />
                              <span className="truncate">{childName}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Main panel: Tabs & Sandbox Viewport */}
        <main className="flex-1 flex flex-col bg-[#0b0f19] overflow-hidden">
          {/* Top Panel Controls */}
          <div className="h-12 bg-[#0e121d] border-b border-white/[0.06] px-6 flex items-center justify-between shrink-0">
            {/* View switcher Tabs */}
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant={currentTab === "preview" ? "default" : "ghost"}
                onClick={() => setCurrentTab("preview")}
                className="h-8 text-xs gap-1.5"
              >
                <Eye className="h-3.5 w-3.5" />
                Live Preview
              </Button>
              <Button
                size="sm"
                variant={currentTab === "code" ? "default" : "ghost"}
                onClick={() => setCurrentTab("code")}
                className="h-8 text-xs gap-1.5"
              >
                <Code2 className="h-3.5 w-3.5" />
                Inspect Code
              </Button>
            </div>

            {/* Viewport controls (Only for preview tab) */}
            {currentTab === "preview" && isDeployed && (
              <div className="flex items-center gap-4">
                {/* Viewport buttons */}
                <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-lg p-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewportMode("desktop")}
                    className={`h-7 px-2.5 text-xs gap-1 ${viewportMode === "desktop" ? "bg-white/[0.08] text-white" : "text-white/40 hover:text-white/70"}`}
                  >
                    <Laptop className="h-3.5 w-3.5" />
                    Desktop
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewportMode("tablet")}
                    className={`h-7 px-2.5 text-xs gap-1 ${viewportMode === "tablet" ? "bg-white/[0.08] text-white" : "text-white/40 hover:text-white/70"}`}
                  >
                    <Tablet className="h-3.5 w-3.5" />
                    Tablet
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewportMode("mobile")}
                    className={`h-7 px-2.5 text-xs gap-1 ${viewportMode === "mobile" ? "bg-white/[0.08] text-white" : "text-white/40 hover:text-white/70"}`}
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    Mobile
                  </Button>
                </div>

                <div className="h-4 w-px bg-white/10" />

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRefreshStaging}
                  disabled={isRebuilding}
                  className="h-8 border border-white/[0.08] bg-white/[0.03] text-xs text-white/70 hover:bg-white/[0.06]"
                >
                  <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isRebuilding ? "animate-spin" : ""}`} />
                  Sync files
                </Button>
              </div>
            )}
          </div>

          {/* Viewport Frame Container */}
          <div className="flex-1 p-6 flex items-center justify-center overflow-auto bg-[#070911] relative">
            {currentTab === "preview" ? (
              isDeployed ? (
                <div
                  className={`transition-all duration-300 bg-slate-900 border border-white/[0.12] rounded-xl overflow-hidden shadow-2xl flex flex-col ${
                    viewportMode === "desktop"
                      ? "w-full h-full max-w-5xl"
                      : viewportMode === "tablet"
                        ? "w-[768px] h-[550px]"
                        : "w-[375px] h-[600px]"
                  }`}
                >
                  {/* Browser Top Bar simulator */}
                  <div className="h-7 bg-[#161b26] border-b border-white/[0.06] flex items-center px-4 justify-between select-none">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                    </div>
                    <div className="bg-[#0b0f19] px-4 py-0.5 rounded text-[10px] text-white/30 truncate max-w-[400px]">
                      {project?.stagingUrl}
                    </div>
                    <div className="w-10" />
                  </div>

                  {/* Staging Content View */}
                  <div className="flex-1 relative bg-slate-900">
                    <iframe
                      title="Staging Sandbox Preview Frame"
                      src={project.stagingUrl}
                      className="w-full h-full border-0 bg-white"
                      sandbox="allow-scripts allow-same-origin allow-forms"
                    />
                  </div>
                </div>
              ) : (
                /* Connect Deploy Platform widget */
                <Card className="w-full max-w-lg border-white/[0.08] bg-[#0f1420] text-white shadow-2xl">
                  <CardContent className="pt-6 space-y-6">
                    <div className="text-center space-y-2">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Server className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-bold text-white">Staging Preview Container Setup</h3>
                      <p className="text-xs text-white/50 leading-relaxed max-w-sm mx-auto">
                        Connect this project with Vercel or Netlify. Every code change the AI makes will automatically deploy live.
                      </p>
                    </div>

                    <div className="border border-white/[0.06] rounded-xl bg-white/[0.02] p-4 space-y-4">
                      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                        <span className="text-xs font-semibold">Deployment Provider</span>
                        <Badge className="bg-white/10 text-white/70 hover:bg-white/20 border-white/5">Vercel</Badge>
                      </div>

                      {isDeploying ? (
                        <div className="py-6 flex flex-col items-center justify-center gap-3">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          <p className="text-xs text-white/60 animate-pulse">{deployStep}</p>
                        </div>
                      ) : (
                        <div className="space-y-3 text-left">
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-white/30 tracking-wider flex items-center gap-1">
                              <Lock className="h-2.5 w-2.5" /> Vercel Access Token
                            </label>
                            <Input
                              type="password"
                              value={vercelToken}
                              onChange={(e) => setVercelToken(e.target.value)}
                              placeholder="Optional (falls back to Catalance server deployment)"
                              className="h-9 border-white/[0.08] bg-white/[0.04] text-xs text-white placeholder:text-white/20"
                            />
                            <p className="text-[9px] text-white/30 leading-normal">
                              Create a token in Vercel Settings &gt; Tokens, or leave blank to trigger standard preview templates.
                            </p>
                          </div>

                          <Button
                            onClick={handleDeployToVercel}
                            disabled={isDeploying}
                            className="w-full h-9 text-xs font-semibold mt-2"
                          >
                            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                            1-Click Staging Deploy
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            ) : (
              // Read-only Code Inspector panel
              <div className="w-full h-full max-w-5xl bg-[#0f1420] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl flex flex-col">
                <div className="h-9 bg-[#121825] px-4 flex items-center justify-between border-b border-white/[0.06] select-none">
                  <span className="text-xs font-mono text-white/60">{selectedFilePath}</span>
                  <Badge variant="outline" className="border-white/10 text-white/30 text-[9px] uppercase">
                    Read-Only
                  </Badge>
                </div>
                <div className="flex-1 p-5 overflow-auto font-mono text-xs text-left leading-relaxed text-emerald-400/90 bg-[#0b0f19]">
                  <pre className="whitespace-pre-wrap">{fileContent || "// Select a file to inspect code content"}</pre>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ClientStagingPage;
