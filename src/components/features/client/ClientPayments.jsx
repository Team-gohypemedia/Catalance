"use client";

import React, { useEffect, useMemo, useState } from "react";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import Wallet from "lucide-react/dist/esm/icons/wallet";
import Landmark from "lucide-react/dist/esm/icons/landmark";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Download from "lucide-react/dist/esm/icons/download";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import Plus from "lucide-react/dist/esm/icons/plus";
import { RoleAwareSidebar } from "@/components/layout/RoleAwareSidebar";
import ClientDashboardFooter from "@/components/features/client/ClientDashboardFooter";
import { ClientTopBar } from "@/components/features/client/ClientTopBar";
import { useAuth } from "@/shared/context/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { processProjectInstallmentPayment } from "@/shared/lib/project-payment";

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const createReceiptFileName = (projectTitle = "", invoiceId = "") => {
  const safeTitle = String(projectTitle || "project")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `catalance-receipt-${safeTitle || "project"}-${invoiceId || "invoice"}.txt`;
};

const downloadReceipt = (invoice) => {
  const issuedAt = invoice?.issuedAt
    ? new Date(invoice.issuedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })
    : "-";
  const receiptContent = [
    "Catalance Receipt",
    "-----------------",
    `Invoice ID: ${invoice.id}`,
    `Project: ${invoice.projectTitle}`,
    `Installment: ${invoice.installmentLabel}`,
    `Issued On: ${issuedAt}`,
    `Status: ${invoice.statusLabel}`,
    `Scheduled Amount: ${formatCurrency(invoice.amountDue)}`,
    `Amount Paid: ${formatCurrency(invoice.amountPaid)}`,
    `Held in Escrow: ${formatCurrency(invoice.escrowHeld)}`,
  ].join("\n");

  const blob = new Blob([receiptContent], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = createReceiptFileName(invoice.projectTitle, invoice.id);
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

const BillingMetric = ({ title, value, hint, icon: Icon }) => (
  <Card className="border-border/60 bg-card/70 backdrop-blur-sm">
    <CardContent className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
          {title}
        </p>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-3 text-2xl font-black text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </CardContent>
  </Card>
);

const ClientPaymentsContent = () => {
  const { authFetch, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [processingInvoiceId, setProcessingInvoiceId] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    const loadProjects = async () => {
      setIsLoading(true);
      try {
        const res = await authFetch("/projects");
        const payload = await res.json().catch(() => null);
        if (!isMounted) return;
        setProjects(Array.isArray(payload?.data) ? payload.data : []);
      } catch (error) {
        console.error("Failed to load client billing projects", error);
        if (isMounted) setProjects([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadProjects();
    return () => {
      isMounted = false;
    };
  }, [authFetch, isAuthenticated]);

  const invoices = useMemo(() => {
    return projects
      .filter((project) =>
        Array.isArray(project.proposals)
          ? project.proposals.some((proposal) => proposal.status === "ACCEPTED")
          : false
      )
      .flatMap((project) => {
        const paymentPlan =
          project.paymentPlan && typeof project.paymentPlan === "object"
            ? project.paymentPlan
            : null;
        const installments = Array.isArray(paymentPlan?.installments)
          ? paymentPlan.installments
          : [];
        const projectStatus = String(project.status || "").toUpperCase();

        return installments.map((installment) => {
          const isPaid = Boolean(installment.isPaid);
          const isDue = Boolean(installment.isDue);

          return {
            id: `${project.id}-${installment.sequence}`,
            projectId: project.id,
            projectTitle: project.title || "Untitled Project",
            installmentLabel: `${installment.label} (${installment.percentage}%)`,
            issuedAt: project.updatedAt || project.createdAt,
            amountDue: installment.amount,
            amountPaid: isPaid ? installment.amount : 0,
            escrowHeld: isPaid && projectStatus !== "COMPLETED" ? installment.amount : 0,
            statusLabel: isPaid ? "Paid" : isDue ? "Due now" : "Scheduled",
            awaiting: isDue,
            isPaid,
            isDue,
          };
        });
      })
      .sort(
        (a, b) =>
          new Date(b.issuedAt || 0).getTime() - new Date(a.issuedAt || 0).getTime()
      );
  }, [projects]);

  const billingSummary = useMemo(() => {
    return invoices.reduce(
      (acc, invoice) => {
        acc.totalPaid += invoice.amountPaid;
        acc.totalEscrow += invoice.escrowHeld;
        acc.dueNow += invoice.isDue ? invoice.amountDue : 0;
        return acc;
      },
      { totalPaid: 0, totalEscrow: 0, dueNow: 0 }
    );
  }, [invoices]);

  const handleOpenCustomerPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await authFetch("/payments/customer-portal", { method: "POST" });
      const payload = await res.json().catch(() => null);
      const portalUrl = payload?.data?.url || payload?.url;

      if (res.ok && portalUrl) {
        window.open(portalUrl, "_blank", "noopener,noreferrer");
        return;
      }
      toast.info(
        "Customer portal endpoint is not wired yet. Integrate Stripe portal URL to enable it."
      );
    } catch (error) {
      console.error("Failed to open billing portal", error);
      toast.info(
        "Customer portal endpoint is not wired yet. Integrate Stripe portal URL to enable it."
      );
    } finally {
      setPortalLoading(false);
    }
  };

  const handlePayInstallment = async (invoice) => {
    if (!invoice?.projectId) return;

    setProcessingInvoiceId(invoice.id);
    try {
      const paymentResult = await processProjectInstallmentPayment({
        authFetch,
        projectId: invoice.projectId,
        description: `${invoice.installmentLabel} for ${invoice.projectTitle}`,
      });

      toast.success(paymentResult?.message || "Payment completed successfully.");

      const res = await authFetch("/projects");
      const payload = await res.json().catch(() => null);
      setProjects(Array.isArray(payload?.data) ? payload.data : []);
    } catch (error) {
      console.error("Failed to process installment payment", error);
      toast.error(error?.message || "Failed to process payment");
    } finally {
      setProcessingInvoiceId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative h-full overflow-hidden bg-background transition-colors duration-300">
      <ClientTopBar label="Billing" />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 z-10 relative scroll-smooth">
        <div className="max-w-[1600px] mx-auto space-y-6">
          <header className="space-y-2">
            <p className="text-sm uppercase tracking-[0.35em] text-primary/70">
              Installments & escrow
            </p>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              Billing Hub
            </h1>
            <p className="text-sm text-muted-foreground">
              Projects now follow a 20% start payment, 40% after phase 2, and the final 40% after phase 4.
            </p>
          </header>

          {isLoading ? (
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </section>
          ) : (
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <BillingMetric
                title="Funds in escrow"
                value={formatCurrency(billingSummary.totalEscrow)}
                hint="Paid installments currently held against active projects."
                icon={Wallet}
              />
              <BillingMetric
                title="Total paid"
                value={formatCurrency(billingSummary.totalPaid)}
                hint="All completed client installments across accepted projects."
                icon={Landmark}
              />
              <BillingMetric
                title="Due now"
                value={formatCurrency(billingSummary.dueNow)}
                hint="Installments currently ready for payment."
                icon={ShieldCheck}
              />
            </section>
          )}

          <section className="grid gap-4 lg:grid-cols-[360px_1fr]">
            <Card className="border-border/60 bg-card/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Payment Methods
                </CardTitle>
                <CardDescription>
                  Connect and manage cards in your secure customer billing portal.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2">
                  <p className="text-sm font-semibold text-foreground">Visa ending in 4242</p>
                  <p className="text-xs text-muted-foreground">Default card for marketplace payments</p>
                </div>
                <div className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2">
                  <p className="text-sm font-semibold text-foreground">Mastercard ending in 1881</p>
                  <p className="text-xs text-muted-foreground">Backup card</p>
                </div>
                <Button
                  variant="outline"
                  className="w-full justify-center gap-2"
                  onClick={handleOpenCustomerPortal}
                  disabled={portalLoading}
                >
                  {portalLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4" />
                  )}
                  Open Customer Portal
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-center gap-2 text-muted-foreground"
                  onClick={() =>
                    toast.info("Use the billing portal to add and remove cards securely.")
                  }
                >
                  <Plus className="h-4 w-4" />
                  Add New Card
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Installment Schedule
                </CardTitle>
                <CardDescription>
                  Track the 20/40/40 payment schedule for each accepted project.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      No installments yet. Accepted projects will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {invoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-3"
                      >
                        <div className="min-w-[220px]">
                          <p className="text-sm font-semibold text-foreground">
                            {invoice.projectTitle}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {invoice.installmentLabel}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {invoice.issuedAt
                              ? new Date(invoice.issuedAt).toLocaleDateString("en-IN", {
                                  dateStyle: "medium",
                                })
                              : "-"}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-sm font-semibold text-foreground">
                            {formatCurrency(invoice.amountDue)}
                          </p>
                          <Badge variant={invoice.awaiting ? "secondary" : "outline"}>
                            {invoice.statusLabel}
                          </Badge>
                          {invoice.isDue ? (
                            <Button
                              size="sm"
                              className="gap-2"
                              disabled={processingInvoiceId === invoice.id}
                              onClick={() => handlePayInstallment(invoice)}
                            >
                              {processingInvoiceId === invoice.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CreditCard className="h-3.5 w-3.5" />
                              )}
                              {processingInvoiceId === invoice.id ? "Processing..." : "Pay now"}
                            </Button>
                          ) : invoice.isPaid ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2"
                              onClick={() => downloadReceipt(invoice)}
                            >
                              <Download className="h-3.5 w-3.5" />
                              Receipt
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <ClientDashboardFooter />
        </div>
      </main>
    </div>
  );
};

const ClientPayments = () => (
  <RoleAwareSidebar>
    <ClientPaymentsContent />
  </RoleAwareSidebar>
);

export default ClientPayments;
