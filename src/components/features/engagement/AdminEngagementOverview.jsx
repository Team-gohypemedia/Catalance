import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Activity from "lucide-react/dist/esm/icons/activity";
import Flame from "lucide-react/dist/esm/icons/flame";
import HelpCircle from "lucide-react/dist/esm/icons/help-circle";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Search from "lucide-react/dist/esm/icons/search";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Users from "lucide-react/dist/esm/icons/users";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
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
import { cn } from "@/shared/lib/utils";
import { toast } from "sonner";

const MetricCard = ({ icon: Icon, title, value, description, tone = "default" }) => (
  <Card className="group relative overflow-hidden border-white/10 bg-card transition-all hover:border-primary/30">
    <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent pointer-events-none" />
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-[0.65rem] font-black uppercase tracking-[0.15em] text-muted-foreground">
        {title}
      </CardTitle>
      <div className={cn(
        "flex size-8 items-center justify-center rounded-lg bg-white/[0.04] text-muted-foreground transition-colors group-hover:text-primary",
        tone === "primary" && "bg-primary/10 text-primary",
        tone === "emerald" && "bg-emerald-500/10 text-emerald-400"
      )}>
        <Icon className="size-4" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-black tracking-tight text-white">{value}</div>
      <p className="mt-1 text-[0.65rem] font-bold text-muted-foreground">{description}</p>
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
        throw new Error(overviewPayload?.message || "Failed to load engagement overview.");
      }
      if (!usersRes.ok) {
        throw new Error(usersPayload?.message || "Failed to load freelancer progress.");
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
      title: "Total Profiles",
      value: overview?.totalProfiles || 0,
      description: "Active engagement records",
      icon: Users,
    },
    {
      title: "Completed Today",
      value: overview?.completedToday || 0,
      description: `UTC Day ${overview?.dayKey || ""}`,
      icon: Sparkles,
      tone: "primary"
    },
    {
      title: "Weekly Active",
      value: overview?.activeSevenDays || 0,
      description: "Freelancers (Last 7 days)",
      icon: Activity,
    },
    {
      title: "Avg Streak",
      value: `${overview?.averageStreak || 0}d`,
      description: "Current consistency level",
      icon: Flame,
      tone: "emerald"
    },
  ];

  return (
    <AdminLayout>
      <div className="relative flex flex-col gap-8 p-6 lg:p-10">
        <AdminTopBar label="Growth Engine" />

        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[0.65rem] font-black uppercase tracking-wider text-primary">
              Management Dashboard
            </span>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white">Engagement Engine</h1>
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              Monitor Daily Growth Quest activity and manage the question ecosystem.
            </p>
          </div>
          <div className="flex gap-3">
                        <Button
              type="button"
              variant="outline"
              className="rounded-xl border-white/10 px-6 font-bold"
              onClick={() => navigate("/admin/engagement/questions")}
            >
              Manage Bank
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-primary/20 bg-primary/10 px-6 font-bold text-primary hover:bg-primary/20 hover:text-primary"
              onClick={() => navigate("/admin/engagement/contests")}
            >
              Manage Contests
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-primary px-6 font-black text-primary-foreground"
              onClick={() => navigate("/admin/engagement/questions")}
            >
              <HelpCircle className="size-4" />
              Review Queue
            </Button>
          </div>
        </div>

        {loading && !overview ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-muted-foreground">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm font-bold tracking-wide uppercase">Hydrating dashboard...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => (
                <MetricCard key={metric.title} {...metric} />
              ))}
            </div>

            <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
              <Card className="overflow-hidden border-white/10 bg-card">
                <CardHeader className="border-b border-white/[0.05] bg-white/[0.01] px-6 py-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-lg font-black text-white">Freelancer Progress</CardTitle>
                      <p className="text-xs font-medium text-muted-foreground">Global activity tracking</p>
                    </div>
                    <div className="relative w-full sm:w-72">
                      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search by name or email..."
                        className="h-10 rounded-xl border-white/10 bg-background/50 pl-10 text-sm focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-white/[0.02]">
                        <TableRow className="hover:bg-transparent border-white/[0.05]">
                          <TableHead className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-muted-foreground">Freelancer</TableHead>
                          <TableHead className="py-4 text-[0.65rem] font-black uppercase tracking-widest text-muted-foreground">Rank</TableHead>
                          <TableHead className="py-4 text-[0.65rem] font-black uppercase tracking-widest text-muted-foreground">Streak</TableHead>
                          <TableHead className="py-4 text-[0.65rem] font-black uppercase tracking-widest text-muted-foreground">XP</TableHead>
                          <TableHead className="py-4 text-[0.65rem] font-black uppercase tracking-widest text-muted-foreground">Coins</TableHead>
                          <TableHead className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-muted-foreground">Focus Area</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="h-32 text-center text-sm font-medium text-muted-foreground">
                              No engagement profiles found matching your search.
                            </TableCell>
                          </TableRow>
                        ) : (
                          users.map((user) => (
                            <TableRow key={user.userId} className="group border-white/[0.05] hover:bg-white/[0.02]">
                              <TableCell className="px-6 py-4">
                                <div>
                                  <p className="font-bold text-white">{user.fullName}</p>
                                  <p className="text-[0.7rem] text-muted-foreground">{user.email}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="rounded-lg border-primary/20 bg-primary/5 px-2 py-0.5 text-[0.65rem] font-black text-primary">
                                  {user.engagementLevelLabel}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="inline-flex items-center gap-1.5 font-bold text-white">
                                  <Flame className="size-3.5 text-[#facc15]" /> {user.currentStreak}d
                                </span>
                              </TableCell>
                              <TableCell className="font-bold text-emerald-400">{user.lifetimeXp.toLocaleString()}</TableCell>
                              <TableCell className="font-bold text-white">{user.loyaltyCoins.toLocaleString()}</TableCell>
                              <TableCell className="px-6">
                                <span className="inline-flex items-center rounded-lg bg-white/[0.04] px-2.5 py-1 text-[0.7rem] font-bold text-muted-foreground group-hover:text-white">
                                  {user.weakTopic || "N/A"}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col gap-6">
                <Card className="relative overflow-hidden border-white/10 bg-card">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] to-transparent pointer-events-none" />
                  <CardHeader className="px-6 py-5">
                    <CardTitle className="text-lg font-black text-white">Question Bank</CardTitle>
                    <p className="text-xs font-medium text-muted-foreground">Content ecosystem status</p>
                  </CardHeader>
                  <CardContent className="space-y-4 px-6 pb-6">
                    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 transition-all hover:bg-white/[0.05]">
                      <div>
                        <p className="text-[0.65rem] font-black uppercase tracking-wider text-muted-foreground">Approved</p>
                        <p className="mt-1 text-2xl font-black text-white">{overview?.approvedQuestions || 0}</p>
                      </div>
                      <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                        <CheckCircle2 className="size-5" />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 transition-all hover:bg-primary/10">
                      <div>
                        <p className="text-[0.65rem] font-black uppercase tracking-wider text-primary">Pending Review</p>
                        <p className="mt-1 text-2xl font-black text-white">{overview?.pendingQuestions || 0}</p>
                      </div>
                      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
                        <Loader2 className="size-5 animate-spin" />
                      </div>
                    </div>

                    <Button
                      type="button"
                      className="mt-2 w-full rounded-xl bg-primary py-6 font-black text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      onClick={() => navigate("/admin/engagement/questions")}
                    >
                      Open Review Queue →
                    </Button>
                  </CardContent>
                </Card>

                <div className="rounded-[24px] border border-white/10 bg-card p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-white/[0.05] text-muted-foreground">
                      <Activity className="size-4" />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">System Health</p>
                  </div>
                  <p className="mt-4 text-[0.7rem] leading-relaxed text-muted-foreground">
                    Engine is running normally. All daily quest sets have been successfully generated for the current UTC window.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminEngagementOverview;

