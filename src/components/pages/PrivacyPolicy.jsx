import { Badge } from "@/components/ui/badge";
import Shield from "lucide-react/dist/esm/icons/shield";

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

const PrivacyPolicy = () => {
  return (
    <main
      className="relative min-h-screen w-full overflow-hidden bg-white text-gray-900 dark:bg-black dark:text-white selection:bg-primary/30"
    >
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
        <div className="text-center mb-16">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 backdrop-blur-md px-4 py-1.5">
            <Shield className="w-3.5 h-3.5 mr-2" />
            Privacy
          </Badge>
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-6xl">
            Privacy Policy
          </h1>
          <p className="text-gray-600 dark:text-neutral-400">
            Last updated: February 23, 2026
          </p>
        </div>

        <div className="prose max-w-none prose-slate dark:prose-invert">
          <Section title="Introduction">
            <p>
              This Privacy Policy explains how Catalance collects, uses, stores,
              and shares personal information. Fiverr&apos;s policy applies to
              users and visitors and is updated regularly, and Catalance
              similarly commits to update this policy and indicate the last
              revision date.
            </p>
          </Section>

          <Section title="Information we collect">
            <p>
              We collect information you provide directly, including name,
              email, password, profile details, payment information, identity
              documents, and uploaded content.
            </p>
            <p>
              We also collect data automatically, such as device details, IP
              address, log data, usage statistics, cookies, transaction data,
              and approximate geolocation.
            </p>
            <p>
              We may receive information from third parties such as identity
              verification and payment processors to detect fraud and support
              risk assessment.
            </p>
          </Section>

          <Section title="Legal basis for processing">
            <p>
              We process personal data to perform contracts (for example,
              payments and support), pursue legitimate interests (for example,
              improving and securing the platform), comply with legal
              obligations (for example, anti-money-laundering requirements),
              and obtain consent when required.
            </p>
            <p>
              As reflected in comparable marketplace policies, legitimate
              interest processing is balanced against users&apos; rights.
            </p>
          </Section>

          <Section title="How we use information">
            <p>We use information to:</p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>Create and manage accounts</li>
              <li>Enable communications between users</li>
              <li>Process payments and provide support</li>
              <li>Improve and personalize services</li>
              <li>Conduct research and analytics</li>
              <li>Protect marketplace integrity and prevent fraud</li>
              <li>Send service and marketing communications with opt-out</li>
              <li>Comply with legal obligations</li>
            </ul>
          </Section>

          <Section title="Sharing of information">
            <p>
              Catalance shares data with service providers and other users as
              necessary to perform contracts. We may also share information
              with regulators or prospective buyers in corporate transactions.
            </p>
            <p>
              We do not sell personal information. Some marketplace platforms
              offer a &quot;Do Not Sell My Personal Information&quot; option under the
              CCPA; Catalance follows the principle of not selling personal
              data.
            </p>
          </Section>

          <Section title="Data retention">
            <p>
              We retain personal information only as long as necessary for the
              purposes described in this policy or as required by law.
            </p>
          </Section>

          <Section title="Cookies and tracking technologies">
            <p>
              We use cookies to recognize users, improve functionality, analyze
              usage, and deliver targeted advertising. Users can manage cookie
              preferences via browser settings.
            </p>
            <p>
              Similar to major platform policies, Catalance may not respond to
              Do Not Track signals.
            </p>
          </Section>

          <Section title="International data transfers">
            <p>
              If personal data is transferred outside India, we will implement
              appropriate safeguards, including standard contractual clauses
              where required.
            </p>
          </Section>

          <Section title="Data security">
            <p>
              We implement administrative, technical, and physical safeguards
              to protect personal information.
            </p>
            <p>
              Industry best practices can include measures such as
              multi-factor authentication, HTTPS/HSTS encryption, malware and
              spam scanning, and controls aligned with standards like SOC 2,
              PCI DSS, and ISO 27001/27018. Catalance aims to follow similar
              best practices over time.
            </p>
          </Section>

          <Section title="Your rights">
            <p>
              Depending on your jurisdiction, you may have the right to access,
              rectify, delete, or port your personal data, object to or
              restrict processing, and withdraw consent where processing is
              based on consent.
            </p>
          </Section>

          <Section title="Children&apos;s privacy">
            <p>
              Our services are intended for users at least 18 years old.
              Catalance does not knowingly collect personal information from
              children under 13 and does not offer services intended for
              children.
            </p>
          </Section>

          <Section title="Updates">
            <p>
              We may update this Privacy Policy from time to time and will post
              the revised version with an updated &quot;Last updated&quot; date.
              Continued use of the service after updates constitutes
              acceptance.
            </p>
          </Section>
        </div>
      </div>
    </main>
  );
};

export default PrivacyPolicy;
