import { useEffect, useMemo, useState } from "react";
import Eye from "lucide-react/dist/esm/icons/eye";
import Layers3 from "lucide-react/dist/esm/icons/layers-3";
import MessageSquareCode from "lucide-react/dist/esm/icons/message-square-code";
import MoveDown from "lucide-react/dist/esm/icons/move-down";
import MoveUp from "lucide-react/dist/esm/icons/move-up";
import Plus from "lucide-react/dist/esm/icons/plus";
import Save from "lucide-react/dist/esm/icons/save";
import Settings2 from "lucide-react/dist/esm/icons/settings-2";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import Wand2 from "lucide-react/dist/esm/icons/wand-2";
import { toast } from "sonner";

import AdminLayout from "./AdminLayout";
import { AdminTopBar } from "./AdminTopBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/shared/context/AuthContext";
import {
  BASIC_PROFILE_FIELD_DATA_SOURCES,
  BASIC_PROFILE_FIELD_TYPES,
  DEFAULT_FREELANCER_ONBOARDING_CONTENT,
  mergeOnboardingContent,
  resolveBasicProfileFields,
  resolveCaseStudyFields,
  resolveServiceInfoFields,
  resolveServicePricingFields,
  resolveServiceVisualFields,
} from "@/shared/lib/freelancer-onboarding-content";

const cloneContent = (value) => JSON.parse(JSON.stringify(value));

const SECTION_ORDER = [
  "basicProfile",
  "stepper",
  "serviceSetup",
  "serviceInfo",
  "servicePricing",
  "serviceVisuals",
  "caseStudy",
];

const SECTION_META = {
  basicProfile: {
    title: "Basic Profile",
    description: "Profile intro, labels, placeholders, and helper copy shown before service setup.",
  },
  stepper: {
    title: "Stepper",
    description: "Labels and order shown in the service onboarding stepper.",
  },
  serviceSetup: {
    title: "Service Setup",
    description: "Intro screen shown before a freelancer fills the details for a selected service.",
  },
  serviceInfo: {
    title: "Service Info",
    description: "Title, category, and experience copy used on the first service details step.",
  },
  servicePricing: {
    title: "Pricing",
    description: "Labels and options for description, delivery timeline, and starting price.",
  },
  serviceVisuals: {
    title: "Visuals",
    description: "Copy shown while the freelancer uploads media.",
  },
  caseStudy: {
    title: "Case Study",
    description: "All labels, helper text, and dropdown options for the portfolio case study step.",
  },
};

const OPTION_EMPTY = { value: "", label: "" };
const STEPPER_EMPTY = { id: "", label: "", step: 1 };
const CUSTOM_PROFILE_FIELD_TYPES = BASIC_PROFILE_FIELD_TYPES.filter(
  (type) => type !== "file" && type !== "image",
);
const CUSTOM_SERVICE_FIELD_TYPES = ["text", "textarea", "select"];
const EMPTY_MARKETPLACE_FILTERS = {
  services: [],
  niches: [],
};

const buildFieldMapById = (fields = []) =>
  (Array.isArray(fields) ? fields : []).reduce((accumulator, field) => {
    const fieldId = String(field?.id || "").trim();
    if (!fieldId) {
      return accumulator;
    }

    accumulator[fieldId] = { ...field };
    return accumulator;
  }, {});

const createEmptyOptions = (count = 2) =>
  Array.from({ length: count }, () => ({ ...OPTION_EMPTY }));

const normalizeEditorContent = (value) => {
  const merged = mergeOnboardingContent(
    DEFAULT_FREELANCER_ONBOARDING_CONTENT,
    value || {},
  );
  const serviceInfoFieldList = resolveServiceInfoFields(merged);
  const servicePricingFieldList = resolveServicePricingFields(merged);
  const serviceVisualFieldList = resolveServiceVisualFields(merged);
  const caseStudyFieldList = resolveCaseStudyFields(merged);

  return {
    ...merged,
    basicProfile: {
      ...(merged.basicProfile || {}),
      fields: resolveBasicProfileFields(merged),
    },
    serviceInfo: {
      ...(merged.serviceInfo || {}),
      fields: buildFieldMapById(serviceInfoFieldList),
      fieldList: serviceInfoFieldList,
    },
    servicePricing: {
      ...(merged.servicePricing || {}),
      fields: buildFieldMapById(servicePricingFieldList),
      fieldList: servicePricingFieldList,
    },
    serviceVisuals: {
      ...(merged.serviceVisuals || {}),
      fieldList: serviceVisualFieldList,
    },
    caseStudy: {
      ...(merged.caseStudy || {}),
      fields: buildFieldMapById(caseStudyFieldList),
      fieldList: caseStudyFieldList,
    },
  };
};

const normalizeMarketplaceFilters = (value, availableServices = []) => {
  const payload =
    value && typeof value === "object" && !Array.isArray(value)
      ? value
      : EMPTY_MARKETPLACE_FILTERS;
  const serviceNameById = new Map(
    (Array.isArray(availableServices) ? availableServices : []).map((service) => [
      Number(service?.id),
      String(service?.name || "").trim(),
    ]),
  );

  const seenServiceIds = new Set();
  const services = [];

  for (const service of Array.isArray(payload.services) ? payload.services : []) {
    const serviceId = Number(service?.id);
    if (!Number.isInteger(serviceId) || serviceId <= 0 || seenServiceIds.has(serviceId)) {
      continue;
    }

    seenServiceIds.add(serviceId);
    services.push({
      id: serviceId,
      key: String(service?.key || "").trim(),
      name: String(service?.name || serviceNameById.get(serviceId) || "").trim(),
      subCategories: (Array.isArray(service?.subCategories) ? service.subCategories : []).map(
        (subCategory) => ({
          id: Number.isInteger(Number(subCategory?.id)) ? Number(subCategory.id) : null,
          name: String(subCategory?.name || "").trim(),
          tools: (Array.isArray(subCategory?.tools) ? subCategory.tools : []).map((tool) => ({
            id: Number.isInteger(Number(tool?.id)) ? Number(tool.id) : null,
            name: String(tool?.name || "").trim(),
          })),
        }),
      ),
    });
  }

  for (const service of Array.isArray(availableServices) ? availableServices : []) {
    const serviceId = Number(service?.id);
    if (!Number.isInteger(serviceId) || serviceId <= 0 || seenServiceIds.has(serviceId)) {
      continue;
    }

    services.push({
      id: serviceId,
      key: String(service?.key || "").trim(),
      name: String(service?.name || "").trim(),
      subCategories: [],
    });
  }

  const niches = (Array.isArray(payload.niches) ? payload.niches : []).map((niche) => ({
    id: Number.isInteger(Number(niche?.id)) ? Number(niche.id) : null,
    name: String(niche?.name || "").trim(),
  }));

  return { services, niches };
};

