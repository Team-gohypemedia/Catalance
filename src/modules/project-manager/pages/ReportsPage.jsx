import { useState } from "react";
import { toast } from "sonner";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import { useAuth } from "@/shared/context/AuthContext";
import { PmShell } from "@/modules/project-manager/components/PmShell";
import { pmApi } from "@/modules/project-manager/services/pm-api";
import { useAsyncResource } from "@/modules/project-manager/hooks/use-async-resource";
import { REPORT_CATEGORIES, REPORT_SEVERITIES } from "@/modules/project-manager/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const ReportsPage = () => {
  const { authFetch } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    category: REPORT_CATEGORIES[0],
    projectId: "",
    title: "",
    severity: "MEDIUM",
    description: "",
    attachments: "",
  });

  const reports = useAsyncResource(() => pmApi.listReports(authFetch), [authFetch]);
  const projects = useAsyncResource(() => pmApi.getProjects(authFetch), [authFetch]);

  const submitReport = async () => {
    if (!form.projectId || !form.description.trim()) {
      toast.error("Project and description are required");
      return;
    }
    setSubmitting(true);
    try {
      await pmApi.createReport(authFetch, {
        category: form.category,
        projectId: form.projectId,
        title: form.title.trim() || form.category,
        severity: form.severity,
        description: form.description.trim(),
        attachments: form.attachments
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
          .map((url) => ({ url })),
      });
      toast.success("Report submitted");
      setForm((prev) => ({ ...prev, title: "", description: "", attachments: "" }));
      await reports.refresh();
    } catch (error) {
      toast.error(error.message || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PmShell
      title="Incident Reports"
      subtitle="Report disputes, misconduct, delays, and communication issues to admin."
    >
      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Create Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 md:grid-cols-2">
              <Select
                value={form.category}
                onValueChange={(value) => setForm((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={form.projectId}
                onValueChange={(value) => setForm((prev) => ({ ...prev, projectId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  {(Array.isArray(projects.data) ? projects.data : []).map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <Input
                placeholder="Issue title"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              />
              <Select
                value={form.severity}
                onValueChange={(value) => setForm((prev) => ({ ...prev, severity: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_SEVERITIES.map((severity) => (
                    <SelectItem key={severity} value={severity}>
                      {severity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Textarea
              placeholder="Describe the issue"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            />
            <Input
              placeholder="Attachment URLs (comma separated)"
              value={form.attachments}
              onChange={(event) => setForm((prev) => ({ ...prev, attachments: event.target.value }))}
            />
            <Button onClick={submitReport} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Reports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {reports.loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
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

