import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const PersonalDetailsModalContent = ({
  personal,
  portfolio,
  onboardingIdentity,
  handlePersonalChange,
  handlePersonalUsernameChange,
  setPortfolio,
  savePersonalSection,
  isSaving,
  setPersonal,
  setModalType,
}) => {
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

      <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label
              htmlFor="freelancer-available-switch"
              className="text-sm font-semibold tracking-normal"
            >
              Available for work
            </Label>
            <p className="text-xs text-muted-foreground">
              Show that you are currently open to new projects.
            </p>
          </div>
          <Switch
            id="freelancer-available-switch"
            checked={Boolean(personal.available)}
            onCheckedChange={(checked) =>
              setPersonal((prev) => ({ ...prev, available: checked }))
            }
          />
        </div>
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
