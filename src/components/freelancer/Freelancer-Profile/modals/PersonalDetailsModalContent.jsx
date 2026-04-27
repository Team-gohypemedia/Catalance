import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Plus from "lucide-react/dist/esm/icons/plus";
import X from "lucide-react/dist/esm/icons/x";
import Camera from "lucide-react/dist/esm/icons/camera";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";

const PersonalDetailsModalContent = ({
  personal,
  onboardingIdentity,
  handlePersonalChange,
  handlePersonalUsernameChange,
  handlePersonalLanguagesChange,
  socialMediaLinks = [],
  setSocialMediaLinks,
  savePersonalSection,
  isSaving,
  setModalType,
  // Cover image props
  coverInputRef,
  coverImageUrl,
  uploadingCoverImage,
  removeCoverImage,
}) => {
  const [newPlatform, setNewPlatform] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const getNextSocialMediaLinks = () => {
    const platform = newPlatform.trim();
    const url = newUrl.trim();
    const currentLinks = Array.isArray(socialMediaLinks) ? socialMediaLinks : [];

    if (!platform || !url) {
      return currentLinks;
    }

    return [...currentLinks, { platform, url }];
  };

  const confirmUrl = () => {
    const nextLinks = getNextSocialMediaLinks();
    if (nextLinks === socialMediaLinks) return;
    setSocialMediaLinks(nextLinks);
    setNewPlatform("");
    setNewUrl("");
  };

  const removeSocialMediaLink = (index) => {
    setSocialMediaLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const resolvedCover = String(coverImageUrl || "").trim();

  const handleSaveClick = () => {
    const nextLinks = getNextSocialMediaLinks();
    const hasPendingLink = nextLinks !== socialMediaLinks;

    if (hasPendingLink) {
      setSocialMediaLinks(nextLinks);
      setNewPlatform("");
      setNewUrl("");
    }

    savePersonalSection(nextLinks);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Edit Profile</h1>
          <p className="text-xs text-muted-foreground">
            Update your profile info visible on your profile.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalType(null)}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Cover Image */}
      <div className="space-y-1">
        <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Cover Image
        </Label>
        <div className="flex items-center gap-2">
          {resolvedCover ? (
            <div className="relative h-28 flex-1 overflow-hidden rounded-lg border border-border/50">
              <img
                src={resolvedCover}
                alt="Cover preview"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                <button
                  type="button"
                  onClick={() => coverInputRef?.current?.click()}
                  className="rounded-md bg-background/90 p-1.5 text-foreground transition-colors hover:bg-background"
                  title="Change cover"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={removeCoverImage}
                  className="rounded-md bg-background/90 p-1.5 text-destructive transition-colors hover:bg-background"
                  title="Remove cover"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => coverInputRef?.current?.click()}
              disabled={uploadingCoverImage}
              className="flex h-28 flex-1 items-center justify-center gap-2 rounded-lg border border-dashed border-border/70 bg-muted/20 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              {uploadingCoverImage ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" />
                  Add cover image
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Row 1: Name + Username */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Display Name
          </Label>
          <Input
            name="name"
            value={personal.name || ""}
            onChange={handlePersonalChange}
            placeholder="Your Name"
            className="h-9 bg-background/70 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Username
          </Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              @
            </span>
            <Input
              value={String(onboardingIdentity?.username || "")}
              onChange={handlePersonalUsernameChange}
              placeholder="username"
              className="h-9 bg-background/70 pl-7 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Row 2: Location + Languages */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Location
          </Label>
          <Input
            name="location"
            value={personal.location || ""}
            onChange={handlePersonalChange}
            placeholder="City, Country"
            className="h-9 bg-background/70 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Languages
          </Label>
          <Input
            value={
              Array.isArray(onboardingIdentity?.languages)
                ? onboardingIdentity.languages.join(", ")
                : ""
            }
            onChange={handlePersonalLanguagesChange}
            placeholder="English, Hindi"
            className="h-9 bg-background/70 text-sm"
          />
        </div>
      </div>

      {/* Bio */}
      <div className="space-y-1">
        <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Bio
        </Label>
        <Textarea
          name="bio"
          value={personal.bio || ""}
          onChange={handlePersonalChange}
          rows={2}
          placeholder="Short professional bio..."
          className="min-h-[56px] resize-none bg-background/70 text-sm"
        />
      </div>



      {/* Social Media Links */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Social Media Links
          </Label>
        </div>

        {/* Existing links as chips */}
        {socialMediaLinks.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {socialMediaLinks.map((link, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-xs"
                title={link.url}
              >
                <span className="font-medium text-foreground">{link.platform}</span>
                <button
                  type="button"
                  onClick={() => removeSocialMediaLink(index)}
                  className="ml-0.5 rounded-full p-0.5 text-muted-foreground transition-colors hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Enter platform and URL */}
        <div className="flex items-center gap-2 pt-1">
          <Input
            value={newPlatform}
            onChange={(e) => setNewPlatform(e.target.value)}
            placeholder="Platform Name"
            className="h-9 bg-background/70 text-xs w-[140px] shrink-0"
          />
          <Input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://..."
            className="h-9 bg-background/70 text-xs flex-1 min-w-0"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                confirmUrl();
              }
            }}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={confirmUrl}
            disabled={!newPlatform.trim() || !newUrl.trim()}
            className="h-9 px-3 text-xs shrink-0 bg-background/70"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 border-t border-border/50 pt-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setModalType(null)}
        >
          Cancel
        </Button>
        <Button type="button" size="sm" onClick={handleSaveClick} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </div>
  );
};

export default PersonalDetailsModalContent;
