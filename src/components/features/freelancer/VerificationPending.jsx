import React, { lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, UserCircle, MoveRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

// Lazy load to avoid circular dependency issues if any
const FreelancerDashboard = lazy(() => import("@/components/features/freelancer/FreelancerDashboard"));

const VerificationPending = () => {
    const navigate = useNavigate();

    return (
        <div className="relative min-h-screen overflow-hidden font-sans">
            {/* Blurred Dashboard Background */}
            <div className="absolute inset-0 z-0 pointer-events-none filter blur-sm opacity-80 scale-[1.02]">
                <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
                    <FreelancerDashboard />
                </Suspense>
            </div>

            {/* Dark Overlay to improve contrast */}
            <div className="absolute inset-0 bg-black/75 z-10" />

            {/* Main Verification Content */}
            <div className="relative z-20 min-h-screen flex flex-col items-center justify-center px-4">

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-lg w-full text-center space-y-8"
                >

                    {/* Icon */}
                    <div className="w-24 h-24 mx-auto bg-primary/10 rounded-3xl flex items-center justify-center mb-6 ring-1 ring-primary/20 shadow-2xl shadow-primary/10 animate-pulse">
                        <Clock className="w-12 h-12 text-primary" />
                    </div>

                    {/* Content */}
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight drop-shadow-md">
                            Verification Pending
                        </h1>
                        <p className="text-lg text-white/80 leading-relaxed font-medium">
                            Please update your profile details to proceed. Your account will only be submitted for
                            <span className="text-primary font-bold"> Admin Verification</span> after you have completed your profile.
                        </p>
                    </div>

                    {/* Info Box */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-black/60 border border-white/10 rounded-2xl p-6 text-left space-y-4 backdrop-blur-xl shadow-2xl ring-1 ring-white/5"
                    >
                        <div className="flex gap-4">
                            <div className="shrink-0 w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-yellow-500" />
                            </div>
                            <div>
                                <h3 className="text-white font-medium mb-1">Action Required</h3>
                                <p className="text-sm text-white/60 leading-relaxed">
                                    You must complete your profile information. Once updated, our team will review your application for approval.
                                </p>
                            </div>
                        </div>

                        <Button
                            onClick={() => navigate("/freelancer/profile")}
                            className="w-full bg-primary hover:bg-primary-strong text-primary-foreground font-bold py-6 rounded-xl group transition-all"
                        >
                            Update Profile Now
                            <MoveRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default VerificationPending;

