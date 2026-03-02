import Plus from "lucide-react/dist/esm/icons/plus";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const EducationModalContent = ({
  fullProfileForm,
  addEducationEntry,
  handleEducationFieldChange,
  removeEducationEntry,
  saveEducationSection,
  isSaving,
  setModalType,
  MONTH_OPTIONS,
  YEAR_OPTIONS,
}) => {
  const educationEntries =
    Array.isArray(fullProfileForm.education) && fullProfileForm.education.length > 0
      ? fullProfileForm.education
      : [];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Add education</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your education details and save them directly to your profile.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addEducationEntry}>
          <Plus className="mr-1 h-4 w-4" />
          Add new
        </Button>
      </div>

      <div className="space-y-4">
        {educationEntries.map((entry, index) => (
          <div
            key={`education-editor-row-${index}`}
            className="rounded-xl border border-border/70 bg-muted/20 p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-foreground">
                {educationEntries.length > 1
                  ? `Education #${index + 1}`
                  : "Education details"}
              </h2>
              {educationEntries.length > 1 ? (
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
              ) : null}
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor={`education-school-${index}`}
                  className="text-sm font-medium text-foreground"
                >
                  School*
                </Label>
                <Input
                  id={`education-school-${index}`}
                  value={entry.school || ""}
                  onChange={(event) =>
                    handleEducationFieldChange(index, "school", event.target.value)
                  }
                  placeholder="Ex. Boston University"
                  className="h-10 bg-background/70"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`education-degree-${index}`}
                  className="text-sm font-medium text-foreground"
                >
                  Degree
                </Label>
                <Input
                  id={`education-degree-${index}`}
                  value={entry.degree || ""}
                  onChange={(event) =>
                    handleEducationFieldChange(index, "degree", event.target.value)
                  }
                  placeholder="Ex. Bachelor of Science"
                  className="h-10 bg-background/70"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`education-field-${index}`}
                  className="text-sm font-medium text-foreground"
                >
                  Field of study
                </Label>
                <Input
                  id={`education-field-${index}`}
                  value={entry.field || ""}
                  onChange={(event) =>
                    handleEducationFieldChange(index, "field", event.target.value)
                  }
                  placeholder="Ex. Business"
                  className="h-10 bg-background/70"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Start date</Label>
                  <select
                    value={entry.startMonth || ""}
                    onChange={(event) =>
                      handleEducationFieldChange(index, "startMonth", event.target.value)
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary/70 focus:ring-2 focus:ring-primary/60"
                  >
                    <option value="">Month</option>
                    {MONTH_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground opacity-0">
                    Start year
                  </Label>
                  <select
                    value={entry.startYear || ""}
                    onChange={(event) =>
                      handleEducationFieldChange(index, "startYear", event.target.value)
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary/70 focus:ring-2 focus:ring-primary/60"
                  >
                    <option value="">Year</option>
                    {YEAR_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">
                    End date (or expected)
                  </Label>
                  <select
                    value={entry.endMonth || ""}
                    onChange={(event) =>
                      handleEducationFieldChange(index, "endMonth", event.target.value)
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary/70 focus:ring-2 focus:ring-primary/60"
                  >
                    <option value="">Month</option>
                    {MONTH_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground opacity-0">
                    End year
                  </Label>
                  <select
                    value={entry.endYear || entry.graduationYear || ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      handleEducationFieldChange(index, "endYear", value);
                      handleEducationFieldChange(index, "graduationYear", value);
                    }}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary/70 focus:ring-2 focus:ring-primary/60"
                  >
                    <option value="">Year</option>
                    {YEAR_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`education-grade-${index}`}
                  className="text-sm font-medium text-foreground"
                >
                  Grade
                </Label>
                <Input
                  id={`education-grade-${index}`}
                  value={entry.grade || ""}
                  maxLength={80}
                  onChange={(event) =>
                    handleEducationFieldChange(index, "grade", event.target.value)
                  }
                  className="h-10 bg-background/70"
                />
                <p className="text-right text-[11px] text-muted-foreground">
                  {String(entry.grade || "").length}/80
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`education-activities-${index}`}
                  className="text-sm font-medium text-foreground"
                >
                  Activities and societies
                </Label>
                <Textarea
                  id={`education-activities-${index}`}
                  value={entry.activities || ""}
                  maxLength={500}
                  rows={4}
                  onChange={(event) =>
                    handleEducationFieldChange(index, "activities", event.target.value)
                  }
                  placeholder="Ex: Alpha Phi Omega, Marching Band, Volleyball"
                  className="min-h-[110px] resize-y bg-background/70"
                />
                <p className="text-right text-[11px] text-muted-foreground">
                  {String(entry.activities || "").length}/500
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border/70 pt-4">
        <Button type="button" variant="outline" onClick={() => setModalType(null)}>
          Cancel
        </Button>
        <Button type="button" onClick={saveEducationSection} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
};

export default EducationModalContent;
