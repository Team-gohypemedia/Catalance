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

const ProposalFieldRow = ({ field, index, total, onChange, onMove, onRemove }) => (
    <div className="rounded-xl border bg-background p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
                <Badge variant="secondary">Field {index + 1}</Badge>
                <Badge variant="outline">{field.type === "list" ? "List" : "Text"}</Badge>
            </div>
            <div className="flex gap-2">
                <Button type="button" variant="outline" size="icon" onClick={() => onMove(field.id, -1)} disabled={index === 0}><LucideIcons.ArrowUp className="h-4 w-4" /></Button>
                <Button type="button" variant="outline" size="icon" onClick={() => onMove(field.id, 1)} disabled={index === total - 1}><LucideIcons.ArrowDown className="h-4 w-4" /></Button>
                <Button type="button" variant="outline" size="icon" onClick={() => onRemove(field.id)} disabled={total <= 1}><LucideIcons.Trash2 className="h-4 w-4" /></Button>
            </div>
        </div>
        <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_180px]">
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
        <div className="mt-4 space-y-2">
            <Label>Field Guidance</Label>
            <Textarea value={field.guidance} onChange={(event) => onChange(field.id, { guidance: event.target.value })} placeholder="Tell the AI what to include or avoid in this field." className="min-h-[88px] resize-y" />
        </div>
    </div>
);

