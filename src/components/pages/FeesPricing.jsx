import { Badge } from "@/components/ui/badge";
import IndianRupee from "lucide-react/dist/esm/icons/indian-rupee";

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

const FeesPricing = () => {
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
            <IndianRupee className="mr-2 h-3.5 w-3.5" />
            Billing
          </Badge>
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-6xl">
            Fees and Pricing
          </h1>
          <p className="text-gray-600 dark:text-neutral-400">
            Last updated: February 23, 2026
          </p>
        </div>

        <div className="prose max-w-none prose-slate dark:prose-invert">
          <Section title="Overview">
            <p>
              Catalance&apos;s fee structure covers payment processing, fraud
              prevention, dispute support, and continued platform development.
              All applicable fees are displayed before payment confirmation.
            </p>
          </Section>

          <Section title="For freelancers">
            <p>
              A service fee is charged on each payment earned through the
              platform. Upwork uses a variable model ranging from 0% to 15% per
              contract, and Catalance similarly uses contract-based fee logic.
            </p>
            <p>
              The applicable fee is shown before a job is accepted and remains
              fixed for that contract&apos;s duration. If a payment is refunded
              to a client, Catalance refunds the corresponding freelancer
              service fee for that transaction.
            </p>
          </Section>

          <Section title="For clients">
            <p>
              Clients pay a marketplace or transaction fee on payments made
              through Catalance. Fees are disclosed at checkout and may vary
              based on transaction size, payment method, and contract setup.
            </p>
            <p>
              Catalance also charges a one-time contract initiation fee per
              contract. Once payment is completed, this initiation fee is
              non-refundable because it covers onboarding, platform operations,
              and dispute-support services.
            </p>
          </Section>

          <Section title="Other costs">
            <p>
              Currency conversion fees may apply when paying in currencies
              other than INR. Clients and freelancers are responsible for
              applicable taxes, and GST or VAT may be added where required by
              law.
            </p>
          </Section>

          <Section title="Fee transparency and updates">
            <p>
              Catalance may update fees from time to time. Any new fee schedule
              is published in-product and shown before a transaction is
              confirmed. Continued use after an update means the revised fees
              apply to future transactions.
            </p>
          </Section>
        </div>
      </div>
    </main>
  );
};

export default FeesPricing;
