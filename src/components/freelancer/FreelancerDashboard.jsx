import React, { useEffect, useMemo, useState } from "react";
import { Briefcase, Clock, Sparkles, Banknote, AlertTriangle, User } from "lucide-react";
import { RoleAwareSidebar } from "@/components/dashboard/RoleAwareSidebar";
import { getSession } from "@/lib/auth-storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FreelancerTopBar } from "@/components/freelancer/FreelancerTopBar";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { SuspensionAlert } from "@/components/ui/suspension-alert";

// No static template data - all metrics loaded from API

export const DashboardContent = ({ roleOverride }) => {
  const [sessionUser, setSessionUser] = useState(null);
  const { authFetch } = useAuth();
  const [metrics, setMetrics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuspensionAlert, setShowSuspensionAlert] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const session = getSession();
    setSessionUser(session?.user ?? null);
    
    // Show suspension alert if user is suspended
    if (session?.user?.status === "SUSPENDED") {
      setShowSuspensionAlert(true);
    }
  }, []);

  const effectiveRole = roleOverride ?? sessionUser?.role ?? "FREELANCER";

  const roleLabel = useMemo(() => {
    const baseRole = effectiveRole;
    const normalized = baseRole.toLowerCase();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }, [effectiveRole]);

  const dashboardLabel = sessionUser?.fullName?.trim()
    ? `${sessionUser.fullName.trim()}'s dashboard`
    : `${roleLabel} dashboard`;

  useEffect(() => {
    const loadMetrics = async () => {
      if (!authFetch) return;
      setIsLoading(true);
      try {
        const response = await authFetch("/proposals?as=freelancer");
        const payload = await response.json().catch(() => null);
        const list = Array.isArray(payload?.data) ? payload.data : [];

        const pending = list.filter(
          (p) => (p.status || "").toUpperCase() === "PENDING"
        );
        const accepted = list.filter(
          (p) => (p.status || "").toUpperCase() === "ACCEPTED"
        );
        const activeProjects = accepted.length;
        const proposalsReceived = pending.length;
        // Calculate earnings after 30% platform fee (freelancer receives 70%)
        const grossEarnings = accepted.reduce(
          (acc, p) => acc + (Number(p.amount) || 0),
          0
        );
        const earnings = Math.round(grossEarnings * 0.7);

        setMetrics([
          {
            label: "Active Projects",
            value: String(activeProjects),
            trend: `${pending.length} pending decisions`,
            icon: Briefcase,
          },
          {
            label: "Proposals Received",
            value: String(proposalsReceived),
            trend: `${pending.length} awaiting reply`,
            icon: Sparkles,
          },
          {
            label: "Accepted Proposals",
            value: String(accepted.length),
            trend: accepted.length ? "Keep momentum going" : "No wins yet",
            icon: Clock,
          },
          {
            label: "Total Earnings",
            value: earnings ? `₹${earnings.toLocaleString()}` : "₹0",
            trend: accepted.length ? "Based on accepted proposals" : "Close a deal to start earning",
            icon: Banknote,
          },
        ]);
      } catch (error) {
        console.error("Failed to load freelancer metrics", error);
        // Set empty metrics on error - no fallback to static data
        setMetrics([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadMetrics();
  }, [authFetch]);

  // Skeleton for metrics while loading
  const MetricSkeleton = () => (
    <Card className="border-dashed">
      <CardHeader className="flex-row items-center justify-between">
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-4 w-24" />
      </CardContent>
    </Card>
  );

  return (
    <>
      <div className="relative flex flex-col gap-6 p-6">
        <FreelancerTopBar label={dashboardLabel} />

        <Dialog open={sessionUser?.status === "PENDING_APPROVAL"}>
          <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20">
                <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <DialogTitle className="text-center">Account Under Review</DialogTitle>
              <DialogDescription className="text-center pt-2 space-y-2">
                <p>
                  Your account is currently being verified by the admin. Once verified, you will be able to access the dashboard and go live.
                </p>
                <p>
                  In the meantime, you can complete your profile to speed up the approval process.
                </p>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center">
              <Button onClick={() => navigate("/freelancer/profile")}>
                <User className="mr-2 h-4 w-4" />
                Complete Your Profile
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Suspension Alert */}
        <SuspensionAlert
          open={showSuspensionAlert}
          onOpenChange={setShowSuspensionAlert}
          suspendedAt={sessionUser?.suspendedAt}
        />

        <section className={`grid gap-4 md:grid-cols-4 ${sessionUser?.status === "PENDING_APPROVAL" ? "blur-sm pointer-events-none opacity-50" : ""}`}>
          {isLoading ? (
            [1, 2, 3, 4].map((i) => <MetricSkeleton key={i} />)
          ) : metrics.length > 0 ? (
            metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <Card key={metric.label} className="border-dashed">
                  <CardHeader className="flex-row items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Icon className="size-4 text-primary" />
                      {metric.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-3xl font-semibold">{metric.value}</p>
                    <p className="text-sm text-muted-foreground">
                      {metric.trend}
                    </p>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="col-span-4 border-dashed">
              <CardContent className="p-6 text-center text-muted-foreground">
                No data available. Start working on projects to see your metrics.
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </>
  );
};

const FreelancerDashboard = () => {
  return (
    <RoleAwareSidebar>
      <DashboardContent />
    </RoleAwareSidebar>
  );
};

export const ClientDashboard = () => {
  return (
    <RoleAwareSidebar>
      <DashboardContent roleOverride="CLIENT" />
    </RoleAwareSidebar>
  );
};

export default FreelancerDashboard;
