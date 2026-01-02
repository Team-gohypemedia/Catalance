import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bot, Plus } from "lucide-react";

import { useAuth } from "@/context/AuthContext";

export const CataButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const handleClick = () => {
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

  // Don't show on login/signup pages
  if (["/login", "/signup", "/forgot-password", "/reset-password"].includes(location.pathname)) {
    return null;
  }
  
  return (
    <Button
      className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-xl z-50 bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center transition-transform hover:scale-110"
      onClick={handleClick}
      title="Cata - Help & Messages"
    >
      <Bot className="w-8 h-8" />
    </Button>
  );
};

export default CataButton;
