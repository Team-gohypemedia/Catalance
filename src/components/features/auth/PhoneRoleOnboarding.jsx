import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import * as Flags from "country-flag-icons/react/3x2";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ProfilePhotoCameraDialog from "@/components/common/ProfilePhotoCameraDialog";
import ProfileImageCropDialog from "@/components/common/ProfileImageCropDialog";
import { useAuth } from "@/shared/context/AuthContext";
import { updateProfile } from "@/shared/lib/api-client";
import { COUNTRY_CODES } from "@/shared/data/countryCodes";
import {
  CLIENT_DASHBOARD,
  FREELANCER_DASHBOARD,
  getDashboardEntryPath,
  isPhoneOnlyAccountEmail,
  setStoredDashboardPreference,
} from "@/shared/lib/dashboard-preference";
import { cn } from "@/shared/lib/utils";
import { ONBOARDING_FIELD_LABEL_CLASS } from "@/components/freelancer/Freelancer-Onboarding/typography";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import BriefcaseBusiness from "lucide-react/dist/esm/icons/briefcase-business";
import Camera from "lucide-react/dist/esm/icons/camera";
import Laptop from "lucide-react/dist/esm/icons/laptop";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Lock from "lucide-react/dist/esm/icons/lock";
import User from "lucide-react/dist/esm/icons/user";
import Upload from "lucide-react/dist/esm/icons/upload";
import X from "lucide-react/dist/esm/icons/x";
import Mail from "lucide-react/dist/esm/icons/mail";
import Phone from "lucide-react/dist/esm/icons/phone";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { ChevronLeft } from "lucide-react";
import catalanceLogo from "@/assets/logos/logo.svg";

const CLIENT_ROLE = "CLIENT";
const FREELANCER_ROLE = "FREELANCER";
const PHONE_ONLY_DEFAULT_FULL_NAME = "WhatsApp User";
const AVATAR_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
const PROFILE_PHOTO_PICK_MAX_BYTES = 20 * 1024 * 1024;

const ROLE_OPTIONS = [
  {
    id: CLIENT_ROLE,
    title: "I'm a client, hiring for a project",
    description: "",
    icon: BriefcaseBusiness,
  },
  {
    id: FREELANCER_ROLE,
    title: "I'm a freelancer, looking for work",
    description: "",
    icon: Laptop,
  },
];

const SLIDES = [
  { id: "details", eyebrow: "Step 1 of 2", title: "Tell us about you" },
  { id: "role", eyebrow: "Step 2 of 2", title: "How do you want to use Catalance?" },
];

const normalizePhoneNumber = (value) => String(value || "").replace(/\D/g, "");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const isValidEmail = (value) =>
  !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const DEFAULT_COUNTRY_CODE = "IN";
const fieldLabelClassName = `${ONBOARDING_FIELD_LABEL_CLASS} mb-1 block`;

const FlagIcon = ({ code, className = "h-5 w-5" }) => {
  const normalizedCode = String(code || "").trim().toUpperCase();

  if (!/^[A-Z]{2}$/.test(normalizedCode)) {
    return <div className={className + " rounded-sm border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5"} />;
  }

  const FlagComponent = Flags[normalizedCode];

  if (!FlagComponent) {
    return <div className={className + " rounded-sm border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5"} />;
  }

  return (
    <FlagComponent
      className={className + " rounded-sm object-cover"}
    />
  );
};

const COUNTRY_OPTIONS = Array.from(
  COUNTRY_CODES.reduce((accumulator, country) => {
    const code = String(country?.code || "").trim().toUpperCase();
    const label = String(country?.name || "").trim();
    const dialCode = String(country?.dial_code || "").trim();

    if (!code || !label || !dialCode || accumulator.has(code)) {
      return accumulator;
    }

    accumulator.set(code, { code, label, dialCode });
    return accumulator;
  }, new Map()).values(),
).sort((first, second) => first.code.localeCompare(second.code));

