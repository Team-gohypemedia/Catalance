import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ExternalLink,
  Loader2,
  RefreshCw,
  Search,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { useAuth } from "@/shared/context/AuthContext";
import AdminLayout from "./AdminLayout";
import { AdminTopBar } from "./AdminTopBar";

const FILTER_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "AVAILABLE", label: "Available" },
  { value: "LIMIT_REACHED", label: "Limit Reached" },
  { value: "NOT_OPEN_TO_WORK", label: "Not Open to Work" },
  { value: "CUSTOM_LIMIT", label: "Custom Only" },
];

const getAvailabilityMeta = (user) => {
  if (user.openToWork === false) {
    return {
      label: "Not Open to Work",
      badgeClass:
        "bg-slate-100 text-slate-700 border-0 dark:bg-slate-900/40 dark:text-slate-300",
      Icon: ShieldAlert,
    };
  }

  if (user.activeProjects >= user.effectiveLimit) {
    return {
      label: "Limit Reached",
      badgeClass:
        "bg-red-100 text-red-700 border-0 dark:bg-red-900/30 dark:text-red-400",
      Icon: ShieldAlert,
    };
  }

  return {
    label: "Available",
    badgeClass:
      "bg-green-100 text-green-700 border-0 dark:bg-green-900/30 dark:text-green-400",
    Icon: ShieldCheck,
  };
};

const matchesFilter = (user, filterValue) => {
  if (filterValue === "ALL") return true;
  if (filterValue === "CUSTOM_LIMIT") return user.customLimit !== null;
  if (filterValue === "AVAILABLE") return user.isEligible;
  if (filterValue === "LIMIT_REACHED") {
    return user.openToWork !== false && user.activeProjects >= user.effectiveLimit;
  }
  if (filterValue === "NOT_OPEN_TO_WORK") return user.openToWork === false;
  return true;
};

const formatCapacity = (user) => {
  if (!Number.isFinite(user.effectiveLimit) || user.effectiveLimit <= 0) {
    return "0%";
  }

  const ratio = Math.min((user.activeProjects / user.effectiveLimit) * 100, 100);
  return `${Math.round(ratio)}%`;
};