const setNestedValue = (source, path, nextValue) => {
  const segments = Array.isArray(path) ? path : String(path).split(".");
  const root = Array.isArray(source) ? [...source] : { ...source };
  let current = root;

  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    const nextSource = current?.[segment];
    const clonedNext = Array.isArray(nextSource)
      ? [...nextSource]
      : nextSource && typeof nextSource === "object"
        ? { ...nextSource }
        : {};
    current[segment] = clonedNext;
    current = clonedNext;
  }

  current[segments[segments.length - 1]] = nextValue;
  return root;
};

const SummaryChip = ({ label, value, tone = "default" }) => (
  <div
    className={`rounded-2xl border px-3.5 py-3 ${
      tone === "accent"
        ? "border-primary/25 bg-primary/10"
        : "border-border bg-card"
    }`}
  >
    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/70">
      {label}
    </p>
    <p className="mt-2 text-xl font-semibold tracking-tight text-foreground">{value}</p>
  </div>
);

const SectionCard = ({ title, description, children }) => (
  <Card className="rounded-[24px] border border-border bg-card shadow-[0_18px_44px_rgba(0,0,0,0.08)]">
    <CardHeader className="space-y-2 border-b border-border pb-4">
      <CardTitle className="text-lg font-semibold tracking-tight text-foreground">{title}</CardTitle>
      <CardDescription className="text-sm leading-6 text-muted-foreground">
        {description}
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-5 pt-5">{children}</CardContent>
  </Card>
);

const FieldGrid = ({ children }) => (
  <div className="grid gap-4 md:grid-cols-2">{children}</div>
);

const TextField = ({ label, value, onChange, placeholder = "", disabled = false }) => (
  <div className="space-y-2">
    <Label className="text-sm font-medium text-foreground">{label}</Label>
    <Input
      value={value || ""}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="border-border bg-card text-foreground placeholder:text-muted-foreground"
    />
  </div>
);

const TextAreaField = ({ label, value, onChange, placeholder = "", rows = 4 }) => (
  <div className="space-y-2">
    <Label className="text-sm font-medium text-foreground">{label}</Label>
    <Textarea
      value={value || ""}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="border-border bg-card text-foreground placeholder:text-muted-foreground"
    />
  </div>
);

