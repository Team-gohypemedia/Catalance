import { useEffect, useMemo, useState } from "react";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import CalendarIcon from "lucide-react/dist/esm/icons/calendar";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Clock from "lucide-react/dist/esm/icons/clock";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Save from "lucide-react/dist/esm/icons/save";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/shared/context/AuthContext";
import { cn } from "@/shared/lib/utils";
import { pmApi } from "@/modules/project-manager/services/pm-api";

const SLOT_HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

const toDateKey = (value) => {
  if (typeof value === "string") {
    const isoDate = value.match(/^\d{4}-\d{2}-\d{2}/);
    if (isoDate?.[0]) return isoDate[0];
  }
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getMonthRange = (date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    startDate: toDateKey(start),
    endDate: toDateKey(end),
  };
};

const formatHourLabel = (hour) => {
  const period = hour >= 12 ? "PM" : "AM";
  const normalizedHour = hour % 12 || 12;
  return `${normalizedHour.toString().padStart(2, "0")}:00 ${period}`;
};

const formatHourRange = (startHour, endHour) =>
  `${formatHourLabel(startHour)} - ${formatHourLabel(endHour)}`;

export const AvailabilitySlotManager = ({ selectedDate = new Date() }) => {
  const { authFetch, user } = useAuth();
  const [monthAvailability, setMonthAvailability] = useState([]);
  const [selectedHours, setSelectedHours] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshSeed, setRefreshSeed] = useState(0);

  const selectedDateKey = useMemo(() => toDateKey(selectedDate), [selectedDate]);
  const monthRange = useMemo(() => getMonthRange(selectedDate), [selectedDate]);

  useEffect(() => {
    if (!authFetch || !user?.id) {
      setMonthAvailability([]);
      setLoading(false);
      return;
    }

    let isActive = true;

    const loadAvailability = async () => {
      setLoading(true);
      try {
        const data = await pmApi.getManagerAvailability(authFetch, user.id, {
          startDate: monthRange.startDate,
          endDate: monthRange.endDate,
        });

        if (!isActive) return;
        setMonthAvailability(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!isActive) return;
        setMonthAvailability([]);
      } finally {
        if (isActive) setLoading(false);
      }
    };

    void loadAvailability();
    return () => {
      isActive = false;
    };
  }, [authFetch, monthRange.endDate, monthRange.startDate, refreshSeed, user?.id]);

  const availabilityByDate = useMemo(() => {
    const grouped = new Map();
    monthAvailability.forEach((slot) => {
      const key = toDateKey(slot.date);
      const current = grouped.get(key) || [];
      current.push(slot);
      grouped.set(key, current);
    });
    return grouped;
  }, [monthAvailability]);

  const selectedDateSlots = useMemo(() => {
    const slots = availabilityByDate.get(selectedDateKey) || [];
    return [...slots].sort((left, right) => left.startHour - right.startHour);
  }, [availabilityByDate, selectedDateKey]);

  const lockedHours = useMemo(
    () => new Set(selectedDateSlots.filter((slot) => Boolean(slot.isBooked)).map((slot) => slot.startHour)),
    [selectedDateSlots]
  );

  const savedHours = useMemo(
    () => new Set(selectedDateSlots.map((slot) => slot.startHour)),
    [selectedDateSlots]
  );

  useEffect(() => {
    setSelectedHours(new Set(selectedDateSlots.map((slot) => slot.startHour)));
  }, [selectedDateSlots]);

  const toggleHour = (hour) => {
    if (lockedHours.has(hour)) {
      toast.error(`Slot ${formatHourLabel(hour)} is already booked and locked.`);
      return;
    }
    setSelectedHours((current) => {
      const next = new Set(current);
      if (next.has(hour)) next.delete(hour);
      else next.add(hour);
      return next;
    });
  };

  const handleSaveAvailability = async () => {
    if (!authFetch || !user?.id) return;
    setSaving(true);
    try {
      const slots = Array.from(selectedHours)
        .sort((a, b) => a - b)
        .map((startHour) => ({
          startHour,
          endHour: startHour + 1,
        }));

      await pmApi.setManagerAvailability(authFetch, {
        date: selectedDateKey,
        slots,
      });

      toast.success(
        `Availability updated for ${selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}`
      );
      setRefreshSeed((prev) => prev + 1);
    } catch (error) {
      toast.error(error?.message || "Failed to update availability.");
    } finally {
      setSaving(false);
    }
  };

  const formattedSelectedDate = useMemo(
    () => selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
    [selectedDate]
  );

  const lockedCount = lockedHours.size;
  const selectedSlotCount = selectedHours.size;
  const hasUnsavedChanges = useMemo(() => {
    if (selectedHours.size !== savedHours.size) return true;
    for (const hour of selectedHours) {
      if (!savedHours.has(hour)) return true;
    }
    return false;
  }, [savedHours, selectedHours]);

  return (
    <Card className="mt-8 rounded-3xl border border-border/60 bg-card p-6 shadow-xs text-card-foreground">
      <CardHeader className="p-0 pb-6 border-b border-border/60">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl font-black text-foreground">
              {formattedSelectedDate}
            </CardTitle>
            <CardDescription className="mt-1 text-xs font-semibold text-muted-foreground">
              {lockedCount > 0
                ? `${lockedCount} slot${lockedCount > 1 ? "s" : ""} already booked and locked.`
                : "Configure your client booking availability for this date."}
            </CardDescription>
          </div>
          <Badge className="w-fit rounded-full bg-primary/10 text-primary border border-primary/20 px-3.5 py-1 text-[10px] font-black uppercase tracking-wider">
            {selectedSlotCount} SLOTS CONFIGURED
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0 pt-6 space-y-6">
        {lockedCount > 0 && (
          <div className="flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50/70 p-4 text-xs font-medium text-slate-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#D9692A]" />
            <p>
              Slots marked as <strong>LOCKED</strong> are reserved for existing client bookings or appointments.
              Saving will update open slots for this date.
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex h-44 items-center justify-center text-xs font-semibold text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading availability...
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {SLOT_HOURS.map((hour) => {
              const isLocked = lockedHours.has(hour);
              const isSelected = selectedHours.has(hour);

              return (
                <button
                  type="button"
                  key={hour}
                  disabled={isLocked}
                  onClick={() => toggleHour(hour)}
                  className={cn(
                    "flex flex-col justify-between rounded-2xl p-4 text-left transition-all border",
                    isLocked
                      ? "cursor-not-allowed border-orange-200 bg-orange-50/60 opacity-80"
                      : isSelected
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40 text-foreground"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-black tracking-tight">
                      {formatHourLabel(hour)}
                    </span>
                    {isLocked ? (
                      <Badge className="bg-orange-200 text-[#B85A24] text-[9px] font-black uppercase">
                        LOCKED
                      </Badge>
                    ) : isSelected ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Clock className="h-4 w-4 opacity-40" />
                    )}
                  </div>
                  <p
                    className={cn(
                      "mt-3 text-xs font-bold",
                      isLocked
                        ? "text-slate-600"
                        : isSelected
                          ? "text-primary-foreground/90"
                          : "text-muted-foreground"
                    )}
                  >
                    {isLocked ? "Booked already" : isSelected ? "Available to clients" : "Not offered"}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/60 bg-muted/20 p-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Selected Slots
            </p>
            <p className="mt-1 text-2xl font-black text-foreground">
              {selectedSlotCount}
            </p>
          </div>
          <Button
            type="button"
            className="h-11 rounded-full bg-primary px-6 text-xs font-black uppercase tracking-wider text-primary-foreground hover:opacity-90 shadow-xs"
            onClick={handleSaveAvailability}
            disabled={saving || loading || !hasUnsavedChanges}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            {saving ? "Saving..." : "Save Availability"}
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Current Day Schedule
            </p>
          </div>

          {selectedDateSlots.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {selectedDateSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between rounded-2xl border border-border/60 bg-card p-4 shadow-2xs"
                >
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      {formatHourRange(slot.startHour, slot.endHour)}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                      {slot.isBooked ? "Reserved by existing booking" : "Open to new bookings"}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-wider",
                      slot.isBooked
                        ? "border-orange-200 bg-orange-50 text-[#D9692A]"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
                    )}
                  >
                    {slot.isBooked ? "Booked" : "Open"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-4 py-6 text-center">
              <p className="text-xs font-semibold text-muted-foreground">
                No availability saved for this date.
              </p>
              <p className="mt-1 text-[11px] font-medium text-muted-foreground/70">
                Choose one or more hours above, then click Save Availability.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
