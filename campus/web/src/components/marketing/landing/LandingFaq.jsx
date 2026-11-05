import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlatformConfig } from "@/lib/platform";
import { Faq, Reveal, SectionTitle } from "../primitives";

/** FAQs come from admin settings (spec §1.1); content.js FAQ_ITEMS are no longer used here. */
export function LandingFaq() {
  const { content } = usePlatformConfig();
  return (
    <section id="faq" className="border-t border-line bg-surface py-20 sm:py-28">
      <div className="container-campus">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-16">
        <Reveal>
          <SectionTitle
            align="left"
            eyebrow="FAQ"
            title="Questions, answered"
            description="Payment, courses, assessments, verification and projects."
          />
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Button to="/tracks" rightIcon={ArrowRight}>
              Explore Courses
            </Button>
            <Button to="/faqs" variant="link" className="px-0">
              All FAQs
            </Button>
          </div>
        </Reveal>
        <Reveal delay={0.06}>
          <Faq items={content.faqs.slice(0, 6)} />
        </Reveal>
      </div>
      </div>
    </section>
  );
}
