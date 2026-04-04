import React, { useEffect, useMemo, useState } from "react";
import * as LucideIcons from "lucide-react";

import AdminLayout from "./AdminLayout";
import { AdminTopBar } from "./AdminTopBar";
import { useAuth } from "@/shared/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const EMPTY_FORM = {
    id: "",
    name: "",
    description: "",
    icon: "",
    active: true,
    aiPrompt: "",
    proposalStructure: "",
    internalProposalStructure: "",
    proposalPrompt: "",
    minBudget: 0,
    currency: "INR"
};

const CORE_PREFIX = [
    "Client Name",
    "Business Name",
    "Service Type",
    "Project Overview",
    "Primary Objectives",
    "Features/Deliverables Included"
];

const CORE_SUFFIX = ["Launch Timeline", "Budget"];
const MULTI_VALUE_FIELDS = new Set(["Primary Objectives", "Features/Deliverables Included", "Additional Confirmed Inputs"]);
const SERVICE_FIELDS = {
    web: ["Website Type", "Design Style", "Website Build Type", "Frontend Framework", "Backend Technology", "Database", "Hosting", "Page Count"],
    creative: ["Creative Type", "Design Style", "Volume", "Engagement Model"],
    branding: ["Brand Stage", "Brand Deliverables", "Target Audience"],
    seo: ["Business Category", "Target Locations", "SEO Goals", "Duration"],
    app: ["App Type", "App Features", "Platform Requirements"]
};
const SERVICE_FILTERS = [
    { id: "all", label: "All Services" },
    { id: "active", label: "Active" },
    { id: "draft", label: "Draft" },
    { id: "client", label: "Client Custom" },
    { id: "internal", label: "JSON Custom" }
];
const STATUS_OPTIONS = [
    { value: "true", label: "Active & Public" },
    { value: "false", label: "Draft / Inactive" }
];
const CURRENCY_OPTIONS = [
    { value: "INR", label: "INR (Rupee)" },
    { value: "USD", label: "USD ($)" },
    { value: "EUR", label: "EUR (Euro)" },
    { value: "GBP", label: "GBP (Pound)" }
];

const DynamicIcon = ({ name, className }) => {
    const Icon = LucideIcons[name] || LucideIcons.HelpCircle;
    return <Icon className={className} />;
};

const cleanLine = (value = "") => String(value ?? "").replace(/\s+/g, " ").trim();
const cleanBlock = (value = "") => String(value ?? "").replace(/\r/g, "").trim();
const normalizeType = (value = "") => ["list", "array", "bullets", "bullet_list"].includes(String(value || "").trim().toLowerCase()) ? "list" : "text";
const formatLabelFromKey = (value = "") => String(value || "").replace(/[_-]+/g, " ").trim().split(/\s+/).filter(Boolean).map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");
const fieldKey = (value = "") => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
const fieldId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `field_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);

const serviceCategory = (value = "") => {
    const text = String(value || "").toLowerCase();
    if (text.includes("web") || text.includes("website")) return "web";
    if (text.includes("creative") || text.includes("design") || text.includes("animation") || text.includes("cgi") || text.includes("video")) return "creative";
    if (text.includes("brand")) return "branding";
    if (text.includes("seo")) return "seo";
    if (text.includes("app") || text.includes("mobile")) return "app";
    return "";
};

const makeField = (field = {}) => ({
    id: field.id || fieldId(),
    label: cleanLine(field.label || field.name || field.title || formatLabelFromKey(field.key || "")),
    type: normalizeType(field.type || (field.isList ? "list" : "text")),
    guidance: cleanBlock(field.guidance || field.instructions || field.description || field.notes || "")
});

const makeConfig = (fields = []) => ({ version: 1, fields: Array.isArray(fields) ? fields.map((field) => makeField(field)) : [] });

const sanitizeConfig = (config = {}) => {
    const seen = new Set();
    const fields = [];
    for (const raw of config.fields || []) {
        const field = makeField(raw);
        const label = cleanLine(field.label);
        const key = fieldKey(label);
        if (!label || !key || seen.has(key)) continue;
        seen.add(key);
        fields.push({ ...field, label, guidance: cleanBlock(field.guidance) });
    }
    return { version: 1, fields };
};

const stringifyConfig = (config = {}, sanitize = false) => JSON.stringify({
    version: 1,
    fields: (sanitize ? sanitizeConfig(config) : makeConfig(config.fields || [])).fields.map((field) => ({
        ...(fieldKey(field.label) ? { key: fieldKey(field.label) } : {}),
        label: field.label || "",
        type: normalizeType(field.type),
        ...(cleanBlock(field.guidance) ? { guidance: cleanBlock(field.guidance) } : {})
    }))
}, null, 2);

const storedConfig = (config = {}) => {
    const clean = sanitizeConfig(config);
    return clean.fields.length ? stringifyConfig(clean) : "";
};

const defaultConfig = (service = {}) => {
    const category = serviceCategory([service.name, service.id, service.slug].filter(Boolean).join(" "));
    return makeConfig([
        ...CORE_PREFIX.map((label) => ({ label, type: MULTI_VALUE_FIELDS.has(label) ? "list" : "text" })),
        ...(SERVICE_FIELDS[category] || []).map((label) => ({ label, type: MULTI_VALUE_FIELDS.has(label) ? "list" : "text" })),
        ...CORE_SUFFIX.map((label) => ({ label, type: MULTI_VALUE_FIELDS.has(label) ? "list" : "text" }))
    ]);
};

const parseJsonConfig = (value = "") => {
    const source = cleanBlock(value);
    if (!source) return { config: makeConfig([]), error: "", empty: true };
    try {
        const parsed = JSON.parse(source);
        if (Array.isArray(parsed)) return { config: makeConfig(parsed), error: "", empty: false };
        if (parsed && typeof parsed === "object" && Array.isArray(parsed.fields)) return { config: makeConfig(parsed.fields), error: "", empty: false };
        return { config: null, error: "JSON must be an array or an object with a fields array.", empty: false };
    } catch (error) {
        return { config: null, error: error?.message || "Invalid JSON.", empty: false };
    }
};

const parseLegacyConfig = (value = "") => {
    const fields = [];
    let activeIndex = -1;
    for (const raw of cleanBlock(value).split("\n")) {
        let line = raw.trim();
        if (!line || line.startsWith("```")) continue;
        line = line.replace(/^[#\s]+/, "").trim();
        const match = line.match(/^\*{0,2}(?:[-*]\s+)?(?:\d+\.\s+)?([^:*]+?)\*{0,2}:\s*(.*)$/);
        if (match) {
            fields.push(makeField({ label: match[1], type: "text" }));
            activeIndex = fields.length - 1;
            continue;
        }
        if (activeIndex >= 0 && /^[-*]\s+/.test(line)) {
            fields[activeIndex] = { ...fields[activeIndex], type: "list" };
        }
    }
    return makeConfig(fields);
};