export default function AdminFreelancerLimits() {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [limitInput, setLimitInput] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [isSaving, setIsSaving] = useState(false);
  const [rowActionUserId, setRowActionUserId] = useState("");

  const fetchLimits = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authFetch("/admin/freelancer-limits");
      if (!res.ok) {
        throw new Error("Failed to fetch freelancer limits");
      }
      const data = await res.json();
      setFreelancers(Array.isArray(data?.data) ? data.data : []);
    } catch (error) {
      console.error("Failed to fetch freelancer limits:", error);
      toast.error("Failed to fetch freelancer limits");
      setFreelancers([]);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    void fetchLimits();
  }, [fetchLimits]);

  const filteredFreelancers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return freelancers
      .filter((user) => {
        if (!normalizedSearch) return true;

        return [user.name, user.email].some((value) =>
          String(value || "").toLowerCase().includes(normalizedSearch),
        );
      })
      .filter((user) => matchesFilter(user, filter))
      .sort((left, right) => {
        if (left.isEligible !== right.isEligible) {
          return left.isEligible ? 1 : -1;
        }

        return right.activeProjects - left.activeProjects;
      });
  }, [filter, freelancers, search]);

  const summary = useMemo(() => {
    const total = freelancers.length;
    const customLimitCount = freelancers.filter((user) => user.customLimit !== null).length;
    const availableCount = freelancers.filter((user) => user.isEligible).length;
    const blockedCount = freelancers.filter((user) => !user.isEligible).length;

    return {
      total,
      customLimitCount,
      availableCount,
      blockedCount,
    };
  }, [freelancers]);

  const openEditDialog = (user) => {
    setSelectedUser(user);
    setLimitInput(user.customLimit !== null ? String(user.customLimit) : "");
  };

  const closeDialog = () => {
    if (isSaving) return;
    setSelectedUser(null);
    setLimitInput("");
  };

  const parseLimitValue = () => {
    const trimmed = limitInput.trim();
    if (!trimmed) return null;

    const parsedLimit = Number.parseInt(trimmed, 10);
    if (Number.isNaN(parsedLimit)) {
      return Number.NaN;
    }

    return parsedLimit;
  };

  const persistLimit = async (userId, customProjectLimit) => {
    const res = await authFetch(`/admin/freelancer-limits/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ customProjectLimit }),
    });

    if (!res.ok) {
      throw new Error("Failed to update freelancer limit");
    }

    return res.json().catch(() => null);
  };

  const handleSave = async () => {
    if (!selectedUser) return;

    const parsedLimit = parseLimitValue();
    if (Number.isNaN(parsedLimit)) {
      toast.error("Enter a valid whole number or leave the field empty.");
      return;
    }

    if (parsedLimit !== null && parsedLimit < 0) {
      toast.error("Project limit cannot be negative.");
      return;
    }

    try {
      setIsSaving(true);
      await persistLimit(selectedUser.id, parsedLimit);
      toast.success("Freelancer limit updated successfully");
      closeDialog();
      await fetchLimits();
    } catch (error) {
      console.error("Failed to update freelancer limit:", error);
      toast.error("Failed to update freelancer limit");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetLimit = async (user) => {
    try {
      setRowActionUserId(user.id);
      await persistLimit(user.id, null);
      toast.success("Custom limit removed. System default restored.");
      await fetchLimits();
    } catch (error) {
      console.error("Failed to reset freelancer limit:", error);
      toast.error("Failed to reset freelancer limit");
    } finally {
      setRowActionUserId("");
    }
  };

  const selectedUserParsedLimit = parseLimitValue();
  const selectedUserNextEffectiveLimit =
    selectedUserParsedLimit === null || Number.isNaN(selectedUserParsedLimit)
      ? selectedUser?.systemLimit ?? 0
      : selectedUserParsedLimit;
  const selectedUserRemainingCapacity = selectedUser
    ? Math.max(selectedUserNextEffectiveLimit - selectedUser.activeProjects, 0)
    : 0;

  return (
    <AdminLayout>
      <div className="relative flex flex-col gap-6 p-6">
        <AdminTopBar label="Freelancer Limits" />

        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Freelancer Project Limits</h1>
              <p className="mt-2 max-w-3xl text-muted-foreground">
                Manage custom active project limits for individual freelancers. This controls
                whether they remain open to new work once active projects reach capacity.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => navigate("/admin/freelancers")}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Freelancers
              </Button>
              <Button variant="outline" onClick={() => void fetchLimits()} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Freelancers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{loading ? "--" : summary.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Available for Work</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-green-700 dark:text-green-400">
                  {loading ? "--" : summary.availableCount}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-red-700 dark:text-red-400">
                  {loading ? "--" : summary.blockedCount}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Custom Limits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-primary">
                  {loading ? "--" : summary.customLimitCount}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by freelancer name or email"
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <SlidersHorizontal className="h-4 w-4" />
                Filter
              </div>
              {FILTER_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={filter === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border bg-card">
            {loading ? (
              <div className="flex items-center justify-center p-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Freelancer</TableHead>
                    <TableHead>Availability</TableHead>
                    <TableHead className="text-center">Capacity</TableHead>
                    <TableHead className="text-center">Limit Source</TableHead>
                    <TableHead className="text-center">Remaining Slots</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFreelancers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                        No freelancers match the current search or filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFreelancers.map((user) => {
                      const availability = getAvailabilityMeta(user);
                      const AvailabilityIcon = availability.Icon;
                      const isRowBusy = rowActionUserId === user.id;
                      const remainingSlots = Math.max(user.effectiveLimit - user.activeProjects, 0);

                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={availability.badgeClass}>
                              <AvailabilityIcon className="mr-1 h-3.5 w-3.5" />
                              {availability.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="space-y-1">
                              <div className="font-medium">
                                {user.activeProjects} / {user.effectiveLimit}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatCapacity(user)} used
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {user.customLimit !== null ? (
                              <Badge className="bg-primary/10 text-primary border-0">
                                Custom ({user.customLimit})
                              </Badge>
                            ) : (
                              <Badge variant="secondary">System Default ({user.systemLimit})</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {remainingSlots}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/admin/users/${user.id}`)}
                              >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Profile
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(user)}
                              >
                                <Settings2 className="mr-2 h-4 w-4" />
                                Edit Limit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResetLimit(user)}
                                disabled={user.customLimit === null || isRowBusy}
                              >
                                {isRowBusy ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                Reset
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>

      <Dialog open={Boolean(selectedUser)} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Freelancer Limit</DialogTitle>
            <DialogDescription>
              Set a custom active project limit for {selectedUser?.name}. Leave the field empty
              to use the system default.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 md:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Active Projects
                </p>
                <p className="mt-1 font-semibold">{selectedUser?.activeProjects ?? 0}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  System Default
                </p>
                <p className="mt-1 font-semibold">{selectedUser?.systemLimit ?? 0}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Remaining After Save
                </p>
                <p className="mt-1 font-semibold">{selectedUserRemainingCapacity}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="custom-limit-input">
                Active Project Limit
              </label>
              <Input
                id="custom-limit-input"
                type="number"
                placeholder={`Use system default (${selectedUser?.systemLimit ?? 0})`}
                value={limitInput}
                onChange={(event) => setLimitInput(event.target.value)}
                min="0"
              />
              <p className="text-xs text-muted-foreground">
                Next effective limit: {selectedUserNextEffectiveLimit}. If current active projects
                are already above this number, the freelancer will stay closed to new work until
                active projects drop below the limit.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={closeDialog} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => setLimitInput("")}
              disabled={isSaving}
            >
              Use Default
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
