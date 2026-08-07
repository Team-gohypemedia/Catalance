import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Search from "lucide-react/dist/esm/icons/search";
import Filter from "lucide-react/dist/esm/icons/filter";
import Plus from "lucide-react/dist/esm/icons/plus";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import CalendarIcon from "lucide-react/dist/esm/icons/calendar";
import Clock from "lucide-react/dist/esm/icons/clock";
import { useAuth } from "@/shared/context/AuthContext";
import { PmShell } from "@/modules/project-manager/components/PmShell";
import { pmApi } from "@/modules/project-manager/services/pm-api";
import { useAsyncResource } from "@/modules/project-manager/hooks/use-async-resource";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { AvailabilitySlotManager } from "@/modules/project-manager/components/AvailabilitySlotManager";

const MEETING_FILTERS = [
  { value: "ALL", label: "All Meetings" },
  { value: "UPCOMING", label: "Upcoming" },
  { value: "CURRENT", label: "Current" },
  { value: "PREVIOUS", label: "Previous" },
];

const formatInitials = (name = "") =>
  String(name)
    .trim()
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const getMeetingWindowType = (meeting) => {
  const now = Date.now();
  const startsAt = new Date(meeting?.startsAt).getTime();
  const endsAt = new Date(meeting?.endsAt).getTime();

  if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt)) return "PREVIOUS";
  if (startsAt <= now && now < endsAt) return "CURRENT";
  if (startsAt > now) return "UPCOMING";
  return "PREVIOUS";
};

