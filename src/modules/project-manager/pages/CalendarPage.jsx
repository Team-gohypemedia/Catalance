import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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

  return (
    <PmShell
      title="Appointments & Meetings"
      subtitle="View all upcoming, current, and previous meetings with project-wise filters."
      className="overflow-x-clip"
    >
      <div className="grid min-w-0 gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search meetings, projects..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-12 rounded-2xl border-slate-100 bg-white pl-12 text-xs font-medium placeholder:text-slate-400 focus-visible:ring-4 focus-visible:ring-blue-100 shadow-sm"
            />
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Meeting Filters
              </p>
            </div>
            <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Project
            </p>
            <select
              value={projectFilter}
              onChange={(event) => setProjectFilter(event.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700"
            >
              <option value="ALL">All Projects</option>
              {projectOptions.map((option) => (
                <option key={option.id || option.name} value={option.id}>
                  {option.name} ({option.count})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {MEETING_FILTERS.map((filter) => {
              const active = timeFilter === filter.value;
              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setTimeFilter(filter.value)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-5 py-4 text-left transition-all ${
                    active
                      ? "bg-slate-900 border-slate-900 shadow-lg shadow-slate-900/10"
                      : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                      active ? "text-white" : "text-slate-400"
                    }`}
                  >
                    {filter.label}
                  </span>
                  <Badge
                    className={`rounded-xl px-2.5 py-0.5 text-[10px] font-black border-none ${
                      active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {counts[filter.value]}
                  </Badge>
                </button>
              );
            })}
          </div>

          <Button
            className="h-14 w-full rounded-2xl bg-blue-600 text-[10px] font-black tracking-[0.2em] uppercase text-white shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.02] transition-all"
            onClick={() => navigate("/project-manager/projects")}
          >
            <Plus className="mr-3 h-4 w-4" />
            Open Projects
          </Button>
        </div>

        <div className="min-w-0 space-y-6">
          <Card className="min-w-0 overflow-hidden rounded-3xl border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/40 md:p-8">
            <div className="mb-10 flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900">
                  {date.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Global Ops Schedule
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-2xl border-slate-100 hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-all"
                  onClick={() =>
                    setDate(
                      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                    )
                  }
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-2xl border-slate-100 hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-all"
                  onClick={() =>
                    setDate(
                      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                    )
                  }
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>
            </div>

            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
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
                day: "flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-transparent p-0 font-black transition-all hover:bg-blue-50 hover:text-blue-600 aria-selected:opacity-100 sm:h-12 sm:w-12 lg:h-14 lg:w-14 xl:h-16 xl:w-16 xl:rounded-[28px]",
                day_selected:
                  "rounded-2xl border-slate-900 bg-slate-900 text-white shadow-lg hover:bg-slate-950 xl:rounded-[28px]",
                day_today: "rounded-2xl border-blue-100 bg-blue-50 text-blue-600 xl:rounded-[28px]",
                day_outside: "text-slate-300 opacity-30",
              }}
            />
          </Card>
        </div>

        <div className="min-w-0 space-y-6 lg:col-span-2 xl:col-span-1">
          <div className="px-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">
              Meeting Timeline
            </p>
            <h3 className="text-2xl font-black text-slate-900 leading-tight">
              {date.toLocaleDateString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "short",
              })}
            </h3>
            <p className="mt-2 text-xs font-medium text-slate-500">
              Showing {visibleCount} meeting(s) for selected filters.
            </p>
          </div>

          <div className="space-y-6">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-28 w-full rounded-[28px] border-2 border-dashed border-slate-100 bg-slate-50/50 animate-pulse"
                />
              ))
            ) : visibleCount > 0 ? (
              visibleSections.map((section) => (
                <div key={section.key} className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                      {section.title}
                    </p>
                    <Badge className="bg-slate-100 text-slate-600 text-[9px] font-black border-none">
                      {section.rows.length}
                    </Badge>
                  </div>

                  {section.rows.length > 0 ? (
                    section.rows.map((session) => {
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
                        <div
                          key={session.id}
                          className="group relative flex items-start gap-4 rounded-[26px] border border-slate-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                        >
                          <Avatar className="h-12 w-12 rounded-xl border-2 border-white shadow-sm">
                            <AvatarImage src={freelancer?.avatar || null} />
                            <AvatarFallback className="bg-slate-100 font-black text-slate-500">
                              {formatInitials(previewName)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <p className="truncate text-sm font-black text-slate-900">
                                {session.title || "Project Meeting"}
                              </p>
                              <Badge
                                className={`text-[9px] font-black uppercase border-none ${
                                  type === "CURRENT"
                                    ? "bg-emerald-600 text-white"
                                    : type === "UPCOMING"
                                      ? "bg-blue-600 text-white"
                                      : "bg-slate-200 text-slate-700"
                                }`}
                              >
                                {type}
                              </Badge>
                            </div>

                            <p className="truncate text-[11px] font-semibold text-slate-500">
                              {session.projectName || "General"} • Scope:{" "}
                              {session.participantScope || "BOTH"}
                            </p>

                            <div className="flex flex-wrap items-center gap-2">
                              <div className="flex items-center gap-1 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1">
                                <Clock className="h-3.5 w-3.5 text-blue-600" />
                                <span className="text-[11px] font-black text-slate-800">
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
                                className="border-slate-100 text-[9px] font-black text-slate-500"
                              >
                                {session.platform || "INTERNAL"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 px-4 py-5 text-center text-xs font-medium text-slate-400">
                      No meetings in this section.
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="rounded-[32px] border-2 border-dashed border-slate-100 bg-slate-50/20 py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
                  <CalendarIcon className="h-8 w-8 text-slate-200" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  No meetings for selected filters
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PmShell>
  );
};

export default CalendarPage;

