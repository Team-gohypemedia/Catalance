import {
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  X,
  Camera,
  Loader2,
  User,
  Rocket,
  Cpu,
  Briefcase,
  Github,
  Linkedin,
  Globe,
  MapPin,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FreelancerTopBar } from "@/components/freelancer/FreelancerTopBar";
import { RoleAwareSidebar } from "@/components/dashboard/RoleAwareSidebar";
import { API_BASE_URL } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";

const serviceOptions = [
  "Web development",
  "App development",
  "UI/UX design",
  "Product strategy",
  "AI/ML integration",
];

const buildUrl = (path) => `${API_BASE_URL}${path.replace(/^\/api/, "")}`;

const getBioTextFromObject = (obj) => {
  if (!obj || typeof obj !== "object") return "";
  const textKeys = ["bio", "about", "description", "summary", "text"];
  for (const key of textKeys) {
    if (typeof obj[key] === "string" && obj[key].trim()) {
      return obj[key];
    }
  }
  const fallback = Object.values(obj).find(
    (value) => typeof value === "string" && value.trim()
  );
  return fallback || "";
};

const normalizeBioValue = (value) => {
  if (!value) return "";
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (
      trimmed.startsWith("{") &&
      trimmed.endsWith("}") &&
      trimmed.length > 2
    ) {
      try {
        const parsed = JSON.parse(trimmed);
        if (typeof parsed === "string") {
          return parsed;
        }
        if (typeof parsed === "object" && parsed !== null) {
          return getBioTextFromObject(parsed);
        }
      } catch {
        // fall through and return the raw string
      }
    }
    if (
      trimmed.startsWith("[") &&
      trimmed.endsWith("]") &&
      trimmed.length > 2
    ) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.join(" ").trim();
        }
      } catch {
        //
      }
    }
    return value;
  }
  if (typeof value === "object") {
    return getBioTextFromObject(value);
  }
  return String(value);
};

const initialWorkForm = {
  company: "",
  position: "",
  from: "",
  to: "",
  description: "",
};