const COUNTRY_OPTION_BY_CODE = COUNTRY_OPTIONS.reduce((accumulator, option) => {
  accumulator[option.code] = option;
  return accumulator;
}, {});

const getInitialCountryCode = (phoneValue) => {
  const digits = normalizePhoneNumber(phoneValue);

  if (!digits) {
    return DEFAULT_COUNTRY_CODE;
  }

  const matchingCountry = COUNTRY_OPTIONS
    .filter((option) => digits.startsWith(option.dialCode.replace(/\D/g, "")))
    .sort((first, second) => second.dialCode.length - first.dialCode.length)[0];

  return matchingCountry?.code || DEFAULT_COUNTRY_CODE;
};

const getInitialName = (user) => {
  const fullName = String(user?.fullName || "").trim();
  return fullName && fullName !== PHONE_ONLY_DEFAULT_FULL_NAME ? fullName : "";
};

const getInitialEmail = (user) => {
  const email = normalizeEmail(user?.email);
  return isPhoneOnlyAccountEmail(email) ? "" : email;
};

const getInitialProfileImage = (user) =>
  String(
    user?.profileDetails?.identity?.profilePhoto ||
      user?.identity?.profilePhoto ||
      user?.avatar ||
      user?.profilePhoto ||
      "",
  ).trim();

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to preview cropped image."));
    reader.readAsDataURL(file);
  });

const getTargetPath = (role, user) => {
  if (role === FREELANCER_ROLE) {
    return getDashboardEntryPath(user, FREELANCER_DASHBOARD) || "/freelancer";
  }

  return getDashboardEntryPath(user, CLIENT_DASHBOARD) || "/client";
};

