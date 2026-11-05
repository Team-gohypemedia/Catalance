/**
 * B (consent): required consent checkboxes (spec §5.1 step 4, §15). Policies open in a new tab so a checkout or
 * onboarding step keeps its state. Marketing is always optional and unticked by default.
 *   const [consents, setConsents] = useState({});
 *   <ConsentCheckboxes purposes={["TERMS", "PRIVACY", "REFUND"]} optional={["MARKETING"]} value={consents} onChange={setConsents} />
 *   allAccepted(consents, ["TERMS", "PRIVACY", "REFUND"])
 */
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const DOC_LINK = (to, label) => (
  <a href={to} target="_blank" rel="noreferrer" className="text-primary underline-offset-4 hover:underline" onClick={(e) => e.stopPropagation()}>
    {label}
  </a>
);

export const CONSENT_COPY = {
  TERMS: { label: "Terms of use", render: () => <>I accept the {DOC_LINK("/legal/terms", "Terms of use")}</> },
  PRIVACY: { label: "Privacy policy", render: () => <>I accept the {DOC_LINK("/legal/privacy", "Privacy policy")}</> },
  REFUND: { label: "Refund policy", render: () => <>I have read the {DOC_LINK("/legal/refund", "Refund policy")}</> },
  ASSESSMENT_POLICY: { label: "Assessment policy", render: () => <>I accept the {DOC_LINK("/legal/assessment", "Assessment policy")}</> },
  PROJECT_POLICY: { label: "Project policy", render: () => <>I accept the {DOC_LINK("/legal/project", "Project policy")}</> },
  MARKETING: { label: "Marketing updates", render: () => <>Send me course news and offers by email. Optional, and you can stop any time.</> },
};

export const allAccepted = (value, purposes) => purposes.every((p) => value?.[p]);
/** Purposes ticked, for POST /api/me/consents or checkout. */
export const acceptedPurposes = (value) => Object.keys(value || {}).filter((k) => value[k]);

function Row({ purpose, checked, onToggle, required, disabled }) {
  const id = `consent-${purpose.toLowerCase()}`;
  return (
    <li>
      <label htmlFor={id} className={cn("flex cursor-pointer items-start gap-3 text-sm leading-snug", disabled && "cursor-not-allowed opacity-60")}>
        <span className="relative mt-0.5 flex size-[18px] shrink-0 items-center justify-center">
          <input id={id} type="checkbox" className="peer sr-only" checked={!!checked} disabled={disabled} onChange={(e) => onToggle(e.target.checked)} aria-required={required || undefined} />
          <span
            aria-hidden="true"
            className={cn(
              "flex size-[18px] items-center justify-center rounded-[5px] border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40",
              checked ? "border-primary bg-primary text-primary-fg" : "border-line-strong bg-surface",
            )}
          >
            {checked && <Check className="size-3" strokeWidth={3} />}
          </span>
        </span>
        <span className="text-fg/90">
          {CONSENT_COPY[purpose]?.render() || purpose}
          {required && <span className="sr-only"> (required)</span>}
        </span>
      </label>
    </li>
  );
}

export function ConsentCheckboxes({ purposes = ["TERMS", "PRIVACY", "REFUND"], optional = [], value = {}, onChange, disabled = false, className, showError = false }) {
  const set = (purpose, v) => onChange?.({ ...value, [purpose]: v });
  const missing = showError && !allAccepted(value, purposes);
  return (
    <fieldset className={cn("space-y-3", className)} aria-describedby={missing ? "consent-error" : undefined}>
      <legend className="sr-only">Consents</legend>
      <ul className="space-y-3">
        {purposes.map((p) => (
          <Row key={p} purpose={p} checked={value[p]} required onToggle={(v) => set(p, v)} disabled={disabled} />
        ))}
        {optional.map((p) => (
          <Row key={p} purpose={p} checked={value[p]} onToggle={(v) => set(p, v)} disabled={disabled} />
        ))}
      </ul>
      {missing && (
        <p id="consent-error" className="text-xs text-danger">
          Please tick {purposes.length > 1 ? "the required boxes" : "the box"} to continue.
        </p>
      )}
    </fieldset>
  );
}
