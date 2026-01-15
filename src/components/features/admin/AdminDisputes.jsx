import React, { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { AdminTopBar } from "./AdminTopBar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/shared/context/AuthContext";
import Search from "lucide-react/dist/esm/icons/search";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import FileText from "lucide-react/dist/esm/icons/file-text";
import User from "lucide-react/dist/esm/icons/user";
import Eye from "lucide-react/dist/esm/icons/eye";
import format from "date-fns/format";
import DisputeDetailsDialog from "./DisputeDetailsDialog";

const AdminDisputes = () => {
  const { authFetch } = useAuth();
  const [disputes, setDisputes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectManagers, setProjectManagers] = useState([]);
  const [pmCount, setPmCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);

  useEffect(() => {
    fetchProjectManagers();
    fetchProjects();
  }, []);

  const fetchProjectManagers = async () => {
    try {
      const res = await authFetch("/admin/users?role=PROJECT_MANAGER");
      const data = await res.json();
      if (data?.data?.users) {
        setProjectManagers(data.data.users);
        setPmCount(data.data.users.length);
      }
    } catch (err) {
      console.error("Failed to fetch PMs:", err);
    }
  };

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/disputes");
      const data = await res.json();
      if (data?.data) {
        setDisputes(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch disputes:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await authFetch("/projects");
      const data = await res.json();
      if (data?.data) {
        setProjects(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    }
  };

  const filteredDisputes = disputes.filter(d => {
    // Basic search filtering
    const matchesSearch = 
      d.project?.title?.toLowerCase().includes(search.toLowerCase()) ||
      d.description?.toLowerCase().includes(search.toLowerCase()) ||
      d.raisedBy?.fullName?.toLowerCase().includes(search.toLowerCase());
    
    // Filter by selected manager if one is selected
    if (selectedManager) {
      return matchesSearch && (d.manager?.id === selectedManager.id);
    }
    
    return false; // Don't show any disputes if no manager is selected (based on "click to show")
    // Or if we want to show all initially, change this logic.
    // User said "click on it -> show dispute section".
  });

  const assignedProjects = projects.filter(p => selectedManager && p.managerId === selectedManager.id);
  
  const handleManagerClick = (pm) => {
    setSelectedManager(pm);
    fetchDisputes(); // Ensure we have the latest disputes
  };

  const getStatusBadge = (status) => {
    const colors = {
      OPEN: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      IN_PROGRESS: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      RESOLVED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    };
    return (
      <Badge className={`${colors[status] || "bg-gray-100"} border-0`}>
        {status}
      </Badge>
    );
  };

  const handleViewDetails = (dispute, e) => {
    if (e) e.stopPropagation();
    setSelectedDispute(dispute);
    setDetailsOpen(true);
  };

  return (
    <AdminLayout>
      <div className="relative flex flex-col gap-6 p-6">
        <AdminTopBar label="Project Manager Work" />

        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Project Managers</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                  <p className="text-muted-foreground">Manage and view all Project Managers.</p>
              </div>
            </div>
          </div>

          {/* Project Managers List */}
          <div className="rounded-md border bg-card mb-8">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Project Managers</h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectManagers.length === 0 ? (
                   <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No Project Managers found.
                    </TableCell>
                  </TableRow>
                ) : (
                  projectManagers.map((pm) => (
                    <TableRow 
                      key={pm.id} 
                      className={`cursor-pointer hover:bg-muted/50 ${selectedManager?.id === pm.id ? 'bg-muted/50 border-l-4 border-primary' : ''}`}
                      onClick={() => handleManagerClick(pm)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{pm.fullName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{pm.email}</TableCell>
                      <TableCell>
                        <Badge variant={pm.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {pm.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(pm.createdAt), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          </div>

          {/* Assigned Projects List */}
          {selectedManager && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    Projects Assigned to {selectedManager.fullName}
                  </h2>
                </div>
              <div className="rounded-md border bg-card">
                 <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project Title</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Spent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedProjects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          No projects assigned to this manager.
                        </TableCell>
                      </TableRow>
                    ) : (
                      assignedProjects.map((project) => (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium">{project.title}</TableCell>
                          <TableCell>
                             <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>{project.owner?.fullName || "Unknown"}</span>
                              </div>
                          </TableCell>
                          <TableCell><Badge variant="outline">{project.status}</Badge></TableCell>
                          <TableCell>₹{project.budget?.toLocaleString()}</TableCell>
                          <TableCell>₹{project.spent?.toLocaleString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Disputes List (restored) */}
          {selectedManager && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    Disputes assigned to {selectedManager.fullName}
                  </h2>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search disputes..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="rounded-md border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Raised By</TableHead>
                      <TableHead>Issue</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      [...Array(3)].map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                          <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                          <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                          <TableCell><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
                          <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                          <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                          <TableCell><div className="h-8 w-8 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : filteredDisputes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                          <div className="flex flex-col items-center justify-center">
                            <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                            <p>No disputes found for this manager.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDisputes.map((dispute) => (
                        <TableRow 
                          key={dispute.id} 
                          className="group cursor-pointer hover:bg-muted/50"
                          onClick={() => handleViewDetails(dispute)}
                        >
                          <TableCell className="font-medium">
                            {dispute.project?.title || "Unknown Project"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>{dispute.raisedBy?.fullName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[250px]">
                            <div className="flex items-start gap-2">
                              <FileText className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                              <p className="truncate text-sm text-muted-foreground">
                                {dispute.description}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                          <TableCell>
                            {dispute.manager ? (
                              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                {dispute.manager.fullName}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground italic">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(dispute.createdAt), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => handleViewDetails(dispute, e)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
      </div>
      
      <DisputeDetailsDialog 
        dispute={selectedDispute}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </AdminLayout>
  );
};

export default AdminDisputes;
