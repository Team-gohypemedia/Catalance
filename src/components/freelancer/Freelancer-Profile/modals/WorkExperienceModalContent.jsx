import { useState } from "react";
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
import { getFallbackStateOptions } from "@/components/features/freelancer/onboarding/constants";

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

  const parseLocationParts = () => {
    const parts = String(workForm.location || "")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    return {
      state: parts.length >= 2 ? parts[0] : "",
      country: parts.length >= 2 ? parts.slice(1).join(", ") : parts[0] || "",
    };
  };

  const [selectedCountry, setSelectedCountry] = useState(() => {
    const parsedLocation = parseLocationParts();
    return String(workForm.country || parsedLocation.country || "").trim();
  });

  const [selectedState, setSelectedState] = useState(() => {
    const parsedLocation = parseLocationParts();
    return String(workForm.state || parsedLocation.state || "").trim();
  });

  const countryOptions = ["India", "United States", "United Kingdom"];
  const displayCountries = countryOptions.includes(selectedCountry) || !selectedCountry
    ? countryOptions
    : [...countryOptions, selectedCountry];

  const stateOptions = getFallbackStateOptions(selectedCountry);
  const displayStates = stateOptions.includes(selectedState) || !selectedState
    ? stateOptions
    : [...stateOptions, selectedState];

  const handleCountryChange = (country) => {
    setSelectedCountry(country);
    setSelectedState("");
    setWorkForm((prev) => ({
      ...prev,
      country,
      state: "",
      location: country,
    }));
  };

  const handleStateChange = (state) => {
    setSelectedState(state);
    const newLocation = [state, selectedCountry].filter(Boolean).join(", ");
    setWorkForm((prev) => ({
      ...prev,
      country: selectedCountry,
      state,
      location: newLocation,
    }));
  };

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
            className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 placeholder:text-[13px] focus:border-primary/70 focus:ring-2 focus:ring-primary/50 dark:bg-background"
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
            <SelectTrigger className="h-11 w-full rounded-lg border-input bg-background px-3 text-sm text-foreground shadow-none data-[placeholder]:text-muted-foreground/50 data-[placeholder]:text-[13px] dark:bg-background">
              <SelectValue placeholder="Select employment type" />
            </SelectTrigger>
            <SelectContent position="popper">
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
            placeholder="e.g. Enter company name"
            className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 placeholder:text-[13px] focus:border-primary/70 focus:ring-2 focus:ring-primary/50 dark:bg-background"
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
                <SelectTrigger className="h-11 w-full rounded-lg border-input bg-background px-3 text-sm text-foreground shadow-none data-[placeholder]:text-muted-foreground/50 data-[placeholder]:text-[13px] dark:bg-background">
                  <SelectValue placeholder="Month*" />
                </SelectTrigger>
                <SelectContent position="popper">
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
                <SelectTrigger className="h-11 w-full rounded-lg border-input bg-background px-3 text-sm text-foreground shadow-none data-[placeholder]:text-muted-foreground/50 data-[placeholder]:text-[13px] dark:bg-background">
                  <SelectValue placeholder="Year*" />
                </SelectTrigger>
                <SelectContent position="popper">
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
                  <SelectTrigger className="h-11 w-full rounded-lg border-input bg-background px-3 text-sm text-foreground shadow-none data-[placeholder]:text-muted-foreground/50 data-[placeholder]:text-[13px] dark:bg-background">
                    <SelectValue placeholder="Month*" />
                  </SelectTrigger>
                  <SelectContent position="popper">
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
                  <SelectTrigger className="h-11 w-full rounded-lg border-input bg-background px-3 text-sm text-foreground shadow-none data-[placeholder]:text-muted-foreground/50 data-[placeholder]:text-[13px] dark:bg-background">
                    <SelectValue placeholder="Year*" />
                  </SelectTrigger>
                  <SelectContent position="popper">
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

        <div className="grid grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Country</span>
            <Select
              value={selectedCountry}
              onValueChange={handleCountryChange}
            >
              <SelectTrigger className="h-11 w-full rounded-lg border-input bg-background px-3 text-sm text-foreground shadow-none data-[placeholder]:text-muted-foreground/50 data-[placeholder]:text-[13px] dark:bg-background">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent position="popper">
                {displayCountries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">State</span>
            <Select
              value={selectedState}
              onValueChange={handleStateChange}
              disabled={!selectedCountry || displayStates.length === 0}
            >
              <SelectTrigger className="h-11 w-full rounded-lg border-input bg-background px-3 text-sm text-foreground shadow-none data-[placeholder]:text-muted-foreground/50 data-[placeholder]:text-[13px] dark:bg-background">
                <SelectValue placeholder={selectedCountry ? "Select state" : "Select country first"} />
              </SelectTrigger>
              <SelectContent position="popper">
                {displayStates.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>

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
            <SelectTrigger className="h-11 w-full rounded-lg border-input bg-background px-3 text-sm text-foreground shadow-none data-[placeholder]:text-muted-foreground/50 data-[placeholder]:text-[13px] dark:bg-background">
              <SelectValue placeholder="Select location type" />
            </SelectTrigger>
            <SelectContent position="popper">
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
        </label>
      </div>

      <div className="sticky -bottom-6 -mx-6 mt-6 flex items-center justify-end gap-3 border-t border-border/70 bg-card px-6 py-4 z-10 rounded-b-2xl">
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
