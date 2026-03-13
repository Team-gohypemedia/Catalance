import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import { useAuth } from "@/shared/context/AuthContext";
import { PmShell } from "@/modules/project-manager/components/PmShell";
import { pmApi } from "@/modules/project-manager/services/pm-api";
import { useAsyncResource } from "@/modules/project-manager/hooks/use-async-resource";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ReportsPage = () => {
  const { authFetch } = useAuth();
  const reports = useAsyncResource(() => pmApi.listReports(authFetch), [authFetch]);

  return (
    <PmShell
      title="Incident Reports"
      subtitle="Report disputes, misconduct, delays, and communication issues to admin."
    >
      <div className="grid gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Reports</CardTitle>
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
