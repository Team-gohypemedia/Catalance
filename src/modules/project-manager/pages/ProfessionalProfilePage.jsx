import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import Star from "lucide-react/dist/esm/icons/star";
import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right";
import MessageSquare from "lucide-react/dist/esm/icons/message-square";
import Plus from "lucide-react/dist/esm/icons/plus";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import { toast } from "sonner";
import { PmShell } from "@/modules/project-manager/components/PmShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/shared/context/AuthContext";
import { pmApi } from "@/modules/project-manager/services/pm-api";
import { useAsyncResource } from "@/modules/project-manager/hooks/use-async-resource";

const resolveText = (...values) =>
  values
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .find(Boolean) || "";

const resolveList = (value) => (Array.isArray(value) ? value : []);
const resolveObject = (value) => (value && typeof value === "object" && !Array.isArray(value) ? value : {});
const toCsv = (value) => resolveList(value).map((entry) => String(entry || "").trim()).filter(Boolean).join(", ");
const fromCsv = (value) =>
  String(value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
const toPositiveNumber = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  return Math.round(numeric);
};

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

const createPmFormState = ({ source = {}, currentUser = null }) => {
  const profileRecord = resolveObject(source?.profile || source);
  const pendingRequest = resolveObject(source?.pendingRequest);
  const pendingData = resolveObject(pendingRequest?.requestedData);
  const profileDetails = resolveObject(profileRecord?.managerProfile?.profileDetails);
  const contactDetails = resolveObject(pendingData.contactDetails);
  const pendingAvailability = resolveObject(pendingData.availability);
  const pendingIdentity = resolveObject(pendingData.identity);
  const pendingIdentification = resolveObject(pendingData.identification);
  const storedAvailability = resolveObject(profileDetails.availability);
  const storedIdentity = resolveObject(profileDetails.identity);
  const storedIdentification = resolveObject(profileDetails.identification);

  return {
    fullName: resolveText(pendingData.fullName, profileRecord?.fullName, currentUser?.fullName),
    contactEmail: resolveText(
      contactDetails.email,
      profileRecord?.email,
      currentUser?.email
    ),
    contactPhone: resolveText(
      contactDetails.phone,
      profileRecord?.phoneNumber,
      currentUser?.phoneNumber
    ),
    skillsInput: toCsv(pendingData.skills || profileDetails.skills),
    expertiseSummary: resolveText(
      pendingData.expertise,
      pendingIdentity.professionalSummary,
      profileDetails?.bio,
      storedIdentity.professionalSummary
    ),
    yearsExperience: String(
      pendingData?.experience?.years ??
        pendingData?.yearsOfExperience ??
        profileDetails?.yearsOfExperience ??
        0
    ),
    availabilityStatus: resolveText(
      pendingAvailability.status,
      storedAvailability.status,
      profileRecord?.status === "ACTIVE" ? "Available" : "Busy"
    ),
    availabilityHours: resolveText(
      pendingAvailability.hoursPerWeek,
      storedAvailability.hoursPerWeek,
      profileDetails?.availabilityHoursPerWeek
    ),
    availabilitySchedule: resolveText(
      pendingAvailability.workingSchedule,
      storedAvailability.workingSchedule
    ),
    availabilityTimezone: resolveText(
      pendingAvailability.timezone,
      storedAvailability.timezone
    ),
    location: resolveText(
      pendingIdentity.location,
      storedIdentity.location,
      profileRecord?.location
    ),
    identityType: resolveText(
      pendingIdentification.type,
      storedIdentification.type
    ),
    identityNumber: resolveText(
      pendingIdentification.number,
      storedIdentification.number
    ),
    identityDocumentUrl: resolveText(
      pendingIdentification.documentUrl,
      storedIdentification.documentUrl
    ),
  };
};

