import React from "react";

const TermsConditions = () => {
  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-24 px-6 md:px-12">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-primary to-primary/60">
            Terms & Conditions
          </h1>
          <p className="text-white/60 text-lg">Effective Date: 14-Jan-2026</p>
        </div>

        {/* Introduction */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
          <p className="text-white/80 leading-relaxed">
            Welcome to Catalance. By accessing or using our website and
            services, you agree to comply with and be bound by the following
            Terms & Conditions. If you do not agree, please do not use our
            platform.
          </p>
        </div>

        {/* Terms List */}
        <div className="space-y-8">
          {/* 1. About Catalance */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-primary">
              1. About Catalance
            </h2>
            <div className="pl-4 border-l-2 border-white/10 space-y-2">
              <p className="text-white/80 leading-relaxed">
                Catalance is a digital marketplace that connects clients with
                freelancers across various professional services including
                development, marketing, design, automation, and content
                creation.
              </p>
            </div>
          </section>

          {/* 2. User Eligibility */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-primary">
              2. User Eligibility
            </h2>
            <div className="pl-4 border-l-2 border-white/10 space-y-2">
              <p className="text-white/80 leading-relaxed">
                You must be at least 18 years old to use Catalance. By using our
                services, you confirm that you are legally capable of entering
                into a binding contract.
              </p>
            </div>
          </section>

          {/* 3. Account Responsibility */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-primary">
              3. Account Responsibility
            </h2>
            <div className="pl-4 border-l-2 border-white/10 space-y-2">
              <p className="text-white/80 leading-relaxed">
                You are responsible for:
              </p>
              <ul className="list-disc pl-6 text-white/80 space-y-1">
                <li>Maintaining the confidentiality of your account</li>
                <li>All activities that occur under your account</li>
                <li>Providing accurate and up-to-date information</li>
              </ul>
              <p className="text-white/80 leading-relaxed mt-2">
                Catalance is not liable for losses caused by unauthorized
                account use.
              </p>
            </div>
          </section>

          {/* 4. Platform Role */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-primary">
              4. Platform Role
            </h2>
            <div className="pl-4 border-l-2 border-white/10 space-y-2">
              <p className="text-white/80 leading-relaxed">
                Catalance acts as a facilitator between clients and freelancers.
              </p>
              <p className="text-white/80 leading-relaxed">
                We are not a party to contracts formed between users and do not
                guarantee project outcomes.
              </p>
            </div>
          </section>

          {/* 5. Payments & Fees */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-primary">
              5. Payments & Fees
            </h2>
            <div className="pl-4 border-l-2 border-white/10 space-y-2">
              <ul className="list-disc pl-6 text-white/80 space-y-1">
                <li>
                  All payments are processed through Catalance's approved
                  methods.
                </li>
                <li>
                  Service fees may apply and are disclosed before confirmation.
                </li>
                <li>
                  Refunds are subject to project terms and dispute resolution
                  policies.
                </li>
              </ul>
            </div>
          </section>

          {/* 6. Project Scope & Revisions */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-primary">
              6. Project Scope & Revisions
            </h2>
            <div className="pl-4 border-l-2 border-white/10 space-y-2">
              <ul className="list-disc pl-6 text-white/80 space-y-1">
                <li>Work begins only after scope is finalized and approved.</li>
                <li>
                  Any change in scope may result in revised pricing and
                  timelines.
                </li>
                <li>
                  Catalance is not responsible for scope disputes between users.
                </li>
              </ul>
            </div>
          </section>

          {/* 7. Prohibited Activities */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-primary">
              7. Prohibited Activities
            </h2>
            <div className="pl-4 border-l-2 border-white/10 space-y-2">
              <p className="text-white/80 leading-relaxed">Users must not:</p>
              <ul className="list-disc pl-6 text-white/80 space-y-1">
                <li>Share false or misleading information</li>
                <li>Violate intellectual property rights</li>
                <li>Use the platform for unlawful purposes</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Attempt to bypass platform systems</li>
              </ul>
              <p className="text-amber-400 font-medium mt-2">
                Violation may lead to account suspension or termination.
              </p>
            </div>
          </section>

          {/* 8. Intellectual Property */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-primary">
              8. Intellectual Property
            </h2>
            <div className="pl-4 border-l-2 border-white/10 space-y-2">
              <ul className="list-disc pl-6 text-white/80 space-y-1">
                <li>
                  All website content, branding, and technology belong to
                  Catalance.
                </li>
                <li>
                  Users retain ownership of their project deliverables unless
                  otherwise agreed between parties.
                </li>
              </ul>
            </div>
          </section>

          {/* 9. Account Termination */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-primary">
              9. Account Termination
            </h2>
            <div className="pl-4 border-l-2 border-white/10 space-y-2">
              <p className="text-white/80 leading-relaxed">
                Catalance reserves the right to suspend or terminate accounts
                for:
              </p>
              <ul className="list-disc pl-6 text-white/80 space-y-1">
                <li>Policy violations</li>
                <li>Fraudulent behavior</li>
                <li>Abuse of the platform</li>
              </ul>
            </div>
          </section>

          {/* 10. Limitation of Liability */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-primary">
              10. Limitation of Liability
            </h2>
            <div className="pl-4 border-l-2 border-white/10 space-y-2">
              <p className="text-white/80 leading-relaxed">
                Catalance is not liable for:
              </p>
              <ul className="list-disc pl-6 text-white/80 space-y-1">
                <li>Loss of profits</li>
                <li>Project failures</li>
                <li>Communication issues between users</li>
                <li>Indirect or consequential damages</li>
              </ul>
            </div>
          </section>

          {/* 11. Governing Law */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-primary">
              11. Governing Law
            </h2>
            <div className="pl-4 border-l-2 border-white/10 space-y-2">
              <p className="text-white/80 leading-relaxed">
                These Terms are governed by the laws of India.
              </p>
            </div>
          </section>

          {/* 12. Updates to Terms */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-primary">
              12. Updates to Terms
            </h2>
            <div className="pl-4 border-l-2 border-white/10 space-y-2">
              <p className="text-white/80 leading-relaxed">
                Catalance may update these Terms at any time. Continued use
                means acceptance of revised terms.
              </p>
            </div>
          </section>

          {/* 13. Contact */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-primary">
              13. Contact
            </h2>
            <div className="pl-4 border-l-2 border-white/10 space-y-2">
              <p className="text-white/80 leading-relaxed">
                For questions, contact:{" "}
                <a
                  href="mailto:support@catalance.in"
                  className="text-primary hover:underline"
                >
                  support@catalance.in
                </a>
              </p>
            </div>
          </section>
        </div>

        {/* Footer Note */}
        <div className="text-center pt-8 border-t border-white/10">
          <p className="text-white/40 text-sm">
            © {new Date().getFullYear()} Catalance. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;
