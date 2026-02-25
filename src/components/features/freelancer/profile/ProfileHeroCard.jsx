import Camera from "lucide-react/dist/esm/icons/camera";
import Edit2 from "lucide-react/dist/esm/icons/edit-2";
import Eye from "lucide-react/dist/esm/icons/eye";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle";
import Share2 from "lucide-react/dist/esm/icons/share-2";
import { Button } from "@/components/ui/button";

const ProfileHeroCard = ({
  fileInputRef,
  personal,
  setPersonal,
  initials,
  uploadingImage,
  handleImageUpload,
  displayHeadline,
  displayLocation,
  resolvedPortfolioLink,
  resolvedLinkedinLink,
  resumeLink,
  openEditPersonalModal,
  onboardingIdentity,
  onboardingLanguages,
  isDirty,
  handleSave,
  isSaving,
}) => {
  const identityTitle =
    onboardingIdentity?.professionalTitle || displayHeadline || "Add title";
  const username = String(onboardingIdentity?.username || "").trim();
  const spokenLanguages = Array.isArray(onboardingLanguages)
    ? onboardingLanguages.slice(0, 3)
    : [];
  const previewLink =
    resolvedPortfolioLink || resolvedLinkedinLink || resumeLink || "";

  const handleShareProfile = async () => {
    if (typeof window === "undefined" || !navigator?.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // Clipboard access can be denied by browser settings.
    }
  };

  const handlePreviewProfile = () => {
    if (!previewLink || typeof window === "undefined") return;
    window.open(previewLink, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      {/* Gradient accent bar */}
      <div
        className="h-1 w-full"
        style={{
          background:
            "linear-gradient(90deg, hsl(var(--primary)) 0%, #8b5cf6 40%, #6366f1 70%, #3b82f6 100%)",
        }}
        aria-hidden="true"
      />

      <div className="p-5 md:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-5">
            {/* Avatar with glowing ring */}
            <div
              className="group/avatar relative shrink-0 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div
                className="absolute -inset-[3px] rounded-full opacity-70 blur-[2px] transition-opacity duration-300 group-hover/avatar:opacity-100"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(var(--primary)), #8b5cf6, #6366f1)",
                }}
                aria-hidden="true"
              />
              <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-card bg-muted md:h-24 md:w-24">
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

              {/* Online indicator */}
              <span
                className="absolute bottom-0.5 right-0.5 z-10 h-3.5 w-3.5 rounded-full border-2 border-card bg-emerald-500"
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

            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1
                  className="text-2xl font-bold tracking-tight text-foreground md:text-3xl"
                  style={{ textWrap: "balance" }}
                >
                  {personal.name || "Your Name"}
                </h1>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg text-muted-foreground transition-colors duration-200 hover:text-foreground"
                  onClick={openEditPersonalModal}
                  title="Edit profile"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                {username ? (
                  <span className="rounded-full bg-muted/60 px-2.5 py-0.5 text-sm font-medium text-muted-foreground">
                    @{username}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-semibold text-foreground/90 md:text-xl">
                  {identityTitle}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg text-muted-foreground transition-colors duration-200 hover:text-foreground"
                  onClick={openEditPersonalModal}
                  title="Edit title"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-0.5 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  {displayLocation || "Location not set"}
                </span>
                <span
                  className="h-3 w-px bg-border/80"
                  aria-hidden="true"
                />
                <span className="inline-flex items-center gap-1.5">
                  <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  {spokenLanguages.length > 0
                    ? `Speaks ${spokenLanguages.join(", ")}`
                    : "Languages not set"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isDirty ? (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(var(--primary)), #8b5cf6)",
                }}
              >
                {isSaving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : null}
                {isSaving ? "Saving…" : "Save"}
              </button>
            ) : null}

            <button
              type="button"
              onClick={handleShareProfile}
              className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition-all duration-200 hover:scale-[1.02] hover:border-primary/30 hover:bg-muted hover:shadow-md active:scale-[0.98]"
            >
              <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
              Share
            </button>
            <button
              type="button"
              onClick={handlePreviewProfile}
              disabled={!previewLink}
              className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition-all duration-200 hover:scale-[1.02] hover:border-primary/30 hover:bg-muted hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-sm"
            >
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeroCard;
