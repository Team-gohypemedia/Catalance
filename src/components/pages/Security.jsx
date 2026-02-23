import { Badge } from "@/components/ui/badge";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";

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

const Security = () => {
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
            <ShieldCheck className="mr-2 h-3.5 w-3.5" />
            Trust and Safety
          </Badge>
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-6xl">
            Security
          </h1>
          <p className="text-gray-600 dark:text-neutral-400">
            Last updated: February 23, 2026
          </p>
        </div>

        <div className="prose max-w-none prose-slate dark:prose-invert">
          <Section title="Security commitment">
            <p>
              Catalance is committed to protecting accounts, transactions, and
              communication on the platform through layered administrative,
              technical, and operational controls.
            </p>
          </Section>

          <Section title="How to report vulnerabilities">
            <p>
              If you discover a vulnerability or security issue, email{" "}
              <a
                className="text-primary hover:underline"
                href="mailto:security@catalance.in"
              >
                security@catalance.in
              </a>
              .
            </p>
            <p>
              Please include enough detail for triage, such as affected page or
              endpoint, reproduction steps, impact, and any proof-of-concept
              material that helps confirm the issue.
            </p>
            <p>
              Catalance follows responsible-disclosure principles, acknowledges
              valid reports, and may recognize contributors in a
              &quot;Security Hall of Fame&quot;.
            </p>
          </Section>

          <Section title="Platform safeguards">
            <p>
              Catalance aims to follow recognized best practices such as
              encrypted transport, hardened authentication flows, suspicious
              activity monitoring, and secure infrastructure operations.
            </p>
            <p>
              Controls can include practices often used across modern
              marketplaces, such as multi-factor authentication support,
              HTTPS/HSTS protections, and malware/spam scanning workflows.
            </p>
          </Section>

          <Section title="User security best practices">
            <ul className="list-disc space-y-2 pl-6">
              <li>Use strong, unique passwords and rotate them periodically.</li>
              <li>Enable multi-factor authentication when available.</li>
              <li>
                Keep communication and payments on-platform for protection and
                dispute traceability.
              </li>
              <li>
                Report suspicious messages, payment requests, or account
                activity immediately.
              </li>
            </ul>
          </Section>
        </div>
      </div>
    </main>
  );
};

export default Security;
