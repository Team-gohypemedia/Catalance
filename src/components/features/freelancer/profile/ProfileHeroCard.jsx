import Camera from "lucide-react/dist/esm/icons/camera";
import Check from "lucide-react/dist/esm/icons/check";
import Github from "lucide-react/dist/esm/icons/github";
import Globe from "lucide-react/dist/esm/icons/globe";
import Linkedin from "lucide-react/dist/esm/icons/linkedin";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle";
import MoreHorizontal from "lucide-react/dist/esm/icons/more-horizontal";
import Pencil from "lucide-react/dist/esm/icons/pencil";
import Plus from "lucide-react/dist/esm/icons/plus";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import Upload from "lucide-react/dist/esm/icons/upload";
import { Button } from "@/components/ui/button";
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

const getLinkMetaText = (key, url) => {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./i, "");
  } catch {
    return url.replace(/^https?:\/\//i, "");
  }
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
  displayHeadline,
  displayLocation,
  onboardingIdentity,
  onboardingLanguages,
  openEditPersonalModal,
  openPortfolioModal,
  profileLinks,
}) => {
  const identityTitle = String(
    onboardingIdentity?.professionalTitle || displayHeadline || ""
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

  const profileLinkItems = [
    {
      key: "linkedin",
      label: "LinkedIn",
      icon: Linkedin,
      value: resolvedLinks.linkedin,
    },
    {
      key: "github",
      label: "GitHub",
      icon: Github,
      value: resolvedLinks.github,
    },
    {
      key: "portfolio",
      label: "Portfolio",
      icon: Globe,
      value: resolvedLinks.portfolio,
    },
  ];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="relative h-40 w-full md:h-56">
        {personal.coverImage ? (
          <img
            src={personal.coverImage}
            alt={`${personal.name || "Freelancer"} profile cover`}
            className="h-full w-full object-cover"
            onError={() =>
              setPersonal((prev) =>
                prev.coverImage ? { ...prev, coverImage: "" } : prev
              )
            }
          />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background:
                "radial-gradient(circle at 88% 10%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.04) 26%, transparent 46%), linear-gradient(115deg, #172554 0%, #1e3a8a 38%, #0b1020 72%, #3f3f46 100%)",
            }}
            aria-hidden="true"
          />
        )}

        <div
          className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/45 to-transparent"
          aria-hidden="true"
        />

        <div className="absolute right-3 top-3 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-black/35 text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-black/50 disabled:cursor-not-allowed disabled:opacity-70"
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
                {personal.coverImage ? "Change cover" : "Add cover"}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!personal.coverImage}
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

      <div className="relative px-5 pb-5 pt-0 md:px-7 md:pb-7">
        <div className="-mt-11 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 flex-1 items-end gap-4 md:gap-5">
            <div
              className="group/avatar relative shrink-0 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div
                className="absolute -inset-[3px] rounded-full opacity-85 blur-[2px] transition-opacity duration-300 group-hover/avatar:opacity-100"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(var(--primary)), #38bdf8, #22c55e)",
                }}
                aria-hidden="true"
              />
              <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-card bg-muted md:h-28 md:w-28">
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
                  <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-muted-foreground">
                    {initials}
                  </div>
                )}
              </div>

              <span
                className="absolute bottom-1 right-1 z-10 h-3.5 w-3.5 rounded-full border-2 border-card bg-emerald-500"
                title="Online"
                aria-hidden="true"
              />

              <div
                className={`absolute -bottom-1 -right-1 z-10 rounded-full border border-border/60 bg-card p-1.5 shadow-sm transition-opacity duration-200 ${
                  uploadingImage
                    ? "opacity-100"
                    : "opacity-0 group-hover/avatar:opacity-100"
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

            <div className="min-w-0 flex-1 space-y-2.5">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h1
                  title={personal.name || "Your Name"}
                  className="min-w-0 max-w-full truncate text-2xl font-bold tracking-tight text-foreground md:text-4xl"
                >
                  {personal.name || "Your Name"}
                </h1>
                {username ? (
                  <span className="inline-flex max-w-[min(100%,14rem)] shrink-0 items-center truncate rounded-full border border-border/70 bg-background/60 px-2.5 py-0.5 text-sm font-medium text-muted-foreground">
                    @{username}
                  </span>
                ) : null}
              </div>

              <p className="text-lg font-semibold text-foreground/95 md:text-xl">
                {identityTitle || "Add title"}
              </p>

              <div className="flex flex-wrap items-center gap-2.5 pt-0.5 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/55 px-2.5 py-1">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  {displayLocation || "Location not set"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/55 px-2.5 py-1">
                  <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  {spokenLanguages.length > 0
                    ? `Speaks ${spokenLanguages.join(", ")}`
                    : "Languages not set"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {profileLinkItems.map((item) => {
                  const Icon = item.icon;
                  const iconTitle = item.value
                    ? `${item.label}: ${getLinkMetaText(item.key, item.value)}`
                    : `Add ${item.label}`;

                  if (item.value) {
                    return (
                      <a
                        key={item.key}
                        href={item.value}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={iconTitle}
                        aria-label={iconTitle}
                        className="group relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-background/65 text-muted-foreground transition-colors hover:border-primary/45 hover:bg-background hover:text-foreground"
                      >
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    );
                  }

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={openPortfolioModal}
                      title={iconTitle}
                      aria-label={iconTitle}
                      className="group relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-border/70 bg-background/40 text-muted-foreground transition-colors hover:border-primary/35 hover:bg-muted"
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="absolute -right-0.5 -top-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-border/70 bg-card">
                        <Plus className="h-2 w-2" aria-hidden="true" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => resumeInputRef.current?.click()}
              disabled={uploadingResume}
              className={`h-9 ${
                resolvedLinks.resume
                  ? "border-emerald-500/45 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15 hover:text-emerald-200"
                  : ""
              }`}
              title={
                resolvedLinks.resume
                  ? "Resume uploaded. Click to replace."
                  : "Upload resume"
              }
            >
              {uploadingResume ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : resolvedLinks.resume ? (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {resolvedLinks.resume ? "Resume uploaded" : "Upload resume"}
            </Button>
              <Button
                type="button"
                size="sm"
                className="h-9"
                title="Edit profile"
                onClick={() => openEditPersonalModal()}
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                Edit profile
              </Button>
            </div>
        </div>

        <input
          type="file"
          ref={resumeInputRef}
          className="hidden"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleResumeUpload}
        />
      </div>
    </div>
  );
};

export default ProfileHeroCard;
