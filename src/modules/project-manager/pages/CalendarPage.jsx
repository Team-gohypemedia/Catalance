import { useMemo, useState } from "react";
import { toast } from "sonner";
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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";

const CalendarPage = () => {
  const { authFetch } = useAuth();
  const [date, setDate] = useState(new Date());
  const [search, setSearch] = useState("");

  const { data, loading } = useAsyncResource(
    () => pmApi.getMeetings(authFetch, { from: date.toISOString().slice(0, 10) }),
    [authFetch, date]
  );

  const meetingList = useMemo(() => data?.meetings || [], [data]);

  const categories = [
    { label: "Total Meetings", count: meetingList.length, active: true },
    { label: "Today's Schedule", count: meetingList.filter(m => new Date(m.startsAt || m.startTime).toDateString() === new Date().toDateString()).length },
    { label: "This Week", count: meetingList.length }
  ];

  const filteredMeetings = useMemo(() => {
    if (!meetingList) return [];
    if (!search.trim()) return meetingList;
    const term = search.toLowerCase();
    return meetingList.filter(m => 
      m.title.toLowerCase().includes(term) || 
      m.projectName?.toLowerCase().includes(term)
    );
  }, [meetingList, search]);

  return (
    <PmShell
      title="Appointments & Meetings"
      subtitle="Synchronize your schedule, manage client calls, and track sprint reviews."
    >
      <div className="grid gap-8 lg:grid-cols-[300px_1fr_360px]">
        {/* Left Sidebar */}
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder="Search for meetings..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 rounded-2xl border-slate-100 bg-white pl-12 text-xs font-medium placeholder:text-slate-400 focus-visible:ring-4 focus-visible:ring-blue-100 shadow-sm"
            />
          </div>

          <Button variant="outline" className="h-12 w-full rounded-2xl border-slate-200 bg-white text-[10px] font-black tracking-widest uppercase text-slate-600 shadow-sm hover:bg-slate-50 transition-all">
            <Filter className="mr-3 h-4 w-4" />
            Vetting Filters
          </Button>

          <div className="space-y-3">
            {categories.map((cat, i) => (
              <button key={i} className={`flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left transition-all border ${cat.active ? 'bg-slate-900 border-slate-900 shadow-lg shadow-slate-900/10' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'}`}>
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${cat.active ? 'text-white' : 'text-slate-400'}`}>{cat.label}</span>
                <Badge className={`rounded-xl px-2.5 py-0.5 text-[10px] font-black border-none ${cat.active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{cat.count}</Badge>
              </button>
            ))}
          </div>

          <Button className="h-14 w-full rounded-2xl bg-blue-600 text-[10px] font-black tracking-[0.2em] uppercase text-white shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.02] transition-all">
            <Plus className="mr-3 h-4 w-4" />
            New Briefing
          </Button>
        </div>

        {/* Center Calendar */}
        <div className="space-y-6">
           <Card className="rounded-[48px] border-slate-50 p-10 bg-white shadow-xl shadow-slate-200/40">
             <div className="mb-10 flex items-center justify-between">
                <div className="space-y-1">
                   <h2 className="text-2xl font-black text-slate-900">
                      {date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                   </h2>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Ops Schedule</p>
                </div>
                <div className="flex gap-3">
                   <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-slate-100 hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-all">
                      <ChevronLeft className="h-6 w-6" />
                   </Button>
                   <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-slate-100 hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-all">
                      <ChevronRight className="h-6 w-6" />
                   </Button>
                </div>
             </div>
             
             <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="w-full"
                classNames={{
                   months: "w-full",
                   month: "w-full space-y-10",
                   caption: "hidden",
                   head_row: "flex w-full justify-between mb-6",
                   head_cell: "text-slate-400 w-16 font-black text-[10px] uppercase tracking-[0.3em]",
                   row: "flex w-full justify-between mt-4",
                   cell: "h-20 w-20 text-center text-sm p-0 relative focus-within:z-20",
                   day: "h-16 w-16 p-0 font-black aria-selected:opacity-100 hover:bg-blue-50 hover:text-blue-600 rounded-[28px] transition-all flex items-center justify-center border-2 border-transparent",
                   day_selected: "bg-slate-900 text-white hover:bg-slate-950 rounded-[28px] shadow-2xl border-slate-900",
                   day_today: "bg-blue-50 text-blue-600 rounded-[28px] border-blue-100",
                   day_outside: "text-slate-300 opacity-30",
                }}
             />
           </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-8">
           <div className="px-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">SYNC TARGET</p>
              <h3 className="text-2xl font-black text-slate-900 leading-tight">
                 {date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}
              </h3>
           </div>

           {meetingList?.some(m => m.hasConflict) && (
              <div className="rounded-[40px] border border-rose-100 bg-rose-50/30 p-8 shadow-sm group">
                 <div className="flex items-center gap-3 mb-4">
                    <div className="h-3 w-3 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-[9px] font-black text-rose-600 uppercase tracking-[0.2em]">Conflict Detected</span>
                 </div>
                 <h4 className="text-base font-black text-slate-900 mb-2">Schedule Overlap Alert</h4>
                 <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                    Operations in sector <span className="text-rose-600 font-bold uppercase tracking-tighter">Alpha-9</span> are overlapping. Please recalibrate your briefing window.
                 </p>
              </div>
           )}

           <div>
              <div className="mb-6 flex items-center justify-between px-4">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">OPERATIONS ({filteredMeetings.length})</p>
                 <Button variant="link" className="h-auto p-0 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors">Manage Vault</Button>
              </div>
              <div className="space-y-4">
                 {loading ? (
                    Array.from({length: 3}).map((_, i) => (
                       <div key={i} className="h-28 w-full bg-slate-50/50 rounded-[32px] animate-pulse border-2 border-dashed border-slate-100" />
                    ))
                 ) : filteredMeetings.length > 0 ? (
                    filteredMeetings.map((session) => (
                       <div key={session.id} className="group relative flex items-start gap-5 p-6 rounded-[32px] border border-slate-100 bg-white shadow-sm transition-all hover:shadow-xl hover:border-blue-100 hover:-translate-y-1">
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-blue-600 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />
                          <Avatar className="h-14 w-14 rounded-2xl shadow-lg border-4 border-white">
                             <AvatarImage src={session.freelancerAvatar} />
                             <AvatarFallback className="font-black bg-slate-100 text-slate-300">{session.freelancerName?.[0] || 'M'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                             <div className="flex items-center justify-between mb-1">
                                <h4 className="text-sm font-black text-slate-900 truncate group-hover:text-blue-600 transition-colors">{session.title}</h4>
                             </div>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight mb-4 truncate">{session.projectName || "Standard Review"}</p>
                             <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                                   <Clock className="h-3.5 w-3.5 text-blue-600" />
                                   <span className="text-[11px] font-black text-slate-900 whitespace-nowrap">
                                       {new Date(session.startsAt || session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                   </span>
                                </div>
                                <Badge variant="outline" className="text-[9px] font-black border-slate-100 text-slate-400 px-3 py-1 rounded-lg group-hover:bg-white transition-colors">{session.platform || "VIDEO"}</Badge>
                             </div>
                          </div>
                       </div>
                    ))
                 ) : (
                    <div className="py-20 text-center rounded-[48px] border-2 border-dashed border-slate-100 bg-slate-50/20">
                       <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                          <CalendarIcon className="h-8 w-8 text-slate-200" />
                       </div>
                       <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">Zero Active Sessions</p>
                    </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </PmShell>
  );
};

export default CalendarPage;
