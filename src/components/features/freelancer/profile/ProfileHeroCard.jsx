import { useEffect, useState } from "react";
import Camera from "lucide-react/dist/esm/icons/camera";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Github from "lucide-react/dist/esm/icons/github";
import Globe from "lucide-react/dist/esm/icons/globe";
import Link2 from "lucide-react/dist/esm/icons/link-2";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Linkedin from "lucide-react/dist/esm/icons/linkedin";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle";
import MoreHorizontal from "lucide-react/dist/esm/icons/more-horizontal";
import Pencil from "lucide-react/dist/esm/icons/pencil";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import Upload from "lucide-react/dist/esm/icons/upload";
import BadgeCheck from "lucide-react/dist/esm/icons/badge-check";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const normalizeProfileLink = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^[a-z]+:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return "";
  return `https://${raw}`;
};

const ProfileHeroCard = ({
  fileInputRef,
  coverInputRef,
  resumeInputRef,
  personal,
  setPersonal,
  initials,
  uploadingImage,
  uploadingCoverImage,
  uploadingResume,
  handleImageUpload,
  handleCoverImageUpload,
  handleResumeUpload,
  removeCoverImage,
  coverImageUrl,
  displayHeadline,
  displayBio,
  displayLocation,
  isVerified = false,
  onboardingIdentity,
  onboardingLanguages,
  openEditPersonalModal,
  openPortfolioModal,
  profileLinks,
  onToggleAvailability,
  availabilitySaving,
}) => {
  const identityTitle = String(
    displayHeadline || onboardingIdentity?.professionalTitle || ""
  ).trim();
  const username = String(onboardingIdentity?.username || "").trim();
  const spokenLanguages = Array.isArray(onboardingLanguages)
    ? onboardingLanguages.slice(0, 3)
    : [];

  const resolvedLinks = {
    linkedin: normalizeProfileLink(profileLinks?.linkedin),
    github: normalizeProfileLink(profileLinks?.github),
    portfolio: normalizeProfileLink(profileLinks?.portfolio),
    resume: normalizeProfileLink(profileLinks?.resume),
  };

  const heroTitle = identityTitle || "Freelancer";
  const resolvedBio = String(displayBio || personal.bio || "").trim();
  const profileName = String(personal.name || "").trim() || "Your Name";
  const profileHandle = username ? `@${username}` : "@add-username";
  const isOpenToWorkActive =
    typeof personal.openToWork === "boolean"
      ? personal.openToWork
      : Boolean(personal.available);
  const openToWorkLabel = isOpenToWorkActive ? "Open to Work" : "Offline";
  const [hasCoverImageError, setHasCoverImageError] = useState(false);
  const [isCoverDragActive, setIsCoverDragActive] = useState(false);

  useEffect(() => {
    setHasCoverImageError(false);
  }, [coverImageUrl]);

  const triggerCoverUpload = () => {
    if (uploadingCoverImage) return;
    coverInputRef.current?.click();
  };

  const handleCoverDrop = (event) => {
    event.preventDefault();
    setIsCoverDragActive(false);
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    handleCoverImageUpload({ target: { files: [file], value: "" } });
  };

  const resolvedCoverImage = !hasCoverImageError ? String(coverImageUrl || "").trim() : "";
  const profileLinkItems = [
    {
      key: "portfolio",
      href: resolvedLinks.portfolio,
      label: "Portfolio",
      Icon: Globe,
    },
    {
      key: "github",
      href: resolvedLinks.github,
      label: "GitHub",
      Icon: Github,
    },
    {
      key: "linkedin",
      href: resolvedLinks.linkedin,
      label: "LinkedIn",
      Icon: Linkedin,
    },
  ].filter((item) => Boolean(item.href));

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card text-foreground shadow-sm">
      <div className="relative h-36 w-full sm:h-44 md:h-64">
        {resolvedCoverImage ? (
          <img
            src={resolvedCoverImage}
            alt={`${personal.name || "Freelancer"} profile cover`}
            className="h-full w-full object-cover"
            onError={() => setHasCoverImageError(true)}
          />
        ) : (
          <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(120,119,198,0.12),transparent_32%),linear-gradient(135deg,rgba(9,9,11,0.98),rgba(24,24,27,0.96))] px-6 py-8 text-center">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:34px_34px] opacity-40" />
            <div className="pointer-events-none absolute left-[8%] top-[18%] h-28 w-28 rounded-full bg-primary/20 blur-3xl" />
            <div className="pointer-events-none absolute bottom-[12%] right-[10%] h-32 w-32 rounded-full bg-sky-400/10 blur-3xl" />

            <div
              role="button"
              tabIndex={0}
              onClick={triggerCoverUpload}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  triggerCoverUpload();
                }
              }}
              onDragOver={(event) => {
                event.preventDefault();
                if (event.dataTransfer) {
                  event.dataTransfer.dropEffect = "copy";
                }
                setIsCoverDragActive(true);
              }}
              onDragLeave={(event) => {
                if (event.currentTarget === event.target) {
                  setIsCoverDragActive(false);
                }
              }}
              onDrop={handleCoverDrop}
              className={`relative flex w-full items-center justify-center px-4 py-8 outline-none transition sm:px-6 sm:py-10 ${
                isCoverDragActive ? "text-primary" : "text-white"
              } ${uploadingCoverImage ? "pointer-events-none opacity-70" : "cursor-pointer hover:text-white/88"}`}
              aria-label="Add cover image"
            >
              <span className="text-[22px] font-semibold tracking-[-0.05em] sm:text-[28px] md:text-[32px]">
                Add Cover Image
              </span>
            </div>
          </div>
        )}

        <div className="absolute right-4 top-4 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/70 bg-accent text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-70 sm:h-9 sm:w-9"
                title="Cover image options"
                aria-label="Cover image options"
                disabled={uploadingCoverImage}
              >
                {uploadingCoverImage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MoreHorizontal className="h-4 w-4" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onSelect={() => coverInputRef.current?.click()}>
                <Camera className="h-4 w-4" />
                {resolvedCoverImage ? "Change cover" : "Add cover"}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!resolvedCoverImage}
                onSelect={removeCoverImage}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Remove cover
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <input
          type="file"
          ref={coverInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleCoverImageUpload}
        />
      </div>

      <div className="relative border-t border-border/60 bg-card px-4 pb-5 pt-14 sm:px-5 sm:pb-5 sm:pt-16 md:px-6 md:pt-20">
        <div className="absolute -top-16 left-4 sm:-top-20 sm:left-5 md:-top-24 md:left-6">
          <div
            className="group/avatar relative shrink-0 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div
              className={`rounded-full transition-all duration-200 ${
                isOpenToWorkActive
                  ? "bg-background p-1"
                  : "border-2 border-background bg-background p-0.5 shadow-md"
              }`}
            >
              <div
                className={`relative h-24 w-24 overflow-hidden rounded-full bg-muted sm:h-32 sm:w-32 md:h-36 md:w-36 ${
                  isOpenToWorkActive
                    ? "border border-background bg-background"
                    : "border-2 border-border/70"
                }`}
              >
                {personal.avatar ? (
                  <img
                    src={personal.avatar}
                    alt={personal.name || "Profile avatar"}
                    className="h-full w-full object-cover"
                    onError={() =>
                      setPersonal((prev) =>
                        prev.avatar ? { ...prev, avatar: "" } : prev
                      )
                    }
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-zinc-200">
                    {initials}
                  </div>
                )}
              </div>
            </div>
            <div
              className={`absolute bottom-1 right-1 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-background shadow-sm transition-all duration-200 sm:h-9 sm:w-9 ${
                uploadingImage
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-95 group-hover/avatar:opacity-100 group-hover/avatar:scale-100"
              }`}
            >
              {uploadingImage ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-foreground" />
              ) : (
                <Camera className="h-3.5 w-3.5 text-foreground" />
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
        </div>

        <div className="mt-5 min-w-0 space-y-1 sm:mt-0">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1
                title={profileName}
                className="min-w-0 max-w-full truncate text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl"
              >
                {profileName}
              </h1>

              {isVerified ? (
                <Badge
                  title="This freelancer has successfully completed at least one project on our platform."
                  className="h-6 border-emerald-500/20 bg-emerald-500/10 px-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300"
                >
                  <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                  Verified Freelancer
                </Badge>
              ) : null}
              {typeof personal.openToWork === "boolean" ? (
                <Badge
                  title="Auto-managed from your active project count."
                  className={`h-6 px-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                    isOpenToWorkActive
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  }`}
                >
                  {openToWorkLabel}
                </Badge>
              ) : null}
            </div>

          <p className="text-sm text-muted-foreground sm:text-base">{profileHandle}</p>
          </div>
          <p className="max-w-5xl text-[15px] leading-7 text-foreground sm:text-base sm:leading-relaxed">
            {resolvedBio || "Add a short professional bio to showcase your expertise."}
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-1 text-xs text-muted-foreground sm:gap-x-4 sm:text-sm">
            <span className="inline-flex items-center gap-1.5">
              <Briefcase className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              {heroTitle}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              {displayLocation || "Location not set"}
            </span>
            <span className="inline-flex items-center gap-2">
              {profileLinkItems.length > 0 ? (
                profileLinkItems.map(({ key, href, label, Icon }) => (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={label}
                    aria-label={label}
                    className="inline-flex items-center justify-center text-muted-foreground transition-colors hover:text-primary"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </a>
                ))
              ) : (
                <button
                  type="button"
                  onClick={openPortfolioModal}
                  className="inline-flex items-center justify-center text-muted-foreground transition-colors hover:text-primary"
                  title="Add profile links"
                  aria-label="Add profile links"
                >
                  <Link2 className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MessageCircle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              {spokenLanguages.length > 0 ? (
                `Speaks ${spokenLanguages.join(", ")}`
              ) : (
                <>
                  <span>Languages not set</span>
                  <button
                    type="button"
                    onClick={() => openEditPersonalModal()}
                    className="inline-flex items-center rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[11px] font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    Add
                  </button>
                </>
              )}
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:absolute sm:right-5 sm:top-4 sm:mt-0 sm:flex sm:flex-wrap sm:items-center sm:justify-end md:right-6">
          <div className="flex h-12 w-full items-center justify-between gap-4 rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all duration-200 sm:w-auto sm:min-w-[16rem]">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-[-0.02em] text-foreground">
                {openToWorkLabel}
              </p>
            </div>

            <Switch
              checked={isOpenToWorkActive}
              onCheckedChange={onToggleAvailability}
              disabled={availabilitySaving}
              aria-label="Toggle open to work status"
              title={`Set profile status to ${
                isOpenToWorkActive ? "Offline" : "Open to Work"
              }`}
              className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-white/15"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => resumeInputRef.current?.click()}
            disabled={uploadingResume}
            className="h-10 w-full justify-center rounded-md border-border/70 bg-background px-3 text-sm text-foreground hover:bg-muted sm:w-auto"
            title={
              resolvedLinks.resume
                ? "Resume uploaded. Click to replace."
                : "Upload resume"
            }
          >
            {uploadingResume ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Uploading...
              </>
            ) : resolvedLinks.resume ? (
              <>
                <FileText className="h-4 w-4" aria-hidden="true" />
                Resume uploaded
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" aria-hidden="true" />
                Upload resume
              </>
            )}
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-10 w-full justify-center rounded-md border border-border/70 bg-accent px-4 text-sm font-semibold text-foreground hover:bg-secondary min-[420px]:col-span-2 sm:w-auto sm:justify-center sm:col-auto"
            title="Edit profile"
            onClick={() => openEditPersonalModal()}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Edit profile
          </Button>
        </div>

        <input
          type="file"
          ref={resumeInputRef}
          className="hidden"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleResumeUpload}
        />
      </div>
    </section>
  );
};

export default ProfileHeroCard;

