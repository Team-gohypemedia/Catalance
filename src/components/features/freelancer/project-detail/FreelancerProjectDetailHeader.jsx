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
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-1.5">
        <h1 className="text-[clamp(1.85rem,4vw,2.75rem)] font-semibold leading-[1.02] tracking-[-0.05em] text-white">
          {pageTitle}
        </h1>
        <p className="text-xs text-muted-foreground/80">
          {activeProjectManager
            ? `Project Catalyst: ${activeProjectManager.fullName}`
            : "Project Catalyst: Not assigned yet"}
        </p>
      </div>
      <div className="flex w-full items-center gap-2 sm:w-auto sm:self-start sm:flex-nowrap">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="default"
              size="sm"
              className="h-9 gap-2 rounded-full bg-primary px-4 text-primary-foreground shadow-none hover:bg-primary/90"
            >
              <Headset className="h-4 w-4" /> Catalyst
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-2" align="end">
            <div className="grid gap-1">
              <h4 className="mb-1 px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Contact Catalyst
              </h4>
              <Button
                variant="ghost"
                className="h-auto w-full justify-start gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-muted/80"
                asChild
              >
                <a
                  href="https://wa.me/919999999999"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col items-start text-sm">
                    <span className="font-semibold text-foreground">
                      WhatsApp
                    </span>
                    <span className="text-xs font-normal text-muted-foreground">
                      Chat immediately
                    </span>
                  </div>
                </a>
              </Button>
              <Button
                variant="ghost"
                className="h-auto w-full justify-start gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-muted/80"
                asChild
              >
                <a href="tel:+919999999999">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col items-start text-sm">
                    <span className="font-semibold text-foreground">
                      Call Support
                    </span>
                    <span className="text-xs font-normal text-muted-foreground">
                      Voice assistance
                    </span>
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
      <div className="rounded-lg border border-border/60 bg-accent/40 px-4 py-3 text-sm text-muted-foreground">
        Project details for this link are unavailable. Previewing layout with
        sample data.
      </div>
    ) : null}
  </>
);

export default FreelancerProjectDetailHeader;
