import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { AdminTopBar } from "./AdminTopBar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/shared/context/AuthContext";
import Search from "lucide-react/dist/esm/icons/search";
import Eye from "lucide-react/dist/esm/icons/eye";
import Ban from "lucide-react/dist/esm/icons/ban";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import { toast } from "sonner";


const AdminUsers = ({ roleFilter }) => {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const pageTitle = roleFilter 
    ? (roleFilter === "CLIENT" ? "Clients" : roleFilter === "PROJECT_MANAGER" ? "Project Managers" : "Freelancers")
    : "Users";

  const pageDescription = roleFilter
    ? `Manage your platform's ${roleFilter === "PROJECT_MANAGER" ? "project managers" : roleFilter.toLowerCase() + "s"}.`
    : "Manage your platform's users.";

  const getDisplayStatus = (user) => {
    if (user.status === "SUSPENDED") return "SUSPENDED";
    if (user.status === "PENDING_APPROVAL" || (user.role === "FREELANCER" && !user.isVerified)) {
      return "PENDING";
    }
    return "ACTIVE";
  };

  const filteredUsers = users.filter((user) => {
    if (statusFilter === "ALL") return true;
    return getDisplayStatus(user) === statusFilter;
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        search,
        ...(roleFilter && { role: roleFilter })
      });
      const res = await authFetch(`/admin/users?${queryParams}`);
      const data = await res.json();
      if (data?.data?.users) {
        setUsers(data.data.users);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceId = setTimeout(fetchUsers, 500);
    return () => clearTimeout(debounceId);
  }, [authFetch, search, roleFilter]);

  const handleStatusChange = async (userId, newStatus) => {
    setActionLoading(userId);
    try {
      const res = await authFetch(`/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        toast.success(`User ${newStatus === 'ACTIVE' ? 'activated' : 'suspended'} successfully`);
        // Update local state
        setUsers(users.map(u => 
          u.id === userId ? { ...u, status: newStatus } : u
        ));
      } else {
        toast.error("Failed to update user status");
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update user status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleView = (userId) => {
    navigate(`/admin/users/${userId}`);
  };

  return (
    <>
    <AdminLayout>
      <div className="relative flex flex-col gap-6 p-6">
        <AdminTopBar label={pageTitle} />

        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
              <p className="text-muted-foreground mt-2">{pageDescription}</p>
            </div>
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {["ALL", "ACTIVE", "PENDING", "SUSPENDED"].map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                  >
                    {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
                  </Button>
                ))}
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`Search ${pageTitle.toLowerCase()}...`}
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                      <TableCell><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
                      <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                      <TableCell><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
                      <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">No {pageTitle.toLowerCase()} found.</TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.fullName}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                          user.role === 'CLIENT' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          user.role === 'PROJECT_MANAGER' ? 'bg-primary/10 text-primary dark:bg-primary/10/30 dark:text-primary' :
                          'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        }`}>
                          {user.role === 'PROJECT_MANAGER' ? 'PM' : user.role}
                        </span>
                      </TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          getDisplayStatus(user) === 'SUSPENDED'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : getDisplayStatus(user) === 'PENDING'
                              ? 'bg-primary/10 text-primary dark:bg-primary/10/30 dark:text-primary'
                              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          {getDisplayStatus(user) === 'SUSPENDED'
                            ? 'Suspended'
                            : getDisplayStatus(user) === 'PENDING'
                              ? 'Pending'
                              : 'Active'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(user.id)}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          {user.status === 'SUSPENDED' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(user.id, 'ACTIVE')}
                              disabled={actionLoading === user.id}
                              className="gap-2 text-green-600 hover:text-green-700 hover:border-green-200 hover:bg-green-50"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Activate
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(user.id, 'SUSPENDED')}
                              disabled={actionLoading === user.id}
                              className="gap-2 text-red-600 hover:text-red-700 hover:border-red-200 hover:bg-red-50"
                            >
                              <Ban className="h-4 w-4" />
                              Suspend
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AdminLayout>
    
    </>
  );
};

export default AdminUsers;
