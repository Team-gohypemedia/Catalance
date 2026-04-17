import Plus from "lucide-react/dist/esm/icons/plus";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { FULL_PROFILE_EDITOR_SECTIONS } from "@/components/features/freelancer/profile/freelancerProfileUtils";

const FullProfileEditorModalContent = ({
  fullProfileForm,
  section = FULL_PROFILE_EDITOR_SECTIONS.ALL,
  handleFullProfileFieldChange,
  setFullProfileForm,
  addEducationEntry,
  handleEducationFieldChange,
  removeEducationEntry,
  saveFullProfileEditor,
  isSaving,
  setModalType,
}) => {
  const isWorkPreferencesOnly =
    section === FULL_PROFILE_EDITOR_SECTIONS.WORK_PREFERENCES;
  const isIndustryFocusOnly =
    section === FULL_PROFILE_EDITOR_SECTIONS.INDUSTRY_FOCUS;
  const isFocusedSection = isWorkPreferencesOnly || isIndustryFocusOnly;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          {isWorkPreferencesOnly
            ? "Edit Work Preferences"
            : isIndustryFocusOnly
              ? "Edit Industry Focus"
              : "Edit Full Profile"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isWorkPreferencesOnly
            ? "Update the availability and policy details clients see on your profile."
            : isIndustryFocusOnly
              ? "Add the industries and niches you want clients to associate with your profile."
              : "Update your onboarding profile details and save directly to database."}
        </p>
      </div>

      {!isFocusedSection ? (
      <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
        <h2 className="text-sm font-semibold text-foreground">Identity</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label
              htmlFor="full-professional-title"
              className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
            >
              Professional Title
            </Label>
            <Input
              id="full-professional-title"
              name="professionalTitle"
              value={fullProfileForm.professionalTitle}
              onChange={handleFullProfileFieldChange}
              placeholder="e.g. Full Stack Developer"
              className="h-10 bg-background/70"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="full-username"
              className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
            >
              Username
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                @
              </span>
              <Input
                id="full-username"
                name="username"
                value={fullProfileForm.username}
                onChange={handleFullProfileFieldChange}
                placeholder="username"
                className="h-10 bg-background/70 pl-7"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="full-country"
              className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
            >
              Country
            </Label>
            <Input
              id="full-country"
              name="country"
              value={fullProfileForm.country}
              onChange={handleFullProfileFieldChange}
              placeholder="Country"
              className="h-10 bg-background/70"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="full-city"
              className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
            >
              City
            </Label>
            <Input
              id="full-city"
              name="city"
              value={fullProfileForm.city}
              onChange={handleFullProfileFieldChange}
              placeholder="City"
              className="h-10 bg-background/70"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label
              htmlFor="full-languages"
              className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
            >
              Languages
            </Label>
            <Input
              id="full-languages"
              name="languages"
              value={fullProfileForm.languages}
              onChange={handleFullProfileFieldChange}
              placeholder="English, Hindi"
              className="h-10 bg-background/70"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label
              htmlFor="full-other-language"
              className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
            >
              Other Language
            </Label>
            <Input
              id="full-other-language"
              name="otherLanguage"
              value={fullProfileForm.otherLanguage}
              onChange={handleFullProfileFieldChange}
              placeholder="Optional additional language"
              className="h-10 bg-background/70"
            />
          </div>
        </div>
      </div>
      ) : null}

      {!isIndustryFocusOnly ? (
      <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
        <h2 className="text-sm font-semibold text-foreground">
          Work Preferences
        </h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label
              htmlFor="full-role"
              className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
            >
              Work Style
            </Label>
            <select
              id="full-role"
              name="role"
              value={fullProfileForm.role}
              onChange={handleFullProfileFieldChange}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select role</option>
              <option value="individual">Individual Freelancer</option>
              <option value="agency">Agency / Studio</option>
              <option value="part_time">Part-Time Freelancer</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="full-hours"
              className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
            >
              Weekly Availability
            </Label>
            <select
              id="full-hours"
              name="hoursPerWeek"
              value={fullProfileForm.hoursPerWeek}
              onChange={handleFullProfileFieldChange}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select availability</option>
              <option value="less_than_10">Less than 10 hours/week</option>
              <option value="10_20">10-20 hours/week</option>
              <option value="20_30">20-30 hours/week</option>
              <option value="30_plus">30+ hours/week</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="full-schedule"
              className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
            >
              Working Schedule
            </Label>
            <Input
              id="full-schedule"
              name="workingSchedule"
              value={fullProfileForm.workingSchedule}
              onChange={handleFullProfileFieldChange}
              placeholder="e.g. Weekdays"
              className="h-10 bg-background/70"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="full-start-timeline"
              className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
            >
              Start Time
            </Label>
            <Input
              id="full-start-timeline"
              name="startTimeline"
              value={fullProfileForm.startTimeline}
              onChange={handleFullProfileFieldChange}
              placeholder="e.g. Immediate"
              className="h-10 bg-background/70"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label
              htmlFor="full-accept-projects"
              className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
            >
              Take Over In-Progress Projects
            </Label>
            <select
              id="full-accept-projects"
              name="acceptInProgressProjects"
              value={fullProfileForm.acceptInProgressProjects}
              onChange={handleFullProfileFieldChange}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select option</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/50 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-foreground">
                Delivery Policy Accepted
              </p>
              <p className="text-xs text-muted-foreground">
                Confirms delivery terms.
              </p>
            </div>
            <Switch
              checked={Boolean(fullProfileForm.deliveryPolicyAccepted)}
              onCheckedChange={(checked) =>
                setFullProfileForm((prev) => ({
                  ...prev,
                  deliveryPolicyAccepted: checked,
                }))
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/50 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-foreground">
                Communication Policy Accepted
              </p>
              <p className="text-xs text-muted-foreground">
                Confirms communication terms.
              </p>
            </div>
            <Switch
              checked={Boolean(fullProfileForm.communicationPolicyAccepted)}
              onCheckedChange={(checked) =>
                setFullProfileForm((prev) => ({
                  ...prev,
                  communicationPolicyAccepted: checked,
                }))
              }
            />
          </div>
          {!isWorkPreferencesOnly ? (
            <>
              <div className="space-y-2">
                <Label
                  htmlFor="full-missed-deadlines"
                  className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
                >
                  Missed Deadlines
                </Label>
                <Input
                  id="full-missed-deadlines"
                  name="missedDeadlines"
                  value={fullProfileForm.missedDeadlines}
                  onChange={handleFullProfileFieldChange}
                  placeholder="e.g. Never"
                  className="h-10 bg-background/70"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="full-delay-handling"
                  className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
                >
                  Delay Handling
                </Label>
                <Input
                  id="full-delay-handling"
                  name="delayHandling"
                  value={fullProfileForm.delayHandling}
                  onChange={handleFullProfileFieldChange}
                  placeholder="e.g. Communicate early"
                  className="h-10 bg-background/70"
                />
              </div>
            </>
          ) : null}
        </div>
      </div>
      ) : null}

      {!isWorkPreferencesOnly ? (
      <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
        <h2 className="text-sm font-semibold text-foreground">
          {isIndustryFocusOnly ? "Industry Focus" : "Policies And Industry Focus"}
        </h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label
              htmlFor="full-industry-focus"
              className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
            >
              Industry Focus
            </Label>
            <Input
              id="full-industry-focus"
              name="globalIndustryFocus"
              value={fullProfileForm.globalIndustryFocus}
              onChange={handleFullProfileFieldChange}
              placeholder="SaaS, Healthcare, Ecommerce"
              className="h-10 bg-background/70"
            />
            <p className="text-xs text-muted-foreground">
              Separate multiple industries with commas.
            </p>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label
              htmlFor="full-industry-other"
              className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
            >
              Other Industry Or Niche
            </Label>
            <Input
              id="full-industry-other"
              name="globalIndustryOther"
              value={fullProfileForm.globalIndustryOther}
              onChange={handleFullProfileFieldChange}
              placeholder="Optional niche or custom industry"
              className="h-10 bg-background/70"
            />
          </div>
          {!isIndustryFocusOnly ? (
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/50 px-3 py-2.5 md:col-span-2">
            <div>
              <p className="text-sm font-medium text-foreground">
                Terms Accepted
              </p>
              <p className="text-xs text-muted-foreground">
                Confirms profile terms and conditions.
              </p>
            </div>
            <Switch
              checked={Boolean(fullProfileForm.termsAccepted)}
              onCheckedChange={(checked) =>
                setFullProfileForm((prev) => ({
                  ...prev,
                  termsAccepted: checked,
                }))
              }
            />
          </div>
          ) : null}
        </div>
      </div>
      ) : null}

      {!isFocusedSection ? (
      <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">Education</h2>
          <Button type="button" variant="outline" size="sm" onClick={addEducationEntry}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add
          </Button>
        </div>

        <div className="mt-3 space-y-3">
          {(Array.isArray(fullProfileForm.education)
            ? fullProfileForm.education
            : []
          ).map((entry, index) => (
            <div
              key={`education-row-${index}`}
              className="rounded-lg border border-border/60 bg-background/50 p-3"
            >
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  value={entry.school || ""}
                  onChange={(event) =>
                    handleEducationFieldChange(index, "school", event.target.value)
                  }
                  placeholder="School / University"
                  className="h-10 bg-background/80"
                />
                <Input
                  value={entry.degree || ""}
                  onChange={(event) =>
                    handleEducationFieldChange(index, "degree", event.target.value)
                  }
                  placeholder="Degree"
                  className="h-10 bg-background/80"
                />
                <Input
                  value={entry.field || ""}
                  onChange={(event) =>
                    handleEducationFieldChange(index, "field", event.target.value)
                  }
                  placeholder="Field / Specialization"
                  className="h-10 bg-background/80"
                />
                <Input
                  value={entry.country || ""}
                  onChange={(event) =>
                    handleEducationFieldChange(index, "country", event.target.value)
                  }
                  placeholder="Country"
                  className="h-10 bg-background/80"
                />
                <Input
                  value={entry.graduationYear || ""}
                  onChange={(event) =>
                    handleEducationFieldChange(
                      index,
                      "graduationYear",
                      event.target.value
                    )
                  }
                  placeholder="Graduation Year"
                  className="h-10 bg-background/80 md:col-span-2"
                />
              </div>
              {(Array.isArray(fullProfileForm.education)
                ? fullProfileForm.education.length
                : 0) > 1 ? (
                <div className="mt-2 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEducationEntry(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Remove
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      ) : null}

      {!isFocusedSection ? (
      <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
        <Label
          htmlFor="full-professional-bio"
          className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
        >
          Professional Bio
        </Label>
        <Textarea
          id="full-professional-bio"
          name="professionalBio"
          value={fullProfileForm.professionalBio}
          onChange={handleFullProfileFieldChange}
          rows={5}
          placeholder="Tell clients about your strengths, execution style, and outcomes..."
          className="mt-2 min-h-[120px] resize-y bg-background/70"
        />
      </div>
      ) : null}

      <div className="flex items-center justify-end gap-2 border-t border-border/70 pt-4">
        <Button type="button" variant="outline" onClick={() => setModalType(null)}>
          Cancel
        </Button>
        <Button type="button" onClick={saveFullProfileEditor} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export default FullProfileEditorModalContent;
