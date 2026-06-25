import MessageCircle from "lucide-react/dist/esm/icons/message-circle";
import Headset from "lucide-react/dist/esm/icons/headset";
import Phone from "lucide-react/dist/esm/icons/phone";
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
                : project.status === "COMPLETED"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400"
                  : "bg-muted text-muted-foreground"
            }`}>
              {project.status === "ACTIVE" ? "Active" : project.status === "COMPLETED" ? "Completed" : project.status}
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 rounded-full border-border px-3 text-[12px] font-medium text-foreground shadow-none hover:bg-muted"
            >
              <Headset className="h-3.5 w-3.5" /> Catalyst
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="end">
            <div className="grid gap-1">
              <h4 className="mb-1 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Contact Catalyst
              </h4>
              <Button
                variant="ghost"
                className="h-auto w-full justify-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/80"
                asChild
              >
                <a
                  href="https://wa.me/918882855425"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col items-start text-sm">
                    <span className="font-semibold text-foreground">WhatsApp</span>
                    <span className="text-xs font-normal text-muted-foreground">Chat immediately</span>
                  </div>
                </a>
              </Button>
              <Button
                variant="ghost"
                className="h-auto w-full justify-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/80"
                asChild
              >
                <a href="tel:+918882855425">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col items-start text-sm">
                    <span className="font-semibold text-foreground">Call Support</span>
                    <span className="text-xs font-normal text-muted-foreground">Voice assistance</span>
                  </div>
                </a>
              </Button>
            </div>
          </PopoverContent>
        </Popover>
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
