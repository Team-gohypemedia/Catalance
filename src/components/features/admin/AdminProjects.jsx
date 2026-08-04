import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { AdminTopBar } from "./AdminTopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/shared/context/AuthContext";
import Search from "lucide-react/dist/esm/icons/search";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import User from "lucide-react/dist/esm/icons/user";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import FileText from "lucide-react/dist/esm/icons/file-text";
import IndianRupee from "lucide-react/dist/esm/icons/indian-rupee";

const AdminProjects = () => {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
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
    }
  };

  const formatCurrency = (amount) => {
    return `₹${(amount || 0).toLocaleString("en-IN")}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const cleanEmail = (email) => {
    if (!email) return "";
    if (email.endsWith("@phone.catalance.local")) return "";
    return email;
  };

  const getStatusBadge = (status) => {
    const colors = {
      DRAFT: "bg-gray-500",
      OPEN: "bg-blue-500",
      IN_PROGRESS: "bg-amber-500",
      AWAITING_PAYMENT: "bg-indigo-500",
      COMPLETED: "bg-green-500",
      PAUSED: "bg-yellow-600"
    };
    return (
      <Badge className={`${colors[status] || "bg-gray-500"} text-white font-medium`}>
        {status?.replace("_", " ")}
      </Badge>
    );
  };

  // Compute status counts for filtered indicators
  const getStatusCount = (status) => {
    if (status === "ALL") return projects.length;
    return projects.filter((p) => {
      const effectiveStatus = (p.progress && Number(p.progress) >= 100) ? "COMPLETED" : p.status;
      return effectiveStatus === status;
    }).length;
  };

  // Filter projects by both search query and status tab
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.owner?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      p.freelancer?.fullName?.toLowerCase().includes(search.toLowerCase());

    const effectiveStatus = (p.progress && Number(p.progress) >= 100) ? "COMPLETED" : p.status;
    const matchesStatus = statusFilter === "ALL" || effectiveStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="relative flex flex-col gap-6 p-6">
        <AdminTopBar label="Projects" />

        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header Area */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
              <p className="text-muted-foreground mt-1">Manage all client and freelancer projects on the platform.</p>
            </div>
            
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by title, client, or freelancer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-card border-border/60"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 pb-2">
            {["ALL", "DRAFT", "OPEN", "IN_PROGRESS", "AWAITING_PAYMENT", "COMPLETED", "PAUSED"].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className="rounded-full px-4 text-xs font-semibold gap-1.5 transition-all"
              >
                <span>{status === "ALL" ? "All Projects" : status.replace("_", " ")}</span>
                <Badge 
                  variant={statusFilter === status ? "secondary" : "outline"} 
                  className="px-1.5 py-0 text-[10px] pointer-events-none"
                >
                  {getStatusCount(status)}
                </Badge>
              </Button>
            ))}
          </div>

          {/* Loader or Card List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground animate-pulse">Loading project workspace database...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-20 border rounded-xl bg-card border-dashed">
              <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground/60" />
              <h3 className="text-base font-semibold">No Projects Found</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                No projects matched your status tab selection or search query. Try broadening your criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => {
                const effectiveStatus = (project.progress && Number(project.progress) >= 100) ? "COMPLETED" : project.status;
                
                return (
                  <Card 
                    key={project.id} 
                    className="bg-card border border-border/60 hover:border-primary/40 hover:shadow-md transition-all duration-300 cursor-pointer group flex flex-col justify-between"
                    onClick={() => navigate(`/admin/projects/${project.id}`)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors leading-tight line-clamp-1">
                            {project.title}
                          </CardTitle>
                          <p className="text-[10px] text-muted-foreground mt-1 select-none font-mono">ID: {project.id}</p>
                        </div>
                        {getStatusBadge(effectiveStatus)}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4 pt-1">
                      {/* Client / Owner */}
                      <div className="flex items-center gap-2.5 text-xs text-card-foreground">
                        <User className="h-4 w-4 text-blue-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wide">Client</p>
                          <p className="font-medium truncate mt-0.5">
                            {project.owner?.fullName || "N/A"}{" "}
                            {cleanEmail(project.owner?.email) && (
                              <span className="text-muted-foreground font-normal text-[10px]">
                                ({cleanEmail(project.owner.email)})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Freelancer Assigned */}
                      <div className="flex items-center gap-2.5 text-xs text-card-foreground">
                        <Briefcase className="h-4 w-4 text-green-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wide">Freelancer</p>
                          {project.freelancer ? (
                            <p className="font-medium truncate mt-0.5">
                              {project.freelancer.fullName}{" "}
                              {cleanEmail(project.freelancer.email) && (
                                <span className="text-muted-foreground font-normal text-[10px]">
                                  ({cleanEmail(project.freelancer.email)})
                                </span>
                              )}
                            </p>
                          ) : (
                            <p className="text-muted-foreground font-medium mt-0.5 italic">
                              {project.status === 'DRAFT' ? (
                                <span className="text-muted-foreground/70 font-medium not-italic">Draft Mode (Unpublished)</span>
                              ) : (project.status === 'OPEN' && (project._count?.proposals || 0) > 0) ? (
                                <span className="text-primary font-semibold not-italic">Pending Proposals</span>
                              ) : project.status === 'OPEN' ? (
                                <span className="text-primary font-semibold not-italic">Open for Bidding</span>
                              ) : (
                                "No freelancer assigned"
                              )}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Stats chips bar */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t mt-4">
                        <div className="flex flex-col items-center justify-center p-2 bg-muted/40 rounded-lg text-center">
                          <IndianRupee className="h-3.5 w-3.5 text-emerald-500 mb-1" />
                          <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Budget</span>
                          <span className="font-bold text-xs mt-0.5 truncate max-w-full">{formatCurrency(project.budget)}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-2 bg-muted/40 rounded-lg text-center">
                          <FileText className="h-3.5 w-3.5 text-blue-500 mb-1" />
                          <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Proposals</span>
                          <span className="font-bold text-xs mt-0.5">{project.status === 'DRAFT' ? "—" : (project._count?.proposals || 0)}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-2 bg-muted/40 rounded-lg text-center">
                          <Calendar className="h-3.5 w-3.5 text-indigo-500 mb-1" />
                          <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Created</span>
                          <span className="font-bold text-[10px] mt-0.5 truncate max-w-full">{formatDate(project.createdAt).split(' ').slice(0, 2).join(' ')}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProjects;
