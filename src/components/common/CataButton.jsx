"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bot, MessageCircle, HelpCircle, X, GripVertical } from "lucide-react";
import { FamilyButton } from "@/components/ui/family-button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

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
  const handleDragStart = useCallback((clientY) => {
    setIsDragging(true);
    dragStartY.current = clientY;
    dragStartBottom.current = bottomPosition;
  }, [bottomPosition]);

  // Handle drag move
  const handleDragMove = useCallback((clientY) => {
    if (!isDragging) return;
    const deltaY = dragStartY.current - clientY; // Positive = moving up
    const maxBottom = window.innerHeight - 150; // Leave space at top
    const newBottom = Math.max(MIN_BOTTOM, Math.min(maxBottom, dragStartBottom.current + deltaY));
    setBottomPosition(newBottom);
  }, [isDragging]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Mouse event handlers
  const onMouseDown = (e) => {
    e.preventDefault();
    handleDragStart(e.clientY);
  };

  // Touch event handlers
  const onTouchStart = (e) => {
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

  const handleHelpClick = () => {
    // Navigate to help/support page or open help dialog
    if (user?.role === "CLIENT") {
      navigate("/client/service");
    } else if (user?.role === "FREELANCER") {
      navigate("/freelancer/dashboard");
    } else {
      navigate("/contact");
    }
  };

  // Don't show on login/signup pages
  if (["/login", "/signup", "/forgot-password", "/reset-password"].includes(location.pathname)) {
    return null;
  }

  return (
    <div 
      className="fixed right-8 z-50 group"
      style={{ bottom: `${bottomPosition}px` }}
    >
      {/* Drag Handle */}
      <div
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        className={cn(
          "absolute -left-6 top-1/2 -translate-y-1/2 p-1.5 rounded-lg cursor-grab active:cursor-grabbing",
          "bg-neutral-800/80 border border-neutral-700/50 backdrop-blur-sm",
          "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
          "hover:bg-neutral-700/80 hover:border-primary/40",
          isDragging && "opacity-100 bg-primary/20 border-primary/50"
        )}
        title="Drag to move up/down"
      >
        <GripVertical className={cn("w-4 h-4", isDragging ? "text-primary" : "text-neutral-400")} />
      </div>
      <FamilyButton>
        <div className="flex flex-col gap-3 p-4 pb-14 w-full">
          <h4 className="text-sm font-semibold text-neutral-300 mb-1">
            Cata
          </h4>
          
          <button
            onClick={handleMessagesClick}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl w-full",
              "bg-neutral-800/50 hover:bg-neutral-700/50",
              "border border-neutral-700/50 hover:border-primary/50",
              "transition-all duration-200 text-left group"
            )}
          >
            <div className="p-2 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-200">Messages</p>
              <p className="text-xs text-neutral-500">View conversations</p>
            </div>
          </button>

          <button
            onClick={handleHelpClick}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl w-full",
              "bg-neutral-800/50 hover:bg-neutral-700/50",
              "border border-neutral-700/50 hover:border-cyan-500/50",
              "transition-all duration-200 text-left group"
            )}
          >
            <div className="p-2 rounded-lg bg-cyan-500/20 group-hover:bg-cyan-500/30 transition-colors">
              <HelpCircle className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-200">Help & AI</p>
              <p className="text-xs text-neutral-500">Get assistance</p>
            </div>
          </button>
        </div>
      </FamilyButton>
    </div>
  );
};

export default CataButton;