const AdminServices = () => {
    const { authFetch } = useAuth();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [currentService, setCurrentService] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [proposalMode, setProposalMode] = useState("default");
    const [proposalConfig, setProposalConfig] = useState(defaultConfig({}));
    const [proposalJson, setProposalJson] = useState(stringifyConfig(defaultConfig({})));
    const [proposalJsonError, setProposalJsonError] = useState("");
    const [proposalTab, setProposalTab] = useState("builder");

    const cleanProposalConfig = useMemo(() => sanitizeConfig(proposalConfig), [proposalConfig]);
    const previewText = useMemo(() => configPreview(proposalConfig), [proposalConfig]);
    const serviceCards = useMemo(
        () => services.map((service) => ({
            ...service,
            hasCustomProposalStructure: Boolean(cleanBlock(service.proposalStructure)),
            hasProposalPrompt: Boolean(cleanBlock(service.proposalPrompt)),
            proposalLabels: configLabels(service.proposalStructure, service)
        })),
        [services]
    );

    useEffect(() => {
        fetchServices();
    }, [authFetch]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!open || proposalMode !== "default") return;
        const defaults = defaultConfig({ id: formData.id, slug: formData.id, name: formData.name });
        setProposalConfig(defaults);
        setProposalJson(stringifyConfig(defaults));
        setProposalJsonError("");
    }, [formData.id, formData.name, open, proposalMode]);

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

    const syncProposalEditor = (nextConfig, nextMode = proposalMode) => {
        const normalized = makeConfig(nextConfig?.fields || []);
        setProposalConfig(normalized);
        setProposalJson(stringifyConfig(normalized));
        setProposalJsonError("");
        setProposalMode(nextMode);
        setFormData((current) => ({ ...current, proposalStructure: nextMode === "custom" ? storedConfig(normalized) : "" }));
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
            proposalPrompt: service.proposalPrompt || "",
            minBudget: service.minBudget || 0,
            currency: service.currency || "INR"
        } : { ...EMPTY_FORM };
        const hasCustom = Boolean(cleanBlock(nextForm.proposalStructure));
        const config = hasCustom ? parseStoredConfig(nextForm.proposalStructure, nextForm) : defaultConfig(nextForm);
        setCurrentService(service);
        setFormData(nextForm);
        setProposalMode(hasCustom ? "custom" : "default");
        setProposalConfig(config);
        setProposalJson(stringifyConfig(config));
        setProposalJsonError("");
        setProposalTab("builder");
        setOpen(true);
    };

    const resetProposalDefaults = (showToast = true) => {
        const defaults = defaultConfig({ id: formData.id, slug: formData.id, name: formData.name });
        setProposalMode("default");
        setProposalConfig(defaults);
        setProposalJson(stringifyConfig(defaults));
        setProposalJsonError("");
        setFormData((current) => ({ ...current, proposalStructure: "" }));
        if (showToast) toast.success("Proposal structure reset to platform defaults");
    };

    const changeProposalField = (id, patch) => syncProposalEditor({ fields: proposalConfig.fields.map((field) => field.id === id ? { ...field, ...patch } : field) }, "custom");
    const moveProposalField = (id, direction) => {
        const index = proposalConfig.fields.findIndex((field) => field.id === id);
        const nextIndex = index + direction;
        if (index < 0 || nextIndex < 0 || nextIndex >= proposalConfig.fields.length) return;
        const fields = [...proposalConfig.fields];
        [fields[index], fields[nextIndex]] = [fields[nextIndex], fields[index]];
        syncProposalEditor({ fields }, "custom");
    };
    const removeProposalField = (id) => syncProposalEditor({ fields: proposalConfig.fields.filter((field) => field.id !== id) }, "custom");
    const addProposalField = () => syncProposalEditor({
        fields: [...proposalConfig.fields, makeField({ label: `New Field ${proposalConfig.fields.length + 1}`, type: "text" })]
    }, "custom");

    const applyProposalJson = () => {
        const parsed = parseJsonConfig(proposalJson);
        if (parsed.error) {
            setProposalJsonError(parsed.error);
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

    const submit = async (event) => {
        event.preventDefault();
        if (proposalJsonError) {
            toast.error("Fix the proposal JSON before saving");
            return;
        }
        const proposalStructure = proposalMode === "custom" ? storedConfig(proposalConfig) : "";
        if (proposalMode === "custom" && !proposalStructure) {
            toast.error("Add at least one valid proposal field or reset to defaults");
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
            <div className="mx-auto flex max-w-7xl flex-col gap-8 p-8">
                <AdminTopBar label="Service Management" />

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
                            Services
                        </h1>
                        <p className="mt-2 text-lg text-muted-foreground">
                            Manage service cards, AI rules, and per-service proposal JSON.
                        </p>
                    </div>
                    <Button onClick={() => openDialog()} size="lg">
                        <LucideIcons.Plus className="mr-2 h-5 w-5" />
                        Add New Service
                    </Button>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="h-72 animate-pulse rounded-xl border bg-card/50" />
                        ))}
                    </div>
                ) : serviceCards.length === 0 ? (
                    <div className="flex h-80 flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card/30">
                        <LucideIcons.Layers className="mb-4 h-10 w-10 text-muted-foreground" />
                        <h3 className="text-xl font-semibold">No services found</h3>
                        <p className="mt-2 max-w-sm text-center text-muted-foreground">
                            Add your first service to control its AI behavior and proposal structure.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {serviceCards.map((service) => (
                            <Card key={service.id} className="flex h-full min-w-0 flex-col overflow-hidden">
                                <CardHeader className="min-w-0 space-y-4">
                                    <div className="flex min-w-0 items-start justify-between gap-3">
                                        <div className="flex min-w-0 flex-1 items-start gap-4">
                                            <div className={`shrink-0 rounded-xl p-3 ${service.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                                                <DynamicIcon name={service.icon} className="h-7 w-7" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <CardTitle className="line-clamp-2 break-words text-xl leading-tight">
                                                    {service.name}
                                                </CardTitle>
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    <Badge variant={service.active ? "default" : "secondary"}>
                                                        {service.active ? "Active" : "Inactive"}
                                                    </Badge>
                                                    <Badge variant={service.hasCustomProposalStructure ? "default" : "outline"}>
                                                        {service.hasCustomProposalStructure ? "Custom JSON" : "Default Template"}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => openDialog(service)}>
                                            <LucideIcons.Settings2 className="h-5 w-5" />
                                        </Button>
                                    </div>
                                    <p className="line-clamp-3 text-sm text-muted-foreground">
                                        {service.description || "No description provided."}
                                    </p>
                                </CardHeader>

                                <CardContent className="flex-1 space-y-4">
                                    <div className="grid grid-cols-2 gap-4 rounded-xl border bg-muted/20 p-4">
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Start Price</p>
                                            <p className="font-semibold">{service.currency} {Number(service.minBudget || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Questions</p>
                                            <p className="font-semibold">{service.questionCount} steps</p>
                                        </div>
                                    </div>
                                    <div className="rounded-xl border bg-background p-4">
                                        <div className="mb-3 flex items-center justify-between gap-2">
                                            <div>
                                                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Proposal Structure</p>
                                                <p className="text-sm text-muted-foreground">{service.proposalLabels.length} fields</p>
                                            </div>
                                            <Badge variant="secondary">
                                                {service.hasProposalPrompt ? "Prompt Set" : "No Prompt"}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {service.proposalLabels.slice(0, 4).map((label) => (
                                                <Badge key={`${service.id}-${label}`} variant="outline">{label}</Badge>
                                            ))}
                                            {service.proposalLabels.length > 4 ? (
                                                <Badge variant="outline">+{service.proposalLabels.length - 4} more</Badge>
                                            ) : null}
                                        </div>
                                    </div>
                                </CardContent>

                                <CardFooter>
                                    <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                                        <div className="h-full bg-primary/20" style={{ width: `${Math.min(service.questionCount * 10, 100)}%` }} />
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}

                <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) setProposalJsonError(""); }}>
                    <DialogContent className="max-h-[92vh] max-w-6xl overflow-hidden border-none p-0">
                        <form onSubmit={submit} className="flex max-h-[92vh] flex-col">
                            <DialogHeader className="border-b px-6 py-5">
                                <DialogTitle className="text-2xl">
                                    {currentService ? "Edit Service" : "Add New Service"}
                                </DialogTitle>
                                <DialogDescription>
                                    Control the service card plus the exact proposal JSON structure and instructions used by the AI.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="flex-1 overflow-y-auto px-6 py-6">
                                <div className="grid gap-6 lg:grid-cols-2">
                                    <Card className="border-dashed">
                                        <CardHeader>
                                            <CardTitle className="text-lg">Service Basics</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-5">
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
                                                            <SelectItem value="true">Active & Public</SelectItem>
                                                            <SelectItem value="false">Draft / Inactive</SelectItem>
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
                                                            <SelectItem value="INR">INR (₹)</SelectItem>
                                                            <SelectItem value="USD">USD ($)</SelectItem>
                                                            <SelectItem value="EUR">EUR (€)</SelectItem>
                                                            <SelectItem value="GBP">GBP (£)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-dashed">
                                        <CardHeader>
                                            <CardTitle className="text-lg">AI Instructions</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-5">
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

                                <Card className="mt-6">
                                    <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <CardTitle className="text-xl">Proposal Structure Builder</CardTitle>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Edit the structure visually or switch to raw JSON. Once you change the default fields, this service gets its own custom proposal template.
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant={proposalMode === "custom" ? "default" : "outline"}>
                                                {proposalMode === "custom" ? "Custom JSON" : "Platform Defaults"}
                                            </Badge>
                                            <Badge variant="secondary">{cleanProposalConfig.fields.length} fields</Badge>
                                            <Button type="button" variant="outline" onClick={() => resetProposalDefaults()}>
                                                <LucideIcons.RefreshCcw className="mr-2 h-4 w-4" />
                                                Use Defaults
                                            </Button>
                                            <Button type="button" variant="outline" onClick={addProposalField}>
                                                <LucideIcons.Plus className="mr-2 h-4 w-4" />
                                                Add Field
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <Tabs value={proposalTab} onValueChange={setProposalTab} className="gap-4">
                                            <TabsList className="w-full justify-start">
                                                <TabsTrigger value="builder">Builder</TabsTrigger>
                                                <TabsTrigger value="json">Raw JSON</TabsTrigger>
                                                <TabsTrigger value="preview">Preview</TabsTrigger>
                                            </TabsList>

                                            <TabsContent value="builder" className="space-y-4">
                                                {proposalConfig.fields.length === 0 ? (
                                                    <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                                        Add a field to start the proposal structure.
                                                    </div>
                                                ) : proposalConfig.fields.map((field, index) => (
                                                    <ProposalFieldRow
                                                        key={field.id}
                                                        field={field}
                                                        index={index}
                                                        total={proposalConfig.fields.length}
                                                        onChange={changeProposalField}
                                                        onMove={moveProposalField}
                                                        onRemove={removeProposalField}
                                                    />
                                                ))}
                                            </TabsContent>

                                            <TabsContent value="json" className="space-y-4">
                                                <Textarea
                                                    value={proposalJson}
                                                    onChange={(event) => {
                                                        setProposalJson(event.target.value);
                                                        if (proposalJsonError) setProposalJsonError("");
                                                    }}
                                                    className="min-h-[360px] resize-y font-mono text-sm"
                                                    spellCheck={false}
                                                />
                                                {proposalJsonError ? (
                                                    <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                                                        {proposalJsonError}
                                                    </div>
                                                ) : null}
                                                <div className="flex flex-wrap gap-2">
                                                    <Button type="button" variant="outline" onClick={() => setProposalJson(stringifyConfig(parseJsonConfig(proposalJson).config || proposalConfig))}>
                                                        Format JSON
                                                    </Button>
                                                    <Button type="button" onClick={applyProposalJson}>
                                                        Apply JSON
                                                    </Button>
                                                </div>
                                            </TabsContent>

                                            <TabsContent value="preview" className="grid gap-4 lg:grid-cols-2">
                                                <div className="rounded-xl border bg-background p-4">
                                                    <p className="mb-3 text-sm font-medium">Generated Structure</p>
                                                    <pre className="whitespace-pre-wrap rounded-xl bg-muted/30 p-4 text-sm leading-6">
                                                        {previewText || "No valid fields configured yet."}
                                                    </pre>
                                                </div>
                                                <div className="rounded-xl border bg-background p-4">
                                                    <p className="mb-3 text-sm font-medium">Field Guidance</p>
                                                    <div className="space-y-3">
                                                        {cleanProposalConfig.fields.filter((field) => field.guidance).length ? cleanProposalConfig.fields.filter((field) => field.guidance).map((field) => (
                                                            <div key={field.id} className="rounded-xl border bg-muted/20 p-3">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <p className="font-medium">{field.label}</p>
                                                                    <Badge variant="outline">{field.type === "list" ? "List" : "Text"}</Badge>
                                                                </div>
                                                                <p className="mt-2 text-sm text-muted-foreground">{field.guidance}</p>
                                                            </div>
                                                        )) : (
                                                            <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                                                                No field-level guidance added yet.
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </TabsContent>
                                        </Tabs>
                                    </CardContent>
                                </Card>
                            </div>

                            <DialogFooter className="border-t px-6 py-4">
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
