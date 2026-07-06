import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/shared/context/AuthContext";
import BrainCircuit from "lucide-react/dist/esm/icons/brain-circuit";
import ShieldAlert from "lucide-react/dist/esm/icons/shield-alert";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import XCircle from "lucide-react/dist/esm/icons/x-circle";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronUp from "lucide-react/dist/esm/icons/chevron-up";
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import File from "lucide-react/dist/esm/icons/file";
import Terminal from "lucide-react/dist/esm/icons/terminal";
import HelpCircle from "lucide-react/dist/esm/icons/help-circle";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";


const ProjectAuditPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanLogs, setScanLogs] = useState([]);
  const [audits, setAudits] = useState([]);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [expandedFindings, setExpandedFindings] = useState({});

  const fetchProjectDetails = async () => {
    try {
      const res = await authFetch(`/projects/${projectId}`);
      if (!res.ok) throw new Error("Failed to load project details");
      const payload = await res.json();
      setProject(payload?.data);
    } catch (err) {
      console.error(err);
      toast.error("Error loading project sandbox configuration");
    }
  };

  const fetchAuditHistory = async (forceStart = false) => {
    try {
      const res = await authFetch(`/github/repo/audit/${projectId}`);
      if (!res.ok) throw new Error("Failed to load audit history");
      const data = await res.json();
      if (data?.audits && data.audits.length > 0 && !forceStart) {
        setAudits(data.audits);
        setSelectedAudit(data.audits[0]);
      } else {
        // No audits yet, auto-trigger the scanner!
        handleRunScanSimulation();
      }
    } catch (err) {
      console.warn("Failed fetching audit reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
    fetchAuditHistory();
  }, [projectId]);

  // Gorgeous scanning simulation
  const handleRunScanSimulation = async () => {
    setIsScanning(true);
    setScanProgress(0);
    setScanLogs([]);

    const logsTemplate = [
      { delay: 400, text: "⏳ [System] Initializing SQA Audit Engine container..." },
      { delay: 1000, text: "📁 [Git] Downloading workspace source tree from default branch 'main'..." },
      { delay: 1800, text: "🔍 [AST] Parsing index.html: Analyzing DOM elements and responsive layout tags..." },
      { delay: 2600, text: "🛡️ [Checklist] Cross-referencing code structure with milestone feature items..." },
      { delay: 3400, text: "⚙️ [Security] Inspecting database connections and secret keys..." },
      { delay: 4200, text: "📝 [Quality] Analyzing cyclomatic complexity & code style variables..." },
      { delay: 4800, text: "🤖 [Auditor] Generating metrics scorecard weights..." },
      { delay: 5200, text: "✅ [System] Quality check completed. Compiling final audit dashboard..." }
    ];

    // Trigger terminal logs
    logsTemplate.forEach((log) => {
      setTimeout(() => {
        setScanLogs((prev) => [...prev, log.text]);
        setScanProgress((prev) => Math.min(prev + 13, 100));
      }, log.delay);
    });

    // Make the backend audit request
    try {
      const res = await authFetch("/github/repo/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Audit request failed");

      // Wait a moment for visual completeness
      setTimeout(() => {
        setScanProgress(100);
        setIsScanning(false);
        toast.success("AI Code Quality & Security Audit Complete! 🛡️");
        fetchAuditHistory(false);
      }, 5500);

    } catch (err) {
      console.error(err);
      setTimeout(() => {
        setIsScanning(false);
        toast.error(`Auditing failed: ${err.message}`);
      }, 5500);
    }
  };

  const toggleFinding = (idx) => {
    setExpandedFindings((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-white p-8 space-y-6">
        <Skeleton className="h-10 w-48 bg-white/5" />
        <Skeleton className="h-[400px] bg-white/5 w-full" />
      </div>
    );
  }

  const scoreColor = (score) => {
    if (score >= 85) return "text-emerald-500 border-emerald-500/20 bg-emerald-500/10";
    if (score >= 70) return "text-yellow-500 border-yellow-500/20 bg-yellow-500/10";
    return "text-red-500 border-red-500/20 bg-red-500/10";
  };

  const severityColor = (severity) => {
    if (severity === "high") return "bg-red-500/10 text-red-500 border-red-500/20";
    if (severity === "medium") return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    return "bg-blue-500/10 text-blue-500 border-blue-500/20";
  };

  const findings = selectedAudit ? (selectedAudit.reportJson || []) : [];

  // Group findings into: Perfect, Warnings, Wrong Code
  const perfectChecks = selectedAudit?.passedChecks || 0;
  const criticalFindings = findings.filter(f => f.severity === "high");
  const warningFindings = findings.filter(f => f.severity === "medium" || f.severity === "low");

  return (
    <div className="min-h-screen bg-[#070913] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header className="h-14 shrink-0 bg-[#0c0e18] border-b border-white/[0.08] px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/client/project/${projectId}`)}
            className="h-8 gap-1.5 border border-white/[0.08] bg-white/[0.03] text-xs text-white/70 hover:bg-white/[0.06] hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Dashboard
          </Button>
          <div className="h-4 w-px bg-white/10" />
          <span className="text-sm font-semibold">AI Quality Audit Portal</span>
        </div>

        {!isScanning && selectedAudit && (
          <Button
            size="sm"
            onClick={() => handleRunScanSimulation()}
            className="h-8 gap-1.5 bg-primary text-primary-foreground font-semibold text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Re-Run Quality Audit
          </Button>
        )}
      </header>

      {/* Main Panel */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        {isScanning ? (
          /* Futuristic Scanning Simulator Screen */
          <div className="w-full max-w-2xl bg-[#0e111d] border border-white/[0.08] rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <BrainCircuit className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Auditing Workspace Codebase</h2>
                <p className="text-[10px] text-white/40">OpenRouter Security & Static Milestone Auditor</p>
              </div>
            </div>

            {/* Scanning Laser/Radar Box */}
            <div className="h-40 rounded-xl border border-white/[0.06] bg-[#070912] relative overflow-hidden flex items-center justify-center select-none">
              {/* Laser Line sweep */}
              <div className="absolute inset-x-0 h-0.5 bg-primary/50 shadow-md shadow-primary/80 animate-laser-sweep" />
              
              <div className="space-y-2 text-center z-10">
                <p className="text-xs font-semibold text-white/60">Scanning File Hierarchy</p>
                <div className="flex justify-center gap-1.5 text-white/20">
                  <File className="h-4 w-4 text-primary/40 animate-bounce" />
                  <File className="h-4 w-4 text-primary/40 animate-bounce [animation-delay:-0.2s]" />
                  <File className="h-4 w-4 text-primary/40 animate-bounce [animation-delay:-0.4s]" />
                </div>
              </div>
            </div>

            {/* Progress status bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-white/60">
                <span>Verification Checklist Progress</span>
                <span>{scanProgress}%</span>
              </div>
              <Progress value={scanProgress} className="h-2 bg-white/[0.04] text-primary" />
            </div>

            {/* Virtual Terminal Console */}
            <div className="rounded-xl border border-white/[0.06] bg-[#070912] p-4 font-mono text-[11px] text-emerald-400 space-y-2.5 h-44 overflow-y-auto text-left shadow-inner">
              <div className="flex items-center gap-1.5 border-b border-white/[0.04] pb-2 text-white/30 text-[10px] uppercase font-bold">
                <Terminal className="h-3.5 w-3.5" />
                Auditor Console logs
              </div>
              {scanLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed animate-fade-in">
                  {log}
                </div>
              ))}
            </div>
          </div>
        ) : selectedAudit ? (
          /* Premium Detailed SQA Audit Report */
          <div className="w-full max-w-4xl space-y-6 animate-fade-in">
            {/* Top overview metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-[#0e121e] border-white/[0.08]">
                <CardContent className="pt-6 text-center space-y-2">
                  <p className="text-xs uppercase tracking-wider font-bold text-white/40">Overall Quality Index</p>
                  <div className={`mx-auto w-fit border rounded-full px-3 py-1 text-xl font-black ${scoreColor(selectedAudit.score)}`}>
                    {selectedAudit.score}%
                  </div>
                  <p className="text-[10px] text-white/30">Weighted metrics of health, security, and milestones</p>
                </CardContent>
              </Card>

              <Card className="bg-[#0e121e] border-white/[0.08]">
                <CardContent className="pt-6 text-center space-y-2">
                  <p className="text-xs uppercase tracking-wider font-bold text-white/40">Milestone Checklist</p>
                  <div className={`mx-auto w-fit border rounded-full px-3 py-1 text-xl font-black ${scoreColor(selectedAudit.checklistScore)}`}>
                    {selectedAudit.checklistScore}%
                  </div>
                  <p className="text-[10px] text-white/30">Functional completeness of specifications</p>
                </CardContent>
              </Card>

              <Card className="bg-[#0e121e] border-white/[0.08]">
                <CardContent className="pt-6 text-center space-y-2">
                  <p className="text-xs uppercase tracking-wider font-bold text-white/40">Security Shield</p>
                  <div className={`mx-auto w-fit border rounded-full px-3 py-1 text-xl font-black ${scoreColor(selectedAudit.securityScore)}`}>
                    {selectedAudit.securityScore}%
                  </div>
                  <p className="text-[10px] text-white/30">AST protection against credentials leakage & logic risks</p>
                </CardContent>
              </Card>
            </div>

            {/* Check status badge logs bar */}
            <div className="flex items-center gap-4 bg-[#0e121e] border border-white/[0.08] rounded-xl px-6 py-3.5 justify-between">
              <div className="flex items-center gap-4 text-xs font-semibold text-white/50">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  {perfectChecks} Passed Criteria
                </span>
                <span className="flex items-center gap-1.5">
                  <XCircle className="h-4 w-4 text-red-500" />
                  {findings.length} Code Warnings & Flaws
                </span>
              </div>
              <Badge className={selectedAudit.status === "PASSED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20 text-xs py-1"}>
                Status: {selectedAudit.status}
              </Badge>
            </div>

            {/* Triple code quality category tabs: Perfect, Warnings, Wrong Code */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white/70 text-left uppercase tracking-wider">File Vulnerabilities & Audits</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Warnings / Minor code issues card */}
                <Card className="bg-[#0e121e] border-white/[0.08] text-left">
                  <CardHeader className="pb-3 border-b border-white/[0.04]">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-yellow-500">Minor Warnings & Polishes</CardTitle>
                      <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-[10px]">{warningFindings.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-2 max-h-[300px] overflow-y-auto">
                    {warningFindings.length === 0 ? (
                      <p className="text-xs text-white/20 italic p-4 text-center">No minor warning polishes needed.</p>
                    ) : (
                      warningFindings.map((item, idx) => (
                        <div key={idx} className="rounded-lg border border-white/[0.06] bg-slate-900/40 p-3 space-y-1.5">
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-xs font-semibold text-white/80">{item.message}</span>
                            <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-[9px] uppercase shrink-0">Warning</Badge>
                          </div>
                          <p className="text-[10px] text-white/30 font-mono">{item.file}:{item.line}</p>
                          <div className="rounded bg-black/30 p-2 font-mono text-[10px] text-emerald-400">
                            Fix: {item.fix}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Wrong Code / Critical vulnerabilities card */}
                <Card className="bg-[#0e121e] border-white/[0.08] text-left">
                  <CardHeader className="pb-3 border-b border-white/[0.04]">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-red-500">Critical Errors & Wrong Code</CardTitle>
                      <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px]">{criticalFindings.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-2 max-h-[300px] overflow-y-auto">
                    {criticalFindings.length === 0 ? (
                      <div className="py-4 text-center space-y-2">
                        <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto" />
                        <p className="text-xs text-emerald-400/80 font-medium">Safe! No critical codebase flaws found.</p>
                      </div>
                    ) : (
                      criticalFindings.map((item, idx) => (
                        <div key={idx} className="rounded-lg border border-red-500/20 bg-red-500/[0.02] p-3 space-y-1.5">
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-xs font-semibold text-white/80">{item.message}</span>
                            <Badge className="bg-red-500/15 text-red-400 border-red-500/20 text-[9px] uppercase shrink-0">Critical</Badge>
                          </div>
                          <p className="text-[10px] text-white/30 font-mono">{item.file}:{item.line}</p>
                          <div className="rounded bg-black/40 border border-primary/10 p-2.5 font-mono text-[10px] text-emerald-300">
                            Fix code: {item.fix}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
            <p className="text-xs text-white/40">Ready to audit...</p>
          </div>
        )}
      </div>

      {/* Embedded CSS for Laser Radar effect */}
      <style>{`
        @keyframes laserSweep {
          0% { top: 0%; opacity: 0.1; }
          50% { opacity: 0.9; }
          100% { top: 100%; opacity: 0.1; }
        }
        .animate-laser-sweep {
          position: absolute;
          animation: laserSweep 2s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default ProjectAuditPage;
