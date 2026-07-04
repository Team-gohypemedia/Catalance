import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import CalendarIcon from "lucide-react/dist/esm/icons/calendar";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
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
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/shared/context/AuthContext";
import { cn } from "@/shared/lib/utils";
import { PmShell } from "@/modules/project-manager/components/PmShell";
import { pmApi } from "@/modules/project-manager/services/pm-api";

const SLOT_HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
const MORNING_HOURS = [9, 10, 11, 12];
const AFTERNOON_HOURS = [13, 14, 15, 16, 17, 18];

const toDateKey = (value) => {
  if (typeof value === "string") {
    const isoDate = value.match(/^\d{4}-\d{2}-\d{2}/);
    if (isoDate?.[0]) {
      return isoDate[0];
    }
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

const AvailabilityPage = () => {
  const navigate = useNavigate();
  const { authFetch, user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
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
        console.error("Failed to load manager availability:", error);
        setMonthAvailability([]);
        toast.error(error?.message || "Failed to load availability.");
      } finally {
        if (isActive) {
          setLoading(false);
        }
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
    () =>
      new Set(
        selectedDateSlots
          .filter((slot) => Boolean(slot.isBooked))
          .map((slot) => slot.startHour)
      ),
    [selectedDateSlots]
  );

  const savedHours = useMemo(
    () => new Set(selectedDateSlots.map((slot) => slot.startHour)),
    [selectedDateSlots]
  );

  useEffect(() => {
    setSelectedHours(new Set(selectedDateSlots.map((slot) => slot.startHour)));
  }, [selectedDateSlots]);

  const configuredDayCount = useMemo(() => availabilityByDate.size, [availabilityByDate]);
  const bookedSlotCount = useMemo(
    () => monthAvailability.filter((slot) => Boolean(slot.isBooked)).length,
    [monthAvailability]
  );
  const openSlotCount = useMemo(
    () => monthAvailability.filter((slot) => !slot.isBooked).length,
    [monthAvailability]
  );

  const hasUnsavedChanges = useMemo(() => {
    if (selectedHours.size !== savedHours.size) return true;
    for (const hour of selectedHours) {
      if (!savedHours.has(hour)) {
        return true;
      }
    }
    return false;
  }, [savedHours, selectedHours]);

  const availabilitySummary = useMemo(() => {
    if (selectedDateSlots.length === 0) {
      return {
        headline: "No slots configured",
        detail:
          "Clients only see hours you save here. No meetings does not automatically make you available.",
      };
    }

    const lockedCount = selectedDateSlots.filter((slot) => slot.isBooked).length;
    if (lockedCount > 0) {
      return {
        headline: `${selectedDateSlots.length} slots configured`,
        detail: `${lockedCount} slot${lockedCount === 1 ? "" : "s"} already booked and locked.`,
      };
    }

    return {
      headline: `${selectedDateSlots.length} slots configured`,
      detail: "All configured slots are still open for dispute or appointment booking.",
    };
  }, [selectedDateSlots]);

  const toggleHour = (hour) => {
    if (lockedHours.has(hour) || saving) return;

    setSelectedHours((current) => {
      const next = new Set(current);
      if (next.has(hour)) {
        next.delete(hour);
      } else {
        next.add(hour);
      }
      return next;
    });
  };

  const applyPreset = (hours) => {
    setSelectedHours(() => {
      const next = new Set(lockedHours);
      hours.forEach((hour) => next.add(hour));
      return next;
    });
  };

  const clearEditableHours = () => {
    setSelectedHours(new Set(lockedHours));
  };

  const handleSaveAvailability = async () => {
    if (!selectedDateKey) return;

    setSaving(true);
    try {
      const slots = Array.from(selectedHours)
        .sort((left, right) => left - right)
        .map((startHour) => ({
          startHour,
          endHour: Math.min(startHour + 1, 24),
          isEnabled: true,
        }));

      await pmApi.setManagerAvailability(authFetch, {
        date: selectedDateKey,
        slots,
      });

      toast.success("Availability updated.");
      setRefreshSeed((current) => current + 1);
    } catch (error) {
      console.error("Failed to save availability:", error);
      toast.error(error?.message || "Failed to save availability.");
    } finally {
      setSaving(false);
    }
  };

  const selectedSlotCount = selectedHours.size;

  return (
    <PmShell
      title="My Availability"
      subtitle="Set the hours clients can book for disputes and support. If you do not save slots here, the client side will show no availability even when you have no meetings."
      actions={
        <Button
          variant="outline"
          className="rounded-2xl border-slate-200 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-700"
          onClick={() => navigate("/project-manager/appointments")}
        >
          Open Meetings
        </Button>
      }
    >
      <div className="grid min-w-0 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <Card className="rounded-[28px] border-slate-100 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-black text-slate-900">
                Month Coverage
              </CardTitle>
              <CardDescription className="text-sm font-medium text-slate-500">
                Summary for {selectedDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Configured Days
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-900">
                    {configuredDayCount}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Open Slots
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-900">
                    {openSlotCount}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Locked Bookings
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-900">
                    {bookedSlotCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-slate-100 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-black text-slate-900">
                Quick Presets
              </CardTitle>
              <CardDescription className="text-sm font-medium text-slate-500">
                Apply a common pattern, then fine-tune individual hours.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full justify-start rounded-2xl border-slate-200 text-left font-semibold text-slate-700"
                onClick={() => applyPreset(SLOT_HOURS)}
              >
                Full day: 9 AM to 7 PM
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full justify-start rounded-2xl border-slate-200 text-left font-semibold text-slate-700"
                onClick={() => applyPreset(MORNING_HOURS)}
              >
                Morning block
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full justify-start rounded-2xl border-slate-200 text-left font-semibold text-slate-700"
                onClick={() => applyPreset(AFTERNOON_HOURS)}
              >
                Afternoon block
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full justify-start rounded-2xl border-slate-200 text-left font-semibold text-slate-700"
                onClick={clearEditableHours}
              >
                Clear editable slots
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <Card className="min-w-0 overflow-hidden rounded-[32px] border-slate-100 bg-white shadow-lg shadow-slate-200/40">
            <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <CardTitle className="text-2xl font-black text-slate-900">
                  {selectedDate.toLocaleDateString(undefined, {
                    month: "long",
                    year: "numeric",
                  })}
                </CardTitle>
                <CardDescription className="mt-2 text-sm font-medium text-slate-500">
                  Pick a date, then mark the hours when you are available.
                </CardDescription>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-2xl border-slate-100 text-slate-400 hover:bg-slate-50 hover:text-slate-900"
                  onClick={() =>
                    setSelectedDate(
                      (current) =>
                        new Date(current.getFullYear(), current.getMonth() - 1, 1)
                    )
                  }
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-2xl border-slate-100 text-slate-400 hover:bg-slate-50 hover:text-slate-900"
                  onClick={() =>
                    setSelectedDate(
                      (current) =>
                        new Date(current.getFullYear(), current.getMonth() + 1, 1)
                    )
                  }
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 md:p-8">
              <Calendar
                mode="single"
                month={new Date(
                  selectedDate.getFullYear(),
                  selectedDate.getMonth(),
                  1
                )}
                selected={selectedDate}
                onSelect={(nextDate) => {
                  if (nextDate) {
                    setSelectedDate(nextDate);
                  }
                }}
                className="w-full min-w-0"
                classNames={{
                  months: "w-full",
                  month: "w-full space-y-6",
                  caption: "hidden",
                  head_row: "mb-3 flex w-full justify-between md:mb-4",
                  head_cell:
                    "w-10 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] sm:w-12 lg:w-14 xl:w-16",
                  row: "mt-1.5 flex w-full justify-between sm:mt-2 lg:mt-3",
                  cell: "relative h-12 w-10 p-0 text-center text-sm focus-within:z-20 sm:h-14 sm:w-12 lg:h-16 lg:w-14 xl:h-20 xl:w-16",
                  day: "flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-transparent p-0 font-black transition-all hover:bg-orange-50 hover:text-slate-900 aria-selected:opacity-100 sm:h-12 sm:w-12 lg:h-14 lg:w-14 xl:h-16 xl:w-16 xl:rounded-[28px]",
                  day_selected:
                    "rounded-2xl border-[#D9692A] bg-[#D9692A] text-white shadow-lg hover:bg-[#B85A24] xl:rounded-[28px]",
                  day_today:
                    "rounded-2xl border-orange-100 bg-orange-50 text-slate-900 xl:rounded-[28px]",
                  day_outside: "text-slate-300 opacity-30",
                }}
              />
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-slate-100 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl font-black text-slate-900">
                    {selectedDate.toLocaleDateString(undefined, {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </CardTitle>
                  <CardDescription className="mt-2 text-sm font-medium text-slate-500">
                    {availabilitySummary.detail}
                  </CardDescription>
                </div>
                <Badge className="rounded-full bg-orange-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#D9692A]">
                  {availabilitySummary.headline}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6 md:p-8">
              <div className="flex items-start gap-3 rounded-2xl border border-orange-100 bg-orange-50/70 p-4 text-sm text-slate-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#D9692A]" />
                <p className="font-medium leading-6">
                  Slots marked as booked are locked because a client appointment or
                  dispute already uses that hour. Saving will replace only the open
                  slots for this date.
                </p>
              </div>

              {loading ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: SLOT_HOURS.length }).map((_, index) => (
                    <div
                      key={index}
                      className="h-20 rounded-2xl border border-slate-100 bg-slate-50 animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {SLOT_HOURS.map((hour) => {
                    const isSelected = selectedHours.has(hour);
                    const isLocked = lockedHours.has(hour);

                    return (
                      <button
                        key={hour}
                        type="button"
                        onClick={() => toggleHour(hour)}
                        disabled={isLocked || saving}
                        className={cn(
                          "rounded-2xl border p-4 text-left transition-all",
                          isLocked
                            ? "cursor-not-allowed border-orange-200 bg-orange-50 text-slate-700"
                            : isSelected
                              ? "border-[#D9692A] bg-[#D9692A] text-white shadow-lg shadow-orange-500/15"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-black">
                            {formatHourLabel(hour)}
                          </span>
                          {isLocked ? (
                            <Badge className="bg-white/80 text-[9px] font-black uppercase tracking-[0.16em] text-[#D9692A]">
                              Locked
                            </Badge>
                          ) : isSelected ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Clock className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                        <p
                          className={cn(
                            "mt-3 text-xs font-semibold",
                            isLocked
                              ? "text-slate-600"
                              : isSelected
                                ? "text-white/85"
                                : "text-slate-500"
                          )}
                        >
                          {isLocked
                            ? "Booked already"
                            : isSelected
                              ? "Available to clients"
                              : "Not offered"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Selected Slots
                  </p>
                  <p className="mt-2 text-2xl font-black text-slate-900">
                    {selectedSlotCount}
                  </p>
                </div>
                <Button
                  type="button"
                  className="h-12 rounded-2xl bg-[#D9692A] px-5 text-xs font-black uppercase tracking-[0.18em] text-white hover:bg-[#B85A24]"
                  onClick={handleSaveAvailability}
                  disabled={saving || loading || !hasUnsavedChanges}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saving ? "Saving" : "Save Availability"}
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-slate-400" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Current Day Schedule
                  </p>
                </div>

                {selectedDateSlots.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {selectedDateSlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4"
                      >
                        <div>
                          <p className="text-sm font-black text-slate-900">
                            {formatHourRange(slot.startHour, slot.endHour)}
                          </p>
                          <p className="mt-1 text-xs font-medium text-slate-500">
                            {slot.isBooked
                              ? "Reserved by an existing booking"
                              : "Open to new bookings"}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]",
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
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center">
                    <p className="text-sm font-semibold text-slate-500">
                      No availability saved for this date.
                    </p>
                    <p className="mt-2 text-xs font-medium text-slate-400">
                      Choose one or more hours above, then save them.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PmShell>
  );
};

export default AvailabilityPage;
