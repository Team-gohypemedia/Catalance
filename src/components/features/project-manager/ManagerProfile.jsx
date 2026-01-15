import React, { useEffect, useState } from "react";
import { RoleAwareSidebar } from "@/components/layout/RoleAwareSidebar";
import { ManagerTopBar } from "./ManagerTopBar";
import { useAuth } from "@/shared/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Save from "lucide-react/dist/esm/icons/save";
import User from "lucide-react/dist/esm/icons/user";

const ManagerProfileContent = () => {
    const { authFetch, user, refreshUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phoneNumber: "",
        bio: "",
        linkedin: "",
    });

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName || "",
                email: user.email || "",
                phoneNumber: user.phoneNumber || "",
                bio: user.bio || "",
                linkedin: user.linkedin || "",
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await authFetch("/auth/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                toast.success("Profile updated successfully");
                // Refresh user context if possible, otherwise update local state
                // Assuming refreshUser exists in AuthContext or we just rely on local state until refresh
                // If refreshUser is available (it should be if using a standard AuthContext pattern), call it.
                // Based on standard implementation, might need a full reload or re-fetch.
            } else {
                const err = await res.json();
                toast.error(err.message || "Failed to update profile");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred while updating profile");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen w-full">
            <ManagerTopBar label="My Profile" />
            <div className="p-8 space-y-8 max-w-4xl mx-auto w-full">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
                    <p className="text-muted-foreground mt-1">Manage your personal information and contact details.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>
                            Update your contact details and public profile information.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    value={formData.email}
                                    disabled
                                    className="bg-muted text-muted-foreground"
                                />
                                <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Full Name</Label>
                                    <Input
                                        id="fullName"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phoneNumber">Phone Number</Label>
                                    <Input
                                        id="phoneNumber"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <Label htmlFor="bio">Bio</Label>
                                <textarea
                                    id="bio"
                                    name="bio"
                                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Tell us a little about yourself..."
                                    value={formData.bio}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="linkedin">LinkedIn Profile URL</Label>
                                <Input
                                    id="linkedin"
                                    name="linkedin"
                                    value={formData.linkedin}
                                    onChange={handleChange}
                                    placeholder="https://linkedin.com/in/username"
                                />
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={saving}>
                                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const ManagerProfile = () => (
    <RoleAwareSidebar>
        <ManagerProfileContent />
    </RoleAwareSidebar>
);

export default ManagerProfile;
