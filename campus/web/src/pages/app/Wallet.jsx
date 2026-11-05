import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import { ArrowDownLeft, ArrowUpRight, Banknote, Briefcase, Clock, Gift, GraduationCap, Receipt, Wallet as WalletIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api/client";
import { cn, formatDate, formatINR, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input, Skeleton } from "@/components/ui/primitives";
import { Dialog, DialogContent } from "@/components/ui/overlays";
import { EmptyState, ErrorState, PageHeader } from "@/components/ui/campus";
import { ChartTooltip, axisProps } from "@/components/earn/ChartTooltip";

const TXN = {
  GIG_EARNING: { label: "Gig earning", icon: ArrowDownLeft },
  BONUS: { label: "Bonus", icon: Gift },
  WITHDRAWAL: { label: "Withdrawal", icon: ArrowUpRight },
  COURSE_FEE_DEDUCTION: { label: "Course fees", icon: GraduationCap },
};
const FILTERS = [
  ["", "All"],
  ["GIG_EARNING", "Earnings"],
  ["BONUS", "Bonuses"],
  ["WITHDRAWAL", "Withdrawals"],
  ["COURSE_FEE_DEDUCTION", "Course fees"],
];
const UPI_RE = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,63}$/;

function WithdrawDialog({ open, onOpenChange, balance }) {
  const qc = useQueryClient();
  const { refreshUser } = useAuth();
  const [amount, setAmount] = useState("");
  const [upi, setUpi] = useState("");
  const [touched, setTouched] = useState(false);
  const amt = Math.floor(Number(amount));
  const amountError = !amount ? "Enter an amount" : !Number.isFinite(amt) || amt < 100 ? "Minimum withdrawal is ₹100" : amt > balance ? `You can withdraw up to ${formatINR(balance)}` : null;
  const upiError = !upi ? "Enter your UPI ID" : !UPI_RE.test(upi.trim()) ? "That doesn't look like a UPI ID (e.g. name@okaxis)" : null;

  const withdraw = useMutation({
    mutationFn: () => api.post("/api/wallet/withdraw", { amountINR: amt, upiId: upi.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      refreshUser().catch(() => {});
      toast.success(`${formatINR(amt)} is on its way to ${upi.trim()}.`);
      onOpenChange(false);
      setAmount("");
      setTouched(false);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Withdraw to UPI" description={`${formatINR(balance)} available. Usually arrives within 24 hours.`} size="sm">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setTouched(true);
            if (!amountError && !upiError) withdraw.mutate();
          }}
          noValidate
        >
          <Field label="Amount (₹)" htmlFor="wd-amount" error={touched ? amountError : null}>
            <Input id="wd-amount" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))} placeholder="500" leftIcon={Banknote} autoFocus />
          </Field>
          <div className="flex flex-wrap gap-2">
            {[100, 500, 1000].filter((v) => v <= balance).map((v) => (
              <button type="button" key={v} onClick={() => setAmount(String(v))} className={cn("rounded-full border px-3 py-1 text-xs transition-colors", amt === v ? "border-primary bg-primary-soft font-medium text-primary" : "border-line text-muted hover:text-fg")}>
                {formatINR(v)}
              </button>
            ))}
            {balance >= 100 && (
              <button type="button" onClick={() => setAmount(String(balance))} className={cn("rounded-full border px-3 py-1 text-xs transition-colors", amt === balance ? "border-primary bg-primary-soft font-medium text-primary" : "border-line text-muted hover:text-fg")}>
                All, {formatINR(balance)}
              </button>
            )}
          </div>
          <Field label="UPI ID" htmlFor="wd-upi" error={touched ? upiError : null} hint="GPay, PhonePe, Paytm or BHIM. Example: aarav@okaxis">
            <Input id="wd-upi" value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="yourname@bank" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
          </Field>
          <Button type="submit" className="w-full" size="lg" loading={withdraw.isPending}>
            Withdraw {amt >= 100 ? formatINR(amt) : ""}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function monthlyEarnings(transactions) {
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - i));
    return { key: `${d.getFullYear()}-${d.getMonth()}`, month: d.toLocaleDateString("en-IN", { month: "short" }), earned: 0 };
  });
  for (const t of transactions) {
    if (t.type !== "GIG_EARNING" && t.type !== "BONUS") continue;
    const d = new Date(t.createdAt);
    const m = months.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`);
    if (m) m.earned += t.amountINR;
  }
  return months;
}

export default function Wallet() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["wallet"], queryFn: () => api.get("/api/wallet") });
  const [filter, setFilter] = useState("");
  const [open, setOpen] = useState(false);
  const chart = useMemo(() => monthlyEarnings(data?.transactions || []), [data]);
  const txns = (data?.transactions || []).filter((t) => !filter || t.type === filter);
  const chartTotal = chart.reduce((n, m) => n + m.earned, 0);
  const pl = data?.payLater;
  const plPct = pl?.totalFeesINR ? Math.round((pl.deductedINR / pl.totalFeesINR) * 100) : 0;

  return (
    <div>
      <PageHeader
        eyebrow="Earn · Wallet"
        title="Your wallet"
        description="What you've earned on Campus, where it went, and what's on its way."
        actions={<Button to="/app/gigs" variant="brandOutline" leftIcon={Briefcase}>Find gigs</Button>}
      />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-2xl" />
          <div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-64 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div>
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <>
          {/* Balance */}
          <section className="rounded-2xl border border-line bg-surface p-5 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
              <div>
                <p className="flex items-center gap-2 text-sm text-muted"><WalletIcon className="size-4" strokeWidth={1.75} /> Available balance</p>
                <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mt-2 text-4xl font-medium tracking-tight tabular-nums sm:text-5xl">
                  {formatINR(data.balanceINR)}
                </motion.p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Button size="lg" leftIcon={ArrowUpRight} onClick={() => setOpen(true)} disabled={data.balanceINR < 100}>
                    Withdraw to UPI
                  </Button>
                  <span className="text-xs text-subtle">{data.balanceINR < 100 ? "You can withdraw once you have ₹100 or more." : "Usually arrives within 24 hours"}</span>
                </div>
              </div>
              <dl className="grid grid-cols-2 divide-x divide-line rounded-xl border border-line">
                <div className="p-4 sm:p-5">
                  <dt className="text-xs text-muted">Lifetime earned</dt>
                  <dd className="mt-1 text-xl font-medium tracking-tight tabular-nums sm:text-2xl">{formatINR(data.lifetimeEarnedINR)}</dd>
                </div>
                <div className="p-4 sm:p-5">
                  <dt className="text-xs text-muted">Pending</dt>
                  <dd className="mt-1 text-xl font-medium tracking-tight tabular-nums sm:text-2xl">{formatINR(data.pendingINR)}</dd>
                  <p className="mt-0.5 text-[11px] text-subtle">Withdrawals and approved gigs</p>
                </div>
              </dl>
            </div>
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            {/* Pay later meter */}
            <section className="flex flex-col rounded-2xl border border-line bg-surface p-5 sm:p-6">
              <p className="text-sm text-muted">Study now, pay later</p>
              {pl.totalFeesINR > 0 ? (
                <>
                  <h2 className="mt-1 text-xl font-medium tracking-tight sm:text-2xl">
                    {plPct}% of your fees paid
                  </h2>
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-label="Course fees paid" aria-valuenow={pl.deductedINR} aria-valuemin={0} aria-valuemax={pl.totalFeesINR}>
                    <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: `${plPct}%` }} transition={{ duration: 0.9, ease: "easeOut" }} />
                  </div>
                  <dl className="mt-5 grid grid-cols-3 gap-3">
                    {[
                      ["Total fees", pl.totalFeesINR],
                      ["Paid", pl.deductedINR],
                      ["Remaining", pl.remainingINR],
                    ].map(([label, v]) => (
                      <div key={label}>
                        <dt className="text-xs text-muted">{label}</dt>
                        <dd className="mt-0.5 text-base font-medium tabular-nums">{formatINR(v)}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-5 border-t border-line pt-4 text-sm text-muted">
                    {pl.remainingINR > 0 ? (
                      <>
                        {pl.deductionPercent}% of each gig payout goes to your fees. About <span className="font-medium text-fg">{formatINR(Math.ceil(pl.remainingINR / (pl.deductionPercent / 100)))}</span> more in gigs and you're fully paid up.
                      </>
                    ) : (
                      "Fees fully paid. Every rupee you earn is now yours."
                    )}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-muted">No course fees due. When you enroll in a pay-later course, {pl.deductionPercent}% of gig payouts will go towards it.</p>
              )}
            </section>

            {/* Chart */}
            <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <p className="text-sm text-muted">Earnings, last 6 months</p>
                  <h2 className="mt-1 text-xl font-medium tracking-tight tabular-nums sm:text-2xl">{formatINR(chartTotal)}</h2>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted"><span className="size-2 rounded-full bg-primary" /> Gig payouts and bonuses</span>
              </div>
              <div className="mt-5 h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart} margin={{ top: 4, right: 0, left: -8, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="var(--line)" />
                    <XAxis dataKey="month" {...axisProps} />
                    <YAxis {...axisProps} tickFormatter={(v) => `₹${v >= 1000 ? `${v / 1000}k` : v}`} width={44} />
                    <RTooltip cursor={{ fill: "var(--surface-2)" }} content={<ChartTooltip format={formatINR} unit="earned" />} />
                    <Bar dataKey="earned" name="earned" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={32} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          {/* Transactions */}
          <section className="mt-6 rounded-2xl border border-line bg-surface">
            <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <h2 className="text-base font-medium">Transactions</h2>
              <div className="scrollbar-none -mx-1 flex gap-1.5 overflow-x-auto px-1">
                {FILTERS.map(([k, label]) => (
                  <button
                    key={k || "all"}
                    onClick={() => setFilter(k)}
                    aria-pressed={filter === k}
                    className={cn("shrink-0 rounded-full border px-3 py-1 text-xs transition-colors", filter === k ? "border-primary bg-primary-soft font-medium text-primary" : "border-line text-muted hover:text-fg")}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {!txns.length ? (
              <EmptyState className="mx-5 mb-5 sm:mx-6 sm:mb-6" icon={Receipt} title={filter ? "Nothing here yet" : "No transactions yet"} description="Complete your first micro-gig and your earnings will show up here." action={<Button to="/app/gigs" size="sm">Find a gig</Button>} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="hidden border-y border-line bg-surface-2/60 text-left text-xs text-muted sm:table-header-group">
                    <tr>
                      <th scope="col" className="px-6 py-2.5 font-normal">Description</th>
                      <th scope="col" className="px-3 py-2.5 font-normal">Type</th>
                      <th scope="col" className="px-3 py-2.5 font-normal">Date</th>
                      <th scope="col" className="px-6 py-2.5 text-right font-normal">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line border-t border-line sm:border-t-0">
                    {txns.map((t) => {
                      const m = TXN[t.type] || TXN.BONUS;
                      const Icon = m.icon;
                      return (
                        <tr key={t.id} className="align-middle">
                          <td className="px-5 py-3.5 sm:px-6">
                            <div className="flex items-center gap-3">
                              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted"><Icon className="size-3.5" strokeWidth={1.75} /></span>
                              <div className="min-w-0">
                                <p className="text-fg">{t.note}</p>
                                <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted sm:hidden">
                                  {m.label} · {timeAgo(t.createdAt)}
                                  {t.status === "PENDING" && <PendingPill />}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="hidden px-3 py-3.5 whitespace-nowrap text-muted sm:table-cell">
                            <span className="inline-flex items-center gap-2">
                              {m.label}
                              {t.status === "PENDING" && <PendingPill />}
                            </span>
                          </td>
                          <td className="hidden px-3 py-3.5 whitespace-nowrap text-muted sm:table-cell" title={formatDate(t.createdAt)}>{timeAgo(t.createdAt)}</td>
                          <td className={cn("px-5 py-3.5 text-right font-medium whitespace-nowrap tabular-nums sm:px-6", t.amountINR > 0 ? "text-success" : "text-fg")}>
                            {t.amountINR > 0 ? "+" : "−"}{formatINR(Math.abs(t.amountINR))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <WithdrawDialog open={open} onOpenChange={setOpen} balance={data.balanceINR} />
        </>
      )}
    </div>
  );
}

function PendingPill() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-px text-[11px] text-warning">
      <Clock className="size-3" /> Pending
    </span>
  );
}
