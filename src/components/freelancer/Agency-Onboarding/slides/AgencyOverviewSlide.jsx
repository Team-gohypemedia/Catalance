import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/shared/lib/utils";
import { ONBOARDING_FIELD_LABEL_CLASS } from "../typography";
import { CustomSelect } from "./shared/ServiceInfoComponents";
import { AGENCY_TYPE_OPTIONS } from "../agency-details";

const inputClassName =
  "h-14 rounded-[18px] border border-white/[0.04] bg-card px-5 !text-[14px] !leading-5 text-white shadow-none placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 focus-visible:border-primary/45 focus-visible:ring-primary/15";
const textAreaClassName =
  "min-h-[120px] rounded-[24px] border border-white/[0.04] bg-card px-5 py-4 !text-[14px] !leading-5 text-white shadow-none placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 focus-visible:border-primary/45 focus-visible:ring-primary/15";
const dangerFieldClassName =
  "border-destructive/75 text-destructive focus-visible:border-destructive focus-visible:ring-destructive/20";

const AgencyOverviewSlide = ({
  slide,
  agencyProfileForm,
  onAgencyFieldChange,
  agencyValidationErrors = {},
}) => {
  const companyNameError = agencyValidationErrors.companyName;
  const agencyTypeError = agencyValidationErrors.agencyType;
  const websiteError = agencyValidationErrors.website;
  const foundedYearError = agencyValidationErrors.foundedYear;
  const taglineError = agencyValidationErrors.tagline;

  const getFieldLabelClasses = (hasError) =>
    cn(
      ONBOARDING_FIELD_LABEL_CLASS,
      "mb-1 block",
      hasError && "!text-destructive",
    );

  const getInputClasses = (hasError, className) =>
    cn(inputClassName, hasError && dangerFieldClassName, className);

  const getTextAreaClasses = (hasError) =>
    cn(textAreaClassName, hasError && dangerFieldClassName);

  return (
    <section className="mx-auto flex min-h-[68vh] w-full max-w-5xl flex-col items-center justify-center gap-5 px-4 sm:px-6">
      <div className="w-full max-w-3xl text-center">
        <h1 className="text-xl font-medium text-primary md:text-4xl lg:text-5xl">
          {slide?.title || "Tell Us About Your Agency"}
        </h1>
        <p className="text-sm font-regular text-muted-foreground md:text-lg lg:text-base">
          {slide?.description ||
            "Share the public identity clients will see before they start a project with your team."}
        </p>
      </div>

      <div className="relative w-full overflow-hidden rounded-[32px] border border-white/[0.07] bg-[#0b0b0c] px-5 py-7 shadow-[0_28px_100px_rgba(0,0,0,0.34)] sm:px-10 sm:py-10 lg:px-14 lg:py-12">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className={getFieldLabelClasses(Boolean(companyNameError))}>
              Agency Name
            </Label>
            <Input
              value={agencyProfileForm.companyName}
              onChange={(event) =>
                onAgencyFieldChange("companyName", event.target.value)
              }
              placeholder="Acme Studio"
              className={getInputClasses(Boolean(companyNameError))}
            />
            {companyNameError ? (
              <p className="text-sm text-destructive">{companyNameError}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label className={getFieldLabelClasses(Boolean(agencyTypeError))}>
              Agency Type
            </Label>
            <CustomSelect
              value={agencyProfileForm.agencyType}
              onChange={(value) => onAgencyFieldChange("agencyType", value)}
              options={AGENCY_TYPE_OPTIONS}
              placeholder="Select agency type"
              hasError={Boolean(agencyTypeError)}
            />
            {agencyTypeError ? (
              <p className="text-sm text-destructive">{agencyTypeError}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label className={getFieldLabelClasses(Boolean(websiteError))}>
              Website
            </Label>
            <Input
              value={agencyProfileForm.website}
              onChange={(event) =>
                onAgencyFieldChange("website", event.target.value)
              }
              placeholder="https://youragency.com"
              className={getInputClasses(Boolean(websiteError))}
            />
            {websiteError ? (
              <p className="text-sm text-destructive">{websiteError}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label className={getFieldLabelClasses(Boolean(foundedYearError))}>
              Founded Year
            </Label>
            <Input
              value={agencyProfileForm.foundedYear}
              onChange={(event) =>
                onAgencyFieldChange("foundedYear", event.target.value)
              }
              placeholder="2021"
              inputMode="numeric"
              maxLength={4}
              className={getInputClasses(Boolean(foundedYearError))}
            />
            {foundedYearError ? (
              <p className="text-sm text-destructive">{foundedYearError}</p>
            ) : null}
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label className={getFieldLabelClasses(Boolean(taglineError))}>
              Agency Tagline
            </Label>
            <Textarea
              value={agencyProfileForm.tagline}
              onChange={(event) =>
                onAgencyFieldChange("tagline", event.target.value)
              }
              placeholder="What does your agency specialize in?"
              className={getTextAreaClasses(Boolean(taglineError))}
            />
            {taglineError ? (
              <p className="text-sm text-destructive">{taglineError}</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AgencyOverviewSlide;