function PhoneRoleOnboarding() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login: setAuthSession, token, user, authFetch } = useAuth();
  const onboardingState = location?.state || {};
  const isFromEmailAuth = Boolean(
    onboardingState?.fromEmailVerification || onboardingState?.fromGoogleSignin,
  );
  const isPhoneOnlyEmail = isPhoneOnlyAccountEmail(user?.email);
  const hasNonPhoneEmail = Boolean(user?.email) && !isPhoneOnlyEmail;
  const isEmailRequired = hasNonPhoneEmail || isFromEmailAuth;
  const isEmailLocked = hasNonPhoneEmail;
  const initialRole = useMemo(() => {
    const role = String(user?.role || "").toUpperCase();
    return role === FREELANCER_ROLE ? FREELANCER_ROLE : null;
  }, [user?.role]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [fullName, setFullName] = useState(() => getInitialName(user));
  const [email, setEmail] = useState(() => getInitialEmail(user));
  const initialPhoneValue = normalizePhoneNumber(user?.phoneNumber || user?.phone);
  const [countryCode, setCountryCode] = useState(() =>
    getInitialCountryCode(initialPhoneValue),
  );
  const [phoneNumber, setPhoneNumber] = useState(() => {
    let rawNum = initialPhoneValue.replace(
      new RegExp(`^${normalizePhoneNumber(COUNTRY_OPTION_BY_CODE[getInitialCountryCode(initialPhoneValue)]?.dialCode || "")}`),
      "",
    );
    if (rawNum.startsWith("0") && rawNum.length === 11) {
      rawNum = rawNum.slice(1);
    }
    return rawNum;
  });
  const [profileImage, setProfileImage] = useState(() => getInitialProfileImage(user));
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImageRemoved, setProfileImageRemoved] = useState(false);
  const [pendingProfileImageFile, setPendingProfileImageFile] = useState(null);
  const [isProfileCropOpen, setIsProfileCropOpen] = useState(false);
  const [profileImageCropSession, setProfileImageCropSession] = useState(0);
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const deviceInputRef = useRef(null);
  const [isPhotoMenuOpen, setIsPhotoMenuOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  useEffect(() => {
    document.documentElement.classList.add("onboarding-page");
    return () => document.documentElement.classList.remove("onboarding-page");
  }, []);

  const hasProfilePhoto = Boolean(profileImage);

  const slide = SLIDES[activeSlide];
  const emailValue = normalizeEmail(email);
  const phoneDigits = normalizePhoneNumber(phoneNumber);
  const selectedCountry = COUNTRY_OPTION_BY_CODE[countryCode] || COUNTRY_OPTION_BY_CODE[DEFAULT_COUNTRY_CODE];
  const isLastSlide = activeSlide === SLIDES.length - 1;

  const validateCurrentSlide = (roleCandidate = selectedRole) => {
    if (slide.id === "details") {
      if (!fullName.trim()) {
        return "Enter your full name to continue.";
      }

      if (isEmailRequired && !emailValue) {
        return "Enter your email address to continue.";
      }

      if (!isValidEmail(emailValue)) {
        return isEmailRequired
          ? "Enter a valid email address to continue."
          : "Enter a valid email address or leave it empty.";
      }

      if (phoneDigits.length < 6) {
        return "Enter a valid phone number to continue.";
      }
    }

    if (slide.id === "role" && !roleCandidate) {
      return "Choose Client or Freelancer to continue.";
    }

    return "";
  };

  const handleProfileImageSelect = (file, resetInput = () => {}) => {
    if (!file) {
      return;
    }

    if (!String(file.type || "").startsWith("image/")) {
      setFormErrors({ details: "Please choose an image file for your profile photo." });
      resetInput();
      return;
    }

    if (file.size > PROFILE_PHOTO_PICK_MAX_BYTES) {
      setFormErrors({
        details: "Selected image is too large. Please choose a photo under 20MB before cropping.",
      });
      resetInput();
      return;
    }

    setProfileImageCropSession((currentSession) => currentSession + 1);
    setPendingProfileImageFile(file);
    setIsProfileCropOpen(true);
    setFormErrors({});
    resetInput();
  };

  const handleProfileImageRemove = () => {
    setProfileImage("");
    setProfileImageFile(null);
    setProfileImageRemoved(true);
    setPendingProfileImageFile(null);
    setIsProfileCropOpen(false);
    setFormErrors({});
    if (deviceInputRef.current) {
      deviceInputRef.current.value = "";
    }
  };

  const handleProfileImageChange = (event) => {
    const input = event.currentTarget;
    handleProfileImageSelect(input.files?.[0], () => {
      input.value = "";
    });
  };

  const handleProfileImageCropCancel = () => {
    setPendingProfileImageFile(null);
    setIsProfileCropOpen(false);
  };

  const handleProfileImageCropped = async (croppedFile) => {
    if (!(typeof File !== "undefined" && croppedFile instanceof File)) {
      throw new Error("Unable to process profile image.");
    }

    const previewUrl = await readFileAsDataUrl(croppedFile);

    setProfileImage(previewUrl);
    setProfileImageFile(croppedFile);
    setProfileImageRemoved(false);
    setPendingProfileImageFile(null);
    setIsProfileCropOpen(false);
    setFormErrors({});
    return true;
  };

  const uploadProfileImage = async () => {
    if (profileImageRemoved) {
      return null;
    }

    if (!profileImageFile) {
      return "";
    }

    const uploadData = new FormData();
    uploadData.append("file", profileImageFile, profileImageFile.name || "avatar.jpg");

    const response = await authFetch("/upload", {
      method: "POST",
      body: uploadData,
      suppressToast: true,
    });

    if (!response.ok) {
      const payload = await response
        .json()
        .catch(() => ({ message: "Failed to upload profile image." }));
      throw new Error(
        payload?.error?.message || payload?.message || "Failed to upload profile image.",
      );
    }

    const payload = await response.json().catch(() => ({}));
    const uploadedUrl = String(payload?.data?.url || payload?.url || "").trim();

    if (!uploadedUrl) {
      throw new Error("Image upload completed without a usable URL.");
    }

    return uploadedUrl;
  };

  const handleNext = async (roleOverride = selectedRole) => {
    const errorMessage = validateCurrentSlide(roleOverride);
    if (errorMessage) {
      setFormErrors({ [slide.id]: errorMessage });
      return;
    }

    setFormErrors({});

    if (!isLastSlide) {
      const progressToastId = toast.loading("Preparing the next step...");

      try {
        await delay(350);
        toast.dismiss(progressToastId);
        setActiveSlide((current) => current + 1);
      } catch {
        toast.dismiss(progressToastId);
        setActiveSlide((current) => current + 1);
      }
      return;
    }

    setIsSaving(true);
    const progressToastId = toast.loading(
      roleOverride === FREELANCER_ROLE
        ? "Setting up your freelancer workspace..."
        : "Setting up your client workspace...",
    );

    try {
      const uploadedAvatarUrl = await uploadProfileImage();
      let finalPhoneDigits = phoneDigits;
      if (finalPhoneDigits.startsWith("0") && finalPhoneDigits.length === 11) {
        finalPhoneDigits = finalPhoneDigits.slice(1);
      }
      const profileUpdates = {
        onboardingRole: roleOverride,
        fullName: fullName.trim(),
        phoneNumber: `${selectedCountry?.dialCode || ""}${finalPhoneDigits}`,
        ...(emailValue ? { email: emailValue } : {}),
        ...(profileImageRemoved
          ? { avatar: null }
          : uploadedAvatarUrl
            ? { avatar: uploadedAvatarUrl }
            : {}),
        ...(roleOverride === FREELANCER_ROLE
          ? {
              onboardingComplete: false,
              profileDetailsPatch: { role: "freelancer" },
            }
          : {}),
      };
      const updatedUser = await updateProfile(profileUpdates);
      const sessionUser = updatedUser || user;
      const dashboard =
        roleOverride === FREELANCER_ROLE
          ? FREELANCER_DASHBOARD
          : CLIENT_DASHBOARD;

      if (sessionUser && token) {
        setAuthSession(sessionUser, token);
        setStoredDashboardPreference(sessionUser, dashboard);
      }

      toast.success(
        roleOverride === FREELANCER_ROLE
          ? "Redirecting to your freelancer dashboard..."
          : "Redirecting to your client dashboard...",
        { id: progressToastId },
      );
      navigate(getTargetPath(roleOverride, sessionUser), { replace: true });
    } catch (error) {
      const message =
        error?.message || "Unable to save your onboarding details. Please try again.";
      setFormErrors({ submit: message });
      toast.error(message, { id: progressToastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    setFormErrors({});
    setActiveSlide((current) => Math.max(current - 1, 0));
  };

  const renderSlideContent = () => {
    if (slide.id === "details") {
      return (
        <div className="space-y-2.5">
          <div className="flex h-full flex-col items-center text-center">
            <div className="flex flex-col items-center gap-2 md:pt-1 lg:gap-2 lg:pt-0">
              <div className="relative w-fit">
                <Popover open={isPhotoMenuOpen} onOpenChange={setIsPhotoMenuOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      disabled={isSaving}
                      aria-label={hasProfilePhoto ? "Change profile photo" : "Add profile photo"}
                      className="group relative flex size-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-black/10 dark:border-white/20 bg-black/5 dark:bg-[#1a1a1a] text-primary transition hover:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/55 focus:ring-offset-2 focus:ring-offset-background sm:size-28"
                    >
                      {hasProfilePhoto ? (
                        <img
                          src={profileImage}
                          alt="Profile preview"
                          className="size-full object-cover"
                        />
                      ) : (
                        <Camera className="size-7 transition group-hover:scale-[1.04]" />
                      )}
                    </button>
                  </PopoverTrigger>

                  <PopoverContent
                    align="center"
                    sideOffset={10}
                    className="w-56 rounded-[18px] border border-black/10 dark:border-white/10 bg-white dark:bg-[#161616] p-1 text-black dark:text-white shadow-2xl backdrop-blur-xl"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setIsPhotoMenuOpen(false);
                        setIsCameraOpen(true);
                      }}
                      disabled={isSaving}
                      className="flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-sm text-black dark:text-white transition-colors hover:bg-black/5 dark:hover:bg-white/8 focus:bg-black/5 dark:focus:bg-white/8 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Camera className="size-4 text-primary" />
                      <span>Take a picture</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPhotoMenuOpen(false);
                        deviceInputRef.current?.click();
                      }}
                      disabled={isSaving}
                      className="flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-sm text-black dark:text-white transition-colors hover:bg-black/5 dark:hover:bg-white/8 focus:bg-black/5 dark:focus:bg-white/8 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Upload className="size-4 text-primary" />
                      <span>Choose from device</span>
                    </button>
                  </PopoverContent>
                </Popover>

                <input
                  ref={deviceInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfileImageChange}
                  disabled={isSaving}
                />

                {hasProfilePhoto ? (
                  <button
                    type="button"
                    onClick={handleProfileImageRemove}
                    aria-label="Remove profile photo"
                    className="absolute right-0 top-0 flex size-7 items-center justify-center rounded-full border border-black/10 dark:border-white/10 bg-white dark:bg-[#101010] text-black/75 dark:text-white/75 shadow-md transition-colors hover:border-black/20 dark:hover:border-white/20 hover:text-black dark:hover:text-white"
                  >
                    <X className="size-3" />
                  </button>
                ) : null}

                <ProfilePhotoCameraDialog
                  open={isCameraOpen}
                  onOpenChange={setIsCameraOpen}
                  onCapture={handleProfileImageSelect}
                />
              </div>

              <div className="space-y-0.5">
                <p className={cn(fieldLabelClassName, "text-black dark:text-white mb-0")}>
                  Profile Photo
                </p>
                <p className="text-xs text-black/55 dark:text-white/55">
                  JPG, PNG or GIF. Max 5MB.
                </p>
              </div>
            </div>
          </div>

          <ProfileImageCropDialog
            key={profileImageCropSession}
            open={isProfileCropOpen}
            file={pendingProfileImageFile}
            maxUploadBytes={AVATAR_UPLOAD_MAX_BYTES}
            onApply={handleProfileImageCropped}
            onCancel={handleProfileImageCropCancel}
          />

          <div className="grid gap-3">
            <label className="block space-y-0.5 text-left">
              <span className={fieldLabelClassName}>
                Full name
              </span>
              <div className="relative">
                <Input
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  disabled={isSaving}
                  onChange={(event) => {
                    setFullName(event.target.value);
                    setFormErrors({});
                  }}
                  placeholder="Enter your full name"
                  className="!h-10 rounded-md border-black/15 dark:border-[#ffffff]/10 bg-black/[0.03] dark:bg-[#171717] px-3 pr-11 text-[13px] text-black dark:text-[#ffffff]/90 placeholder:text-[#1c1b1f]/45 dark:placeholder:text-[#ffffff]/35 focus-visible:border-primary/60 focus-visible:ring-primary/20"
                />
                <User className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-black/35 dark:text-white/35" />
              </div>
            </label>

            <label className="block space-y-0.5 text-left">
              <span className={fieldLabelClassName}>
                {isEmailRequired ? "Email address" : "Email address (optional)"}
              </span>
              <div className="relative">
                <Input
                  type="email"
                  autoComplete="email"
                  value={email}
                  disabled={isSaving || isEmailLocked}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setFormErrors({});
                  }}
                  placeholder="Enter your email address"
                  className="!h-10 rounded-md border-black/15 dark:border-[#ffffff]/10 bg-black/[0.03] dark:bg-[#171717] px-3 pr-11 text-[13px] text-black dark:text-[#ffffff]/90 placeholder:text-[#1c1b1f]/45 dark:placeholder:text-[#ffffff]/35 focus-visible:border-primary/60 focus-visible:ring-primary/20"
                />
                <Mail className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-black/35 dark:text-white/35" />
              </div>
            </label>

            <label className="block space-y-0.5 text-left">
              <span className={fieldLabelClassName}>
                Phone number
              </span>
              <div className="grid grid-cols-[3rem_minmax(0,1fr)] gap-2 sm:grid-cols-[3.5rem_minmax(0,1fr)]">
                <Select
                  value={countryCode}
                  onValueChange={(value) => {
                    setCountryCode(value);
                    setFormErrors({});
                  }}
                  disabled={isSaving}
                >
                  <SelectTrigger
                    type="button"
                    aria-label="Select country code"
                    className="!h-10 w-full cursor-pointer rounded-md border-black/15 dark:border-white/10 bg-black/[0.03] dark:bg-[#171717] px-2.5 text-black dark:text-white"
                  >
                    <div className="pointer-events-none flex items-center justify-center select-none">
                      <FlagIcon code={selectedCountry.code} className="h-5 w-5" />
                    </div>
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    sideOffset={8}
                    className="z-[60] min-w-[18rem] border-black/10 dark:border-white/10 bg-white dark:bg-[#121212] text-black dark:text-white shadow-2xl sm:min-w-[26rem]"
                  >
                    {COUNTRY_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.code}
                        value={option.code}
                        className="group cursor-pointer text-black dark:text-white data-[highlighted]:bg-black/5 dark:data-[highlighted]:bg-white/5 data-[highlighted]:text-black dark:data-[highlighted]:text-white pr-8 group-data-[state=checked]:pr-14"
                      >
                        <span className="flex w-full items-center gap-0">
                           <FlagIcon code={option.code} className="h-5 w-5" />
                          <span className="min-w-0 flex-1 truncate text-[13px] ml-3">{option.label}</span>
                          <span className="text-black/45 dark:text-white/45 text-[13px] absolute right-3 group-data-[state=checked]:right-8">
                            +{option.dialCode.replace(/\D/g, "")}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative">
                  <Input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    value={phoneNumber}
                    disabled={isSaving}
                    onChange={(event) => {
                      let digits = event.target.value.replace(/\D/g, "");
                      if (digits.startsWith("0") && digits.length === 11) {
                        digits = digits.slice(1);
                      }
                      setPhoneNumber(digits.slice(0, 15));
                      setFormErrors({});
                    }}
                    placeholder="9999999999"
                    className="!h-10 w-full rounded-md border-black/15 dark:border-[#ffffff]/10 bg-black/[0.03] dark:bg-[#171717] px-3 pr-11 text-[13px] text-black dark:text-[#ffffff]/90 placeholder:text-[#1c1b1f]/45 dark:placeholder:text-[#ffffff]/35 focus-visible:border-primary/60 focus-visible:ring-primary/20"
                  />
                  <Phone className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-black/35 dark:text-white/35" />
                </div>
              </div>
            </label>
          </div>

          {formErrors.details && (
            <p className="text-xs text-red-400">{formErrors.details}</p>
          )}
        </div>
      );
    }

    if (slide.id === "role") {
      return (
        <div className="mx-auto flex min-h-[calc(100svh-12rem)] w-full max-w-6xl flex-col items-center justify-center gap-10 px-4 sm:px-6">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-xl font-medium text-primary md:text-4xl lg:text-5xl mb-1 md:mb-2 lg:mb-2">
              Join as a client or freelancer
            </h2>
          </div>
          <div className="mx-auto grid w-full max-w-[980px] gap-4 md:grid-cols-2">
            {ROLE_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedRole === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={isSelected}
                  disabled={isSaving}
                  onClick={() => {
                    setSelectedRole(option.id);
                    setFormErrors({});
                    void handleNext(option.id);
                  }}
                  className={cn(
                    "group flex h-full w-full flex-col rounded-[14px] border border-border bg-card p-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:cursor-not-allowed disabled:opacity-70 min-h-[184px] sm:p-6",
                    isSelected
                      ? "border-primary/70 shadow-[0_16px_40px_-28px_rgba(250,204,21,0.45)]"
                      : "hover:border-foreground/20",
                  )}
                >
                  <span className="flex items-start justify-between gap-4">
                    <span className="relative block h-10 w-10 text-card-foreground">
                      <User className="absolute left-0 top-0 h-4.5 w-4.5" />
                      <Icon className="absolute bottom-0 left-2 h-6 w-6" />
                    </span>
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition",
                        isSelected ? "border-primary" : "border-muted-foreground/50",
                      )}
                    >
                      <span
                        className={cn(
                          "h-2.5 w-2.5 rounded-full transition",
                          isSelected ? "bg-primary" : "bg-transparent",
                        )}
                      />
                    </span>
                  </span>

                  <span className="mt-9 block">
                    <span
                      className={cn(
                        "block max-w-[15ch] text-xl font-medium lg:text-2xl",
                        isSelected ? "text-primary" : "text-card-foreground",
                      )}
                    >
                      {option.title}
                    </span>
                    {option.description ? (
                      <span className="mt-2 block text-sm font-regular text-muted-foreground md:text-base">
                        {option.description}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
          {formErrors.role && (
            <p className="text-xs text-red-400">{formErrors.role}</p>
          )}
        </div>
      );
    }
  };

  const isDark = document.documentElement.classList.contains("dark");

  // ── Slide 0: split-layout (matches GetStarted reference design) ──────
  if (activeSlide === 0) {
    return (
      <div
        className={cn(
          "min-h-screen w-full flex flex-col relative overflow-hidden",
          isDark ? "bg-[#0A0A0A]" : "bg-[#FAF6F0]"
        )}
      >
        {/* dot-grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: isDark
              ? "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)"
              : "radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* blobs */}
        <div aria-hidden className="pointer-events-none absolute -top-40 -left-40 size-[500px] rounded-full opacity-20 blur-[120px]" style={{ background: isDark ? "#F9D94930" : "#D9692A30" }} />
        <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-40 size-[400px] rounded-full opacity-15 blur-[100px]" style={{ background: isDark ? "#F9D94925" : "#D9692A25" }} />

        {/* Logo bar */}
        <header className="relative z-10 flex items-center gap-2.5 px-8 pt-7">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary">
            <img src={catalanceLogo} alt="" className="h-[18px] w-[18px] object-contain invert dark:invert-0" />
          </div>
          <span className={cn("text-[1.05rem] font-bold tracking-[-0.4px]", isDark ? "text-white" : "text-[#1C1B1F]")}>Catalance</span>
        </header>

        {/* Main split */}
        <main className="relative z-10 flex flex-1 items-center justify-center gap-12 px-6 py-6 lg:py-8 lg:px-16 xl:gap-20">

          {/* Left panel */}
          <div className="hidden max-w-sm flex-1 lg:flex lg:flex-col">
            <div className={cn("mb-7 inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-[0.75rem] font-medium", isDark ? "border-white/10 bg-white/[0.05] text-white/60" : "border-black/[0.08] bg-white/70 text-black/50")}>
              <span className="text-primary">✦</span> Step 1 of 2
            </div>
            <h1 className={cn("mb-4 text-[2.6rem] font-bold leading-[1.15] tracking-[-1px]", isDark ? "text-white" : "text-[#1C1B1F]")}>
              Introduce <span className="text-primary">yourself</span> 👋
            </h1>
            <p className={cn("mb-9 text-[0.95rem] leading-relaxed", isDark ? "text-white/50" : "text-black/50")}>
              Let's get to know you better so we can personalize your experience.
            </p>
            <div className="space-y-4">
              {[
                { emoji: "✨", title: "Personalized experience", desc: "Get recommended roles and content that match your goals.", light: "bg-violet-100 text-violet-600", dark: "bg-violet-900/40 text-violet-400" },
                { emoji: "🛡️", title: "Secure & private", desc: "Your information is encrypted and never shared.", light: "bg-emerald-100 text-emerald-600", dark: "bg-emerald-900/40 text-emerald-400" },
                { emoji: "⚡", title: "Quick & easy", desc: "Takes less than 2 minutes to complete.", light: "bg-amber-100 text-amber-600", dark: "bg-amber-900/40 text-amber-400" },
              ].map(({ emoji, title, desc, light, dark }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className={cn("mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl text-lg", isDark ? dark : light)}>
                    {emoji}
                  </div>
                  <div>
                    <p className={cn("text-[0.88rem] font-semibold", isDark ? "text-white" : "text-[#1C1B1F]")}>{title}</p>
                    <p className={cn("text-[0.8rem] leading-snug", isDark ? "text-white/45" : "text-black/45")}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 flex items-center gap-1.5">
              <span className={cn("text-[0.8rem]", isDark ? "text-white/40" : "text-black/40")}>Need help?</span>
              <a href="/contact" className="text-[0.8rem] text-primary hover:underline font-medium">Contact support</a>
            </div>
          </div>

          {/* Right card */}
          <div className={cn("w-full max-w-md rounded-3xl border p-6 sm:p-7 shadow-2xl shadow-black/5 dark:shadow-black/40", isDark ? "border-white/[0.07] bg-white/[0.04] backdrop-blur-xl" : "border-black/[0.06] bg-white")}>
            {/* Mobile heading */}
            <div className="mb-4 lg:hidden">
              <div className={cn("mb-2.5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.75rem] font-medium", isDark ? "border-white/10 bg-white/[0.05] text-white/60" : "border-black/[0.08] bg-black/[0.04] text-black/50")}>
                <span className="text-primary">✦</span> Step 1 of 2
              </div>
              <h1 className={cn("text-2xl font-bold tracking-[-0.5px]", isDark ? "text-white" : "text-[#1C1B1F]")}>
                Introduce <span className="text-primary">yourself</span> 👋
              </h1>
            </div>

            {renderSlideContent()}

            {formErrors.submit && <p className="mt-2 text-xs text-red-400">{formErrors.submit}</p>}

            {/* CTA */}
            <div className="mt-4">
              <button
                type="button"
                disabled={isSaving}
                onClick={handleNext}
                className={cn(
                  "group flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-[0.95rem] font-bold transition-all duration-200 keep-white",
                  "bg-primary text-white shadow-lg shadow-primary/30 hover:brightness-110 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                )}
              >
                {isSaving ? <Loader2 className="size-4 animate-spin text-white keep-white" /> : null}
                {isSaving ? "Saving..." : isEmailRequired ? "Continue" : "Continue with WhatsApp"}
                {!isSaving && <ArrowRight className="size-4.5 transition-transform group-hover:translate-x-1 text-white keep-white" />}
              </button>
            </div>

            {/* Security note */}
            <div className="mt-3.5 flex items-center justify-center gap-2">
              <Lock className={cn("size-3.5", isDark ? "text-white/30" : "text-black/30")} />
              <p className={cn("text-[0.72rem]", isDark ? "text-white/30" : "text-black/35")}>Your information is secure and will never be shared.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Slide 1: role picker ─────────────────────────────────────────────
  return (
    <main className="relative min-h-svh bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <Button
        type="button"
        disabled={isSaving}
        onClick={handleBack}
        className="absolute left-4 top-6 z-10 !h-10 rounded-md border border-black/10 dark:border-white/10 bg-background px-3 text-sm text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 sm:left-6 lg:left-8"
      >
        <ChevronLeft className="size-4" />
        Back
      </Button>
      <div className="mx-auto flex min-h-[calc(100svh-3rem)] w-full max-w-6xl items-center justify-center">
        <div className="w-full pt-4">
          {renderSlideContent()}
          {formErrors.submit && <p className="mt-3 text-xs text-red-400">{formErrors.submit}</p>}
        </div>
      </div>
    </main>
  );
}

export default PhoneRoleOnboarding;
