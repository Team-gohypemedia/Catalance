import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/shared/context/AuthContext";
import { toast } from "sonner";
import BrainCircuit from "lucide-react/dist/esm/icons/brain-circuit";
import ShieldAlert from "lucide-react/dist/esm/icons/shield-alert";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import XCircle from "lucide-react/dist/esm/icons/x-circle";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronUp from "lucide-react/dist/esm/icons/chevron-up";
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import format from "date-fns/format";

const AIQualityAuditCard = ({ projectId, panelClassName, eyebrowClassName, subheadingClassName, isFreelancer = false }) => {
  const { authFetch } = useAuth();
  
  const [audits, setAudits] = useState([]);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditStep, setAuditStep] = useState("");
  const [expandedFindings, setExpandedFindings] = useState({});

  const fetchAuditHistory = async () => {
    try {
      const res = await authFetch(`/github/repo/audit/${projectId}`);
      if (!res.ok) throw new Error("Failed to load audit history");
      const data = await res.json();
      if (data?.audits && data.audits.length > 0) {
        setAudits(data.audits);
        setSelectedAudit(data.audits[0]); // Select latest audit
      }
    } catch (err) {
      console.warn("Failed fetching audit reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditHistory();
  }, [projectId]);

  const handleTriggerAudit = async () => {
    setIsAuditing(true);
    setAuditStep("Downloading repository source contents...");

    // Step indicators simulation for high visual fidelity
    setTimeout(() => setAuditStep("Initiating functional checklist validation..."), 1500);
    setTimeout(() => setAuditStep("Executing security scanning & parsing AST..."), 3200);
    setTimeout(() => setAuditStep("Compiling audit weights & score aggregates..."), 4800);

    try {
      const res = await authFetch("/github/repo/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Audit request failed");

      toast.success("AI Code Quality & Security Audit Complete! 🛡️");
      await fetchAuditHistory();
    } catch (err) {
      console.error(err);
      toast.error(`Auditing failed: ${err.message}`);
    } finally {
      setIsAuditing(false);
      setAuditStep("");
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
      <Card className={panelClassName}>
        <CardContent className="py-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
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

  return (
    <Card className={panelClassName}>
      <CardHeader className="border-b border-border dark:border-white/[0.06] pb-3 pt-4 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-4.5 w-4.5 text-primary" />
              <CardTitle className={eyebrowClassName}>AI Quality & Security Audit</CardTitle>
            </div>
            <CardDescription className={subheadingClassName}>
              Objective third-party reviewer audits code security, syntax, and checklist completion
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {audits.length > 1 && (
              <select
                value={selectedAudit?.id || ""}
                onChange={(e) => {
                  const audit = audits.find((a) => a.id === e.target.value);
                  if (audit) setSelectedAudit(audit);
                }}
                className="h-8 rounded-lg border border-border dark:border-white/[0.12] bg-background text-[11px] px-2 text-foreground font-medium outline-none"
              >
                {audits.map((a) => (
                  <option key={a.id} value={a.id}>
                    Audit: {format(new Date(a.createdAt), "MMM d, h:mm a")}
                  </option>
                ))}
              </select>
            )}

            <Button
              size="sm"
              disabled={isAuditing}
              onClick={handleTriggerAudit}
              className="h-8 text-xs font-semibold"
            >
              {isAuditing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Auditing…
                </>
              ) : (
                <>
                  <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />
                  Run Quality Audit
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {isAuditing && (
          <div className="rounded-xl border border-primary/20 bg-primary/[0.02] p-6 text-center space-y-3">
            <Loader2 className="h-7 w-7 animate-spin text-primary mx-auto" />
            <p className="text-xs text-white/50 animate-pulse">{auditStep}</p>
          </div>
        )}

        {!isAuditing && !selectedAudit && (
          <div className="rounded-xl border border-dashed border-border dark:border-white/[0.08] p-8 text-center space-y-3">
            <BrainCircuit className="h-8 w-8 text-muted-foreground/60 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-foreground">No Audit Performed Yet</h4>
              <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                Trigger a Quality Audit to analyze the linked GitHub repository for security flaws, checklist progress, and syntax metrics.
              </p>
            </div>
            {isFreelancer && (
              <Button size="sm" onClick={handleTriggerAudit} className="h-8 text-xs font-semibold">
                Start Audit Verification
              </Button>
            )}
          </div>
        )}

        {!isAuditing && selectedAudit && (
          <div className="space-y-6">
            {/* Metric Score Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="rounded-xl bg-muted/30 dark:bg-white/[0.02] border border-border dark:border-white/[0.05] p-3 text-center space-y-1">
                <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">Code Health</p>
                <div className={`mx-auto w-fit border rounded-full px-2 py-0.5 text-xs font-bold ${scoreColor(selectedAudit.score)}`}>
                  {selectedAudit.score}%
                </div>
              </div>

              <div className="rounded-xl bg-muted/30 dark:bg-white/[0.02] border border-border dark:border-white/[0.05] p-3 text-center space-y-1">
                <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">Functional progress</p>
                <div className={`mx-auto w-fit border rounded-full px-2 py-0.5 text-xs font-bold ${scoreColor(selectedAudit.checklistScore)}`}>
                  {selectedAudit.checklistScore}%
                </div>
              </div>

              <div className="rounded-xl bg-muted/30 dark:bg-white/[0.02] border border-border dark:border-white/[0.05] p-3 text-center space-y-1">
                <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">Security Shield</p>
                <div className={`mx-auto w-fit border rounded-full px-2 py-0.5 text-xs font-bold ${scoreColor(selectedAudit.securityScore)}`}>
                  {selectedAudit.securityScore}%
                </div>
              </div>
            </div>

            {/* Check count overview */}
            <div className="flex items-center gap-4 bg-muted/20 dark:bg-white/[0.01] border border-border dark:border-white/[0.04] rounded-lg px-4 py-2.5 justify-between">
              <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  {selectedAudit.passedChecks} Passed Checks
                </span>
                <span className="flex items-center gap-1">
                  <XCircle className="h-3.5 w-3.5 text-red-500" />
                  {selectedAudit.failedChecks} Failed Warnings
                </span>
              </div>
              <Badge className={selectedAudit.status === "PASSED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}>
                {selectedAudit.status}
              </Badge>
            </div>

            {/* Findings list */}
            <div className="space-y-3 text-left">
              <h4 className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80">Audit Findings ({findings.length})</h4>
              
              {findings.length === 0 ? (
                <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-4 text-center text-xs text-emerald-400/90 flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-4.5 w-4.5" />
                  Absolute compliance! No issues or vulnerabilities identified.
                </div>
              ) : (
                <div className="space-y-2">
                  {findings.map((item, idx) => {
                    const isExpanded = expandedFindings[idx];
                    return (
                      <div
                        key={idx}
                        className="rounded-lg border border-border/80 dark:border-white/[0.06] bg-card overflow-hidden"
                      >
                        <button
                          onClick={() => toggleFinding(idx)}
                          className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30 text-left transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Badge className={`text-[9px] font-bold tracking-wider uppercase border ${severityColor(item.severity)}`}>
                              {item.severity}
                            </Badge>
                            <div>
                              <p className="text-xs font-semibold text-foreground">{item.message}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{item.file}:{item.line}</p>
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-white/30" /> : <ChevronDown className="h-4 w-4 text-white/30" />}
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4 pt-1.5 border-t border-border/40 dark:border-white/[0.04] bg-[#0c101a] space-y-2">
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Identified Impact</p>
                              <p className="text-xs text-white/70 leading-normal">{item.message}</p>
                            </div>
                            <div className="space-y-1.5 pt-1">
                              <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Recommended Resolution</p>
                              <div className="rounded border border-primary/10 bg-primary/[0.02] p-2.5 font-mono text-[11px] leading-relaxed text-emerald-300">
                                {item.fix}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIQualityAuditCard;
