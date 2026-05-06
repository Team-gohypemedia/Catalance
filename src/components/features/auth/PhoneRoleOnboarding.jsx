import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import * as Flags from "country-flag-icons/react/3x2";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ProfilePhotoCameraDialog from "@/components/common/ProfilePhotoCameraDialog";
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
import Mail from "lucide-react/dist/esm/icons/mail";
import Phone from "lucide-react/dist/esm/icons/phone";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { ChevronLeft } from "lucide-react";

const CLIENT_ROLE = "CLIENT";
const FREELANCER_ROLE = "FREELANCER";
const PHONE_ONLY_DEFAULT_FULL_NAME = "WhatsApp User";

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
    return <div className={className + " rounded-sm border border-white/10 bg-white/5"} />;
  }

  const FlagComponent = Flags[normalizedCode];

  if (!FlagComponent) {
    return <div className={className + " rounded-sm border border-white/10 bg-white/5"} />;
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

const getTargetPath = (role, user) => {
  if (role === FREELANCER_ROLE) {
    return getDashboardEntryPath(user, FREELANCER_DASHBOARD) || "/freelancer";
  }

  return getDashboardEntryPath(user, CLIENT_DASHBOARD) || "/client";
};

function PhoneRoleOnboarding() {
  const navigate = useNavigate();
  const { login: setAuthSession, token, user, authFetch } = useAuth();
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
  const [phoneNumber, setPhoneNumber] = useState(() =>
    initialPhoneValue.replace(
      new RegExp(`^${normalizePhoneNumber(COUNTRY_OPTION_BY_CODE[getInitialCountryCode(initialPhoneValue)]?.dialCode || "")}`),
      "",
    ),
  );
  const [profileImage, setProfileImage] = useState("");
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const deviceInputRef = useRef(null);
  const [isPhotoMenuOpen, setIsPhotoMenuOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

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

      if (!isValidEmail(emailValue)) {
        return "Enter a valid email address or leave it empty.";
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

  const handleProfileImageFile = (file, resetInput = () => {}) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setFormErrors({ details: "Please choose an image file for your profile photo." });
      resetInput();
      return;
    }

    // Compress image before reading
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    if (!ctx) {
      setFormErrors({ details: "Unable to process this image. Please try another file." });
      resetInput();
      return;
    }

    img.onload = () => {
      // Limit dimensions to 400x400
      let width = img.width;
      let height = img.height;
      const maxDim = 400;

      if (width > height) {
        if (width > maxDim) {
          height = (height * maxDim) / width;
          width = maxDim;
        }
      } else if (height > maxDim) {
        width = (width * maxDim) / height;
        height = maxDim;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to JPEG with compression
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setFormErrors({ details: "Unable to process this image. Please try another file." });
            resetInput();
            return;
          }

          const fileStem =
            String(file.name || "avatar")
              .replace(/\.[^.]+$/, "")
              .trim() || "avatar";
          const compressedFile = new File([blob], `${fileStem}-avatar.jpg`, {
            type: "image/jpeg",
          });
          const reader = new FileReader();
          reader.onload = () => {
            setProfileImage(String(reader.result || ""));
            setProfileImageFile(compressedFile);
            setFormErrors({});
            resetInput();
          };
          reader.readAsDataURL(compressedFile);
        },
        "image/jpeg",
        0.8
      );
    };

    const reader = new FileReader();
    reader.onload = () => {
      img.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  };

  const handleProfileImageChange = (event) => {
    const input = event.currentTarget;
    handleProfileImageFile(input.files?.[0], () => {
      input.value = "";
    });
  };

  const uploadProfileImage = async () => {
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
      const profileUpdates = {
        onboardingRole: roleOverride,
        fullName: fullName.trim(),
        phoneNumber: `${selectedCountry?.dialCode || ""}${phoneDigits}`,
        ...(emailValue ? { email: emailValue } : {}),
        ...(uploadedAvatarUrl ? { avatar: uploadedAvatarUrl } : {}),
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
        <div className="space-y-3">
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="relative w-fit">
              <Popover open={isPhotoMenuOpen} onOpenChange={setIsPhotoMenuOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    disabled={isSaving}
                    aria-label={profileImage ? "Change profile photo" : "Add profile photo"}
                    className="group relative flex h-32 w-32 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-white/20 bg-[#1a1a1a] text-primary transition hover:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/55 focus:ring-offset-2 focus:ring-offset-[#0b0b0c] disabled:cursor-not-allowed disabled:opacity-60 sm:h-36 sm:w-36"
                  >
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="Profile preview"
                        className="size-full object-cover"
                      />
                    ) : (
                      <Camera className="size-9 transition group-hover:scale-[1.04]" />
                    )}
                  </button>
                </PopoverTrigger>

                <PopoverContent
                  align="center"
                  sideOffset={10}
                  className="w-56 rounded-[18px] border border-white/10 bg-[#161616] p-1 text-white shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsPhotoMenuOpen(false);
                      setIsCameraOpen(true);
                    }}
                    disabled={isSaving}
                    className="flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-sm text-white transition-colors hover:bg-white/8 focus:bg-white/8 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
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
                    className="flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-sm text-white transition-colors hover:bg-white/8 focus:bg-white/8 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
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
              <ProfilePhotoCameraDialog
                open={isCameraOpen}
                onOpenChange={setIsCameraOpen}
                onCapture={handleProfileImageFile}
              />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-white">Add a profile photo</p>
              <p className="mt-1 text-sm text-white/55">JPG, PNG or GIF. Max 5MB.</p>
            </div>
          </div>

          <div className="grid gap-4">
            <label className="block space-y-1 text-left">
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
                  className="!h-10 rounded-md border-white/10 bg-[#171717] px-3 pr-11 text-[13px] text-white/90 placeholder:text-white/35 focus-visible:border-primary/60 focus-visible:ring-primary/20"
                />
                <User className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/35" />
              </div>
            </label>

            <label className="block space-y-1 text-left">
              <span className={fieldLabelClassName}>
                Email address (optional)
              </span>
              <div className="relative">
                <Input
                  type="email"
                  autoComplete="email"
                  value={email}
                  disabled={isSaving}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setFormErrors({});
                  }}
                  placeholder="Enter your email address"
                  className="!h-10 rounded-md border-white/10 bg-[#171717] px-3 pr-11 text-[13px] text-white/90 placeholder:text-white/35 focus-visible:border-primary/60 focus-visible:ring-primary/20"
                />
                <Mail className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/35" />
              </div>
            </label>

            <label className="block space-y-1 text-left">
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
                    className="!h-10 w-full cursor-pointer rounded-md border-white/10 bg-[#171717] px-2.5 text-white"
                  >
                    <div className="pointer-events-none flex items-center justify-center select-none">
                      <FlagIcon code={selectedCountry.code} className="h-5 w-5" />
                    </div>
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    sideOffset={8}
                    className="z-[60] min-w-[18rem] border-white/10 bg-[#121212] text-white shadow-2xl sm:min-w-[26rem]"
                  >
                    {COUNTRY_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.code}
                        value={option.code}
                        className="group cursor-pointer text-white data-[highlighted]:bg-white/5 data-[highlighted]:text-white pr-8 group-data-[state=checked]:pr-14"
                      >
                        <span className="flex w-full items-center gap-0">
                          <FlagIcon code={option.code} className="h-5 w-5" />
                          <span className="min-w-0 flex-1 truncate text-[13px] ml-3">{option.label}</span>
                          <span className="text-white/45 text-[13px] absolute right-3 group-data-[state=checked]:right-8">
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
                      const digits = event.target.value.replace(/\D/g, "");
                      setPhoneNumber(digits.slice(0, 15));
                      setFormErrors({});
                    }}
                    placeholder="9999999999"
                    className="!h-10 w-full rounded-md border-white/10 bg-[#171717] px-3 pr-11 text-[13px] text-white/90 placeholder:text-white/35 focus-visible:border-primary/60 focus-visible:ring-primary/20"
                  />
                  <Phone className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/35" />
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

  return (
    <main className="relative min-h-svh bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      {activeSlide > 0 ? (
        <Button
          type="button"
          disabled={isSaving}
          onClick={handleBack}
          className="absolute left-4 top-6 z-10 !h-10 rounded-md border bg-background px-3 text-sm text-white hover:bg-accent/10 hover:text-white sm:left-6 lg:left-8"
        >
          <ChevronLeft className="size-4" />
          Back
        </Button>
      ) : null}
      <div
        className={cn(
          "mx-auto flex min-h-[calc(100svh-3rem)] w-full items-center justify-center",
          activeSlide === 0 ? "max-w-2xl px-2 sm:px-4" : "max-w-6xl",
        )}
      >
        <div className="w-full space-y-5 relative">
          {activeSlide === 0 && (
            <div className="space-y-2 text-center">
              <div className="space-y-1">
                <h1 className="text-xl font-medium text-primary md:text-4xl lg:text-5xl mb-1 md:mb-2 lg:mb-2">Tell us about you</h1>
                <p className="text-muted-foreground font-regular text-sm md:text-lg lg:text-base">Set up your profile so we can personalize your experience.</p>
              </div>
            </div>
          )}
          {activeSlide === 0 ? (
            <Card className="w-full rounded-lg border border-white/10 bg-[#101010]/90 p-5 shadow-[0_30px_120px_-60px_rgba(0,0,0,0.95)] sm:p-6 lg:p-7">

              {renderSlideContent()}

              {formErrors.submit && (
                <p className="mt-3 text-xs text-red-400">{formErrors.submit}</p>
              )}

              {activeSlide === 0 && (
                <div className="mt-6 flex gap-3">
                  {activeSlide > 0 ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSaving}
                      onClick={handleBack}
                      className="!h-10 rounded-md border-white/12 bg-white/[0.03] px-3 text-sm text-white hover:bg-white/[0.06] hover:text-white"
                    >
                      <ArrowLeft className="size-4" />
                      Back
                    </Button>
                  ) : null}

                  <Button
                    type="button"
                    disabled={isSaving}
                    onClick={handleNext}
                    className="!h-10 flex-1 rounded-md bg-primary text-sm font-medium text-black hover:bg-primary/95"
                  >
                    {isSaving ? "Saving..." : isLastSlide ? "Finish setup" : "Continue"}
                    {isSaving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ArrowRight className="size-4" />
                    )}
                  </Button>
                </div>
              )}

              {activeSlide === 0 && (
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-white/45">
                  <Lock className="size-3.5 text-primary/80" />
                  <span>Your information is secure and will never be shared.</span>
                </div>
              )}
            </Card>
          ) : (
            <div className="w-full pt-4">
              {renderSlideContent()}

              {formErrors.submit && (
                <p className="mt-3 text-xs text-red-400">{formErrors.submit}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default PhoneRoleOnboarding;