const parseStoredConfig = (value = "", service = {}) => {
    const source = cleanBlock(value);
    if (source && /^[\[{]/.test(source)) {
        const parsed = parseJsonConfig(source);
        if (parsed.config?.fields?.length) return parsed.config;
    }
    const legacy = parseLegacyConfig(source);
    return legacy.fields.length ? legacy : defaultConfig(service);
};

const configPreview = (config = {}) => sanitizeConfig(config).fields.flatMap((field) => field.type === "list" ? [`${field.label}:`, "- ..."] : [`${field.label}: ...`]).join("\n");
const configLabels = (value = "", service = {}) => sanitizeConfig(parseStoredConfig(value, service)).fields.map((field) => field.label);
const formatCurrencyAmount = (value = 0, currency = "INR") => {
    const numericValue = Number(value || 0);
    try {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency,
            maximumFractionDigits: 0
        }).format(numericValue);
    } catch {
        return `${currency} ${numericValue.toLocaleString("en-IN")}`;
    }
};

const buildEditorState = (config = makeConfig([]), mode = "default") => {
    const normalizedConfig = makeConfig(config.fields || []);
    return {
        mode,
        config: normalizedConfig,
        json: stringifyConfig(normalizedConfig),
        jsonError: "",
        tab: "builder"
    };
};

