import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Search from "lucide-react/dist/esm/icons/search";
import Filter from "lucide-react/dist/esm/icons/filter";
import Star from "lucide-react/dist/esm/icons/star";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Zap from "lucide-react/dist/esm/icons/zap";
import Award from "lucide-react/dist/esm/icons/award";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import { useAuth } from "@/shared/context/AuthContext";
import { PmShell } from "@/modules/project-manager/components/PmShell";
import { pmApi } from "@/modules/project-manager/services/pm-api";
import { useAsyncResource } from "@/modules/project-manager/hooks/use-async-resource";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const MarketplacePage = () => {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Developers");
  const [assigningId, setAssigningId] = useState(null);

  const projectId = searchParams.get("projectId");
  const isReassign = searchParams.get("reassign") === "true";

  const tabs = ["Developers", "Designers", "Content Writers", "Marketing", "Video Editors"];

  const { data, loading } = useAsyncResource(
    () => pmApi.searchFreelancers(authFetch, { search, category: activeTab }),
    [authFetch, search, activeTab]
  );

  const freelancerList = data?.freelancers || [];
  const pipeline = data?.pipeline || { activeInvites: 0, unreadChats: 0, activeInterviews: 0 };

  return (
    <PmShell
      title="Talent Marketplace"
      subtitle="Assemble your dream team from our curated pool of elite digital specialists."
    >
      <div className="mb-12 space-y-8">
        <div className="flex flex-col md:flex-row items-center gap-4">
           <div className="relative flex-1 w-full">
              <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input 
                placeholder="Search by skill, industry, or expert name..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-16 rounded-[24px] border-slate-100 bg-white pl-14 text-base font-medium shadow-xl shadow-slate-200/20 focus-visible:ring-4 focus-visible:ring-blue-100 transition-all"
              />
           </div>
           <Button variant="outline" className="h-16 rounded-[24px] border-slate-100 bg-white px-8 font-black text-[10px] uppercase tracking-widest text-slate-600 shadow-sm hover:bg-slate-50 transition-all active:scale-95">
              <Filter className="mr-3 h-4 w-4" />
              Advanced Filters
           </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
           {tabs.map(tab => (
             <Button 
               key={tab} 
               onClick={() => setActiveTab(tab)}
               className={`h-11 rounded-2xl px-6 text-[10px] font-black tracking-widest uppercase transition-all ${activeTab === tab ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 scale-105' : 'border-slate-100 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
             >
               {tab}
             </Button>
           ))}
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
           <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                 <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    {loading ? "SEARCHING GLOBAL TALENT..." : `${freelancerList.length} VERIFIED EXPERTS DISCOVERED`}
                 </p>
              </div>
              <div className="flex items-center gap-4">
                 <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                       <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-slate-100 overflow-hidden">
                          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 123}`} alt="User" />
                       </div>
                    ))}
                 </div>
                 <span className="text-[10px] font-bold text-slate-400">1.2k Total Active</span>
              </div>
           </div>

           {loading ? (
                Array.from({length: 3}).map((_, i) => (
                    <Card key={i} className="h-80 rounded-[48px] bg-slate-50 animate-pulse border-none" />
                ))
           ) : freelancerList.length > 0 ? (
                freelancerList.map((f) => (
                   <Card key={f.id} className="group relative overflow-hidden rounded-[48px] border-slate-100 p-1 bg-white shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                      <div className="p-8">
                        <div className="flex flex-col md:flex-row gap-8">
                           <div className="relative shrink-0 mx-auto md:mx-0">
                              <div className="absolute -inset-2 rounded-[40px] bg-gradient-to-br from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity" />
                              <Avatar className="h-32 w-32 rounded-[38px] shadow-2xl border-4 border-white bg-slate-50 relative z-10 transition-transform duration-500 group-hover:scale-105">
                                 <AvatarImage src={f.avatar} />
                                 <AvatarFallback className="text-2xl font-black bg-slate-100 text-slate-300">{f.name[0]}</AvatarFallback>
                              </Avatar>
                              <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 border-4 border-white text-white shadow-lg relative z-20">
                                 <CheckCircle2 className="h-5 w-5" />
                              </div>
                           </div>
        
                           <div className="flex-1 text-center md:text-left">
                              <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                 <div>
                                    <div className="flex items-center justify-center md:justify-start gap-4 mb-1">
                                       <h3 className="text-2xl font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">{f.name}</h3>
                                       {f.rating >= 4.8 && (
                                           <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                                              <Award className="h-3 w-3" />
                                              <span className="text-[9px] font-black uppercase tracking-widest">ELITE</span>
                                           </div>
                                       )}
                                    </div>
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-5">
                                       <div className="flex items-center gap-1.5 text-slate-400">
                                          <MapPin className="h-4 w-4" />
                                          <span className="text-[10px] font-black uppercase tracking-tighter">Remote • UTC+0</span>
                                       </div>
                                       <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-yellow-50 border border-yellow-100">
                                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                          <span className="text-[10px] font-black text-yellow-700">{f.rating}</span>
                                          <span className="text-[9px] font-bold text-yellow-600/60">({f.reviewsCount})</span>
                                       </div>
                                       <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[9px] font-black px-3 py-0.5 rounded-lg border-none">
                                           {f.projectExperience} YEARS EXPERIENCE
                                       </Badge>
                                    </div>
                                 </div>
                                 <div className="md:text-right p-4 rounded-3xl bg-slate-50/50 border border-slate-100 group-hover:bg-blue-600 group-hover:border-blue-500 group-hover:text-white transition-all">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-blue-100">RATE FROM</p>
                                    <p className="text-3xl font-black">
                                        INR {f.hourlyRate || '4500'}
                                        <span className="text-xs font-bold opacity-50 ml-1">/hr</span>
                                    </p>
                                 </div>
                              </div>
        
                              <div className="mb-6">
                                 <h4 className="text-base font-bold text-slate-800 mb-2 truncate">{f.title}</h4>
                                 <p className="text-sm font-medium text-slate-500 leading-relaxed line-clamp-2 max-w-2xl">
                                    {f.bio || "Brings high-caliber technical execution and strategic architectural oversight to mission-critical project deployments."}
                                 </p>
                              </div>
        
                              <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-8">
                                 {(f.skills || ["React", "Node.js", "Cloud Tech", "System Design"]).map(skill => (
                                   <Badge key={skill} variant="secondary" className="bg-white border border-slate-100 text-slate-600 text-[10px] font-bold rounded-xl px-4 py-1.5 shadow-sm group-hover:border-indigo-100 transition-colors uppercase tracking-tight">{skill}</Badge>
                                 ))}
                                 <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-400">+3</div>
                              </div>
                           </div>
                        </div>
        
                        <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-slate-50">
                           <Button 
                             className={`h-14 flex-1 rounded-[24px] font-black text-[10px] tracking-[0.2em] uppercase text-white shadow-xl transition-all hover:scale-[1.02] active:scale-95 ${projectId ? 'bg-blue-600 shadow-blue-600/20 hover:bg-blue-700' : 'bg-slate-900 shadow-slate-900/10 hover:bg-blue-600'}`} 
                             disabled={assigningId === f.id}
                             onClick={async () => {
                               if (projectId) {
                                   setAssigningId(f.id);
                                   try {
                                       if (isReassign) {
                                           await pmApi.replaceFreelancer(authFetch, projectId, f.id);
                                           toast.success("Lead reassigned successfully");
                                       } else {
                                           await pmApi.inviteFreelancer(authFetch, f.id, { projectId });
                                           toast.success("Invitation sent successfully");
                                       }
                                       navigate(`/project-manager/projects/${projectId}`);
                                   } catch (e) {
                                       toast.error(e.message || "Operation failed");
                                   } finally {
                                       setAssigningId(null);
                                   }
                               } else {
                                   toast.success("Talent successfully shortlisted for project.");
                               }
                             }}
                           >
                             {assigningId === f.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (projectId ? (isReassign ? "Confirm Reassignment" : "Assign to Project") : "Initiate Booking")}
                           </Button>
                           <Button 
                             variant="outline" 
                             className="h-14 flex-1 rounded-[24px] border-slate-200 bg-white font-black text-[10px] tracking-[0.2em] uppercase text-slate-600 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-3" 
                             onClick={() => navigate(`/project-manager/profile/${f.id}`)}
                           >
                              Review Portfolio
                              <ChevronRight className="h-4 w-4" />
                           </Button>
                        </div>
                      </div>
                   </Card>
                ))
           ) : (
                <div className="py-32 text-center space-y-8 rounded-[60px] bg-white border-2 border-dashed border-slate-100 shadow-inner">
                    <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                       <Search className="h-10 w-10 text-slate-200" />
                    </div>
                    <div className="space-y-2">
                       <p className="text-xl font-black text-slate-900">Zero matches in current sector.</p>
                       <p className="text-sm font-medium text-slate-400">Try broadening your parameters or search terms.</p>
                    </div>
                    <Button variant="default" onClick={() => { setSearch(""); setActiveTab("Developers"); }} className="h-12 rounded-2xl bg-blue-600 px-10 text-[10px] font-black uppercase tracking-widest">Reset Discovery</Button>
                </div>
           )}

           <Button variant="ghost" className="w-full h-16 rounded-[30px] text-slate-400 font-black text-[11px] tracking-[0.3em] uppercase hover:text-blue-600 hover:bg-white hover:shadow-sm transition-all">LOAD NEXT WAVE</Button>
        </div>

        <div className="space-y-10">
           <Card className="rounded-[48px] border-slate-100 p-10 bg-white shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-700 pointer-events-none">
                 <Zap className="h-48 w-48 text-blue-600" />
              </div>
              <div className="relative z-10">
                 <p className="mb-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-600 fill-blue-600" />
                    Pipeline Intel
                 </p>
                 <div className="space-y-10">
                    <div className="group cursor-pointer">
                       <h4 className="mb-2 text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors">Contracting Velocity</h4>
                       <p className="text-xs font-medium text-slate-500 leading-relaxed">You have <span className="text-blue-600 font-black">{pipeline.activeInvites} active proposals</span> awaiting specialist feedback. High conversion expected.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-6 rounded-[32px] bg-slate-50 border border-slate-100 text-center">
                          <p className="text-2xl font-black text-slate-900">{pipeline.activeInterviews}</p>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Interviews</p>
                       </div>
                       <div className="p-6 rounded-[32px] bg-slate-50 border border-slate-100 text-center">
                          <p className="text-2xl font-black text-slate-900">{pipeline.unreadChats}</p>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Unread Msg</p>
                       </div>
                    </div>
                    <Button className="w-full h-14 rounded-2xl bg-slate-50 text-slate-600 text-[10px] font-black tracking-widest uppercase hover:bg-slate-100 border border-slate-100">Open Command Center</Button>
                 </div>
              </div>
           </Card>

           <div className="rounded-[48px] bg-slate-900 p-10 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-40 w-40 -translate-y-1/2 translate-x-1/2 rounded-full bg-blue-600/20 blur-3xl group-hover:scale-150 transition-transform duration-1000" />
              <div className="relative z-10">
                 <Badge className="bg-blue-600 text-[10px] font-black uppercase tracking-widest mb-6 px-4 py-1.5 rounded-full border-none">System Update</Badge>
                 <h3 className="mb-4 text-2xl font-black leading-tight">Elite Tier <br/>Verifications</h3>
                 <p className="mb-8 text-sm font-medium text-slate-400 leading-relaxed">
                    Our new auditing system now includes live coding assessments and cultural alignment scorecards.
                 </p>
                 <Button className="h-14 w-full rounded-2xl bg-white text-slate-900 font-black text-[10px] tracking-widest uppercase hover:bg-blue-600 hover:text-white shadow-xl shadow-black/20 group-hover:scale-[1.02] transition-all">Review Audit Protocol</Button>
              </div>
           </div>

           <Card className="rounded-[48px] border-slate-100 p-2 bg-white shadow-sm overflow-hidden">
              <div className="p-10 space-y-8">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ecosystem News</p>
                 <div className="group cursor-pointer">
                    <div className="mb-6 overflow-hidden rounded-[32px] shadow-lg">
                       <img src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=340&h=240&auto=format&fit=crop" alt="News" className="w-full h-48 object-cover transition-transform duration-1000 group-hover:scale-110" />
                    </div>
                    <h4 className="mb-2 text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors">Venture Capital Surge</h4>
                    <p className="text-xs font-medium text-slate-500 leading-relaxed">Infrastructure projects see 24% increase in specialized talent requisition this quarter.</p>
                 </div>
                 <div className="group flex gap-5 cursor-pointer items-center p-4 rounded-3xl hover:bg-slate-50 transition-colors">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
                        <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=150&h=150&auto=format&fit=crop" alt="News" className="h-full w-full object-cover" />
                    </div>
                    <div>
                       <h4 className="text-xs font-black text-slate-900 group-hover:text-blue-600 uppercase tracking-tight">Security Protocol 3.0</h4>
                       <p className="text-[10px] font-medium text-slate-400 mt-1">New escrow release safeguard.</p>
                    </div>
                 </div>
              </div>
           </Card>
        </div>
      </div>
    </PmShell>
  );
};

export default MarketplacePage;
