import { useRef, useEffect, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { Badge } from "@/components/ui/badge";
import { Spotlight } from "@/components/ui/spotlight";
import FileText from "lucide-react/dist/esm/icons/file-text";
import { useTheme } from "@/components/providers/theme-provider";

gsap.registerPlugin(SplitText, useGSAP);

const Section = ({ title, children, isDark }) => (
  <div className="mb-10">
    <h2
      className={`text-2xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}
    >
      {title}
    </h2>
    <div
      className={`space-y-4 leading-relaxed ${isDark ? "text-neutral-300" : "text-gray-700"}`}
    >
      {children}
    </div>
  </div>
);

const TermsOfService = () => {
  const containerRef = useRef(null);
  const heroTextRef = useRef(null);
  const { theme } = useTheme();
  const [resolvedTheme, setResolvedTheme] = useState("dark");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = window.document.documentElement;
    const checkTheme = () =>
      setResolvedTheme(root.classList.contains("dark") ? "dark" : "light");
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const isDark = resolvedTheme === "dark";
  const bgColor = isDark ? "bg-black" : "bg-white";
  const textColor = isDark ? "text-white" : "text-gray-900";
  const mutedTextColor = isDark ? "text-neutral-400" : "text-gray-600";
  const gridColor = isDark
    ? "rgba(255, 255, 255, 0.05)"
    : "rgba(0, 0, 0, 0.05)";

  useGSAP(
    () => {
      if (!heroTextRef.current) return;

      const childSplit = new SplitText(heroTextRef.current, {
        type: "words,chars",
      });

      gsap.set(childSplit.chars, { autoAlpha: 0, y: 50, rotateX: -90 });
      gsap.to(childSplit.chars, {
        autoAlpha: 1,
        y: 0,
        rotateX: 0,
        stagger: 0.02,
        duration: 1,
        ease: "power3.out",
      });
    },
    { scope: containerRef },
  );

  return (
    <main
      ref={containerRef}
      className={`relative min-h-screen w-full ${bgColor} ${textColor} overflow-hidden font-sans selection:bg-primary/30`}
    >
      {/* Background Grid */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, ${gridColor} 1px, transparent 1px),
            linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20 opacity-50"
        fill={isDark ? "#fdc800" : "#f59e0b"}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-20 pb-20">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 backdrop-blur-md px-4 py-1.5">
            <FileText className="w-3.5 h-3.5 mr-2" />
            Legal
          </Badge>
          <h1
            ref={heroTextRef}
            className="text-4xl md:text-6xl font-bold tracking-tight mb-4"
          >
            Terms of Service
          </h1>
          <p className={mutedTextColor}>Last updated: February 7, 2026</p>
        </div>

        {/* Content */}
        <div className={`prose max-w-none ${isDark ? "prose-invert" : ""}`}>
          <Section title="1. Agreement to Terms" isDark={isDark}>
            <p>
              By accessing or using Catalance ("Platform"), you agree to be
              bound by these Terms of Service and all applicable laws and
              regulations. If you do not agree with any of these terms, you are
              prohibited from using or accessing this Platform.
            </p>
          </Section>

          <Section title="2. Use License" isDark={isDark}>
            <p>
              Permission is granted to temporarily access the Platform for
              personal, non-commercial transitory viewing only. This is the
              grant of a license, not a transfer of title, and under this
              license you may not:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose</li>
              <li>
                Attempt to decompile or reverse engineer any software contained
                on the Platform
              </li>
              <li>
                Remove any copyright or other proprietary notations from the
                materials
              </li>
              <li>
                Transfer the materials to another person or "mirror" the
                materials on any other server
              </li>
            </ul>
          </Section>

          <Section title="3. User Accounts" isDark={isDark}>
            <p>
              When you create an account with us, you must provide accurate,
              complete, and current information at all times. Failure to do so
              constitutes a breach of the Terms, which may result in immediate
              termination of your account on our Platform.
            </p>
            <p className="mt-4">
              You are responsible for safeguarding the password that you use to
              access the Platform and for any activities or actions under your
              password.
            </p>
          </Section>

          <Section title="4. Freelancer and Client Obligations" isDark={isDark}>
            <p>
              <strong>For Freelancers:</strong> You agree to provide services as
              described in your proposals, deliver work on time, and maintain
              professional communication with clients.
            </p>
            <p className="mt-4">
              <strong>For Clients:</strong> You agree to provide clear project
              requirements, make timely payments for completed work, and respect
              the intellectual property rights of freelancers.
            </p>
          </Section>

          <Section title="5. Payments and Fees" isDark={isDark}>
            <p>
              Catalance charges a service fee on all completed projects. Fee
              schedules are available on our pricing page and may be updated
              from time to time. All payments are processed securely through our
              payment partners.
            </p>
          </Section>

          <Section title="6. Intellectual Property" isDark={isDark}>
            <p>
              Upon full payment, intellectual property rights for completed work
              transfer from the freelancer to the client, unless otherwise
              agreed in writing. Freelancers may retain rights to display work
              in portfolios unless explicitly restricted by the client.
            </p>
          </Section>

          <Section title="7. Dispute Resolution" isDark={isDark}>
            <p>
              In the event of a dispute between users, Catalance offers a
              mediation service. If mediation fails, disputes will be resolved
              through binding arbitration in accordance with the rules of the
              relevant arbitration authority.
            </p>
          </Section>

          <Section title="8. Limitation of Liability" isDark={isDark}>
            <p>
              In no event shall Catalance or its suppliers be liable for any
              damages arising out of the use or inability to use the Platform,
              even if Catalance has been notified of the possibility of such
              damages.
            </p>
          </Section>

          <Section title="9. Changes to Terms" isDark={isDark}>
            <p>
              We reserve the right to modify these terms at any time. We will
              notify users of significant changes by email or through the
              Platform. Continued use of the Platform after changes constitutes
              acceptance of the new terms.
            </p>
          </Section>

          <Section title="10. Contact Us" isDark={isDark}>
            <p>
              If you have any questions about these Terms of Service, please
              contact us at{" "}
              <a
                href="mailto:legal@catalance.com"
                className="text-primary hover:underline"
              >
                legal@catalance.com
              </a>
            </p>
          </Section>
        </div>
      </div>
    </main>
  );
};

export default TermsOfService;
