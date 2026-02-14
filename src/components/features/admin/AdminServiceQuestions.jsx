import React, { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { AdminTopBar } from "./AdminTopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/shared/context/AuthContext";
import { toast } from "sonner";
import { AnimatePresence, motion, Reorder } from "framer-motion";
import * as LucideIcons from "lucide-react";

import ServiceQuestionFlow from "./ServiceQuestionFlow";

const AdminServiceQuestions = () => {
    const { authFetch } = useAuth();
    const [services, setServices] = useState([]);
    const [selectedServiceId, setSelectedServiceId] = useState("");
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

    const fetchServices = async () => {
        setLoadingServices(true);
        try {
            console.log("Fetching services...");
            const res = await authFetch("/admin/services");
            if (!res.ok) {
                console.error("Failed to fetch services. Status:", res.status);
                toast.error(`Failed to load services: ${res.statusText}`);
                return;
            }
            const data = await res.json();
            console.log("Services fetched:", data);

            if (data?.data) {
                setServices(data.data);
                // Optional: Auto select first if none selected
                // if (data.data.length > 0 && !selectedServiceId) setSelectedServiceId(data.data[0].id);
            } else {
                console.warn("No data property in services response:", data);
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

    return (
        <AdminLayout>
            <div className="relative flex flex-col gap-8 p-8 max-w-7xl mx-auto h-[calc(100vh-4rem)]">
                <AdminTopBar label="Service Questions" />

                <div className="flex flex-col md:flex-row h-full gap-8 overflow-hidden">

                    {/* Sidebar Service List */}
                    <div className="w-full md:w-1/4 flex flex-col gap-4 bg-card border rounded-xl p-4 shadow-sm h-full max-h-full">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-xl font-bold tracking-tight">Services</h2>
                            <p className="text-sm text-muted-foreground">Select a service to manage its questions.</p>
                        </div>
                        <Separator />
                        <ScrollArea className="flex-1 -mr-3 pr-3 h-full">
                            <div className="flex flex-col gap-1 pr-1 pb-12">
                                {loadingServices ? (
                                    <div className="p-4 text-center text-sm text-muted-foreground animate-pulse">
                                        Loading services...
                                    </div>
                                ) : services.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                        No services found.
                                    </div>
                                ) : (
                                    services.map(s => {
                                        const Icon = LucideIcons[s.icon] || LucideIcons.Layers;
                                        const isSelected = selectedServiceId === s.id;
                                        return (
                                            <button
                                                key={s.id}
                                                onClick={() => setSelectedServiceId(s.id)}
                                                className={`flex items-center gap-3 py-2 px-3 rounded-lg text-left transition-all ${isSelected
                                                    ? 'bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/50'
                                                    : 'hover:bg-muted text-foreground'
                                                    }`}
                                            >
                                                <Icon className={`h-5 w-5 shrink-0 ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm leading-tight line-clamp-2">{s.name}</div>
                                                    <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                                                        {s.questionCount} questions
                                                    </div>
                                                </div>
                                                {isSelected && <LucideIcons.ChevronRight className="h-4 w-4 opacity-50 shrink-0" />}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col gap-6 h-full overflow-hidden">
                        <div className="flex justify-between items-center bg-card p-6 rounded-xl border shadow-sm shrink-0">
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">
                                    {selectedServiceId
                                        ? services.find(s => s.id === selectedServiceId)?.name
                                        : "Question Manager"}
                                </h1>
                                <p className="text-muted-foreground">
                                    {selectedServiceId
                                        ? "Configure the AI interview flow for this service."
                                        : "Select a service from the sidebar to begin."}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex bg-muted rounded-lg p-1 border">
                                    <button
                                        onClick={() => setViewMode("list")}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        <LucideIcons.List className="h-4 w-4 mr-2 inline" /> List
                                    </button>
                                    <button
                                        onClick={() => setViewMode("flow")}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'flow' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        <LucideIcons.GitGraph className="h-4 w-4 mr-2 inline" /> Flow
                                    </button>
                                </div>
                                <Button
                                    onClick={() => handleOpenDialog()}
                                    disabled={!selectedServiceId}
                                    size="lg"
                                    className="shadow hover:shadow-lg transition-transform hover:-translate-y-0.5"
                                >
                                    <LucideIcons.Plus className="mr-2 h-5 w-5" /> Add Question
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden bg-muted/20 rounded-xl border relative">
                            {viewMode === 'flow' && selectedServiceId && questions.length > 0 ? (
                                <div className="h-full w-full bg-white relative">
                                    <ServiceQuestionFlow
                                        questions={questions}
                                        onEditQuestion={(q) => handleOpenDialog(q)}
                                    />
                                </div>
                            ) : (
                                <ScrollArea className="h-full p-6">
                                    {!selectedServiceId ? (
                                        <div className="flex flex-col items-center justify-center h-[400px] text-center opacity-50">
                                            <LucideIcons.MousePointer2 className="h-16 w-16 mb-4 text-muted-foreground" />
                                            <h3 className="text-xl font-medium">No Service Selected</h3>
                                            <p className="max-w-xs mt-2">Please select a service from the list on the left to view and edit its questions.</p>
                                        </div>
                                    ) : loading ? (
                                        <div className="flex flex-col gap-4">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="h-32 rounded-lg bg-card border animate-pulse" />
                                            ))}
                                        </div>
                                    ) : questions.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-[400px] text-center">
                                            <div className="p-4 rounded-full bg-background border shadow-sm mb-4">
                                                <LucideIcons.FileQuestion className="h-10 w-10 text-muted-foreground" />
                                            </div>
                                            <h3 className="text-lg font-medium">No questions defined</h3>
                                            <p className="text-muted-foreground mt-2 mb-6 max-w-sm">
                                                This service has no questions yet. The AI needs questions to understand client requirements.
                                            </p>
                                            <Button variant="outline" onClick={() => handleOpenDialog()}>
                                                Create First Question
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <Reorder.Group axis="y" values={questions} onReorder={handleReorder} className="space-y-4">
                                                {questions.map((q, idx) => (
                                                    <Reorder.Item
                                                        key={q.id}
                                                        value={q}
                                                        onDragEnd={handleDragEnd}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                    >
                                                        <Card className="group hover:border-primary/50 transition-all duration-300 hover:shadow-md">
                                                            <CardContent className="p-5 flex gap-5 items-start">
                                                                <div className="mt-1 flex flex-col items-center gap-2 text-muted-foreground cursor-grab active:cursor-grabbing">
                                                                    <div className="bg-muted w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold border">
                                                                        {idx + 1}
                                                                    </div>
                                                                    <LucideIcons.GripVertical className="h-4 w-4 opacity-0 group-hover:opacity-50 cursor-grab" />
                                                                </div>

                                                                <div className="flex-1 space-y-3">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <Badge variant="outline" className="font-mono text-xs text-muted-foreground">
                                                                            {q.id}
                                                                        </Badge>
                                                                        <Badge className={
                                                                            q.type === 'multi_option' ? 'bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200' :
                                                                                q.type === 'single_option' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200' :
                                                                                    'bg-slate-100 text-slate-800 hover:bg-slate-200 border-slate-200'
                                                                        }>
                                                                            {q.type === 'multi_option' ? 'Multi Select' : q.type === 'single_option' ? 'Single Select' : 'Text Input'}
                                                                        </Badge>
                                                                        {!q.required && (
                                                                            <Badge variant="secondary" className="text-muted-foreground">Optional</Badge>
                                                                        )}
                                                                    </div>

                                                                    <p className="text-lg font-medium text-foreground leading-snug">
                                                                        {q.question}
                                                                    </p>

                                                                    {q.options && q.options.length > 0 && (
                                                                        <div className="flex flex-wrap gap-2 pt-1">
                                                                            {q.options.map((opt, i) => (
                                                                                <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 text-xs font-medium border text-secondary-foreground hover:bg-secondary/70 transition-colors">
                                                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                                                                                    {opt.label || opt}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(q)}>
                                                                        <LucideIcons.Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(q)} className="hover:bg-destructive/10">
                                                                        <LucideIcons.Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                                                    </Button>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    </Reorder.Item>
                                                ))}
                                            </Reorder.Group>
                                            <div className="h-20" /> {/* Bottom Spacer */}
                                        </div>
                                    )}
                                </ScrollArea>
                            )}
                        </div>
                    </div>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl">{currentQuestion ? "Edit Question" : "Add New Question"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                    className="text-lg"
                                    required
                                />
                            </div>

                            <div className="flex items-center space-x-2 pb-2">
                                <Checkbox
                                    id="q-required"
                                    checked={formData.required}
                                    onCheckedChange={(checked) => setFormData({ ...formData, required: checked })}
                                />
                                <Label htmlFor="q-required" className="cursor-pointer">
                                    This question is required
                                </Label>
                            </div>

                            {(formData.type === "single_option" || formData.type === "multi_option") && (
                                <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-base font-semibold">Answer Options</Label>
                                        <Button type="button" variant="secondary" size="sm" onClick={addOption}>
                                            <LucideIcons.Plus className="h-3 w-3 mr-1" /> Add Option
                                        </Button>
                                    </div>
                                    <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                        {formData.options.map((opt, idx) => (
                                            <div key={idx} className="flex gap-2 items-center">
                                                <div className="bg-background border rounded-full w-6 h-6 flex items-center justify-center text-xs text-muted-foreground shrink-0">
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
                                                >
                                                    <LucideIcons.Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        {formData.options.length === 0 && (
                                            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
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
                            <div className="space-y-4 border-t pt-4">
                                <div className="flex justify-between items-center">
                                    <Label className="text-base font-semibold">Branching Logic (Advanced)</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={addLogicRule}>
                                        <LucideIcons.GitBranch className="h-3 w-3 mr-1" /> Add Rule
                                    </Button>
                                </div>

                                {formData.logic && formData.logic.length > 0 ? (
                                    <div className="space-y-3 bg-slate-50 p-3 rounded-lg border">
                                        {formData.logic.map((rule, idx) => (
                                            <div key={idx} className="flex flex-col gap-3 p-3 bg-white rounded-lg border shadow-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-slate-500 w-20">If Answer</span>
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
                                                    <span className="text-sm font-medium text-slate-500 w-20">Jump to</span>
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
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeLogicRule(idx)} className="h-9 w-9 text-destructive hover:bg-destructive/10">
                                                        <LucideIcons.Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-slate-50/50 border border-dashed rounded-lg p-4 text-center">
                                        <p className="text-sm text-muted-foreground">No branching rules defined.</p>
                                        <p className="text-xs text-muted-foreground mt-1">Flow will proceed to the next question in order.</p>
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="pt-4 border-t">
                                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button type="submit">Save Question</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
};

export default AdminServiceQuestions;
