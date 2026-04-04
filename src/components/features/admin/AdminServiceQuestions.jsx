import React, { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { AdminTopBar } from "./AdminTopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/shared/context/AuthContext";
import { toast } from "sonner";
import { Reorder } from "framer-motion";
import * as LucideIcons from "lucide-react";

import ServiceQuestionFlow from "./ServiceQuestionFlow";

const QUESTION_TYPE_META = {
    input: {
        label: "Text Input",
        badgeClassName: "border-white/10 bg-white/5 text-slate-100",
        accentClassName: "bg-slate-300"
    },
    single_option: {
        label: "Single Select",
        badgeClassName: "border-primary/25 bg-primary/12 text-primary",
        accentClassName: "bg-primary"
    },
    multi_option: {
        label: "Multi Select",
        badgeClassName: "border-emerald-500/25 bg-emerald-500/12 text-emerald-300",
        accentClassName: "bg-emerald-400"
    }
};

const SummaryMetric = ({ label, value, note }) => (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-3.5 py-3.5 backdrop-blur">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/70">{label}</p>
        <p className="mt-2 text-2xl font-medium tracking-tight [font-variant-numeric:tabular-nums]">{value}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{note}</p>
    </div>
);

const AdminServiceQuestions = () => {
    const { authFetch } = useAuth();
    const [services, setServices] = useState([]);
    const [selectedServiceId, setSelectedServiceId] = useState("");
    const [serviceSearch, setServiceSearch] = useState("");
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingServices, setLoadingServices] = useState(false);
    const [viewMode, setViewMode] = useState("list"); // 'list' or 'flow'

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        id: "",
        type: "input",
        question: "",
        subtitle: "",
        saveResponse: false,
        nextQuestionSlug: "",
        required: true,
        options: [],
        logic: []
    });

    useEffect(() => {
        fetchServices();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (selectedServiceId) {
            fetchQuestions(selectedServiceId);
        } else {
            setQuestions([]);
        }
    }, [selectedServiceId]); // eslint-disable-line react-hooks/exhaustive-deps

    const selectedService = services.find((service) => service.id === selectedServiceId) || null;
    const normalizedServiceSearch = serviceSearch.trim().toLowerCase();
    const visibleServices = services.filter((service) => {
        if (service.id === selectedServiceId) return true;
        if (!normalizedServiceSearch) return true;
        return [service.name, service.id, service.description]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(normalizedServiceSearch));
    });
    const savedContextCount = questions.filter((question) => question.saveResponse).length;
    const optionalCount = questions.filter((question) => !question.required).length;
    const branchingRuleCount = questions.reduce(
        (count, question) => count + ((question.logic || []).filter((rule) => rule.nextQuestionSlug).length),
        0
    );
    const selectionQuestionCount = questions.filter((question) => question.type !== "input").length;

    const fetchServices = async () => {
        setLoadingServices(true);
        try {
            const res = await authFetch("/admin/services");
            if (!res.ok) {
                console.error("Failed to fetch services. Status:", res.status);
                toast.error(`Failed to load services: ${res.statusText}`);
                return;
            }
            const data = await res.json();

            if (data?.data) {
                setServices(data.data);
                if (data.data.length > 0 && !selectedServiceId) {
                    setSelectedServiceId(data.data[0].id);
                }
            }
        } catch (error) {
            console.error("Failed to load services:", error);
            toast.error("Failed to load services");
        } finally {
            setLoadingServices(false);
        }
    };

    const fetchQuestions = async (serviceId) => {
        setLoading(true);
        try {
            const res = await authFetch(`/admin/services/${serviceId}/questions`);
            const data = await res.json();
            if (data?.data) {
                setQuestions(data.data);
            }
        } catch (error) {
            console.error("Failed to load questions:", error);
            toast.error("Failed to load questions");
        } finally {
            setLoading(false);
        }
    };

    const handleReorder = (newOrder) => {
        setQuestions(newOrder);
    };

    const handleDragEnd = async () => {
        if (!selectedServiceId) return;
        try {
            const orderedIds = questions.map(q => q.id);
            await authFetch(`/admin/services/${selectedServiceId}/questions/reorder`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderedIds })
            });
            toast.success("Order saved", { duration: 1000 });
        } catch (error) {
            console.error("Failed to save order:", error);
            toast.error("Failed to save order");
        }
    };

    const handleDelete = async (question) => {
        if (!confirm("Are you sure you want to delete this question?")) return;

        try {
            const res = await authFetch(`/admin/services/${selectedServiceId}/questions/${question.id}`, {
                method: "DELETE"
            });

            if (res.ok) {
                toast.success("Question deleted");
                fetchQuestions(selectedServiceId);
            } else {
                toast.error("Failed to delete question");
            }
        } catch (error) {
            console.error("Error deleting question:", error);
            toast.error("Error deleting question");
        }
    };

    const handleOpenDialog = (question = null) => {
        if (question) {
            setCurrentQuestion(question);
            setFormData({
                id: question.id,
                type: question.type || "input",
                question: question.question,
                subtitle: question.subtitle || "",
                saveResponse: question.saveResponse || false,
                nextQuestionSlug: question.nextQuestionSlug || "",
                required: question.required !== undefined ? question.required : true,
                options: question.options || [],
                logic: question.logic || []
            });
        } else {
            setCurrentQuestion(null);
            setFormData({
                id: `q_${Date.now()}`,
                type: "input",
                question: "",
                subtitle: "",
                saveResponse: false,
                nextQuestionSlug: "",
                required: true,
                options: [],
                logic: []
            });
        }
        setIsDialogOpen(true);
    };

    const handleOptionChange = (idx, value) => {
        const newOptions = [...formData.options];
        newOptions[idx] = { ...newOptions[idx], label: value, value };
        setFormData({ ...formData, options: newOptions });
    };

    const addOption = () => {
        setFormData({
            ...formData,
            options: [...formData.options, { label: "", value: "" }]
        });
    };

    const removeOption = (idx) => {
        const newOptions = formData.options.filter((_, i) => i !== idx);
        setFormData({ ...formData, options: newOptions });
    };

    // Logic Rules Handlers
    const addLogicRule = () => {
        setFormData({
            ...formData,
            logic: [...(formData.logic || []), { condition: "equals", value: "", nextQuestionSlug: "" }]
        });
    };

    const updateLogicRule = (idx, field, value) => {
        const newLogic = [...(formData.logic || [])];
        newLogic[idx] = { ...newLogic[idx], [field]: value };
        setFormData({ ...formData, logic: newLogic });
    };

    const removeLogicRule = (idx) => {
        const newLogic = (formData.logic || []).filter((_, i) => i !== idx);
        setFormData({ ...formData, logic: newLogic });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedServiceId) return;

        try {
            const payload = {
                ...formData,
                existingId: currentQuestion?.id
            };

            const res = await authFetch(`/admin/services/${selectedServiceId}/questions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success(currentQuestion ? "Question updated" : "Question created");
                fetchQuestions(selectedServiceId);
                setIsDialogOpen(false);
            } else {
                toast.error("Failed to save question");
            }
        } catch (error) {
            console.error("Error saving question:", error);
            toast.error("Error saving question");
        }
    };

    const handleCopyFlow = () => {
        if (!questions || questions.length === 0) {
            toast.error("No questions to copy");
            return;
        }

        const formattedFlow = questions.map((q, index) => {
            let flowText = `${index + 1}. [${q.id}] ${q.question} (${q.type})`;
            if (q.options && q.options.length > 0) {
                const optLabels = q.options.map(o => typeof o === 'object' ? (o.label || o.value) : o);
                flowText += `\n   Options: ${optLabels.join(', ')}`;
            }
            if (q.logic && q.logic.length > 0) {
                flowText += `\n   Logic: ${q.logic.map(l => `If ${l.condition} '${l.value}' -> Jump to ${l.nextQuestionSlug}`).join(' | ')}`;
            }
            if (q.nextQuestionSlug) {
                flowText += `\n   Next: ${q.nextQuestionSlug}`;
            }
            return flowText;
        }).join('\n\n');

        const fullCopyText = `Service Content Flow\n===================\n\n${formattedFlow}\n\n===================\nRaw JSON Configuration:\n${JSON.stringify(questions, null, 2)}`;

        navigator.clipboard.writeText(fullCopyText).then(() => {
            toast.success("Flow copied to clipboard!");
        }).catch(err => {
            console.error("Failed to copy:", err);
            // Fallback for older browsers
            try {
                const textArea = document.createElement("textarea");
                textArea.value = fullCopyText;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand("copy");
                document.body.removeChild(textArea);
                toast.success("Flow copied to clipboard!");
            } catch (fallbackErr) {
                toast.error("Failed to copy flow to clipboard");
            }
        });
    };

    return (
        <AdminLayout>
            <div className="relative mx-auto flex max-w-[1440px] flex-col gap-6 px-5 py-6 lg:px-6">
                <AdminTopBar label="Service Questions" />

                <div className="grid items-start gap-5 xl:grid-cols-[290px_minmax(0,1fr)]">

                    <Card className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(28,28,28,0.98),rgba(12,12,12,0.98))] shadow-[0_18px_44px_rgba(0,0,0,0.28)]">
                        <CardHeader className="space-y-4 border-b border-white/10 p-4">
                            <div className="space-y-1">
                                <CardTitle className="text-xl font-semibold tracking-tight">Services</CardTitle>
                                <p className="text-sm leading-6 text-muted-foreground">Select a service to manage its interview flow, branching, and AI context capture.</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">
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
                            <div className="grid grid-cols-2 gap-2.5">
                                <SummaryMetric label="Visible" value={visibleServices.length} note="Services matching this filter" />
                                <SummaryMetric label="Catalog" value={services.length} note="Services available to configure" />
                            </div>
                        </CardHeader>

                        <CardContent className="p-3">
                            <div className="space-y-2">
                                    {loadingServices ? (
                                        <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-muted-foreground">
                                            Loading services...
                                        </div>
                                    ) : visibleServices.length === 0 ? (
                                        <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-muted-foreground">
                                            No services match this search yet.
                                        </div>
                                    ) : (
                                        visibleServices.map((service) => {
                                            const Icon = LucideIcons[service.icon] || LucideIcons.Layers;
                                            const isSelected = selectedServiceId === service.id;
                                            return (
                                                <button
                                                    key={service.id}
                                                    type="button"
                                                    onClick={() => setSelectedServiceId(service.id)}
                                                    aria-pressed={isSelected}
                                                    className={`w-full rounded-2xl border px-3.5 py-3.5 text-left transition-all duration-200 ${
                                                        isSelected
                                                            ? "border-primary/30 bg-primary/10 shadow-[0_12px_28px_rgba(255,199,0,0.1)]"
                                                            : "border-white/10 bg-black/15 hover:border-white/20 hover:bg-white/[0.03]"
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${
                                                            isSelected
                                                                ? "border-primary/35 bg-primary/15 text-primary"
                                                                : "border-white/10 bg-white/[0.03] text-muted-foreground"
                                                        }`}>
                                                            <Icon className="h-[18px] w-[18px]" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="min-w-0">
                                                                    <p className="line-clamp-2 text-sm font-medium leading-5 text-white">{service.name}</p>
                                                                    <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{service.id}</p>
                                                                </div>
                                                                {isSelected ? <LucideIcons.ChevronRight className="mt-1 h-4 w-4 shrink-0 text-primary" /> : null}
                                                            </div>
                                                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                                                <Badge variant={service.active ? "default" : "secondary"} className="rounded-full">
                                                                    {service.active ? "Active" : "Draft"}
                                                                </Badge>
                                                                <Badge variant="outline" className="rounded-full">
                                                                    {service.questionCount} questions
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })
                                    )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex flex-col gap-5">
                        <section className="relative overflow-hidden rounded-[26px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,199,0,0.12),transparent_34%),linear-gradient(135deg,rgba(24,24,24,0.96),rgba(8,8,8,1))] p-5 shadow-[0_22px_60px_rgba(0,0,0,0.3)] lg:p-6">
                            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,199,0,0.08),transparent)] opacity-60" />
                            <div className="relative flex flex-col gap-5">
                                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                    <div className="max-w-3xl">
                                        <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                                            Interview Design
                                        </div>
                                        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white [text-wrap:balance] sm:text-3xl">
                                            {selectedService ? selectedService.name : "Question Manager"}
                                        </h1>
                                        <p className="mt-2.5 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                                            {selectedService
                                                ? "Tune the question order, the answers saved into AI context, and the branches that shape proposal generation."
                                                : "Select a service to start designing its AI interview flow."}
                                        </p>
                                        {selectedService ? (
                                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                                <Badge variant="outline" className="rounded-full border-white/10 bg-white/[0.04] font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                                                    {selectedService.id}
                                                </Badge>
                                                <Badge variant={selectedService.active ? "default" : "secondary"} className="rounded-full">
                                                    {selectedService.active ? "Active Service" : "Draft Service"}
                                                </Badge>
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className="flex flex-wrap gap-2.5">
                                        <div className="inline-flex rounded-full border border-white/10 bg-black/20 p-1">
                                            <button
                                                type="button"
                                                onClick={() => setViewMode("list")}
                                                aria-pressed={viewMode === "list"}
                                                className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                                                    viewMode === "list"
                                                        ? "bg-white text-black shadow-sm"
                                                        : "text-muted-foreground hover:text-white"
                                                }`}
                                            >
                                                <LucideIcons.List className="mr-2 h-4 w-4" />
                                                List
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setViewMode("flow")}
                                                aria-pressed={viewMode === "flow"}
                                                className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                                                    viewMode === "flow"
                                                        ? "bg-white text-black shadow-sm"
                                                        : "text-muted-foreground hover:text-white"
                                                }`}
                                            >
                                                <LucideIcons.GitGraph className="mr-2 h-4 w-4" />
                                                Flow
                                            </button>
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={handleCopyFlow}
                                            disabled={!selectedServiceId || questions.length === 0}
                                            className="rounded-full border-white/10 bg-white/[0.04] px-4"
                                        >
                                            <LucideIcons.Copy className="mr-2 h-4 w-4" />
                                            Copy Flow
                                        </Button>
                                        <Button
                                            onClick={() => handleOpenDialog()}
                                            disabled={!selectedServiceId}
                                            className="rounded-full px-5 shadow-[0_14px_30px_rgba(255,199,0,0.14)]"
                                        >
                                            <LucideIcons.Plus className="mr-2 h-5 w-5" />
                                            Add Question
                                        </Button>
                                    </div>
                                </div>

                                {selectedService ? (
                                    <>
                                        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                                            <SummaryMetric label="Questions" value={questions.length} note="Total steps in this interview flow" />
                                            <SummaryMetric label="AI Context" value={savedContextCount} note="Questions saved for downstream prompts" />
                                            <SummaryMetric label="Branches" value={branchingRuleCount} note="Conditional rules that reroute the flow" />
                                            <SummaryMetric label="Selections" value={selectionQuestionCount} note="Choice-based prompts in this flow" />
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-black/15 px-3.5 py-2.5 text-sm text-muted-foreground">
                                            <LucideIcons.GripVertical className="h-4 w-4 text-primary" />
                                            Drag cards to reorder. Click a card or flow node to edit it.
                                            <span className="text-white/50">Optional prompts: {optionalCount}</span>
                                        </div>
                                    </>
                                ) : null}
                            </div>
                        </section>

                        <Card className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(24,24,24,0.95),rgba(10,10,10,0.98))]">
                            {viewMode === "flow" && selectedServiceId && questions.length > 0 ? (
                                <>
                                    <div className="border-b border-white/10 px-4 py-3 text-sm text-muted-foreground">
                                        Inspect branches visually. Click any node to open the editor for that question.
                                    </div>
                                    <div className="h-[680px] p-3.5">
                                        <ServiceQuestionFlow
                                            questions={questions}
                                            onEditQuestion={(question) => handleOpenDialog(question)}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="p-5">
                                    <div className="space-y-4">
                                        {!selectedServiceId ? (
                                            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-black/15 px-6 text-center">
                                                <div className="mb-5 rounded-full border border-primary/20 bg-primary/10 p-4 text-primary">
                                                    <LucideIcons.MousePointer2 className="h-12 w-12" />
                                                </div>
                                                <h3 className="text-2xl font-semibold tracking-tight">Select A Service</h3>
                                                <p className="mt-3 max-w-md text-muted-foreground">
                                                    Choose a service from the rail to review its interview flow, question order, and branching logic.
                                                </p>
                                            </div>
                                        ) : loading ? (
                                            <div className="space-y-3.5">
                                                {[1, 2, 3].map((item) => (
                                                    <div key={item} className="h-36 animate-pulse rounded-[22px] border border-white/10 bg-white/[0.03]" />
                                                ))}
                                            </div>
                                        ) : questions.length === 0 ? (
                                            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-black/15 px-6 text-center">
                                                <div className="mb-5 rounded-full border border-primary/20 bg-primary/10 p-4 text-primary">
                                                    <LucideIcons.FileQuestion className="h-10 w-10" />
                                                </div>
                                                <h3 className="text-2xl font-semibold tracking-tight">No Questions Defined</h3>
                                                <p className="mt-3 max-w-xl text-muted-foreground">
                                                    This service does not have an interview flow yet. Add the first question to start collecting the context that drives proposals and internal project JSON.
                                                </p>
                                                <Button className="mt-6 rounded-full px-5" onClick={() => handleOpenDialog()}>
                                                    <LucideIcons.Plus className="mr-2 h-4 w-4" />
                                                    Create First Question
                                                </Button>
                                            </div>
                                        ) : (
                                            <Reorder.Group axis="y" values={questions} onReorder={handleReorder} className="space-y-4">
                                                {questions.map((question, index) => {
                                                    const typeMeta = QUESTION_TYPE_META[question.type] || QUESTION_TYPE_META.input;
                                                    const logicRuleCount = (question.logic || []).filter((rule) => rule.nextQuestionSlug).length;

                                                    return (
                                                        <Reorder.Item
                                                            key={question.id}
                                                            value={question}
                                                            onDragEnd={handleDragEnd}
                                                        >
                                                            <Card className="group relative overflow-hidden rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(31,31,31,0.98),rgba(13,13,13,0.98))] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_16px_34px_rgba(0,0,0,0.28)]">
                                                                <div className={`absolute left-0 top-0 h-full w-1.5 ${typeMeta.accentClassName}`} />
                                                                <CardContent className="p-5">
                                                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                                                                        <div className="flex items-center gap-3 lg:w-[72px] lg:flex-col lg:items-center lg:justify-start">
                                                                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] font-mono text-sm font-semibold text-white">
                                                                                {index + 1}
                                                                            </div>
                                                                            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground lg:flex-col lg:gap-1">
                                                                                <LucideIcons.GripVertical className="h-4 w-4 cursor-grab active:cursor-grabbing" />
                                                                                Drag
                                                                            </div>
                                                                        </div>

                                                                        <div className="min-w-0 flex-1 space-y-3.5">
                                                                            <div className="flex flex-col gap-3.5 xl:flex-row xl:items-start xl:justify-between">
                                                                                <div className="min-w-0 space-y-3">
                                                                                    <div className="flex flex-wrap gap-2">
                                                                                        <Badge variant="outline" className="rounded-full border-white/10 bg-white/[0.03] font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                                                                                            {question.id}
                                                                                        </Badge>
                                                                                        <Badge variant="outline" className={`rounded-full ${typeMeta.badgeClassName}`}>
                                                                                            {typeMeta.label}
                                                                                        </Badge>
                                                                                        {question.required ? null : (
                                                                                            <Badge variant="secondary" className="rounded-full">Optional</Badge>
                                                                                        )}
                                                                                        {question.saveResponse ? (
                                                                                            <Badge variant="secondary" className="rounded-full border-primary/20 bg-primary/15 text-primary">
                                                                                                AI Context Saved
                                                                                            </Badge>
                                                                                        ) : null}
                                                                                    </div>
                                                                                    <div className="space-y-2">
                                                                                        <h3 className="text-xl font-semibold leading-tight tracking-tight text-white [text-wrap:balance]">
                                                                                            {question.question}
                                                                                        </h3>
                                                                                        <p className="text-sm text-muted-foreground">
                                                                                            {logicRuleCount > 0
                                                                                                ? `${logicRuleCount} conditional branch${logicRuleCount === 1 ? "" : "es"} configured.`
                                                                                                : question.nextQuestionSlug
                                                                                                    ? `Default jump: ${question.nextQuestionSlug}.`
                                                                                                    : "Follows the sequential service flow."}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>

                                                                                <div className="flex shrink-0 gap-2">
                                                                                    <Button
                                                                                        variant="outline"
                                                                                        size="icon"
                                                                                        onClick={() => handleOpenDialog(question)}
                                                                                        className="rounded-full border-white/10 bg-white/[0.04]"
                                                                                        aria-label={`Edit ${question.id}`}
                                                                                    >
                                                                                        <LucideIcons.Pencil className="h-4 w-4" />
                                                                                    </Button>
                                                                                    <Button
                                                                                        variant="outline"
                                                                                        size="icon"
                                                                                        onClick={() => handleDelete(question)}
                                                                                        className="rounded-full border-white/10 bg-white/[0.04] hover:border-destructive/40 hover:bg-destructive/10"
                                                                                        aria-label={`Delete ${question.id}`}
                                                                                    >
                                                                                        <LucideIcons.Trash2 className="h-4 w-4" />
                                                                                    </Button>
                                                                                </div>
                                                                            </div>

                                                                            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.9fr)]">
                                                                                <div className="rounded-2xl border border-white/10 bg-black/20 p-3.5">
                                                                                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/70">AI Context</p>
                                                                                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                                                                                        {question.subtitle || "No hidden guidance yet. Add context here to help the AI interpret and reuse this answer."}
                                                                                    </p>
                                                                                </div>

                                                                                <div className="rounded-2xl border border-white/10 bg-black/20 p-3.5">
                                                                                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/70">Answer Format</p>
                                                                                    {question.options && question.options.length > 0 ? (
                                                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                                                            {question.options.map((option, optionIndex) => (
                                                                                                <Badge key={optionIndex} variant="outline" className="rounded-full border-white/10 bg-white/[0.03]">
                                                                                                    {option.label || option}
                                                                                                </Badge>
                                                                                            ))}
                                                                                        </div>
                                                                                    ) : (
                                                                                        <p className="mt-3 text-sm text-muted-foreground">Free-form text response.</p>
                                                                                    )}
                                                                                </div>

                                                                                <div className="rounded-2xl border border-white/10 bg-black/20 p-3.5">
                                                                                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/70">Flow Control</p>
                                                                                    <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                                                                                        <p>Default next: <span className="text-white">{question.nextQuestionSlug || "Sequential"}</span></p>
                                                                                        <p>Branch rules: <span className="text-white">{logicRuleCount}</span></p>
                                                                                        <p>Stored for AI: <span className="text-white">{question.saveResponse ? "Yes" : "No"}</span></p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        </Reorder.Item>
                                                    );
                                                })}
                                            </Reorder.Group>
                                        )}
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="flex max-h-[min(90vh,860px)] w-[96vw] max-w-[960px] flex-col gap-0 overflow-hidden overscroll-contain border border-white/10 bg-[linear-gradient(180deg,rgba(28,28,28,0.98),rgba(12,12,12,0.98))] p-0 shadow-[0_28px_80px_rgba(0,0,0,0.42)]">
                        <DialogHeader className="border-b border-white/10 p-5 pb-4">
                            <DialogTitle className="text-xl font-semibold">{currentQuestion ? "Edit Question" : "Add New Question"}</DialogTitle>
                            <DialogDescription className="max-w-2xl text-sm leading-6 text-muted-foreground">
                                Build the interview step, decide whether the answer is saved into AI context, and configure where the flow should go next.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">
                            <form onSubmit={handleSubmit} className="space-y-5 py-4">
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="q-id">Question ID (Slug)</Label>
                                        <div className="relative">
                                            <Input
                                                id="q-id"
                                                value={formData.id}
                                                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                                                required
                                                className="pl-9 font-mono"
                                                placeholder="e.g. project_timeline"
                                            />
                                            <LucideIcons.Hash className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">Unique identifier for this question logic.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="q-type">Input Type</Label>
                                        <Select
                                            value={formData.type}
                                            onValueChange={(val) => setFormData({ ...formData, type: val })}
                                        >
                                            <SelectTrigger id="q-type">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="input">
                                                    <div className="flex items-center gap-2">
                                                        <LucideIcons.AlignLeft className="h-4 w-4 text-muted-foreground" />
                                                        <span>Text Input</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="single_option">
                                                    <div className="flex items-center gap-2">
                                                        <LucideIcons.CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                                        <span>Single Selection (Radio)</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="multi_option">
                                                    <div className="flex items-center gap-2">
                                                        <LucideIcons.CheckSquare className="h-4 w-4 text-muted-foreground" />
                                                        <span>Multiple Selection (Checkbox)</span>
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="q-text">Question Text</Label>
                                    <Input
                                        id="q-text"
                                        value={formData.question}
                                        onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                        placeholder="e.g. What is your estimated budget for this project?"
                                        className="text-base"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="q-subtitle">Subtitle (AI Context)</Label>
                                    <Textarea
                                        id="q-subtitle"
                                        value={formData.subtitle}
                                        onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                        placeholder={"Intent for this question.\n@prioritize: Android and iOS | Android only | iOS only\n@recommend: Android and iOS\n@map: both => Android and iOS; cross platform => Android and iOS"}
                                        className="min-h-28 resize-y text-sm text-muted-foreground font-mono"
                                    />
                                    <p className="text-[10px] text-muted-foreground">
                                        Hidden from the user. Optional directives: <code>@prioritize:</code>, <code>@recommend:</code>, <code>@reply:</code>, <code>@validate:</code>, <code>@map:</code>.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-2 pb-1">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="q-required"
                                            checked={formData.required}
                                            onCheckedChange={(checked) => setFormData({ ...formData, required: checked })}
                                        />
                                        <Label htmlFor="q-required" className="cursor-pointer">
                                            This question is required
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="q-saveResponse"
                                            checked={formData.saveResponse}
                                            onCheckedChange={(checked) => setFormData({ ...formData, saveResponse: checked })}
                                        />
                                        <Label htmlFor="q-saveResponse" className="cursor-pointer">
                                            Save Response for AI Context
                                        </Label>
                                    </div>
                                </div>

                                {(formData.type === "single_option" || formData.type === "multi_option") && (
                                    <div className="space-y-4 rounded-2xl border border-white/10 bg-black/15 p-4">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-sm font-medium">Answer Options</Label>
                                            <Button type="button" variant="secondary" size="sm" className="rounded-full" onClick={addOption}>
                                                <LucideIcons.Plus className="h-3 w-3 mr-1" /> Add Option
                                            </Button>
                                        </div>
                                        <div className="max-h-[220px] space-y-3 overflow-y-auto overscroll-contain pr-2 custom-scrollbar">
                                            {formData.options.map((opt, idx) => (
                                                <div key={idx} className="flex gap-2 items-center">
                                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-xs text-muted-foreground">
                                                        {String.fromCharCode(65 + idx)}
                                                    </div>
                                                    <Input
                                                        value={opt.label || ""}
                                                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                                                        placeholder={`Option ${idx + 1}`}
                                                        required
                                                        className="bg-background"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeOption(idx)}
                                                        className="hover:bg-destructive/10 hover:text-destructive shrink-0"
                                                        aria-label={`Remove option ${idx + 1}`}
                                                    >
                                                        <LucideIcons.Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            {formData.options.length === 0 && (
                                                <div className="rounded-xl border border-dashed border-white/10 py-7 text-center text-muted-foreground">
                                                    <LucideIcons.ListChecks className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                    <p className="text-sm">No options added yet.</p>
                                                    <Button type="button" variant="link" onClick={addOption} className="h-auto p-0 mt-1">
                                                        Add your first option
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Logic Configuration Section */}
                                <div className="space-y-4 border-t border-white/10 pt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="q-next">Default Next Question (Optional)</Label>
                                        <Select
                                            value={formData.nextQuestionSlug || "default_next"}
                                            onValueChange={(val) => setFormData({ ...formData, nextQuestionSlug: val === "default_next" ? "" : val })}
                                        >
                                            <SelectTrigger id="q-next">
                                                <SelectValue placeholder="Next question in sequence" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="default_next">
                                                    <span className="text-muted-foreground italic">Go to next question in sequence</span>
                                                </SelectItem>
                                                {questions
                                                    .filter(q => q.id !== formData.id)
                                                    .map((q) => (
                                                        <SelectItem key={q.id} value={q.slug || q.id}>
                                                            {q.id} - {q.question.substring(0, 30)}...
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[10px] text-muted-foreground">Override the default sequential flow. Advanced logic below takes precedence.</p>
                                    </div>

                                    <div className="flex items-center justify-between gap-3 pt-1">
                                        <Label className="text-sm font-medium">Branching Logic (Advanced)</Label>
                                        <Button type="button" variant="outline" size="sm" className="rounded-full border-white/10 bg-white/[0.03]" onClick={addLogicRule}>
                                            <LucideIcons.GitBranch className="h-3 w-3 mr-1" /> Add Rule
                                        </Button>
                                    </div>

                                    {formData.logic && formData.logic.length > 0 ? (
                                        <div className="space-y-3 rounded-2xl border border-white/10 bg-black/15 p-3">
                                            {formData.logic.map((rule, idx) => (
                                                <div key={idx} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-20 text-sm font-medium text-muted-foreground">If Answer</span>
                                                        <Select value={rule.condition} onValueChange={(val) => updateLogicRule(idx, 'condition', val)}>
                                                            <SelectTrigger className="h-9 w-[130px]">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="equals">Equals</SelectItem>
                                                                <SelectItem value="not_equals">Not Equals</SelectItem>
                                                                <SelectItem value="contains">Contains</SelectItem>
                                                            </SelectContent>
                                                        </Select>

                                                        {formData.options && formData.options.length > 0 ? (
                                                            <Select value={rule.value} onValueChange={(val) => updateLogicRule(idx, 'value', val)}>
                                                                <SelectTrigger className="h-9 flex-1">
                                                                    <SelectValue placeholder="Select option" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {formData.options.map((opt, i) => (
                                                                        <SelectItem key={i} value={opt.label || opt.value || opt}>{opt.label || opt}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        ) : (
                                                            <Input
                                                                value={rule.value}
                                                                onChange={(e) => updateLogicRule(idx, 'value', e.target.value)}
                                                                className="h-9 flex-1"
                                                                placeholder="Value to match"
                                                            />
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <span className="w-20 text-sm font-medium text-muted-foreground">Jump to</span>
                                                        <Select value={rule.nextQuestionSlug} onValueChange={(val) => updateLogicRule(idx, 'nextQuestionSlug', val)}>
                                                            <SelectTrigger className="h-9 flex-1">
                                                                <SelectValue placeholder="Select target question" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {questions
                                                                    .filter(q => q.id !== formData.id) // Don't jump to self
                                                                    .map((q) => (
                                                                        <SelectItem key={q.id} value={q.slug || q.id}>
                                                                            <span className="truncate block max-w-[200px]">{q.id} - {q.question.substring(0, 30)}...</span>
                                                                        </SelectItem>
                                                                    ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeLogicRule(idx)}
                                                            className="h-9 w-9 text-destructive hover:bg-destructive/10"
                                                            aria-label={`Remove branching rule ${idx + 1}`}
                                                        >
                                                            <LucideIcons.Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="rounded-2xl border border-dashed border-white/10 bg-black/15 p-4 text-center">
                                            <p className="text-sm text-muted-foreground">No branching rules defined.</p>
                                            <p className="text-xs text-muted-foreground mt-1">Flow will proceed to the next question in order.</p>
                                        </div>
                                    )}
                                </div>

                                <DialogFooter className="border-t border-white/10 pt-4">
                                    <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                    <Button type="submit">Save Question</Button>
                                </DialogFooter>
                            </form>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
};

export default AdminServiceQuestions;
