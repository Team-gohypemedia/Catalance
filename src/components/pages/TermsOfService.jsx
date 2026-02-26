import { Badge } from "@/components/ui/badge";
import FileText from "lucide-react/dist/esm/icons/file-text";

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

const TermsOfService = () => {
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
            <FileText className="w-3.5 h-3.5 mr-2" />
            Legal
          </Badge>
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-6xl">
            Terms of Service
          </h1>
          <p className="text-gray-600 dark:text-neutral-400">
            Last updated: February 23, 2026
          </p>
        </div>

        <div className="prose max-w-none prose-slate dark:prose-invert">
          <Section title="Agreement to Terms">
            <p>
              Welcome to Catalance. By accessing our website or using any
              Catalance services you agree to be bound by these Terms of
              Service. This agreement is legally binding and includes important
              information about your legal rights and obligations. If you do
              not agree to these Terms, please do not use our services.
            </p>
          </Section>

          <Section title="Eligibility and account registration">
            <p>
              You must be at least 18 years old (or the age of majority in
              your jurisdiction) and have legal capacity to enter into a
              contract.
            </p>
            <p>
              You must create an account to access certain features;
              registration is subject to our approval for lawful reasons. You
              are responsible for maintaining the confidentiality of your login
              credentials, and if you register on behalf of a business, you
              must have authority to bind that entity.
            </p>
          </Section>

          <Section title="Use of the platform">
            <p>
              Catalance provides an online marketplace where clients post
              projects and freelancers offer services. We are not a party to
              the contracts between clients and freelancers. The contract for
              project delivery remains between the client and freelancer and
              may include escrow instructions and related documents.
            </p>
            <p>
              Catalance users remain responsible for taxes and legal
              compliance. Users grant Catalance a non-exclusive license to use
              any content they post, and agree not to:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>Violate applicable laws</li>
              <li>Submit false information</li>
              <li>Attempt to bypass platform policies</li>
              <li>Engage in fraud or spam</li>
              <li>Interfere with platform security</li>
            </ul>
            <p>
              Users should keep communication and payments on-platform for
              security, auditability, and dispute support.
            </p>
          </Section>

          <Section title="Fees and payments">
            <p>
              Commercial terms and payment requirements are shown during the
              project flow and may vary by contract type.
            </p>
            <p>
              Users must keep payment activity on-platform and follow milestone
              and approval workflows as defined by the service.
            </p>
          </Section>

          <Section title="Refunds and disputes">
            <p>
              Clients may request refunds within 180 days of payment, but
              Catalance reserves the right to mediate disputes. In case of
              conflict, users should attempt resolution via messaging;
              Catalance may offer mediation but is not obligated to decide the
              dispute.
            </p>
            <p>
              Users agree to pursue arbitration or legal remedies in Delhi,
              India, unless prohibited by law.
            </p>
          </Section>

          <Section title="Limitation of liability">
            <p>
              Catalance provides the platform as is and disclaims all
              warranties. We are not liable for indirect, incidental, or
              consequential damages.
            </p>
          </Section>

          <Section title="Modification and termination">
            <p>
              Catalance may modify these Terms at any time and will update the
              Last Updated date. Continued use constitutes acceptance.
            </p>
            <p>
              Catalance may terminate or suspend accounts at its discretion.
              Users may close their accounts after fulfilling their
              obligations.
            </p>
          </Section>
        </div>
      </div>
    </main>
  );
};

export default TermsOfService;
