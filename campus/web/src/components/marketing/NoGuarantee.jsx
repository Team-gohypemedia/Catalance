import { usePlatformConfig } from "@/lib/platform";

/** Required small print (spec §7.2, §17): shown near the journey, on course pages, offers and assessment results. */
export function NoGuarantee({ className = "" }) {
  const { content } = usePlatformConfig();
  return <p className={`text-xs text-muted ${className}`}>{content.noGuarantee}</p>;
}
