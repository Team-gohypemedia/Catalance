import { Link } from "react-router-dom";
import { LifeBuoy, Mail, Megaphone, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero, Reveal } from "@/components/marketing/primitives";
import { useAuth } from "@/context/AuthContext";
import { usePlatformConfig } from "@/lib/platform";

/** Contact / Support (spec §4.1): the support route and how complaints are escalated. */
export default function Contact() {
  const { isAuthed } = useAuth();
  const { support } = usePlatformConfig();
  const helpTo = isAuthed ? "/app/help" : "/login?next=%2Fapp%2Fhelp";

  const steps = [
    { icon: LifeBuoy, title: "Raise a ticket", body: "Log in and open Help and support. Pick a topic and tell us what happened. We usually reply within 2 working days." },
    { icon: Megaphone, title: "Escalate a complaint", body: "Not happy with the answer? Open the ticket and choose Raise a complaint. A senior team member takes it over." },
    { icon: Scale, title: "Appeal a result", body: "Disagree with an assessment result? Appeal once from the result page. A different reviewer decides." },
  ];

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title={
          <>
            We're here to <em className="accent">help</em>
          </>
        }
        description="Questions about payments, courses, assessments or projects. One place to ask."
        actions={
          <Button to={helpTo} size="lg">
            Contact Support
          </Button>
        }
      />

      <section className="container-campus pb-16 sm:pb-24">
        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.05} className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
              <span className="flex size-10 items-center justify-center rounded-full bg-surface-2 text-primary">
                <s.icon className="size-5" strokeWidth={1.75} />
              </span>
              <h2 className="mt-5 text-lg font-medium tracking-tight">{s.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
            </Reveal>
          ))}
        </div>

        <Reveal className="mx-auto mt-10 flex max-w-2xl flex-col items-center gap-2 text-center text-sm text-muted">
          <p className="inline-flex items-center gap-2">
            <Mail className="size-4" strokeWidth={1.75} /> Email:{" "}
            <a href={`mailto:${support.email}`} className="text-primary hover:underline">
              {support.email}
            </a>
          </p>
          <p>
            Read the{" "}
            <Link to="/faqs" className="text-primary hover:underline">
              FAQs
            </Link>{" "}
            and{" "}
            <Link to="/legal/refund" className="text-primary hover:underline">
              refund policy
            </Link>{" "}
            first. Never share passwords or OTPs with anyone, including us.
          </p>
        </Reveal>
      </section>
    </>
  );
}
