import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Plus from "lucide-react/dist/esm/icons/plus";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";

const PersonalDetailsModalContent = ({
  personal,
  portfolio,
  onboardingIdentity,
  onboardingLanguages,
  handlePersonalChange,
  handlePersonalUsernameChange,
  handlePersonalLanguagesChange,
  handlePersonalOtherLanguageChange,
  setPortfolio,
  socialMediaLinks = [],
  setSocialMediaLinks,
  savePersonalSection,
  isSaving,
  setModalType,
}) => {
  const [newPlatform, setNewPlatform] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const addSocialMediaLink = () => {
    const platform = newPlatform.trim();
    const url = newUrl.trim();
    if (!platform || !url) return;

    setSocialMediaLinks((prev) => [...prev, { platform, url }]);
    setNewPlatform("");
    setNewUrl("");
  };

  const removeSocialMediaLink = (index) => {
    setSocialMediaLinks((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          Edit Personal Details
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your public profile information shown to clients.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label
            htmlFor="personal-headline"
            className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
          >
            Headline
          </Label>
          <Input
            id="personal-headline"
            name="headline"
            value={personal.headline || ""}
            onChange={handlePersonalChange}
            placeholder="e.g. Full Stack Developer"
            className="h-10 bg-background/70"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="personal-name"
            className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
          >
            Display Name
          </Label>
          <Input
            id="personal-name"
            name="name"
            value={personal.name || ""}
            onChange={handlePersonalChange}
            placeholder="Your Name"
            className="h-10 bg-background/70"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="personal-username"
            className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
          >
            Username
          </Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              @
            </span>
            <Input
              id="personal-username"
              value={String(onboardingIdentity?.username || "")}
              onChange={handlePersonalUsernameChange}
              placeholder="username"
              className="h-10 bg-background/70 pl-7"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="personal-phone"
            className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
          >
            Phone
          </Label>
          <Input
            id="personal-phone"
            name="phone"
            value={personal.phone || ""}
            onChange={handlePersonalChange}
            placeholder="+91..."
            className="h-10 bg-background/70"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="personal-location"
            className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
          >
            Location
          </Label>
          <Input
            id="personal-location"
            name="location"
            value={personal.location || ""}
            onChange={handlePersonalChange}
            placeholder="City, Country"
            className="h-10 bg-background/70"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label
            htmlFor="personal-languages"
            className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
          >
            Languages
          </Label>
          <Input
            id="personal-languages"
            value={
              Array.isArray(onboardingIdentity?.languages)
                ? onboardingIdentity.languages.join(", ")
                : ""
            }
            onChange={handlePersonalLanguagesChange}
            placeholder="English, Hindi"
            className="h-10 bg-background/70"
          />
          <p className="text-xs text-muted-foreground">
            Add one or more languages, separated by commas.
          </p>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label
            htmlFor="personal-other-language"
            className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
          >
            Other Language
          </Label>
          <Input
            id="personal-other-language"
            value={String(onboardingIdentity?.otherLanguage || "")}
            onChange={handlePersonalOtherLanguageChange}
            placeholder="Optional additional language"
            className="h-10 bg-background/70"
          />
          {Array.isArray(onboardingLanguages) && onboardingLanguages.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              Current display: {onboardingLanguages.join(", ")}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Professional Links</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            These links are shown in your profile header.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label
              htmlFor="personal-portfolio-url"
              className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
            >
              Portfolio URL
            </Label>
            <Input
              id="personal-portfolio-url"
              value={portfolio.portfolioUrl || ""}
              onChange={(event) =>
                setPortfolio((prev) => ({
                  ...prev,
                  portfolioUrl: event.target.value,
                }))
              }
              placeholder="https://yourportfolio.com"
              className="h-10 bg-background/70"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="personal-linkedin-url"
              className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
            >
              LinkedIn URL
            </Label>
            <Input
              id="personal-linkedin-url"
              value={portfolio.linkedinUrl || ""}
              onChange={(event) =>
                setPortfolio((prev) => ({
                  ...prev,
                  linkedinUrl: event.target.value,
                }))
              }
              placeholder="https://linkedin.com/in/username"
              className="h-10 bg-background/70"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="personal-github-url"
              className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
            >
              GitHub URL
            </Label>
            <Input
              id="personal-github-url"
              value={portfolio.githubUrl || ""}
              onChange={(event) =>
                setPortfolio((prev) => ({
                  ...prev,
                  githubUrl: event.target.value,
                }))
              }
              placeholder="https://github.com/username"
              className="h-10 bg-background/70"
            />
          </div>
        </div>
      </div>

      {/* Social Media Links */}
      <div className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Social Media Links</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Add your social media profiles one by one.
          </p>
        </div>

        {/* Existing links */}
        {socialMediaLinks.length > 0 && (
          <div className="space-y-2">
            {socialMediaLinks.map((link, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/70 px-3 py-2"
              >
                <span className="min-w-0 shrink-0 text-sm font-medium text-foreground">
                  {link.platform}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                  {link.url}
                </span>
                <button
                  type="button"
                  onClick={() => removeSocialMediaLink(index)}
                  className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  title="Remove link"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add new link */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-1">
            <Label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Platform Name
            </Label>
            <Input
              value={newPlatform}
              onChange={(e) => setNewPlatform(e.target.value)}
              placeholder="e.g. Twitter, Dribbble, Behance"
              className="h-10 bg-background/70"
            />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <Label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              URL
            </Label>
            <Input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://..."
              className="h-10 bg-background/70"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSocialMediaLink();
                }
              }}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addSocialMediaLink}
            disabled={!newPlatform.trim() || !newUrl.trim()}
            className="h-10 shrink-0"
          >
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="personal-bio"
          className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
        >
          Bio / About Me
        </Label>
        <Textarea
          id="personal-bio"
          name="bio"
          value={personal.bio || ""}
          onChange={handlePersonalChange}
          rows={6}
          placeholder="Tell clients about your expertise, outcomes, and communication style..."
          className="min-h-[140px] resize-y bg-background/70"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
        <p className="text-xs text-muted-foreground">
          Click <span className="font-medium text-foreground">Save changes</span>{" "}
          to apply your personal details and links.
        </p>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => setModalType(null)}>
            Cancel
          </Button>
          <Button type="button" onClick={savePersonalSection} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PersonalDetailsModalContent;
