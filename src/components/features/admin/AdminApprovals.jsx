import React, { useCallback, useEffect, useMemo, useState } from "react";
import AdminLayout from "./AdminLayout";
import { AdminTopBar } from "./AdminTopBar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/shared/context/AuthContext";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import XCircle from "lucide-react/dist/esm/icons/x-circle";
import Eye from "lucide-react/dist/esm/icons/eye";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import ShieldX from "lucide-react/dist/esm/icons/shield-x";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import { toast } from "sonner";
import UserDetailsDialog from "./UserDetailsDialog";

const AdminApprovals = () => {
  const { authFetch } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const fetchPendingUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ view: "approvals" });
      const res = await authFetch(`/admin/users?${params}`);
      const data = await res.json();

      if (Array.isArray(data?.data?.users)) {
        setUsers(data.data.users);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Failed to fetch pending users:", error);
      toast.error("Failed to load approvals list");
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchPendingUsers();
  }, [fetchPendingUsers]);

  const metrics = useMemo(() => {
    const totalPending = users.length;
    const kycPending = users.filter((u) => u.role === "FREELANCER" && !u.isVerified).length;
    const accountPending = users.filter((u) => u.status === "PENDING_APPROVAL").length;

    return { totalPending, kycPending, accountPending };
  }, [users]);

  const handleApprove = async (userId) => {
    setActionLoading(userId);
    try {
      const resStatus = await authFetch(`/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });

      if (!resStatus.ok) {
        toast.error("Failed to approve user");
        return;
      }

      toast.success("User approved");
      await fetchPendingUsers();
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
        body: JSON.stringify({ status: "SUSPENDED" }),
      });

      if (!res.ok) {
        toast.error("Failed to reject user");
        return;
      }

      toast.success("User suspended");
      await fetchPendingUsers();
    } catch (error) {
      console.error("Failed to reject:", error);
      toast.error("Failed to reject user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleKyc = async (userId, isVerified) => {
    setActionLoading(userId);
    try {
      const res = await authFetch(`/admin/users/${userId}/verification`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified }),
      });

      if (!res.ok) {
        toast.error(isVerified ? "Failed to approve KYC" : "Failed to reject KYC");
        return;
      }

      toast.success(isVerified ? "KYC approved" : "KYC rejected");
      await fetchPendingUsers();
    } catch (error) {
      console.error("Failed to update KYC:", error);
      toast.error("Failed to update KYC status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleView = (userId) => {
    setSelectedUserId(userId);
    setDetailsDialogOpen(true);
  };

  const getKycBadge = (user) => {
    if (user.role !== "FREELANCER") {
      return <Badge variant="outline">N/A</Badge>;
    }

    if (user.isVerified) {
      return <Badge className="bg-green-100 text-green-700 border-0">Verified</Badge>;
    }

    return <Badge className="bg-yellow-100 text-yellow-700 border-0">Pending Review</Badge>;
  };

  return (
    <>
      <AdminLayout>
        <div className="relative flex flex-col gap-6 p-6">
          <AdminTopBar label="Approvals" />

          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Approvals and KYC</h1>
              <p className="mt-2 text-muted-foreground">
                Review account approvals and identity verification before payout access.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Pending</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">{loading ? "--" : metrics.totalPending}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">KYC Pending</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">{loading ? "--" : metrics.kycPending}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Account Pending</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">{loading ? "--" : metrics.accountPending}</p>
                </CardContent>
              </Card>
            </div>

            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>KYC</TableHead>
                    <TableHead>Payout Eligible</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    [...Array(4)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><div className="h-4 w-40 animate-pulse rounded bg-muted" /></TableCell>
                        <TableCell><div className="h-4 w-20 animate-pulse rounded bg-muted" /></TableCell>
                        <TableCell><div className="h-4 w-20 animate-pulse rounded bg-muted" /></TableCell>
                        <TableCell><div className="h-4 w-20 animate-pulse rounded bg-muted" /></TableCell>
                        <TableCell><div className="h-4 w-24 animate-pulse rounded bg-muted" /></TableCell>
                        <TableCell><div className="h-4 w-24 animate-pulse rounded bg-muted" /></TableCell>
                        <TableCell><div className="ml-auto h-4 w-28 animate-pulse rounded bg-muted" /></TableCell>
                      </TableRow>
                    ))
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        No pending approvals found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => {
                      const pending = actionLoading === user.id;
                      const kycReady = user.role === "FREELANCER" && user.isVerified;

                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{user.fullName}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{user.role}</Badge>
                          </TableCell>
                          <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge className={user.status === "PENDING_APPROVAL" ? "bg-yellow-100 text-yellow-700 border-0" : "bg-green-100 text-green-700 border-0"}>
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{getKycBadge(user)}</TableCell>
                          <TableCell>
                            <Badge className={kycReady ? "bg-emerald-100 text-emerald-700 border-0" : "bg-muted text-muted-foreground border-0"}>
                              {kycReady ? "Yes" : "No"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleView(user.id)}
                                className="h-8 w-8 p-0"
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>

                              {user.role === "FREELANCER" && !user.isVerified ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleKyc(user.id, true)}
                                  disabled={pending}
                                  className="h-8 w-8 p-0 text-green-600 hover:bg-green-100 hover:text-green-700"
                                  title="Approve KYC"
                                >
                                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                                </Button>
                              ) : null}

                              {user.role === "FREELANCER" && user.isVerified ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleKyc(user.id, false)}
                                  disabled={pending}
                                  className="h-8 w-8 p-0 text-orange-600 hover:bg-orange-100 hover:text-orange-700"
                                  title="Reject KYC"
                                >
                                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldX className="h-4 w-4" />}
                                </Button>
                              ) : null}

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApprove(user.id)}
                                disabled={pending}
                                className="h-8 w-8 p-0 text-green-600 hover:bg-green-100 hover:text-green-700"
                                title="Approve account"
                              >
                                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReject(user.id)}
                                disabled={pending}
                                className="h-8 w-8 p-0 text-red-600 hover:bg-red-100 hover:text-red-700"
                                title="Reject account"
                              >
                                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
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
