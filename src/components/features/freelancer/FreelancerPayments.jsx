"use client";

import React, { useEffect, useMemo, useState } from "react";
import Wallet from "lucide-react/dist/esm/icons/wallet";
import CircleDollarSign from "lucide-react/dist/esm/icons/circle-dollar-sign";
import Clock3 from "lucide-react/dist/esm/icons/clock-3";
import BriefcaseBusiness from "lucide-react/dist/esm/icons/briefcase-business";
import ArrowDownLeft from "lucide-react/dist/esm/icons/arrow-down-left";
import { RoleAwareSidebar } from "@/components/layout/RoleAwareSidebar";
import { FreelancerTopBar } from "@/components/features/freelancer/FreelancerTopBar";
import { useAuth } from "@/shared/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const toUpper = (value = "") => String(value).trim().toUpperCase();

const metricCardClass =
  "border border-border/60 bg-card/80 shadow-[0_12px_45px_-35px_rgba(0,0,0,0.8)]";

const getDateLabel = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(date);
};

const PaymentRowStatus = ({ isCompleted }) => {
  if (isCompleted) {
    return (
      <Badge
        variant="outline"
        className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
      >
        Received
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="border-amber-500/30 bg-amber-500/10 text-amber-500"
    >
      Pending
    </Badge>
  );
};

const FreelancerPaymentsContent = () => {
  const { authFetch, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({
    totalShare: 0,
    receivedShare: 0,
    pendingShare: 0,
    activeContracts: 0,
  });

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadPayments = async () => {
      setIsLoading(true);
      try {
        const response = await authFetch("/proposals?as=freelancer");
        const payload = await response.json().catch(() => null);
        const list = Array.isArray(payload?.data) ? payload.data : [];

        const accepted = list.filter(
          (proposal) => toUpper(proposal.status) === "ACCEPTED"
        );

        const mappedRows = accepted
          .map((proposal) => {
            const gross = Number(proposal.amount) || 0;
            const share = Math.round(gross * 0.7);
            const projectStatus = toUpper(proposal.project?.status);
            const completed = projectStatus === "COMPLETED";

            return {
              id: proposal.id,
              projectTitle: proposal.project?.title || "Untitled Project",
              clientName:
                proposal.project?.owner?.fullName ||
                proposal.project?.owner?.name ||
                proposal.client?.fullName ||
                "Client",
              grossAmount: gross,
              freelancerShare: share,
              receivedAmount: completed ? share : 0,
              pendingAmount: completed ? 0 : share,
              isCompleted: completed,
              updatedAt:
                proposal.project?.updatedAt ||
                proposal.updatedAt ||
                proposal.createdAt ||
                null,
            };
          })
          .sort(
            (a, b) =>
              new Date(b.updatedAt || 0).getTime() -
              new Date(a.updatedAt || 0).getTime()
          );

        const totals = mappedRows.reduce(
          (acc, row) => {
            acc.totalShare += row.freelancerShare;
            acc.receivedShare += row.receivedAmount;
            acc.pendingShare += row.pendingAmount;
            if (!row.isCompleted) acc.activeContracts += 1;
            return acc;
          },
          {
            totalShare: 0,
            receivedShare: 0,
            pendingShare: 0,
            activeContracts: 0,
          }
        );

        setRows(mappedRows);
        setSummary(totals);
      } catch (error) {
        console.error("Failed to load freelancer payments", error);
        setRows([]);
        setSummary({
          totalShare: 0,
          receivedShare: 0,
          pendingShare: 0,
          activeContracts: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPayments();
  }, [authFetch, isAuthenticated]);

  const paymentCountLabel = useMemo(() => {
    const count = rows.length;
    if (count === 1) return "1 payout";
    return `${count} payouts`;
  }, [rows.length]);

  return (
    <div className="flex-1 flex flex-col relative h-full overflow-hidden bg-secondary transition-colors duration-300">
      <FreelancerTopBar label="Payments" />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 z-10 relative scroll-smooth">
        <div className="max-w-[1600px] mx-auto space-y-6">
          <header className="space-y-2">
            <p className="text-sm uppercase tracking-[0.35em] text-primary/70">
              Earnings & payouts
            </p>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              Payments
            </h1>
            <p className="text-sm text-muted-foreground">
              Track received payments, pending payouts, and project value.
            </p>
          </header>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className={metricCardClass}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                    Total share
                  </p>
                  <Wallet className="h-4 w-4 text-primary" />
                </div>
                {isLoading ? (
                  <Skeleton className="mt-4 h-8 w-36" />
                ) : (
                  <p className="mt-4 text-2xl font-black text-foreground">
                    {formatCurrency(summary.totalShare)}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className={metricCardClass}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                    Received
                  </p>
                  <CircleDollarSign className="h-4 w-4 text-emerald-500" />
                </div>
                {isLoading ? (
                  <Skeleton className="mt-4 h-8 w-36" />
                ) : (
                  <p className="mt-4 text-2xl font-black text-foreground">
                    {formatCurrency(summary.receivedShare)}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className={metricCardClass}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                    Pending
                  </p>
                  <Clock3 className="h-4 w-4 text-amber-500" />
                </div>
                {isLoading ? (
                  <Skeleton className="mt-4 h-8 w-36" />
                ) : (
                  <p className="mt-4 text-2xl font-black text-foreground">
                    {formatCurrency(summary.pendingShare)}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className={metricCardClass}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                    Active projects
                  </p>
                  <BriefcaseBusiness className="h-4 w-4 text-blue-500" />
                </div>
                {isLoading ? (
                  <Skeleton className="mt-4 h-8 w-24" />
                ) : (
                  <p className="mt-4 text-2xl font-black text-foreground">
                    {summary.activeContracts}
                  </p>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-[0_12px_50px_-40px_rgba(0,0,0,0.85)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Payment History
                </h2>
                <p className="text-sm text-muted-foreground">
                  Net payout reflects your 70% share.
                </p>
              </div>
              <Badge variant="secondary" className="gap-2">
                <ArrowDownLeft className="h-3.5 w-3.5" />
                {paymentCountLabel}
              </Badge>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : rows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 bg-card/40 px-4 py-8 text-center text-sm text-muted-foreground">
                No payment records yet. Accepted projects will appear here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-border/70 text-left text-xs uppercase tracking-[0.22em] text-muted-foreground">
                      <th className="px-2 py-3 font-semibold">Project</th>
                      <th className="px-2 py-3 font-semibold">Client</th>
                      <th className="px-2 py-3 font-semibold">Gross</th>
                      <th className="px-2 py-3 font-semibold">Your Share</th>
                      <th className="px-2 py-3 font-semibold">Status</th>
                      <th className="px-2 py-3 font-semibold">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-border/40 last:border-b-0"
                      >
                        <td className="px-2 py-3">
                          <p className="font-medium text-foreground">
                            {row.projectTitle}
                          </p>
                        </td>
                        <td className="px-2 py-3 text-muted-foreground">
                          {row.clientName}
                        </td>
                        <td className="px-2 py-3 text-muted-foreground">
                          {formatCurrency(row.grossAmount)}
                        </td>
                        <td className="px-2 py-3 font-semibold text-foreground">
                          {formatCurrency(row.freelancerShare)}
                        </td>
                        <td className="px-2 py-3">
                          <PaymentRowStatus isCompleted={row.isCompleted} />
                        </td>
                        <td className="px-2 py-3 text-muted-foreground">
                          {getDateLabel(row.updatedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

const FreelancerPayments = () => {
  return (
    <RoleAwareSidebar>
      <FreelancerPaymentsContent />
    </RoleAwareSidebar>
  );
};

export default FreelancerPayments;

