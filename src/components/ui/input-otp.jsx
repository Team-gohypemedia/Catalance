import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"
import MinusIcon from "lucide-react/dist/esm/icons/minus";

import { cn } from "@/shared/lib/utils"

const InputOTP = React.forwardRef(function InputOTP(
  { className, containerClassName, ...props },
  ref,
) {
  return (
    <OTPInput
      ref={ref}
      data-slot="input-otp"
      containerClassName={cn("flex items-center gap-2 has-disabled:opacity-50", containerClassName)}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props} />
  );
});

InputOTP.displayName = "InputOTP";

function InputOTPGroup({
  className,
  ...props
}) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn("flex items-center gap-3 sm:gap-4", className)}
      {...props} />
  );
}

function InputOTPSlot({
  index,
  className,
  ...props
}) {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {}

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        "data-[active=true]:border-primary data-[active=true]:ring-2 data-[active=true]:ring-primary/50 data-[active=true]:aria-invalid:ring-destructive/20 dark:data-[active=true]:aria-invalid:ring-destructive/40 aria-invalid:border-destructive data-[active=true]:aria-invalid:border-destructive bg-black/5 dark:bg-[#171717] border-black/20 dark:border-white/20 relative flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center border text-base sm:text-lg font-semibold shadow-xs transition-all outline-none rounded-xl data-[active=true]:z-10",
        className
      )}
      {...props}>
      {char}
      {hasFakeCaret && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink bg-foreground h-4 w-px duration-1000" />
        </div>
      )}
    </div>
  );
}

function InputOTPSeparator({
  ...props
}) {
  return (
    <div data-slot="input-otp-separator" role="separator" {...props}>
      <MinusIcon />
    </div>
  );
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
