import { Link } from "react-router-dom";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle";
import Headset from "lucide-react/dist/esm/icons/headset";
import Phone from "lucide-react/dist/esm/icons/phone";
import ShieldAlert from "lucide-react/dist/esm/icons/shield-alert";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import { Button } from "@/components/ui/button";
import { ProjectNotepad } from "@/components/ui/notepad";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";


const FreelancerProjectDetailHeader = ({
  pageTitle,
  activeProjectManager,
  project,
  projectId,
  isFallback,
  isAuditing = false,
  onTriggerAudit,
  onOpenCatalystDialog,
}) => (
  <>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <h1 className="truncate text-2xl font-bold tracking-tight text-foreground dark:text-white sm:text-3xl">
          {pageTitle}
        </h1>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {activeProjectManager
              ? `Catalyst: ${activeProjectManager.fullName}`
              : "No Catalyst assigned"}
          </span>
          {project?.status && (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              project.status === "ACTIVE"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
            }`}>
              {project.status}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpenCatalystDialog?.()}
          className="h-8 gap-1.5 rounded-full border-border px-3 text-[12px] font-medium text-foreground shadow-none hover:bg-muted cursor-pointer"
        >
          <Headset className="h-3.5 w-3.5 text-[#D9692A]" /> Catalyst
        </Button>
        <ProjectNotepad projectId={project?.id || projectId} />
      </div>
    </div>

    {isFallback ? (
      <div className="rounded-lg border border-border/60 bg-accent/40 px-3.5 py-2.5 text-[13px] text-muted-foreground">
        Project details for this link are unavailable. Previewing layout with sample data.
      </div>
    ) : null}
  </>
);

export default FreelancerProjectDetailHeader;
