import PropTypes from "prop-types";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import BriefcaseBusiness from "lucide-react/dist/esm/icons/briefcase-business";
import Flag from "lucide-react/dist/esm/icons/flag";
import Lock from "lucide-react/dist/esm/icons/lock";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import UserRound from "lucide-react/dist/esm/icons/user-round";

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

const primaryConfettiColor = "var(--primary)";
const subtlePrimaryConfettiColor =
  "color-mix(in srgb, var(--primary) 52%, transparent)";
const mutedPrimaryConfettiColor =
  "color-mix(in srgb, var(--primary) 68%, transparent)";
const brightPrimaryConfettiColor =
  "color-mix(in srgb, var(--primary) 90%, transparent)";

const welcomeHighlights = [
  {
    title: "Profile",
    description: "Set up your identity, proof, and professional overview.",
    icon: UserRound,
  },
  {
    title: "Services",
    description: "Define what you offer so clients can discover the right fit.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Delivery",
    description: "Lock in your workflow, policies, and working preferences.",
    icon: ShieldCheck,
  },
];

const confettiPieces = [
  { top: "8%", left: "7%", width: "0.38rem", height: "0.38rem", rotate: "-18deg", color: primaryConfettiColor, glow: "primary" },
  { top: "12%", left: "23%", width: "0.25rem", height: "0.25rem", rotate: "45deg", color: subtlePrimaryConfettiColor, glow: "primary" },
  { top: "5%", left: "38%", width: "0.42rem", height: "0.42rem", rotate: "42deg", color: primaryConfettiColor, glow: "primary" },
  { top: "10%", left: "56%", width: "0.28rem", height: "0.28rem", rotate: "-22deg", color: "rgba(255,255,255,0.7)" },
  { top: "7%", left: "71%", width: "0.32rem", height: "0.32rem", rotate: "45deg", color: primaryConfettiColor, glow: "primary" },
  { top: "11%", left: "88%", width: "0.24rem", height: "0.24rem", rotate: "45deg", color: "rgba(255,255,255,0.82)" },
  { top: "19%", left: "12%", width: "0.22rem", height: "0.22rem", rotate: "0deg", color: mutedPrimaryConfettiColor, glow: "primary" },
  { top: "18%", left: "30%", width: "0.48rem", height: "0.48rem", rotate: "45deg", color: primaryConfettiColor, glow: "primary" },
  { top: "15%", left: "47%", width: "0.78rem", height: "0.18rem", rotate: "50deg", color: primaryConfettiColor, radius: "999px", glow: "primary" },
  { top: "20%", left: "63%", width: "0.26rem", height: "0.26rem", rotate: "45deg", color: brightPrimaryConfettiColor, glow: "primary" },
  { top: "16%", left: "79%", width: "0.84rem", height: "0.22rem", rotate: "30deg", color: primaryConfettiColor, radius: "999px", glow: "primary" },
  { top: "22%", left: "90%", width: "0.34rem", height: "0.34rem", rotate: "45deg", color: mutedPrimaryConfettiColor, glow: "primary" },
  { top: "28%", left: "19%", width: "0.72rem", height: "0.18rem", rotate: "-48deg", color: "rgba(255,255,255,0.72)", radius: "999px" },
  { top: "24%", left: "73%", width: "0.65rem", height: "0.16rem", rotate: "-58deg", color: brightPrimaryConfettiColor, radius: "999px", glow: "primary" },
];

