import { Badge } from "@/components/ui/badge";
import Wallet from "lucide-react/dist/esm/icons/wallet";

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

const RefundPolicy = () => {
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
            <Wallet className="mr-2 h-3.5 w-3.5" />
            Legal
          </Badge>
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-6xl">
            Refund Policy and Fees &amp; Pricing
          </h1>
          <p className="text-gray-600 dark:text-neutral-400">
            Last updated: February 23, 2026
          </p>
        </div>

        <div className="prose max-w-none prose-slate dark:prose-invert">
          <Section title="Introduction">
            <p>
              Catalance aims for satisfaction but recognizes that refunds may be
              necessary.
            </p>
          </Section>

          <Section title="Eligibility and time frame">
            <p>
              Clients may request a refund within 180 days of payment. Refunds
              may apply to fixed-price milestone payments or unused escrow
              funds.
            </p>
            <p>
              Refunds for hourly contracts are at the freelancer&apos;s
              discretion. Depending on contract terms and work status, a
              freelancer may issue a full, partial, or no refund.
            </p>
          </Section>

          <Section title="Refund process">
            <ol className="list-decimal space-y-3 pl-6">
              <li>
                <strong>Initiate request:</strong> The client selects
                &nbsp;&quot;Request Refund&quot;&nbsp;and provides a reason.
              </li>
              <li>
                <strong>Freelancer response:</strong> The freelancer may approve
                or decline. If approved, the refunded amount is credited back
                to the client&apos;s original payment method, typically within
                three to five business days.
              </li>
              <li>
                <strong>Dispute or mediation:</strong> If the freelancer
                declines, the client may open a dispute. Catalance offers
                mediation for eligible fixed-price contracts.
              </li>
            </ol>
          </Section>

          <Section title="Refund of fees">
            <p>
              If a client receives a refund, Catalance will refund the
              corresponding freelancer service fee.
            </p>
            <p>
              Contract initiation fees and processing charges are
              non-refundable after payment.
            </p>
          </Section>

          <Section title="Refund to payment method or credit balance">
            <p>
              Funds are returned to the original payment method when possible.
              In some cases, funds may be added as account credit based on
              payment partner constraints and account settings.
            </p>
            <p>
              Catalance allows clients to choose either Catalance credit or a
              refund to the original payment method. Refunds cannot be sent to
              a different payment method.
            </p>
          </Section>

          <Section title="Fees and Pricing">
            <p>
              Catalance&apos;s fee structure covers payment processing, fraud
              prevention, and platform development.
            </p>
          </Section>

          <Section title="For freelancers">
            <p>
              A service fee is charged on each payment earned. The applicable
              fee is variable by contract.
            </p>
            <p>
              Catalance will display the applicable fee before a job is
              accepted and fix it for the contract&apos;s duration. If a payment
              is refunded to a client, Catalance will refund the corresponding
              service fee.
            </p>
          </Section>

          <Section title="For clients">
            <p>
              Clients pay a marketplace or transaction fee on each payment.
              Catalance may also charge a one-time contract initiation fee.
            </p>
            <p>
              Catalance&apos;s fee is disclosed at checkout and may vary by
              transaction size and payment method. Catalance charges a one-time
              contract initiation fee that is non-refundable once payment is
              made. This covers onboarding and dispute services.
            </p>
          </Section>

          <Section title="Other costs">
            <p>
              Currency conversion fees may apply when paying in currencies
              other than INR.
            </p>
            <p>
              Clients and freelancers are responsible for applicable taxes. GST
              or VAT may be added where required by law.
            </p>
          </Section>
        </div>
      </div>
    </main>
  );
};

export default RefundPolicy;
