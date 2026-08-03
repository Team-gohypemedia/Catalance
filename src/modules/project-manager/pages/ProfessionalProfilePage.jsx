import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import Star from "lucide-react/dist/esm/icons/star";
import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right";
import MessageSquare from "lucide-react/dist/esm/icons/message-square";
import Plus from "lucide-react/dist/esm/icons/plus";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import User from "lucide-react/dist/esm/icons/user";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import Clock from "lucide-react/dist/esm/icons/clock";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Globe from "lucide-react/dist/esm/icons/globe";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import IdCard from "lucide-react/dist/esm/icons/id-card";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import Check from "lucide-react/dist/esm/icons/check";
import Edit3 from "lucide-react/dist/esm/icons/edit-3";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import Award from "lucide-react/dist/esm/icons/award";
import FolderKanban from "lucide-react/dist/esm/icons/folder-kanban";
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
  const [editMode, setEditMode] = useState(true);
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
    setEditMode(true);
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
  const completionPercentage = Math.round((completedChecklist / (pmChecklist.length || 1)) * 100);

  const updatePmField = (key, value) => {
    setPmForm((current) => ({ ...current, [key]: value }));
  };

  const submitPmProfileRequest = async () => {
    if (isFreelancerProfile || savingProfile) return;

    const checklist = buildPmChecklist(pmForm);
    const incompleteItems = checklist.filter((item) => !item.complete);
    
    if (incompleteItems.length > 0) {
      setActiveTab("about");
      setEditMode(true);
      toast.error(`Please complete missing fields (${incompleteItems.map(i => i.label).join(", ")}) before submitting.`);
      return;
    }

    setSavingProfile(true);
    try {
      const payload = buildPmProfilePayload(pmForm);
      await pmApi.submitProfileEdit(authFetch, payload);
      await profileResource.refresh();
      toast.success("Profile update submitted successfully! It is now pending Admin approval.");
    } catch (error) {
      toast.error(error?.message || "Unable to submit profile update request.");
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <PmShell title="Loading Profile..." hideHeader className="p-0 bg-[#FAF6F0]/60 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 py-8">
          <Card className="h-44 rounded-[28px] border-slate-100 shadow-md animate-pulse bg-white mb-8" />
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <Card className="h-96 rounded-[28px] border-slate-100 shadow-sm animate-pulse bg-white" />
            <Card className="h-96 rounded-[28px] border-slate-100 shadow-sm animate-pulse bg-white" />
          </div>
        </div>
      </PmShell>
    );
  }

  if (!freelancer) {
    return (
      <PmShell title="Profile Not Found">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-16 w-16 rounded-2xl bg-amber-50 text-[#D9692A] flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-1">Profile Not Found</h3>
          <p className="text-sm font-medium text-slate-500">Could not load details for this profile.</p>
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
    <PmShell title={profile.name || "Professional Profile"} subtitle={profile.title || ""} hideHeader className="p-0 bg-[#FAF6F0]/60 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 py-8">
        
        {/* Clean Minimal Profile Header Card (NO BANNER & HIDDEN HEADER BUTTONS FOR PM) */}
        <Card className="rounded-[28px] bg-white border border-slate-200/80 shadow-md p-6 sm:p-8 mb-8 transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* Left: Avatar & Meta Information */}
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6 text-center sm:text-left">
              <div className="relative shrink-0">
                <Avatar className="h-24 w-24 sm:h-28 sm:w-28 rounded-full border-2 border-amber-100 shadow-md bg-amber-50">
                  <AvatarImage src={profile.avatar} className="object-cover" />
                  <AvatarFallback className="bg-[#D9692A] text-2xl sm:text-3xl font-extrabold text-white">
                    {profile.name ? profile.name[0]?.toUpperCase() : "PM"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 border-2 border-white text-white shadow-sm" title="Verified Account">
                  <CheckCircle2 className="h-4.5 w-4.5" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {profile.name}
                  </h1>
                  <Badge className="bg-amber-50 text-[#D9692A] border border-amber-200 px-2.5 py-0.5 text-xs font-bold rounded-full">
                    PRO
                  </Badge>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-0.5 text-xs font-bold text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{profile.availability}</span>
                  </div>
                </div>
                
                <p className="text-base font-semibold text-[#D9692A] flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="flex items-center gap-1.5 text-[#D9692A] font-bold">
                    <Briefcase className="h-4 w-4 text-[#D9692A]" />
                    {profile.title}
                  </span>
                  {profile.location && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1 text-slate-500 text-sm font-medium">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {profile.location}
                      </span>
                    </>
                  )}
                </p>

                {!isFreelancerProfile && (
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      {completedChecklist}/{pmChecklist.length} Onboarding ({completionPercentage}%)
                    </span>
                    {pendingRequest && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">
                        <Clock className="h-3.5 w-3.5 text-amber-600" />
                        Pending Admin Approval
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Actions: Shown ONLY when viewing a Freelancer Profile */}
            {isFreelancerProfile && (
              <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 shrink-0">
                <Button
                  onClick={handlePrimaryAction}
                  className="h-11 rounded-xl bg-[#D9692A] px-6 text-xs font-bold text-white shadow-sm hover:bg-[#B85A24] active:scale-95 transition-all"
                >
                  <Plus className="mr-2 h-4 w-4 stroke-[3]" />
                  Hire for Project
                </Button>
                <Button
                  onClick={handleSecondaryAction}
                  variant="outline"
                  className="h-11 rounded-xl border-slate-200 bg-white px-6 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-2xs"
                >
                  <MessageSquare className="mr-2 h-4 w-4 text-[#D9692A]" />
                  Send Message
                </Button>
              </div>
            )}

          </div>

          {/* Segmented Tab Navigation Line */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            <div className="bg-slate-100/90 p-1.5 rounded-xl inline-flex gap-1">
              {[
                { id: "about", label: "About Me", icon: User },
                { id: "experience", label: "Experience", icon: Briefcase },
                { id: "portfolio", label: "Portfolio", icon: FolderKanban },
              ].map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-lg transition-all ${
                      isActive
                        ? "bg-white text-[#D9692A] shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                    }`}
                  >
                    <IconComponent className={`h-3.5 w-3.5 ${isActive ? "text-[#D9692A]" : "text-slate-400"}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          
          {/* Left Column: Tab Content */}
          <div className="space-y-8">
            
            {/* TAB 1: About Me & Onboarding */}
            {activeTab === "about" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {isFreelancerProfile ? (
                  <>
                    <Card className="rounded-[28px] border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                        <User className="h-5 w-5 text-[#D9692A]" />
                        <h3 className="text-lg font-bold text-slate-900">Professional Summary</h3>
                      </div>
                      <p className="text-base font-medium text-slate-600 leading-relaxed">
                        {profile.bio || "Bio not provided yet."}
                      </p>
                    </Card>

                    <Card className="rounded-[28px] border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                        <Sparkles className="h-5 w-5 text-[#D9692A]" />
                        <h3 className="text-lg font-bold text-slate-900">Technical Expertise</h3>
                      </div>
                      {resolveList(profile.skills).length ? (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {resolveList(profile.skills).map((skill) => (
                            <Badge
                              key={skill}
                              className="bg-amber-50 text-amber-900 text-xs font-bold rounded-xl px-4 py-2 border border-amber-200/80 hover:bg-amber-100 transition-all cursor-default"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm font-medium text-slate-400">Skills not listed yet.</p>
                      )}
                    </Card>

                    <Card className="rounded-[28px] border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <FolderKanban className="h-5 w-5 text-[#D9692A]" />
                          <h3 className="text-lg font-bold text-slate-900">Featured Projects</h3>
                        </div>
                        <Button
                          variant="link"
                          className="font-bold text-[#D9692A] hover:text-[#B85A24] p-0 h-auto"
                          onClick={() => setActiveTab("portfolio")}
                        >
                          View Gallery <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {portfolioRows.length ? (
                        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 pt-2">
                          {portfolioRows.slice(0, 3).map((p, i) => (
                            <div
                              key={`${p.title}-${i}`}
                              className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs transition-all hover:shadow-md hover:-translate-y-1"
                              onClick={() => openPortfolioItem(p.link)}
                            >
                              <div className="overflow-hidden h-36 bg-slate-100 relative">
                                <img
                                  src={p.image || "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?q=80&w=400&h=300&auto=format&fit=crop"}
                                  alt={p.title}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute top-2 right-2 rounded-lg bg-black/40 p-1.5 text-white backdrop-blur-md">
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </div>
                              </div>
                              <div className="p-4">
                                <h4 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-[#D9692A] transition-colors">{p.title}</h4>
                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Case Study</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-medium text-slate-400">
                          No portfolio projects added yet.
                        </div>
                      )}
                    </Card>
                  </>
                ) : (
                  /* PM Profile Onboarding & Form Sections */
                  <div className="space-y-8">
                    {/* Onboarding Progress Card */}
                    <Card className="rounded-[28px] border-amber-200/80 bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-amber-50/90 p-6 shadow-xs">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-[#D9692A] text-white flex items-center justify-center font-bold shadow-xs">
                            <Sparkles className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider">
                              PM Onboarding Flow
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">Complete all steps to activate your project manager profile</p>
                          </div>
                        </div>
                        <Badge className="bg-white text-[#D9692A] border border-amber-300 px-3.5 py-1 text-xs font-bold shadow-2xs">
                          {completedChecklist} / {pmChecklist.length} Complete ({completionPercentage}%)
                        </Badge>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-amber-200/60 rounded-full h-2.5 mb-5 overflow-hidden">
                        <div
                          className="bg-[#D9692A] h-2.5 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${completionPercentage}%` }}
                        />
                      </div>

                      {/* Checklist Chips */}
                      <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                        {pmChecklist.map((item) => (
                          <div
                            key={item.key}
                            className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition-all ${
                              item.complete
                                ? "border-emerald-200 bg-emerald-50/90 text-emerald-800"
                                : "border-amber-200/90 bg-amber-100/60 text-amber-900"
                            }`}
                          >
                            {item.complete ? (
                              <Check className="h-4 w-4 shrink-0 text-emerald-600 stroke-[3]" />
                            ) : (
                              <Clock className="h-4 w-4 shrink-0 text-amber-600" />
                            )}
                            <span className="truncate">{item.label}</span>
                          </div>
                        ))}
                      </div>

                      {pendingRequest && (
                        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-amber-300 bg-amber-100/80 px-4 py-3 text-xs font-bold text-amber-950">
                          <Clock className="h-4 w-4 shrink-0 text-[#D9692A]" />
                          <span>Latest update is pending Admin approval. You can still make edits and resubmit.</span>
                        </div>
                      )}
                    </Card>

                    {/* Section 1: Profile Details */}
                    <Card className="rounded-[28px] border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-5">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                        <User className="h-5 w-5 text-[#D9692A]" />
                        <h3 className="text-lg font-bold text-slate-900">Profile Details</h3>
                      </div>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">Full Name</label>
                          <Input
                            value={pmForm.fullName}
                            onChange={(event) => updatePmField("fullName", event.target.value)}
                            className="h-11 rounded-xl border-slate-200 bg-white font-medium text-slate-900 focus-visible:ring-[#D9692A]"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">Location</label>
                          <Input
                            value={pmForm.location}
                            onChange={(event) => updatePmField("location", event.target.value)}
                            className="h-11 rounded-xl border-slate-200 bg-white font-medium text-slate-900 focus-visible:ring-[#D9692A]"
                            placeholder="City, Country"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">Contact Email</label>
                          <Input
                            value={pmForm.contactEmail}
                            onChange={(event) => updatePmField("contactEmail", event.target.value)}
                            className="h-11 rounded-xl border-slate-200 bg-white font-medium text-slate-900 focus-visible:ring-[#D9692A]"
                            type="email"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">Contact Phone</label>
                          <Input
                            value={pmForm.contactPhone}
                            onChange={(event) => updatePmField("contactPhone", event.target.value)}
                            className="h-11 rounded-xl border-slate-200 bg-white font-medium text-slate-900 focus-visible:ring-[#D9692A]"
                          />
                        </div>
                      </div>
                    </Card>

                    {/* Section 2: Skills & Expertise */}
                    <Card className="rounded-[28px] border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-5">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                        <Sparkles className="h-5 w-5 text-[#D9692A]" />
                        <h3 className="text-lg font-bold text-slate-900">Skills / Expertise</h3>
                      </div>
                      <div className="space-y-5">
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">Skills (comma separated)</label>
                          <Input
                            value={pmForm.skillsInput}
                            onChange={(event) => updatePmField("skillsInput", event.target.value)}
                            className="h-11 rounded-xl border-slate-200 bg-white font-medium text-slate-900 focus-visible:ring-[#D9692A]"
                            placeholder="Project Planning, Stakeholder Management, Risk Control"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">Professional Summary</label>
                          <Textarea
                            value={pmForm.expertiseSummary}
                            onChange={(event) => updatePmField("expertiseSummary", event.target.value)}
                            className="min-h-28 rounded-xl border-slate-200 bg-white font-medium text-slate-900 focus-visible:ring-[#D9692A] leading-relaxed"
                            placeholder="Summarize your PM strengths and domain expertise."
                          />
                        </div>
                      </div>
                    </Card>

                    {/* Section 3: Experience & Availability */}
                    <Card className="rounded-[28px] border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-5">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                        <Clock className="h-5 w-5 text-[#D9692A]" />
                        <h3 className="text-lg font-bold text-slate-900">Experience & Availability</h3>
                      </div>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">Years of Experience</label>
                          <Input
                            value={pmForm.yearsExperience}
                            onChange={(event) => updatePmField("yearsExperience", event.target.value)}
                            className="h-11 rounded-xl border-slate-200 bg-white font-medium text-slate-900 focus-visible:ring-[#D9692A]"
                            type="number"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">Availability Status</label>
                          <Input
                            value={pmForm.availabilityStatus}
                            onChange={(event) => updatePmField("availabilityStatus", event.target.value)}
                            className="h-11 rounded-xl border-slate-200 bg-white font-medium text-slate-900 focus-visible:ring-[#D9692A]"
                            placeholder="Available / Busy / Limited"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">Hours per Week</label>
                          <Input
                            value={pmForm.availabilityHours}
                            onChange={(event) => updatePmField("availabilityHours", event.target.value)}
                            className="h-11 rounded-xl border-slate-200 bg-white font-medium text-slate-900 focus-visible:ring-[#D9692A]"
                            placeholder="30-40"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">Timezone</label>
                          <Input
                            value={pmForm.availabilityTimezone}
                            onChange={(event) => updatePmField("availabilityTimezone", event.target.value)}
                            className="h-11 rounded-xl border-slate-200 bg-white font-medium text-slate-900 focus-visible:ring-[#D9692A]"
                            placeholder="Asia/Kolkata"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">Working Schedule</label>
                        <Textarea
                          value={pmForm.availabilitySchedule}
                          onChange={(event) => updatePmField("availabilitySchedule", event.target.value)}
                          className="min-h-20 rounded-xl border-slate-200 bg-white font-medium text-slate-900 focus-visible:ring-[#D9692A]"
                          placeholder="Mon-Sat, 10:00 AM - 7:00 PM"
                        />
                      </div>
                    </Card>

                    {/* Section 4: Identification Details */}
                    <Card className="rounded-[28px] border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-5">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                        <IdCard className="h-5 w-5 text-[#D9692A]" />
                        <h3 className="text-lg font-bold text-slate-900">Identification Details</h3>
                      </div>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">ID Type</label>
                          <Input
                            value={pmForm.identityType}
                            onChange={(event) => updatePmField("identityType", event.target.value)}
                            className="h-11 rounded-xl border-slate-200 bg-white font-medium text-slate-900 focus-visible:ring-[#D9692A]"
                            placeholder="Aadhaar / Passport / PAN"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">ID Number</label>
                          <Input
                            value={pmForm.identityNumber}
                            onChange={(event) => updatePmField("identityNumber", event.target.value)}
                            className="h-11 rounded-xl border-slate-200 bg-white font-medium text-slate-900 focus-visible:ring-[#D9692A]"
                            placeholder="Masked or full number"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">Document URL (Optional)</label>
                        <Input
                          value={pmForm.identityDocumentUrl}
                          onChange={(event) => updatePmField("identityDocumentUrl", event.target.value)}
                          className="h-11 rounded-xl border-slate-200 bg-white font-medium text-slate-900 focus-visible:ring-[#D9692A]"
                          placeholder="https://..."
                        />
                      </div>
                    </Card>

                    {/* Submit Bar at bottom of Form */}
                    <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                      <Button
                        type="button"
                        onClick={submitPmProfileRequest}
                        disabled={savingProfile}
                        className="h-12 rounded-xl bg-[#D9692A] px-8 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#B85A24] shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer"
                      >
                        {savingProfile ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                        )}
                        Submit Profile for Admin Approval
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Experience */}
            {activeTab === "experience" && (
              <Card className="rounded-[28px] border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-6">
                  <Briefcase className="h-5 w-5 text-[#D9692A]" />
                  <h3 className="text-lg font-bold text-slate-900">Work Experience Timeline</h3>
                </div>
                {experienceRows.length > 0 ? (
                  <div className="relative pl-6 sm:pl-8 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-[#D9692A] before:via-amber-200 before:to-transparent space-y-8">
                    {experienceRows.map((exp, i) => (
                      <div key={i} className="relative group">
                        <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 h-5 w-5 rounded-full bg-[#D9692A] border-4 border-white shadow-md group-hover:scale-125 transition-transform" />
                        <div className="bg-slate-50/60 rounded-2xl border border-slate-100 p-5 sm:p-6 transition-all hover:bg-white hover:shadow-xs">
                          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                            <h4 className="text-lg font-bold text-slate-900">{exp.role || exp.title}</h4>
                            <Badge variant="outline" className="rounded-lg border-amber-200 bg-amber-50 text-[#D9692A] font-bold text-xs px-3 py-1">
                              {exp.period}
                            </Badge>
                          </div>
                          <p className="mb-3 text-xs font-bold text-[#D9692A] uppercase tracking-wider">{exp.company || "Catalance"}</p>
                          <p className="text-sm font-medium text-slate-600 leading-relaxed">{exp.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm font-medium text-slate-400">
                    No experience timeline available yet.
                  </div>
                )}
              </Card>
            )}

            {/* TAB 3: Portfolio */}
            {activeTab === "portfolio" && (
              <Card className="rounded-[28px] border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-6">
                  <FolderKanban className="h-5 w-5 text-[#D9692A]" />
                  <h3 className="text-lg font-bold text-slate-900">Portfolio & Case Studies</h3>
                </div>
                {portfolioRows.length ? (
                  <div className="grid gap-6 sm:grid-cols-2">
                    {portfolioRows.map((item, index) => (
                      <div
                        key={`${item.title}-${index}`}
                        className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs transition-all hover:-translate-y-1 hover:shadow-md"
                      >
                        <div className="h-48 overflow-hidden bg-slate-100 relative">
                          <img
                            src={
                              item.image ||
                              "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop"
                            }
                            alt={item.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute top-3 right-3 rounded-lg bg-black/40 p-2 text-white backdrop-blur-md">
                            <ExternalLink className="h-4 w-4" />
                          </div>
                        </div>
                        <div className="space-y-3 p-5 sm:p-6">
                          <h4 className="text-base font-extrabold text-slate-900 group-hover:text-[#D9692A] transition-colors">{item.title}</h4>
                          {item.summary && (
                            <p className="line-clamp-2 text-sm font-medium text-slate-500 leading-relaxed">{item.summary}</p>
                          )}
                          <Button
                            variant="outline"
                            className="h-10 w-full rounded-xl border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-700 hover:border-[#D9692A] hover:text-[#D9692A] transition-colors"
                            onClick={() => openPortfolioItem(item.link)}
                          >
                            Open Case Study <ExternalLink className="ml-2 h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center text-sm font-medium text-slate-400">
                    Portfolio is not available yet.
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Right Column: Sidebar Cards */}
          <div className="space-y-6">
            
            {/* Card 1: Base Rate & Stats */}
            <Card className="rounded-[28px] border-slate-200/80 p-7 shadow-xs bg-white overflow-hidden relative">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Base Rate</span>
                <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 border border-amber-200/80">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  <span className="text-xs font-bold text-slate-900">{profile.rating}</span>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">
                  {profile.hourlyRate > 0 ? `$${profile.hourlyRate}` : "Not specified"}
                  {profile.hourlyRate > 0 && <span className="text-sm font-medium text-slate-400">/hr</span>}
                </h2>
                <p className="mt-1.5 text-xs font-medium text-slate-500">Negotiable for long-term contracts</p>
              </div>

              <div className="space-y-3.5 pt-5 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-slate-400 uppercase tracking-wider">
                    <Clock className="h-3.5 w-3.5 text-[#D9692A]" /> Project Time
                  </span>
                  <span className="text-slate-800">{profile.timeCommitment || "Not specified"}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-slate-400 uppercase tracking-wider">
                    <Globe className="h-3.5 w-3.5 text-[#D9692A]" /> Languages
                  </span>
                  <span className="text-slate-800">
                    {resolveList(profile.languages).length
                      ? resolveList(profile.languages).join(", ")
                      : "Not specified"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-slate-400 uppercase tracking-wider">
                    <MapPin className="h-3.5 w-3.5 text-[#D9692A]" /> Location
                  </span>
                  <span className="text-slate-800">{profile.location || "Not specified"}</span>
                </div>
              </div>
            </Card>

            {/* Card 2: Verification Status */}
            {isFreelancerProfile ? (
              <div className="rounded-[28px] border border-emerald-200/80 bg-emerald-50/70 p-6 flex items-center gap-4 shadow-2xs">
                <div className="h-12 w-12 shrink-0 flex items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-emerald-950">Identity Verified</h4>
                  <p className="text-xs font-medium text-emerald-700/90 mt-0.5">Verified by Catalance Security Protocol</p>
                </div>
              </div>
            ) : (
              <Card className="rounded-[28px] border-amber-200/80 bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-amber-50/80 p-6 shadow-2xs">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-4 w-4 text-[#D9692A]" />
                  <p className="text-xs font-extrabold uppercase tracking-wider text-[#D9692A]">
                    Profile Edit Permissions
                  </p>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  You can edit your profile anytime.
                </p>
                <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-600">
                  Every profile update goes for Admin approval first. Until approved, changes remain in pending state.
                </p>
                <div className="mt-4">
                  <Badge className={`border px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg ${
                    pendingRequest
                      ? "border-amber-300 bg-amber-100 text-amber-900"
                      : "border-emerald-300 bg-emerald-100 text-emerald-900"
                  }`}>
                    {pendingRequest ? "Pending Approval" : "No Pending Request"}
                  </Badge>
                </div>
              </Card>
            )}

            {/* Card 3: Testimonials */}
            <Card className="rounded-[28px] border-slate-200/80 p-7 shadow-xs bg-white">
              <div className="flex items-center justify-between mb-5">
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Client Testimonials</p>
                <Badge variant="outline" className="text-[10px] font-bold border-slate-200 text-slate-400">
                  Verified Reviews
                </Badge>
              </div>
              
              <div className="space-y-6">
                {testimonialRows.map((t, i) => (
                  <div key={i} className="border-b border-slate-100 pb-5 last:border-0 last:pb-0">
                    <p className="mb-3 text-xs italic leading-relaxed text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                      &quot;{t.text}&quot;
                    </p>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 rounded-lg border border-slate-200">
                        <AvatarImage src={t.avatar} />
                        <AvatarFallback className="bg-amber-100 text-amber-900 font-bold text-xs">{t.name ? t.name[0] : "U"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h5 className="text-xs font-bold text-slate-900">{t.name}</h5>
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
