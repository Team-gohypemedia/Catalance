import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { AdminTopBar } from "./AdminTopBar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/shared/context/AuthContext";
import { Button } from "@/components/ui/button";
import User from "lucide-react/dist/esm/icons/user";
import Mail from "lucide-react/dist/esm/icons/mail";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Phone from "lucide-react/dist/esm/icons/phone";
import Wrench from "lucide-react/dist/esm/icons/wrench";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import Award from "lucide-react/dist/esm/icons/award";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";

const isPlainObject = (value) => value && typeof value === "object" && !Array.isArray(value);
const isPrimitiveValue = (value) =>
  value === null || value === undefined || ["string", "number", "boolean"].includes(typeof value);

const hasDisplayValue = (value) => {
  if (Array.isArray(value)) return value.length > 0;
  if (isPlainObject(value)) return Object.keys(value).length > 0;
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "";
  return true;
};

const toDisplayLabel = (value = "") =>
  String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatPrimitiveValue = (value) => {
  if (value === null || value === undefined) return "Not set";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  const asString = String(value);
  return asString.trim() ? asString : "Not set";
};

const getObjectSummary = (value = {}) => {
  const candidates = [
    "title",
    "name",
    "label",
    "serviceTitle",
    "role",
    "company",
    "niche",
    "timeline",
    "budget",
  ];

  for (const key of candidates) {
    const candidateValue = value?.[key];
    if (typeof candidateValue === "string" && candidateValue.trim()) return candidateValue.trim();
  }

  if (typeof value?.id === "string" && value.id.trim()) return value.id.trim();

  return "";
};

