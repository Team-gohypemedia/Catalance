import X from "lucide-react/dist/esm/icons/x";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";
import {
  CARD_CLASS,
  EYEBROW_CLASS,
  HOW_IT_WORKS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
  SUBTLE_CARD_CLASS,
} from "./shared";

const GrowthQuestInfoModal = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
      <div
        className={cn(CARD_CLASS, "relative z-10 w-full max-w-xl overflow-hidden")}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-white/[0.08] px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={EYEBROW_CLASS}>Growth Quest Guide</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                Simple daily progress
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Answer the daily questions, submit once, and track your streak, XP, and coins in
                one place.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={cn(SECONDARY_BUTTON_CLASS, "h-10 w-10 px-0 py-0")}
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
          <div className="grid gap-3">
            {HOW_IT_WORKS.map((item, index) => (
              <div key={item.title} className={cn(SUBTLE_CARD_CLASS, "p-4")}>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-primary/12 text-xs font-semibold text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-[6px] border border-primary/20 bg-primary/8 px-4 py-3">
            <p className="text-sm leading-6 text-primary">
              Resets at <span className="font-semibold text-foreground">00:00 UTC</span>.
            </p>
          </div>
        </div>

        <div className="flex justify-end border-t border-white/[0.08] px-6 py-4">
          <Button onClick={onClose} className={cn(PRIMARY_BUTTON_CLASS, "min-w-36")}>
            Got it, thanks
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GrowthQuestInfoModal;
