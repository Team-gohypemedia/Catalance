import Camera from "lucide-react/dist/esm/icons/camera";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle";
import Pencil from "lucide-react/dist/esm/icons/pencil";

const ProfileHeroCard = ({
  fileInputRef,
  personal,
  setPersonal,
  initials,
  uploadingImage,
  handleImageUpload,
  displayHeadline,
  displayLocation,
  onboardingIdentity,
  onboardingLanguages,
  openEditPersonalModal,
}) => {
  const identityTitle = String(
    onboardingIdentity?.professionalTitle || displayHeadline || ""
  ).trim();
  const username = String(onboardingIdentity?.username || "").trim();
  const spokenLanguages = Array.isArray(onboardingLanguages)
    ? onboardingLanguages.slice(0, 3)
    : [];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <div
        className="h-1 w-full"
        style={{
          background:
            "linear-gradient(90deg, hsl(var(--primary)) 0%, #8b5cf6 40%, #6366f1 70%, #3b82f6 100%)",
        }}
        aria-hidden="true"
      />

      <div className="p-5 md:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 items-start gap-4 md:gap-5">
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

            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="break-words text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                  {personal.name || "Your Name"}
                </h1>
                {username ? (
                  <span className="inline-flex max-w-full items-center rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-sm font-medium text-muted-foreground">
                    @{username}
                  </span>
                ) : null}
              </div>

              <p className="text-lg font-semibold text-foreground/90 md:text-xl">
                {identityTitle || "Add title"}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-0.5 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  {displayLocation || "Location not set"}
                </span>
                <span className="h-3 w-px bg-border/80" aria-hidden="true" />
                <span className="inline-flex items-center gap-1.5">
                  <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  {spokenLanguages.length > 0
                    ? `Speaks ${spokenLanguages.join(", ")}`
                    : "Languages not set"}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={openEditPersonalModal}
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            title="Edit profile section"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Edit
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeroCard;