const FreelancerOnboardingWelcomeModal = ({
  open = false,
  onStartOnboarding,
}) => (
  <AlertDialog open={open} onOpenChange={() => {}}>
    <AlertDialogContent
      onEscapeKeyDown={preventModalDismiss}
      onInteractOutside={preventModalDismiss}
      onPointerDownOutside={preventModalDismiss}
      className="origin-center w-[calc(100vw-2.25rem)] max-w-[22rem] max-h-[calc(100dvh-0.75rem)] overflow-hidden rounded-[22px] border border-primary/20 bg-[#0e0e0f]/96 p-0 text-white shadow-[0_36px_120px_rgba(0,0,0,0.62)] backdrop-blur-xl sm:w-[min(94vw,48rem)] sm:max-w-[min(94vw,48rem)] sm:max-h-[calc(100dvh-2rem)] sm:rounded-[32px] sm:scale-[0.75]"
    >
      <div className="relative max-h-[calc(100dvh-0.75rem)] overflow-y-auto overscroll-contain sm:max-h-[calc(100dvh-2rem)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--primary)_18%,transparent),transparent_42%),radial-gradient(circle_at_bottom_right,color-mix(in_srgb,var(--primary)_12%,transparent),transparent_30%)]" />
        <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_8%,transparent),transparent)]" />

        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-48">
          {confettiPieces.map((piece, index) => (
            <span
              // eslint-disable-next-line react/no-array-index-key
              key={`confetti-piece-${index}`}
              className="absolute block"
              style={{
                top: piece.top,
                left: piece.left,
                width: piece.width,
                height: piece.height,
                transform: `rotate(${piece.rotate})`,
                backgroundColor: piece.color,
                borderRadius: piece.radius || "0.12rem",
                boxShadow:
                  piece.glow === "primary"
                    ? "0 0 18px color-mix(in srgb, var(--primary) 18%, transparent)"
                    : "0 0 12px rgba(255,255,255,0.08)",
              }}
            />
          ))}
        </div>

        <div className="relative flex flex-col gap-3 p-3 sm:gap-5 sm:p-7">

          <div className="flex justify-center pt-0.5 sm:pt-1">
            <div className="flex h-[50px] w-[50px] items-center justify-center rounded-[16px] border border-primary/20 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_8%,transparent),rgba(255,255,255,0.01))] shadow-[0_18px_40px_rgba(0,0,0,0.3)] sm:h-[70px] sm:w-[70px] sm:rounded-[20px]">
              <Sparkles className="size-6 text-primary sm:size-8" />
            </div>
          </div>

          <AlertDialogHeader className="items-center space-y-2 text-center sm:space-y-3">
            <AlertDialogTitle className="text-[1.65rem] font-semibold leading-[0.95] tracking-[-0.05em] text-white sm:text-[3.1rem]">
              Welcome to <span className="text-primary">Catalance</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="mx-auto max-w-[22rem] text-center text-[0.88rem] leading-5 text-white/66 sm:max-w-[39rem] sm:text-[1rem] sm:leading-7">
              Your freelancer workspace is almost ready. Complete onboarding to
              unlock proposals, projects, messages, and payouts. This step is
              required before you can use the rest of your dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {welcomeHighlights.map((item) => (
              <div
                key={item.title}
                className="rounded-[16px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] px-2 py-2.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:rounded-[22px] sm:px-4 sm:py-4"
              >
                <div className="mx-auto flex size-9 items-center justify-center rounded-full border border-white/8 bg-[#1a1a1b] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:size-12">
                  <item.icon className="size-5 text-primary sm:size-6" />
                </div>
                <p className="mt-2.5 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-white sm:mt-4 sm:text-[0.98rem] sm:tracking-[0.18em]">
                  {item.title}
                </p>
                <div className="mx-auto mt-2 h-px w-5 bg-primary sm:w-9" />
                <p className="mt-3 hidden text-[0.94rem] leading-6 text-white/58 sm:block">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2.5 rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] px-3 py-3 sm:gap-4 sm:rounded-[22px] sm:px-5 sm:py-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/8 bg-[#1a1a1b] sm:size-14">
              <Flag className="size-4 text-primary sm:size-5" />
            </div>
            <div className="min-w-0 pt-1 text-left">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-primary sm:text-[0.76rem] sm:tracking-[0.24em]">
                Next Step
              </p>
              <p className="mt-1.5 text-[0.82rem] leading-5 text-white/72 sm:mt-2 sm:text-[0.98rem] sm:leading-7">
                Start the guided onboarding flow to finish your profile and
                enter the freelancer workspace.
              </p>
            </div>
          </div>

          <AlertDialogAction asChild>
            <Button
              type="button"
              onClick={onStartOnboarding}
              className="h-11 w-full rounded-[13px] bg-primary text-[0.98rem] font-semibold text-primary-foreground shadow-[0_20px_40px_color-mix(in_srgb,var(--primary)_18%,transparent)] hover:bg-primary/90 sm:h-14 sm:rounded-[16px] sm:text-lg"
            >
              Start Onboarding
              <ArrowRight className="size-5" />
            </Button>
          </AlertDialogAction>

          <div className="hidden items-center justify-center gap-2 text-center text-[0.78rem] leading-5 text-white/38 sm:flex sm:text-[0.84rem]">
            <Lock className="size-3.5" />
            <span>Takes only a few minutes - 100% Secure</span>
          </div>
        </div>
      </div>
    </AlertDialogContent>
  </AlertDialog>
);

FreelancerOnboardingWelcomeModal.propTypes = {
  open: PropTypes.bool,
  onStartOnboarding: PropTypes.func.isRequired,
};

export default FreelancerOnboardingWelcomeModal;
