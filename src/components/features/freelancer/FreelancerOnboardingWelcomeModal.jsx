import PropTypes from "prop-types";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import BriefcaseBusiness from "lucide-react/dist/esm/icons/briefcase-business";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import UserRound from "lucide-react/dist/esm/icons/user-round";
import Rocket from "lucide-react/dist/esm/icons/rocket";
import Clock from "lucide-react/dist/esm/icons/clock";
import Truck from "lucide-react/dist/esm/icons/truck";
import X from "lucide-react/dist/esm/icons/x";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const preventModalDismiss = (event) => {
  event.preventDefault();
};

const welcomeHighlights = [
  {
    title: "PROFILE",
    description: "Tell us who you are and showcase your skills.",
    icon: UserRound,
  },
  {
    title: "SERVICES",
    description: "Define what you offer and set your rates.",
    icon: BriefcaseBusiness,
  },
  {
    title: "DELIVERY",
    description: "Setup your pipeline for client delivery.",
    icon: Truck,
  },
];

const FreelancerOnboardingWelcomeModal = ({
  open = false,
  onStartOnboarding,
  onClose,
}) => (
  <AlertDialog open={open} onOpenChange={onClose}>
    <AlertDialogContent
      onEscapeKeyDown={preventModalDismiss}
      onInteractOutside={preventModalDismiss}
      onPointerDownOutside={preventModalDismiss}
      className="origin-center w-[calc(100vw-2rem)] max-w-[34rem] overflow-hidden rounded-[16px] border border-border bg-card p-0 text-foreground shadow-[0_20px_60px_rgba(0,0,0,0.22)] sm:w-[min(94vw,34rem)] sm:rounded-[20px]"
    >
      <div className="relative max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain bg-card">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 left-4 flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        )}
        
        <div className="flex flex-col gap-4 p-5 sm:gap-6 sm:p-8 pt-8 sm:pt-10 items-center">
          
          <div className="flex justify-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
              <Rocket className="size-5 text-primary" />
            </div>
          </div>

          <AlertDialogHeader className="items-center space-y-1.5 text-center sm:space-y-2">
            <AlertDialogTitle className="text-[1.5rem] font-bold tracking-tight text-foreground sm:text-[1.75rem]">
              Welcome to Catalance
            </AlertDialogTitle>
            <AlertDialogDescription className="mx-auto max-w-[22rem] text-center text-[0.85rem] text-muted-foreground sm:max-w-[28rem] sm:text-[0.95rem]">
              Your freelancer workspace is almost ready...
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-[30rem] mt-1">
            {welcomeHighlights.map((item) => (
              <div
                key={item.title}
                className="flex flex-col items-center rounded-[10px] border border-border bg-card px-2 py-4 text-center shadow-sm"
              >
                <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 mb-1">
                  <item.icon className="size-4 text-primary" />
                </div>
                <p className="mt-2 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-foreground">
                  {item.title}
                </p>
                <p className="mt-1.5 text-[0.75rem] leading-relaxed text-muted-foreground px-1">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="w-full flex flex-col items-center mt-2">
            <p className="text-muted-foreground italic text-[0.85rem] mb-3">
              Start the guided onboarding flow...
            </p>
            
            <AlertDialogAction asChild>
              <Button
                type="button"
                onClick={onStartOnboarding}
                className="h-10 w-[14rem] rounded-[8px] bg-primary text-[0.9rem] font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Start Onboarding
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </AlertDialogAction>
          </div>
          
          <div className="w-full max-w-[26rem] mt-2 border-t border-border pt-4 flex items-center justify-center gap-2 text-muted-foreground text-[0.75rem]">
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5" />
              <span>Takes only a few minutes</span>
            </div>
            <span className="text-muted-foreground/30 px-1">•</span>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5" />
              <span>100% Secure</span>
            </div>
          </div>

        </div>
      </div>
    </AlertDialogContent>
  </AlertDialog>
);

FreelancerOnboardingWelcomeModal.propTypes = {
  open: PropTypes.bool,
  onStartOnboarding: PropTypes.func.isRequired,
  onClose: PropTypes.func,
};

export default FreelancerOnboardingWelcomeModal;
