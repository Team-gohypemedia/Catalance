"use client";

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RoleAwareSidebar } from "@/components/layout/RoleAwareSidebar";
import ClientDashboardFooter from "@/components/features/client/ClientDashboardFooter";
import { ClientTopBar } from "@/components/features/client/ClientTopBar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/shared/context/AuthContext";
import ProfileImageCropDialog from "@/components/common/ProfileImageCropDialog";
import { toast } from "sonner";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import User from "lucide-react/dist/esm/icons/user";
import Building2 from "lucide-react/dist/esm/icons/building-2";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Globe from "lucide-react/dist/esm/icons/globe";
import Mail from "lucide-react/dist/esm/icons/mail";
import Phone from "lucide-react/dist/esm/icons/phone";
import Camera from "lucide-react/dist/esm/icons/camera";
import Bell from "lucide-react/dist/esm/icons/bell";
import Star from "lucide-react/dist/esm/icons/star";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import Link2 from "lucide-react/dist/esm/icons/link-2";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import { Switch } from "@/components/ui/switch";

const PROFILE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

const ClientProfileContent = () => {
  const { user, authFetch, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [pendingProfilePhotoFile, setPendingProfilePhotoFile] = useState(null);
  const [isProfileCropOpen, setIsProfileCropOpen] = useState(false);
  const fileInputRef = useRef(null);
  const avatarUrlRef = useRef("");
  const [notificationPrefs, setNotificationPrefs] = useState({
    projectUpdates: true,
    messages: true,
    milestoneReviews: true,
    smsAlerts: false,
  });
  const [completedProjects, setCompletedProjects] = useState([]);
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [submittingReviews, setSubmittingReviews] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    bio: "",
    companyName: "",
    phoneNumber: "",
    location: "",
    website: "",
    avatar: "",
  });

  const setAvatarPreview = (nextAvatar) => {
    setFormData((prev) => {
      if (
        prev.avatar &&
        prev.avatar.startsWith("blob:") &&
        prev.avatar !== nextAvatar
      ) {
        URL.revokeObjectURL(prev.avatar);
      }

      return { ...prev, avatar: nextAvatar };
    });
  };

  useEffect(() => {
    avatarUrlRef.current = formData.avatar || "";
  }, [formData.avatar]);

  useEffect(() => {
    return () => {
      if (avatarUrlRef.current && avatarUrlRef.current.startsWith("blob:")) {
        URL.revokeObjectURL(avatarUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (user) {
      let parsedBio = {};
      let bioText = user.bio || "";

      // Attempt to parse bio if it looks like JSON
      if (
        bioText &&
        typeof bioText === "string" &&
        (bioText.startsWith("{") || bioText.startsWith("["))
      ) {
        try {
          const parsed = JSON.parse(bioText);
          // If parsing succeeds, check if it has known keys
          if (parsed && typeof parsed === "object") {
            parsedBio = parsed;
            // specific logic: if the parsed object has a 'bio' field, that is the real bio text
            if (parsed.bio !== undefined) {
              bioText = parsed.bio;
            } else {
              // If no 'bio' key, but it was JSON, maybe the whole thing is metadata?
              // user probably doesn't want to see JSON in the bio box anyway.
              bioText = "";
            }
          }
        } catch (e) {
          // Not valid JSON, treat as normal string
          console.log("Bio is not JSON", e);
        }
      }

      setFormData((prev) => {
        const resolvedAvatar = user.avatar || "";

        if (
          prev.avatar &&
          prev.avatar.startsWith("blob:") &&
          prev.avatar !== resolvedAvatar
        ) {
          URL.revokeObjectURL(prev.avatar);
        }

        return {
          fullName: user.fullName || user.name || parsedBio.fullName || "",
          email: user.email || parsedBio.email || "",
          bio: bioText,
          companyName: user.companyName || parsedBio.companyName || "",
          phoneNumber:
            user.phoneNumber ||
            user.phone ||
            parsedBio.phone ||
            parsedBio.phoneNumber ||
            "",
          location: user.location || parsedBio.location || "",
          website:
            user.portfolio?.portfolioUrl ||
            user.portfolio ||
            user.website ||
            parsedBio.website ||
            "",
          avatar: resolvedAvatar,
        };
      });

      const persistedPrefs = parsedBio.notificationPrefs;
      if (persistedPrefs && typeof persistedPrefs === "object") {
        setNotificationPrefs((prev) => ({
          ...prev,
          ...persistedPrefs,
        }));
      }
    }
  }, [user]);

  useEffect(() => {
    if (!authFetch) return;

    let isMounted = true;
    const loadCompletedProjects = async () => {
      try {
        const response = await authFetch("/projects");
        const payload = await response.json().catch(() => null);
        if (!isMounted) return;

        const projects = Array.isArray(payload?.data) ? payload.data : [];
        const completed = projects.filter(
          (project) => String(project.status || "").toUpperCase() === "COMPLETED"
        );

        setCompletedProjects(completed);
        setReviewDrafts((prev) => {
          const next = { ...prev };
          completed.forEach((project) => {
            if (!next[project.id]) {
              next[project.id] = {
                freelancerRating: 0,
                managerRating: 0,
                feedback: "",
              };
            }
          });
          return next;
        });
      } catch (error) {
        console.error("Failed to load completed projects for review", error);
      }
    };

    loadCompletedProjects();
    return () => {
      isMounted = false;
    };
  }, [authFetch]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const closeProfileCropDialog = () => {
    setIsProfileCropOpen(false);
    setPendingProfilePhotoFile(null);
  };

  const handleProfilePhotoCropped = async (croppedFile) => {
    if (!(typeof File !== "undefined" && croppedFile instanceof File)) {
      toast.error("Unable to process profile photo.");
      return false;
    }

    if (croppedFile.size > PROFILE_PHOTO_MAX_BYTES) {
      toast.error("Cropped photo must be 5MB or smaller.");
      return false;
    }

    const objectUrl = URL.createObjectURL(croppedFile);
    setSelectedFile(croppedFile);
    setAvatarPreview(objectUrl);
    closeProfileCropDialog();
    toast.success("Profile photo updated. Save changes to upload it.");
    return true;
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

    if (!String(file.type || "").startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }

    if (file.size > PROFILE_PHOTO_MAX_BYTES) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setPendingProfilePhotoFile(file);
    setIsProfileCropOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let currentAvatarUrl = formData.avatar;

      // Check if we need to upload an image first
      if (selectedFile) {
        setUploadingImage(true);
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
        } finally {
          setUploadingImage(false);
        }
      }

      const payload = {
        personal: {
          name: formData.fullName,
          email: formData.email,
          phone: formData.phoneNumber,
          location: formData.location,
          avatar: currentAvatarUrl,
        },
        companyName: formData.companyName,
        website: formData.website,
        bio: formData.bio,
        notificationPrefs,
      };

      const response = await authFetch("/profile", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update profile");
      }

      setSelectedFile(null);
      setAvatarPreview(currentAvatarUrl || "");
      toast.success("Profile updated successfully");
      await refreshUser();
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationToggle = (key, checked) => {
    setNotificationPrefs((prev) => ({
      ...prev,
      [key]: checked,
    }));
  };

  const handleReviewDraftChange = (projectId, key, value) => {
    setReviewDrafts((prev) => ({
      ...prev,
      [projectId]: {
        freelancerRating: 0,
        managerRating: 0,
        feedback: "",
        ...prev[projectId],
        [key]: value,
      },
    }));
  };

  const handleSubmitReview = async (projectId) => {
    const review = reviewDrafts[projectId];
    if (!review) return;
    if (!review.freelancerRating || !review.managerRating) {
      toast.error("Rate both freelancer and project manager before submitting.");
      return;
    }

    setSubmittingReviews(true);
    try {
      // Placeholder persistence. Connect this to a dedicated review endpoint.
      await new Promise((resolve) => {
        setTimeout(resolve, 400);
      });
      toast.success("Review submitted");
    } finally {
      setSubmittingReviews(false);
    }
  };

  // Background style (Dotted Noise)
  const backgroundStyle = {
    backgroundImage: `radial-gradient(var(--grid-line-color) 1px, transparent 1px)`,
    backgroundSize: "24px 24px",
    maskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
    WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
  };

  return (
    <div className="flex-1 flex flex-col relative h-full overflow-hidden bg-background transition-colors duration-300">
      {/* Background Texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={backgroundStyle}
      />

      <ClientTopBar />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 z-10 relative scroll-smooth">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid gap-8 lg:grid-cols-[280px_1fr] animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Left Column: Identity Card */}
          <div className="space-y-6">
            <Card className="border-border/60 bg-card/60 backdrop-blur-xl overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="pt-8 pb-8 flex flex-col items-center text-center relative z-10">
                <div
                  className="relative mb-4 group/avatar cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Avatar className="h-32 w-32 ring-4 ring-background shadow-xl transition-transform duration-300 group-hover/avatar:scale-105">
                    <AvatarImage
                      src={formData.avatar || user?.avatar}
                      alt={formData.fullName}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-4xl bg-primary text-primary-foreground font-bold">
                      {formData.fullName?.[0] || "C"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-2 ring-background opacity-0 scale-95 group-hover/avatar:opacity-100 group-hover/avatar:scale-100 transition-all duration-300">
                    {uploadingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-1">
                  {formData.fullName || "User"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {formData.email}
                </p>

                <div className="w-full space-y-2 text-sm text-left mt-4 bg-muted/30 p-4 rounded-xl">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Building2 className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {formData.companyName || "No Company"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {formData.location || "No Location"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Edit Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Profile Settings
              </h2>
              <p className="text-muted-foreground">
                Manage your personal information and preferences.
              </p>
            </div>

            <Card className="border-border/60 bg-card/40 backdrop-blur-md shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Update your personal details here.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="bg-background/50 focus:bg-background transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        value={formData.email}
                        disabled
                        className="pl-9 bg-muted/50 text-muted-foreground cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        placeholder="+1 (555) 000-0000"
                        className="pl-9 bg-background/50 focus:bg-background transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="New York, USA"
                        className="pl-9 bg-background/50 focus:bg-background transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Tell us about yourself..."
                    className="min-h-[100px] bg-background/50 focus:bg-background transition-colors resize-y"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/40 backdrop-blur-md shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Company Details
                </CardTitle>
                <CardDescription>
                  Manage your business information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        placeholder="Acme Inc."
                        className="pl-9 bg-background/50 focus:bg-background transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={handleChange}
                        placeholder="https://example.com"
                        className="pl-9 bg-background/50 focus:bg-background transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/40 backdrop-blur-md shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Billing & Payments
                </CardTitle>
                <CardDescription>
                  Open your billing hub to manage cards, receipts, and escrow visibility.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-border/60 bg-background/40 p-4">
                  <p className="text-sm font-semibold text-foreground">Customer Portal</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Use secure hosted checkout and card management for PCI compliance.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    onClick={() => navigate("/client/payments")}
                    className="gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    Open Billing Hub
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() =>
                      toast.info(
                        "Wire this action to your Stripe Customer Portal session endpoint."
                      )
                    }
                  >
                    <ExternalLink className="h-4 w-4" />
                    Launch Customer Portal
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/40 backdrop-blur-md shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Control where project, milestone, and chat alerts are delivered.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Project updates</p>
                    <p className="text-xs text-muted-foreground">
                      Status changes, approvals, and timeline updates
                    </p>
                  </div>
                  <Switch
                    checked={notificationPrefs.projectUpdates}
                    onCheckedChange={(checked) =>
                      handleNotificationToggle("projectUpdates", checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Messages</p>
                    <p className="text-xs text-muted-foreground">
                      New chat messages from freelancer or project manager
                    </p>
                  </div>
                  <Switch
                    checked={notificationPrefs.messages}
                    onCheckedChange={(checked) =>
                      handleNotificationToggle("messages", checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Milestone review reminders</p>
                    <p className="text-xs text-muted-foreground">
                      Nudges when deliverables are waiting for approval
                    </p>
                  </div>
                  <Switch
                    checked={notificationPrefs.milestoneReviews}
                    onCheckedChange={(checked) =>
                      handleNotificationToggle("milestoneReviews", checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">SMS alerts</p>
                    <p className="text-xs text-muted-foreground">
                      Critical disputes and payment alerts by SMS
                    </p>
                  </div>
                  <Switch
                    checked={notificationPrefs.smsAlerts}
                    onCheckedChange={(checked) =>
                      handleNotificationToggle("smsAlerts", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/40 backdrop-blur-md shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Post-Project Reviews
                </CardTitle>
                <CardDescription>
                  Rate freelancer execution and project manager communication after delivery.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {completedProjects.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/60 bg-background/30 p-4 text-sm text-muted-foreground">
                    Completed projects will appear here for reviews.
                  </div>
                ) : (
                  completedProjects.slice(0, 3).map((project) => {
                    const draft = reviewDrafts[project.id] || {
                      freelancerRating: 0,
                      managerRating: 0,
                      feedback: "",
                    };
                    return (
                      <div
                        key={project.id}
                        className="rounded-lg border border-border/60 bg-background/40 p-4 space-y-3"
                      >
                        <p className="text-sm font-semibold text-foreground">
                          {project.title || "Completed project"}
                        </p>

                        <div className="space-y-2">
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            Freelancer rating
                          </p>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, index) => {
                              const score = index + 1;
                              const active = draft.freelancerRating >= score;
                              return (
                                <Button
                                  key={`freelancer-${project.id}-${score}`}
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    handleReviewDraftChange(
                                      project.id,
                                      "freelancerRating",
                                      score
                                    )
                                  }
                                >
                                  <Star
                                    className={`h-4 w-4 ${
                                      active ? "text-amber-500 fill-amber-500" : "text-muted-foreground"
                                    }`}
                                  />
                                </Button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            Project manager rating
                          </p>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, index) => {
                              const score = index + 1;
                              const active = draft.managerRating >= score;
                              return (
                                <Button
                                  key={`manager-${project.id}-${score}`}
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    handleReviewDraftChange(
                                      project.id,
                                      "managerRating",
                                      score
                                    )
                                  }
                                >
                                  <Star
                                    className={`h-4 w-4 ${
                                      active ? "text-amber-500 fill-amber-500" : "text-muted-foreground"
                                    }`}
                                  />
                                </Button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`feedback-${project.id}`}>Feedback</Label>
                          <Textarea
                            id={`feedback-${project.id}`}
                            value={draft.feedback}
                            onChange={(event) =>
                              handleReviewDraftChange(
                                project.id,
                                "feedback",
                                event.target.value
                              )
                            }
                            placeholder="Share what went well and what can improve."
                            className="min-h-[90px] bg-background/50"
                          />
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          className="gap-2"
                          onClick={() => handleSubmitReview(project.id)}
                          disabled={submittingReviews}
                        >
                          {submittingReviews ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Link2 className="h-4 w-4" />
                          )}
                          Submit Review
                        </Button>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-4 sticky bottom-6 z-20">
              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className="min-w-[150px] shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
          </div>

          <ClientDashboardFooter />
        </div>
      </main>

      <ProfileImageCropDialog
        open={isProfileCropOpen}
        file={pendingProfilePhotoFile}
        maxUploadBytes={PROFILE_PHOTO_MAX_BYTES}
        onApply={handleProfilePhotoCropped}
        onCancel={closeProfileCropDialog}
      />
    </div>
  );
};

const ClientProfile = () => {
  return (
    <RoleAwareSidebar>
      <ClientProfileContent />
    </RoleAwareSidebar>
  );
};

export default ClientProfile;


