import React, { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { AdminTopBar } from "./AdminTopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/shared/context/AuthContext";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import * as LucideIcons from "lucide-react";

// Helper to dynamically render Lucide icon
const DynamicIcon = ({ name, className }) => {
    const Icon = LucideIcons[name] || LucideIcons.HelpCircle;
    return <Icon className={className} />;
};

const AdminServices = () => {
    const { authFetch } = useAuth();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentService, setCurrentService] = useState(null); // null = new, obj = edit

    // Form state
    const [formData, setFormData] = useState({
        id: "",
        name: "",
        description: "",
        icon: "",
        active: true,
        minBudget: 0,
        currency: "INR"
    });

    useEffect(() => {
        fetchServices();
    }, [authFetch]);

    const fetchServices = async () => {
        setLoading(true);
        try {
            const res = await authFetch("/admin/services");
            const data = await res.json();
            if (data?.data) {
                setServices(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch services:", error);
            toast.error("Failed to load services");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (service = null) => {
        if (service) {
            setCurrentService(service);
            setFormData({
                id: service.id,
                name: service.name,
                description: service.description || "",
                icon: service.icon || "",
                active: service.active !== undefined ? service.active : true,
                minBudget: service.minBudget || 0,
                currency: service.currency || "INR"
            });
        } else {
            setCurrentService(null);
            setFormData({
                id: "",
                name: "",
                description: "",
                icon: "",
                active: true,
                minBudget: 0,
                currency: "INR"
            });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await authFetch("/admin/services", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                toast.success(currentService ? "Service updated" : "Service created");
                fetchServices();
                setIsDialogOpen(false);
            } else {
                toast.error("Failed to save service");
            }
        } catch (error) {
            console.error("Failed to save service:", error);
            toast.error("Error saving service");
        }
    };

    return (
        <AdminLayout>
            <div className="relative flex flex-col gap-8 p-8 max-w-7xl mx-auto">
                <AdminTopBar label="Service Management" />

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            Services
                        </h1>
                        <p className="text-muted-foreground mt-2 text-lg">
                            Manage your service catalog, offerings, and pricing.
                        </p>
                    </div>
                    <Button onClick={() => handleOpenDialog()} size="lg" className="shadow-lg hover:shadow-xl transition-all">
                        <LucideIcons.Plus className="mr-2 h-5 w-5" /> Add New Service
                    </Button>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-64 rounded-xl border bg-card/50 animate-pulse" />
                        ))}
                    </div>
                ) : services.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-xl bg-card/30">
                        <div className="p-4 rounded-full bg-muted mb-4">
                            <LucideIcons.Layers className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold">No services found</h3>
                        <p className="text-muted-foreground mt-2 max-w-sm text-center">
                            Get started by adding your first service offering to the catalog.
                        </p>
                        <Button className="mt-6" variant="outline" onClick={() => handleOpenDialog()}>
                            Create Service
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {services.map((service, index) => (
                                <motion.div
                                    key={service.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    layout
                                >
                                    <Card className="h-full flex flex-col hover:border-primary/50 transition-colors group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(service)}>
                                                <LucideIcons.Settings2 className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                                            </Button>
                                        </div>

                                        <CardHeader className="pb-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-lg ${service.active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                    <DynamicIcon name={service.icon} className="h-8 w-8" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-xl">{service.name}</CardTitle>
                                                    <Badge variant={service.active ? "default" : "secondary"} className="mt-2">
                                                        {service.active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="flex-1">
                                            <p className="text-muted-foreground line-clamp-3 text-sm">
                                                {service.description || "No description provided."}
                                            </p>

                                            <div className="mt-6 grid grid-cols-2 gap-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Start Price</span>
                                                    <span className="font-semibold">{service.currency} {service.minBudget?.toLocaleString()}</span>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Questions</span>
                                                    <span className="font-semibold">{service.questionCount} steps</span>
                                                </div>
                                            </div>
                                        </CardContent>

                                        <CardFooter className="pt-0">
                                            <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary/20"
                                                    style={{ width: `${Math.min(service.questionCount * 10, 100)}%` }}
                                                />
                                            </div>
                                        </CardFooter>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl">{currentService ? "Edit Service" : "Add New Service"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="id">Service ID (Slug)</Label>
                                    <div className="relative">
                                        <Input
                                            id="id"
                                            value={formData.id}
                                            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                                            disabled={!!currentService}
                                            placeholder="e.g. web_development"
                                            className="font-mono pl-9"
                                            required
                                        />
                                        <LucideIcons.Hash className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    </div>
                                    {!currentService && <p className="text-xs text-muted-foreground">Unique identifier, used in URLs.</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="name">Display Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Web Development"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Briefly describe this service..."
                                    className="h-24 resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted/30 rounded-lg border">
                                <div className="space-y-2">
                                    <Label htmlFor="icon">Icon Name</Label>
                                    <div className="flex gap-2">
                                        <div className="p-2 border rounded bg-background flex items-center justify-center w-10 h-10 shrink-0">
                                            <DynamicIcon name={formData.icon} className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1">
                                            <Input
                                                id="icon"
                                                value={formData.icon}
                                                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                                placeholder="e.g. Code, Palette, Laptop"
                                            />
                                            <p className="text-[10px] text-muted-foreground mt-1 text-right">
                                                Use <a href="https://lucide.dev/icons" target="_blank" rel="noreferrer" className="underline hover:text-primary">Lucide icon names</a>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="active">Status</Label>
                                    <Select
                                        value={formData.active ? "true" : "false"}
                                        onValueChange={(val) => setFormData({ ...formData, active: val === "true" })}
                                    >
                                        <SelectTrigger id="active" className={formData.active ? "border-green-500/50 bg-green-500/5" : ""}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="true">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                                    <span>Active & Public</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="false">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-slate-300" />
                                                    <span>Draft / Inactive</span>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="minBudget">Minimum Budget</Label>
                                    <div className="relative">
                                        <Input
                                            id="minBudget"
                                            type="number"
                                            value={formData.minBudget}
                                            onChange={(e) => setFormData({ ...formData, minBudget: e.target.value })}
                                            placeholder="0"
                                            className="pl-9"
                                        />
                                        <LucideIcons.IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="currency">Currency</Label>
                                    <Select
                                        value={formData.currency}
                                        onValueChange={(val) => setFormData({ ...formData, currency: val })}
                                    >
                                        <SelectTrigger id="currency">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="INR">INR (₹)</SelectItem>
                                            <SelectItem value="USD">USD ($)</SelectItem>
                                            <SelectItem value="EUR">EUR (€)</SelectItem>
                                            <SelectItem value="GBP">GBP (£)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <DialogFooter className="pt-4 border-t">
                                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button type="submit" className="min-w-[100px]">
                                    {currentService ? "Save Changes" : "Create Service"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
};

export default AdminServices;