const FreelancerProfile = () => {
  const { user, authFetch } = useAuth();
  const [modalType, setModalType] = useState(null);
  const [skills, setSkills] = useState([]); // [{ name }]
  const [workExperience, setWorkExperience] = useState([]); // {title, period, description}
  const [services, setServices] = useState([]); // string[]
  const [skillForm, setSkillForm] = useState({ name: "" });
  const [workForm, setWorkForm] = useState(initialWorkForm);
  const [editingIndex, setEditingIndex] = useState(null); // null = add, number = edit

  const [personal, setPersonal] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    experienceYears: "",
  });
  const [portfolio, setPortfolio] = useState({
    portfolioUrl: "",
    linkedinUrl: "",
    githubUrl: "",
    resume: "",
  });
  const [portfolioProjects, setPortfolioProjects] = useState([]); // [{ link, image, title }]
  const [newProjectUrl, setNewProjectUrl] = useState("");
  const [newProjectLoading, setNewProjectLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Derive initials for avatar
  const initials =
    personal.name
      ?.trim()
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "KS";

  useEffect(() => {
    let active = true;

    const normalizeProfileData = (payload = {}) => {
      if (payload?.personal) {
        return payload;
      }

      return {
        personal: {
          name: payload.fullName ?? payload.name ?? "",
          email: payload.email ?? "",
          phone: payload.phone ?? payload.phoneNumber ?? "",
          location: payload.location ?? "",
          headline: payload.jobTitle ?? payload.headline ?? "",
          bio: payload.bio ?? "",
          experienceYears: payload.experienceYears ?? "",
          avatar: payload.avatar ?? "",
          available:
            payload.status !== undefined ? payload.status === "ACTIVE" : true,
        },
        skills: Array.isArray(payload.skills) ? payload.skills : [],
        workExperience: payload.workExperience ?? [],
        services: Array.isArray(payload.services) ? payload.services : [],
        portfolio: {
          portfolioUrl: payload.portfolio ?? "",
          linkedinUrl: payload.linkedin ?? "",
          githubUrl: payload.github ?? "",
          resume: payload.resume ?? "",
        },
        portfolioProjects: payload.portfolioProjects ?? [],
      };
    };

    const loadProfile = async () => {
      setProfileLoading(true);

      try {
        let data = null;

        if (user?.email) {
          const response = await authFetch(
            `/profile?email=${encodeURIComponent(user.email)}&_t=${Date.now()}`
          );

          if (response.ok) {
            const payload = await response.json();
            data = payload?.data ?? null;
          } else {
            console.warn("Profile GET not ok:", response.status);
          }
        }

        if (!data) {
          const fallbackResponse = await authFetch("/auth/profile");
          if (fallbackResponse.ok) {
            const payload = await fallbackResponse.json();
            data = payload?.data ?? null;
          }
        }

        if (!data && user?.email) {
          const baseUrl = API_BASE_URL || "/api";
          const url = `${baseUrl}/profile?email=${encodeURIComponent(
            user.email
          )}&_t=${Date.now()}`;
          const response = await fetch(url);
          if (response.ok) {
            const payload = await response.json();
            data = payload?.data ?? null;
          }
        }

        if (!data && user) {
          data = user;
        }

        if (!active || !data) return; // Prevent updating state if unmounted or no data

        const normalized = normalizeProfileData(data);

        // Debug logging
        console.log("[FreelancerProfile] Loaded data from API:", normalized);
        console.log(
          "[FreelancerProfile] Headline from API:",
          normalized.personal?.headline
        );

        // Update state with API data
        setPersonal((prev) => {
          const rawBio = normalized.personal?.bio ?? prev.bio ?? "";
          const safeBio = normalizeBioValue(rawBio);

          return {
            ...prev,
            name:
              normalized.personal?.name ??
              user?.fullName ??
              user?.name ??
              prev.name,
            email: normalized.personal?.email ?? user?.email ?? prev.email,
            phone: normalized.personal?.phone ?? prev.phone ?? "",
            location: normalized.personal?.location ?? prev.location ?? "",
            headline: normalized.personal?.headline ?? prev.headline ?? "",
            bio: safeBio,
            experienceYears:
              normalized.personal?.experienceYears ??
              prev.experienceYears ??
              "",
            avatar: normalized.personal?.avatar ?? prev.avatar ?? "",
            available: normalized.personal?.available ?? true,
          };
        });

        setPortfolio({
          portfolioUrl: normalized.portfolio?.portfolioUrl || "",
          linkedinUrl: normalized.portfolio?.linkedinUrl || "",
          githubUrl: normalized.portfolio?.githubUrl || "",
        });
        setPortfolioProjects(normalized.portfolioProjects || []);

        const skillsFromApi = Array.isArray(normalized.skills)
          ? normalized.skills
          : [];
        setSkills(
          skillsFromApi.map((s) => {
            // Self-heal: Check if skill is a JSON string
            if (
              typeof s === "string" &&
              s.trim().startsWith("{") &&
              s.includes('"name"')
            ) {
              try {
                return { name: JSON.parse(s).name };
              } catch (e) {}
            }
            return typeof s === "string"
              ? { name: s }
              : { name: String(s?.name ?? "") };
          })
        );

        setWorkExperience(normalized.workExperience ?? []);
        setServices(
          Array.isArray(normalized.services) ? normalized.services : []
        );
      } catch (error) {
        console.error("Unable to load profile", error);
        toast.error("Failed to load profile data");
      } finally {
        if (active) setProfileLoading(false);
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [user?.email, authFetch, user?.fullName, user?.name]);

  // ----- Skills -----
  const addSkill = () => {
    const name = skillForm.name.trim();
    if (!name) return;
    setSkills((prev) => [...prev, { name }]);
    setSkillForm({ name: "" });
    setModalType(null);
  };

  const deleteSkill = (index) => {
    setSkills((prev) => prev.filter((_, i) => i !== index));
  };

  // ----- Work Experience (add + edit) -----
  const openCreateExperienceModal = () => {
    setEditingIndex(null);
    setWorkForm(initialWorkForm);
    setModalType("work");
  };

  const openEditExperienceModal = (item, index) => {
    const [position, company] = (item.title ?? "").split(" · ");
    const [from, to] = (item.period ?? " – ").split(" – ");

    setWorkForm({
      company: company ?? "",
      position: position ?? "",
      from: from ?? "",
      to: to ?? "",
      description: item.description ?? "",
    });

    setEditingIndex(index);
    setModalType("work");
  };

  const saveExperience = () => {
    const { company, position, from, to, description } = workForm;

    if (!company.trim() || !position.trim() || !from.trim()) {
      toast.error("Please fill in Company, Position, and Start Date");
      return;
    }

    const toDate = to.trim() || "Present";

    const newItem = {
      title: `${position.trim()} · ${company.trim()}`,
      period: `${from.trim()} – ${toDate}`,
      description: description.trim(),
    };

    if (editingIndex !== null) {
      setWorkExperience((prev) =>
        prev.map((item, idx) => (idx === editingIndex ? newItem : item))
      );
    } else {
      setWorkExperience((prev) => [...prev, newItem]);
    }

    setWorkForm(initialWorkForm);
    setEditingIndex(null);
    setModalType(null);
  };

  const deleteExperience = (index) => {
    setWorkExperience((prev) => prev.filter((_, i) => i !== index));
  };

  // ----- Save to backend -----
  const handleSave = async () => {
    if (!personal.email) {
      toast.error("Cannot save profile", {
        description: "Missing email on your profile.",
      });
      return;
    }

    // Validation removed as per user request
    // const isDeveloper = services.some(s => ...);
    // if (isDeveloper && !portfolio.githubUrl?.trim()) ...

    const skillsForApi = skills
      .map((s) => (typeof s === "string" ? s : s.name))
      .map((s) => s?.trim())
      .filter(Boolean);

    // Check if we need to upload an image first
    let currentAvatarUrl = personal.avatar;

    if (selectedFile) {
      try {
        const uploadData = new FormData();
        uploadData.append("file", selectedFile);

        const uploadRes = await authFetch("/upload", {
          method: "POST",
          body: uploadData,
        });

        if (!uploadRes.ok) {
          const err = await uploadRes.json();
          throw new Error(err.message || "Image upload failed");
        }

        const data = await uploadRes.json();
        currentAvatarUrl = data.data.url;
        console.log("New Avatar URL from upload:", currentAvatarUrl);
      } catch (uploadErr) {
        console.error("Image upload failed inside save:", uploadErr);
        toast.error("Failed to upload image. Profile not saved.");
        return;
      }
    }

    const bioText = normalizeBioValue(personal.bio);

    const payload = {
      personal: {
        name: personal.name,
        email: personal.email,
        phone: personal.phone,
        location: personal.location,
        headline: personal.headline,
        bio: bioText,
        experienceYears: personal.experienceYears,
        available: personal.available,
        avatar: currentAvatarUrl, // Use the new real URL or existing
      },
      bio: bioText,
      skills: skillsForApi,
      workExperience,
      services,
      portfolio, // Add portfolio to payload
      portfolioProjects, // Add portfolioProjects to payload
    };

    console.log("Saving profile payload:", payload);

    try {
      const response = await authFetch("/profile", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      // const text = await response.text(); // authFetch handles response.text() for errors
      // console.log("Save response:", response.status, text);

      if (!response.ok) {
        toast.error("Save failed", {
          description: "Check backend logs for more details.",
        });
        return;
      }

      toast.success("Profile saved", {
        description: "Your profile has been updated successfully.",
      });

      // Update local state to reflect saved changes (esp if avatar changed)
      setPersonal((prev) => ({ ...prev, avatar: currentAvatarUrl }));
      setSelectedFile(null);
    } catch (error) {
      console.error("Save failed", error);
      toast.error("Save failed", {
        description: "Something went wrong. Check console for details.",
      });
    }
  };

  // ----- Personal Details Edit (Name, Headline, Phone, Location) -----
  const openEditPersonalModal = () => {
    setModalType("personal");
  };

  const handlePersonalChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPersonal((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ----- Image Upload Logic -----
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset input so same file can be selected again if needed
    e.target.value = "";

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // Store file for later upload
    setSelectedFile(file);

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPersonal((prev) => ({ ...prev, avatar: objectUrl }));
  };

  // ----- Add Custom Service -----
  const [serviceForm, setServiceForm] = useState("");
  const addService = () => {
    const name = serviceForm.trim();
    if (name && !services.includes(name)) {
      setServices((prev) => [...prev, name]);
    }
    setServiceForm("");
    setModalType(null);
  };

  // ----- Portfolio Projects Logic -----
  const handleUrlBlur = async () => {
    if (!newProjectUrl) return;
    if (portfolioProjects.some((p) => p.link === newProjectUrl)) {
      toast.error("Project already added");
      setNewProjectUrl("");
      return;
    }

    setNewProjectLoading(true);
    try {
      const res = await fetch(
        buildUrl(`/utils/metadata?url=${encodeURIComponent(newProjectUrl)}`)
      );
      const data = await res.json();

      if (data.success) {
        setPortfolioProjects((prev) => [
          ...prev,
          {
            link: newProjectUrl,
            image: data.data.image,
            title:
              data.data.title ||
              newProjectUrl.replace(/^https?:\/\//, "").split("/")[0],
          },
        ]);
        setNewProjectUrl("");
        toast.success("Project added!");
      } else {
        setPortfolioProjects((prev) => [
          ...prev,
          {
            link: newProjectUrl,
            image: null,
            title: newProjectUrl,
          },
        ]);
        setNewProjectUrl("");
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not fetch preview, but link added.");
      setPortfolioProjects((prev) => [
        ...prev,
        {
          link: newProjectUrl,
          image: null,
          title: newProjectUrl,
        },
      ]);
      setNewProjectUrl("");
    } finally {
      setNewProjectLoading(false);
    }
  };

  const removeProject = (index) => {
    setPortfolioProjects((prev) => prev.filter((_, i) => i !== index));
  };

  // Merge default options with any custom ones saved in the profile
  const displayServices = Array.from(new Set([...serviceOptions, ...services]));

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <FreelancerTopBar label="Profile" />

        {/* Header Card */}
        <div className="relative rounded-3xl overflow-hidden bg-card border border-border/50 shadow-sm group/header">
          {/* Gradient Banner */}
          {/* Gradient Banner */}
          <div className="h-44 bg-linear-to-r from-pink-500 via-purple-500 to-indigo-500 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
          </div>

          <div className="px-8 pb-10 flex flex-col md:flex-row items-end gap-6 -mt-20 relative z-10">
            {/* Avatar */}
            <div
              className="relative group/avatar cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-32 h-32 md:w-36 md:h-36 rounded-3xl shadow-xl">
                <div className="w-full h-full rounded-[18px] overflow-hidden bg-muted relative">
                  {personal.avatar ? (
                    <img
                      src={personal.avatar}
                      alt={personal.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary text-3xl font-bold text-secondary-foreground">
                      {initials}
                    </div>
                  )}
                  {/* Upload Overlay */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                    {uploadingImage ? (
                      <Loader2 className="animate-spin text-white" />
                    ) : (
                      <Camera className="text-white" />
                    )}
                  </div>
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />

              {/* Verified Badge / Available */}
              {personal.available && (
                <div
                  className="absolute bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full border-4 border-card"
                  title="Available for work"
                >
                  <div className="w-2.5 h-2.5 bg-white rounded-full" />
                </div>
              )}
            </div>

            {/* Info */}
            {/* Info */}
            <div className="flex-1 flex flex-col md:flex-row items-end justify-between gap-4 md:mb-1">
              <div className="flex flex-col gap-1 text-center md:text-left w-full md:w-auto">
                {/* Name & Badge */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                    {personal.name || "Your Name"}
                  </h1>
                  {personal.available && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold tracking-wide border border-emerald-500/30">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      AVAILABLE FOR WORK
                    </span>
                  )}
                </div>

                <p className="text-lg text-gray-300 font-medium">
                  {personal.headline || "Senior Full Stack Developer"}
                </p>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-400 mt-1">
                  {personal.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{personal.location}</span>
                    </div>
                  )}
                  {/* Experience as a dot-separated item or just next to it? Image didn't show exp clearly but keeping it if needed. */}
                  {personal.experienceYears && (
                    <>
                      <span className="hidden md:inline">•</span>
                      <span>{personal.experienceYears} Years Exp.</span>
                    </>
                  )}
                </div>
              </div>

              {/* Socials & Actions */}
              <div className="flex items-center gap-3">
                {portfolio.githubUrl && (
                  <a
                    href={portfolio.githubUrl}
                    target="_blank"
                    className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all rounded-xl border border-white/10"
                    rel="noreferrer"
                  >
                    <Github className="w-5 h-5" />
                  </a>
                )}
                {portfolio.linkedinUrl && (
                  <a
                    href={portfolio.linkedinUrl}
                    target="_blank"
                    className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all rounded-xl border border-white/10"
                    rel="noreferrer"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                )}
                {portfolio.website && (
                  <a
                    href={portfolio.website}
                    target="_blank"
                    className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all rounded-xl border border-white/10"
                    rel="noreferrer"
                  >
                    <Globe className="w-5 h-5" />
                  </a>
                )}
                {/* Edit Skills/Socials Modal Trigger - keeping functionality */}
                <button
                  onClick={() => setModalType("portfolio")}
                  className="p-2.5 text-primary hover:bg-primary/10 rounded-xl transition-colors border border-transparent hover:border-primary/20"
                  title="Add/Edit Social Links"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Edit Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10"
              onClick={openEditPersonalModal}
            >
              <Edit2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Me */}
            <Card className="p-6 md:p-8 space-y-4 relative group">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <span className="text-primary">
                    <User className="w-5 h-5" />
                  </span>{" "}
                  About Me
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={openEditPersonalModal}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {personal.bio ||
                  personal.headline ||
                  "Tell us about yourself..."}
              </p>
            </Card>

            {/* Featured Projects */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <span className="text-primary">
                    <Rocket className="w-5 h-5" />
                  </span>{" "}
                  Featured Projects
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary"
                  onClick={() => setModalType("portfolio")}
                >
                  View All
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Map Projects */}
                {portfolioProjects.map((project, idx) => (
                  <div
                    key={idx}
                    className="group relative rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="aspect-video bg-muted relative overflow-hidden">
                      {project.image ? (
                        <img
                          src={project.image}
                          alt={project.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl bg-secondary/30">
                          💻
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <a
                          href={project.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-white rounded-full text-black hover:scale-110 transition-transform"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => removeProject(idx)}
                          className="p-2 bg-destructive text-white rounded-full hover:scale-110 transition-transform"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="p-3 flex items-center justify-between gap-3">
                      <h4
                        className="font-semibold truncate text-sm flex-1"
                        title={project.title || project.link}
                      >
                        {project.title || "Project"}
                      </h4>
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                        title="Visit Project"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}

                {/* Add New Project Card / Input Area */}
                <div className="aspect-video rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center p-4 text-center hover:bg-secondary/10 transition-colors">
                  {newProjectLoading ? (
                    <Loader2 className="animate-spin text-primary" />
                  ) : (
                    <div className="w-full space-y-2">
                      <input
                        className="w-full bg-transparent text-center text-sm outline-none placeholder:text-muted-foreground"
                        placeholder="+ Add Project URL"
                        value={newProjectUrl}
                        onChange={(e) => setNewProjectUrl(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleUrlBlur()}
                        onBlur={handleUrlBlur}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            {/* Tech Stack */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <span className="text-primary">
                    <Cpu className="w-5 h-5" />
                  </span>{" "}
                  Tech Stack
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setModalType("skill")}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.length > 0 ? (
                  skills.map((s, i) => (
                    <div key={i} className="group relative">
                      <span className="px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium border border-border/50 cursor-default block">
                        {s.name}
                      </span>
                      <Trash2
                        className="w-3 h-3 absolute -top-1 -right-1 text-destructive opacity-0 group-hover:opacity-100 cursor-pointer bg-card rounded-full"
                        onClick={() => deleteSkill(i)}
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No skills added.
                  </p>
                )}
              </div>
            </Card>

            {/* Experience */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <span className="text-primary">
                    <Briefcase className="w-5 h-5" />
                  </span>{" "}
                  Experience
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={openCreateExperienceModal}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="relative border-l border-border ml-3.5 space-y-8 py-2">
                {workExperience.length > 0 ? (
                  workExperience.map((exp, i) => {
                    const [position, company] = (exp.title || "").split(" · ");
                    return (
                      <div
                        key={i}
                        className="relative pl-8 group cursor-pointer"
                        onClick={() => openEditExperienceModal(exp, i)}
                      >
                        {/* Timeline Dot */}
                        <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-primary bg-background group-hover:bg-primary transition-colors" />

                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary mb-0.5 block">
                          {exp.period || "Date N/A"}
                        </span>
                        <h4 className="font-bold text-foreground leading-tight">
                          {position || "Position"}
                        </h4>
                        <p className="text-xs text-muted-foreground font-medium mb-1">
                          {company || "Company"}
                        </p>
                        {exp.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="pl-6 text-sm text-muted-foreground">
                    No experience added.
                  </p>
                )}
              </div>
            </Card>

            <Button
              className="w-full"
              variant="outline"
              size="lg"
              onClick={handleSave}
              disabled={profileLoading}
            >
              {profileLoading ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm transition-all">
          <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card/95 backdrop-blur p-6 shadow-2xl shadow-black/50 animate-in fade-in zoom-in-95 duration-200">
            {modalType === "skill" ? (
              <>
                <h1 className="text-lg font-semibold text-foreground">
                  Add Skill
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Give the skill a name so clients can quickly scan your
                  strengths.
                </p>
                <input
                  value={skillForm.name}
                  onChange={(event) =>
                    setSkillForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Skill name"
                  className="mt-4 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                />
                <div className="mt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="rounded-2xl border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground hover:bg-muted/40 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addSkill}
                    className="rounded-2xl bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-background hover:bg-primary/85 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </>
            ) : modalType === "service" ? (
              <>
                <h1 className="text-lg font-semibold text-foreground">
                  Add Custom Service
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Offer a specialized service not in the default list.
                </p>
                <input
                  value={serviceForm}
                  onChange={(event) => setServiceForm(event.target.value)}
                  placeholder="Service name (e.g. Rust Development)"
                  className="mt-4 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                />
                <div className="mt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="rounded-2xl border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground hover:bg-muted/40 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addService}
                    className="rounded-2xl bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-background hover:bg-primary/85 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </>
            ) : modalType === "portfolio" ? (
              <>
                <h1 className="text-lg font-semibold text-foreground">
                  Edit Online Presence
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Update your social and portfolio links.
                </p>
                <div className="mt-4 space-y-4">
                  <label className="block text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                    Portfolio Website
                    <input
                      value={portfolio.portfolioUrl}
                      onChange={(e) =>
                        setPortfolio((prev) => ({
                          ...prev,
                          portfolioUrl: e.target.value,
                        }))
                      }
                      placeholder="https://yourportfolio.com"
                      className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                    />
                  </label>
                  <label className="block text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                    LinkedIn URL
                    <input
                      value={portfolio.linkedinUrl}
                      onChange={(e) =>
                        setPortfolio((prev) => ({
                          ...prev,
                          linkedinUrl: e.target.value,
                        }))
                      }
                      placeholder="https://linkedin.com/..."
                      className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                    />
                  </label>
                  <label className="block text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                    GitHub URL (Optional)
                    <input
                      value={portfolio.githubUrl}
                      onChange={(e) =>
                        setPortfolio((prev) => ({
                          ...prev,
                          githubUrl: e.target.value,
                        }))
                      }
                      placeholder="https://github.com/..."
                      className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                    />
                  </label>
                </div>

                {/* Resume Upload Section */}
                <div className="mt-4 pt-4 border-t border-border">
                  <label className="block text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-2">
                    Resume / CV
                  </label>

                  <div className="flex items-center gap-3">
                    {/* Hidden File Input */}
                    <input
                      type="file"
                      id="resume-upload"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;

                        // Check size (5MB)
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error("File is too large (max 5MB)");
                          return;
                        }

                        const formData = new FormData();
                        formData.append("file", file);

                        const toastId = toast.loading("Uploading resume...");

                        try {
                          const res = await authFetch("/upload/resume", {
                            method: "POST",
                            body: formData,
                          });

                          if (!res.ok) throw new Error("Upload failed");

                          const data = await res.json();
                          const resumeUrl = data.data.url;

                          setPortfolio((prev) => ({
                            ...prev,
                            resume: resumeUrl,
                          }));

                          toast.success("Resume uploaded!", { id: toastId });
                        } catch (err) {
                          console.error(err);
                          toast.error("Failed to upload resume", {
                            id: toastId,
                          });
                        }

                        // Reset input
                        e.target.value = "";
                      }}
                    />

                    {/* Upload Button */}
                    <label
                      htmlFor="resume-upload"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/70 cursor-pointer transition-colors border border-border text-sm font-medium"
                    >
                      <Briefcase className="w-4 h-4" />
                      {portfolio.resume ? "Update Resume" : "Upload Resume"}
                    </label>

                    {/* View/Download Link if exists */}
                    {portfolio.resume && (
                      <a
                        href={portfolio.resume}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline truncate max-w-[200px]"
                        title={portfolio.resume}
                      >
                        View Current Resume
                      </a>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5 ml-1">
                    Accepts PDF, DOC, DOCX (Max 5MB)
                  </p>
                </div>

                <div className="mt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="rounded-2xl border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground hover:bg-muted/40 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </>
            ) : modalType === "personal" ? (
              <>
                <h1 className="text-lg font-semibold text-foreground">
                  Edit Personal Details
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Update your public profile information.
                </p>

                <div className="mt-4 space-y-4">
                  <label className="flex items-center justify-between p-3 rounded-2xl border border-border bg-secondary/50 cursor-pointer hover:bg-secondary/70 transition-colors">
                    <span className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                      Available for work
                    </span>
                    <input
                      type="checkbox"
                      name="available"
                      checked={personal.available || false}
                      onChange={handlePersonalChange}
                      className="w-5 h-5 accent-primary rounded cursor-pointer"
                    />
                  </label>

                  <label className="mt-3 block text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                    Headline
                    <input
                      name="headline"
                      value={personal.headline || ""}
                      onChange={handlePersonalChange}
                      placeholder="e.g. Full Stack Developer"
                      className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                    />
                  </label>

                  <label className="mt-3 block text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                    Years of Experience
                    <input
                      name="experienceYears"
                      type="number"
                      value={personal.experienceYears || ""}
                      onChange={handlePersonalChange}
                      placeholder="e.g. 5"
                      className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                    />
                  </label>

                  <label className="block text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                    Display Name
                    <input
                      name="name"
                      value={personal.name || ""}
                      onChange={handlePersonalChange}
                      placeholder="Your Name"
                      className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                      Phone
                      <input
                        name="phone"
                        value={personal.phone || ""}
                        onChange={handlePersonalChange}
                        placeholder="+91..."
                        className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                      />
                    </label>
                    <label className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                      Location
                      <input
                        name="location"
                        value={personal.location || ""}
                        onChange={handlePersonalChange}
                        placeholder="City, Country"
                        className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                      />
                    </label>
                  </div>

                  <label className="block text-[11px] uppercase tracking-[0.3em] text-muted-foreground mt-4">
                    Bio / About Me
                    <textarea
                      name="bio"
                      value={personal.bio || ""}
                      onChange={handlePersonalChange}
                      rows={4}
                      placeholder="Tell us about yourself..."
                      className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                    />
                  </label>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="rounded-2xl border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground hover:bg-muted/40 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-lg font-semibold text-foreground">
                  {editingIndex !== null
                    ? "Edit Work Experience"
                    : "Add Work Experience"}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Capture your role, timeline, and the impact you had.
                </p>

                <label className="mt-3 block text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                  Company
                  <input
                    value={workForm.company}
                    onChange={(event) =>
                      setWorkForm((prev) => ({
                        ...prev,
                        company: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                  />
                </label>

                <label className="mt-3 block text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                  Position
                  <input
                    value={workForm.position}
                    onChange={(event) =>
                      setWorkForm((prev) => ({
                        ...prev,
                        position: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                  />
                </label>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                    From
                    <input
                      value={workForm.from}
                      onChange={(event) =>
                        setWorkForm((prev) => ({
                          ...prev,
                          from: event.target.value,
                        }))
                      }
                      placeholder="Jan 2020"
                      className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                    />
                  </label>
                  <label className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                    To
                    <input
                      value={workForm.to}
                      onChange={(event) =>
                        setWorkForm((prev) => ({
                          ...prev,
                          to: event.target.value,
                        }))
                      }
                      placeholder="Present"
                      className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                    />
                  </label>
                </div>

                <label className="mt-3 block text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                  Description
                  <textarea
                    value={workForm.description}
                    onChange={(event) =>
                      setWorkForm((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                    rows={3}
                    className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                  />
                </label>

                <div className="mt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setModalType(null);
                      setEditingIndex(null);
                      setWorkForm(initialWorkForm);
                    }}
                    className="rounded-2xl border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground hover:bg-muted/40 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveExperience}
                    className="rounded-2xl bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-background hover:bg-primary/85 transition-colors"
                  >
                    {editingIndex !== null ? "Update" : "Save"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const FreelancerProfileWrapper = () => {
  return (
    <RoleAwareSidebar>
      <FreelancerProfile />
    </RoleAwareSidebar>
  );
};

export default FreelancerProfileWrapper;
