import { Badge } from "@/components/ui/badge";
import LifeBuoy from "lucide-react/dist/esm/icons/life-buoy";

const Section = ({ title, children }) => (
  <section className="mb-10">
    <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
      {title}
    </h2>
    <div className="space-y-4 leading-relaxed text-gray-700 dark:text-neutral-300">
      {children}
    </div>
  </section>
);

const ContactUs = () => {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-white text-gray-900 dark:bg-black dark:text-white selection:bg-primary/30">
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(15, 23, 42, 0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(15, 23, 42, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,rgba(253,200,0,0.18),transparent_45%)] dark:bg-[radial-gradient(circle_at_top,rgba(253,200,0,0.12),transparent_45%)]" />

      <div className="relative z-10 mx-auto max-w-4xl px-6 pb-20 pt-24">
        <div className="mb-16 text-center">
          <Badge className="mb-6 border-primary/20 bg-primary/10 px-4 py-1.5 text-primary backdrop-blur-md">
            <LifeBuoy className="mr-2 h-3.5 w-3.5" />
            Support
          </Badge>
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-6xl">
            Contact Us
          </h1>
          <p className="text-gray-600 dark:text-neutral-400">
            Last updated: February 23, 2026
          </p>
        </div>

        <div className="prose max-w-none prose-slate dark:prose-invert">
          <Section title="Introduction">
            <p>Catalance is committed to prompt, helpful support.</p>
          </Section>

          <Section title="Customer support">
            <p>
              For general inquiries or support email{" "}
              <a
                className="text-primary hover:underline"
                href="mailto:support@catalance.in"
              >
                support@catalance.in
              </a>
              . We aim to respond within two business days.
            </p>
            <p>
              Live chat is available via the Catalance dashboard during
              business hours (10 am-6 pm IST, Monday-Friday).
            </p>
            <p>
              Phone support is available at{" "}
              <a className="text-primary hover:underline" href="tel:+9111XXXXXXX">
                +91-11-XXXX-XXXX
              </a>
              .
            </p>
            <p>
              You can also write to Catalance Technologies Pvt. Ltd., 3rd
              Floor, Connaught Place, New Delhi 110001, India.
            </p>
          </Section>

          <Section title="Security reporting">
            <p>
              If you discover a vulnerability or security issue, report it to{" "}
              <a
                className="text-primary hover:underline"
                href="mailto:security@catalance.in"
              >
                security@catalance.in
              </a>
              .
            </p>
            <p>
              Freelancer&apos;s security page encourages researchers to report
              vulnerabilities via email and provides responsible-disclosure
              guidelines. Catalance requests similar details and will
              acknowledge reports.
            </p>
            <p>
              We may recognize contributors in a &quot;Security Hall of
              Fame&quot;.
            </p>
          </Section>

          <Section title="Press and media">
            <p>
              For press or partnership inquiries, email{" "}
              <a
                className="text-primary hover:underline"
                href="mailto:press@catalance.in"
              >
                press@catalance.in
              </a>
              .
            </p>
          </Section>
        </div>
      </div>
    </main>
  );
};

export default ContactUs;
