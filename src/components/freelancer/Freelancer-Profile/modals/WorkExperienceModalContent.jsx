import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const WorkExperienceModalContent = ({
  editingIndex,
  workForm,
  setWorkForm,
  buildMonthYearLabel,
  MONTH_OPTIONS,
  YEAR_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  LOCATION_TYPE_OPTIONS,
  initialWorkForm,
  saveExperience,
  isSaving,
  setModalType,
  setEditingIndex,
}) => {
  const EMPTY_VALUE = "__empty__";

  return (
    <>
      <h1 className="text-lg font-semibold text-foreground">
        {editingIndex !== null ? "Edit Work Experience" : "Add Work Experience"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Capture your role, timeline, and the impact you had.
      </p>

      <div className="mt-5 space-y-5">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Title*</span>
          <input
            value={workForm.position}
            onChange={(event) =>
              setWorkForm((prev) => ({
                ...prev,
                position: event.target.value,
              }))
            }
            placeholder="e.g. Full Stack & AI Developer"
            className="h-11 w-full rounded-lg border border-border bg-transparent px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/70 focus:ring-2 focus:ring-primary/50"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">
            Employment type
          </span>
          <Select
            value={workForm.employmentType}
            onValueChange={(value) =>
              setWorkForm((prev) => ({
                ...prev,
                employmentType: value === EMPTY_VALUE ? "" : value,
              }))
            }
          >
            <SelectTrigger className="h-11 w-full rounded-lg border-border bg-transparent px-3 text-sm text-foreground">
              <SelectValue placeholder="Select employment type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={EMPTY_VALUE}>Select employment type</SelectItem>
              {workForm.employmentType &&
              !EMPLOYMENT_TYPE_OPTIONS.includes(workForm.employmentType) ? (
                <SelectItem value={workForm.employmentType}>
                  {workForm.employmentType}
                </SelectItem>
              ) : null}
              {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">
            Company or organization*
          </span>
          <input
            value={workForm.company}
            onChange={(event) =>
              setWorkForm((prev) => ({
                ...prev,
                company: event.target.value,
              }))
            }
            placeholder="e.g. Go Hype Media"
            className="h-11 w-full rounded-lg border border-border bg-transparent px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/70 focus:ring-2 focus:ring-primary/50"
          />
        </label>

        <label className="inline-flex items-center gap-2.5">
          <Checkbox
            id="current-role-work"
            checked={Boolean(workForm.isCurrentRole)}
            onCheckedChange={(checked) =>
              setWorkForm((prev) => ({
                ...prev,
                isCurrentRole: Boolean(checked),
                to: checked ? "Present" : "",
                endMonth: checked ? "" : prev.endMonth,
                endYear: checked ? "" : prev.endYear,
              }))
            }
          />
          <span className="text-sm font-medium text-foreground">
            I am currently working in this role
          </span>
        </label>

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Start date</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-sm text-muted-foreground">Month*</span>
              <Select
                value={workForm.startMonth}
                onValueChange={(value) =>
                  setWorkForm((prev) => ({
                    ...prev,
                    startMonth: value === EMPTY_VALUE ? "" : value,
                    from: buildMonthYearLabel(
                      value === EMPTY_VALUE ? "" : value,
                      prev.startYear
                    ),
                  }))
                }
              >
                <SelectTrigger className="h-11 w-full rounded-lg border-border bg-transparent px-3 text-sm text-foreground">
                  <SelectValue placeholder="Month*" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY_VALUE}>Month*</SelectItem>
                  {MONTH_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm text-muted-foreground">Year*</span>
              <Select
                value={workForm.startYear}
                onValueChange={(value) =>
                  setWorkForm((prev) => ({
                    ...prev,
                    startYear: value === EMPTY_VALUE ? "" : value,
                    from: buildMonthYearLabel(
                      prev.startMonth,
                      value === EMPTY_VALUE ? "" : value
                    ),
                  }))
                }
              >
                <SelectTrigger className="h-11 w-full rounded-lg border-border bg-transparent px-3 text-sm text-foreground">
                  <SelectValue placeholder="Year*" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY_VALUE}>Year*</SelectItem>
                  {YEAR_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>
        </div>

        {!workForm.isCurrentRole ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">End date</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-sm text-muted-foreground">Month*</span>
                <Select
                  value={workForm.endMonth}
                  onValueChange={(value) =>
                    setWorkForm((prev) => ({
                      ...prev,
                      endMonth: value === EMPTY_VALUE ? "" : value,
                      to: buildMonthYearLabel(
                        value === EMPTY_VALUE ? "" : value,
                        prev.endYear
                      ),
                    }))
                  }
                >
                  <SelectTrigger className="h-11 w-full rounded-lg border-border bg-transparent px-3 text-sm text-foreground">
                    <SelectValue placeholder="Month*" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EMPTY_VALUE}>Month*</SelectItem>
                    {MONTH_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm text-muted-foreground">Year*</span>
                <Select
                  value={workForm.endYear}
                  onValueChange={(value) =>
                    setWorkForm((prev) => ({
                      ...prev,
                      endYear: value === EMPTY_VALUE ? "" : value,
                      to: buildMonthYearLabel(
                        prev.endMonth,
                        value === EMPTY_VALUE ? "" : value
                      ),
                    }))
                  }
                >
                  <SelectTrigger className="h-11 w-full rounded-lg border-border bg-transparent px-3 text-sm text-foreground">
                    <SelectValue placeholder="Year*" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EMPTY_VALUE}>Year*</SelectItem>
                    {YEAR_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </div>
          </div>
        ) : null}

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Location</span>
          <input
            value={workForm.location}
            onChange={(event) =>
              setWorkForm((prev) => ({
                ...prev,
                location: event.target.value,
              }))
            }
            placeholder="South Delhi, Delhi, India"
            className="h-11 w-full rounded-lg border border-border bg-transparent px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/70 focus:ring-2 focus:ring-primary/50"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">
            Location type
          </span>
          <Select
            value={workForm.locationType}
            onValueChange={(value) =>
              setWorkForm((prev) => ({
                ...prev,
                locationType: value === EMPTY_VALUE ? "" : value,
              }))
            }
          >
            <SelectTrigger className="h-11 w-full rounded-lg border-border bg-transparent px-3 text-sm text-foreground">
              <SelectValue placeholder="Select location type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={EMPTY_VALUE}>Select location type</SelectItem>
              {workForm.locationType &&
              !LOCATION_TYPE_OPTIONS.includes(workForm.locationType) ? (
                <SelectItem value={workForm.locationType}>
                  {workForm.locationType}
                </SelectItem>
              ) : null}
              {LOCATION_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Pick a location type (ex: remote)
          </p>
        </label>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3 border-t border-border/70 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setModalType(null);
            setEditingIndex(null);
            setWorkForm(initialWorkForm);
          }}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={saveExperience}
          disabled={isSaving}
        >
          {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
          Save changes
        </Button>
      </div>
    </>
  );
};

export default WorkExperienceModalContent;
