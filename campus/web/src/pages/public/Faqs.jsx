import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Faq, PageHero, Reveal } from "@/components/marketing/primitives";
import { NoGuarantee } from "@/components/marketing/NoGuarantee";
import { usePlatformConfig } from "@/lib/platform";

/** Public FAQs (spec §4.1): payment, course, assessment, verification and project questions. Copy comes from settings. */
export default function Faqs() {
  const { content } = usePlatformConfig();
  return (
    <>
      <PageHero
        eyebrow="FAQs"
        title={
          <>
            Questions, <em className="accent">answered</em>
          </>
        }
        description="Payment, courses, assessments, verification and projects."
        actions={
          <Button to="/tracks" size="lg" rightIcon={ArrowRight}>
            Explore Courses
          </Button>
        }
      />
      <section className="container-campus pb-20 sm:pb-28">
        <Reveal className="mx-auto max-w-3xl">
          <Faq items={content.faqs} />
          <NoGuarantee className="mt-8 text-center" />
          <p className="mt-6 text-center text-sm text-muted">
            Still stuck?{" "}
            <Link to="/contact" className="text-primary hover:underline">
              Contact support
            </Link>
          </p>
        </Reveal>
      </section>
    </>
  );
}
