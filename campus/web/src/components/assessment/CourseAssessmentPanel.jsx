import { ArrowRight, BadgeCheck, FileCheck2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { usePlatformConfig } from "@/lib/platform";
import { NoGuarantee } from "@/components/marketing/NoGuarantee";

/**
 * Course page sections "Assessment and reassessment" + "What verification means" (spec §7.4).
 * Props: { course, enrollment }. Rules come from platform settings (pass mark, attempts, reassessment window).
 */
export function CourseAssessmentPanel({ course, enrollment }) {
  const { assessment } = usePlatformConfig();
  const passScore = assessment?.passScore ?? 70;
  const maxAttempts = assessment?.maxAttempts ?? 2;
  const windowDays = assessment?.reassessWindowDays ?? 14;
  const retries = Math.max(0, maxAttempts - 1);
  const skillName = course?.skill?.name;

  return (
    <section className="grid gap-4 md:grid-cols-2">
      <Card className="p-5 sm:p-6">
        <span className="flex size-9 items-center justify-center rounded-full bg-surface-2 text-muted">
          <FileCheck2 className="size-4" strokeWidth={1.75} />
        </span>
        <h3 className="mt-4 text-base font-medium tracking-tight">Assessment and reassessment</h3>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li>One practical project at the end, scored by an evaluator with a published rubric.</li>
          <li>
            Pass mark {passScore}/100, and every critical criterion must be met.
          </li>
          <li className="flex gap-2">
            <RotateCcw className="mt-0.5 size-3.5 shrink-0" />
            <span>
              {retries > 0
                ? `Not there yet? You get feedback and ${retries === 1 ? "one reassessment" : `${retries} reassessments`} within ${windowDays} days.`
                : "There is no reassessment for this course."}{" "}
              You can appeal a result once.
            </span>
          </li>
        </ul>
        {enrollment && (
          <Button to={`/app/assessments/${course.id}`} variant="outline" size="sm" rightIcon={ArrowRight} className="mt-5">
            View assessment
          </Button>
        )}
      </Card>

      <Card className="p-5 sm:p-6">
        <span className="flex size-9 items-center justify-center rounded-full bg-surface-2 text-muted">
          <BadgeCheck className="size-4" strokeWidth={1.75} />
        </span>
        <h3 className="mt-4 text-base font-medium tracking-tight">What verification means</h3>
        <p className="mt-3 text-sm text-muted">
          Pass the assessment and complete a short onboarding to get a {skillName ? <span className="text-fg">{skillName}</span> : "skill"} badge for this level. It records the skill,
          level, date and your evidence, and has a public verify link.
        </p>
        <p className="mt-2 text-sm text-muted">Finishing the lessons gives you a course certificate. Paying or finishing alone never verifies a skill.</p>
        <NoGuarantee className="mt-4" />
      </Card>
    </section>
  );
}

export default CourseAssessmentPanel;
