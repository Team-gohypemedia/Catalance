import React, { useCallback, useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { AdminTopBar } from "./AdminTopBar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/shared/context/AuthContext";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import XCircle from "lucide-react/dist/esm/icons/x-circle";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminUserRequests = () => {
  const { authFetch } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState("all");

  // Approval Dialog State
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approveType, setApproveType] = useState("skill");
  const [parentServiceId, setParentServiceId] = useState("");
  const [parentCategoryId, setParentCategoryId] = useState("");
  
  // Rejection Dialog State
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  // Data for Selects
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentTab !== "all") {
        params.append("status", currentTab);
      }
      const res = await authFetch(`/admin/user-requests?${params}`);
      const data = await res.json();

      if (data?.success) {
        setRequests(data.data);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error("Failed to fetch user requests:", error);
      toast.error("Failed to load user requests");
    } finally {
      setLoading(false);
    }
  }, [authFetch, currentTab]);

  const fetchServicesAndCategories = useCallback(async () => {
    try {
      const [servicesRes, categoriesRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL}/marketplace/filters/services`),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/marketplace/filters/sub-categories`)
      ]);
      const [servicesData, categoriesData] = await Promise.all([
        servicesRes.json(),
        categoriesRes.json()
      ]);

      if (servicesData?.success) setServices(servicesData.data);
      if (categoriesData?.success) setCategories(categoriesData.data);
    } catch (error) {
      console.error("Failed to fetch marketplace data:", error);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    fetchServicesAndCategories();
  }, [fetchServicesAndCategories]);

  const openApproveDialog = (req) => {
    setSelectedRequest(req);
    setApproveType(req.requestedType || "skill");
    setParentServiceId("");
    setParentCategoryId("");
    setApproveDialogOpen(true);
  };

  const openRejectDialog = (req) => {
    setSelectedRequest(req);
    setRejectNote("");
    setRejectDialogOpen(true);
  };

  const handleApprove = async () => {
    if (approveType === "category" && !parentServiceId) {
      toast.error("Please select a parent Service.");
      return;
    }
    if (approveType === "skill" && !parentCategoryId) {
      toast.error("Please select a parent Category.");
      return;
    }

    setActionLoading(true);
    try {
      const parentId = approveType === "category" ? parentServiceId : parentCategoryId;
      const res = await authFetch(`/admin/user-requests/${selectedRequest.id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestType: approveType, parentId }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to approve request");
        return;
      }

      toast.success("Request approved successfully");
      setApproveDialogOpen(false);
      fetchRequests();
    } catch (error) {
      console.error("Failed to approve:", error);
      toast.error("An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      const res = await authFetch(`/admin/user-requests/${selectedRequest.id}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNote: rejectNote }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to reject request");
        return;
      }

      toast.success("Request rejected");
      setRejectDialogOpen(false);
      fetchRequests();
    } catch (error) {
      console.error("Failed to reject:", error);
      toast.error("An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-green-100 text-green-700 border-0">Approved</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-700 border-0">Rejected</Badge>;
      default:
        return <Badge className="bg-primary/10 text-primary border-0">Pending</Badge>;
    }
  };

  return (
    <>
      <AdminLayout>
        <div className="relative flex flex-col gap-6 p-6">
          <AdminTopBar label="User Requests" />

          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">User Skill/Category Requests</h1>
              <p className="mt-2 text-muted-foreground">
                Review and approve new skills or categories requested by users during onboarding.
              </p>
            </div>

            <Tabs defaultValue="all" value={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>

              <div className="rounded-md border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Requested Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Submitted By</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Resolution</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      [...Array(4)].map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><div className="h-4 w-40 animate-pulse rounded bg-muted" /></TableCell>
                          <TableCell><div className="h-4 w-20 animate-pulse rounded bg-muted" /></TableCell>
                          <TableCell><div className="h-4 w-32 animate-pulse rounded bg-muted" /></TableCell>
                          <TableCell><div className="h-4 w-20 animate-pulse rounded bg-muted" /></TableCell>
                          <TableCell><div className="h-4 w-32 animate-pulse rounded bg-muted" /></TableCell>
                          <TableCell><div className="h-4 w-24 animate-pulse rounded bg-muted" /></TableCell>
                          <TableCell><div className="ml-auto h-8 w-24 animate-pulse rounded bg-muted" /></TableCell>
                        </TableRow>
                      ))
                    ) : requests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          No requests found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      requests.map((req) => (
                        <TableRow key={req.id}>
                          <TableCell className="font-medium">{req.request}</TableCell>
                          <TableCell className="capitalize text-muted-foreground">{req.requestedType || "-"}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{req.user?.fullName}</p>
                              <p className="text-xs text-muted-foreground">{req.user?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(req.status)}</TableCell>
                          <TableCell>
                            {req.status === "APPROVED" && (
                              <span className="text-sm text-green-600">Approved as {req.approvedAsType}</span>
                            )}
                            {req.status === "REJECTED" && (
                              <span className="text-sm text-red-600 truncate max-w-[200px] block" title={req.adminNote}>
                                {req.adminNote || "No reason provided"}
                              </span>
                            )}
                            {req.status === "PENDING" && <span className="text-sm text-muted-foreground">-</span>}
                          </TableCell>
                          <TableCell className="text-sm">{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            {req.status === "PENDING" && (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 gap-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                  onClick={() => openRejectDialog(req)}
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  Reject
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="h-8 gap-1 bg-green-600 hover:bg-green-700"
                                  onClick={() => openApproveDialog(req)}
                                >
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  Approve
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Tabs>
          </div>
        </div>
      </AdminLayout>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Approve Request</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Requested Item</Label>
              <div className="p-3 bg-muted rounded-md font-medium">{selectedRequest?.request}</div>
            </div>

            <div className="space-y-3">
              <Label>Classify as</Label>
              <RadioGroup value={approveType} onValueChange={setApproveType} className="flex flex-col gap-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="skill" id="type-skill" />
                  <Label htmlFor="type-skill" className="font-normal cursor-pointer">Skill (Tool/Technology)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="category" id="type-category" />
                  <Label htmlFor="type-category" className="font-normal cursor-pointer">Category (Subcategory)</Label>
                </div>
              </RadioGroup>
            </div>

            {approveType === "skill" && (
              <div className="space-y-2">
                <Label>Parent Category</Label>
                <Select value={parentCategoryId} onValueChange={setParentCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a parent category..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">The skill will be added under this category.</p>
              </div>
            )}

            {approveType === "category" && (
              <div className="space-y-2">
                <Label>Parent Service Area</Label>
                <Select value={parentServiceId} onValueChange={setParentServiceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a parent service..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {services.map(s => (
                      <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">The category will be added under this main service.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm & Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Requested Item</Label>
              <div className="p-3 bg-muted rounded-md font-medium">{selectedRequest?.request}</div>
            </div>
            <div className="space-y-2">
              <Label>Reason (Optional)</Label>
              <Textarea 
                placeholder="E.g. Too broad, duplicate, etc." 
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminUserRequests;