const ToggleField = ({ label, checked, onChange }) => (
  <label className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-muted/40 px-4 py-3">
    <span className="text-sm font-medium text-foreground">{label}</span>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`inline-flex h-7 w-12 items-center rounded-full p-1 transition ${
        checked ? "bg-primary" : "bg-muted"
      }`}
    >
      <span
        className={`size-5 rounded-full bg-background transition ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  </label>
);

const SchemaFieldListEditor = ({
  title,
  description,
  fields = [],
  onChange,
  allowAdd = true,
  emptyLabel = "No questions yet.",
}) => {
  const handleFieldChange = (index, nextPatch) => {
    onChange(
      fields.map((field, fieldIndex) =>
        fieldIndex === index ? { ...field, ...nextPatch } : field,
      ),
    );
  };

  const handleMove = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= fields.length) {
      return;
    }

    const nextFields = [...fields];
    const [field] = nextFields.splice(index, 1);
    nextFields.splice(nextIndex, 0, field);
    onChange(nextFields);
  };

  const handleDelete = (index) => {
    onChange(fields.filter((_, fieldIndex) => fieldIndex !== index));
  };

  const handleAdd = () => {
    onChange([
      ...fields,
      {
        id: `custom_field_${fields.length + 1}`,
        type: "text",
        label: "New Question",
        placeholder: "",
        helperText: "",
        searchPlaceholder: "",
        required: false,
        visible: true,
        system: false,
        canDelete: true,
        options: [],
      },
    ]);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-muted/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {allowAdd ? (
          <Button type="button" onClick={handleAdd} className="rounded-full px-4">
            <Plus className="mr-2 h-4 w-4" />
            Add Question
          </Button>
        ) : null}
      </div>

      {fields.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
          {emptyLabel}
        </div>
      ) : (
        <div className="space-y-4">
          {fields.map((field, index) => {
            const supportsOptions =
              field.type === "select" || field.type === "multiselect";
            const isSystem = Boolean(field.system);

            return (
              <div
                key={`${field.id}-${index}`}
                className="space-y-4 rounded-[22px] border border-border bg-card p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <Badge
                      variant="outline"
                      className="rounded-full border-border bg-muted/40 text-muted-foreground"
                    >
                      {field.type}
                    </Badge>
                    {isSystem ? (
                      <Badge className="rounded-full bg-primary/15 text-primary">
                        System
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="rounded-full border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                      >
                        Custom
                      </Badge>
                    )}
                    <span className="truncate text-sm font-semibold text-foreground">
                      {field.label || field.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleMove(index, -1)}
                      disabled={index === 0}
                      className="border-border bg-muted/40"
                    >
                      <MoveUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleMove(index, 1)}
                      disabled={index === fields.length - 1}
                      className="border-border bg-muted/40"
                    >
                      <MoveDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(index)}
                      disabled={!field.canDelete}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <FieldGrid>
                  <TextField
                    label="Question Id"
                    value={field.id}
                    onChange={(value) => handleFieldChange(index, { id: value })}
                    disabled={isSystem}
                  />
                  <TextField
                    label="Label"
                    value={field.label}
                    onChange={(value) => handleFieldChange(index, { label: value })}
                  />
                </FieldGrid>

                <FieldGrid>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Field Type</Label>
                    <Select
                      value={field.type}
                      onValueChange={(value) =>
                        handleFieldChange(index, {
                          type: value,
                          options:
                            value === "select"
                              ? Array.isArray(field.options) && field.options.length > 0
                                ? field.options
                                : createEmptyOptions()
                              : [],
                          searchPlaceholder: value === "select" ? field.searchPlaceholder || "" : "",
                        })
                      }
                      disabled={isSystem}
                    >
                      <SelectTrigger className="w-full border-border bg-card text-foreground">
                        <SelectValue placeholder="Choose field type" />
                      </SelectTrigger>
                      <SelectContent position="popper" className="z-[120]">
                        {(isSystem
                          ? BASIC_PROFILE_FIELD_TYPES
                          : CUSTOM_SERVICE_FIELD_TYPES
                        ).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <TextField
                    label="Placeholder"
                    value={field.placeholder}
                    onChange={(value) => handleFieldChange(index, { placeholder: value })}
                  />
                </FieldGrid>

                <TextAreaField
                  label="Helper Text"
                  value={field.helperText}
                  onChange={(value) => handleFieldChange(index, { helperText: value })}
                  rows={3}
                />

                {supportsOptions ? (
                  <>
                    <TextField
                      label="Search Placeholder"
                      value={field.searchPlaceholder}
                      onChange={(value) =>
                        handleFieldChange(index, { searchPlaceholder: value })
                      }
                    />
                    <OptionListEditor
                      title="Options"
                      description="Selectable answers for this question."
                      options={field.options || []}
                      onChange={(nextOptions) =>
                        handleFieldChange(index, { options: nextOptions })
                      }
                    />
                  </>
                ) : null}

                <div className="grid gap-3 md:grid-cols-2">
                  <ToggleField
                    label="Visible In Onboarding"
                    checked={field.visible !== false}
                    onChange={(value) => handleFieldChange(index, { visible: value })}
                  />
                  <ToggleField
                    label="Required"
                    checked={Boolean(field.required)}
                    onChange={(value) => handleFieldChange(index, { required: value })}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const BasicProfileFieldBuilder = ({ fields = [], onChange }) => {
  const handleFieldChange = (index, nextPatch) => {
    onChange(
      fields.map((field, fieldIndex) =>
        fieldIndex === index ? { ...field, ...nextPatch } : field,
      ),
    );
  };

  const handleFieldOptionChange = (index, options) => {
    handleFieldChange(index, { options });
  };

  const handleMove = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= fields.length) {
      return;
    }

    const nextFields = [...fields];
    const [field] = nextFields.splice(index, 1);
    nextFields.splice(nextIndex, 0, field);
    onChange(nextFields);
  };

  const handleDelete = (index) => {
    onChange(fields.filter((_, fieldIndex) => fieldIndex !== index));
  };

  const handleAdd = () => {
    onChange([
      ...fields,
      {
        id: `custom_field_${fields.length + 1}`,
        type: "text",
        label: "New Field",
        placeholder: "",
        helperText: "",
        required: false,
        visible: true,
        system: false,
        canDelete: true,
        dataSource: "manual",
        options: [],
      },
    ]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-4">
        <div>
          <h4 className="text-sm font-semibold text-foreground">Profile Fields</h4>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Reorder fields, hide system fields, and add new custom text/select fields.
          </p>
        </div>
        <Button type="button" onClick={handleAdd} className="rounded-full px-4">
          <Plus className="mr-2 h-4 w-4" />
          Add Field
        </Button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => {
          const supportsOptions =
            field.type === "select" || field.type === "multiselect";
          const isSystem = Boolean(field.system);

          return (
            <div
              key={`${field.id}-${index}`}
              className="space-y-4 rounded-[24px] border border-border bg-card p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Badge
                    variant="outline"
                    className="rounded-full border-border bg-muted/40 text-muted-foreground"
                  >
                    {field.type}
                  </Badge>
                  {isSystem ? (
                    <Badge className="rounded-full bg-primary/15 text-primary">
                      System
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="rounded-full border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                    >
                      Custom
                    </Badge>
                  )}
                  <span className="truncate text-sm font-semibold text-foreground">
                    {field.label || field.id}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleMove(index, -1)}
                    disabled={index === 0}
                    className="border-border bg-muted/40"
                  >
                    <MoveUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleMove(index, 1)}
                    disabled={index === fields.length - 1}
                    className="border-border bg-muted/40"
                  >
                    <MoveDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(index)}
                    disabled={!field.canDelete}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <FieldGrid>
                <TextField
                  label="Field Id"
                  value={field.id}
                  onChange={(value) => handleFieldChange(index, { id: value })}
                  disabled={isSystem}
                />
                <TextField
                  label="Label"
                  value={field.label}
                  onChange={(value) => handleFieldChange(index, { label: value })}
                />
              </FieldGrid>

              <FieldGrid>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Field Type</Label>
                  <Select
                    value={field.type}
                    onValueChange={(value) =>
                      handleFieldChange(index, {
                        type: value,
                        dataSource:
                          value === "select" || value === "multiselect"
                            ? field.dataSource || "manual"
                            : "manual",
                      })
                    }
                    disabled={isSystem}
                  >
                    <SelectTrigger className="border-border bg-card text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(isSystem ? BASIC_PROFILE_FIELD_TYPES : CUSTOM_PROFILE_FIELD_TYPES).map(
                        (type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <TextField
                  label="Placeholder"
                  value={field.placeholder}
                  onChange={(value) => handleFieldChange(index, { placeholder: value })}
                />
              </FieldGrid>

              <TextAreaField
                label="Helper Text"
                value={field.helperText}
                onChange={(value) => handleFieldChange(index, { helperText: value })}
                rows={3}
              />

              {field.type === "text" ? (
                <TextField
                  label="Prefix"
                  value={field.prefix}
                  onChange={(value) => handleFieldChange(index, { prefix: value })}
                />
              ) : null}

              {field.type === "image" ? (
                <FieldGrid>
                  <TextField
                    label="Camera Action Label"
                    value={field.menuCameraLabel}
                    onChange={(value) => handleFieldChange(index, { menuCameraLabel: value })}
                  />
                  <TextField
                    label="Upload Action Label"
                    value={field.menuUploadLabel}
                    onChange={(value) => handleFieldChange(index, { menuUploadLabel: value })}
                  />
                </FieldGrid>
              ) : null}

              {field.type === "file" ? (
                <FieldGrid>
                  <TextField
                    label="Browse Button Label"
                    value={field.browseLabel}
                    onChange={(value) => handleFieldChange(index, { browseLabel: value })}
                  />
                  <TextField
                    label="Remove Button Label"
                    value={field.removeLabel}
                    onChange={(value) => handleFieldChange(index, { removeLabel: value })}
                  />
                </FieldGrid>
              ) : null}

              {field.id === "state" ? (
                <FieldGrid>
                  <TextField
                    label="Waiting Label"
                    value={field.selectCountryFirstLabel}
                    onChange={(value) =>
                      handleFieldChange(index, { selectCountryFirstLabel: value })
                    }
                  />
                  <TextField
                    label="Loading Label"
                    value={field.loadingLabel}
                    onChange={(value) => handleFieldChange(index, { loadingLabel: value })}
                  />
                </FieldGrid>
              ) : null}

              {field.id === "state" ? (
                <FieldGrid>
                  <TextField
                    label="Select Placeholder"
                    value={field.selectPlaceholder}
                    onChange={(value) =>
                      handleFieldChange(index, { selectPlaceholder: value })
                    }
                  />
                  <TextField
                    label="Input Placeholder"
                    value={field.inputPlaceholder}
                    onChange={(value) =>
                      handleFieldChange(index, { inputPlaceholder: value })
                    }
                  />
                </FieldGrid>
              ) : null}

              {supportsOptions ? (
                <div className="space-y-4 rounded-2xl border border-border bg-muted/40 p-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Options Source</Label>
                    <Select
                      value={field.dataSource || "manual"}
                      onValueChange={(value) =>
                        handleFieldChange(index, { dataSource: value })
                      }
                    >
                      <SelectTrigger className="border-border bg-card text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BASIC_PROFILE_FIELD_DATA_SOURCES.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {field.dataSource === "manual" ? (
                    <OptionListEditor
                      title="Field Options"
                      description="Manual options shown for this field."
                      options={field.options || []}
                      onChange={(nextOptions) => handleFieldOptionChange(index, nextOptions)}
                    />
                  ) : null}
                </div>
              ) : null}

              <div className="grid gap-3 md:grid-cols-2">
                <ToggleField
                  label="Visible In Onboarding"
                  checked={field.visible !== false}
                  onChange={(value) => handleFieldChange(index, { visible: value })}
                />
                <ToggleField
                  label="Required"
                  checked={Boolean(field.required)}
                  onChange={(value) => handleFieldChange(index, { required: value })}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const OptionListEditor = ({ title, description, options = [], onChange }) => {
  const handleOptionChange = (index, field, value) => {
    const nextOptions = options.map((option, optionIndex) =>
      optionIndex === index ? { ...option, [field]: value } : option,
    );
    onChange(nextOptions);
  };

  const handleRemove = (index) => {
    onChange(options.filter((_, optionIndex) => optionIndex !== index));
  };

  const handleAdd = () => {
    onChange([...(Array.isArray(options) ? options : []), { ...OPTION_EMPTY }]);
  };

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-muted/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleAdd} className="border-border bg-muted/40">
          Add Option
        </Button>
      </div>

      <div className="space-y-3">
        {options.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
            No options yet.
          </div>
        ) : (
          options.map((option, index) => (
            <div
              key={`${option?.value || "option"}-${index}`}
              className="grid gap-3 rounded-2xl border border-border bg-card p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
            >
              <Input
                value={option?.label || ""}
                onChange={(event) => handleOptionChange(index, "label", event.target.value)}
                placeholder="Option label"
                className="border-border bg-transparent text-foreground placeholder:text-muted-foreground"
              />
              <Input
                value={option?.value || ""}
                onChange={(event) => handleOptionChange(index, "value", event.target.value)}
                placeholder="Option value"
                className="border-border bg-transparent text-foreground placeholder:text-muted-foreground"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(index)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const KeyedOptionMapEditor = ({
  title,
  description,
  options = [],
  value = {},
  onChange,
  emptyLabel = "No items yet.",
}) => {
  const normalizedOptions = Array.isArray(options) ? options : [];
  const normalizedValue =
    value && typeof value === "object" && !Array.isArray(value) ? value : {};

  const handleItemChange = (optionValue, nextItems) => {
    onChange({
      ...normalizedValue,
      [optionValue]: nextItems,
    });
  };

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-muted/40 p-4">
      <div>
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>

      {normalizedOptions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
          Add category options first.
        </div>
      ) : (
        <div className="space-y-4">
          {normalizedOptions.map((option) => {
            const optionValue = String(option?.value || "").trim();
            const optionLabel = String(option?.label || optionValue).trim() || optionValue;
            if (!optionValue) {
              return null;
            }

            return (
              <OptionListEditor
                key={optionValue}
                title={optionLabel}
                description={emptyLabel}
                options={Array.isArray(normalizedValue[optionValue]) ? normalizedValue[optionValue] : []}
                onChange={(nextItems) => handleItemChange(optionValue, nextItems)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

const NameListEditor = ({
  title,
  description,
  items = [],
  onChange,
  addLabel = "Add Item",
  emptyLabel = "No items yet.",
  inputPlaceholder = "Name",
}) => {
  const handleItemChange = (index, value) => {
    onChange(
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, name: value } : item,
      ),
    );
  };

  const handleAdd = () => {
    onChange([...(Array.isArray(items) ? items : []), { id: null, name: "" }]);
  };

  const handleRemove = (index) => {
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-muted/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="border-border bg-muted/40"
        >
          {addLabel}
        </Button>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
            {emptyLabel}
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={`${item?.id || "item"}-${index}`}
              className="grid gap-3 rounded-2xl border border-border bg-card p-3 md:grid-cols-[minmax(0,1fr)_auto]"
            >
              <Input
                value={item?.name || ""}
                onChange={(event) => handleItemChange(index, event.target.value)}
                placeholder={inputPlaceholder}
                className="border-border bg-transparent text-foreground placeholder:text-muted-foreground"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(index)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const MarketplaceServiceTaxonomyEditor = ({ service, onChange }) => {
  const subCategories = Array.isArray(service?.subCategories) ? service.subCategories : [];

  const handleCategoryChange = (index, nextPatch) => {
    onChange({
      ...service,
      subCategories: subCategories.map((subCategory, subCategoryIndex) =>
        subCategoryIndex === index ? { ...subCategory, ...nextPatch } : subCategory,
      ),
    });
  };

  const handleCategoryToolsChange = (index, nextTools) => {
    handleCategoryChange(index, { tools: nextTools });
  };

  const handleAddCategory = () => {
    onChange({
      ...service,
      subCategories: [...subCategories, { id: null, name: "", tools: [] }],
    });
  };

  const handleRemoveCategory = (index) => {
    onChange({
      ...service,
      subCategories: subCategories.filter((_, subCategoryIndex) => subCategoryIndex !== index),
    });
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-muted/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-foreground">Marketplace Categories</h4>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            These categories and skills come from the real marketplace tables and drive onboarding for this service.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddCategory}
          className="border-border bg-muted/40"
        >
          Add Category
        </Button>
      </div>

      {subCategories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
          No marketplace categories for this service yet.
        </div>
      ) : (
        <div className="space-y-4">
          {subCategories.map((subCategory, index) => (
            <div
              key={`${subCategory?.id || "subcategory"}-${index}`}
              className="space-y-4 rounded-[22px] border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <Label className="text-sm font-medium text-foreground">Category Name</Label>
                  <Input
                    value={subCategory?.name || ""}
                    onChange={(event) =>
                      handleCategoryChange(index, { name: event.target.value })
                    }
                    placeholder="Category name"
                    className="border-border bg-transparent text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveCategory(index)}
                  className="mt-7 text-muted-foreground hover:text-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <NameListEditor
                title="Skills"
                description="Add, edit, or remove the skills users can pick under this category."
                items={Array.isArray(subCategory?.tools) ? subCategory.tools : []}
                onChange={(nextTools) => handleCategoryToolsChange(index, nextTools)}
                addLabel="Add Skill"
                emptyLabel="No skills yet."
                inputPlaceholder="Skill name"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const StepperListEditor = ({ steps = [], onChange }) => {
  const handleStepChange = (index, field, value) => {
    const nextSteps = steps.map((step, stepIndex) =>
      stepIndex === index
        ? {
            ...step,
            [field]: field === "step" ? Number(value) || index + 1 : value,
          }
        : step,
    );
    onChange(nextSteps);
  };

  const handleRemove = (index) => {
    onChange(steps.filter((_, stepIndex) => stepIndex !== index));
  };

  const handleAdd = () => {
    onChange([
      ...(Array.isArray(steps) ? steps : []),
      { ...STEPPER_EMPTY, step: steps.length + 1 },
    ]);
  };

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-muted/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-foreground">Stepper Steps</h4>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Control the step ids and labels shown inside the service-details wizard.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleAdd} className="border-border bg-muted/40">
          Add Step
        </Button>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={`${step?.id || "step"}-${index}`}
            className="grid gap-3 rounded-2xl border border-border bg-card p-3 md:grid-cols-[110px_minmax(0,1fr)_minmax(0,1fr)_auto]"
          >
            <Input
              type="number"
              min="1"
              value={step?.step ?? index + 1}
              onChange={(event) => handleStepChange(index, "step", event.target.value)}
              placeholder="Step"
              className="border-border bg-transparent text-foreground"
            />
            <Input
              value={step?.id || ""}
              onChange={(event) => handleStepChange(index, "id", event.target.value)}
              placeholder="Step id"
              className="border-border bg-transparent text-foreground placeholder:text-muted-foreground"
            />
            <Input
              value={step?.label || ""}
              onChange={(event) => handleStepChange(index, "label", event.target.value)}
              placeholder="Step label"
              className="border-border bg-transparent text-foreground placeholder:text-muted-foreground"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemove(index)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

const ScopeRailCard = ({ title, subtitle, active, onClick, badge }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full rounded-2xl border px-4 py-4 text-left transition-all ${
      active
        ? "border-primary/30 bg-primary/10 shadow-[0_12px_28px_rgba(255,199,0,0.1)]"
        : "border-border bg-card/70 hover:border-border/80 hover:bg-card"
    }`}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{subtitle}</p>
      </div>
      {badge ? <Badge className="rounded-full">{badge}</Badge> : null}
    </div>
  </button>
);

