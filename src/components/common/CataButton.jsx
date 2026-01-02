"use client";

import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bot, MessageCircle, HelpCircle, X } from "lucide-react";
import { FamilyButton } from "@/components/ui/family-button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export const CataButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

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
    <div className="fixed bottom-8 right-8 z-50">
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
