import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { AdminTopBar } from "./AdminTopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/shared/context/AuthContext";

import Search from "lucide-react/dist/esm/icons/search";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import User from "lucide-react/dist/esm/icons/user";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import FileText from "lucide-react/dist/esm/icons/file-text";
import IndianRupee from "lucide-react/dist/esm/icons/indian-rupee";
import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right";
import LayoutGrid from "lucide-react/dist/esm/icons/layout-grid";
import TableProperties from "lucide-react/dist/esm/icons/table-properties";
import X from "lucide-react/dist/esm/icons/x";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Clock from "lucide-react/dist/esm/icons/clock";

const AdminProjects = () => {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"
  const [sortBy, setSortBy] = useState("newest"); // "newest", "oldest", "budget-desc", "budget-asc", "proposals-desc", "title-asc"
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await authFetch(`/admin/projects`);
      const data = await res.json();
      if (data?.data?.projects) {
        setProjects(data.data.projects);
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${(amount || 0).toLocaleString("en-IN")}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const cleanEmail = (email) => {
    if (!email) return "";
    if (email.endsWith("@phone.catalance.local")) return "";
    return email;
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleCopyId = (e, id) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Status configuration helper for dynamic colors & glowing dots
  const getStatusConfig = (status) => {
    switch (status) {
      case "COMPLETED":
        return {
          label: "Completed",
          badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
          dotClass: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]",
        };
      case "IN_PROGRESS":
        return {
          label: "In Progress",
          badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
          dotClass: "bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]",
        };
      case "OPEN":
        return {
          label: "Open",
          badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
          dotClass: "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]",
        };
      case "AWAITING_PAYMENT":
        return {
          label: "Awaiting Payment",
          badgeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
          dotClass: "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]",
        };
      case "PAUSED":
        return {
          label: "Paused",
          badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
          dotClass: "bg-rose-500",
        };
      case "DRAFT":
      default:
        return {
          label: status?.replace("_", " ") || "Draft",
          badgeClass: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30",
          dotClass: "bg-slate-400",
        };
    }
  };

  const renderStatusBadge = (status) => {
    const config = getStatusConfig(status);
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.badgeClass} transition-colors`}
      >
        <span className={`h-2 w-2 rounded-full ${config.dotClass}`} />
        {config.label}
      </span>
    );
  };

  // KPI Calculations
  const metrics = useMemo(() => {
    const totalCount = projects.length;
    const totalBudget = projects.reduce((acc, p) => acc + (Number(p.budget) || 0), 0);

    const activeProjects = projects.filter((p) => {
      const eff = p.progress && Number(p.progress) >= 100 ? "COMPLETED" : p.status;
      return eff === "IN_PROGRESS" || eff === "OPEN";
    }).length;

    const completedProjects = projects.filter((p) => {
      const eff = p.progress && Number(p.progress) >= 100 ? "COMPLETED" : p.status;
      return eff === "COMPLETED";
    }).length;

    return { totalCount, totalBudget, activeProjects, completedProjects };
  }, [projects]);

  // Compute status counts for filtered indicators
  const getStatusCount = (status) => {
    if (status === "ALL") return projects.length;
    return projects.filter((p) => {
      const effectiveStatus = p.progress && Number(p.progress) >= 100 ? "COMPLETED" : p.status;
      return effectiveStatus === status;
    }).length;
  };

  // Filter & Sort Projects
  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        const matchesSearch =
          p.title?.toLowerCase().includes(search.toLowerCase()) ||
          p.owner?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
          p.owner?.email?.toLowerCase().includes(search.toLowerCase()) ||
          p.freelancer?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
          p.freelancer?.email?.toLowerCase().includes(search.toLowerCase()) ||
          p.id?.toLowerCase().includes(search.toLowerCase());

        const effectiveStatus = p.progress && Number(p.progress) >= 100 ? "COMPLETED" : p.status;
        const matchesStatus = statusFilter === "ALL" || effectiveStatus === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
        if (sortBy === "oldest") {
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        }
        if (sortBy === "budget-desc") {
          return (Number(b.budget) || 0) - (Number(a.budget) || 0);
        }
        if (sortBy === "budget-asc") {
          return (Number(a.budget) || 0) - (Number(b.budget) || 0);
        }
        if (sortBy === "proposals-desc") {
          return (b._count?.proposals || 0) - (a._count?.proposals || 0);
        }
        if (sortBy === "title-asc") {
          return (a.title || "").localeCompare(b.title || "");
        }
        return 0;
      });
  }, [projects, search, statusFilter, sortBy]);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setSortBy("newest");
  };

  const isFiltered = search !== "" || statusFilter !== "ALL";

  return (
    <AdminLayout>
      <div className="relative flex flex-col gap-6 p-6 max-w-7xl mx-auto min-h-screen">
        <AdminTopBar label="Projects Workspace" />

        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Project Workspace
                </h1>
                <Badge variant="outline" className="font-mono text-xs px-2 py-0.5 border-primary/30 text-primary bg-primary/5">
                  Admin
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1 text-sm">
                Monitor, search, and manage all client postings & freelancer deliverables on Catalance.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchProjects(true)}
                disabled={refreshing || loading}
                className="gap-2 text-xs font-medium border-border/80 hover:bg-accent"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>

          {/* KPI Analytics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1 */}
            <Card className="bg-gradient-to-br from-card via-card to-primary/5 border border-border/60 hover:border-primary/30 transition-all duration-300 shadow-xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground tracking-wider">Total Projects</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold tracking-tight">{loading ? <Skeleton className="h-7 w-12" /> : metrics.totalCount}</span>
                    <span className="text-[10px] text-muted-foreground font-medium">on platform</span>
                  </div>
                </div>
                <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Briefcase className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            {/* Metric 2 */}
            <Card className="bg-gradient-to-br from-card via-card to-emerald-500/5 border border-border/60 hover:border-emerald-500/30 transition-all duration-300 shadow-xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground tracking-wider">Platform Budget</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                      {loading ? <Skeleton className="h-7 w-20" /> : formatCurrency(metrics.totalBudget)}
                    </span>
                  </div>
                </div>
                <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <IndianRupee className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            {/* Metric 3 */}
            <Card className="bg-gradient-to-br from-card via-card to-amber-500/5 border border-border/60 hover:border-amber-500/30 transition-all duration-300 shadow-xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground tracking-wider">Active Projects</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                      {loading ? <Skeleton className="h-7 w-12" /> : metrics.activeProjects}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">In Progress & Open</span>
                  </div>
                </div>
                <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            {/* Metric 4 */}
            <Card className="bg-gradient-to-br from-card via-card to-blue-500/5 border border-border/60 hover:border-blue-500/30 transition-all duration-300 shadow-xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground tracking-wider">Completed</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                      {loading ? <Skeleton className="h-7 w-12" /> : metrics.completedProjects}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">Delivered</span>
                  </div>
                </div>
                <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search, Sort, and Controls Bar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-card/60 p-4 rounded-xl border border-border/70 backdrop-blur-xs">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Search by project title, ID, client or freelancer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-8 bg-background border-border/80 h-10 text-sm focus-visible:ring-primary/40"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-full"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Controls Group */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Sort Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground hidden sm:inline">Sort:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[170px] h-10 bg-background border-border/80 text-xs font-medium">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="budget-desc">Budget: High to Low</SelectItem>
                    <SelectItem value="budget-asc">Budget: Low to High</SelectItem>
                    <SelectItem value="proposals-desc">Most Proposals</SelectItem>
                    <SelectItem value="title-asc">Title: A to Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* View Switcher */}
              <div className="flex items-center bg-background rounded-lg border border-border/80 p-0.5">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-9 px-3 text-xs gap-1.5 font-medium rounded-md"
                  title="Grid View"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Grid</span>
                </Button>
                <Button
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className="h-9 px-3 text-xs gap-1.5 font-medium rounded-md"
                  title="Table View"
                >
                  <TableProperties className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Table</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Status Filter Tabs Bar */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
            <div className="flex items-center gap-2 flex-nowrap">
              {["ALL", "DRAFT", "OPEN", "IN_PROGRESS", "AWAITING_PAYMENT", "COMPLETED", "PAUSED"].map((status) => {
                const isSelected = statusFilter === status;
                const count = getStatusCount(status);

                return (
                  <Button
                    key={status}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-full px-3.5 text-xs font-medium gap-1.5 transition-all shrink-0 h-8 ${
                      isSelected
                        ? "shadow-xs"
                        : "border-border/70 bg-card hover:bg-accent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>{status === "ALL" ? "All Projects" : status.replace("_", " ")}</span>
                    <Badge
                      variant={isSelected ? "secondary" : "outline"}
                      className="px-1.5 py-0 text-[10px] pointer-events-none rounded-full"
                    >
                      {count}
                    </Badge>
                  </Button>
                );
              })}
            </div>

            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-xs text-muted-foreground hover:text-foreground gap-1 h-8 shrink-0"
              >
                <X className="h-3 w-3" />
                Reset
              </Button>
            )}
          </div>

          {/* Results Summary Counter */}
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>
              Showing <strong className="text-foreground font-semibold">{filteredProjects.length}</strong> of{" "}
              <strong className="text-foreground font-semibold">{projects.length}</strong> total projects
            </span>
          </div>

          {/* Loader or Card List / Table View */}
          {loading ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="bg-card border border-border/60 p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <Skeleton className="h-5 w-2/3" />
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-1/3" />
                    <div className="space-y-2 pt-2">
                      <Skeleton className="h-10 w-full rounded-lg" />
                      <Skeleton className="h-10 w-full rounded-lg" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <Skeleton className="h-12 w-full rounded-lg" />
                      <Skeleton className="h-12 w-full rounded-lg" />
                      <Skeleton className="h-12 w-full rounded-lg" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="border border-border/60 rounded-xl bg-card overflow-hidden p-6 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            )
          ) : filteredProjects.length === 0 ? (
            <Card className="text-center py-16 border border-dashed border-border/80 bg-card/50">
              <CardContent className="flex flex-col items-center justify-center space-y-3">
                <div className="h-14 w-14 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground/60 mb-1">
                  <Briefcase className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight">No Projects Found</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  No projects match your current search query or filter selection. Try adjusting your criteria.
                </p>
                {isFiltered && (
                  <Button variant="outline" size="sm" onClick={resetFilters} className="mt-2 text-xs">
                    Clear Filters & Search
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : viewMode === "grid" ? (
            /* GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => {
                const effectiveStatus =
                  project.progress && Number(project.progress) >= 100 ? "COMPLETED" : project.status;
                const ownerName = project.owner?.fullName || "Unassigned Client";
                const ownerEmail = cleanEmail(project.owner?.email);
                const freelancerName = project.freelancer?.fullName;
                const freelancerEmail = cleanEmail(project.freelancer?.email);
                const progressVal = Number(project.progress) || 0;

                return (
                  <Card
                    key={project.id}
                    className="bg-card border border-border/70 hover:border-primary/50 hover:shadow-md transition-all duration-300 cursor-pointer group flex flex-col justify-between overflow-hidden relative"
                    onClick={() => navigate(`/admin/projects/${project.id}`)}
                  >
                    {/* Top Decorative Subtle Line */}
                    <div
                      className={`h-1 w-full ${
                        effectiveStatus === "COMPLETED"
                          ? "bg-emerald-500"
                          : effectiveStatus === "IN_PROGRESS"
                          ? "bg-amber-500"
                          : effectiveStatus === "OPEN"
                          ? "bg-blue-500"
                          : effectiveStatus === "AWAITING_PAYMENT"
                          ? "bg-indigo-500"
                          : "bg-muted-foreground/30"
                      }`}
                    />

                    <CardHeader className="pb-3 pt-4 px-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors leading-snug line-clamp-2">
                            {project.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-muted-foreground font-mono bg-muted/60 px-1.5 py-0.5 rounded-xs select-all">
                              ID: {project.id?.slice(0, 8)}...
                            </span>
                            <button
                              onClick={(e) => handleCopyId(e, project.id)}
                              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                              title="Copy full ID"
                            >
                              {copiedId === project.id ? "Copied!" : "Copy"}
                            </button>
                          </div>
                        </div>
                        {renderStatusBadge(effectiveStatus)}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4 pt-1 px-5 flex-1">
                      {/* Client Card */}
                      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/40">
                        <Avatar className="h-8 w-8 border border-background shrink-0">
                          <AvatarImage src={project.owner?.avatarUrl} />
                          <AvatarFallback className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                            {getInitials(ownerName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Client
                            </span>
                          </div>
                          <p className="text-xs font-medium text-foreground truncate">{ownerName}</p>
                          {ownerEmail && (
                            <p className="text-[10px] text-muted-foreground truncate">{ownerEmail}</p>
                          )}
                        </div>
                      </div>

                      {/* Freelancer Card */}
                      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/40">
                        <Avatar className="h-8 w-8 border border-background shrink-0">
                          <AvatarImage src={project.freelancer?.avatarUrl} />
                          <AvatarFallback className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                            {freelancerName ? getInitials(freelancerName) : "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Freelancer
                          </span>
                          {freelancerName ? (
                            <>
                              <p className="text-xs font-medium text-foreground truncate">{freelancerName}</p>
                              {freelancerEmail && (
                                <p className="text-[10px] text-muted-foreground truncate">{freelancerEmail}</p>
                              )}
                            </>
                          ) : (
                            <p className="text-xs font-medium text-muted-foreground italic">
                              {project.status === "DRAFT" ? (
                                <span className="not-italic text-muted-foreground/70">Draft Mode</span>
                              ) : project.status === "OPEN" && (project._count?.proposals || 0) > 0 ? (
                                <span className="not-italic text-primary font-semibold">
                                  {project._count.proposals} Proposals Received
                                </span>
                              ) : project.status === "OPEN" ? (
                                <span className="not-italic text-blue-500 font-semibold">Open for Bidding</span>
                              ) : (
                                "Unassigned"
                              )}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Optional Progress Bar */}
                      {effectiveStatus === "IN_PROGRESS" && (
                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-muted-foreground">Completion</span>
                            <span className="font-semibold text-foreground">{progressVal}%</span>
                          </div>
                          <Progress value={progressVal} className="h-1.5" />
                        </div>
                      )}

                      {/* Metric Chips Row */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
                        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-muted/20 border border-border/30 text-center">
                          <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                            Budget
                          </span>
                          <span className="font-bold text-xs mt-0.5 text-foreground truncate max-w-full">
                            {formatCurrency(project.budget)}
                          </span>
                        </div>

                        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-muted/20 border border-border/30 text-center">
                          <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                            Proposals
                          </span>
                          <span className="font-bold text-xs mt-0.5 text-foreground">
                            {project.status === "DRAFT" ? "—" : project._count?.proposals || 0}
                          </span>
                        </div>

                        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-muted/20 border border-border/30 text-center">
                          <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                            Created
                          </span>
                          <span className="font-bold text-[10px] mt-0.5 text-foreground truncate max-w-full">
                            {formatDate(project.createdAt).split(" ").slice(0, 2).join(" ")}
                          </span>
                        </div>
                      </div>
                    </CardContent>

                    {/* Bottom Action Footer */}
                    <div className="px-5 py-3 bg-muted/20 border-t border-border/50 flex items-center justify-between text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
                      <span>View Project Workspace</span>
                      <ArrowUpRight className="h-4 w-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="border border-border/70 rounded-xl bg-card overflow-hidden shadow-xs">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="border-border/60">
                    <TableHead className="w-[140px] text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Status & ID
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Project Title
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Client
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Freelancer
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">
                      Budget
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">
                      Proposals
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Created
                    </TableHead>
                    <TableHead className="w-[80px] text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => {
                    const effectiveStatus =
                      project.progress && Number(project.progress) >= 100 ? "COMPLETED" : project.status;
                    const ownerName = project.owner?.fullName || "Unassigned Client";
                    const ownerEmail = cleanEmail(project.owner?.email);
                    const freelancerName = project.freelancer?.fullName;
                    const freelancerEmail = cleanEmail(project.freelancer?.email);

                    return (
                      <TableRow
                        key={project.id}
                        onClick={() => navigate(`/admin/projects/${project.id}`)}
                        className="cursor-pointer hover:bg-muted/50 border-border/60 transition-colors group"
                      >
                        {/* Status & ID */}
                        <TableCell className="py-3">
                          <div className="space-y-1">
                            {renderStatusBadge(effectiveStatus)}
                            <p className="text-[10px] text-muted-foreground font-mono select-all">
                              {project.id?.slice(0, 8)}...
                            </p>
                          </div>
                        </TableCell>

                        {/* Title */}
                        <TableCell className="py-3">
                          <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors max-w-xs truncate">
                            {project.title}
                          </p>
                        </TableCell>

                        {/* Client */}
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7 border border-background shrink-0">
                              <AvatarImage src={project.owner?.avatarUrl} />
                              <AvatarFallback className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-semibold">
                                {getInitials(ownerName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-foreground truncate max-w-[130px]">{ownerName}</p>
                              {ownerEmail && (
                                <p className="text-[10px] text-muted-foreground truncate max-w-[130px]">{ownerEmail}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Freelancer */}
                        <TableCell className="py-3">
                          {freelancerName ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7 border border-background shrink-0">
                                <AvatarImage src={project.freelancer?.avatarUrl} />
                                <AvatarFallback className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                                  {getInitials(freelancerName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-foreground truncate max-w-[130px]">{freelancerName}</p>
                                {freelancerEmail && (
                                  <p className="text-[10px] text-muted-foreground truncate max-w-[130px]">{freelancerEmail}</p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              {project.status === "DRAFT"
                                ? "Draft"
                                : (project._count?.proposals || 0) > 0
                                ? `${project._count.proposals} Proposals`
                                : "Open for Bidding"}
                            </span>
                          )}
                        </TableCell>

                        {/* Budget */}
                        <TableCell className="py-3 text-right font-bold text-xs text-foreground">
                          {formatCurrency(project.budget)}
                        </TableCell>

                        {/* Proposals */}
                        <TableCell className="py-3 text-center">
                          <Badge variant="secondary" className="font-mono text-xs px-2 py-0.5">
                            {project.status === "DRAFT" ? "—" : project._count?.proposals || 0}
                          </Badge>
                        </TableCell>

                        {/* Created Date */}
                        <TableCell className="py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(project.createdAt)}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 group-hover:text-primary transition-colors"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProjects;
