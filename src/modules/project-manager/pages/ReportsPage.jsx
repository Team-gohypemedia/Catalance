import { useEffect, useMemo, useState } from "react";
import Send from "lucide-react/dist/esm/icons/send";
import { toast } from "sonner";
import Loader from "@/components/common/Loader";
import { useAuth } from "@/shared/context/AuthContext";
import { PmShell } from "@/modules/project-manager/components/PmShell";
import { pmApi } from "@/modules/project-manager/services/pm-api";
import { useAsyncResource } from "@/modules/project-manager/hooks/use-async-resource";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const REPORT_CATEGORIES = [
  "Freelancer misconduct",
  "Client disputes",
  "Project delays",
  "Communication problems",
];
const REPORT_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const ReportsPage = () => {
  const { authFetch } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    projectId: "",
    category: REPORT_CATEGORIES[0],
    severity: "MEDIUM",
    title: "",
    description: "",
  });

  const reports = useAsyncResource(() => pmApi.listReports(authFetch), [authFetch]);
  const projects = useAsyncResource(() => pmApi.getProjects(authFetch), [authFetch]);
  const projectRows = useMemo(
    () => (Array.isArray(projects.data) ? projects.data : []),
    [projects.data]
  );

  useEffect(() => {
    if (!projectRows.length) return;
    setForm((current) => (current.projectId ? current : { ...current, projectId: projectRows[0].id }));
  }, [projectRows]);

  const submitReport = async () => {
    if (submitting) return;
    if (!form.projectId || !form.description.trim()) {
      toast.error("Project and description are required.");
      return;
    }

    setSubmitting(true);
    try {
      await pmApi.createReport(authFetch, {
        projectId: form.projectId,
        category: form.category,
        severity: form.severity,
        title: form.title.trim(),
        description: form.description.trim(),
      });
      await reports.refresh();
      setForm((current) => ({
        ...current,
        title: "",
        description: "",
      }));
      toast.success("Incident report submitted.");
    } catch (error) {
      toast.error(error?.message || "Unable to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PmShell
      title="Incident Reports"
      subtitle="Report disputes, misconduct, delays, and communication issues to admin."
    >
      <div className="grid gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Create New Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {projects.loading && !projectRows.length ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader size="sm" />
                Loading project list...
              </div>
            ) : projectRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No assigned projects available to report.</p>
            ) : (
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Project</p>
                    <select
                      value={form.projectId}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, projectId: event.target.value }))
                      }
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
                    >
                      {projectRows.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Category</p>
                    <select
                      value={form.category}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, category: event.target.value }))
                      }
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
                    >
                      {REPORT_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Severity</p>
                    <select
                      value={form.severity}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, severity: event.target.value }))
                      }
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
                    >
                      {REPORT_SEVERITIES.map((severity) => (
                        <option key={severity} value={severity}>
                          {severity}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Title (Optional)</p>
                    <Input
                      value={form.title}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, title: event.target.value }))
                      }
                      className="h-10"
                      placeholder="Incident summary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Description</p>
                  <Textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, description: event.target.value }))
                    }
                    className="min-h-28"
                    placeholder="Describe the issue with full context for admin review."
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={submitReport}
                    disabled={submitting || !form.projectId || !form.description.trim()}
                    className="h-10 rounded-lg bg-blue-600 px-4 text-xs font-black uppercase tracking-wider text-white hover:bg-blue-700"
                  >
                    {submitting ? <Loader size="sm" /> : <Send className="h-4 w-4" />}
                    <span className="ml-2">Submit Report</span>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Reports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {reports.loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader size="sm" />
                Loading reports...
              </div>
            ) : (Array.isArray(reports.data) ? reports.data : []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No reports yet.</p>
            ) : (
              (Array.isArray(reports.data) ? reports.data : []).map((report) => (
                <div key={report.id} className="rounded border border-border/70 bg-muted/20 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{report.reason || report.title}</p>
                    <Badge variant="outline">
                      {report.status === "OPEN"
                        ? "In Review"
                        : report.status === "RESOLVED"
                          ? "Resolved"
                          : "Escalated"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{report?.project?.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {report.createdAt ? new Date(report.createdAt).toLocaleString() : ""}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </PmShell>
  );
};

export default ReportsPage;
