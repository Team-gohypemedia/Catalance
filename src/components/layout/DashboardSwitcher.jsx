"use client";

import * as React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { Shimmer } from "@/components/features/ai/elements/shimmer";

const THRESHOLD = 0.65;

const brandPresets = {
    freelancer: {
        name: "Freelancer Dashboard",
        logoText: "FR",
        path: "/freelancer",
    },
    client: {
        name: "Client Portal",
        logoText: "CL",
        path: "/client",
    },
};

export function DashboardSwitcher() {
    const navigate = useNavigate();
    const location = useLocation();
    const containerRef = React.useRef(null);
    const [dragX, setDragX] = React.useState(0);
    const [isDragging, setIsDragging] = React.useState(false);
    const [maxDrag, setMaxDrag] = React.useState(100);
    const startXRef = React.useRef(0);
    const dragXRef = React.useRef(0);

    // Detect current dashboard from URL path
    const currentDashboard = location.pathname.startsWith("/freelancer") ? "freelancer" : "client";
    const targetDashboard = currentDashboard === "client" ? "freelancer" : "client";

    const currentBrand = brandPresets[currentDashboard];
    const targetBrand = brandPresets[targetDashboard];

    // Calculate max drag distance
    React.useEffect(() => {
        const updateMaxDrag = () => {
            if (containerRef.current) {
                setMaxDrag(containerRef.current.offsetWidth - 56);
            }
        };
        updateMaxDrag();
        window.addEventListener("resize", updateMaxDrag);
        return () => window.removeEventListener("resize", updateMaxDrag);
    }, []);

    // Reset when path changes (after navigation)
    React.useEffect(() => {
        setDragX(0);
        dragXRef.current = 0;
        setIsDragging(false);
    }, [location.pathname]);

    const progress = Math.min(Math.max(dragX / maxDrag, 0), 1);
    const isOverThreshold = progress >= THRESHOLD;

    const handleMouseDown = (e) => {
        e.preventDefault();
        startXRef.current = e.clientX - dragXRef.current;
        setIsDragging(true);
    };

    const handleTouchStart = (e) => {
        startXRef.current = e.touches[0].clientX - dragXRef.current;
        setIsDragging(true);
    };

    React.useEffect(() => {
        if (!isDragging) return;

        const handleMove = (e) => {
            const clientX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
            const newX = clientX - startXRef.current;
            const clampedX = Math.max(0, Math.min(newX, maxDrag));
            setDragX(clampedX);
            dragXRef.current = clampedX;
        };

        const handleEnd = () => {
            const currentProgress = dragXRef.current / maxDrag;
            setIsDragging(false);

            if (currentProgress >= THRESHOLD) {
                // Reset immediately so the switcher never appears empty while routing.
                setDragX(0);
                dragXRef.current = 0;
                if (location.pathname !== targetBrand.path) {
                    navigate(targetBrand.path);
                }
            } else {
                setDragX(0);
                dragXRef.current = 0;
            }
        };

        window.addEventListener("mousemove", handleMove);
        window.addEventListener("mouseup", handleEnd);
        window.addEventListener("touchmove", handleMove, { passive: true });
        window.addEventListener("touchend", handleEnd);

        return () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseup", handleEnd);
            window.removeEventListener("touchmove", handleMove);
            window.removeEventListener("touchend", handleEnd);
        };
    }, [isDragging, maxDrag, navigate, targetBrand.path, location.pathname]);

    return (
        <div className="px-2 py-1.5">
            <div
                ref={containerRef}
                className="relative h-14 rounded-2xl bg-transparent overflow-hidden select-none"
            >
                {/* Background progress fill */}
                <div
                    className="absolute inset-y-0 left-0 bg-white/5"
                    style={{
                        width: `${progress * 100}%`,
                        transition: isDragging ? "none" : "width 0.3s ease-out",
                    }}
                />

                {/* Target indicator on right */}
                <div
                    className="absolute right-3 top-0 bottom-0 flex items-center"
                    style={{ opacity: isOverThreshold ? 0 : 0.3 + progress * 0.5, transition: "opacity 0.2s" }}
                >
                    <div className="w-10 h-10 rounded-xl bg-transparent flex items-center justify-center text-xs font-semibold text-muted-foreground uppercase">
                        {targetBrand.logoText}
                    </div>
                </div>

                {/* Draggable slider */}
                <div
                    className="absolute left-2 top-0 bottom-0 flex items-center gap-3 cursor-grab active:cursor-grabbing z-10"
                    style={{
                        transform: `translateX(${dragX}px)`,
                        transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    }}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                >
                    {/* Badge */}
                    <div
                        className={`w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold uppercase shadow-lg transition-transform duration-150 ${isDragging ? "scale-110" : "hover:scale-105"
                            }`}
                    >
                        {currentBrand.logoText}
                    </div>

                    {/* Label - fades out when dragging */}
                    <div
                        className="group-data-[collapsible=icon]:hidden min-w-0"
                        style={{
                            opacity: Math.max(0, 1 - progress * 2.5),
                            transition: isDragging ? "none" : "opacity 0.2s",
                        }}
                    >
                        <p className="text-sm font-semibold text-foreground truncate max-w-[9.75rem]">
                            {currentBrand.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                            Slide to switch {"->"}
                        </p>
                    </div>
                </div>

                {/* Center "Release" hint with shimmer effect */}
                {isOverThreshold && (
                    <div
                        className="absolute inset-y-0 left-0 right-16 flex items-center justify-center pointer-events-none z-20"
                        style={{ opacity: (progress - THRESHOLD) / (1 - THRESHOLD) }}
                    >
                        <div className="w-full text-center">
                            <Shimmer as="span" className="text-sm font-semibold whitespace-nowrap">
                                Release to switch
                            </Shimmer>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

DashboardSwitcher.propTypes = {
    currentRole: PropTypes.oneOf(["CLIENT", "FREELANCER"]),
};

export default DashboardSwitcher;

