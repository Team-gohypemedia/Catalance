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
      <div className="mb-8 space-y-5">
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row items-center gap-3">
           <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by skill, industry, or expert name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 rounded-2xl border-border bg-card pl-12 text-sm font-semibold text-foreground shadow-xs focus-visible:ring-2 focus-visible:ring-primary/20 placeholder:text-muted-foreground"
              />
           </div>
           <Button
             type="button"
             variant="outline"
             onClick={() => setShowAdvancedFilters((current) => !current)}
             className="h-12 rounded-2xl border-border bg-card px-6 text-xs font-bold text-foreground hover:bg-muted transition-colors"
           >
              <Filter className={`mr-2 h-4 w-4 transition-transform duration-300 ${showAdvancedFilters ? 'rotate-180 text-primary' : 'text-muted-foreground'}`} />
              {showAdvancedFilters ? "Hide Filters" : "Advanced Filters"}
           </Button>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-2">
           {tabs.map(tab => (
             <Button
               key={tab}
               type="button"
               onClick={() => setActiveTab(tab)}
               className={`h-9 rounded-full px-5 text-xs font-bold transition-all ${activeTab === tab ? 'bg-primary text-primary-foreground shadow-xs' : 'border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'}`}
             >
               {tab}
             </Button>
           ))}
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters ? (
          <Card className="rounded-2xl border-border bg-card p-5 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-0.5">
                  Availability
                </p>
                <select
                  value={availabilityFilter}
                  onChange={(event) => setAvailabilityFilter(event.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                >
                  <option value="ALL">All Status</option>
                  <option value="AVAILABLE">Available Now</option>
                  <option value="UNAVAILABLE">Currently Busy</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-0.5">
                  Min Rating
                </p>
                <select
                  value={ratingFilter}
                  onChange={(event) => setRatingFilter(event.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                >
                  <option value="0">Any Rating</option>
                  <option value="3">3.0 & Above</option>
                  <option value="4">4.0 & Above</option>
                  <option value="4.5">4.5 & Elite</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-0.5">
                  Experience
                </p>
                <select
                  value={experienceFilter}
                  onChange={(event) => setExperienceFilter(event.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                >
                  <option value="0">Any Experience</option>
                  <option value="1">1+ Years</option>
                  <option value="3">3+ Years</option>
                  <option value="5">5+ Years Veteran</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-0.5">
                  Sort Order
                </p>
                <select
                  value={sortFilter}
                  onChange={(event) => setSortFilter(event.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                >
                  <option value="rating">Highest Rated First</option>
                  <option value="best_match">Best Match Score</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAvailabilityFilter("ALL");
                  setRatingFilter("0");
                  setExperienceFilter("0");
                  setSortFilter("rating");
                }}
                className="h-9 rounded-xl border-border px-5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                Reset Filters
              </Button>
            </div>
          </Card>
        ) : null}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
           {/* Results Count Bar */}
           <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2.5">
                 <div className="h-2 w-2 rounded-full bg-primary" />
                 <p className="text-xs font-semibold text-muted-foreground">
                    {loading ? "Searching talent..." : `${filteredFreelancerList.length} verified experts discovered`}
                 </p>
              </div>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                Available: {availableCount}
              </span>
           </div>

           {/* Freelancer Cards */}
           {loading ? (
                <div className="grid gap-4">
                  {Array.from({length: 3}).map((_, i) => (
                      <Card key={i} className="h-48 rounded-2xl bg-muted/50 animate-pulse border-border/50" />
                  ))}
                </div>
           ) : filteredFreelancerList.length > 0 ? (
                <div className="grid gap-4">
                  {visibleFreelancers.map((f, idx) => (
                     <Card
                       key={f.id}
                       className="group rounded-2xl border-border/70 bg-card shadow-xs hover:shadow-md hover:border-border transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
                       style={{ animationDelay: `${idx * 60}ms`, animationFillMode: 'both' }}
                     >
                        <div className="p-5">
                          {/* Top Row: Avatar + Info + Rate */}
                          <div className="flex items-start gap-4">
                             {/* Avatar */}
                             <div className="relative shrink-0">
                                <Avatar className="h-14 w-14 rounded-xl border border-border shadow-xs">
                                   <AvatarImage src={f.avatar} />
                                   <AvatarFallback className="text-lg font-bold bg-muted text-muted-foreground rounded-xl">{String(f?.name || "F")[0]}</AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 border-2 border-card text-white">
                                   <CheckCircle2 className="h-3 w-3" />
                                </div>
                             </div>

                             {/* Info */}
                             <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                   <h3 className="text-base font-bold text-foreground truncate leading-tight">{f.name}</h3>
                                   {f.rating >= 4.8 && (
                                       <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 rounded-full border border-amber-200/50 shrink-0">
                                          <Award className="h-3 w-3" />
                                          <span className="text-[9px] font-bold uppercase">Elite</span>
                                       </div>
                                   )}
                                </div>
                                <p className="text-sm font-medium text-muted-foreground truncate mb-2">{f.title}</p>
                                <div className="flex flex-wrap items-center gap-1.5">
                                   <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                      <MapPin className="h-3 w-3" />
                                      <span className="text-[10px] font-bold">{f.location || "Remote"}</span>
                                   </div>
                                   <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                      <Star className="h-3 w-3 fill-current" />
                                      <span className="text-[10px] font-bold">{f.rating > 0 ? f.rating.toFixed(1) : 'New'}</span>
                                      {f.reviewsCount > 0 && <span className="text-[9px] font-medium opacity-70">({f.reviewsCount})</span>}
                                   </div>
                                   <div className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                                      <span className="text-[10px] font-bold">{f.projectExperience} yrs exp</span>
                                   </div>
                                </div>
                             </div>

                             {/* Hourly Rate */}
                             <div className="hidden md:block shrink-0 text-right p-3 rounded-xl bg-muted/50 border border-border/60 min-w-[100px]">
                                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Hourly Rate</p>
                                {Number(f.hourlyRate || 0) > 0 ? (
                                  <div className="flex items-baseline justify-end gap-0.5">
                                    <span className="text-xs font-bold text-muted-foreground">₹</span>
                                    <p className="text-xl font-bold text-foreground tracking-tight">
                                      {Number(f.hourlyRate).toLocaleString("en-IN")}
                                    </p>
                                    <span className="text-[10px] font-medium text-muted-foreground">/hr</span>
                                  </div>
                                ) : (
                                  <p className="text-sm font-bold text-muted-foreground">Negotiable</p>
                                )}
                             </div>
                          </div>

                          {/* Bio */}
                          <p className="text-xs font-medium text-muted-foreground leading-relaxed line-clamp-2 mt-3 max-w-3xl">
                             {f.bio || "No biography provided. View profile for more details about this expert's experience and portfolio."}
                          </p>

                          {/* Skills */}
                          <div className="flex flex-wrap gap-1.5 mt-3">
                             {(Array.isArray(f.skills) ? f.skills : []).slice(0, 6).map(skill => (
                               <span key={skill} className="bg-muted border border-border/50 text-foreground text-[10px] font-semibold rounded-full px-2.5 py-0.5 uppercase">{skill}</span>
                             ))}
                             {(Array.isArray(f.skills) && f.skills.length > 6) && (
                               <span className="bg-muted/60 text-muted-foreground text-[10px] font-bold rounded-full px-2.5 py-0.5">+{f.skills.length - 6} more</span>
                             )}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-border/60">
                             <Button
                               className="h-10 flex-1 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
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
                               {assigningId === f.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (projectId ? (isReassign ? "Confirm Reassignment" : "Assign to Project") : "Initiate Booking")}
                             </Button>
                             <Button
                               variant="outline"
                               className="h-10 flex-1 rounded-xl border-border text-xs font-bold text-foreground hover:bg-muted transition-all flex items-center justify-center gap-2 cursor-pointer"
                               disabled={loadingProfileId === f.id}
                               onClick={() => handleViewFreelancerProfile(f)}
                             >
                                {loadingProfileId === f.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                ) : (
                                  <>
                                    View Full Profile
                                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                  </>
                                )}
                             </Button>
                          </div>
                        </div>
                     </Card>
                  ))}
                </div>
           ) : (
                <div className="py-16 text-center flex flex-col items-center justify-center space-y-5 rounded-2xl bg-card border-2 border-dashed border-border">
                    <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
                       <Search className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <div className="space-y-2 max-w-md px-4">
                       <p className="text-lg font-bold text-foreground">No experts found</p>
                       <p className="text-sm font-medium text-muted-foreground leading-relaxed">We couldn't find any professionals matching your criteria. Try broadening your parameters.</p>
                    </div>
                    <Button variant="default" onClick={() => { setSearch(""); setActiveTab("Developers"); setAvailabilityFilter("ALL"); setRatingFilter("0"); setExperienceFilter("0"); }} className="h-10 rounded-xl bg-primary text-primary-foreground px-8 text-xs font-bold shadow-xs cursor-pointer">Reset Discovery</Button>
                </div>
           )}

           {/* Load More */}
           <Button
             type="button"
             variant="ghost"
             disabled={visibleFreelancers.length >= filteredFreelancerList.length}
             onClick={() => setVisibleCount((current) => current + 6)}
             className="w-full h-11 rounded-xl text-muted-foreground font-bold text-xs hover:text-primary hover:bg-primary/5 transition-all disabled:opacity-30"
           >
             {visibleFreelancers.length >= filteredFreelancerList.length ? "End of results" : "Load more"}
           </Button>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
           {/* Pipeline Intel */}
           <Card className="rounded-2xl border-border bg-foreground p-6 text-background overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                 <Zap className="h-32 w-32" />
              </div>
              <div className="relative z-10">
                 <p className="mb-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-background/60">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background/10">
                      <Zap className="h-3 w-3 fill-current" />
                    </span>
                    Pipeline Intel
                 </p>
                 <div className="space-y-4">
                    <div>
                       <h4 className="mb-1.5 text-sm font-bold text-background">Contracting Velocity</h4>
                       <p className="text-xs font-medium text-background/50 leading-relaxed">
                         You have <span className="inline-flex items-center justify-center bg-background/10 border border-background/20 text-background font-bold rounded-md px-2 py-0.5 mx-0.5">{pipeline.activeInvites}</span> active proposals awaiting response.
                       </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                       <div className="rounded-xl border border-background/10 bg-background/5 p-4 text-center">
                          <p className="text-2xl font-bold text-background">{pipeline.activeInterviews}</p>
                          <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-background/50">Interviews</p>
                       </div>
                       <div className="rounded-xl border border-background/10 bg-background/5 p-4 text-center">
                          <p className="text-2xl font-bold text-background">{pipeline.unreadChats}</p>
                          <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-background/50">Unread Msg</p>
                       </div>
                    </div>
                 </div>
              </div>
           </Card>

           {/* Availability Snapshot */}
           <Card className="rounded-2xl border-border bg-card p-6 shadow-xs">
             <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
               Availability Snapshot
             </p>
             <div className="mt-4 grid grid-cols-2 gap-3">
               <div className="rounded-xl border border-emerald-200/50 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/10 p-4">
                 <p className="text-xl font-bold text-emerald-600">{availableCount}</p>
                 <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600/70">
                   Available
                 </p>
               </div>
               <div className="rounded-xl border-border bg-muted/30 p-4">
                 <p className="text-xl font-bold text-foreground">{Math.max(filteredFreelancerList.length - availableCount, 0)}</p>
                 <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                   Busy
                 </p>
               </div>
             </div>
           </Card>

           {/* Top Skills */}
           <Card className="rounded-2xl border-border bg-card p-6 shadow-xs">
             <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-4">
               Top Skills <span className="font-medium opacity-60">(Current Results)</span>
             </p>
             <div className="space-y-2">
               {topSkills.length > 0 ? (
                 topSkills.map(([skill, count], index) => (
                   <div key={skill} className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 hover:bg-muted px-3 py-2.5 transition-colors">
                     <div className="flex items-center gap-2.5">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">{index + 1}</span>
                        <span className="text-xs font-semibold text-foreground">{skill}</span>
                     </div>
                     <Badge className="bg-muted text-[10px] font-bold text-muted-foreground hover:bg-muted rounded-md px-2">{count}</Badge>
                   </div>
                 ))
               ) : (
                 <div className="py-4 text-center rounded-xl bg-muted/20 border border-dashed border-border">
                    <p className="text-xs font-bold text-muted-foreground">No skill data</p>
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