const normalizeUrl = (value) => {
  if (!value || typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
};

const pickFirstValue = (...values) => values.find((value) => hasDisplayValue(value));

const normalizeCaseStudies = (detail = {}) => {
  const caseStudies = Array.isArray(detail.caseStudies)
    ? detail.caseStudies
    : detail.caseStudy
      ? [detail.caseStudy]
      : [];

  return caseStudies
    .filter((entry) => isPlainObject(entry))
    .map((entry) => ({
      title: String(entry.title || entry.name || "").trim(),
      description: String(entry.description || "").trim(),
      niche: String(entry.niche || "").trim(),
      role: String(entry.role || "").trim(),
      timeline: String(entry.timeline || "").trim(),
      budget: String(entry.budget || "").trim(),
      link: normalizeUrl(entry.projectLink || entry.link || entry.url || ""),
      image: normalizeUrl(entry.coverImage || entry.image || entry.fileUrl || entry?.file?.url || ""),
    }))
    .filter((entry) => hasDisplayValue(entry.title) || hasDisplayValue(entry.description));
};

const normalizeMediaEntries = (detail = {}) => {
  const rawMedia = Array.isArray(detail.media)
    ? detail.media
    : detail.media
      ? [detail.media]
      : detail.coverImage
        ? [{ url: detail.coverImage, name: "Cover image" }]
        : [];

  return rawMedia
    .filter((entry) => isPlainObject(entry))
    .map((entry) => ({
      name: String(entry.name || entry.fileName || entry.title || "Media").trim(),
      url: normalizeUrl(entry.url || entry.fileUrl || entry.coverImage || entry.path || ""),
      mimeType: String(entry.mimeType || entry.type || "").trim(),
      size: entry.size,
    }))
    .filter((entry) => hasDisplayValue(entry.url));
};

const normalizeSubcategories = (detail = {}) => {
  const subcategories = Array.isArray(detail.subcategories) ? detail.subcategories : [];
  return subcategories
    .map((entry) => {
      if (typeof entry === "string") return entry;
      if (!isPlainObject(entry)) return "";
      return String(entry.label || entry.name || entry.subCategoryName || "").trim();
    })
    .filter((entry) => entry);
};

const normalizeSkills = (detail = {}) => {
  const skills = Array.isArray(detail.skillsAndTechnologies)
    ? detail.skillsAndTechnologies
    : Array.isArray(detail.skills)
      ? detail.skills
      : [];
  return skills.filter((entry) => typeof entry === "string" && entry.trim());
};

const getAdditionalDetailEntries = (detail = {}) => {
  const hiddenKeys = new Set([
    "serviceKey",
    "serviceId",
    "serviceID",
    "activeCaseStudyId",
    "caseStudyId",
    "caseStudyID",
    "caseStudy",
    "caseStudies",
    "subcategories",
    "skillsAndTechnologies",
    "skills",
    "title",
    "serviceTitle",
    "serviceDescription",
    "description",
    "deliveryTime",
    "deliveryTimeline",
    "experienceYears",
    "experience",
    "averageProjectPrice",
    "averagePrice",
    "priceRange",
    "media",
    "coverImage",
  ]);

  return Object.entries(detail).filter(
    ([key, value]) => !hiddenKeys.has(key) && hasDisplayValue(value)
  );
};

function renderDetailValue(value) {
  if (Array.isArray(value)) {
    if (!value.length) return "Not set";
    const allPrimitive = value.every(isPrimitiveValue);
    if (allPrimitive) return value.map(formatPrimitiveValue).join(", ");

    return (
      <div className="space-y-3">
        {value.map((entry, index) => {
          if (!isPlainObject(entry)) {
            return (
              <p key={index} className="text-sm break-words">
                {formatPrimitiveValue(entry)}
              </p>
            );
          }

          const summary = getObjectSummary(entry);
          return (
            <div key={index} className="rounded-md border bg-muted/10 p-3">
              {summary ? <p className="text-sm font-medium mb-2">{summary}</p> : null}
              {renderKeyValuePairs(entry)}
            </div>
          );
        })}
      </div>
    );
  }

  if (isPlainObject(value)) {
    return renderKeyValuePairs(value) || "Not set";
  }

  return formatPrimitiveValue(value);
}

function renderKeyValuePairs(value) {
  const entries = Object.entries(value || {}).filter(([, entryValue]) => hasDisplayValue(entryValue));
  if (!entries.length) return null;

  return (
    <div className="grid gap-2 md:grid-cols-2">
      {entries.map(([entryKey, entryValue]) => (
        <div key={entryKey}>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {toDisplayLabel(entryKey)}
          </p>
          <p className="mt-1 text-sm break-words">
            {renderDetailValue(entryValue)}
          </p>
        </div>
      ))}
    </div>
  );
}

const AdminUserDetails = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`/admin/users/${userId}`);
      const result = await res.json();
      if (result?.data) {
        setData(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch user details:", err);
      setError("Failed to load user details");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${(amount || 0).toLocaleString("en-IN")}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const parseBio = (bio) => {
    if (!bio) return null;
    try {
      const parsed = JSON.parse(bio);
      return isPlainObject(parsed) ? parsed : { bio };
    } catch {
      return { bio };
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
     return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </AdminLayout>
    );
  }

  if (!data) return null;

  const bioData = parseBio(data.user.bio);
  const profileDetails = isPlainObject(data.user.profileDetails) ? data.user.profileDetails : {};
  const identity = isPlainObject(profileDetails.identity) ? profileDetails.identity : {};
  const availability = isPlainObject(profileDetails.availability) ? profileDetails.availability : {};
  const reliability = isPlainObject(profileDetails.reliability) ? profileDetails.reliability : {};
  const isFreelancer = data.user.role === "FREELANCER";
  const headline =
    data.user.professionalTitle ||
    bioData?.headline ||
    identity.professionalTitle ||
    null;
  const phone = data.user.phone || data.user.phoneNumber || bioData?.phone || null;
  const location =
    data.user.location ||
    bioData?.location ||
    [identity.city, identity.country].filter(Boolean).join(", ");
  const services = Array.isArray(data.user.services)
    ? data.user.services
    : Array.isArray(profileDetails.services)
      ? profileDetails.services
      : Array.isArray(bioData?.services)
        ? bioData.services
        : [];
  const skills = Array.isArray(data.user.skills)
    ? data.user.skills
    : Array.isArray(profileDetails.skills)
      ? profileDetails.skills
      : [];
  const portfolioProjects = Array.isArray(data.user.portfolioProjects)
    ? data.user.portfolioProjects
    : Array.isArray(profileDetails.portfolioProjects)
      ? profileDetails.portfolioProjects
      : [];
  const workExperience = Array.isArray(profileDetails.workExperience)
    ? profileDetails.workExperience
    : Array.isArray(bioData?.workExperience)
      ? bioData.workExperience
      : [];
  const education = Array.isArray(profileDetails.education) ? profileDetails.education : [];
  const serviceDetails = isPlainObject(data.user.serviceDetails)
    ? data.user.serviceDetails
    : isPlainObject(profileDetails.serviceDetails)
      ? profileDetails.serviceDetails
      : {};
  const portfolioLink = data.user.portfolio || identity.portfolioUrl || bioData?.portfolioUrl || null;
  const linkedinLink = data.user.linkedin || identity.linkedinUrl || bioData?.linkedinUrl || null;
  const githubLink = data.user.github || identity.githubUrl || bioData?.githubUrl || null;
  const aboutText =
    profileDetails.professionalBio ||
    data.user.bio ||
    bioData?.bio ||
    null;
  const detailSections = Object.entries(serviceDetails).filter(([, detail]) => isPlainObject(detail));

  return (
    <AdminLayout>
      <div className="flex flex-col h-full">
        {/* Header Section */}
        <div className="bg-background border-b p-6">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2 pl-0 hover:pl-2 transition-all">
                    <ArrowLeft className="h-4 w-4" /> Back
                </Button>
            </div>
            
            <div className="flex items-start gap-6 max-w-5xl mx-auto w-full">
                <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <User className="h-12 w-12 text-primary" />
                </div>
                <div className="flex-1 min-w-0 pt-2">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                    <h1 className="text-3xl font-bold tracking-tight">{data.user.fullName}</h1>
                    <Badge variant={data.user.role === "CLIENT" ? "default" : "secondary"}>
                    {data.user.role}
                    </Badge>
                    <Badge variant={data.user.status === "ACTIVE" ? "outline" : "destructive"}>
                    {data.user.status}
                    </Badge>
                </div>
                
                {/* Headline */}
                {headline && (
                    <p className="text-lg text-muted-foreground mb-4">{headline}</p>
                )}
                
                {/* Contact Info Row */}
                <div className="flex items-center gap-6 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {data.user.email}
                    </span>
                    {phone && (
                     <span className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {phone}
                     </span>
                    )}
                    {location && (
                     <span className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {location}
                     </span>
                    )}
                    <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Joined {formatDate(data.user.createdAt)}
                    </span>
                </div>
                </div>
            </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-muted/10">
          <div className="max-w-5xl mx-auto w-full p-8 space-y-10">
            
            {/* Services Row */}
             {services.length > 0 && (
               <div className="bg-card p-6 rounded-lg border shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Wrench className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">Services</h4>
                        <div className="flex flex-wrap gap-2">
                            {services.map((service, idx) => (
                                 <Badge key={idx} variant="secondary" className="font-normal">
                                    {toDisplayLabel(service)}
                                 </Badge>
                             ))}
                        </div>
                    </div>
                </div>
              </div>
            )}

            {/* Freelancer Additional Details */}
            {isFreelancer && (
              <div className="space-y-10">
                {/* Skills */}
                {skills.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-foreground/80">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="text-sm px-3 py-1">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Info Row - Availability */}
                {(availability.hoursPerWeek || availability.startTimeline || availability.workingSchedule || typeof profileDetails.acceptInProgressProjects === "boolean") && (
                  <div className="grid gap-4 md:grid-cols-2">
                    {availability.hoursPerWeek && (
                      <div className="rounded-lg border bg-card p-4">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Hours Per Week</p>
                        <p className="mt-1 font-medium">{availability.hoursPerWeek}</p>
                      </div>
                    )}
                    {availability.startTimeline && (
                      <div className="rounded-lg border bg-card p-4">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Start Timeline</p>
                        <p className="mt-1 font-medium">{availability.startTimeline}</p>
                      </div>
                    )}
                    {availability.workingSchedule && (
                      <div className="rounded-lg border bg-card p-4">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Working Schedule</p>
                        <p className="mt-1 font-medium">{availability.workingSchedule}</p>
                      </div>
                    )}
                    {typeof profileDetails.acceptInProgressProjects === "boolean" && (
                      <div className="rounded-lg border bg-card p-4">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Accepts In-Progress Projects</p>
                        <p className="mt-1 font-medium">{profileDetails.acceptInProgressProjects ? "Yes" : "No"}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Work Experience */}
                {workExperience.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-foreground/80">
                      <Award className="h-5 w-5" />
                      Work Experience
                    </h3>
                    <div className="grid gap-4">
                      {workExperience.map((exp, idx) => (
                        <div key={idx} className="bg-card border rounded-lg p-4 shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="font-semibold text-lg block">{exp.title || exp.role || 'Experience'}</span>
                                {exp.company && (
                                    <span className="text-muted-foreground">{exp.company}</span>
                                )}
                              </div>
                              {exp.period && (
                                <Badge variant="secondary" className="text-xs">{exp.period}</Badge>
                              )}
                          </div>
                          {exp.description && (
                              <p className="text-sm text-foreground/70 mt-2 leading-relaxed">{exp.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                 {/* Portfolio Projects */}
                {portfolioProjects.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-foreground/80">Featured Projects</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {portfolioProjects.map((project, idx) => (
                        <div key={idx} className="group relative rounded-xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all">
                          <a 
                            href={project.link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="block aspect-video w-full bg-muted/50 relative group-hover:opacity-90 transition-opacity cursor-pointer"
                          >
                            {project.image ? (
                              <img src={project.image} alt="Preview" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-sm bg-secondary/30 text-muted-foreground">No Image Preview</div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px]">
                              <div className="bg-background/90 text-foreground px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                <ExternalLink className="w-4 h-4" />
                                Visit Site
                              </div>
                            </div>
                          </a>
                          <div className="p-4 border-t">
                            <a href={project.link} target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-primary transition-colors truncate block text-lg mb-1">
                              {project.title || project.link.replace(/^https?:\/\//, '')}
                            </a>
                            <p className="text-xs text-muted-foreground truncate">{project.link}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* External Links */}
                {(() => {
                  // Helper to safely get string or null
                  if (!portfolioLink && !linkedinLink && !githubLink) return null;
                  
                  return (
                    <div>
                         <h3 className="text-xl font-semibold mb-4 text-foreground/80">Links</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {portfolioLink && (
                                <div className="flex items-center gap-3 p-3 rounded-lg border bg-card/50">
                                    <div className="p-2 rounded-full bg-blue-500/10 shrink-0">
                                        <ExternalLink className="h-4 w-4 text-blue-500" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Portfolio / Website</p>
                                        <a 
                                            href={portfolioLink.startsWith('http') ? portfolioLink : `https://${portfolioLink}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-sm font-medium hover:text-primary transition-colors truncate block"
                                        >
                                            {portfolioLink}
                                        </a>
                                    </div>
                                </div>
                            )}
                            {linkedinLink && (
                                <div className="flex items-center gap-3 p-3 rounded-lg border bg-card/50">
                                    <div className="p-2 rounded-full bg-blue-600/10 shrink-0">
                                        <ExternalLink className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">LinkedIn</p>
                                        <a 
                                            href={linkedinLink.startsWith('http') ? linkedinLink : `https://${linkedinLink}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-sm font-medium hover:text-primary transition-colors truncate block"
                                        >
                                            {linkedinLink}
                                        </a>
                                    </div>
                                </div>
                            )}
                            {githubLink && (
                                <div className="flex items-center gap-3 p-3 rounded-lg border bg-card/50">
                                    <div className="p-2 rounded-full bg-gray-500/10 shrink-0">
                                        <ExternalLink className="h-4 w-4 text-gray-700" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">GitHub</p>
                                        <a 
                                            href={githubLink.startsWith('http') ? githubLink : `https://${githubLink}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-sm font-medium hover:text-primary transition-colors truncate block"
                                        >
                                            {githubLink}
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                  );
                })()}

                {education.length > 0 && (
                  <div className="bg-card p-8 rounded-xl border">
                    <h3 className="text-xl font-semibold mb-4">Education</h3>
                    <div className="grid gap-4">
                      {education.map((entry, idx) => (
                        <div key={idx} className="rounded-lg border bg-muted/20 p-4">
                          <p className="font-medium">
                            {entry?.degree || entry?.course || entry?.qualification || "Education"}
                          </p>
                          {(entry?.institution || entry?.school || entry?.college) && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {entry.institution || entry.school || entry.college}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {detailSections.length > 0 && (
                  <div className="bg-card p-8 rounded-xl border">
                    <h3 className="text-xl font-semibold mb-4">Service Details</h3>
                    <div className="space-y-8">
                      {detailSections.map(([serviceKey, detail]) => {
                        const title = pickFirstValue(detail.title, detail.serviceTitle);
                        const description = pickFirstValue(
                          detail.serviceDescription,
                          detail.description
                        );
                        const delivery = pickFirstValue(detail.deliveryTime, detail.deliveryTimeline);
                        const experience = pickFirstValue(detail.experienceYears, detail.experience);
                        const price = pickFirstValue(
                          detail.averageProjectPrice,
                          detail.averagePrice,
                          detail.priceRange
                        );
                        const skills = normalizeSkills(detail);
                        const subcategories = normalizeSubcategories(detail);
                        const caseStudies = normalizeCaseStudies(detail);
                        const mediaEntries = normalizeMediaEntries(detail);
                        const additionalEntries = getAdditionalDetailEntries(detail);

                        return (
                          <div key={serviceKey} className="rounded-xl border p-6">
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                              <h4 className="text-lg font-semibold">{toDisplayLabel(serviceKey)}</h4>
                              {title ? (
                                <Badge variant="secondary" className="font-normal">
                                  {title}
                                </Badge>
                              ) : null}
                            </div>

                            <div className="grid gap-6 lg:grid-cols-2">
                              <div className="space-y-5">
                                {description ? (
                                  <div>
                                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                      Description
                                    </p>
                                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                                      {description}
                                    </p>
                                  </div>
                                ) : null}

                                {skills.length > 0 ? (
                                  <div>
                                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                      Skills and technologies
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {skills.map((skill) => (
                                        <Badge key={skill} variant="outline" className="text-xs">
                                          {skill}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}

                                {subcategories.length > 0 ? (
                                  <div>
                                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                      Subcategories
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {subcategories.map((entry, index) => (
                                        <Badge key={`${entry}-${index}`} variant="secondary" className="text-xs">
                                          {entry}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}

                                {caseStudies.length > 0 ? (
                                  <div>
                                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                      Case studies
                                    </p>
                                    <div className="mt-3 space-y-3">
                                      {caseStudies.map((entry, index) => (
                                        <div key={`${entry.title || "case"}-${index}`} className="rounded-lg border bg-muted/10 p-4">
                                          <div className="flex flex-wrap items-center justify-between gap-2">
                                            <p className="text-sm font-medium">
                                              {entry.title || "Case study"}
                                            </p>
                                            {entry.timeline ? (
                                              <Badge variant="outline" className="text-xs">
                                                {entry.timeline}
                                              </Badge>
                                            ) : null}
                                          </div>
                                          <div className="mt-2 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                                            {entry.role ? <div>Role: {entry.role}</div> : null}
                                            {entry.niche ? <div>Niche: {entry.niche}</div> : null}
                                            {entry.budget ? <div>Budget: {entry.budget}</div> : null}
                                            {entry.link ? (
                                              <a
                                                href={entry.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:underline"
                                              >
                                                View project
                                              </a>
                                            ) : null}
                                          </div>
                                          {entry.description ? (
                                            <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">
                                              {entry.description}
                                            </p>
                                          ) : null}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}
                              </div>

                              <div className="space-y-4">
                                <div className="grid gap-3">
                                  {delivery ? (
                                    <div className="rounded-lg border bg-muted/10 p-3">
                                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Delivery time</p>
                                      <p className="mt-1 text-sm font-medium">{delivery}</p>
                                    </div>
                                  ) : null}
                                  {experience ? (
                                    <div className="rounded-lg border bg-muted/10 p-3">
                                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Experience</p>
                                      <p className="mt-1 text-sm font-medium">{experience}</p>
                                    </div>
                                  ) : null}
                                  {price ? (
                                    <div className="rounded-lg border bg-muted/10 p-3">
                                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Average price</p>
                                      <p className="mt-1 text-sm font-medium">{price}</p>
                                    </div>
                                  ) : null}
                                </div>

                                {mediaEntries.length > 0 ? (
                                  <div>
                                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                      Media
                                    </p>
                                    <div className="mt-2 grid gap-3">
                                      {mediaEntries.map((entry, index) => (
                                        <a
                                          key={`${entry.url}-${index}`}
                                          href={entry.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-3 rounded-lg border bg-muted/10 p-3 hover:bg-muted/20 transition"
                                        >
                                          <div className="h-10 w-10 rounded-md bg-muted/40 overflow-hidden shrink-0">
                                            <img
                                              src={entry.url}
                                              alt={entry.name || "Media"}
                                              className="h-full w-full object-cover"
                                            />
                                          </div>
                                          <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{entry.name || "Media"}</p>
                                            <p className="text-xs text-muted-foreground truncate">
                                              {entry.mimeType || entry.url}
                                            </p>
                                          </div>
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}

                                {additionalEntries.length > 0 ? (
                                  <details className="rounded-lg border bg-muted/10 p-3">
                                    <summary className="cursor-pointer text-sm font-medium">Additional details</summary>
                                    <div className="mt-3">
                                      {renderKeyValuePairs(Object.fromEntries(additionalEntries))}
                                    </div>
                                  </details>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {(reliability.delayHandling || reliability.missedDeadlines) && (
                  <div className="bg-card p-8 rounded-xl border">
                    <h3 className="text-xl font-semibold mb-4">Reliability</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {reliability.delayHandling && (
                        <div>
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">Delay Handling</p>
                          <p className="mt-1 text-sm leading-relaxed">{reliability.delayHandling}</p>
                        </div>
                      )}
                      {reliability.missedDeadlines && (
                        <div>
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">Missed Deadlines</p>
                          <p className="mt-1 text-sm leading-relaxed">{reliability.missedDeadlines}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Bio Text */}
                {typeof aboutText === 'string' && aboutText.length > 5 && (
                  <div className="bg-card p-8 rounded-xl border">
                    <h3 className="text-xl font-semibold mb-4">About</h3>
                    <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">{aboutText}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUserDetails;
