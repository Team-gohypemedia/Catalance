import { useState } from "react";
import { Link } from "react-router-dom";
import Mail from "lucide-react/dist/esm/icons/mail";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Globe from "lucide-react/dist/esm/icons/globe";
import Clock from "lucide-react/dist/esm/icons/clock";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import Star from "lucide-react/dist/esm/icons/star";
import { PmShell } from "@/modules/project-manager/components/PmShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useParams } from "react-router-dom";
import { useAuth } from "@/shared/context/AuthContext";
import { pmApi } from "@/modules/project-manager/services/pm-api";
import { useAsyncResource } from "@/modules/project-manager/hooks/use-async-resource";

const ProfessionalProfilePage = () => {
  const { id } = useParams();
  const { authFetch, user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("about");

  const { data: freelancer, loading } = useAsyncResource(
    () => {
        if (id) return pmApi.getFreelancerDetails(authFetch, id);
        return pmApi.getProfile(authFetch); // Own profile
    },
    [authFetch, id]
  );

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

  // Map own profile data if needed (pmApi.getProfile returns slightly different structure)
  const profile = id ? freelancer : {
      name: freelancer.personal?.name || currentUser?.fullName,
      title: freelancer.personal?.headline || "Project Manager",
      location: freelancer.personal?.location || "Remote",
      avatar: freelancer.personal?.avatar || currentUser?.avatar,
      rating: 5.0,
      bio: freelancer.personal?.bio || "No bio set yet.",
      skills: freelancer.skills || [],
      experience: freelancer.workExperience || [],
      portfolio: freelancer.portfolioProjects || [],
      testimonials: [],
      hourlyRate: 0,
      availability: freelancer.personal?.available ? "Available" : "Busy",
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
               <Button className="h-14 rounded-2xl bg-white px-8 text-base font-bold text-indigo-600 shadow-xl hover:bg-white/90">Hire for Project</Button>
               <Button className="h-14 rounded-2xl border-2 border-white/30 bg-white/10 px-8 text-base font-bold text-white backdrop-blur-md hover:bg-white/20">Send Message</Button>
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
                             {profile.bio}
                          </p>
                       </section>
                       
                       <section>
                          <h3 className="mb-4 text-lg font-bold text-slate-900">Technical Expertise</h3>
                          <div className="flex flex-wrap gap-2">
                             {(profile.skills || []).map(skill => (
                               <Badge key={skill} variant="secondary" className="bg-slate-50 text-slate-600 text-xs font-bold rounded-xl px-4 py-2 border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all cursor-default">
                                  {skill}
                               </Badge>
                             ))}
                          </div>
                       </section>
                       
                       <section>
                          <div className="flex items-center justify-between mb-4">
                             <h3 className="text-lg font-bold text-slate-900">Featured Projects</h3>
                             <Button variant="link" className="text-blue-600 font-bold">View Gallery</Button>
                          </div>
                          <div className="grid gap-6 md:grid-cols-3">
                             {(profile.portfolio || []).map((p, i) => (
                               <div key={i} className="group cursor-pointer overflow-hidden rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md" onClick={() => p.link && window.open(p.link, "_blank")}>
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
                       </section>
                    </div>
                  )}

                  {activeTab === 'experience' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                       {(profile.experience || []).map((exp, i) => (
                         <div key={i} className="relative pl-10 before:absolute before:left-3 before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-100">
                            <div className="absolute left-0 top-1 h-6 w-6 rounded-full bg-blue-600 border-4 border-white shadow-sm z-10" />
                            <div className="mb-2 flex items-center justify-between">
                               <h4 className="text-lg font-bold text-slate-900">{exp.role || exp.title}</h4>
                               <Badge variant="outline" className="rounded-lg border-slate-200 bg-slate-50 text-slate-500 font-bold text-[10px]">{exp.period}</Badge>
                            </div>
                            <p className="mb-4 text-sm font-bold text-blue-600 uppercase tracking-widest">{exp.company || "Onboarding"}</p>
                            <p className="text-sm font-medium text-slate-500 leading-relaxed">{exp.description}</p>
                         </div>
                       ))}
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
                     <h2 className="text-5xl font-bold text-slate-900">${profile.hourlyRate || '45'}<span className="text-lg font-medium text-slate-300">/hr</span></h2>
                     <p className="mt-2 text-xs font-medium text-slate-400">Negotiable for long-term contracts</p>
                  </div>
                  <div className="space-y-4 pt-6 border-t border-slate-100">
                     <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-400 uppercase">Project Time</span>
                        <span className="text-slate-900">2-4 Weeks</span>
                     </div>
                     <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-400 uppercase">Languages</span>
                        <span className="text-slate-900">English, Spanish</span>
                     </div>
                     <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-400 uppercase">Location</span>
                        <span className="text-slate-900">{profile.location}</span>
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
                     {(profile.testimonials || []).map((t, i) => (
                       <div key={i}>
                          <p className="text-xs font-medium text-slate-600 italic leading-relaxed mb-4">"{t.text}"</p>
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
                     {(!profile.testimonials || profile.testimonials.length === 0) && (
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
