import React, { useCallback, useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { AdminTopBar } from "./AdminTopBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/shared/context/AuthContext";
import { getSession } from "@/shared/lib/auth-storage";
import { formatINR } from "@/shared/lib/currency";
import { toast } from "sonner";
import Check from "lucide-react/dist/esm/icons/check";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Clock from "lucide-react/dist/esm/icons/clock";
import DollarSign from "lucide-react/dist/esm/icons/dollar-sign";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import QrCode from "lucide-react/dist/esm/icons/qr-code";
import Search from "lucide-react/dist/esm/icons/search";
import X from "lucide-react/dist/esm/icons/x";
import XCircle from "lucide-react/dist/esm/icons/x-circle";
import Landmark from "lucide-react/dist/esm/icons/landmark";
import User from "lucide-react/dist/esm/icons/user";
import Eye from "lucide-react/dist/esm/icons/eye";
import Copy from "lucide-react/dist/esm/icons/copy";

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

export const AdminPayoutRequestsContent = () => {
  const { authFetch, isAuthenticated, token, user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState(null);

  // Rejection modal
  const [rejectingReq, setRejectingReq] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  // Details modal (QR Code / Full Info)
  const [selectedReq, setSelectedReq] = useState(null);

  const fetchPayoutRequests = useCallback(async () => {
    setLoading(true);
    try {
      const url = statusFilter !== "ALL"
        ? `/admin/payout-requests?status=${statusFilter}`
        : "/admin/payout-requests";
      const response = await authFetch(url);
      const data = await response.json();

      if (response.ok && Array.isArray(data?.data)) {
        setRequests(data.data);
      } else {
        toast.error(data?.message || "Failed to fetch payout requests");
      }
    } catch (err) {
      console.error("Error fetching payout requests:", err);
      toast.error("Failed to load payout requests");
    } finally {
      setLoading(false);
    }
  }, [authFetch, statusFilter]);

  useEffect(() => {
    const hasToken = token || getSession()?.accessToken;
    if (hasToken) {
      fetchPayoutRequests();
    }
  }, [fetchPayoutRequests, isAuthenticated, token]);

  const handleUpdateStatus = async (id, newStatus, adminNote = "") => {
    setProcessingId(id);
    try {
      const response = await authFetch(`/admin/payout-requests/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, adminNote })
      });
      const data = await response.json();

      if (response.ok) {
        toast.success(data?.message || `Payout request marked as ${newStatus}`);
        if (rejectingReq) {
          setRejectingReq(null);
          setRejectReason("");
        }
        fetchPayoutRequests();
      } else {
        toast.error(data?.message || "Failed to update request status");
      }
    } catch (err) {
      console.error("Error updating payout request status:", err);
      toast.error("Error updating status");
    } finally {
      setProcessingId(null);
    }
  };

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const filteredRequests = requests.filter((req) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      req.freelancer?.fullName?.toLowerCase().includes(q) ||
      req.freelancer?.email?.toLowerCase().includes(q) ||
      req.project?.title?.toLowerCase().includes(q) ||
      req.upiId?.toLowerCase().includes(q) ||
      req.accountNumber?.toLowerCase().includes(q)
    );
  });

  const totalPendingCount = requests.filter((r) => r.status === "PENDING").length;
  const totalApprovedCount = requests.filter((r) => r.status === "APPROVED").length;
  const totalPaidCount = requests.filter((r) => r.status === "PAID").length;
  const totalPaidAmount = requests
    .filter((r) => r.status === "PAID")
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-[22px] border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Requests
            </CardTitle>
            <DollarSign className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requests.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Submitted freelancer payout requests</p>
          </CardContent>
        </Card>

        <Card className="rounded-[22px] border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pending Action
            </CardTitle>
            <Clock className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{totalPendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting admin review & approval</p>
          </CardContent>
        </Card>

        <Card className="rounded-[22px] border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Approved / Ready
            </CardTitle>
            <Check className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalApprovedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Approved, pending payment execution</p>
          </CardContent>
        </Card>

        <Card className="rounded-[22px] border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Paid Out
            </CardTitle>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatINR(totalPaidAmount)}</div>
            <p className="text-xs text-muted-foreground mt-1">{totalPaidCount} requests completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="rounded-[24px] border-border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl font-bold">Freelancer Payout Requests</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Review payment details (UPI ID, QR Code image, Bank Account) and process money requests.
              </p>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[200px]">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search freelancer, UPI, project..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center rounded-xl bg-muted p-1 text-xs">
                {["ALL", "PENDING", "APPROVED", "REJECTED", "PAID"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-lg px-3 py-1.5 font-semibold transition-colors ${
                      statusFilter === status
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No payout requests found for status "{statusFilter}".
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Freelancer</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Project & Date</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Amount</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">UPI / QR Code</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Bank Details</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Status</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/60">
                  {filteredRequests.map((req) => (
                    <TableRow key={req.id} className="hover:bg-muted/30 transition-colors">
                      {/* Freelancer Column */}
                      <TableCell className="align-top py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden shrink-0">
                            {req.freelancer?.avatar ? (
                              <img src={req.freelancer.avatar} alt="" className="size-full object-cover" />
                            ) : (
                              req.freelancer?.fullName?.[0]?.toUpperCase() || <User className="size-4" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">{req.freelancer?.fullName || "Freelancer"}</p>
                            <p className="text-xs text-muted-foreground">{req.freelancer?.email}</p>
                            {req.freelancer?.phone && (
                              <p className="text-[11px] text-muted-foreground">{req.freelancer.phone}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Project Column */}
                      <TableCell className="align-top py-4">
                        <p className="text-sm font-semibold text-foreground">
                          {req.project?.title || "General Withdrawal"}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(req.createdAt)}</p>
                        {req.notes && (
                          <p className="mt-1 text-xs italic text-muted-foreground/90 max-w-xs truncate">
                            "{req.notes}"
                          </p>
                        )}
                      </TableCell>

                      {/* Amount Column */}
                      <TableCell className="align-top py-4 font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatINR(req.amount)}
                      </TableCell>

                      {/* UPI / QR Code Column */}
                      <TableCell className="align-top py-4">
                        {req.upiId ? (
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="font-semibold text-xs text-foreground font-mono bg-muted/60 px-2 py-0.5 rounded border border-border/40">
                              {req.upiId}
                            </span>
                            <button
                              onClick={() => copyToClipboard(req.upiId, "UPI ID")}
                              className="text-muted-foreground hover:text-primary p-1"
                              title="Copy UPI ID"
                            >
                              <Copy className="size-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No UPI ID</span>
                        )}

                        {req.upiQrCode ? (
                          <button
                            onClick={() => setSelectedReq(req)}
                            className="mt-1 flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                          >
                            <QrCode className="size-3.5" /> View QR Code
                          </button>
                        ) : null}
                      </TableCell>

                      {/* Bank Details Column */}
                      <TableCell className="align-top py-4 text-xs">
                        {req.accountNumber ? (
                          <div className="space-y-0.5">
                            <p className="font-semibold text-foreground">
                              {req.bankName || "Bank"}
                            </p>
                            <p className="font-mono text-muted-foreground">
                              A/C: {req.accountNumber}
                            </p>
                            <p className="font-mono text-muted-foreground">
                              IFSC: {req.ifscCode}
                            </p>
                            {req.accountHolderName && (
                              <p className="text-[11px] text-muted-foreground">
                                Holder: {req.accountHolderName}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No Bank Info</span>
                        )}
                      </TableCell>

                      {/* Status Column */}
                      <TableCell className="align-top py-4">
                        {req.status === "PAID" && (
                          <Badge className="border-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold px-2.5 py-1">
                            <CheckCircle2 className="mr-1 size-3.5" /> Paid
                          </Badge>
                        )}
                        {req.status === "APPROVED" && (
                          <Badge className="border-0 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold px-2.5 py-1">
                            <Check className="mr-1 size-3.5" /> Approved
                          </Badge>
                        )}
                        {req.status === "REJECTED" && (
                          <Badge className="border-0 bg-red-500/10 text-red-600 dark:text-red-400 font-semibold px-2.5 py-1">
                            <XCircle className="mr-1 size-3.5" /> Rejected
                          </Badge>
                        )}
                        {req.status === "PENDING" && (
                          <Badge className="border-0 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold px-2.5 py-1">
                            <Clock className="mr-1 size-3.5 animate-pulse" /> Pending
                          </Badge>
                        )}

                        {req.adminNote && (
                          <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2 max-w-xs">
                            Note: {req.adminNote}
                          </p>
                        )}
                      </TableCell>

                      {/* Actions Column */}
                      <TableCell className="align-top py-4 text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          <button
                            onClick={() => setSelectedReq(req)}
                            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium mb-1"
                          >
                            <Eye className="size-3.5" /> Details
                          </button>

                          {req.status === "PENDING" && (
                            <div className="flex items-center gap-1.5">
                              <Button
                                size="sm"
                                disabled={processingId === req.id}
                                onClick={() => handleUpdateStatus(req.id, "APPROVED")}
                                className="h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3"
                              >
                                {processingId === req.id ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  "Approve"
                                )}
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                disabled={processingId === req.id}
                                onClick={() => {
                                  setRejectingReq(req);
                                  setRejectReason("");
                                }}
                                className="h-8 rounded-lg border-red-500/40 text-red-600 hover:bg-red-50 text-xs px-3"
                              >
                                Reject
                              </Button>
                            </div>
                          )}

                          {(req.status === "PENDING" || req.status === "APPROVED") && (
                            <Button
                              size="sm"
                              disabled={processingId === req.id}
                              onClick={() => handleUpdateStatus(req.id, "PAID")}
                              className="h-8 w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 mt-1"
                            >
                              {processingId === req.id ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="mr-1 size-3.5" />
                              )}
                              Mark as Paid
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Reason Dialog */}
      {rejectingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[24px] border border-border bg-card p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-foreground mb-1">Reject Payout Request</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Rejecting request of <strong>{formatINR(rejectingReq.amount)}</strong> for {rejectingReq.freelancer?.fullName}.
            </p>

            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Reason / Admin Note
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Invalid bank account details or pending project milestone verification"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full rounded-[12px] border border-border bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <div className="flex items-center justify-end gap-3 mt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRejectingReq(null)}
                className="h-10 rounded-[12px]"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => handleUpdateStatus(rejectingReq.id, "REJECTED", rejectReason)}
                disabled={processingId === rejectingReq.id}
                className="h-10 rounded-[12px] bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                {processingId === rejectingReq.id ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : null}
                Confirm Reject
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Modal View (with QR Code Preview) */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-[24px] border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-xl font-bold text-foreground">Payout Request Details</h3>
                <p className="text-xs text-muted-foreground">ID: {selectedReq.id}</p>
              </div>
              <button
                onClick={() => setSelectedReq(null)}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Freelancer & Project Info */}
              <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4 text-xs">
                <p className="font-bold text-sm text-foreground border-b border-border pb-2">Freelancer Profile</p>
                <p><strong className="text-muted-foreground">Name:</strong> {selectedReq.freelancer?.fullName}</p>
                <p><strong className="text-muted-foreground">Email:</strong> {selectedReq.freelancer?.email}</p>
                <p><strong className="text-muted-foreground">Phone:</strong> {selectedReq.freelancer?.phone || "-"}</p>
                <p><strong className="text-muted-foreground">Project:</strong> {selectedReq.project?.title || "General"}</p>
                <p><strong className="text-muted-foreground">Amount:</strong> <span className="font-bold text-emerald-600">{formatINR(selectedReq.amount)}</span></p>
                <p><strong className="text-muted-foreground">Requested On:</strong> {formatDateTime(selectedReq.createdAt)}</p>
              </div>

              {/* QR Code Preview */}
              <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-muted/20 p-4 text-center">
                <p className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">UPI QR Code Image</p>
                {selectedReq.upiQrCode ? (
                  <div className="size-48 rounded-xl border border-border bg-white p-2 shadow-sm overflow-hidden flex items-center justify-center">
                    <img src={selectedReq.upiQrCode} alt="UPI QR Code" className="max-h-full max-w-full object-contain" />
                  </div>
                ) : (
                  <div className="size-48 rounded-xl border border-dashed border-border bg-card flex flex-col items-center justify-center text-muted-foreground p-4">
                    <QrCode className="size-12 opacity-30 mb-2" />
                    <p className="text-xs">No QR Code Image Uploaded</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Details Snapshot */}
            <div className="rounded-2xl border border-border bg-muted/30 p-4 text-xs space-y-2">
              <p className="font-bold text-sm text-foreground border-b border-border pb-2">Bank & UPI Payment Information</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <p className="text-muted-foreground font-medium">UPI ID (VPA):</p>
                  <p className="font-mono font-bold text-sm text-primary flex items-center gap-2 mt-0.5">
                    {selectedReq.upiId || "-"}
                    {selectedReq.upiId && (
                      <button onClick={() => copyToClipboard(selectedReq.upiId, "UPI ID")} className="text-muted-foreground hover:text-foreground">
                        <Copy className="size-3.5" />
                      </button>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium">Account Holder Name:</p>
                  <p className="font-semibold text-foreground mt-0.5">{selectedReq.accountHolderName || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium">Bank Name & Branch:</p>
                  <p className="font-semibold text-foreground mt-0.5">{selectedReq.bankName || "-"} {selectedReq.bankBranch ? `(${selectedReq.bankBranch})` : ""}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium">Account Number & IFSC:</p>
                  <p className="font-mono font-semibold text-foreground mt-0.5">
                    {selectedReq.accountNumber || "-"} | {selectedReq.ifscCode || "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {selectedReq.status === "PENDING" && (
                <>
                  <Button
                    type="button"
                    onClick={() => {
                      handleUpdateStatus(selectedReq.id, "APPROVED");
                      setSelectedReq(null);
                    }}
                    className="h-10 rounded-[12px] bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    Approve Request
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      handleUpdateStatus(selectedReq.id, "PAID");
                      setSelectedReq(null);
                    }}
                    className="h-10 rounded-[12px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    Mark as Paid
                  </Button>
                </>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedReq(null)}
                className="h-10 rounded-[12px]"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminPayoutRequests = () => {
  return (
    <AdminLayout>
      <div className="min-h-screen bg-background p-4 md:p-8 lg:p-10 space-y-6">
        <AdminTopBar label="Payout Requests" />
        <AdminPayoutRequestsContent />
      </div>
    </AdminLayout>
  );
};

export default AdminPayoutRequests;
