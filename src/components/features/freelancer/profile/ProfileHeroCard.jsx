import Camera from "lucide-react/dist/esm/icons/camera";
import Edit2 from "lucide-react/dist/esm/icons/edit-2";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Github from "lucide-react/dist/esm/icons/github";
import Globe from "lucide-react/dist/esm/icons/globe";
import Linkedin from "lucide-react/dist/esm/icons/linkedin";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Plus from "lucide-react/dist/esm/icons/plus";
import { Button } from "@/components/ui/button";

const ProfileHeroCard = ({
  randomGradient,
  fileInputRef,
  personal,
  setPersonal,
  initials,
  uploadingImage,
  handleImageUpload,
  displayHeadline,
  displayLocation,
  displayBio,
  showExperienceYears,
  experienceYearsLabel,
  resolvedGithubLink,
  resolvedLinkedinLink,
  resolvedPortfolioLink,
  resumeLink,
  isDirty,
  handleSave,
  isSaving,
  openEditPersonalModal,
  openPortfolioModal,
}) => {
  return (
    <div className="relative rounded-3xl overflow-hidden bg-card border border-border/50 shadow-sm group/header">
      <div className={`h-44 relative ${randomGradient}`}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
      </div>

      <div className="px-8 pb-10 flex flex-col md:flex-row items-end gap-6 -mt-20 relative z-10">
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
                  onError={() =>
                    setPersonal((prev) =>
                      prev.avatar ? { ...prev, avatar: "" } : prev
                    )
                  }
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-secondary text-3xl font-bold text-secondary-foreground">
                  {initials}
                </div>
              )}
              <div
                className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                  uploadingImage
                    ? "opacity-100"
                    : "opacity-0 group-hover/avatar:opacity-100"
                }`}
              >
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

          {personal.available && (
            <div
              className="absolute bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full border-4 border-card"
              title="Available for work"
            >
              <div className="w-2.5 h-2.5 bg-white rounded-full" />
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col md:flex-row items-end justify-between gap-4 md:mb-1">
          <div className="flex flex-col gap-1 text-center md:text-left w-full md:w-auto">
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

            <p className="text-lg text-gray-300 font-medium">{displayHeadline}</p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-400 mt-1">
              {displayLocation && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{displayLocation}</span>
                </div>
              )}
              {showExperienceYears && (
                <>
                  <span className="hidden md:inline">&bull;</span>
                  <span>{experienceYearsLabel} Years Exp.</span>
                </>
              )}
            </div>

            {displayBio ? (
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-300/90 whitespace-pre-wrap">
                {displayBio}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            {resolvedGithubLink && (
              <a
                href={resolvedGithubLink}
                target="_blank"
                className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all rounded-xl border border-white/10"
                rel="noreferrer"
              >
                <Github className="w-5 h-5" />
              </a>
            )}
            {resolvedLinkedinLink && (
              <a
                href={resolvedLinkedinLink}
                target="_blank"
                className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all rounded-xl border border-white/10"
                rel="noreferrer"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            )}
            {resolvedPortfolioLink && (
              <a
                href={resolvedPortfolioLink}
                target="_blank"
                className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all rounded-xl border border-white/10"
                rel="noreferrer"
              >
                <Globe className="w-5 h-5" />
              </a>
            )}
            {resumeLink && (
              <a
                href={resumeLink}
                target="_blank"
                className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all rounded-xl border border-white/10"
                rel="noreferrer"
                title="View Resume"
              >
                <FileText className="w-5 h-5" />
              </a>
            )}
            <button
              onClick={openPortfolioModal}
              className="p-2.5 text-primary hover:bg-primary/10 rounded-xl transition-colors border border-transparent hover:border-primary/20"
              title="Add/Edit Social Links"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {isDirty && (
          <Button
            variant="default"
            size="sm"
            className="absolute top-4 right-14 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border border-white/20 transition-all font-semibold shadow-lg animate-in fade-in zoom-in duration-300"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {isSaving ? "Saving..." : "Save Profile"}
          </Button>
        )}

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
  );
};

export default ProfileHeroCard;

