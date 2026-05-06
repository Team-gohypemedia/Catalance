import { Label } from "@/components/ui/label";
import { ONBOARDING_FIELD_LABEL_CLASS } from "../typography";
import { CustomSelect } from "./shared/ServiceInfoComponents";
import {
  AGENCY_COLLABORATION_STYLE_OPTIONS,
  AGENCY_RESPONSE_TIME_OPTIONS,
} from "../agency-details";

const AgencyOperationsSlide = ({
  slide,
  agencyProfileForm,
  onAgencyFieldChange,
  agencyValidationErrors = {},
}) => {
  const responseTimeError = agencyValidationErrors.responseTime;
  const collaborationStyleError = agencyValidationErrors.collaborationStyle;

  const getFieldLabelClasses = (hasError) =>
    [
      ONBOARDING_FIELD_LABEL_CLASS,
      "mb-1 block",
      hasError ? "!text-destructive" : "",
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <section className="mx-auto flex min-h-[68vh] w-full max-w-5xl flex-col items-center justify-center gap-5 px-4 sm:px-6">
      <div className="w-full max-w-3xl text-center">
        <h1 className="text-xl font-medium text-primary md:text-4xl lg:text-5xl">
          {slide?.title || "How Do You Deliver Projects?"}
        </h1>
        <p className="text-sm font-regular text-muted-foreground md:text-lg lg:text-base">
          {slide?.description ||
            "Tell clients how quickly your team responds and how you prefer to collaborate."}
        </p>
      </div>

      <div className="relative w-full overflow-hidden rounded-[32px] border border-white/[0.07] bg-[#0b0b0c] px-5 py-7 shadow-[0_28px_100px_rgba(0,0,0,0.34)] sm:px-10 sm:py-10 lg:px-14 lg:py-12">
        <div className="grid gap-5">
          <div className="space-y-1.5">
            <Label className={getFieldLabelClasses(Boolean(responseTimeError))}>
              Response Time
            </Label>
            <CustomSelect
              value={agencyProfileForm.responseTime}
              onChange={(value) => onAgencyFieldChange("responseTime", value)}
              options={AGENCY_RESPONSE_TIME_OPTIONS}
              placeholder="Select response time"
              hasError={Boolean(responseTimeError)}
            />
            {responseTimeError ? (
              <p className="text-sm text-destructive">{responseTimeError}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label className={getFieldLabelClasses(Boolean(collaborationStyleError))}>
              Collaboration Style
            </Label>
            <CustomSelect
              value={agencyProfileForm.collaborationStyle}
              onChange={(value) =>
                onAgencyFieldChange("collaborationStyle", value)
              }
              options={AGENCY_COLLABORATION_STYLE_OPTIONS}
              placeholder="Select collaboration style"
              hasError={Boolean(collaborationStyleError)}
            />
            {collaborationStyleError ? (
              <p className="text-sm text-destructive">
                {collaborationStyleError}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AgencyOperationsSlide;
