import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/shared/lib/utils";
import { ONBOARDING_FIELD_LABEL_CLASS } from "../typography";
import { ChoiceGrid } from "./shared/AgencyFormComponents";
import { CustomSelect } from "./shared/ServiceInfoComponents";
import {
  AGENCY_BUSINESS_REGISTRATION_OPTIONS,
  AGENCY_INDUSTRY_OPTIONS,
} from "../agency-details";

const inputClassName =
  "h-14 rounded-[18px] border border-white/[0.04] bg-card px-5 !text-[14px] !leading-5 text-white shadow-none placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 focus-visible:border-primary/45 focus-visible:ring-primary/15";
const textAreaClassName =
  "min-h-[120px] rounded-[24px] border border-white/[0.04] bg-card px-5 py-4 !text-[14px] !leading-5 text-white shadow-none placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 focus-visible:border-primary/45 focus-visible:ring-primary/15";
const dangerFieldClassName =
  "border-destructive/75 text-destructive focus-visible:border-destructive focus-visible:ring-destructive/20";

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

const AgencyTrustSlide = ({
  slide,
  agencyProfileForm,
  onAgencyFieldChange,
  agencyValidationErrors = {},
}) => {
  const industriesError = agencyValidationErrors.industries;
  const businessRegistrationError = agencyValidationErrors.businessRegistration;
  const registrationIdError = agencyValidationErrors.registrationId;
  const certificationsError = agencyValidationErrors.certifications;

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
          {slide?.title || "Build Trust With Clients"}
        </h1>
        <p className="text-sm font-regular text-muted-foreground md:text-lg lg:text-base">
          {slide?.description ||
            "Add the industries you serve and the business details that make your agency feel established."}
        </p>
      </div>

      <div className="relative w-full overflow-hidden rounded-[32px] border border-white/[0.07] bg-[#0b0b0c] px-5 py-7 shadow-[0_28px_100px_rgba(0,0,0,0.34)] sm:px-10 sm:py-10 lg:px-14 lg:py-12">
        <div className="space-y-6">
          <ChoiceGrid
            label="Industries Served"
            description="Select the industries your agency works in most often."
            options={AGENCY_INDUSTRY_OPTIONS}
            selectedValues={normalizeSelectionList(agencyProfileForm.industries)}
            onToggle={(value) =>
              onAgencyFieldChange(
                "industries",
                toggleValueInList(agencyProfileForm.industries, value),
              )
            }
            error={industriesError}
            gridClassName="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5"
          />

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label
                className={getFieldLabelClasses(
                  Boolean(businessRegistrationError),
                )}
              >
                Business Registration Status
              </Label>
              <CustomSelect
                value={agencyProfileForm.businessRegistration}
                onChange={(value) =>
                  onAgencyFieldChange("businessRegistration", value)
                }
                options={AGENCY_BUSINESS_REGISTRATION_OPTIONS}
                placeholder="Select registration status"
                hasError={Boolean(businessRegistrationError)}
              />
              {businessRegistrationError ? (
                <p className="text-sm text-destructive">
                  {businessRegistrationError}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label className={getFieldLabelClasses(Boolean(registrationIdError))}>
                Registration ID
              </Label>
              <Input
                value={agencyProfileForm.registrationId}
                onChange={(event) =>
                  onAgencyFieldChange("registrationId", event.target.value)
                }
                placeholder="Optional business or tax ID"
                className={getInputClasses(Boolean(registrationIdError))}
              />
              {registrationIdError ? (
                <p className="text-sm text-destructive">{registrationIdError}</p>
              ) : null}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label className={getFieldLabelClasses(Boolean(certificationsError))}>
                Certifications or Credentials
              </Label>
              <Textarea
                value={agencyProfileForm.certifications}
                onChange={(event) =>
                  onAgencyFieldChange("certifications", event.target.value)
                }
                placeholder="Comma-separated certifications, memberships, awards, or compliance notes"
                className={getTextAreaClasses(Boolean(certificationsError))}
              />
              {certificationsError ? (
                <p className="text-sm text-destructive">{certificationsError}</p>
              ) : null}
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-card px-4 py-4 md:col-span-2">
              <Checkbox
                checked={Boolean(agencyProfileForm.ndaAvailable)}
                onCheckedChange={(checked) =>
                  onAgencyFieldChange("ndaAvailable", checked === true)
                }
              />
              <span className="flex flex-col">
                <span className="text-sm font-semibold text-white">
                  NDA Available
                </span>
                <span className="text-sm leading-6 text-white/55">
                  Mark this if your team can sign a non-disclosure agreement.
                </span>
              </span>
            </label>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AgencyTrustSlide;
