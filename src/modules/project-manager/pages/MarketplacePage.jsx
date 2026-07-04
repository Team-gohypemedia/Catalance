import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import FreelancerProfileDialog from "@/components/features/client/dashboard/FreelancerProfileDialog";

const CATEGORY_KEYWORDS = {
  Developers: ["developer", "development", "frontend", "backend", "full stack", "react", "node", "web"],
  Designers: ["designer", "design", "ui", "ux", "figma", "branding"],
  "Content Writers": ["content", "writer", "copywriter", "blog", "seo content"],
  Marketing: ["marketing", "growth", "ads", "performance", "social", "campaign"],
  "Video Editors": ["video", "editor", "editing", "motion", "after effects", "premiere"],
};

const matchesCategory = (freelancer, category) => {
  const keywords = CATEGORY_KEYWORDS[category] || [];
  if (keywords.length === 0) return true;

  const skills = Array.isArray(freelancer?.skills) ? freelancer.skills.join(" ") : "";
  const haystack = `${freelancer?.title || ""} ${freelancer?.bio || ""} ${skills}`.toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword));
};

const MarketplacePage = () => {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Developers");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [availabilityFilter, setAvailabilityFilter] = useState("ALL");
  const [ratingFilter, setRatingFilter] = useState("0");
  const [experienceFilter, setExperienceFilter] = useState("0");
  const [sortFilter, setSortFilter] = useState("rating");
  const [visibleCount, setVisibleCount] = useState(6);
  const [assigningId, setAssigningId] = useState(null);
  const [loadingProfileId, setLoadingProfileId] = useState(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [viewingFreelancer, setViewingFreelancer] = useState(null);

  const projectId = searchParams.get("projectId");
  const isReassign = searchParams.get("reassign") === "true";

  const tabs = ["Developers", "Designers", "Content Writers", "Marketing", "Video Editors"];

  const { data, loading } = useAsyncResource(
    () =>
      pmApi.searchFreelancers(authFetch, {
        search,
        availability: availabilityFilter === "ALL" ? undefined : availabilityFilter.toLowerCase(),
        rating: Number(ratingFilter || 0) > 0 ? Number(ratingFilter || 0) : undefined,
        projectExperience:
          Number(experienceFilter || 0) > 0 ? Number(experienceFilter || 0) : undefined,
        sort: sortFilter,
      }),
    [authFetch, availabilityFilter, experienceFilter, ratingFilter, search, sortFilter]
  );

  const freelancerList = useMemo(() => data?.freelancers || [], [data?.freelancers]);
  const filteredFreelancerList = useMemo(
    () => freelancerList.filter((item) => matchesCategory(item, activeTab)),
    [activeTab, freelancerList]
  );
  const visibleFreelancers = useMemo(
    () => filteredFreelancerList.slice(0, visibleCount),
    [filteredFreelancerList, visibleCount]
  );
  const pipeline = data?.pipeline || { activeInvites: 0, unreadChats: 0, activeInterviews: 0 };

  useEffect(() => {
    setVisibleCount(6);
  }, [activeTab, availabilityFilter, experienceFilter, ratingFilter, search, sortFilter]);

  const availableCount = useMemo(
    () =>
      filteredFreelancerList.filter((item) =>
        String(item?.availability || "").toLowerCase().startsWith("available")
      ).length,
    [filteredFreelancerList]
  );
  const topSkills = useMemo(() => {
    const counts = new Map();

    filteredFreelancerList.forEach((item) => {
      const skills = Array.isArray(item?.skills) ? item.skills : [];
      skills.forEach((skill) => {
        const key = String(skill || "").trim();
        if (!key) return;
        counts.set(key, (counts.get(key) || 0) + 1);
      });
    });

    return Array.from(counts.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 5);
  }, [filteredFreelancerList]);

  const handleViewFreelancerProfile = useCallback(async (freelancerCard) => {
    if (!freelancerCard?.id) return;

    setLoadingProfileId(freelancerCard.id);
    try {
      const detail = await pmApi.getFreelancerDetails(authFetch, freelancerCard.id);
      const resolvedName = detail?.name || freelancerCard?.name || "Freelancer";
      const mergedFreelancer = {
        ...freelancerCard,
        ...detail,
        id: detail?.id || freelancerCard.id,
        name: resolvedName,
        fullName: resolvedName,
        reviewCount: Number(detail?.reviewCount ?? freelancerCard?.reviewsCount ?? 0),
        reviewsCount: Number(detail?.reviewCount ?? freelancerCard?.reviewsCount ?? 0),
      };
      setViewingFreelancer(mergedFreelancer);
      setProfileDialogOpen(true);
    } catch (e) {
      toast.error(e.message || "Unable to load freelancer profile.");
    } finally {
      setLoadingProfileId(null);
    }
  }, [authFetch]);

  return (
    <PmShell
      title="Talent Marketplace"
      subtitle="Assemble your dream team from our curated pool of elite digital specialists."
    >
      <div className="mb-12 space-y-8 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent -z-10 rounded-[48px] blur-3xl opacity-50 pointer-events-none" />
        <div className="flex flex-col md:flex-row items-center gap-4">
           <div className="relative flex-1 w-full group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[24px] blur opacity-10 group-hover:opacity-30 transition duration-1000 group-hover:duration-200" />
              <Search className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-hover:text-blue-600 transition-colors" />
              <Input 
                placeholder="Search by skill, industry, or expert name..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="relative h-16 rounded-[24px] border-slate-200/80 bg-white/90 backdrop-blur-md pl-14 text-base font-semibold text-slate-800 shadow-xl shadow-slate-200/20 focus-visible:ring-4 focus-visible:ring-blue-500/20 focus-visible:border-blue-400 transition-all placeholder:text-slate-400 placeholder:font-medium"
              />
           </div>
           <Button
             type="button"
             variant="outline"
             onClick={() => setShowAdvancedFilters((current) => !current)}
             className="relative h-16 rounded-[24px] border-slate-200/80 bg-white/90 backdrop-blur-md px-8 font-black text-[10px] uppercase tracking-widest text-slate-600 shadow-sm hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600 transition-all active:scale-95 group"
           >
              <Filter className={`mr-3 h-4 w-4 transition-transform duration-300 ${showAdvancedFilters ? 'rotate-180 text-blue-600' : ''}`} />
              {showAdvancedFilters ? "Hide Filters" : "Advanced Filters"}
           </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
           {tabs.map(tab => (
             <Button 
               key={tab} 
               type="button"
               onClick={() => setActiveTab(tab)}
               className={`relative overflow-hidden h-12 rounded-[24px] px-8 text-[10px] font-black tracking-[0.15em] uppercase transition-all duration-300 ${activeTab === tab ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105 border-0' : 'border border-slate-200 bg-white/80 backdrop-blur-sm text-slate-500 hover:bg-white hover:border-slate-300 hover:text-slate-800'}`}
             >
               {tab}
             </Button>
           ))}
        </div>

        {showAdvancedFilters ? (
          <Card className="rounded-[32px] border-slate-200/60 bg-white/80 backdrop-blur-xl p-6 shadow-xl shadow-slate-200/20 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                  Availability
                </p>
                <select
                  value={availabilityFilter}
                  onChange={(event) => setAvailabilityFilter(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white/50 px-4 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all cursor-pointer hover:bg-white"
                >
                  <option value="ALL">All Status</option>
                  <option value="AVAILABLE">Available Now</option>
                  <option value="UNAVAILABLE">Currently Busy</option>
                </select>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                  Min Rating
                </p>
                <select
                  value={ratingFilter}
                  onChange={(event) => setRatingFilter(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white/50 px-4 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all cursor-pointer hover:bg-white"
                >
                  <option value="0">Any Rating</option>
                  <option value="3">3.0 & Above</option>
                  <option value="4">4.0 & Above</option>
                  <option value="4.5">4.5 & Elite</option>
                </select>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                  Experience
                </p>
                <select
                  value={experienceFilter}
                  onChange={(event) => setExperienceFilter(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white/50 px-4 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all cursor-pointer hover:bg-white"
                >
                  <option value="0">Any Experience</option>
                  <option value="1">1+ Years</option>
                  <option value="3">3+ Years</option>
                  <option value="5">5+ Years Veteran</option>
                </select>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                  Sort Order
                </p>
                <select
                  value={sortFilter}
                  onChange={(event) => setSortFilter(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white/50 px-4 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all cursor-pointer hover:bg-white"
                >
                  <option value="rating">Highest Rated First</option>
                  <option value="best_match">Best Match Score</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAvailabilityFilter("ALL");
                  setRatingFilter("0");
                  setExperienceFilter("0");
                  setSortFilter("rating");
                }}
                className="h-10 rounded-[18px] border-slate-200 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all"
              >
                Reset Filters
              </Button>
            </div>
          </Card>
        ) : null}
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
           <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                 <div className="relative">
                    <div className="absolute inset-0 bg-blue-600 rounded-full blur animate-ping opacity-50" />
                    <div className="relative h-2 w-2 rounded-full bg-blue-600" />
                 </div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">
                    {loading ? "SEARCHING GLOBAL TALENT..." : `${filteredFreelancerList.length} VERIFIED EXPERTS DISCOVERED`}
                 </p>
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                Available now: <span className="text-blue-600 font-black">{availableCount}</span>
              </span>
           </div>

           {loading ? (
                <div className="grid gap-6">
                  {Array.from({length: 3}).map((_, i) => (
                      <Card key={i} className="h-72 rounded-[40px] bg-white/50 backdrop-blur-sm animate-pulse border-slate-100" />
                  ))}
                </div>
           ) : filteredFreelancerList.length > 0 ? (
                <div className="grid gap-6">
                  {visibleFreelancers.map((f, idx) => (
                     <Card 
                       key={f.id} 
                       className="group relative overflow-hidden rounded-[40px] border-slate-200/60 bg-white/80 backdrop-blur-xl shadow-lg shadow-slate-200/30 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1.5 transition-all duration-500 hover:border-blue-200 animate-in fade-in slide-in-from-bottom-4"
                       style={{ animationDelay: `${idx * 100}ms`, animationFillMode: 'both' }}
                     >
                        <div className="p-8">
                          <div className="flex flex-col md:flex-row gap-8">
                             <div className="relative shrink-0 mx-auto md:mx-0">
                                <div className="absolute -inset-3 rounded-[44px] bg-gradient-to-br from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-15 blur-lg transition-all duration-500" />
                                <Avatar className="h-32 w-32 rounded-[36px] shadow-xl shadow-slate-200/50 border-4 border-white bg-slate-50 relative z-10 transition-transform duration-500 group-hover:scale-[1.03] group-hover:-rotate-2">
                                   <AvatarImage src={f.avatar} />
                                   <AvatarFallback className="text-3xl font-black bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">{String(f?.name || "F")[0]}</AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-2 -right-2 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border-4 border-white text-white shadow-lg relative z-20 transition-transform duration-300 group-hover:scale-110">
                                   <CheckCircle2 className="h-5 w-5" />
                                </div>
                             </div>
          
                             <div className="flex-1 text-center md:text-left flex flex-col justify-between">
                                <div className="mb-4 flex flex-col md:flex-row md:items-start justify-between gap-4">
                                   <div>
                                      <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                                         <h3 className="text-2xl font-black text-slate-900 leading-tight group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-indigo-600 group-hover:bg-clip-text group-hover:text-transparent transition-all">{f.name}</h3>
                                         {f.rating >= 4.8 && (
                                             <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-600 rounded-full border border-amber-200/50 shadow-sm">
                                                <Award className="h-3.5 w-3.5" />
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em]">ELITE</span>
                                             </div>
                                         )}
                                      </div>
                                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-2">
                                         <h4 className="text-[15px] font-bold text-slate-700 line-clamp-1">{f.title}</h4>
                                      </div>
                                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                         <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 text-slate-500 border border-slate-100">
                                            <MapPin className="h-3.5 w-3.5" />
                                            <span className="text-[10px] font-black uppercase tracking-wider">{f.location || "Remote"}</span>
                                         </div>
                                         <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50/50 border border-blue-100/50">
                                            <Star className="h-3.5 w-3.5 fill-blue-500 text-blue-500" />
                                            <span className="text-[11px] font-black text-blue-700">{f.rating > 0 ? f.rating.toFixed(1) : 'New'}</span>
                                            {f.reviewsCount > 0 && <span className="text-[10px] font-bold text-blue-500/70">({f.reviewsCount})</span>}
                                         </div>
                                         <div className="px-2.5 py-1 rounded-xl bg-indigo-50/50 border border-indigo-100/50">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">{f.projectExperience} YRS EXP</span>
                                         </div>
                                      </div>
                                   </div>
                                   <div className="md:text-right p-5 rounded-[24px] bg-slate-50/80 border border-slate-100/80 group-hover:bg-gradient-to-br group-hover:from-blue-600 group-hover:to-indigo-600 group-hover:border-transparent group-hover:shadow-lg group-hover:shadow-blue-500/20 transition-all duration-300">
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 group-hover:text-blue-100">HOURLY RATE</p>
                                      {Number(f.hourlyRate || 0) > 0 ? (
                                        <div className="flex items-baseline justify-center md:justify-end gap-1">
                                          <span className="text-lg font-black text-slate-400 group-hover:text-blue-200">₹</span>
                                          <p className="text-3xl font-black text-slate-800 group-hover:text-white tracking-tight">
                                            {Number(f.hourlyRate).toLocaleString("en-IN")}
                                          </p>
                                          <span className="text-xs font-bold text-slate-400 group-hover:text-blue-200">/hr</span>
                                        </div>
                                      ) : (
                                        <p className="text-sm font-black text-slate-500 group-hover:text-white pt-2">
                                          Negotiable
                                        </p>
                                      )}
                                   </div>
                                </div>
          
                                <div className="mb-6">
                                   <p className="text-[14px] font-medium text-slate-500 leading-relaxed line-clamp-2 max-w-2xl">
                                      {f.bio || "No biography provided. View profile for more details about this expert's experience and portfolio."}
                                   </p>
                                </div>
          
                                <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-auto">
                                   {(Array.isArray(f.skills) ? f.skills : []).slice(0, 6).map(skill => (
                                     <span key={skill} className="bg-slate-50 border border-slate-200/60 text-slate-600 text-[10px] font-black rounded-xl px-4 py-1.5 shadow-sm group-hover:border-blue-200 group-hover:bg-blue-50/50 transition-colors uppercase tracking-widest">{skill}</span>
                                   ))}
                                   {(Array.isArray(f.skills) && f.skills.length > 6) && (
                                     <span className="bg-slate-100/50 text-slate-400 text-[10px] font-black rounded-xl px-3 py-1.5 uppercase tracking-widest">+{f.skills.length - 6} MORE</span>
                                   )}
                                </div>
                             </div>
                          </div>
          
                          <div className="flex flex-col sm:flex-row gap-4 pt-8 mt-8 border-t border-slate-100/80">
                             <Button 
                               className={`h-14 flex-1 rounded-[20px] font-black text-[10px] tracking-[0.2em] uppercase text-white shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0 ${projectId ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/20 hover:shadow-blue-500/40' : 'bg-slate-900 shadow-slate-900/10 hover:shadow-slate-900/30'}`} 
                               disabled={assigningId === f.id}
                               onClick={async () => {
                                 if (projectId) {
                                     setAssigningId(f.id);
                                     try {
                                         if (isReassign) {
                                             const result = await pmApi.replaceFreelancer(authFetch, projectId, f.id);
                                             if (result?.approvalRequired) {
                                               toast.success("Admin approval request sent for this reassignment");
                                             } else {
                                               toast.success("Freelancer reassigned successfully");
                                             }
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
                                     navigate(`/project-manager/create-project?freelancerId=${encodeURIComponent(f.id)}`);
                                 }
                               }}
                             >
                               {assigningId === f.id ? <Loader2 className="h-5 w-5 animate-spin" /> : (projectId ? (isReassign ? "Confirm Reassignment" : "Assign to Project") : "Initiate Booking")}
                             </Button>
                             <Button 
                               variant="outline" 
                               className="h-14 flex-1 rounded-[20px] border-slate-200 bg-white/50 backdrop-blur-sm font-black text-[10px] tracking-[0.2em] uppercase text-slate-600 shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 group/btn" 
                               disabled={loadingProfileId === f.id}
                               onClick={() => handleViewFreelancerProfile(f)}
                             >
                                {loadingProfileId === f.id ? (
                                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                                ) : (
                                  <>
                                    View Full Profile
                                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover/btn:text-slate-800 group-hover/btn:translate-x-1 transition-all" />
                                  </>
                                )}
                             </Button>
                          </div>
                        </div>
                     </Card>
                  ))}
                </div>
           ) : (
                <div className="py-24 text-center flex flex-col items-center justify-center space-y-8 rounded-[48px] bg-gradient-to-b from-white/60 to-slate-50/60 backdrop-blur-md border-2 border-dashed border-slate-200/80 shadow-sm animate-in fade-in duration-500">
                    <div className="relative">
                       <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl animate-pulse opacity-50" />
                       <div className="h-28 w-28 bg-white rounded-[32px] rotate-3 flex items-center justify-center relative z-10 shadow-xl shadow-slate-200/50 border border-slate-100">
                          <Search className="h-12 w-12 text-blue-500 -rotate-3" />
                       </div>
                    </div>
                    <div className="space-y-3 max-w-md px-4">
                       <p className="text-2xl font-black text-slate-800 tracking-tight">No experts found.</p>
                       <p className="text-sm font-medium text-slate-500 leading-relaxed">We couldn't find any professionals matching your exact criteria in this sector. Try broadening your parameters.</p>
                    </div>
                    <Button variant="default" onClick={() => { setSearch(""); setActiveTab("Developers"); setAvailabilityFilter("ALL"); setRatingFilter("0"); setExperienceFilter("0"); }} className="h-14 rounded-[20px] bg-slate-900 hover:bg-slate-800 px-12 text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-1">Reset Discovery</Button>
                </div>
           )}

           <Button
             type="button"
             variant="ghost"
             disabled={visibleFreelancers.length >= filteredFreelancerList.length}
             onClick={() => setVisibleCount((current) => current + 6)}
             className="w-full h-16 rounded-[24px] text-slate-400 font-black text-[11px] tracking-[0.3em] uppercase hover:text-blue-600 hover:bg-blue-50 hover:shadow-sm transition-all disabled:opacity-30 disabled:hover:bg-transparent"
           >
             {visibleFreelancers.length >= filteredFreelancerList.length ? "END OF RESULTS" : "LOAD NEXT WAVE"}
           </Button>
        </div>

        <div className="space-y-6">
           <Card className="rounded-[40px] border-slate-800 p-10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 group-hover:scale-110 group-hover:opacity-20 transition-all duration-700 pointer-events-none">
                 <Zap className="h-48 w-48 text-blue-400" />
              </div>
              <div className="relative z-10">
                 <p className="mb-8 flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.25em] text-blue-400">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20">
                      <Zap className="h-3 w-3 fill-blue-400" />
                    </span>
                    Pipeline Intel
                 </p>
                 <div className="space-y-6">
                    <div className="group/stat cursor-pointer">
                       <h4 className="mb-2 text-base font-black text-white group-hover/stat:text-blue-400 transition-colors tracking-wide">Contracting Velocity</h4>
                       <p className="text-[13px] font-medium text-slate-400 leading-relaxed">
                         You have <span className="inline-flex items-center justify-center bg-blue-500/20 border border-blue-500/30 text-blue-400 font-black rounded-lg px-2.5 py-0.5 mx-1">{pipeline.activeInvites}</span> active proposals awaiting response.
                       </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="rounded-[28px] border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm p-6 text-center hover:bg-slate-700/50 hover:border-slate-600/50 transition-all cursor-default">
                          <p className="text-3xl font-black text-white tracking-tight">{pipeline.activeInterviews}</p>
                          <p className="mt-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Interviews</p>
                       </div>
                       <div className="rounded-[28px] border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm p-6 text-center hover:bg-slate-700/50 hover:border-slate-600/50 transition-all cursor-default">
                          <p className="text-3xl font-black text-white tracking-tight">{pipeline.unreadChats}</p>
                          <p className="mt-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Unread Msg</p>
                       </div>
                    </div>
                 </div>
              </div>
           </Card>

           <Card className="rounded-[32px] border-slate-200/60 bg-white/80 backdrop-blur-xl p-8 shadow-xl shadow-slate-200/20">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
               Availability Snapshot
             </p>
             <div className="mt-6 grid grid-cols-2 gap-4">
               <div className="rounded-[24px] border border-emerald-100 bg-gradient-to-b from-emerald-50/50 to-emerald-50/20 p-5 hover:shadow-md hover:shadow-emerald-500/10 transition-shadow">
                 <p className="text-2xl font-black text-emerald-600">{availableCount}</p>
                 <p className="mt-1 text-[10px] font-black uppercase tracking-[0.15em] text-emerald-600/70">
                   Available
                 </p>
               </div>
               <div className="rounded-[24px] border border-slate-100 bg-gradient-to-b from-slate-50 to-white p-5 hover:shadow-md hover:shadow-slate-200/30 transition-shadow">
                 <p className="text-2xl font-black text-slate-700">{Math.max(filteredFreelancerList.length - availableCount, 0)}</p>
                 <p className="mt-1 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                   Busy
                 </p>
               </div>
             </div>
           </Card>

           <Card className="rounded-[32px] border-slate-200/60 bg-white/80 backdrop-blur-xl p-8 shadow-xl shadow-slate-200/20">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">
               Top Skills <span className="font-medium opacity-60">(Current Results)</span>
             </p>
             <div className="space-y-3">
               {topSkills.length > 0 ? (
                 topSkills.map(([skill, count], index) => (
                   <div key={skill} className="group flex items-center justify-between rounded-[20px] border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-sm hover:border-slate-200 px-4 py-3 transition-all">
                     <div className="flex items-center gap-3">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200/50 text-[10px] font-black text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">{index + 1}</span>
                        <span className="text-[13px] font-bold text-slate-700 group-hover:text-slate-900 transition-colors uppercase tracking-wide">{skill}</span>
                     </div>
                     <Badge className="bg-slate-200/50 text-[10px] font-black text-slate-600 hover:bg-slate-200 rounded-lg px-2.5">{count}</Badge>
                   </div>
                 ))
               ) : (
                 <div className="py-6 text-center rounded-[20px] bg-slate-50 border border-dashed border-slate-200">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No skill data</p>
                 </div>
               )}
             </div>
           </Card>
        </div>
      </div>

      <FreelancerProfileDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        viewingFreelancer={viewingFreelancer}
      />
    </PmShell>
  );
};

export default MarketplacePage;

