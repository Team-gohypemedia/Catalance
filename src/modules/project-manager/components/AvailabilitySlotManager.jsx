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
    <Card className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <CardHeader className="p-0 pb-4 border-b border-slate-100">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-extrabold text-slate-900">
              {formattedSelectedDate}
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs font-medium text-slate-500">
              {lockedCount > 0
                ? `${lockedCount} slot${lockedCount > 1 ? "s" : ""} already booked and locked.`
                : "Configure your client booking availability for this date."}
            </CardDescription>
          </div>
          <Badge className="w-fit rounded-lg bg-orange-50 text-[#D9692A] border border-orange-200/60 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
            {selectedSlotCount} SLOTS CONFIGURED
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0 pt-4 space-y-5">
        {lockedCount > 0 && (
          <div className="flex items-start gap-2.5 rounded-xl border border-orange-200/80 bg-orange-50/60 p-3 text-xs font-medium text-slate-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#D9692A]" />
            <p>
              Slots marked as <strong>LOCKED</strong> are reserved for existing client bookings.
              Saving will update open slots for this date.
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex h-36 items-center justify-center text-xs font-medium text-slate-400 gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-[#D9692A]" /> Loading availability...
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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
                    "flex flex-col justify-between rounded-xl p-3 text-left transition-all border",
                    isLocked
                      ? "cursor-not-allowed border-orange-200/80 bg-orange-50/60 opacity-80"
                      : isSelected
                        ? "border-[#D9692A] bg-[#D9692A] text-white shadow-xs"
                        : "border-slate-200 bg-slate-50/40 hover:border-slate-300 hover:bg-slate-50 text-slate-800"
                  )}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-xs font-bold tracking-tight">
                      {formatHourLabel(hour)}
                    </span>
                    {isLocked ? (
                      <Badge className="bg-orange-200 text-[#B85A24] text-[8px] font-bold uppercase px-1.5 py-0">
                        LOCKED
                      </Badge>
                    ) : isSelected ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <Clock className="h-3.5 w-3.5 opacity-40" />
                    )}
                  </div>
                  <p
                    className={cn(
                      "mt-2 text-[10px] font-semibold",
                      isLocked
                        ? "text-slate-600"
                        : isSelected
                          ? "text-white/90"
                          : "text-slate-500"
                    )}
                  >
                    {isLocked ? "Booked" : isSelected ? "Available" : "Not offered"}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Selected Slots
            </p>
            <p className="mt-0.5 text-xl font-extrabold text-slate-900">
              {selectedSlotCount}
            </p>
          </div>
          <Button
            type="button"
            className="h-9 rounded-lg bg-[#D9692A] px-5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#B85A24] shadow-xs transition-all"
            onClick={handleSaveAvailability}
            disabled={saving || loading || !hasUnsavedChanges}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
            {saving ? "Saving..." : "Save Availability"}
          </Button>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5 text-[#D9692A]" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Current Day Schedule
            </p>
          </div>

          {selectedDateSlots.length > 0 ? (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {selectedDateSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {formatHourRange(slot.startHour, slot.endHour)}
                    </p>
                    <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                      {slot.isBooked ? "Reserved by existing booking" : "Open to new bookings"}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-md px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
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
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/40 px-4 py-4 text-center">
              <p className="text-xs font-semibold text-slate-500">
                No availability saved for this date.
              </p>
              <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                Choose one or more hours above, then click Save Availability.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
