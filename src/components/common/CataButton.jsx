"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Bot from "lucide-react/dist/esm/icons/bot";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle";
import X from "lucide-react/dist/esm/icons/x";
import Phone from "lucide-react/dist/esm/icons/phone";
import { FamilyButton } from "@/components/ui/family-button";
import { useAuth } from "@/shared/context/AuthContext";
import { cn } from "@/shared/lib/utils";

const STORAGE_KEY = "cata-button-position";
const DEFAULT_BOTTOM = 32; // 8 * 4 = 32px (bottom-8)
const MIN_BOTTOM = 20;

export const CataButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Vertical position state (distance from bottom in pixels)
  const [bottomPosition, setBottomPosition] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_BOTTOM;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? parseInt(stored, 10) : DEFAULT_BOTTOM;
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartBottom = useRef(0);

  // Save position to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, bottomPosition.toString());
  }, [bottomPosition]);

  // Handle drag start
  const handleDragStart = useCallback(
    (clientY) => {
      setIsDragging(true);
      dragStartY.current = clientY;
      dragStartBottom.current = bottomPosition;
    },
    [bottomPosition]
  );

  // Handle drag move
  const handleDragMove = useCallback(
    (clientY) => {
      if (!isDragging) return;
      const deltaY = dragStartY.current - clientY; // Positive = moving up
      const maxBottom = window.innerHeight - 150; // Leave space at top
      const newBottom = Math.max(
        MIN_BOTTOM,
        Math.min(maxBottom, dragStartBottom.current + deltaY)
      );
      setBottomPosition(newBottom);
    },
    [isDragging]
  );

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Mouse event handlers
  const onMouseDown = (e) => {
    // Prevent drag if clicking on an interactive element inside
    if (e.target.closest("button") || e.target.closest("a")) {
      return;
    }
    // Prevent default only if we are taking over dragging
    e.preventDefault();
    handleDragStart(e.clientY);
  };

  // Touch event handlers
  const onTouchStart = (e) => {
    if (e.target.closest("button") || e.target.closest("a")) {
      return;
    }
    // Don't prevent default on touch to allow scrolling if not dragging,
    // but here we want to drag the button container.
    // However, FamilyButton itself might need touch events.
    // Let's assume touches on the container (outside of inner buttons) are drags.
    handleDragStart(e.touches[0].clientY);
  };

  // Global event listeners for drag
  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e) => handleDragMove(e.clientY);
    const onTouchMove = (e) => handleDragMove(e.touches[0].clientY);
    const onEnd = () => handleDragEnd();

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onEnd);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  const handleMessagesClick = () => {
    if (user?.role === "CLIENT") {
      navigate("/client/messages");
    } else if (user?.role === "FREELANCER") {
      navigate("/freelancer/messages");
    } else if (user?.role === "PROJECT_MANAGER") {
      navigate("/project-manager/messages");
    } else {
      navigate("/login");
    }
  };

  // Only show on dashboard routes
  const dashboardPrefixes = [
    "/client",
    "/freelancer",
    "/project-manager",
    "/admin",
  ];
  const isOnDashboard = dashboardPrefixes.some((prefix) =>
    location.pathname.startsWith(prefix)
  );

  if (!isOnDashboard) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed right-8 z-50 group cursor-grab active:cursor-grabbing",
        isDragging && "cursor-grabbing"
      )}
      style={{ bottom: `${bottomPosition}px` }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      <FamilyButton>
        <div className="flex flex-col gap-3 p-4 pb-14 w-full">
          <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-400 mb-1">
            Help
          </h4>

          <a
            href="https://wa.me/919999999999"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl w-full",
              "bg-white/60 dark:bg-neutral-800/50",
              "hover:bg-white/90 dark:hover:bg-neutral-700/50",
              "border border-black/5 dark:border-white/5",
              "hover:border-emerald-500/50 dark:hover:border-emerald-500/30",
              "transition-all duration-200 text-left group shadow-sm dark:shadow-none"
            )}
          >
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-500/20 transition-colors">
              <MessageCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-200">
                WhatsApp
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-500">
                Chat immediately
              </p>
            </div>
          </a>

          <a
            href="tel:+919999999999"
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl w-full",
              "bg-white/60 dark:bg-neutral-800/50",
              "hover:bg-white/90 dark:hover:bg-neutral-700/50",
              "border border-black/5 dark:border-white/5",
              "hover:border-blue-500/50 dark:hover:border-blue-500/30",
              "transition-all duration-200 text-left group shadow-sm dark:shadow-none"
            )}
          >
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-500/10 group-hover:bg-blue-200 dark:group-hover:bg-blue-500/20 transition-colors">
              <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-200">
                Call Support
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-500">
                Voice assistance
              </p>
            </div>
          </a>
        </div>
      </FamilyButton>
    </div>
  );
};

export default CataButton;
