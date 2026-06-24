import { ChoiceGrid } from "./shared/AgencyFormComponents";
import { cn } from "@/shared/lib/utils";
import { ONBOARDING_PAGE_TITLE_CLASS } from "../typography";
import {
  AGENCY_CORE_ROLE_OPTIONS,
  AGENCY_TEAM_SIZE_OPTIONS,
  AGENCY_TIMEZONE_OPTIONS,
} from "../agency-details";

const normalizeSelectionList = (values = []) =>
  Array.isArray(values)
    ? values.map((value) => String(value || "").trim()).filter(Boolean)
    : [];

const toggleValueInList = (values, nextValue) => {
  const normalizedValue = String(nextValue || "").trim();
  if (!normalizedValue) {
    return normalizeSelectionList(values);
  }

  const currentValues = normalizeSelectionList(values);
  if (currentValues.includes(normalizedValue)) {
    return currentValues.filter((value) => value !== normalizedValue);
  }

  return [...currentValues, normalizedValue];
};

const AgencyTeamSlide = ({
  slide,
  agencyProfileForm,
  onAgencyFieldChange,
  agencyValidationErrors = {},
}) => {
  const teamSizeError = agencyValidationErrors.teamSize;
  const coreRolesError = agencyValidationErrors.coreRoles;
  const timezoneCoverageError = agencyValidationErrors.timezoneCoverage;

  return (
    <section className="mx-auto flex min-h-[68vh] w-full max-w-5xl flex-col items-center justify-center gap-5 mt-[20px] pb-12 sm:mt-0 sm:pb-0">
      <div className="w-full max-w-3xl text-center space-y-3">
        <h1 className={ONBOARDING_PAGE_TITLE_CLASS}>
          Who Is On <span className="font-serif italic font-light text-primary text-[1.05em] select-none">Your Team?</span>
        </h1>
        <p className="mx-auto max-w-2xl text-sm font-normal text-muted-foreground md:text-base">
          {slide?.description ||
            "Help clients understand the team size and core roles that will support their project."}
        </p>
      </div>

      <div className="relative w-full overflow-hidden rounded-[32px] border border-border bg-card px-5 py-7 shadow-[0_28px_100px_rgba(0,0,0,0.08)] dark:shadow-[0_28px_100px_rgba(0,0,0,0.34)] sm:px-10 sm:py-10 lg:px-14 lg:py-12">
        <div className="space-y-6">
          <ChoiceGrid
            label="Team Size"
            description="Pick the size range that best describes your agency."
            options={AGENCY_TEAM_SIZE_OPTIONS}
            selectedValues={agencyProfileForm.teamSize ? [agencyProfileForm.teamSize] : []}
            onToggle={(value) => onAgencyFieldChange("teamSize", value)}
            error={teamSizeError}
            gridClassName="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5"
          />

          <ChoiceGrid
            label="Core Roles"
            description="Select the roles your agency can cover in a normal delivery."
            options={AGENCY_CORE_ROLE_OPTIONS}
            selectedValues={normalizeSelectionList(agencyProfileForm.coreRoles)}
            onToggle={(value) =>
              onAgencyFieldChange(
                "coreRoles",
                toggleValueInList(agencyProfileForm.coreRoles, value),
              )
            }
            error={coreRolesError}
            gridClassName="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4"
          />

          <ChoiceGrid
            label="Timezone Coverage"
            description="Show how much overlap you typically have with clients."
            options={AGENCY_TIMEZONE_OPTIONS}
            selectedValues={
              agencyProfileForm.timezoneCoverage
                ? [agencyProfileForm.timezoneCoverage]
                : []
            }
            onToggle={(value) => onAgencyFieldChange("timezoneCoverage", value)}
            error={timezoneCoverageError}
            gridClassName="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
          />
        </div>
      </div>
    </section>
  );
};

export default AgencyTeamSlide;
