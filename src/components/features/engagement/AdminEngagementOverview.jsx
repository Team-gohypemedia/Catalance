import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Activity from "lucide-react/dist/esm/icons/activity";
import Flame from "lucide-react/dist/esm/icons/flame";
import HelpCircle from "lucide-react/dist/esm/icons/help-circle";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Search from "lucide-react/dist/esm/icons/search";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Users from "lucide-react/dist/esm/icons/users";
import AdminLayout from "@/components/features/admin/AdminLayout";
import { AdminTopBar } from "@/components/features/admin/AdminTopBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/shared/context/AuthContext";
import { toast } from "sonner";

const MetricCard = ({ icon: Icon, title, value, description }) => (
  <Card className="border-white/10 bg-card">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      <Icon className="size-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-semibold text-white">{value}</div>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const AdminEngagementOverview = () => {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!authFetch) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());

      const [overviewRes, usersRes] = await Promise.all([
        authFetch("/admin/engagement/overview"),
        authFetch(`/admin/engagement/users?${params.toString()}`),
      ]);
      const overviewPayload = await overviewRes.json().catch(() => null);
      const usersPayload = await usersRes.json().catch(() => null);

      if (!overviewRes.ok) {
        throw new Error(
          overviewPayload?.message || "Failed to load engagement overview.",
        );
      }
      if (!usersRes.ok) {
        throw new Error(
          usersPayload?.message || "Failed to load freelancer progress.",
        );
      }

      setOverview(overviewPayload?.data || null);
      setUsers(Array.isArray(usersPayload?.data) ? usersPayload.data : []);
    } catch (error) {
      console.error("Failed to load admin engagement overview", error);
      toast.error(error?.message || "Failed to load engagement overview");
    } finally {
      setLoading(false);
    }
  }, [authFetch, search]);

  useEffect(() => {
    const timeoutId = window.setTimeout(loadData, 250);
    return () => window.clearTimeout(timeoutId);
  }, [loadData]);

  const metrics = [
    {
      title: "Profiles",
      value: overview?.totalProfiles || 0,
      description: "Freelancers with engagement records",
      icon: Users,
    },
    {
      title: "Completed Today",
      value: overview?.completedToday || 0,
      description: `UTC day ${overview?.dayKey || ""}`,
      icon: Sparkles,
    },
    {
      title: "7-Day Active",
      value: overview?.activeSevenDays || 0,
      description: "Freelancers who completed at least one quest",
      icon: Activity,
    },
    {
      title: "Average Streak",
      value: `${overview?.averageStreak || 0} days`,
      description: "Across engagement profiles",
      icon: Flame,
    },
  ];

  return (
    <AdminLayout>
      <div className="relative flex flex-col gap-6 p-6">
        <AdminTopBar label="Engagement" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Growth Quest
            </h1>
            <p className="mt-2 text-muted-foreground">
              Daily quest activity, streak health, and freelancer learning progress.
            </p>
          </div>
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={() => navigate("/admin/engagement/questions")}
          >
            <HelpCircle className="size-4" />
            Review Questions
          </Button>
        </div>

        {loading && !overview ? (
          <Card className="border-white/10 bg-card">
            <CardContent className="flex min-h-[240px] items-center justify-center">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
                Loading engagement data
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => (
                <MetricCard key={metric.title} {...metric} />
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <Card className="border-white/10 bg-card">
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="text-xl">
                      Freelancer Progress
                    </CardTitle>
                    <div className="relative w-full sm:w-72">
                      <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                      <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search freelancers..."
                        className="pl-8"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border border-white/10">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Freelancer</TableHead>
                          <TableHead>Level</TableHead>
                          <TableHead>Streak</TableHead>
                          <TableHead>XP</TableHead>
                          <TableHead>Coins</TableHead>
                          <TableHead>Weak Topic</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                              No engagement records yet.
                            </TableCell>
                          </TableRow>
                        ) : (
                          users.map((user) => (
                            <TableRow key={user.userId}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{user.fullName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {user.email}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {user.engagementLevelLabel}
                                </Badge>
                              </TableCell>
                              <TableCell>{user.currentStreak} days</TableCell>
                              <TableCell>{user.lifetimeXp}</TableCell>
                              <TableCell>{user.loyaltyCoins}</TableCell>
                              <TableCell>{user.weakTopic}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card className="h-fit border-white/10 bg-card">
                <CardHeader>
                  <CardTitle className="text-xl">Question Bank</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-[14px] border border-white/10 bg-white/[0.03] px-4 py-3">
                    <p className="text-sm text-muted-foreground">
                      Approved questions
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-white">
                      {overview?.approvedQuestions || 0}
                    </p>
                  </div>
                  <div className="rounded-[14px] border border-white/10 bg-white/[0.03] px-4 py-3">
                    <p className="text-sm text-muted-foreground">
                      Pending review
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-white">
                      {overview?.pendingQuestions || 0}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/admin/engagement/questions")}
                  >
                    Open Review Queue
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminEngagementOverview;
