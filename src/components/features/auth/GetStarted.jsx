import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/components/providers/theme-provider";
import BriefcaseBusiness from "lucide-react/dist/esm/icons/briefcase-business";
import Laptop from "lucide-react/dist/esm/icons/laptop";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import Check from "lucide-react/dist/esm/icons/check";
import MatrixRain from "@/components/ui/matrix-code";

const ROLE_OPTIONS = [
    {
        id: "CLIENT",
        title: "I'm a Client",
        subtitle: "Hiring for a project",
        description: "Post projects, review proposals, and collaborate with top talent worldwide.",
        icon: BriefcaseBusiness,
        features: ["Post unlimited projects", "Access verified professionals", "Secure milestone payments", "Dedicated support"],
        buttonText: "Continue as Client",
        color: "primary"
    },
    {
        id: "FREELANCER",
        title: "I'm a Freelancer",
        subtitle: "Looking for work",
        description: "Showcase your skills, submit proposals, and get hired for premium projects.",
        icon: Laptop,
        features: ["Zero commission fees", "Global opportunities", "Build your portfolio", "Fast, secure payments"],
        buttonText: "Continue as Freelancer",
        color: "primary"
    }
];

export default function GetStarted() {
    const [searchParams] = useSearchParams();
    const [selectedRole, setSelectedRole] = useState(null);
    const [isHovering, setIsHovering] = useState(null);
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isDark = theme === "dark";

    // Check if coming from "Start Your Career" button
    const forFreelancer = searchParams.get("for") === "freelancer";

    const handleContinue = (roleId) => {
        const role = roleId.toLowerCase();
        navigate(`/signup?role=${role}`);
    };

    return (
        <div className={cn(
            "min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden py-20 px-6",
            isDark ? "bg-black" : "bg-white"
        )}>
            {/* Background Effects */}
            <MatrixRain
                color="#FACC15"
                className="absolute inset-0 z-0"
                fadeOpacity={0.1}
                style={{ opacity: isDark ? 0.1 : 0.15 }}
            />

            {/* Grid Background */}
            <div
                aria-hidden
                className={`absolute inset-0 z-0 ${isDark ? "opacity-20" : "opacity-30"}`}
                style={{
                    backgroundImage: isDark
                        ? `linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
               linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)`
                        : `linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
               linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)`,
                    backgroundSize: "80px 80px",
                }}
            />

            {/* Content */}
            <div className="relative z-10 w-full max-w-4xl mx-auto text-center">
                {/* Header */}
                <div className="mb-12">
                    <p className="text-sm uppercase tracking-[0.3em] text-primary mb-4">
                        Get Started
                    </p>
                    <h1 className={cn(
                        "text-4xl md:text-5xl font-semibold mb-4",
                        isDark ? "text-white" : "text-gray-900"
                    )}>
                        Join as a <span className="text-primary">Client</span> or <span className="text-primary">Freelancer</span>
                    </h1>
                    <p className={cn(
                        "text-lg max-w-2xl mx-auto",
                        isDark ? "text-neutral-400" : "text-gray-600"
                    )}>
                        Choose how you want to use Catalance and start your journey today.
                    </p>
                </div>

                {/* Role Cards */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {ROLE_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        const isActive = selectedRole === option.id;
                        const isHovered = isHovering === option.id;
                        const shouldHighlight = forFreelancer && option.id === "FREELANCER";

                        return (
                            <Card
                                key={option.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => setSelectedRole(option.id)}
                                onMouseEnter={() => setIsHovering(option.id)}
                                onMouseLeave={() => setIsHovering(null)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        setSelectedRole(option.id);
                                    }
                                }}
                                className={cn(
                                    "relative p-8 text-left cursor-pointer border-2 transition-all duration-300",
                                    "hover:shadow-xl hover:shadow-primary/10",
                                    isActive
                                        ? "border-primary shadow-lg shadow-primary/20 scale-[1.02]"
                                        : shouldHighlight
                                            ? "border-primary/50"
                                            : "border-border hover:border-primary/50",
                                    isDark ? "bg-black/40 backdrop-blur-sm" : "bg-white/80 backdrop-blur-sm"
                                )}
                            >
                                {/* Selection Indicator */}
                                {isActive && (
                                    <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                        <Check className="w-4 h-4 text-black" />
                                    </div>
                                )}

                                {/* Icon & Title */}
                                <div className="flex items-start gap-4 mb-4">
                                    <div className={cn(
                                        "p-3 rounded-xl transition-colors",
                                        isActive || isHovered ? "bg-primary text-black" : "bg-muted text-primary"
                                    )}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className={cn(
                                            "text-xl font-semibold",
                                            isDark ? "text-white" : "text-gray-900"
                                        )}>
                                            {option.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">{option.subtitle}</p>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className={cn(
                                    "text-sm mb-6",
                                    isDark ? "text-neutral-400" : "text-gray-600"
                                )}>
                                    {option.description}
                                </p>

                                {/* Features */}
                                <ul className="space-y-2 mb-6">
                                    {option.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-center gap-2 text-sm">
                                            <Check className={cn(
                                                "w-4 h-4",
                                                isActive ? "text-primary" : "text-muted-foreground"
                                            )} />
                                            <span className={isDark ? "text-neutral-300" : "text-gray-700"}>
                                                {feature}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                {/* Continue Button */}
                                <Button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleContinue(option.id);
                                    }}
                                    className={cn(
                                        "w-full group transition-all duration-300",
                                        isActive
                                            ? "bg-primary hover:bg-primary/90 text-black"
                                            : "bg-muted hover:bg-primary hover:text-black"
                                    )}
                                >
                                    {option.buttonText}
                                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Card>
                        );
                    })}
                </div>

                {/* Login Link */}
                <p className={cn(
                    "text-sm",
                    isDark ? "text-neutral-400" : "text-gray-600"
                )}>
                    Already have an account?{" "}
                    <Link to="/login" className="text-primary hover:underline font-medium">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
}
