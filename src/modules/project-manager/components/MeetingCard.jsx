import PropTypes from "prop-types";
import Video from "lucide-react/dist/esm/icons/video";
import Users from "lucide-react/dist/esm/icons/users";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import Clock from "lucide-react/dist/esm/icons/clock";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const iconMap = {
  video: Video,
  group: Users,
  calendar: Calendar,
};

export const MeetingCard = ({ type = "video", status, title, project, participants = [], time, highlight }) => {
  const Icon = iconMap[type] || Video;
  
  return (
    <Card className={`relative w-full min-w-0 overflow-hidden rounded-[40px] border-2 transition-all duration-700 hover:shadow-2xl hover:-translate-y-1 ${highlight ? "border-slate-800 bg-slate-900 text-white shadow-xl shadow-blue-500/10" : "border-slate-50 bg-white"}`}>
      {highlight && (
         <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Clock className="h-40 w-40 text-blue-400 rotate-12" />
         </div>
      )}
      <CardContent className="p-10 relative z-10">
        <div className="mb-8 flex items-center justify-between">
          <div className={`flex h-14 w-14 items-center justify-center rounded-[20px] shadow-lg ${highlight ? "bg-blue-600 text-white shadow-blue-600/20" : "bg-slate-50 text-slate-400"}`}>
            <Icon className="h-7 w-7" />
          </div>
          <div className="flex flex-col items-end">
             <span className={`text-[9px] font-black uppercase tracking-[0.3em] mb-1 ${highlight ? "text-blue-400" : "text-slate-400"}`}>
               {status}
             </span>
             <div className="h-1.5 w-8 rounded-full bg-blue-600/20 overflow-hidden">
                <div className={`h-full bg-blue-600 animate-pulse ${highlight ? 'w-full' : 'w-1/2'}`} />
             </div>
          </div>
        </div>
        
        <div className="mb-10">
          <h4 className={`text-2xl font-black leading-tight mb-2 ${highlight ? "text-white" : "text-slate-900"}`}>{title}</h4>
          <div className="flex items-center gap-2">
             <div className="h-2 w-2 rounded-full bg-blue-600" />
             <p className={`text-[10px] font-black uppercase tracking-widest ${highlight ? "text-slate-400" : "text-slate-500"}`}>{project}</p>
          </div>
        </div>
        
        <div className={`flex items-center justify-between pt-8 border-t border-dashed ${highlight ? 'border-white/10' : 'border-slate-100'}`}>
          <div className="flex flex-col gap-3">
             <span className={`text-[9px] font-black uppercase tracking-widest ${highlight ? "text-slate-500" : "text-slate-400"}`}>Participants</span>
             <div className="flex -space-x-3">
               {participants.map((p, i) => (
                 <Avatar key={i} className={`h-10 w-10 border-4 shadow-xl ${highlight ? 'border-slate-900' : 'border-white'}`}>
                   <AvatarImage src={p.avatar} />
                   <AvatarFallback className={`${highlight ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-400'} text-[10px] font-bold uppercase`}>{p.initials}</AvatarFallback>
                 </Avatar>
               ))}
               {participants.length > 2 && (
                 <div className={`flex h-10 w-10 items-center justify-center rounded-full border-4 shadow-xl ${highlight ? 'border-slate-900 bg-slate-800 text-blue-400' : 'border-white bg-slate-100 text-slate-400'} text-[10px] font-black`}>
                   +{participants.length - 2}
                 </div>
               )}
             </div>
          </div>
          <div className={`flex flex-col items-end gap-2 px-6 py-3 rounded-[24px] shadow-inner ${highlight ? 'bg-white/5 text-white ring-1 ring-white/10' : 'bg-slate-50 text-slate-900'}`}>
             <span className={`text-[9px] font-black uppercase tracking-widest ${highlight ? 'text-blue-400' : 'text-slate-400'}`}>START TIME</span>
             <span className="text-xl font-black italic">{time}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

MeetingCard.propTypes = {
  type: PropTypes.oneOf(["video", "group", "calendar"]),
  status: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  project: PropTypes.string.isRequired,
  participants: PropTypes.arrayOf(PropTypes.shape({
    avatar: PropTypes.string,
    initials: PropTypes.string
  })),
  time: PropTypes.string.isRequired,
  highlight: PropTypes.bool
};
