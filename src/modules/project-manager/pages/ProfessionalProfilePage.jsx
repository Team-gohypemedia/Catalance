import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import Star from "lucide-react/dist/esm/icons/star";
import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right";
import MessageSquare from "lucide-react/dist/esm/icons/message-square";
import Plus from "lucide-react/dist/esm/icons/plus";
import { toast } from "sonner";
import { PmShell } from "@/modules/project-manager/components/PmShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/shared/context/AuthContext";
import { pmApi } from "@/modules/project-manager/services/pm-api";
import { useAsyncResource } from "@/modules/project-manager/hooks/use-async-resource";

const resolveText = (...values) =>
  values
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .find(Boolean) || "";

const resolveList = (value) => (Array.isArray(value) ? value : []);

const resolveSkillLabel = (entry) => {
  if (typeof entry === "string") return entry;
  if (entry && typeof entry === "object") {
    return resolveText(entry.label, entry.name, entry.title);
  }
  return "";
};

const resolveLanguages = (value) =>
  resolveList(value)
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter(Boolean);

const normalizePortfolioRows = (rows = []) =>
  resolveList(rows)
    .map((entry, index) => {
      if (typeof entry === "string") {
        const value = entry.trim();
        return {
          title: `Project ${index + 1}`,
          link: value || "",
          image: "",
          summary: "",
        };
      }

      if (!entry || typeof entry !== "object") return null;

      return {
        title: resolveText(entry.title, entry.name) || `Project ${index + 1}`,
        link: resolveText(entry.link, entry.url, entry.website),
        image: resolveText(entry.image, entry.thumbnail, entry.coverImage),
        summary: resolveText(entry.description, entry.summary),
      };
    })
    .filter(Boolean);

const ProfessionalProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authFetch, user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("about");

  const { data: freelancer, loading } = useAsyncResource(
    () => {
        if (id) return pmApi.getFreelancerDetails(authFetch, id);
        return pmApi.getProfile(authFetch); // Own profile
    },
    [authFetch, id]
  );

  const isFreelancerProfile = Boolean(id);

  const profile = useMemo(() => {
    const source = freelancer || {};
    if (isFreelancerProfile) {
      const skills = resolveList(source.skills)
        .map(resolveSkillLabel)
        .filter(Boolean);
      return {
        id: source.id,
        name: resolveText(source.name) || "Freelancer",
        title: resolveText(source.title) || "Freelancer",
        location: resolveText(source.location),
        avatar: resolveText(source.avatar),
        rating: Number(source.rating || 0),
        bio: resolveText(source.bio),
        skills,
        languages: resolveLanguages(source.languages),
        experience: resolveList(source.experience),
        portfolio: normalizePortfolioRows(source.portfolio),
        testimonials: resolveList(source.testimonials),
        hourlyRate: Number(source.hourlyRate || 0),
        availability: resolveText(source.availability) || "Unavailable",
        timeCommitment: resolveText(source.timeCommitment),
      };
    }

    const profileRecord = source.profile || source;
    const managerDetails = profileRecord?.managerProfile?.profileDetails || {};
    const identity = managerDetails?.identity || {};
    const profileSkills = resolveList(managerDetails?.skills)
      .map(resolveSkillLabel)
      .filter(Boolean);

    return {
      id: profileRecord?.id || currentUser?.id,
      name: resolveText(profileRecord?.fullName, currentUser?.fullName) || "Project Manager",
      title: "Project Manager",
      location: resolveText(identity?.location, profileRecord?.location),
      avatar: resolveText(profileRecord?.avatar, currentUser?.avatar),
      rating: 5,
      bio: resolveText(
        managerDetails?.bio,
        identity?.professionalSummary
      ),
      skills: profileSkills,
      languages: resolveLanguages(identity?.languages),
      experience: resolveList(managerDetails?.workExperience),
      portfolio: normalizePortfolioRows(managerDetails?.portfolioProjects),
      testimonials: [],
      hourlyRate: Number(managerDetails?.hourlyRate || 0),
      availability: profileRecord?.status === "ACTIVE" ? "Available" : "Busy",
      timeCommitment: resolveText(
        managerDetails?.availability?.hoursPerWeek,
        managerDetails?.availabilityHoursPerWeek,
        managerDetails?.availability?.workingSchedule
      ),
    };
  }, [isFreelancerProfile, freelancer, currentUser?.avatar, currentUser?.fullName, currentUser?.id]);

  const portfolioRows = resolveList(profile.portfolio);
  const experienceRows = resolveList(profile.experience);
  const testimonialRows = resolveList(profile.testimonials);

  if (loading) {
    return (
        <PmShell title="Loading Profile..." hideHeader className="p-0">
            <div className="h-[450px] w-full bg-slate-100 animate-pulse" />
            <div className="mx-auto max-w-7xl px-8 -mt-20 relative z-20 pb-20">
                <Card className="h-96 rounded-[40px] animate-pulse" />
            </div>
        </PmShell>
    );
  }

  if (!freelancer) {
      return (
          <PmShell title="Profile Not Found">
              <div className="text-center py-20">
                  <p className="text-slate-400 font-bold">Could not load profile details.</p>
              </div>
          </PmShell>
      );
  }

  const handlePrimaryAction = () => {
    if (isFreelancerProfile && profile.id) {
      navigate(`/project-manager/create-project?freelancerId=${encodeURIComponent(profile.id)}`);
      return;
    }
    navigate("/project-manager/create-project");
  };

  const handleSecondaryAction = () => {
    if (isFreelancerProfile && profile.id) {
      navigate(`/project-manager/messages?freelancerId=${encodeURIComponent(profile.id)}`);
      return;
    }
    navigate("/project-manager/messages");
  };

  const openPortfolioItem = (url) => {
    const link = resolveText(url);
    if (!link) {
      toast.info("Portfolio link is not available for this item.");
      return;
    }

    const href = /^https?:\/\//i.test(link) ? link : `https://${link}`;
    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <PmShell title={profile.name || "Professional Profile"} subtitle={profile.title || ""} hideHeader className="p-0">
      {/* Hero Section */}
      <div className="relative h-[450px] w-full overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-rose-500" />
         <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
         
         <div className="relative z-10 flex h-full flex-col items-center justify-center text-center px-4">
            <div className="group relative mb-6">
                <Avatar className="h-32 w-32 rounded-[2.5rem] border-4 border-white/30 shadow-2xl transition-transform group-hover:scale-105">
                   <AvatarImage src={profile.avatar} />
                   <AvatarFallback>{profile.name ? profile.name[0] : 'AR'}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 border-4 border-white text-white shadow-lg">
                   <CheckCircle2 className="h-5 w-5" />
                </div>
            </div>
            
            <h1 className="mb-2 text-4xl font-bold text-white tracking-tight">{profile.name}</h1>
            <p className="mb-8 text-xl font-medium text-white/80">{profile.title}</p>
            
            <div className="flex gap-4">
               <Button
                 onClick={handlePrimaryAction}
                 className="h-14 rounded-2xl bg-white px-8 text-base font-bold text-indigo-600 shadow-xl hover:bg-white/90"
               >
                 {isFreelancerProfile ? <Plus className="mr-2 h-4 w-4" /> : <ArrowUpRight className="mr-2 h-4 w-4" />}
                 {isFreelancerProfile ? "Hire for Project" : "Create Project"}
               </Button>
               <Button
                 onClick={handleSecondaryAction}
                 className="h-14 rounded-2xl border-2 border-white/30 bg-white/10 px-8 text-base font-bold text-white backdrop-blur-md hover:bg-white/20"
               >
                 <MessageSquare className="mr-2 h-4 w-4" />
                 Send Message
               </Button>
            </div>
         </div>
         
         <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-white/90 uppercase tracking-widest">{profile.availability}</span>
         </div>
      </div>

      <div className="mx-auto max-w-7xl px-8 -mt-20 relative z-20 pb-20">
         <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            {/* Main Content */}
            <div className="space-y-8">
               <Card className="rounded-[40px] border-slate-100 p-10 shadow-xl bg-white/95 backdrop-blur-sm">
                  <div className="mb-10 flex border-b border-slate-100">
                     {["About Me", "Experience", "Portfolio"].map(tab => (
                       <button 
                         key={tab}
                         onClick={() => setActiveTab(tab.toLowerCase().split(' ')[0])}
                         className={`px-8 pb-4 text-sm font-bold transition-all relative ${activeTab === tab.toLowerCase().split(' ')[0] ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                       >
                         {tab}
                         {activeTab === tab.toLowerCase().split(' ')[0] && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />}
                       </button>
                     ))}
                  </div>

                  {activeTab === 'about' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                       <section>
                          <h3 className="mb-4 text-lg font-bold text-slate-900">Professional Summary</h3>
                          <p className="text-base font-medium text-slate-500 leading-relaxed">
                             {profile.bio || "Bio not provided yet."}
                          </p>
                       </section>
                       
                       <section>
                          <h3 className="mb-4 text-lg font-bold text-slate-900">Technical Expertise</h3>
                          {resolveList(profile.skills).length ? (
                            <div className="flex flex-wrap gap-2">
                               {resolveList(profile.skills).map(skill => (
                                 <Badge key={skill} variant="secondary" className="bg-slate-50 text-slate-600 text-xs font-bold rounded-xl px-4 py-2 border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all cursor-default">
                                    {skill}
                                 </Badge>
                               ))}
                            </div>
                          ) : (
                            <p className="text-sm font-medium text-slate-500">Skills not listed yet.</p>
                          )}
                       </section>
                       
                       <section>
                          <div className="flex items-center justify-between mb-4">
                             <h3 className="text-lg font-bold text-slate-900">Featured Projects</h3>
                             <Button
                               variant="link"
                               className="font-bold text-blue-600"
                               onClick={() => setActiveTab("portfolio")}
                             >
                               View Gallery
                             </Button>
                          </div>
                          {portfolioRows.length ? (
                            <div className="grid gap-6 md:grid-cols-3">
                             {portfolioRows.slice(0, 3).map((p, i) => (
                               <div
                                 key={`${p.title}-${i}`}
                                 className="group cursor-pointer overflow-hidden rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md"
                                 onClick={() => openPortfolioItem(p.link)}
                               >
                                  <div className="overflow-hidden h-40">
                                     <img src={p.image || "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?q=80&w=400&h=300&auto=format&fit=crop"} alt={p.title} className="w-full transition-transform duration-500 group-hover:scale-110" />
                                  </div>
                                  <div className="bg-white p-4">
                                     <h4 className="text-sm font-bold text-slate-900">{p.title}</h4>
                                     <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Case Study</p>
                                  </div>
                                </div>
                             ))}
                            </div>
                          ) : (
                            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                              No portfolio projects added yet.
                            </div>
                          )}
                       </section>
                    </div>
                  )}

                  {activeTab === 'experience' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                       {experienceRows.length > 0 ? experienceRows.map((exp, i) => (
                         <div key={i} className="relative pl-10 before:absolute before:left-3 before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-100">
                            <div className="absolute left-0 top-1 h-6 w-6 rounded-full bg-blue-600 border-4 border-white shadow-sm z-10" />
                            <div className="mb-2 flex items-center justify-between">
                               <h4 className="text-lg font-bold text-slate-900">{exp.role || exp.title}</h4>
                               <Badge variant="outline" className="rounded-lg border-slate-200 bg-slate-50 text-slate-500 font-bold text-[10px]">{exp.period}</Badge>
                            </div>
                            <p className="mb-4 text-sm font-bold text-blue-600 uppercase tracking-widest">{exp.company || "Onboarding"}</p>
                            <p className="text-sm font-medium text-slate-500 leading-relaxed">{exp.description}</p>
                         </div>
                       )) : (
                          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                            No experience timeline available yet.
                          </div>
                       )}
                    </div>
                  )}

                  {activeTab === "portfolio" && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                      {portfolioRows.length ? (
                        <div className="grid gap-6 md:grid-cols-2">
                          {portfolioRows.map((item, index) => (
                            <div
                              key={`${item.title}-${index}`}
                              className="group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                            >
                              <div className="h-44 overflow-hidden">
                                <img
                                  src={item.image || "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop"}
                                  alt={item.title}
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                              </div>
                              <div className="space-y-3 p-5">
                                <h4 className="text-base font-black text-slate-900">{item.title}</h4>
                                {item.summary ? (
                                  <p className="line-clamp-2 text-sm font-medium text-slate-500">{item.summary}</p>
                                ) : null}
                                <Button
                                  variant="outline"
                                  className="h-10 rounded-xl border-slate-200 text-xs font-black uppercase tracking-wider"
                                  onClick={() => openPortfolioItem(item.link)}
                                >
                                  Open Case Study
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                          Portfolio is not available yet.
                        </div>
                      )}
                    </div>
                  )}
               </Card>
            </div>

            {/* Sidebar Cards */}
            <div className="space-y-6">
               <Card className="rounded-[40px] border-slate-100 p-8 shadow-lg bg-white overflow-hidden relative">
                  <div className="absolute top-0 right-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-blue-600/5" />
                  <div className="mb-6 flex items-center justify-between">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base Rate</p>
                     <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-bold text-slate-900">{profile.rating}</span>
                     </div>
                  </div>
                  <div className="mb-8">
                     <h2 className="text-5xl font-bold text-slate-900">
                       {profile.hourlyRate > 0 ? `$${profile.hourlyRate}` : "Not specified"}
                       {profile.hourlyRate > 0 ? <span className="text-lg font-medium text-slate-300">/hr</span> : null}
                     </h2>
                     <p className="mt-2 text-xs font-medium text-slate-400">Negotiable for long-term contracts</p>
                  </div>
                  <div className="space-y-4 pt-6 border-t border-slate-100">
                     <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-400 uppercase">Project Time</span>
                        <span className="text-slate-900">{profile.timeCommitment || "Not specified"}</span>
                     </div>
                     <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-400 uppercase">Languages</span>
                        <span className="text-slate-900">
                          {resolveList(profile.languages).length
                            ? resolveList(profile.languages).join(", ")
                            : "Not specified"}
                        </span>
                     </div>
                     <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-400 uppercase">Location</span>
                        <span className="text-slate-900">{profile.location || "Not specified"}</span>
                     </div>
                  </div>
               </Card>

               <div className="rounded-[40px] border border-emerald-100 bg-emerald-50/50 p-8 flex items-center gap-6">
                  <div className="h-12 w-12 shrink-0 flex items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-sm">
                     <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                     <h4 className="text-sm font-bold text-emerald-900">Identity Verified</h4>
                     <p className="text-[11px] font-medium text-emerald-600/80 mt-0.5">Verified by Catalance Security Protocol</p>
                  </div>
               </div>

               <Card className="rounded-[40px] border-slate-100 p-8 shadow-sm">
                  <p className="mb-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client Testimonials</p>
                  <div className="space-y-6">
                     {testimonialRows.map((t, i) => (
                       <div key={i}>
                          <p className="mb-4 text-xs italic leading-relaxed text-slate-600">
                            &quot;{t.text}&quot;
                          </p>
                          <div className="flex items-center gap-3">
                             <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage src={t.avatar} />
                                <AvatarFallback>{t.name ? t.name[0] : 'U'}</AvatarFallback>
                             </Avatar>
                             <div>
                                <h5 className="text-[11px] font-bold text-slate-900">{t.name}</h5>
                                <p className="text-[10px] text-slate-400 font-medium">{t.role}</p>
                             </div>
                         </div>
                       </div>
                     ))}
                     {testimonialRows.length === 0 && (
                         <p className="text-xs text-slate-400 italic">No testimonials yet.</p>
                     )}
                  </div>
               </Card>
            </div>
         </div>
      </div>
    </PmShell>
  );
};

export default ProfessionalProfilePage;