const AdminFreelancerOnboardingContent = () => {
  const { authFetch } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedServiceKey, setSelectedServiceKey] = useState("global");
  const [activeSection, setActiveSection] = useState("basicProfile");
  const [availableServices, setAvailableServices] = useState([]);
  const [marketplaceFilters, setMarketplaceFilters] = useState(EMPTY_MARKETPLACE_FILTERS);
  const [globalContent, setGlobalContent] = useState(
    cloneContent(DEFAULT_FREELANCER_ONBOARDING_CONTENT),
  );
  const [serviceOverrides, setServiceOverrides] = useState({});

  useEffect(() => {
    let isMounted = true;

    authFetch("/admin/freelancer-onboarding-content")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load onboarding content.");
        }
        return response.json();
      })
      .then((payload) => {
        if (!isMounted) {
          return;
        }

        const content = payload?.data || {};
        const nextAvailableServices = Array.isArray(content.availableServices)
          ? content.availableServices
          : [];
        const nextGlobal = normalizeEditorContent(content.global);
        const nextServices = {};

        Object.entries(content.services || {}).forEach(([serviceKey, serviceValue]) => {
          nextServices[serviceKey] = normalizeEditorContent(
            mergeOnboardingContent(nextGlobal, serviceValue),
          );
        });

        setAvailableServices(nextAvailableServices);
        setMarketplaceFilters(
          normalizeMarketplaceFilters(content.marketplaceFilters, nextAvailableServices),
        );
        setGlobalContent(nextGlobal);
        setServiceOverrides(nextServices);
      })
      .catch((error) => {
        console.error("Failed to load freelancer onboarding content:", error);
        toast.error(error?.message || "Failed to load onboarding content.");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [authFetch]);

  const selectedServiceName = useMemo(() => {
    if (selectedServiceKey === "global") {
      return "Global defaults";
    }

    return (
      availableServices.find((service) => service.key === selectedServiceKey)?.name ||
      selectedServiceKey
    );
  }, [availableServices, selectedServiceKey]);

  const hasSelectedOverride = selectedServiceKey !== "global" && Boolean(serviceOverrides[selectedServiceKey]);
  const selectedMarketplaceService = useMemo(
    () =>
      marketplaceFilters.services.find((service) => service.key === selectedServiceKey) || null,
    [marketplaceFilters.services, selectedServiceKey],
  );

  const editorContent = useMemo(() => {
    if (selectedServiceKey === "global") {
      return globalContent;
    }

    return (
      serviceOverrides[selectedServiceKey] ||
      normalizeEditorContent(globalContent)
    );
  }, [globalContent, selectedServiceKey, serviceOverrides]);

  const handleEditorChange = (path, value) => {
    if (selectedServiceKey === "global") {
      setGlobalContent((current) =>
        normalizeEditorContent(setNestedValue(current, path, value)),
      );
      return;
    }

    setServiceOverrides((current) => {
      const existing =
        current[selectedServiceKey] || normalizeEditorContent(globalContent);
      return {
        ...current,
        [selectedServiceKey]: normalizeEditorContent(
          setNestedValue(existing, path, value),
        ),
      };
    });
  };

  const handleMarketplaceServiceChange = (nextService) => {
    if (!nextService?.id) {
      return;
    }

    setMarketplaceFilters((current) => ({
      ...current,
      services: current.services.map((service) =>
        service.id === nextService.id ? nextService : service,
      ),
    }));
  };

  const handleMarketplaceNichesChange = (nextNiches) => {
    setMarketplaceFilters((current) => ({
      ...current,
      niches: Array.isArray(nextNiches) ? nextNiches : [],
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await authFetch("/admin/freelancer-onboarding-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          global: globalContent,
          services: serviceOverrides,
          marketplaceFilters,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || payload?.error || "Failed to save onboarding content.");
      }

      const payload = await response.json();
      const content = payload?.data || {};
      const nextAvailableServices = Array.isArray(content.availableServices)
        ? content.availableServices
        : [];
      const nextGlobal = normalizeEditorContent(content.global);
      const nextServices = {};

      Object.entries(content.services || {}).forEach(([serviceKey, serviceValue]) => {
        nextServices[serviceKey] = normalizeEditorContent(
          mergeOnboardingContent(nextGlobal, serviceValue),
        );
      });

      setAvailableServices(nextAvailableServices);
      setMarketplaceFilters(
        normalizeMarketplaceFilters(content.marketplaceFilters, nextAvailableServices),
      );
      setGlobalContent(nextGlobal);
      setServiceOverrides(nextServices);
      toast.success("Onboarding content saved.");
    } catch (error) {
      console.error("Failed to save onboarding content:", error);
      toast.error(error?.message || "Failed to save onboarding content.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSelectedOverride = () => {
    if (selectedServiceKey === "global") {
      return;
    }

    setServiceOverrides((current) => {
      const next = { ...current };
      delete next[selectedServiceKey];
      return next;
    });
  };

  const previewContent = editorContent;

  const renderActiveSection = () => {
    switch (activeSection) {
      case "basicProfile":
        return (
          <SectionCard
            title={SECTION_META.basicProfile.title}
            description={SECTION_META.basicProfile.description}
          >
            <FieldGrid>
              <TextField
                label="Screen Title"
                value={editorContent?.basicProfile?.title}
                onChange={(value) => handleEditorChange("basicProfile.title", value)}
              />
              <TextField
                label="Screen Description"
                value={editorContent?.basicProfile?.description}
                onChange={(value) => handleEditorChange("basicProfile.description", value)}
              />
            </FieldGrid>
            <BasicProfileFieldBuilder
              fields={editorContent?.basicProfile?.fields || []}
              onChange={(nextValue) => handleEditorChange("basicProfile.fields", nextValue)}
            />
          </SectionCard>
        );
      case "stepper":
        return (
          <SectionCard
            title={SECTION_META.stepper.title}
            description={SECTION_META.stepper.description}
          >
            <StepperListEditor
              steps={editorContent?.stepper?.steps || []}
              onChange={(nextValue) => handleEditorChange("stepper.steps", nextValue)}
            />
          </SectionCard>
        );
      case "serviceSetup":
        return (
          <SectionCard
            title={SECTION_META.serviceSetup.title}
            description={SECTION_META.serviceSetup.description}
          >
            <TextField
              label="Title Template"
              value={editorContent?.serviceSetup?.titleTemplate}
              placeholder="Let's Start Your {serviceName} Setup"
              onChange={(value) => handleEditorChange("serviceSetup.titleTemplate", value)}
            />
            <TextAreaField
              label="Description"
              value={editorContent?.serviceSetup?.description}
              onChange={(value) => handleEditorChange("serviceSetup.description", value)}
            />
          </SectionCard>
        );
      case "serviceInfo":
        return (
          <SectionCard
            title={SECTION_META.serviceInfo.title}
            description={SECTION_META.serviceInfo.description}
          >
            <FieldGrid>
              <TextField
                label="Heading Title Template"
                value={editorContent?.serviceInfo?.headingTitleTemplate}
                onChange={(value) => handleEditorChange("serviceInfo.headingTitleTemplate", value)}
              />
              <TextField
                label="Section Title"
                value={editorContent?.serviceInfo?.sectionTitle}
                onChange={(value) => handleEditorChange("serviceInfo.sectionTitle", value)}
              />
            </FieldGrid>
            <TextAreaField
              label="Section Description"
              value={editorContent?.serviceInfo?.sectionDescription}
              onChange={(value) => handleEditorChange("serviceInfo.sectionDescription", value)}
            />
            <TextAreaField
              label="Service Title Tooltip"
              value={editorContent?.serviceInfo?.serviceTitleTooltip}
              onChange={(value) => handleEditorChange("serviceInfo.serviceTitleTooltip", value)}
              rows={3}
            />
            <FieldGrid>
              <TextField
                label="Service Title Label"
                value={editorContent?.serviceInfo?.fields?.title?.label}
                onChange={(value) => handleEditorChange("serviceInfo.fields.title.label", value)}
              />
              <TextField
                label="Service Title Placeholder"
                value={editorContent?.serviceInfo?.fields?.title?.placeholder}
                onChange={(value) => handleEditorChange("serviceInfo.fields.title.placeholder", value)}
              />
            </FieldGrid>
            <FieldGrid>
              <TextField
                label="Category Label"
                value={editorContent?.serviceInfo?.fields?.categories?.label}
                onChange={(value) => handleEditorChange("serviceInfo.fields.categories.label", value)}
              />
              <TextField
                label="Category Placeholder"
                value={editorContent?.serviceInfo?.fields?.categories?.placeholder}
                onChange={(value) => handleEditorChange("serviceInfo.fields.categories.placeholder", value)}
              />
            </FieldGrid>
            <FieldGrid>
              <TextField
                label="Category Search Placeholder"
                value={editorContent?.serviceInfo?.fields?.categories?.searchPlaceholder}
                onChange={(value) => handleEditorChange("serviceInfo.fields.categories.searchPlaceholder", value)}
              />
              <TextField
                label="Experience Placeholder"
                value={editorContent?.serviceInfo?.fields?.experience?.placeholder}
                onChange={(value) => handleEditorChange("serviceInfo.fields.experience.placeholder", value)}
              />
            </FieldGrid>
            {selectedServiceKey === "global" ? (
              <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm leading-6 text-foreground/80">
                Category and skill management is service-specific. Pick a service scope on the left to edit the real marketplace categories and skills used by onboarding and the marketplace.
              </div>
            ) : (
              <MarketplaceServiceTaxonomyEditor
                service={
                  selectedMarketplaceService || {
                    id: null,
                    key: selectedServiceKey,
                    name: selectedServiceName,
                    subCategories: [],
                  }
                }
                onChange={handleMarketplaceServiceChange}
              />
            )}
            <OptionListEditor
              title="Experience Options"
              description="Options shown in the experience dropdown."
              options={editorContent?.serviceInfo?.fields?.experience?.options || []}
              onChange={(nextValue) => handleEditorChange("serviceInfo.fields.experience.options", nextValue)}
            />
            <SchemaFieldListEditor
              title="Service Questions"
              description="Add, remove, reorder, or edit the questions shown for this service in the Service Info step."
              fields={editorContent?.serviceInfo?.fieldList || []}
              onChange={(nextValue) => handleEditorChange("serviceInfo.fieldList", nextValue)}
            />
          </SectionCard>
        );
      case "servicePricing":
        return (
          <SectionCard
            title={SECTION_META.servicePricing.title}
            description={SECTION_META.servicePricing.description}
          >
            <FieldGrid>
              <TextField
                label="Heading Title Template"
                value={editorContent?.servicePricing?.headingTitleTemplate}
                onChange={(value) => handleEditorChange("servicePricing.headingTitleTemplate", value)}
              />
              <TextField
                label="Section Title"
                value={editorContent?.servicePricing?.sectionTitle}
                onChange={(value) => handleEditorChange("servicePricing.sectionTitle", value)}
              />
            </FieldGrid>
            <TextAreaField
              label="Section Description"
              value={editorContent?.servicePricing?.sectionDescription}
              onChange={(value) => handleEditorChange("servicePricing.sectionDescription", value)}
            />
            <FieldGrid>
              <TextField
                label="Description Label"
                value={editorContent?.servicePricing?.fields?.description?.label}
                onChange={(value) => handleEditorChange("servicePricing.fields.description.label", value)}
              />
              <TextField
                label="Description Placeholder"
                value={editorContent?.servicePricing?.fields?.description?.placeholder}
                onChange={(value) => handleEditorChange("servicePricing.fields.description.placeholder", value)}
              />
            </FieldGrid>
            <FieldGrid>
              <TextField
                label="Delivery Timeline Label"
                value={editorContent?.servicePricing?.fields?.deliveryTimeline?.label}
                onChange={(value) => handleEditorChange("servicePricing.fields.deliveryTimeline.label", value)}
              />
              <TextField
                label="Delivery Timeline Placeholder"
                value={editorContent?.servicePricing?.fields?.deliveryTimeline?.placeholder}
                onChange={(value) => handleEditorChange("servicePricing.fields.deliveryTimeline.placeholder", value)}
              />
            </FieldGrid>
            <FieldGrid>
              <TextField
                label="Starting Price Label"
                value={editorContent?.servicePricing?.fields?.priceRange?.label}
                onChange={(value) => handleEditorChange("servicePricing.fields.priceRange.label", value)}
              />
              <TextField
                label="Starting Price Placeholder"
                value={editorContent?.servicePricing?.fields?.priceRange?.placeholder}
                onChange={(value) => handleEditorChange("servicePricing.fields.priceRange.placeholder", value)}
              />
            </FieldGrid>
            <TextField
              label="Currency Symbol"
              value={editorContent?.servicePricing?.fields?.priceRange?.currencySymbol}
              onChange={(value) => handleEditorChange("servicePricing.fields.priceRange.currencySymbol", value)}
              placeholder="₹"
            />
            <OptionListEditor
              title="Delivery Timeline Options"
              description="Options shown in the delivery timeline dropdown."
              options={editorContent?.servicePricing?.fields?.deliveryTimeline?.options || []}
              onChange={(nextValue) => handleEditorChange("servicePricing.fields.deliveryTimeline.options", nextValue)}
            />
            <SchemaFieldListEditor
              title="Pricing Questions"
              description="Control the questions shown in the pricing step for this service."
              fields={editorContent?.servicePricing?.fieldList || []}
              onChange={(nextValue) => handleEditorChange("servicePricing.fieldList", nextValue)}
            />
          </SectionCard>
        );
      case "serviceVisuals":
        return (
          <SectionCard
            title={SECTION_META.serviceVisuals.title}
            description={SECTION_META.serviceVisuals.description}
          >
            <FieldGrid>
              <TextField
                label="Heading Title"
                value={editorContent?.serviceVisuals?.headingTitle}
                onChange={(value) => handleEditorChange("serviceVisuals.headingTitle", value)}
              />
              <TextField
                label="Section Title"
                value={editorContent?.serviceVisuals?.sectionTitle}
                onChange={(value) => handleEditorChange("serviceVisuals.sectionTitle", value)}
              />
            </FieldGrid>
            <TextAreaField
              label="Section Description"
              value={editorContent?.serviceVisuals?.sectionDescription}
              onChange={(value) => handleEditorChange("serviceVisuals.sectionDescription", value)}
            />
            <TextAreaField
              label="Upload Rule With Existing Media"
              value={editorContent?.serviceVisuals?.uploadRuleWithMedia}
              onChange={(value) => handleEditorChange("serviceVisuals.uploadRuleWithMedia", value)}
            />
            <TextAreaField
              label="Upload Rule Empty State"
              value={editorContent?.serviceVisuals?.uploadRuleEmpty}
              onChange={(value) => handleEditorChange("serviceVisuals.uploadRuleEmpty", value)}
            />
            <SchemaFieldListEditor
              title="Visuals Questions"
              description="Control the questions shown in the visuals step for this service."
              fields={editorContent?.serviceVisuals?.fieldList || []}
              onChange={(nextValue) => handleEditorChange("serviceVisuals.fieldList", nextValue)}
            />
          </SectionCard>
        );
      case "caseStudy":
      default:
        return (
          <SectionCard
            title={SECTION_META.caseStudy.title}
            description={SECTION_META.caseStudy.description}
          >
            <FieldGrid>
              <TextField
                label="Heading Title"
                value={editorContent?.caseStudy?.headingTitle}
                onChange={(value) => handleEditorChange("caseStudy.headingTitle", value)}
              />
              <TextField
                label="Section Title"
                value={editorContent?.caseStudy?.sectionTitle}
                onChange={(value) => handleEditorChange("caseStudy.sectionTitle", value)}
              />
            </FieldGrid>
            <TextAreaField
              label="Section Description"
              value={editorContent?.caseStudy?.sectionDescription}
              onChange={(value) => handleEditorChange("caseStudy.sectionDescription", value)}
            />
            <FieldGrid>
              <TextField
                label="Add Button Label"
                value={editorContent?.caseStudy?.addButtonLabel}
                onChange={(value) => handleEditorChange("caseStudy.addButtonLabel", value)}
              />
              <TextField
                label="Limit Message"
                value={editorContent?.caseStudy?.limitMessage}
                onChange={(value) => handleEditorChange("caseStudy.limitMessage", value)}
              />
            </FieldGrid>

            <FieldGrid>
              <TextField
                label="Case Study Title Label"
                value={editorContent?.caseStudy?.fields?.title?.label}
                onChange={(value) => handleEditorChange("caseStudy.fields.title.label", value)}
              />
              <TextField
                label="Case Study Title Placeholder"
                value={editorContent?.caseStudy?.fields?.title?.placeholder}
                onChange={(value) => handleEditorChange("caseStudy.fields.title.placeholder", value)}
              />
            </FieldGrid>
            <NameListEditor
              title="Marketplace Niches"
              description="These niche options come from the real marketplace table and are reused in the onboarding case-study step."
              items={marketplaceFilters.niches}
              onChange={handleMarketplaceNichesChange}
              addLabel="Add Niche"
              emptyLabel="No niches yet."
              inputPlaceholder="Niche name"
            />

            <FieldGrid>
              <TextField
                label="Description Label"
                value={editorContent?.caseStudy?.fields?.description?.label}
                onChange={(value) => handleEditorChange("caseStudy.fields.description.label", value)}
              />
              <TextField
                label="Description Placeholder"
                value={editorContent?.caseStudy?.fields?.description?.placeholder}
                onChange={(value) => handleEditorChange("caseStudy.fields.description.placeholder", value)}
              />
            </FieldGrid>

            <FieldGrid>
              <TextField
                label="Niche Label"
                value={editorContent?.caseStudy?.fields?.niche?.label}
                onChange={(value) => handleEditorChange("caseStudy.fields.niche.label", value)}
              />
              <TextField
                label="Niche Placeholder"
                value={editorContent?.caseStudy?.fields?.niche?.placeholder}
                onChange={(value) => handleEditorChange("caseStudy.fields.niche.placeholder", value)}
              />
            </FieldGrid>

            <FieldGrid>
              <TextField
                label="Niche Search Placeholder"
                value={editorContent?.caseStudy?.fields?.niche?.searchPlaceholder}
                onChange={(value) => handleEditorChange("caseStudy.fields.niche.searchPlaceholder", value)}
              />
              <TextField
                label="Project Link Placeholder"
                value={editorContent?.caseStudy?.fields?.projectLink?.placeholder}
                onChange={(value) => handleEditorChange("caseStudy.fields.projectLink.placeholder", value)}
              />
            </FieldGrid>

            <FieldGrid>
              <TextField
                label="Project Link Label"
                value={editorContent?.caseStudy?.fields?.projectLink?.label}
                onChange={(value) => handleEditorChange("caseStudy.fields.projectLink.label", value)}
              />
              <TextField
                label="Project File Label"
                value={editorContent?.caseStudy?.fields?.projectFile?.label}
                onChange={(value) => handleEditorChange("caseStudy.fields.projectFile.label", value)}
              />
            </FieldGrid>

            <FieldGrid>
              <TextField
                label="Budget Label"
                value={editorContent?.caseStudy?.fields?.budget?.label}
                onChange={(value) => handleEditorChange("caseStudy.fields.budget.label", value)}
              />
              <TextField
                label="Budget Placeholder"
                value={editorContent?.caseStudy?.fields?.budget?.placeholder}
                onChange={(value) => handleEditorChange("caseStudy.fields.budget.placeholder", value)}
              />
            </FieldGrid>

            <OptionListEditor
              title="Role Options"
              description="Options shown in the case study role dropdown."
              options={editorContent?.caseStudy?.fields?.role?.options || []}
              onChange={(nextValue) => handleEditorChange("caseStudy.fields.role.options", nextValue)}
            />
            <OptionListEditor
              title="Timeline Options"
              description="Options shown in the case study timeline dropdown."
              options={editorContent?.caseStudy?.fields?.timeline?.options || []}
              onChange={(nextValue) => handleEditorChange("caseStudy.fields.timeline.options", nextValue)}
            />
            <SchemaFieldListEditor
              title="Case Study Questions"
              description="Control the questions shown when freelancers add case studies for this service."
              fields={editorContent?.caseStudy?.fieldList || []}
              onChange={(nextValue) => handleEditorChange("caseStudy.fieldList", nextValue)}
            />
          </SectionCard>
        );
    }
  };

  return (
    <AdminLayout>
      <div className="relative mx-auto flex max-w-[1500px] flex-col gap-6 px-5 py-6 lg:px-6">
        <AdminTopBar
          title="Freelancer Onboarding Content"
          subtitle="Manage onboarding copy through a structured editor instead of raw JSON."
        />

        <section className="relative overflow-hidden rounded-[26px] border border-border bg-card p-5 shadow-[0_22px_60px_rgba(0,0,0,0.08)] lg:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(200, 80, 40,0.08),transparent)] opacity-60" />
          <div className="relative flex flex-col gap-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                  Onboarding CMS
                </div>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {selectedServiceName}
                </h1>
                <p className="mt-2.5 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                  Update the actual onboarding copy used in the freelancer flow. Global defaults cover every service, and service scopes can override them when needed.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="rounded-full border-border bg-muted/40 text-muted-foreground">
                    {selectedServiceKey === "global" ? "Default Scope" : "Service Scope"}
                  </Badge>
                  <Badge variant="outline" className="rounded-full border-border bg-muted/40 text-muted-foreground">
                    {SECTION_META[activeSection]?.title}
                  </Badge>
                  {hasSelectedOverride ? (
                    <Badge className="rounded-full bg-primary/15 text-primary">Override Active</Badge>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <Button
                  variant="outline"
                  onClick={handleResetSelectedOverride}
                  disabled={selectedServiceKey === "global" || isSaving}
                  className="rounded-full border-border bg-muted/40 px-4"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Reset Override
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isLoading || isSaving}
                  className="rounded-full px-5 shadow-[0_14px_30px_rgba(255,199,0,0.14)]"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Content"}
                </Button>
              </div>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryChip label="Scopes" value={availableServices.length + 1} />
              <SummaryChip label="Sections" value={SECTION_ORDER.length} />
              <SummaryChip label="Current Scope" value={selectedServiceKey === "global" ? "Global" : "Service"} tone="accent" />
              <SummaryChip label="Override" value={hasSelectedOverride ? "Enabled" : "Default"} />
            </div>
          </div>
        </section>

        <div className="grid items-start gap-5 xl:grid-cols-[290px_340px_minmax(0,1fr)]">
          <Card className="rounded-[24px] border border-border bg-card shadow-[0_18px_44px_rgba(0,0,0,0.08)]">
            <CardHeader className="space-y-3 border-b border-border p-4">
              <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground">
                <Layers3 className="h-5 w-5 text-primary" />
                Scope
              </CardTitle>
              <CardDescription className="text-sm leading-6 text-muted-foreground">
                Pick the global default content or switch to a service-specific override.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 p-3">
              <ScopeRailCard
                title="Global Defaults"
                subtitle="Base copy used everywhere unless a service overrides it."
                active={selectedServiceKey === "global"}
                onClick={() => setSelectedServiceKey("global")}
                badge="Default"
              />

              {availableServices.map((service) => (
                <ScopeRailCard
                  key={service.key}
                  title={service.name}
                  subtitle={service.key}
                  active={selectedServiceKey === service.key}
                  onClick={() => setSelectedServiceKey(service.key)}
                  badge={serviceOverrides[service.key] ? "Custom" : null}
                />
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[24px] border border-border bg-card shadow-[0_18px_44px_rgba(0,0,0,0.08)]">
            <CardHeader className="space-y-3 border-b border-border p-4">
              <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground">
                <Settings2 className="h-5 w-5 text-primary" />
                Sections
              </CardTitle>
              <CardDescription className="text-sm leading-6 text-muted-foreground">
                Move between onboarding sections and edit only the copy that matters.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 p-3">
              {SECTION_ORDER.map((sectionKey) => (
                <button
                  key={sectionKey}
                  type="button"
                  onClick={() => setActiveSection(sectionKey)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition-all ${
                    activeSection === sectionKey
                      ? "border-primary/30 bg-primary/10 shadow-[0_12px_28px_rgba(255,199,0,0.08)]"
                      : "border-border bg-card/70 hover:border-border/80 hover:bg-card"
                  }`}
                >
                  <p className="text-sm font-semibold text-foreground">
                    {SECTION_META[sectionKey].title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {SECTION_META[sectionKey].description}
                  </p>
                </button>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-5">
            {renderActiveSection()}

            <Card className="rounded-[24px] border border-border bg-card shadow-[0_18px_44px_rgba(0,0,0,0.08)]">
              <CardHeader className="space-y-2 border-b border-border pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
                  <Eye className="h-5 w-5 text-primary" />
                  Preview Snapshot
                </CardTitle>
                <CardDescription className="text-sm leading-6 text-muted-foreground">
                  Quick read-only summary of the current content for this scope.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-muted/30 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/70">
                      Profile Title
                    </p>
                    <p className="mt-2 text-sm text-foreground">{previewContent?.basicProfile?.title}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-muted/30 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/70">
                      Profile Username Label
                    </p>
                    <p className="mt-2 text-sm text-foreground">{previewContent?.basicProfile?.fields?.username?.label}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-muted/30 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/70">
                      Setup Title
                    </p>
                    <p className="mt-2 text-sm text-foreground">{previewContent?.serviceSetup?.titleTemplate}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-muted/30 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/70">
                      Info Heading
                    </p>
                    <p className="mt-2 text-sm text-foreground">{previewContent?.serviceInfo?.headingTitleTemplate}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-muted/30 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/70">
                      Pricing Heading
                    </p>
                    <p className="mt-2 text-sm text-foreground">{previewContent?.servicePricing?.headingTitleTemplate}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-muted/30 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/70">
                      Case Study CTA
                    </p>
                    <p className="mt-2 text-sm text-foreground">{previewContent?.caseStudy?.addButtonLabel}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-muted/30 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">Stepper labels</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(previewContent?.stepper?.steps || []).map((step) => (
                      <Badge
                        key={`${step?.id}-${step?.step}`}
                        variant="outline"
                        className="rounded-full border-border bg-muted/40 text-muted-foreground"
                      >
                        {step?.step}. {step?.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                {selectedServiceKey !== "global" ? (
                  <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm leading-6 text-foreground/80">
                    Editing a service scope stores a full override for this service. If you want it to fall back to the global copy again, use <span className="font-semibold text-primary">Reset Override</span>.
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminFreelancerOnboardingContent;
