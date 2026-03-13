"use client";

import Zap from "lucide-react/dist/esm/icons/zap";
import { Link } from "react-router-dom";
import { cn } from "@/shared/lib/utils";

const footerLinks = [
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Terms of Service", to: "/terms" },
  { label: "Support Center", to: "/help" },
];

const toneMap = {
  default: {
    border: "border-border/60",
    meta: "text-muted-foreground",
    icon: "text-primary",
    link: "text-muted-foreground hover:text-foreground",
  },
  workspace: {
    border: "border-white/[0.05]",
    meta: "text-[#64748b]",
    icon: "text-[#ffc107]",
    link: "text-[#64748b] hover:text-[#f1f5f9]",
  },
};

const currentYear = new Date().getFullYear();

const ClientDashboardFooter = ({ className, variant = "default" }) => {
  const tone = toneMap[variant] || toneMap.default;

  return (
    <footer className={cn("border-t px-2 py-8", tone.border, className)}>
      <div className="flex flex-col gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <div className={cn("flex items-center justify-center gap-2 text-xs sm:justify-start", tone.meta)}>
          <Zap className={cn("size-3.5", tone.icon)} />
          <span>&copy; {currentYear} Catalance. All rights reserved.</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 sm:justify-end">
          {footerLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn("text-xs transition-colors", tone.link)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default ClientDashboardFooter;