const buildPmProfilePayload = (formState) => {
  const skills = fromCsv(formState.skillsInput);
  const yearsOfExperience = toPositiveNumber(formState.yearsExperience);
  const summary = resolveText(formState.expertiseSummary);

  return {
    fullName: resolveText(formState.fullName),
    contactDetails: {
      email: resolveText(formState.contactEmail),
      phone: resolveText(formState.contactPhone),
    },
    skills,
    expertise: summary,
    yearsOfExperience,
    experience: {
      years: yearsOfExperience,
    },
    availability: {
      status: resolveText(formState.availabilityStatus),
      hoursPerWeek: resolveText(formState.availabilityHours),
      workingSchedule: resolveText(formState.availabilitySchedule),
      timezone: resolveText(formState.availabilityTimezone),
    },
    identification: {
      type: resolveText(formState.identityType),
      number: resolveText(formState.identityNumber),
      documentUrl: resolveText(formState.identityDocumentUrl),
    },
    identity: {
      professionalTitle: "Project Manager",
      professionalSummary: summary,
      location: resolveText(formState.location),
    },
    workExperience:
      yearsOfExperience > 0
        ? [
            {
              role: "Project Manager",
              company: "Catalance",
              period: `${yearsOfExperience}+ years`,
              description: summary || "Operational project management experience.",
            },
          ]
        : [],
    profileMeta: {
      flow: "PM_ONBOARDING_V1",
      submittedAt: new Date().toISOString(),
    },
  };
};

const buildPmChecklist = (formState) => [
  { key: "fullName", label: "Full Name", complete: Boolean(resolveText(formState.fullName)) },
  {
    key: "contact",
    label: "Contact Details",
    complete: Boolean(resolveText(formState.contactEmail) && resolveText(formState.contactPhone)),
  },
  {
    key: "skills",
    label: "Skills / Expertise",
    complete: fromCsv(formState.skillsInput).length > 0 && Boolean(resolveText(formState.expertiseSummary)),
  },
  {
    key: "experience",
    label: "Experience",
    complete: toPositiveNumber(formState.yearsExperience) > 0,
  },
  {
    key: "availability",
    label: "Availability",
    complete: Boolean(resolveText(formState.availabilityStatus) && resolveText(formState.availabilityHours)),
  },
  {
    key: "identification",
    label: "Identification Details",
    complete: Boolean(resolveText(formState.identityType) && resolveText(formState.identityNumber)),
  },
];

const ProfessionalProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authFetch, user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("about");
  const [editMode, setEditMode] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [pmForm, setPmForm] = useState(() => createPmFormState({ source: {}, currentUser }));

  const profileResource = useAsyncResource(
    () => {
        if (id) return pmApi.getFreelancerDetails(authFetch, id);
        return pmApi.getProfile(authFetch); // Own profile
    },
    [authFetch, id]
  );
  const freelancer = profileResource.data;
  const loading = profileResource.loading;

  const isFreelancerProfile = Boolean(id);
  const pendingRequest = !isFreelancerProfile ? freelancer?.pendingRequest || null : null;

  useEffect(() => {
    if (isFreelancerProfile || !freelancer) return;
    const nextState = createPmFormState({ source: freelancer, currentUser });
    setPmForm(nextState);
    setEditMode(Boolean(pendingRequest) || buildPmChecklist(nextState).some((item) => !item.complete));
  }, [isFreelancerProfile, freelancer, currentUser, pendingRequest]);

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
  const pmChecklist = buildPmChecklist(pmForm);
  const completedChecklist = pmChecklist.filter((item) => item.complete).length;
  const isOnboardingComplete = completedChecklist === pmChecklist.length;

  const updatePmField = (key, value) => {
    setPmForm((current) => ({ ...current, [key]: value }));
  };

  const submitPmProfileRequest = async () => {
    if (isFreelancerProfile || savingProfile) return;

    const checklist = buildPmChecklist(pmForm);
    if (checklist.some((item) => !item.complete)) {
      toast.error("Please complete all required onboarding fields before submitting.");
      return;
    }

    setSavingProfile(true);
    try {
      const payload = buildPmProfilePayload(pmForm);
      await pmApi.submitProfileEdit(authFetch, payload);
      await profileResource.refresh();
      setEditMode(false);
      toast.success("Profile update submitted. It is now pending Admin approval.");
    } catch (error) {
      toast.error(error?.message || "Unable to submit profile update request.");
    } finally {
      setSavingProfile(false);
    }
  };

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
            {!isFreelancerProfile ? (
              <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
                <Badge className="border border-white/40 bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                  {completedChecklist}/{pmChecklist.length} onboarding complete
                </Badge>
                {pendingRequest ? (
                  <Badge className="border border-amber-200/70 bg-amber-100/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-100">
                    Pending Admin Approval
                  </Badge>
                ) : null}
              </div>
            ) : null}
            
            <div className="flex gap-4">
              {isFreelancerProfile ? (
                <>
                  <Button
                    onClick={handlePrimaryAction}
                    className="h-14 rounded-2xl bg-white px-8 text-base font-bold text-indigo-600 shadow-xl hover:bg-white/90"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Hire for Project
                  </Button>
                  <Button
                    onClick={handleSecondaryAction}
                    className="h-14 rounded-2xl border-2 border-white/30 bg-white/10 px-8 text-base font-bold text-white backdrop-blur-md hover:bg-white/20"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    onClick={() => setEditMode((current) => !current)}
                    className="h-14 rounded-2xl bg-white px-8 text-base font-bold text-indigo-600 shadow-xl hover:bg-white/90"
                  >
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                    {editMode ? "Preview Profile" : "Edit Profile"}
                  </Button>
                  <Button
                    type="button"
                    onClick={submitPmProfileRequest}
                    disabled={savingProfile}
                    className="h-14 rounded-2xl border-2 border-white/40 bg-white/10 px-8 text-base font-bold text-white backdrop-blur-md hover:bg-white/20 disabled:opacity-60"
                  >
                    {savingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-2 h-4 w-4" />}
                    Submit for Approval
                  </Button>
                </>
              )}
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
                      {isFreelancerProfile ? (
                        <>
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
                        </>
                      ) : (
                        <div className="space-y-8">
                          <section className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                                PM Onboarding Flow
                              </h3>
                              <Badge className="bg-white text-slate-700 border border-blue-200 text-[10px] font-black uppercase tracking-wider">
                                {completedChecklist} / {pmChecklist.length} complete
                              </Badge>
                            </div>
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                              {pmChecklist.map((item) => (
                                <div key={item.key} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${item.complete ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                                  {item.label}
                                </div>
                              ))}
                            </div>
                            {pendingRequest ? (
                              <p className="mt-3 text-xs font-semibold text-amber-700">
                                Latest update is pending Admin approval. You can still update and resubmit.
                              </p>
                            ) : null}
                          </section>

                          <section className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-900">Profile Details</h3>
                            <div className="grid gap-4 md:grid-cols-2">
                              <div>
                                <p className="mb-1 text-[11px] font-black uppercase tracking-wider text-slate-600">Full Name</p>
                                <Input
                                  value={pmForm.fullName}
                                  onChange={(event) => updatePmField("fullName", event.target.value)}
                                  disabled={!editMode}
                                  className="h-11 rounded-xl border-slate-200 bg-white disabled:opacity-100 disabled:bg-slate-50"
                                />
                              </div>
                              <div>
                                <p className="mb-1 text-[11px] font-black uppercase tracking-wider text-slate-600">Location</p>
                                <Input
                                  value={pmForm.location}
                                  onChange={(event) => updatePmField("location", event.target.value)}
                                  disabled={!editMode}
                                  className="h-11 rounded-xl border-slate-200 bg-white disabled:opacity-100 disabled:bg-slate-50"
                                  placeholder="City, Country"
                                />
                              </div>
                              <div>
                                <p className="mb-1 text-[11px] font-black uppercase tracking-wider text-slate-600">Contact Email</p>
                                <Input
                                  value={pmForm.contactEmail}
                                  onChange={(event) => updatePmField("contactEmail", event.target.value)}
                                  disabled={!editMode}
                                  className="h-11 rounded-xl border-slate-200 bg-white disabled:opacity-100 disabled:bg-slate-50"
                                  type="email"
                                />
                              </div>
                              <div>
                                <p className="mb-1 text-[11px] font-black uppercase tracking-wider text-slate-600">Contact Phone</p>
                                <Input
                                  value={pmForm.contactPhone}
                                  onChange={(event) => updatePmField("contactPhone", event.target.value)}
                                  disabled={!editMode}
                                  className="h-11 rounded-xl border-slate-200 bg-white disabled:opacity-100 disabled:bg-slate-50"
                                />
                              </div>
                            </div>
                          </section>

                          <section className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-900">Skills / Expertise</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="mb-1 text-[11px] font-black uppercase tracking-wider text-slate-600">Skills (comma separated)</p>
                                <Input
                                  value={pmForm.skillsInput}
                                  onChange={(event) => updatePmField("skillsInput", event.target.value)}
                                  disabled={!editMode}
                                  className="h-11 rounded-xl border-slate-200 bg-white disabled:opacity-100 disabled:bg-slate-50"
                                  placeholder="Project Planning, Stakeholder Management, Risk Control"
                                />
                              </div>
                              <div>
                                <p className="mb-1 text-[11px] font-black uppercase tracking-wider text-slate-600">Professional Summary</p>
                                <Textarea
                                  value={pmForm.expertiseSummary}
                                  onChange={(event) => updatePmField("expertiseSummary", event.target.value)}
                                  disabled={!editMode}
                                  className="min-h-28 rounded-xl border-slate-200 bg-white disabled:opacity-100 disabled:bg-slate-50"
                                  placeholder="Summarize your PM strengths and domain expertise."
                                />
                              </div>
                            </div>
                          </section>

                          <section className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-900">Experience & Availability</h3>
                            <div className="grid gap-4 md:grid-cols-2">
                              <div>
                                <p className="mb-1 text-[11px] font-black uppercase tracking-wider text-slate-600">Years of Experience</p>
                                <Input
                                  value={pmForm.yearsExperience}
                                  onChange={(event) => updatePmField("yearsExperience", event.target.value)}
                                  disabled={!editMode}
                                  className="h-11 rounded-xl border-slate-200 bg-white disabled:opacity-100 disabled:bg-slate-50"
                                  type="number"
                                  min="0"
                                />
                              </div>
                              <div>
                                <p className="mb-1 text-[11px] font-black uppercase tracking-wider text-slate-600">Availability Status</p>
                                <Input
                                  value={pmForm.availabilityStatus}
                                  onChange={(event) => updatePmField("availabilityStatus", event.target.value)}
                                  disabled={!editMode}
                                  className="h-11 rounded-xl border-slate-200 bg-white disabled:opacity-100 disabled:bg-slate-50"
                                  placeholder="Available / Busy / Limited"
                                />
                              </div>
                              <div>
                                <p className="mb-1 text-[11px] font-black uppercase tracking-wider text-slate-600">Hours per Week</p>
                                <Input
                                  value={pmForm.availabilityHours}
                                  onChange={(event) => updatePmField("availabilityHours", event.target.value)}
                                  disabled={!editMode}
                                  className="h-11 rounded-xl border-slate-200 bg-white disabled:opacity-100 disabled:bg-slate-50"
                                  placeholder="30-40"
                                />
                              </div>
                              <div>
                                <p className="mb-1 text-[11px] font-black uppercase tracking-wider text-slate-600">Timezone</p>
                                <Input
                                  value={pmForm.availabilityTimezone}
                                  onChange={(event) => updatePmField("availabilityTimezone", event.target.value)}
                                  disabled={!editMode}
                                  className="h-11 rounded-xl border-slate-200 bg-white disabled:opacity-100 disabled:bg-slate-50"
                                  placeholder="Asia/Kolkata"
                                />
                              </div>
                            </div>
                            <div>
                              <p className="mb-1 text-[11px] font-black uppercase tracking-wider text-slate-600">Working Schedule</p>
                              <Textarea
                                value={pmForm.availabilitySchedule}
                                onChange={(event) => updatePmField("availabilitySchedule", event.target.value)}
                                disabled={!editMode}
                                className="min-h-20 rounded-xl border-slate-200 bg-white disabled:opacity-100 disabled:bg-slate-50"
                                placeholder="Mon-Sat, 10:00 AM - 7:00 PM"
                              />
                            </div>
                          </section>

                          <section className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-900">Identification Details</h3>
                            <div className="grid gap-4 md:grid-cols-2">
                              <div>
                                <p className="mb-1 text-[11px] font-black uppercase tracking-wider text-slate-600">ID Type</p>
                                <Input
                                  value={pmForm.identityType}
                                  onChange={(event) => updatePmField("identityType", event.target.value)}
                                  disabled={!editMode}
                                  className="h-11 rounded-xl border-slate-200 bg-white disabled:opacity-100 disabled:bg-slate-50"
                                  placeholder="Aadhaar / Passport / PAN"
                                />
                              </div>
                              <div>
                                <p className="mb-1 text-[11px] font-black uppercase tracking-wider text-slate-600">ID Number</p>
                                <Input
                                  value={pmForm.identityNumber}
                                  onChange={(event) => updatePmField("identityNumber", event.target.value)}
                                  disabled={!editMode}
                                  className="h-11 rounded-xl border-slate-200 bg-white disabled:opacity-100 disabled:bg-slate-50"
                                  placeholder="Masked or full number"
                                />
                              </div>
                            </div>
                            <div>
                              <p className="mb-1 text-[11px] font-black uppercase tracking-wider text-slate-600">Document URL (Optional)</p>
                              <Input
                                value={pmForm.identityDocumentUrl}
                                onChange={(event) => updatePmField("identityDocumentUrl", event.target.value)}
                                disabled={!editMode}
                                className="h-11 rounded-xl border-slate-200 bg-white disabled:opacity-100 disabled:bg-slate-50"
                                placeholder="https://..."
                              />
                            </div>
                          </section>

                          {editMode ? (
                            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
                              <Button
                                type="button"
                                variant="outline"
                                className="h-10 rounded-xl border-slate-200 text-xs font-black uppercase tracking-wider"
                                onClick={() => setEditMode(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                onClick={submitPmProfileRequest}
                                disabled={savingProfile}
                                className="h-10 rounded-xl bg-blue-600 px-4 text-xs font-black uppercase tracking-wider text-white hover:bg-blue-700"
                              >
                                {savingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Save & Send to Admin
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      )}
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

               {isFreelancerProfile ? (
                 <div className="rounded-[40px] border border-emerald-100 bg-emerald-50/50 p-8 flex items-center gap-6">
                    <div className="h-12 w-12 shrink-0 flex items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-sm">
                       <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                       <h4 className="text-sm font-bold text-emerald-900">Identity Verified</h4>
                       <p className="text-[11px] font-medium text-emerald-600/80 mt-0.5">Verified by Catalance Security Protocol</p>
                    </div>
                 </div>
               ) : (
                 <Card className="rounded-[40px] border-amber-200 bg-amber-50/60 p-8 shadow-sm">
                   <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">
                     Profile Edit Permissions
                   </p>
                   <p className="mt-3 text-sm font-semibold text-slate-900">
                     You can edit your profile anytime.
                   </p>
                   <p className="mt-2 text-xs font-medium leading-relaxed text-slate-700">
                     Every profile update goes for Admin approval first. Until approval, profile changes remain in pending state.
                   </p>
                   <div className="mt-4">
                     <Badge className={`border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${pendingRequest ? "border-amber-300 bg-amber-100 text-amber-800" : "border-emerald-200 bg-emerald-100 text-emerald-700"}`}>
                       {pendingRequest ? "Pending Approval" : "No Pending Request"}
                     </Badge>
                   </div>
                 </Card>
               )}

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
