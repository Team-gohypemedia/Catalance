import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { AdminTopBar } from "./AdminTopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Users from "lucide-react/dist/esm/icons/users";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import FileText from "lucide-react/dist/esm/icons/file-text";
import DollarSign from "lucide-react/dist/esm/icons/dollar-sign";
import Check from "lucide-react/dist/esm/icons/check";
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle";
import { useAuth } from "@/shared/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const AdminDashboard = () => {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    totalProposals: 0,
    totalRevenue: 0,
  });
  const [recentDisputes, setRecentDisputes] = useState([]);
  const [recentFreelancers, setRecentFreelancers] = useState([]);
  const [pendingFreelancers, setPendingFreelancers] = useState([]);
  const [recentClients, setRecentClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, disputesRes, freelancersRes, clientsRes] =
          await Promise.all([
            authFetch("/admin/stats"),
            authFetch("/disputes"),
            authFetch("/admin/users?role=FREELANCER"),
            authFetch("/admin/users?role=CLIENT"),
          ]);

        const statsData = await statsRes.json();
        const disputesData = await disputesRes.json();
        const freelancersData = await freelancersRes.json();
        const clientsData = await clientsRes.json();

        if (statsData?.data?.stats) setStats(statsData.data.stats);
        
        if (disputesData?.data) {
          const activeDisputes = disputesData.data.filter(d => d.status !== 'RESOLVED');
          setRecentDisputes(activeDisputes.slice(0, 4));
        }
        
        if (freelancersData?.data?.users) {
          const activeFreelancers = freelancersData.data.users.filter(u => u.status === 'ACTIVE');
          const pending = freelancersData.data.users.filter(u => u.status === 'PENDING_APPROVAL');
          setRecentFreelancers(activeFreelancers.slice(0, 4));
          setPendingFreelancers(pending);
        }
        
        if (clientsData?.data?.users) {
          const activeClients = clientsData.data.users.filter(u => u.status === 'ACTIVE');
          setRecentClients(activeClients.slice(0, 4));
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [authFetch]);

  const handleApproveUser = async (userId) => {
    try {
      const response = await authFetch(`/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });
      if (response.ok) {
        setPendingFreelancers((prev) => prev.filter((u) => u.id !== userId));
        // Optionally add to active list if we want to reflect it immediately
        // setRecentFreelancers(prev => [updatedUser, ...prev].slice(0, 4)); // would need updatedUser from response
      }
    } catch (error) {
      console.error("Failed to approve user:", error);
    }
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      description: "Active users on platform",
    },
    {
      title: "Projects Posted",
      value: stats.totalProjects,
      icon: Briefcase,
      description: "Total projects created",
    },
    {
      title: "Proposals Sent",
      value: stats.totalProposals,
      icon: FileText,
      description: "Total proposals submitted",
    },
    {
      title: "Total Revenue",
      value: `₹${Number(stats.totalRevenue).toLocaleString("en-IN")}`,
      icon: DollarSign,
      description: "Amount paid by clients",
    },
  ];

  const getDisputeStatusBadge = (status) => {
    const colors = {
      OPEN: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      IN_PROGRESS:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      RESOLVED:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    };
    return (
      <Badge className={`${colors[status] || "bg-gray-100"} border-0`}>
        {status}
      </Badge>
    );
  };

  return (
    <AdminLayout>
      <div className="relative flex flex-col gap-6 p-6">
        <AdminTopBar label="Dashboard" />

        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Overview of your platform's performance.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? (
                      <div className="h-8 w-24 bg-muted animate-pulse rounded" />
                    ) : (
                      stat.value
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>




          <div className="grid gap-6 md:grid-cols-2">
            
            {/* Pending Approvals Section */}
            {pendingFreelancers.length > 0 && (
              <Card className="md:col-span-2 border-yellow-500/50 bg-yellow-500/5">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                    <AlertTriangle className="h-5 w-5" />
                    Pending Approvals
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-yellow-700 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300"
                    onClick={() => navigate("/admin/approvals")}
                  >
                    See More
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {pendingFreelancers.map((user) => (
                      <div 
                        key={user.id} 
                        className="flex items-center justify-between p-4 bg-background border rounded-lg cursor-pointer hover:border-yellow-500/50 transition-colors"
                        onClick={() => navigate(`/admin/users/${user.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold">
                            {user.fullName.charAt(0)}
                          </div>
                          <div className="overflow-hidden">
                            <p className="font-medium truncate">{user.fullName}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApproveUser(user.id);
                          }}
                        >
                          <Check className="h-4 w-4 mr-1" /> Approve
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Active Disputes (Project Manager Work) Section */}
            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Project Manager Work</CardTitle>
                  <p className="text-sm text-muted-foreground">Recent disputes and project manager assignments</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/admin/project-managers")}
                >
                  See More
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project</TableHead>
                        <TableHead>Raised By</TableHead>
                        <TableHead>Issue</TableHead>
                        <TableHead>Manager</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        [...Array(3)].map((_, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                            </TableCell>
                            <TableCell>
                              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                            </TableCell>
                            <TableCell>
                              <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                            </TableCell>
                            <TableCell>
                              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                            </TableCell>
                            <TableCell>
                              <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : recentDisputes.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center h-24 text-muted-foreground"
                          >
                            No active disputes found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        recentDisputes.map((dispute) => (
                          <TableRow key={dispute.id}>
                            <TableCell className="font-medium">
                              {dispute.project?.title || "Unknown"}
                            </TableCell>
                            <TableCell>{dispute.raisedBy?.fullName}</TableCell>
                            <TableCell className="max-w-[200px] truncate text-muted-foreground">
                              {dispute.description}
                            </TableCell>
                            <TableCell>
                              {dispute.manager ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                  {dispute.manager.fullName}
                                </span>
                              ) : (
                                <span className="text-muted-foreground italic">Unassigned</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {getDisputeStatusBadge(dispute.status)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Active Freelancers Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Active Freelancers</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Recently active freelancers
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/admin/freelancers")}
                >
                  See More
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    [...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                          <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                        </div>
                      </div>
                    ))
                  ) : recentFreelancers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No freelancers found.
                    </div>
                  ) : (
                    recentFreelancers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {user.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{user.fullName}</p>
                            <p className="text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <div
                          className={`px-2 py-1 rounded-full text-xs ${
                            user.status === "ACTIVE"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {user.status}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Active Clients Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Active Clients</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Recently active clients
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/admin/clients")}
                >
                  See More
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    [...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                          <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                        </div>
                      </div>
                    ))
                  ) : recentClients.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No clients found.
                    </div>
                  ) : (
                    recentClients.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                            {user.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{user.fullName}</p>
                            <p className="text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <div
                          className={`px-2 py-1 rounded-full text-xs ${
                            user.status === "ACTIVE"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {user.status}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
