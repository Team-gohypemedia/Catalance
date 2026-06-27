import Headset from "lucide-react/dist/esm/icons/headset";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Store from "lucide-react/dist/esm/icons/store";
import Bot from "lucide-react/dist/esm/icons/bot";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import { ProjectNotepad } from "@/components/ui/notepad";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ClientProjectDetailHeader = ({
  pageTitle,
  activeProjectManager,
  openCatalystDialog,
  catalystRequestTypes,
  project,
  projectId,
  isMarketplaceLive = false,
  canToggleMarketplaceLive = false,
  isUpdatingMarketplaceLive = false,
  onToggleMarketplaceLive,
  onOpenAiChat,
}) => (
  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
    <div className="space-y-1.5">
      <h1 className="text-[clamp(1.85rem,4vw,2.75rem)] font-semibold leading-[1.02] tracking-[-0.05em] text-foreground dark:text-white">
        {pageTitle}
      </h1>
      <p className="text-xs text-muted-foreground dark:text-[#717784]">
        {activeProjectManager
          ? `Project Catalyst: ${activeProjectManager.fullName}`
          : "Project Catalyst: Not assigned yet"}
      </p>
    </div>
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:self-start">
      {/* canToggleMarketplaceLive ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isUpdatingMarketplaceLive}
                onClick={onToggleMarketplaceLive}
                className={`h-9 rounded-full border px-4 ${
                  isMarketplaceLive
                    ? "border-emerald-500/20 dark:border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15"
                    : "border-border dark:border-white/15 bg-muted dark:bg-white/5 text-foreground dark:text-slate-200 hover:bg-accent dark:hover:bg-white/10"
                }`}
              >
                {isUpdatingMarketplaceLive ? (
                  <Loader2 className="mr-0.5 h-4 w-4 animate-spin" />
                ) : (
                  <Store className="mr-0.5 h-4 w-4" />
                )}
                {isMarketplaceLive
                  ? "Remove from Marketplace"
                  : "Live to Marketplace"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {isMarketplaceLive
                  ? "Freelancers can currently see this in Opportunity."
                  : "Publish this project to freelancer Opportunity feed."}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : null */}

      {/* <Button
        size="sm"
        className="h-9 rounded-full px-4 border-0 text-white bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 shadow-sm shadow-violet-500/25 transition-all duration-300 hover:shadow-violet-500/40"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (onOpenAiChat) onOpenAiChat();
        }}
      >
        <Sparkles className="mr-2 h-4 w-4" />
        Generate Code with AI
      </Button> */}

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="default"
              size="sm"
              className="h-9 rounded-full bg-primary px-4 text-primary-foreground hover:bg-primary/90"
              onClick={() =>
                openCatalystDialog(catalystRequestTypes.GENERAL)
              }
            >
              <Headset className="mr-0.5 h-4 w-4" />
              Catalyst
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Project Catalyst</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <ProjectNotepad projectId={project?.id || projectId} />
    </div>
  </div>
);

export default ClientProjectDetailHeader;