const ProposalFieldRow = ({ field, index, total, onChange, onMove, onRemove }) => (
    <div className="rounded-xl border border-white/10 bg-black/15 p-3.5">
        <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
                <Badge variant="secondary" className="rounded-full">Field {index + 1}</Badge>
                <Badge variant="outline" className="rounded-full">{field.type === "list" ? "List" : "Text"}</Badge>
            </div>
            <div className="flex gap-2">
                <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-full border-white/10 bg-white/[0.03]" onClick={() => onMove(field.id, -1)} disabled={index === 0}><LucideIcons.ArrowUp className="h-4 w-4" /></Button>
                <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-full border-white/10 bg-white/[0.03]" onClick={() => onMove(field.id, 1)} disabled={index === total - 1}><LucideIcons.ArrowDown className="h-4 w-4" /></Button>
                <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-full border-white/10 bg-white/[0.03]" onClick={() => onRemove(field.id)} disabled={total <= 1}><LucideIcons.Trash2 className="h-4 w-4" /></Button>
            </div>
        </div>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_180px]">
            <div className="space-y-2">
                <Label>Field Label</Label>
                <Input value={field.label} onChange={(event) => onChange(field.id, { label: event.target.value })} placeholder="Proposal field label" />
            </div>
            <div className="space-y-2">
                <Label>Output Type</Label>
                <Select value={field.type} onValueChange={(value) => onChange(field.id, { type: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="list">Bullet List</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
        <div className="mt-3 space-y-2">
            <Label>Field Guidance</Label>
            <Textarea value={field.guidance} onChange={(event) => onChange(field.id, { guidance: event.target.value })} placeholder="Tell the AI what to include or avoid in this field." className="min-h-[88px] resize-y" />
        </div>
    </div>
);

const StructureEditorCard = ({
    title,
    description,
    mode,
    customBadgeLabel,
    fallbackBadgeLabel,
    fieldCount,
    resetLabel,
    emptyStateLabel,
    statusNote,
    tab,
    onTabChange,
    fields,
    onChangeField,
    onMoveField,
    onRemoveField,
    onReset,
    onAddField,
    json,
    onJsonChange,
    jsonError,
    onFormatJson,
    onApplyJson,
    previewText,
    guidanceFields
}) => (
    <Card className="border-white/10 bg-white/[0.02]">
        <CardHeader className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
            <div>
                <CardTitle className="text-lg font-semibold">{title}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                    {description}
                </p>
            </div>
            <div className="flex flex-wrap gap-2">
                <Badge variant={mode === "custom" ? "default" : "outline"} className="rounded-full">
                    {mode === "custom" ? customBadgeLabel : fallbackBadgeLabel}
                </Badge>
                <Badge variant="secondary" className="rounded-full">{fieldCount} fields</Badge>
                <Button type="button" variant="outline" className="rounded-full border-white/10 bg-white/[0.03]" onClick={onReset}>
                    <LucideIcons.RefreshCcw className="mr-2 h-4 w-4" />
                    {resetLabel}
                </Button>
                <Button type="button" variant="outline" className="rounded-full border-white/10 bg-white/[0.03]" onClick={onAddField}>
                    <LucideIcons.Plus className="mr-2 h-4 w-4" />
                    Add Field
                </Button>
            </div>
        </CardHeader>
        <CardContent className="space-y-4 p-5 pt-0">
            {statusNote ? (
                <div className="rounded-xl border border-dashed border-white/10 bg-black/15 px-4 py-3 text-sm text-muted-foreground">
                    {statusNote}
                </div>
            ) : null}
            <Tabs value={tab} onValueChange={onTabChange} className="gap-4">
                <TabsList className="w-full justify-start rounded-xl border border-white/10 bg-black/20 p-1">
                    <TabsTrigger value="builder">Builder</TabsTrigger>
                    <TabsTrigger value="json">Raw JSON</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>

                <TabsContent value="builder" className="space-y-4">
                    {fields.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-muted-foreground">
                            {emptyStateLabel}
                        </div>
                    ) : fields.map((field, index) => (
                        <ProposalFieldRow
                            key={field.id}
                            field={field}
                            index={index}
                            total={fields.length}
                            onChange={onChangeField}
                            onMove={onMoveField}
                            onRemove={onRemoveField}
                        />
                    ))}
                </TabsContent>

                <TabsContent value="json" className="space-y-4">
                    <Textarea
                        value={json}
                        onChange={onJsonChange}
                        className="min-h-[360px] resize-y font-mono text-sm"
                        spellCheck={false}
                    />
                    {jsonError ? (
                        <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                            {jsonError}
                        </div>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" onClick={onFormatJson}>
                            Format JSON
                        </Button>
                        <Button type="button" onClick={onApplyJson}>
                            Apply JSON
                        </Button>
                    </div>
                </TabsContent>

                <TabsContent value="preview" className="grid gap-4 xl:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-black/15 p-4">
                        <p className="mb-3 text-sm font-medium">Generated Structure</p>
                        <pre className="whitespace-pre-wrap rounded-xl bg-black/20 p-4 text-sm leading-6">
                            {previewText || "No valid fields configured yet."}
                        </pre>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/15 p-4">
                        <p className="mb-3 text-sm font-medium">Field Guidance</p>
                        <div className="space-y-3">
                            {guidanceFields.length ? guidanceFields.map((field) => (
                                <div key={field.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="font-medium">{field.label}</p>
                                        <Badge variant="outline" className="rounded-full">{field.type === "list" ? "List" : "Text"}</Badge>
                                    </div>
                                    <p className="mt-2 text-sm text-muted-foreground">{field.guidance}</p>
                                </div>
                            )) : (
                                <div className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-muted-foreground">
                                    No field-level guidance added yet.
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </CardContent>
    </Card>
);

const OverviewMetricCard = ({ label, value, note }) => (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-3.5 py-3.5 backdrop-blur">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/70">{label}</p>
        <p className="mt-2 text-2xl font-medium tracking-tight [font-variant-numeric:tabular-nums]">{value}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{note}</p>
    </div>
);

const AdminServices = () => {
    const { authFetch } = useAuth();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [serviceSearch, setServiceSearch] = useState("");
    const [serviceFilter, setServiceFilter] = useState("all");
    const [currentService, setCurrentService] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [proposalEditor, setProposalEditor] = useState(() => buildEditorState(defaultConfig({}), "default"));
    const [internalEditor, setInternalEditor] = useState(() => buildEditorState(defaultConfig({}), "inherit"));

    const cleanProposalConfig = useMemo(() => sanitizeConfig(proposalEditor.config), [proposalEditor.config]);
    const previewText = useMemo(() => configPreview(proposalEditor.config), [proposalEditor.config]);
    const cleanInternalConfig = useMemo(() => sanitizeConfig(internalEditor.config), [internalEditor.config]);
    const internalPreviewText = useMemo(() => configPreview(internalEditor.config), [internalEditor.config]);
    const serviceCards = useMemo(
        () => services.map((service) => ({
            ...service,
            hasCustomProposalStructure: Boolean(cleanBlock(service.proposalStructure)),
            hasCustomInternalProposalStructure: Boolean(cleanBlock(service.internalProposalStructure)),
            hasProposalPrompt: Boolean(cleanBlock(service.proposalPrompt)),
            proposalLabels: configLabels(service.proposalStructure, service),
            internalProposalLabels: cleanBlock(service.internalProposalStructure)
                ? configLabels(service.internalProposalStructure, service)
                : []
        })),
        [services]
    );
    const overviewStats = useMemo(() => ({
        total: serviceCards.length,
        active: serviceCards.filter((service) => service.active).length,
        clientCustom: serviceCards.filter((service) => service.hasCustomProposalStructure).length,
        internalCustom: serviceCards.filter((service) => service.hasCustomInternalProposalStructure).length
    }), [serviceCards]);
    const filteredServiceCards = useMemo(() => {
        const query = serviceSearch.trim().toLowerCase();

        return serviceCards.filter((service) => {
            const matchesQuery = !query || [service.name, service.id, service.description]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query));
            if (!matchesQuery) return false;

            if (serviceFilter === "active") return service.active;
            if (serviceFilter === "draft") return !service.active;
            if (serviceFilter === "client") return service.hasCustomProposalStructure;
            if (serviceFilter === "internal") return service.hasCustomInternalProposalStructure;
            return true;
        });
    }, [serviceCards, serviceFilter, serviceSearch]);
    const filterCounts = useMemo(() => ({
        all: serviceCards.length,
        active: overviewStats.active,
        draft: Math.max(serviceCards.length - overviewStats.active, 0),
        client: overviewStats.clientCustom,
        internal: overviewStats.internalCustom
    }), [overviewStats.active, overviewStats.clientCustom, overviewStats.internalCustom, serviceCards.length]);

    useEffect(() => {
        fetchServices();
    }, [authFetch]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!open || proposalEditor.mode !== "default") return;
        const defaults = defaultConfig({ id: formData.id, slug: formData.id, name: formData.name });
        setProposalEditor((current) => ({
            ...current,
            config: defaults,
            json: stringifyConfig(defaults),
            jsonError: ""
        }));
    }, [formData.id, formData.name, open, proposalEditor.mode]);

    useEffect(() => {
        if (!open || internalEditor.mode !== "inherit") return;
        const inheritedConfig = proposalEditor.mode === "custom"
            ? makeConfig(proposalEditor.config.fields || [])
            : defaultConfig({ id: formData.id, slug: formData.id, name: formData.name });
        setInternalEditor((current) => ({
            ...current,
            config: inheritedConfig,
            json: stringifyConfig(inheritedConfig),
            jsonError: ""
        }));
    }, [formData.id, formData.name, internalEditor.mode, open, proposalEditor.config, proposalEditor.mode]);

    const fetchServices = async () => {
        setLoading(true);
        try {
            const response = await authFetch("/admin/services");
            const payload = await response.json();
            setServices(Array.isArray(payload?.data) ? payload.data : []);
        } catch (error) {
            console.error("Failed to fetch services:", error);
            toast.error("Failed to load services");
        } finally {
            setLoading(false);
        }
    };

    const syncProposalEditor = (nextConfig, nextMode = proposalEditor.mode) => {
        const normalized = makeConfig(nextConfig?.fields || []);
        setProposalEditor((current) => ({
            ...current,
            config: normalized,
            json: stringifyConfig(normalized),
            jsonError: "",
            mode: nextMode
        }));
        setFormData((current) => ({ ...current, proposalStructure: nextMode === "custom" ? storedConfig(normalized) : "" }));
    };

    const syncInternalEditor = (nextConfig, nextMode = internalEditor.mode) => {
        const normalized = makeConfig(nextConfig?.fields || []);
        setInternalEditor((current) => ({
            ...current,
            config: normalized,
            json: stringifyConfig(normalized),
            jsonError: "",
            mode: nextMode
        }));
        setFormData((current) => ({ ...current, internalProposalStructure: nextMode === "custom" ? storedConfig(normalized) : "" }));
    };

    const openDialog = (service = null) => {
        const nextForm = service ? {
            id: service.id,
            name: service.name || "",
            description: service.description || "",
            icon: service.icon || "",
            active: service.active !== undefined ? service.active : true,
            aiPrompt: service.aiPrompt || "",
            proposalStructure: service.proposalStructure || "",
            internalProposalStructure: service.internalProposalStructure || "",
            proposalPrompt: service.proposalPrompt || "",
            minBudget: service.minBudget || 0,
            currency: service.currency || "INR"
        } : { ...EMPTY_FORM };
        const hasCustomProposal = Boolean(cleanBlock(nextForm.proposalStructure));
        const hasCustomInternal = Boolean(cleanBlock(nextForm.internalProposalStructure));
        const proposalConfig = hasCustomProposal ? parseStoredConfig(nextForm.proposalStructure, nextForm) : defaultConfig(nextForm);
        const inheritedInternalConfig = hasCustomProposal ? proposalConfig : defaultConfig(nextForm);
        const internalConfig = hasCustomInternal
            ? parseStoredConfig(nextForm.internalProposalStructure, nextForm)
            : inheritedInternalConfig;
        setCurrentService(service);
        setFormData(nextForm);
        setProposalEditor(buildEditorState(proposalConfig, hasCustomProposal ? "custom" : "default"));
        setInternalEditor(buildEditorState(internalConfig, hasCustomInternal ? "custom" : "inherit"));
        setOpen(true);
    };

    const resetProposalDefaults = (showToast = true) => {
        const defaults = defaultConfig({ id: formData.id, slug: formData.id, name: formData.name });
        setProposalEditor(buildEditorState(defaults, "default"));
        setFormData((current) => ({ ...current, proposalStructure: "" }));
        if (showToast) toast.success("Proposal structure reset to platform defaults");
    };

    const resetInternalStructure = (showToast = true) => {
        const inheritedConfig = proposalEditor.mode === "custom"
            ? makeConfig(proposalEditor.config.fields || [])
            : defaultConfig({ id: formData.id, slug: formData.id, name: formData.name });
        setInternalEditor(buildEditorState(inheritedConfig, "inherit"));
        setFormData((current) => ({ ...current, internalProposalStructure: "" }));
        if (showToast) toast.success("Internal project JSON structure reverted to fallback behavior");
    };

    const changeProposalField = (id, patch) => syncProposalEditor({ fields: proposalEditor.config.fields.map((field) => field.id === id ? { ...field, ...patch } : field) }, "custom");
    const moveProposalField = (id, direction) => {
        const index = proposalEditor.config.fields.findIndex((field) => field.id === id);
        const nextIndex = index + direction;
        if (index < 0 || nextIndex < 0 || nextIndex >= proposalEditor.config.fields.length) return;
        const fields = [...proposalEditor.config.fields];
        [fields[index], fields[nextIndex]] = [fields[nextIndex], fields[index]];
        syncProposalEditor({ fields }, "custom");
    };
    const removeProposalField = (id) => syncProposalEditor({ fields: proposalEditor.config.fields.filter((field) => field.id !== id) }, "custom");
    const addProposalField = () => syncProposalEditor({
        fields: [...proposalEditor.config.fields, makeField({ label: `New Field ${proposalEditor.config.fields.length + 1}`, type: "text" })]
    }, "custom");

    const applyProposalJson = () => {
        const parsed = parseJsonConfig(proposalEditor.json);
        if (parsed.error) {
            setProposalEditor((current) => ({ ...current, jsonError: parsed.error }));
            return;
        }
        if (parsed.empty || !sanitizeConfig(parsed.config).fields.length) {
            resetProposalDefaults(false);
            toast.success("Empty JSON cleared the custom template");
            return;
        }
        syncProposalEditor(parsed.config, "custom");
        toast.success("Proposal JSON applied");
    };

    const changeInternalField = (id, patch) => syncInternalEditor({ fields: internalEditor.config.fields.map((field) => field.id === id ? { ...field, ...patch } : field) }, "custom");
    const moveInternalField = (id, direction) => {
        const index = internalEditor.config.fields.findIndex((field) => field.id === id);
        const nextIndex = index + direction;
        if (index < 0 || nextIndex < 0 || nextIndex >= internalEditor.config.fields.length) return;
        const fields = [...internalEditor.config.fields];
        [fields[index], fields[nextIndex]] = [fields[nextIndex], fields[index]];
        syncInternalEditor({ fields }, "custom");
    };
    const removeInternalField = (id) => syncInternalEditor({ fields: internalEditor.config.fields.filter((field) => field.id !== id) }, "custom");
    const addInternalField = () => syncInternalEditor({
        fields: [...internalEditor.config.fields, makeField({ label: `Internal Field ${internalEditor.config.fields.length + 1}`, type: "text" })]
    }, "custom");

    const applyInternalJson = () => {
        const parsed = parseJsonConfig(internalEditor.json);
        if (parsed.error) {
            setInternalEditor((current) => ({ ...current, jsonError: parsed.error }));
            return;
        }
        if (parsed.empty || !sanitizeConfig(parsed.config).fields.length) {
            resetInternalStructure(false);
            toast.success("Empty JSON cleared the internal-only template");
            return;
        }
        syncInternalEditor(parsed.config, "custom");
        toast.success("Internal JSON applied");
    };

    const submit = async (event) => {
        event.preventDefault();
        if (proposalEditor.jsonError || internalEditor.jsonError) {
            toast.error("Fix the invalid JSON before saving");
            return;
        }
        const proposalStructure = proposalEditor.mode === "custom" ? storedConfig(proposalEditor.config) : "";
        const internalProposalStructure = internalEditor.mode === "custom" ? storedConfig(internalEditor.config) : "";
        if (proposalEditor.mode === "custom" && !proposalStructure) {
            toast.error("Add at least one valid proposal field or reset to defaults");
            return;
        }
        if (internalEditor.mode === "custom" && !internalProposalStructure) {
            toast.error("Add at least one valid internal JSON field or clear the internal template");
            return;
        }
        const payload = {
            ...formData,
            id: formData.id.trim(),
            name: formData.name.trim(),
            description: formData.description.trim(),
            icon: formData.icon.trim(),
            aiPrompt: formData.aiPrompt.trim(),
            proposalPrompt: formData.proposalPrompt.trim(),
            proposalStructure,
            internalProposalStructure,
            minBudget: Number(formData.minBudget) || 0
        };
        try {
            const response = await authFetch("/admin/services", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const payload = await response.json().catch(() => null);
                throw new Error(payload?.error || "Failed to save service");
            }
            toast.success(currentService ? "Service updated" : "Service created");
            setOpen(false);
            fetchServices();
        } catch (error) {
            console.error("Failed to save service:", error);
            toast.error(error?.message || "Error saving service");
        }
    };

    return (
        <AdminLayout>
            <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-5 py-6 lg:px-6">
                <AdminTopBar label="Service Management" />

                <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,199,0,0.12),transparent_32%),linear-gradient(135deg,rgba(24,24,24,0.96),rgba(9,9,9,1))] p-5 shadow-[0_24px_64px_rgba(0,0,0,0.32)] lg:p-6">
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,199,0,0.08),transparent)] opacity-60" />
                    <div className="relative flex flex-col gap-8">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="max-w-3xl">
                                <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                                    Service Ops
                                </div>
                                <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-white [text-wrap:balance] sm:text-4xl">
                                    Shape What Clients See And What Your System Stores
                                </h1>
                                <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                                    Manage service cards, AI rules, the client-facing proposal format, and the internal project JSON template from one place without losing the difference between them.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <Button onClick={() => openDialog()} className="min-w-[180px] rounded-full px-5 shadow-[0_16px_32px_rgba(255,199,0,0.14)]">
                                    <LucideIcons.Plus className="mr-2 h-5 w-5" />
                                    Add New Service
                                </Button>
                            </div>
                        </div>

                        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                            <OverviewMetricCard
                                label="Total Services"
                                value={overviewStats.total}
                                note="Catalog entries managed from this workspace"
                            />
                            <OverviewMetricCard
                                label="Active"
                                value={overviewStats.active}
                                note="Services currently visible to users"
                            />
                            <OverviewMetricCard
                                label="Client Templates"
                                value={overviewStats.clientCustom}
                                note="Services with custom client-facing output"
                            />
                            <OverviewMetricCard
                                label="Internal JSON"
                                value={overviewStats.internalCustom}
                                note="Services with system-only saved JSON schemas"
                            />
                        </div>

                        <div className="rounded-[24px] border border-white/10 bg-black/20 p-4 backdrop-blur">
                            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                                <div className="max-w-2xl">
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/70">Catalog Controls</p>
                                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                                        Search by service name, slug, or description, then narrow the list by publishing state or schema coverage.
                                    </p>
                                </div>
                                <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">
                                    <Label htmlFor="service-search" className="sr-only">Search Services</Label>
                                    <div className="flex items-center gap-3">
                                        <LucideIcons.Search className="h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="service-search"
                                            name="serviceSearch"
                                            value={serviceSearch}
                                            onChange={(event) => setServiceSearch(event.target.value)}
                                            placeholder="Search services..."
                                            autoComplete="off"
                                            spellCheck={false}
                                            className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                                {SERVICE_FILTERS.map((filter) => {
                                    const isActive = serviceFilter === filter.id;
                                    return (
                                        <button
                                            key={filter.id}
                                            type="button"
                                            onClick={() => setServiceFilter(filter.id)}
                                            aria-pressed={isActive}
                                            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                                                isActive
                                                    ? "border-primary/35 bg-primary/12 text-primary shadow-[0_14px_28px_rgba(255,199,0,0.12)]"
                                                    : "border-white/10 bg-white/[0.03] text-muted-foreground hover:border-white/20 hover:text-white"
                                            }`}
                                        >
                                            <span>{filter.label}</span>
                                            <span className={`rounded-full px-2 py-0.5 text-xs ${
                                                isActive ? "bg-primary/15 text-primary" : "bg-black/25 text-muted-foreground"
                                            }`}>
                                                {filterCounts[filter.id]}
                                            </span>
                                        </button>
                                    );
                                })}
                                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-sm text-muted-foreground">
                                    Showing {filteredServiceCards.length} of {serviceCards.length}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {loading ? (
                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 2xl:grid-cols-3">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="h-[420px] animate-pulse rounded-[28px] border border-white/10 bg-card/50" />
                        ))}
                    </div>
                ) : serviceCards.length === 0 ? (
                    <div className="flex h-80 flex-col items-center justify-center rounded-[28px] border border-dashed border-white/15 bg-card/30 px-6 text-center">
                        <div className="mb-5 rounded-full border border-primary/20 bg-primary/10 p-4 text-primary">
                            <LucideIcons.Layers className="h-10 w-10" />
                        </div>
                        <h3 className="text-2xl font-semibold tracking-tight">No services found</h3>
                        <p className="mt-3 max-w-xl text-muted-foreground">
                            Add your first service to control its AI behavior, client proposal structure, and internal project JSON schema.
                        </p>
                    </div>
                ) : filteredServiceCards.length === 0 ? (
                    <div className="flex h-80 flex-col items-center justify-center rounded-[28px] border border-dashed border-white/15 bg-card/30 px-6 text-center">
                        <div className="mb-5 rounded-full border border-white/10 bg-white/[0.04] p-4 text-muted-foreground">
                            <LucideIcons.SearchX className="h-10 w-10" />
                        </div>
                        <h3 className="text-2xl font-semibold tracking-tight">No Services Match This View</h3>
                        <p className="mt-3 max-w-xl text-muted-foreground">
                            Try clearing the search or switching filters to see more services in the catalog.
                        </p>
                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                            <Button variant="outline" className="rounded-full border-white/10 bg-white/[0.04]" onClick={() => setServiceSearch("")}>
                                Clear Search
                            </Button>
                            <Button className="rounded-full" onClick={() => setServiceFilter("all")}>
                                Show All Services
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
                        {filteredServiceCards.map((service) => (
                            <Card
                                key={service.id}
                                className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(30,30,30,0.98),rgba(14,14,14,0.98))] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_18px_44px_rgba(0,0,0,0.3)]"
                            >
                                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(255,199,0,0.12),transparent_70%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                <CardHeader className="relative min-w-0 space-y-4 px-5 pb-3 pt-5">
                                    <div className="flex min-w-0 items-start justify-between gap-3">
                                        <div className="flex min-w-0 flex-1 items-start gap-4">
                                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${service.active ? "border-primary/25 bg-primary/12 text-primary" : "border-white/10 bg-muted/30 text-muted-foreground"}`}>
                                                <DynamicIcon name={service.icon} className="h-6 w-6" />
                                            </div>
                                            <div className="min-w-0 flex-1 space-y-2.5">
                                                <div className="inline-flex max-w-full items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                                                    <span className="truncate">{service.id}</span>
                                                </div>
                                                <CardTitle className="line-clamp-2 break-words text-[1.45rem] font-semibold leading-tight tracking-tight [text-wrap:balance]">
                                                    {service.name}
                                                </CardTitle>
                                                <div className="flex flex-wrap gap-2">
                                                    <Badge variant={service.active ? "default" : "secondary"}>
                                                        {service.active ? "Active" : "Draft"}
                                                    </Badge>
                                                    <Badge variant={service.hasCustomProposalStructure ? "default" : "outline"} className="rounded-full">
                                                        {service.hasCustomProposalStructure ? "Client Custom" : "Client Default"}
                                                    </Badge>
                                                    <Badge variant={service.hasCustomInternalProposalStructure ? "default" : "outline"} className="rounded-full">
                                                        {service.hasCustomInternalProposalStructure ? "JSON Custom" : "JSON Fallback"}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="shrink-0 rounded-full border-white/10 bg-white/[0.04] px-3"
                                            onClick={() => openDialog(service)}
                                            aria-label={`Edit ${service.name}`}
                                        >
                                            <LucideIcons.Settings2 className="mr-2 h-4 w-4" />
                                            Edit
                                        </Button>
                                    </div>
                                    <p className="min-h-[4rem] line-clamp-3 text-sm leading-6 text-muted-foreground">
                                        {service.description || "No description provided."}
                                    </p>
                                </CardHeader>

                                <CardContent className="relative flex-1 space-y-3.5 px-5 pb-5">
                                    <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-black/20 p-3.5">
                                        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3.5">
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Start Price</p>
                                            <p className="mt-2 text-lg font-semibold tracking-tight [font-variant-numeric:tabular-nums]">
                                                {formatCurrencyAmount(service.minBudget, service.currency)}
                                            </p>
                                        </div>
                                        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3.5">
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Questions</p>
                                            <p className="mt-2 text-lg font-semibold tracking-tight [font-variant-numeric:tabular-nums]">{service.questionCount} steps</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="rounded-2xl border border-white/10 bg-black/25 p-3.5">
                                            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/70">Client Proposal</p>
                                                    <p className="mt-1 text-sm text-muted-foreground">{service.proposalLabels.length} fields visible in the client proposal</p>
                                                </div>
                                                <Badge variant={service.hasProposalPrompt ? "secondary" : "outline"} className="rounded-full">
                                                    {service.hasProposalPrompt ? "Prompt Ready" : "No Prompt"}
                                                </Badge>
                                            </div>
                                            {service.proposalLabels.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {service.proposalLabels.slice(0, 5).map((label) => (
                                                        <Badge key={`${service.id}-${label}`} variant="outline" className="rounded-full">
                                                            {label}
                                                        </Badge>
                                                    ))}
                                                    {service.proposalLabels.length > 5 ? (
                                                        <Badge variant="outline" className="rounded-full">+{service.proposalLabels.length - 5} more</Badge>
                                                    ) : null}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">No client-facing proposal structure has been configured yet.</p>
                                            )}
                                        </div>

                                        <div className="rounded-2xl border border-white/10 bg-black/25 p-3.5">
                                            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/70">Internal JSON</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {service.hasCustomInternalProposalStructure ? `${service.internalProposalLabels.length} fields saved for downstream workflows` : "Falls back to the client template or parsed final proposal"}
                                                    </p>
                                                </div>
                                                <Badge variant={service.hasCustomInternalProposalStructure ? "default" : "outline"} className="rounded-full">
                                                    {service.hasCustomInternalProposalStructure ? "Custom" : "Fallback"}
                                                </Badge>
                                            </div>
                                            {service.hasCustomInternalProposalStructure ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {service.internalProposalLabels.slice(0, 5).map((label) => (
                                                        <Badge key={`${service.id}-internal-${label}`} variant="outline" className="rounded-full">
                                                            {label}
                                                        </Badge>
                                                    ))}
                                                    {service.internalProposalLabels.length > 5 ? (
                                                        <Badge variant="outline" className="rounded-full">+{service.internalProposalLabels.length - 5} more</Badge>
                                                    ) : null}
                                                </div>
                                            ) : (
                                                <p className="max-w-xl text-sm leading-7 text-muted-foreground">
                                                    Saved project JSON falls back to the service template or parsed final proposal content until you add an internal-only schema.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>

                                <CardFooter className="border-t border-white/10 px-5 py-3.5">
                                    <div className="flex w-full items-center justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Coverage</p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {service.questionCount > 0
                                                    ? `${service.questionCount} guided discovery steps are configured for this service.`
                                                    : "No discovery questions have been configured yet."}
                                            </p>
                                        </div>
                                        <div className="w-28 shrink-0">
                                            <div className="h-2 overflow-hidden rounded-full bg-white/10">
                                                <div className="h-full rounded-full bg-primary/70" style={{ width: `${Math.min(service.questionCount * 10, 100)}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}

                <Dialog open={open} onOpenChange={(value) => {
                    setOpen(value);
                    if (!value) {
                        setProposalEditor((current) => ({ ...current, jsonError: "" }));
                        setInternalEditor((current) => ({ ...current, jsonError: "" }));
                    }
                }}>
                    <DialogContent className="flex max-h-[min(92vh,920px)] w-[96vw] max-w-[1120px] flex-col overflow-hidden overscroll-contain border border-white/10 bg-[linear-gradient(180deg,rgba(24,24,24,0.98),rgba(10,10,10,0.98))] p-0 shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
                        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
                            <DialogHeader className="border-b border-white/10 px-5 py-4">
                                <DialogTitle className="text-xl font-semibold">
                                    {currentService ? "Edit Service" : "Add New Service"}
                                </DialogTitle>
                                <DialogDescription className="max-w-3xl text-sm leading-6 text-muted-foreground">
                                    Control the service card, the client-facing proposal format, and the internal JSON schema saved on projects for this service.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
                                <div className="grid gap-5 2xl:grid-cols-2">
                                    <Card className="border-white/10 bg-white/[0.02]">
                                        <CardHeader className="p-5 pb-0">
                                            <CardTitle className="text-base font-semibold">Service Basics</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4 p-5">
                                            <div className="grid gap-5 md:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label htmlFor="service-id">Service ID (Slug)</Label>
                                                    <Input id="service-id" value={formData.id} onChange={(event) => setFormData((current) => ({ ...current, id: event.target.value }))} disabled={Boolean(currentService)} placeholder="e.g. web_development" required />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="service-name">Display Name</Label>
                                                    <Input id="service-name" value={formData.name} onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. Web Development" required />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="service-description">Description</Label>
                                                <Textarea id="service-description" value={formData.description} onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))} className="min-h-[96px] resize-y" />
                                            </div>
                                            <div className="grid gap-5 md:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label htmlFor="service-icon">Icon Name</Label>
                                                    <div className="flex gap-2">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-background">
                                                            <DynamicIcon name={formData.icon} className="h-5 w-5" />
                                                        </div>
                                                        <Input id="service-icon" value={formData.icon} onChange={(event) => setFormData((current) => ({ ...current, icon: event.target.value }))} placeholder="e.g. Code" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="service-status">Status</Label>
                                                    <Select value={formData.active ? "true" : "false"} onValueChange={(value) => setFormData((current) => ({ ...current, active: value === "true" }))}>
                                                        <SelectTrigger id="service-status"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            {STATUS_OPTIONS.map((option) => (
                                                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="grid gap-5 md:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label htmlFor="service-min-budget">Minimum Budget</Label>
                                                    <Input id="service-min-budget" type="number" value={formData.minBudget} onChange={(event) => setFormData((current) => ({ ...current, minBudget: event.target.value }))} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="service-currency">Currency</Label>
                                                    <Select value={formData.currency} onValueChange={(value) => setFormData((current) => ({ ...current, currency: value }))}>
                                                        <SelectTrigger id="service-currency"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            {CURRENCY_OPTIONS.map((option) => (
                                                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                                            ))}
                                                            {false ? (
                                                                <>
                                                                    <SelectItem value="INR">INR (₹)</SelectItem>
                                                                    <SelectItem value="USD">USD ($)</SelectItem>
                                                                    <SelectItem value="EUR">EUR (€)</SelectItem>
                                                                    <SelectItem value="GBP">GBP (£)</SelectItem>
                                                                </>
                                                            ) : null}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-white/10 bg-white/[0.02]">
                                        <CardHeader className="p-5 pb-0">
                                            <CardTitle className="text-base font-semibold">AI Instructions</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4 p-5">
                                            <div className="space-y-2">
                                                <Label htmlFor="service-ai-prompt">AI Context / System Prompt</Label>
                                                <Textarea id="service-ai-prompt" value={formData.aiPrompt} onChange={(event) => setFormData((current) => ({ ...current, aiPrompt: event.target.value }))} className="min-h-[140px] resize-y font-mono text-sm" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="service-proposal-prompt">Proposal Prompt Rules</Label>
                                                <Textarea id="service-proposal-prompt" value={formData.proposalPrompt} onChange={(event) => setFormData((current) => ({ ...current, proposalPrompt: event.target.value }))} className="min-h-[180px] resize-y" placeholder="Tell the proposal generator what to include, avoid, or emphasize for this service." />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="mt-5 space-y-5">
                                    <StructureEditorCard
                                        title="Client Proposal Structure"
                                        description="Controls the proposal markdown that the client sees and approves."
                                        mode={proposalEditor.mode}
                                        customBadgeLabel="Custom JSON"
                                        fallbackBadgeLabel="Platform Defaults"
                                        fieldCount={cleanProposalConfig.fields.length}
                                        resetLabel="Use Defaults"
                                        emptyStateLabel="Add a field to start the client proposal structure."
                                        tab={proposalEditor.tab}
                                        onTabChange={(value) => setProposalEditor((current) => ({ ...current, tab: value }))}
                                        fields={proposalEditor.config.fields}
                                        onChangeField={changeProposalField}
                                        onMoveField={moveProposalField}
                                        onRemoveField={removeProposalField}
                                        onReset={() => resetProposalDefaults()}
                                        onAddField={addProposalField}
                                        json={proposalEditor.json}
                                        onJsonChange={(event) => {
                                            const nextValue = event.target.value;
                                            setProposalEditor((current) => ({
                                                ...current,
                                                json: nextValue,
                                                jsonError: ""
                                            }));
                                        }}
                                        jsonError={proposalEditor.jsonError}
                                        onFormatJson={() => setProposalEditor((current) => ({
                                            ...current,
                                            json: stringifyConfig(parseJsonConfig(current.json).config || current.config)
                                        }))}
                                        onApplyJson={applyProposalJson}
                                        previewText={previewText}
                                        guidanceFields={cleanProposalConfig.fields.filter((field) => field.guidance)}
                                    />

                                    <StructureEditorCard
                                        title="Internal Project JSON Structure"
                                        description="Controls the internal-only `proposalJson` saved on projects for automation, matching, and downstream system workflows."
                                        mode={internalEditor.mode}
                                        customBadgeLabel="Custom Internal JSON"
                                        fallbackBadgeLabel="Fallback Behavior"
                                        fieldCount={cleanInternalConfig.fields.length}
                                        resetLabel="Use Fallback"
                                        emptyStateLabel="Add a field to start the internal project JSON structure."
                                        statusNote={internalEditor.mode === "inherit"
                                            ? "No internal-only template is saved yet. Project proposalJson falls back to the service template when one is explicitly configured, otherwise it uses whatever can be parsed from the final proposal."
                                            : null}
                                        tab={internalEditor.tab}
                                        onTabChange={(value) => setInternalEditor((current) => ({ ...current, tab: value }))}
                                        fields={internalEditor.config.fields}
                                        onChangeField={changeInternalField}
                                        onMoveField={moveInternalField}
                                        onRemoveField={removeInternalField}
                                        onReset={() => resetInternalStructure()}
                                        onAddField={addInternalField}
                                        json={internalEditor.json}
                                        onJsonChange={(event) => {
                                            const nextValue = event.target.value;
                                            setInternalEditor((current) => ({
                                                ...current,
                                                json: nextValue,
                                                jsonError: ""
                                            }));
                                        }}
                                        jsonError={internalEditor.jsonError}
                                        onFormatJson={() => setInternalEditor((current) => ({
                                            ...current,
                                            json: stringifyConfig(parseJsonConfig(current.json).config || current.config)
                                        }))}
                                        onApplyJson={applyInternalJson}
                                        previewText={internalPreviewText}
                                        guidanceFields={cleanInternalConfig.fields.filter((field) => field.guidance)}
                                    />
                                </div>
                            </div>

                            <DialogFooter className="border-t border-white/10 px-5 py-3.5">
                                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">{currentService ? "Save Changes" : "Create Service"}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
};

export default AdminServices;
