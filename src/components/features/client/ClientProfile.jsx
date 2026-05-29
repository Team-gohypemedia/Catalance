"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Bell from "lucide-react/dist/esm/icons/bell";
import Building2 from "lucide-react/dist/esm/icons/building-2";
import Camera from "lucide-react/dist/esm/icons/camera";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import Edit2 from "lucide-react/dist/esm/icons/edit-2";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Globe from "lucide-react/dist/esm/icons/globe";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Mail from "lucide-react/dist/esm/icons/mail";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Phone from "lucide-react/dist/esm/icons/phone";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import User from "lucide-react/dist/esm/icons/user";
import { useNavigate } from "react-router-dom";
import ProfileImageCropDialog from "@/components/common/ProfileImageCropDialog";
import ClientDashboardFooter from "@/components/features/client/ClientDashboardFooter";
import ClientPageHeader from "@/components/features/client/ClientPageHeader";
import ClientWorkspaceHeader from "@/components/features/client/ClientWorkspaceHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/shared/context/AuthContext";
import { useNotifications } from "@/shared/context/NotificationContext";
import { cn } from "@/shared/lib/utils";
import { toast } from "sonner";

const PROFILE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const NOTIFICATION_PREFS_STORAGE_KEY = "catalance:client-profile:notification-prefs";

const defaultNotificationPrefs = Object.freeze({
  projectUpdates: true,
  messages: true,
  milestoneReviews: true,
  smsAlerts: false,
});

const emptyFormData = Object.freeze({
  fullName: "",
  email: "",
  bio: "",
  companyName: "",
  phoneNumber: "",
  location: "",
  website: "",
  avatar: "",
});

const getDisplayName = (user) =>
  user?.fullName || user?.name || user?.email?.split("@")[0] || "Client";

const getInitials = (value = "") => {
  const parts = String(value)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "C";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const formatCompactNumber = (value = 0) =>
  new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value) || 0);

const formatCompactCurrency = (value = 0) => {
  const numericValue = Number(value) || 0;

  if (numericValue >= 10000000) {
    return `Rs.${(numericValue / 10000000).toFixed(numericValue >= 100000000 ? 0 : 1)}Cr`;
  }

  if (numericValue >= 100000) {
    return `Rs.${(numericValue / 100000).toFixed(numericValue >= 1000000 ? 0 : 1)}L`;
  }

  if (numericValue >= 1000) {
    return `Rs.${Math.round(numericValue / 1000)}k`;
  }

  return `Rs.${numericValue}`;
};

const parseEmbeddedProfileData = (value = "") => {
  const rawValue = String(value || "").trim();

  if (!rawValue || (!rawValue.startsWith("{") && !rawValue.startsWith("["))) {
    return { bioText: rawValue, metadata: {} };
  }

  try {
    const parsed = JSON.parse(rawValue);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { bioText: rawValue, metadata: {} };
    }

    return {
      bioText: String(parsed.bio || parsed.about || parsed.description || "").trim(),
      metadata: parsed,
    };
  } catch {
    return { bioText: rawValue, metadata: {} };
  }
};

const readStoredNotificationPrefs = (userId) => {
  if (typeof window === "undefined") return null;

  try {
    const suffix = userId ? `:${userId}` : "";
    const rawValue = window.localStorage.getItem(
      `${NOTIFICATION_PREFS_STORAGE_KEY}${suffix}`,
    );
    if (!rawValue) return null;

    const parsedValue = JSON.parse(rawValue);
    if (!parsedValue || typeof parsedValue !== "object" || Array.isArray(parsedValue)) {
      return null;
    }

    return {
      ...defaultNotificationPrefs,
      ...parsedValue,
    };
  } catch {
    return null;
  }
};

const writeStoredNotificationPrefs = (userId, notificationPrefs) => {
  if (typeof window === "undefined") return;

  try {
    const suffix = userId ? `:${userId}` : "";
    window.localStorage.setItem(
      `${NOTIFICATION_PREFS_STORAGE_KEY}${suffix}`,
      JSON.stringify(notificationPrefs),
    );
  } catch {
    // Ignore local persistence failures.
  }
};

const buildProfileStateFromUser = (user) => {
  const { bioText, metadata } = parseEmbeddedProfileData(user?.bio);
  const storedNotificationPrefs = readStoredNotificationPrefs(user?.id);

  return {
    formData: {
      fullName: user?.fullName || user?.name || metadata.fullName || "",
      email: user?.email || metadata.email || "",
      bio: bioText,
      companyName: user?.companyName || metadata.companyName || "",
      phoneNumber:
        user?.phoneNumber ||
        user?.phone ||
        metadata.phoneNumber ||
        metadata.phone ||
        "",
      location: user?.location || metadata.location || "",
      website:
        user?.website ||
        user?.portfolio?.portfolioUrl ||
        user?.portfolio ||
        metadata.website ||
        metadata.portfolio ||
        "",
      avatar: user?.avatar || "",
    },
    notificationPrefs: storedNotificationPrefs || {
      ...defaultNotificationPrefs,
      ...(metadata.notificationPrefs && typeof metadata.notificationPrefs === "object"
        ? metadata.notificationPrefs
        : {}),
    },
  };
};

const getProfileCompletionPercentage = (formData = emptyFormData) => {
  const trackedFields = [
    formData.avatar,
    formData.fullName,
    formData.email,
    formData.phoneNumber,
    formData.location,
    formData.companyName,
    formData.website,
    formData.bio,
  ];

  const filledFields = trackedFields.filter((value) => String(value || "").trim()).length;
  return Math.round((filledFields / trackedFields.length) * 100);
};

const ProfileSurface = ({ className, children }) => (
  <section
    className={cn(
      "rounded-[20px] border border-border bg-card sm:rounded-[28px]",
      className,
    )}
  >
    {children}
  </section>
);

const SectionHeader = ({ icon: Icon, title, description, onEdit }) => (
  <div className="flex items-start justify-between gap-3">
    <div className="flex min-w-0 items-start gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary sm:size-10">
        <Icon className="size-4 sm:size-5" />
      </div>
      <div className="min-w-0 space-y-1">
        <h2 className="text-[0.95rem] font-semibold tracking-[-0.02em] text-foreground sm:text-[1.05rem]">{title}</h2>
        {description ? <p className="text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6">{description}</p> : null}
      </div>
    </div>
    {onEdit ? (
      <Button
        type="button"
        variant="outline"
        onClick={onEdit}
        className="h-8 shrink-0 self-start rounded-full border-border bg-muted px-3 text-xs text-foreground hover:bg-muted/80 sm:h-10 sm:px-4 sm:text-sm"
      >
        <Edit2 className="mr-1.5 size-3.5 text-primary sm:size-4" />
        Edit
      </Button>
    ) : null}
  </div>
);

const StatBlock = ({ value, label, tone = "default" }) => (
  <div className="min-w-0 overflow-hidden space-y-1">
    <p
      className={cn(
        "truncate text-[1.1rem] font-semibold leading-none tracking-[-0.04em] sm:text-[1.5rem]",
        tone === "accent" ? "text-primary" : "text-foreground",
      )}
    >
      {value}
    </p>
    <p className="line-clamp-2 text-[7px] font-semibold uppercase leading-tight tracking-[0.08em] text-muted-foreground sm:text-[9px] sm:tracking-[0.14em]">
      {label}
    </p>
  </div>
);

const ProfileField = ({
  icon: Icon,
  label,
  id,
  value,
  onChange,
  placeholder,
  disabled = false,
  type = "text",
}) => (
  <div className="space-y-3">
    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
      {label}
    </p>
    <div className="relative">
      <Icon className="pointer-events-none absolute left-5 top-1/2 size-4 -translate-y-1/2 text-primary" />
      <Input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "h-12 rounded-[14px] border-border bg-muted/50 pl-12 text-sm text-muted-foreground placeholder:text-muted-foreground focus-visible:border-primary/35 focus-visible:ring-primary/15",
          disabled && "cursor-not-allowed text-muted-foreground opacity-80",
        )}
      />
    </div>
  </div>
);

const ProfileDisplayField = ({ icon: Icon, label, value, placeholder }) => (
  <div className="min-w-0 w-full space-y-3">
    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
      {label}
    </p>
    <div className="flex min-w-0 w-full min-h-12 items-center gap-3 rounded-[14px] border border-border bg-muted/50 px-4 sm:px-5">
      <Icon className="size-4 shrink-0 text-primary" />
      <span
        className="min-w-0 flex-1 truncate text-sm text-muted-foreground"
      >
        {value || placeholder}
      </span>
    </div>
  </div>
);

const ProfileTextDisplay = ({ label, value, placeholder, className }) => (
  <div className="min-w-0 w-full space-y-3">
    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
      {label}
    </p>
    <div
      className={cn(
        "rounded-[14px] border border-border bg-muted/50 px-4 py-4 text-sm leading-7 whitespace-pre-wrap sm:px-6 sm:py-5",
        "text-muted-foreground",
        className,
      )}
    >
      {value || placeholder}
    </div>
  </div>
);

const ReadonlyActionField = ({ icon: Icon, label, value, actionLabel, onClick }) => (
  <div className="min-w-0 w-full space-y-3">
    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
      {label}
    </p>
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-12 w-full flex-col items-start gap-3 rounded-[14px] border border-border bg-muted/50 px-4 py-3 text-left transition hover:bg-muted sm:flex-row sm:items-center sm:px-5"
    >
      <div className="flex w-full min-w-0 items-center gap-3">
        <Icon className="size-4 shrink-0 text-primary" />
        <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{value}</span>
      </div>
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary sm:ml-auto">
        {actionLabel}
        <ExternalLink className="size-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </span>
    </button>
  </div>
);

const BillingShortcutCard = ({
  icon: Icon,
  title,
  description,
  meta,
  actionLabel,
  onClick,
  loading = false,
  accent = "primary",
}) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex w-full flex-col rounded-[18px] border border-border bg-card p-4 text-left transition hover:bg-muted/50 sm:rounded-[24px] sm:p-5"
  >
    <div
      className={cn(
        "flex size-10 items-center justify-center rounded-full sm:size-12",
        accent === "primary"
          ? "bg-primary text-primary-foreground"
          : "border border-primary/25 bg-primary/10 text-primary",
      )}
    >
      {loading ? <Loader2 className="size-4 animate-spin sm:size-5" /> : <Icon className="size-4 sm:size-5" />}
    </div>

    <div className="mt-4 sm:mt-5">
      <p className="text-[1.1rem] font-semibold tracking-[-0.03em] text-foreground sm:text-[1.35rem]">{title}</p>
      <p className="mt-1.5 text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6">{description}</p>
    </div>

    <div className="mt-4 flex items-center justify-between gap-2 sm:mt-6">
      <p className="min-w-0 truncate text-xs text-muted-foreground sm:text-sm">{meta}</p>
      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary sm:text-sm">
        {actionLabel}
        <ExternalLink className="size-3 transition group-hover:translate-x-0.5 sm:size-3.5" />
      </span>
    </div>
  </button>
);

const NotificationToggleRow = ({
  icon: Icon,
  title,
  description,
  checked,
  onCheckedChange,
  readOnly = false,
}) => (
  <div className="flex items-center justify-between gap-3 rounded-[14px] border border-border bg-muted/50 px-4 py-3.5 sm:px-5 sm:py-4">
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-primary/20 bg-primary/10 text-primary sm:size-10 sm:rounded-[12px]">
        <Icon className="size-3.5 sm:size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs leading-4 text-muted-foreground">{description}</p>
      </div>
    </div>

    <Switch
      checked={checked}
      disabled={readOnly}
      onCheckedChange={readOnly ? undefined : onCheckedChange}
      className={cn(
        "shrink-0 data-[state=unchecked]:bg-muted-foreground/30",
        readOnly && "pointer-events-none",
      )}
    />
  </div>
);

const ClientProfileContent = () => {
  const { user, authFetch, refreshUser } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [pendingProfilePhotoFile, setPendingProfilePhotoFile] = useState(null);
  const [isProfileCropOpen, setIsProfileCropOpen] = useState(false);
  const [formData, setFormData] = useState({ ...emptyFormData });
  const [notificationPrefs, setNotificationPrefs] = useState({
    ...defaultNotificationPrefs,
  });
  const [, setInitialProfileState] = useState(null);
  const [activeEditor, setActiveEditor] = useState(null);
  const [editorSnapshot, setEditorSnapshot] = useState(null);
  const fileInputRef = useRef(null);
  const avatarUrlRef = useRef("");

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
    if (!user) return;

    const nextProfileState = buildProfileStateFromUser(user);

    setFormData((prev) => {
      if (
        prev.avatar &&
        prev.avatar.startsWith("blob:") &&
        prev.avatar !== nextProfileState.formData.avatar
      ) {
        URL.revokeObjectURL(prev.avatar);
      }

      return nextProfileState.formData;
    });
    setNotificationPrefs(nextProfileState.notificationPrefs);
    setInitialProfileState(nextProfileState);
  }, [user]);

  useEffect(() => {
    if (!authFetch) return;

    let isMounted = true;

    const loadProjects = async () => {
      try {
        const response = await authFetch("/projects");
        const payload = await response.json().catch(() => null);
        if (isMounted) {
          setProjects(Array.isArray(payload?.data) ? payload.data : []);
        }
      } catch (error) {
        console.error("Failed to load client projects for profile metrics:", error);
        if (isMounted) {
          setProjects([]);
        }
      }
    };

    void loadProjects();

    return () => {
      isMounted = false;
    };
  }, [authFetch]);

  const headerDisplayName = useMemo(() => getDisplayName(user), [user]);
  const completedProjects = useMemo(
    () =>
      projects.filter(
        (project) => String(project?.status || "").toUpperCase() === "COMPLETED",
      ),
    [projects],
  );
  const activeProjects = useMemo(
    () =>
      projects.filter(
        (project) => String(project?.status || "").toUpperCase() !== "COMPLETED",
      ),
    [projects],
  );
  const totalProjectBudget = useMemo(
    () => projects.reduce((sum, project) => sum + (Number(project?.budget) || 0), 0),
    [projects],
  );
  const profileCompletion = useMemo(
    () => getProfileCompletionPercentage(formData),
    [formData],
  );
  const workspaceLink = useMemo(() => {
    const activeProject = projects.find((project) => project?.id);
    return activeProject ? `/client/project/${activeProject.id}` : "/client/project";
  }, [projects]);
  const identityStats = useMemo(
    () => [
      { label: "Profile", value: `${profileCompletion}%`, tone: "accent" },
      {
        label: "Active Projects",
        value: formatCompactNumber(activeProjects.length),
        tone: "default",
      },
      {
        label: "Completed Projects",
        value: formatCompactNumber(completedProjects.length),
        tone: "default",
      },
    ],
    [activeProjects.length, completedProjects.length, profileCompletion],
  );

  const handleChange = (event) => {
    const { id, value } = event.target;
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

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    event.target.value = "";

    if (!String(file.type || "").startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }

    if (file.size > PROFILE_PHOTO_MAX_BYTES) {
      toast.error("File size must be less than 5MB.");
      return;
    }

    setPendingProfilePhotoFile(file);
    setIsProfileCropOpen(true);
  };

  const handleNotificationToggle = (key, checked) => {
    setNotificationPrefs((prev) => {
      const nextPrefs = { ...prev, [key]: checked };
      writeStoredNotificationPrefs(user?.id, nextPrefs);
      return nextPrefs;
    });
    setInitialProfileState((prev) =>
      prev
        ? {
            ...prev,
            notificationPrefs: {
              ...prev.notificationPrefs,
              [key]: checked,
            },
          }
        : prev,
    );
  };

  const openSectionEditor = (sectionKey) => {
    setEditorSnapshot({
      formData: { ...formData },
      notificationPrefs: { ...notificationPrefs },
      selectedFile,
    });
    setActiveEditor(sectionKey);
  };

  const closeSectionEditor = () => {
    if (loading) return;

    if (editorSnapshot) {
      setFormData((prev) => {
        if (
          prev.avatar &&
          prev.avatar.startsWith("blob:") &&
          prev.avatar !== editorSnapshot.formData.avatar
        ) {
          URL.revokeObjectURL(prev.avatar);
        }

        return { ...editorSnapshot.formData };
      });
      setNotificationPrefs({ ...editorSnapshot.notificationPrefs });
      setSelectedFile(editorSnapshot.selectedFile || null);
    }

    closeProfileCropDialog();
    setActiveEditor(null);
    setEditorSnapshot(null);
  };

  const handleOpenCustomerPortal = async () => {
    setPortalLoading(true);

    try {
      const response = await authFetch("/payments/customer-portal", {
        method: "POST",
      });
      const payload = await response.json().catch(() => null);
      const portalUrl = payload?.data?.url || payload?.url;

      if (response.ok && portalUrl) {
        window.open(portalUrl, "_blank", "noopener,noreferrer");
        return;
      }

      toast.info(
        "Customer portal endpoint is not wired yet. Connect the billing portal URL to enable it.",
      );
    } catch (error) {
      console.error("Failed to open customer portal:", error);
      toast.info(
        "Customer portal endpoint is not wired yet. Connect the billing portal URL to enable it.",
      );
    } finally {
      setPortalLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      let currentAvatarUrl = formData.avatar;

      if (selectedFile) {
        setUploadingImage(true);

        try {
          const uploadData = new FormData();
          uploadData.append("file", selectedFile);

          const uploadResponse = await authFetch("/upload", {
            method: "POST",
            body: uploadData,
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json().catch(() => ({}));
            throw new Error(errorData.message || "Image upload failed");
          }

          const uploadPayload = await uploadResponse.json();
          currentAvatarUrl = uploadPayload?.data?.url || uploadPayload?.url || currentAvatarUrl;
        } finally {
          setUploadingImage(false);
        }
      }

      const payload = {
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        location: formData.location,
        companyName: formData.companyName,
        bio: formData.bio,
        portfolio: formData.website,
        avatar: currentAvatarUrl,
      };

      const response = await authFetch("/auth/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      const responsePayload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          responsePayload?.message ||
            responsePayload?.error?.message ||
            "Failed to update profile",
        );
      }

      const updatedUser = responsePayload?.data;
      const nextProfileState = buildProfileStateFromUser({
        ...user,
        ...(updatedUser && typeof updatedUser === "object" ? updatedUser : {}),
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        phone: formData.phoneNumber,
        location: formData.location,
        companyName: formData.companyName,
        bio: formData.bio,
        portfolio: formData.website,
        avatar: currentAvatarUrl || "",
      });
      const nextFormData = {
        ...nextProfileState.formData,
        email: formData.email || nextProfileState.formData.email,
      };

      setSelectedFile(null);
      setAvatarPreview(currentAvatarUrl || "");
      setFormData(nextFormData);
      setInitialProfileState({
        formData: nextFormData,
        notificationPrefs: { ...notificationPrefs },
      });
      writeStoredNotificationPrefs(user?.id, notificationPrefs);
      toast.success("Profile updated successfully.");
      await refreshUser().catch(() => null);
      setActiveEditor(null);
      setEditorSnapshot(null);
      return true;
    } catch (error) {
      console.error("Client profile update failed:", error);
      toast.error(error.message || "Something went wrong.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const billingHubMeta =
    totalProjectBudget > 0
      ? `${formatCompactCurrency(totalProjectBudget)} in tracked project value`
      : projects.length > 0
        ? `${projects.length} project${projects.length === 1 ? "" : "s"} linked`
        : "No billing activity yet";

  const workspaceSummaryText = projects.length
    ? "Open your active project workspace"
    : "Start your first client workspace";

  const activeEditorMeta = {
    personal: {
      title: "Edit Personal Information",
      description: "Update the contact and identity details you want to show across your client workspace.",
      saveLabel: "Save Personal Info",
    },
    bio: {
      title: "Edit Bio & Expertise",
      description: "Refine how collaborators understand your business, working style, and project goals.",
      saveLabel: "Save Bio",
    },
    company: {
      title: "Edit Company & Presence",
      description: "Keep your company name and website ready for project conversations and billing references.",
      saveLabel: "Save Company Details",
    },
  };

  const renderEditorContent = () => {
    if (activeEditor === "personal") {
      return (
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4 rounded-[24px] border border-border bg-muted/30 p-6 text-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative"
            >
              <Avatar className="h-28 w-28 border-2 border-[#334155] shadow-[0_24px_60px_-34px_rgba(0,0,0,0.65)]">
                <AvatarImage
                  src={formData.avatar || user?.avatar}
                  alt={formData.fullName || headerDisplayName}
                  className="object-cover"
                />
                <AvatarFallback className="bg-muted text-3xl font-semibold text-foreground">
                  {getInitials(formData.fullName || headerDisplayName)}
                </AvatarFallback>
              </Avatar>

              <span className="absolute bottom-1 right-1 flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-lg backdrop-blur-sm transition group-hover:bg-muted">
                {uploadingImage ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Camera className="size-4" />
                )}
              </span>
            </button>

            <div className="space-y-1">
                <p className="text-sm font-semibold text-muted-foreground">Profile Photo</p>
                <p className="text-xs text-muted-foreground">Upload a clear square image up to 5MB.</p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <ProfileField
              icon={User}
              label="Full Name"
              id="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Alex Rivers"
            />
            <ProfileField
              icon={Mail}
              label="Email Address"
              id="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="alex@company.com"
              disabled
              type="email"
            />
            <ProfileField
              icon={Phone}
              label="Phone Number"
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="+91 98765 43210"
            />
            <ProfileField
              icon={MapPin}
              label="Location"
              id="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="San Francisco, CA"
            />
          </div>
        </div>
      );
    }

    if (activeEditor === "bio") {
      return (
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Professional Bio
          </p>
          <Textarea
            id="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Share the kind of projects you run, the outcomes you care about, and how your team likes to collaborate."
            className="min-h-[220px] rounded-[14px] border-border bg-muted/50 px-6 py-5 text-sm leading-7 text-muted-foreground placeholder:text-muted-foreground focus-visible:border-primary/35 focus-visible:ring-primary/15"
          />
        </div>
      );
    }

    if (activeEditor === "company") {
      return (
        <div className="space-y-5">
          <ProfileField
            icon={Building2}
            label="Company Name"
            id="companyName"
            value={formData.companyName}
            onChange={handleChange}
            placeholder="Rivers Digital Labs"
          />
          <ProfileField
            icon={Globe}
            label="Website"
            id="website"
            value={formData.website}
            onChange={handleChange}
            placeholder="https://company.com"
            type="url"
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-background text-muted-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-[1536px] flex-col px-4 sm:px-6 lg:px-[40px] xl:w-[85%] xl:max-w-none">
        <ClientWorkspaceHeader
          profile={{
            avatar: user?.avatar,
            name: headerDisplayName,
            initial: getInitials(headerDisplayName),
          }}
          activeWorkspaceKey="profile"
          unreadCount={unreadCount}
        />

        <main className="flex-1 pb-12">
          <ClientPageHeader
            title="Profile Settings"
            dateLabel={false}
          />

          <div className="mt-6 space-y-5 sm:mt-8 sm:space-y-8">
            <section className="grid w-full min-w-0 gap-5 sm:gap-6 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]">
              <div className="min-w-0 space-y-6">
                <ProfileSurface className="overflow-hidden p-4 sm:p-5 lg:p-7">
                  <div className="flex w-full flex-col items-center text-center">
                    <Avatar className="h-20 w-20 border-2 border-[#334155] shadow-[0_24px_60px_-34px_rgba(0,0,0,0.65)] sm:h-28 sm:w-28 lg:h-32 lg:w-32">
                      <AvatarImage
                        src={formData.avatar || user?.avatar}
                        alt={formData.fullName || headerDisplayName}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-muted text-2xl font-semibold text-foreground sm:text-3xl lg:text-4xl">
                        {getInitials(formData.fullName || headerDisplayName)}
                      </AvatarFallback>
                    </Avatar>

                    <h2 className="mt-4 w-full truncate text-[1.3rem] font-semibold tracking-[-0.04em] text-foreground sm:mt-6 sm:text-[1.7rem] lg:text-[1.9rem]">
                      {formData.fullName || headerDisplayName}
                    </h2>
                    <p className="mt-1.5 w-full truncate text-xs text-muted-foreground sm:mt-2 sm:text-sm">
                      {formData.email || "Add an email address"}
                    </p>
                    <p className="mt-2 w-full truncate text-xs text-muted-foreground sm:mt-3 sm:text-sm">
                      {formData.companyName || "Workspace identity ready for new client projects."}
                    </p>
                  </div>

                  <div className="mt-5 border-t border-border pt-4 sm:mt-6 sm:pt-5">
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                      {identityStats.map((item, index) => (
                        <StatBlock
                          key={item.label}
                          value={item.value}
                          label={item.label}
                          tone={index === 0 ? "accent" : item.tone}
                        />
                      ))}
                    </div>
                  </div>
                </ProfileSurface>

                <ProfileSurface className="p-4 sm:p-5 lg:p-6">
                  <SectionHeader
                    icon={CreditCard}
                    title="Billing & Payments"
                    description="Open your billing hub to manage cards, invoices, and escrow visibility."
                  />

                  <div className="mt-4 space-y-3 sm:mt-5 sm:space-y-4">
                    <BillingShortcutCard
                      icon={CreditCard}
                      title="Billing Hub"
                      description="Manage invoices, milestone payments, and secure billing records from one place."
                      meta={billingHubMeta}
                      actionLabel="Open"
                      onClick={() => navigate("/client/payments")}
                    />

                    <BillingShortcutCard
                      icon={ShieldCheck}
                      title="Customer Portal"
                      description="Launch saved card management and hosted billing controls when your payment portal is connected."
                      meta="Secure card and billing preference management"
                      actionLabel="Launch"
                      onClick={() => {
                        void handleOpenCustomerPortal();
                      }}
                      loading={portalLoading}
                      accent="secondary"
                    />
                  </div>
                </ProfileSurface>
              </div>

              <div className="min-w-0 space-y-6">
                <ProfileSurface className="p-4 sm:p-5 lg:p-8">
                  <SectionHeader
                    icon={User}
                    title="Personal Information"
                    description="Keep your workspace contact details accurate for projects and billing."
                    onEdit={() => openSectionEditor("personal")}
                  />

                  <div className="mt-4 grid w-full min-w-0 gap-4 sm:mt-6 sm:gap-5 md:grid-cols-2">
                    <ProfileDisplayField
                      icon={User}
                      label="Full Name"
                      value={formData.fullName}
                      placeholder="Add your full name"
                    />
                    <ProfileDisplayField
                      icon={Mail}
                      label="Email Address"
                      value={formData.email}
                      placeholder="Add your email address"
                    />
                    <ProfileDisplayField
                      icon={Phone}
                      label="Phone Number"
                      value={formData.phoneNumber}
                      placeholder="Add your phone number"
                    />
                    <ProfileDisplayField
                      icon={MapPin}
                      label="Location"
                      value={formData.location}
                      placeholder="Add your location"
                    />
                  </div>
                </ProfileSurface>

                <ProfileSurface className="p-4 sm:p-5 lg:p-8">
                  <SectionHeader
                    icon={FileText}
                    title="Bio & Expertise"
                    description="Describe your business, the type of work you run through Catalance, and how collaborators should work with you."
                    onEdit={() => openSectionEditor("bio")}
                  />

                  <div className="mt-4 sm:mt-6">
                    <ProfileTextDisplay
                      label="Professional Bio"
                      value={formData.bio}
                      placeholder="Add a short professional bio about how you run projects and collaborate."
                    />
                  </div>
                </ProfileSurface>

                <ProfileSurface className="p-4 sm:p-5 lg:p-8">
                  <SectionHeader
                    icon={Building2}
                    title="Company & Presence"
                    description="Keep your company identity and workspace links ready for new project conversations."
                    onEdit={() => openSectionEditor("company")}
                  />

                  <div className="mt-4 space-y-4 sm:mt-6 sm:space-y-5">
                    <ProfileDisplayField
                      icon={Building2}
                      label="Company Name"
                      value={formData.companyName}
                      placeholder="Add your company name"
                    />
                    <ProfileDisplayField
                      icon={Globe}
                      label="Website"
                      value={formData.website}
                      placeholder="Add your website"
                    />
                    <ReadonlyActionField
                      icon={ExternalLink}
                      label="Workspace"
                      value={workspaceSummaryText}
                      actionLabel={projects.length ? "Launch" : "Start"}
                      onClick={() => navigate(projects.length ? workspaceLink : "/service")}
                    />
                  </div>
                </ProfileSurface>
              </div>
            </section>

            <ProfileSurface className="p-4 sm:p-5 lg:p-8">
              <SectionHeader
                icon={Bell}
                title="Notification Preferences"
                description="Configure how you receive project updates."
              />

              <div className="mt-4 space-y-5 sm:mt-6 sm:space-y-7">
                <div className="space-y-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                    Project Notifications
                  </p>
                  <NotificationToggleRow
                    icon={Bell}
                    title="Project updates"
                    description="Real-time alerts for project phase changes"
                    checked={notificationPrefs.projectUpdates}
                    onCheckedChange={(checked) =>
                      handleNotificationToggle("projectUpdates", checked)
                    }
                  />
                  <NotificationToggleRow
                    icon={FileText}
                    title="Milestone reminders"
                    description="Get notified before approvals and due reviews"
                    checked={notificationPrefs.milestoneReviews}
                    onCheckedChange={(checked) =>
                      handleNotificationToggle("milestoneReviews", checked)
                    }
                  />
                </div>

                <div className="space-y-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                    Communication
                  </p>
                  <NotificationToggleRow
                    icon={Mail}
                    title="Messages"
                    description="New message alerts from your project lead"
                    checked={notificationPrefs.messages}
                    onCheckedChange={(checked) =>
                      handleNotificationToggle("messages", checked)
                    }
                  />
                </div>

                <div className="space-y-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                    Alerts
                  </p>
                  <NotificationToggleRow
                    icon={Phone}
                    title="SMS alerts"
                    description="Important emergency updates via text"
                    checked={notificationPrefs.smsAlerts}
                    onCheckedChange={(checked) =>
                      handleNotificationToggle("smsAlerts", checked)
                    }
                  />
                </div>
              </div>
            </ProfileSurface>
          </div>
        </main>

        <ClientDashboardFooter variant="workspace" />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      <Dialog
        open={Boolean(activeEditor)}
        onOpenChange={(open) => {
          if (!open) {
            closeSectionEditor();
          }
        }}
      >
        <DialogContent className="max-h-[90dvh] w-[calc(100vw-24px)] max-w-3xl gap-0 overflow-hidden rounded-[24px] border-border bg-card p-0 text-muted-foreground sm:w-full sm:rounded-[32px]">
          <div className="border-b border-border px-5 py-4 sm:px-8 sm:py-5">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold tracking-[-0.02em] text-foreground sm:text-xl sm:tracking-[-0.03em]">
                {activeEditor ? activeEditorMeta[activeEditor]?.title : ""}
              </DialogTitle>
              <DialogDescription className="text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6">
                {activeEditor ? activeEditorMeta[activeEditor]?.description : ""}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="max-h-[60dvh] overflow-y-auto px-5 py-5 sm:max-h-[70vh] sm:px-8 sm:py-6">
            {renderEditorContent()}
          </div>

          <DialogFooter className="border-t border-border px-5 py-4 sm:px-8 sm:py-5">
            <Button
              type="button"
              variant="outline"
              onClick={closeSectionEditor}
              disabled={loading}
              className="h-12 rounded-full border-border bg-muted px-6 text-sm font-semibold text-foreground hover:bg-muted/80"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                void handleSubmit();
              }}
              disabled={loading}
              className="h-12 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-[0_16px_40px_-20px_color-mix(in_srgb,var(--primary)_60%,transparent)] hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : activeEditor ? (
                activeEditorMeta[activeEditor]?.saveLabel
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

const ClientProfile = () => <ClientProfileContent />;

export default ClientProfile;
