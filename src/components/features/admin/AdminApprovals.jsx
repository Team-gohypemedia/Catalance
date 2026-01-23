import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { AdminTopBar } from "./AdminTopBar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/shared/context/AuthContext";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import XCircle from "lucide-react/dist/esm/icons/x-circle";
import Eye from "lucide-react/dist/esm/icons/eye";
import { toast } from "sonner";
import UserDetailsDialog from "./UserDetailsDialog";

const AdminApprovals = () => {
  const { authFetch } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Fetch only users who are pending approval or unverified freelancers
  const fetchPendingUsers = async () => {
    setLoading(true);
    try {
      // Fetch approvals via special view
      const params = new URLSearchParams({
        view: 'approvals'
      });
      const res = await authFetch(`/admin/users?${params}`);
      const data = await res.json();

      if (data?.data?.users) {
        setUsers(data.data.users);
      }
    } catch (error) {
      console.error("Failed to fetch pending users:", error);
      toast.error("Failed to load approvals list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, [authFetch]);

  const handleApprove = async (userId) => {
    setActionLoading(userId);
    try {
      // 1. Set status to ACTIVE
      const resStatus = await authFetch(`/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: 'ACTIVE' })
      });

      if (resStatus.ok) {
        toast.success("User approved successfully");
        setUsers(users.filter(u => u.id !== userId)); // Remove from list
      } else {
        toast.error("Failed to approve user");
      }
    } catch (error) {
      console.error("Failed to approve:", error);
      toast.error("Failed to approve user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId) => {
    setActionLoading(userId);
    try {
      const res = await authFetch(`/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: 'SUSPENDED' }) // Or REJECTED if enum exists, but SUSPENDED is safe
      });

      if (res.ok) {
        toast.success("User rejected/suspended");
        setUsers(users.filter(u => u.id !== userId));
      } else {
        toast.error("Failed to reject user");
      }
    } catch (error) {
      console.error("Failed to reject:", error);
      toast.error("Failed to reject user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleView = (userId) => {
    setSelectedUserId(userId);
    setDetailsDialogOpen(true);
  };

  return (
    <>
      <AdminLayout>
        <div className="relative flex flex-col gap-6 p-6">
          <AdminTopBar label="Approvals" />

          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Pending Approvals</h1>
              <p className="text-muted-foreground mt-2">
                Review and approve new freelancers and certification requests.
              </p>
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
                    [...Array(3)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                        <TableCell><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
                        <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                        <TableCell><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
                        <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No pending approvals found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.fullName}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                            Pending
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(user.id)}
                              className="h-8 w-8 p-0"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(user.id)}
                              disabled={actionLoading === user.id}
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-100"
                              title="Approve"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReject(user.id)}
                              disabled={actionLoading === user.id}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                              title="Reject"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
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

      <UserDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        userId={selectedUserId}
      />
    </>
  );
};

export default AdminApprovals;
