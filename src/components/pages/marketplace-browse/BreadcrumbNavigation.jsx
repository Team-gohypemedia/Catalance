import { ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const BreadcrumbNavigation = ({ label = "", onBack }) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
      <button
        type="button"
        onClick={onBack}
        className="font-medium text-slate-300 transition hover:text-white"
      >
        Services
      </button>
      <ChevronRight className="h-4 w-4 text-slate-600" />
      <span className="font-medium text-white">{label}</span>
    </div>
    <Button
      type="button"
      variant="ghost"
      className="h-10 w-fit rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white hover:bg-white/[0.08]"
      onClick={onBack}
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      Back to services
    </Button>
  </div>
);

export default BreadcrumbNavigation;