const CalendarPage = () => {
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const [searchParams] = useSearchParams();
  const [date, setDate] = useState(new Date());
  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState("ALL");
  const [projectFilter, setProjectFilter] = useState("ALL");

  const { data, loading } = useAsyncResource(
    () =>
      pmApi.getMeetings(authFetch, {
        view: "all",
        from: new Date().toISOString().slice(0, 10),
      }),
    [authFetch]
  );

  const meetingList = useMemo(
    () => (Array.isArray(data?.meetings) ? data.meetings : []),
    [data?.meetings]
  );

  useEffect(() => {
    const requestedTimeFilter = String(searchParams.get("time") || "").toUpperCase();
    if (MEETING_FILTERS.some((filter) => filter.value === requestedTimeFilter)) {
      setTimeFilter(requestedTimeFilter);
      return;
    }
    setTimeFilter("ALL");
  }, [searchParams]);

  const projectOptions = useMemo(() => {
    const grouped = new Map();

    meetingList.forEach((meeting) => {
      const id = String(meeting?.projectId || "");
      const name = meeting?.projectName || "General";
      const current = grouped.get(id) || { id, name, count: 0 };
      current.count += 1;
      grouped.set(id, current);
    });

    return Array.from(grouped.values()).sort((left, right) =>
      left.name.localeCompare(right.name)
    );
  }, [meetingList]);

  const filteredBySearchAndProject = useMemo(() => {
    const term = search.trim().toLowerCase();

    return meetingList.filter((meeting) => {
      const matchesProject =
        projectFilter === "ALL" || String(meeting?.projectId || "") === projectFilter;
      if (!matchesProject) return false;

      if (!term) return true;
      const participants = Array.isArray(meeting?.participants) ? meeting.participants : [];
      const participantNames = participants.map((participant) => participant?.name || "").join(" ");
      const haystack = `${meeting?.title || ""} ${meeting?.projectName || ""} ${participantNames}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [meetingList, projectFilter, search]);

  const groupedMeetings = useMemo(() => {
    const current = [];
    const upcoming = [];
    const previous = [];

    filteredBySearchAndProject.forEach((meeting) => {
      const type = getMeetingWindowType(meeting);
      if (type === "CURRENT") current.push(meeting);
      else if (type === "UPCOMING") upcoming.push(meeting);
      else previous.push(meeting);
    });

    current.sort((left, right) => new Date(left.startsAt) - new Date(right.startsAt));
    upcoming.sort((left, right) => new Date(left.startsAt) - new Date(right.startsAt));
    previous.sort((left, right) => new Date(right.startsAt) - new Date(left.startsAt));

    return { current, upcoming, previous };
  }, [filteredBySearchAndProject]);

  const counts = useMemo(
    () => ({
      ALL: filteredBySearchAndProject.length,
      UPCOMING: groupedMeetings.upcoming.length,
      CURRENT: groupedMeetings.current.length,
      PREVIOUS: groupedMeetings.previous.length,
    }),
    [filteredBySearchAndProject.length, groupedMeetings]
  );

  const visibleSections = useMemo(() => {
    if (timeFilter === "CURRENT") return [{ key: "current", title: "Current Meetings", rows: groupedMeetings.current }];
    if (timeFilter === "UPCOMING") return [{ key: "upcoming", title: "Upcoming Meetings", rows: groupedMeetings.upcoming }];
    if (timeFilter === "PREVIOUS") return [{ key: "previous", title: "Previous Meetings", rows: groupedMeetings.previous }];

    return [
      { key: "current", title: "Current Meetings", rows: groupedMeetings.current },
      { key: "upcoming", title: "Upcoming Meetings", rows: groupedMeetings.upcoming },
      { key: "previous", title: "Previous Meetings", rows: groupedMeetings.previous },
    ];
  }, [groupedMeetings, timeFilter]);

  const visibleCount = useMemo(
    () => visibleSections.reduce((total, section) => total + section.rows.length, 0),
    [visibleSections]
  );

  const openMeetingProject = (projectId) => {
    if (!projectId) return;
    navigate(`/project-manager/projects/${projectId}`);
  };

  return (
    <PmShell
      title="Appointments & Meetings"
      subtitle="View all upcoming, current, and previous meetings with project-wise filters."
      className="overflow-x-clip"
    >
      <div className="grid min-w-0 gap-6 lg:grid-cols-[280px_minmax(0,1fr)] 2xl:grid-cols-[280px_minmax(0,1fr)_360px]">
        {/* Left Filter Column */}
        <div className="min-w-0 space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search meetings, projects..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-10 rounded-xl border-slate-200 bg-white pl-10 text-xs font-medium placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#D9692A]/20 focus-visible:border-[#D9692A] shadow-xs"
            />
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
            <div className="mb-2 flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-[#D9692A]" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Meeting Filters
              </p>
            </div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Project
            </p>
            <select
              value={projectFilter}
              onChange={(event) => setProjectFilter(event.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#D9692A]/20 focus:border-[#D9692A]"
            >
              <option value="ALL">All Projects</option>
              {projectOptions.map((option) => (
                <option key={option.id || option.name} value={option.id}>
                  {option.name} ({option.count})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            {MEETING_FILTERS.map((filter) => {
              const active = timeFilter === filter.value;
              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setTimeFilter(filter.value)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${
                    active
                      ? "bg-[#D9692A] border-[#D9692A] text-white shadow-md shadow-orange-500/15"
                      : "bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider ${
                      active ? "text-white" : "text-slate-600"
                    }`}
                  >
                    {filter.label}
                  </span>
                  <Badge
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold border-none ${
                      active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {counts[filter.value]}
                  </Badge>
                </button>
              );
            })}
          </div>

          <Button
            className="h-11 w-full rounded-xl bg-[#D9692A] text-xs font-bold tracking-wider uppercase text-white shadow-md shadow-orange-500/15 hover:bg-[#B85A24] transition-all"
            onClick={() => navigate("/project-manager/projects")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Open Projects
          </Button>
        </div>

        {/* Center Calendar Section (Compact Height) */}
        <div className="min-w-0 space-y-4">
          <Card className="min-w-0 overflow-hidden rounded-2xl border-slate-200/80 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div className="space-y-0.5">
                <h2 className="text-xl font-extrabold text-slate-900">
                  {date.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                </h2>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#D9692A]" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Global Ops Schedule
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-xl border-slate-200 text-slate-500 hover:border-orange-200 hover:bg-orange-50 hover:text-[#D9692A] transition-all"
                  onClick={() =>
                    setDate(
                      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                    )
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-xl border-slate-200 text-slate-500 hover:border-orange-200 hover:bg-orange-50 hover:text-[#D9692A] transition-all"
                  onClick={() =>
                    setDate(
                      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                    )
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="w-full min-w-0 p-0"
              classNames={{
                months: "w-full",
                month: "w-full space-y-3",
                month_caption: "hidden",
                caption_label: "hidden",
                nav: "hidden",
                caption: "hidden",
                head_row: "flex w-full justify-between mb-2",
                head_cell:
                  "w-8 sm:w-9 lg:w-10 xl:w-11 text-center text-slate-400 font-bold text-[11px] uppercase tracking-wider",
                row: "flex w-full justify-between mt-1",
                cell: "relative h-8 sm:h-9 lg:h-10 xl:h-11 w-8 sm:w-9 lg:w-10 xl:w-11 p-0 text-center text-sm focus-within:z-20",
                day: "flex h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 xl:h-11 xl:w-11 items-center justify-center rounded-xl font-bold text-xs sm:text-sm transition-all hover:bg-orange-50 hover:text-orange-600 aria-selected:opacity-100",
                day_selected:
                  "rounded-xl border-[#D9692A] bg-[#D9692A] text-white shadow-md shadow-orange-500/20 hover:bg-[#B85A24]",
                day_today:
                  "rounded-xl border border-orange-200 bg-orange-50 text-orange-900 font-extrabold",
                day_outside: "text-slate-300 opacity-40 hover:bg-transparent hover:text-slate-300",
              }}
            />
          </Card>
        </div>

        {/* Right Meeting Timeline Column */}
        <div className="min-w-0 space-y-4 lg:col-span-2 2xl:col-span-1">
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Meeting Timeline
            </p>
            <h3 className="text-xl font-extrabold text-slate-900 leading-tight">
              {date.toLocaleDateString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "short",
              })}
            </h3>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Showing {visibleCount} meeting(s) for selected filters.
            </p>
          </div>

          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 2 }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 w-full rounded-2xl border border-slate-200 bg-slate-50/50 animate-pulse"
                />
              ))
            ) : visibleCount > 0 ? (
              visibleSections
                .filter((section) => section.rows.length > 0)
                .map((section) => (
                  <div key={section.key} className="space-y-2.5">
                    <div className="flex items-center justify-between px-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {section.title}
                      </p>
                      <Badge className="bg-slate-100 text-slate-600 text-[10px] font-bold border-none">
                        {section.rows.length}
                      </Badge>
                    </div>

                    {section.rows.map((session) => {
                      const type = getMeetingWindowType(session);
                      const participants = Array.isArray(session?.participants)
                        ? session.participants
                        : [];
                      const freelancer = participants.find(
                        (participant) =>
                          String(participant?.role || "").toLowerCase() === "freelancer"
                      );
                      const previewName =
                        freelancer?.name || session?.projectName || "Meeting";

                      return (
                        <button
                          key={session.id}
                          type="button"
                          onClick={() => openMeetingProject(session.projectId)}
                          disabled={!session.projectId}
                          className={`group relative flex w-full items-start gap-3.5 rounded-xl border border-slate-200/80 bg-white p-3.5 text-left shadow-xs transition-all ${
                            session.projectId
                              ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:border-orange-200"
                              : "cursor-default"
                          }`}
                        >
                          <Avatar className="h-10 w-10 rounded-lg border border-slate-100 shadow-2xs">
                            <AvatarImage src={freelancer?.avatar || null} />
                            <AvatarFallback className="bg-orange-50 font-bold text-[#D9692A] text-xs">
                              {formatInitials(previewName)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <p className="truncate text-xs font-bold text-slate-900">
                                {session.title || "Project Meeting"}
                              </p>
                              <Badge
                                className={`text-[9px] font-bold uppercase border-none px-2 py-0.5 ${
                                  type === "CURRENT"
                                    ? "bg-emerald-600 text-white"
                                    : type === "UPCOMING"
                                      ? "bg-[#D9692A] text-white"
                                      : "bg-slate-200 text-slate-700"
                                }`}
                              >
                                {type}
                              </Badge>
                            </div>

                            <p className="truncate text-[11px] font-medium text-slate-500">
                              {session.projectName || "General"} • Scope:{" "}
                              {session.participantScope || "BOTH"}
                            </p>

                            <div className="flex flex-wrap items-center gap-2 pt-0.5">
                              <div className="flex items-center gap-1 rounded-md border border-slate-100 bg-slate-50 px-2 py-0.5">
                                <Clock className="h-3 w-3 text-slate-600" />
                                <span className="text-[10px] font-bold text-slate-700">
                                  {new Date(session.startsAt).toLocaleString([], {
                                    day: "2-digit",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <Badge
                                variant="outline"
                                className="border-slate-200 text-[9px] font-bold text-slate-500"
                              >
                                {session.platform || "INTERNAL"}
                              </Badge>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center shadow-xs">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-[#D9692A]">
                  <CalendarIcon className="h-6 w-6" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">
                  No meetings scheduled
                </h4>
                <p className="mt-1 text-[11px] text-slate-500">
                  There are no meetings for the selected date and filters.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="col-span-full">
        <AvailabilitySlotManager selectedDate={date} />
      </div>
    </PmShell>
  );
};

export default CalendarPage;

