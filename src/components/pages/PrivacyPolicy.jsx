import { useRef, useEffect, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { Badge } from "@/components/ui/badge";
import { Spotlight } from "@/components/ui/spotlight";
import Shield from "lucide-react/dist/esm/icons/shield";
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

const PrivacyPolicy = () => {
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
            <Shield className="w-3.5 h-3.5 mr-2" />
            Privacy
          </Badge>
          <h1
            ref={heroTextRef}
            className="text-4xl md:text-6xl font-bold tracking-tight mb-4"
          >
            Privacy Policy
          </h1>
          <p className={mutedTextColor}>Effective Date: 14-Jan-2026</p>
        </div>

        {/* Introduction */}
        <div
          className={`mb-12 p-6 rounded-2xl ${isDark ? "bg-white/5 border border-white/10" : "bg-gray-50 border border-gray-200"}`}
        >
          <p
            className={`text-lg leading-relaxed ${isDark ? "text-neutral-300" : "text-gray-700"}`}
          >
            At Catalance, your privacy matters. This policy explains how we
            collect, use, and protect your information.
          </p>
        </div>

        {/* Content */}
        <div className={`prose max-w-none ${isDark ? "prose-invert" : ""}`}>
          <Section title="1. Information We Collect" isDark={isDark}>
            <p className="font-semibold">a) Personal Information</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Payment details</li>
              <li>Profile information</li>
            </ul>
            <p className="font-semibold mt-4">b) Usage Information</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>IP address</li>
              <li>Browser type</li>
              <li>Pages visited</li>
              <li>Device information</li>
            </ul>
          </Section>

          <Section title="2. How We Use Your Information" isDark={isDark}>
            <p>We use your data to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Create and manage accounts</li>
              <li>Facilitate projects and payments</li>
              <li>Improve platform experience</li>
              <li>Send updates and notifications</li>
              <li>Provide customer support</li>
            </ul>
          </Section>

          <Section title="3. Data Sharing" isDark={isDark}>
            <p className="font-semibold text-primary">
              Catalance does not sell your data.
            </p>
            <p className="mt-4">We may share information with:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Payment processors</li>
              <li>Legal authorities (if required by law)</li>
              <li>Technology partners for platform operations</li>
            </ul>
          </Section>

          <Section title="4. Cookies" isDark={isDark}>
            <p>We use cookies to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Enhance user experience</li>
              <li>Analyze site traffic</li>
              <li>Remember preferences</li>
            </ul>
            <p className="mt-4">
              You can disable cookies in your browser settings.
            </p>
          </Section>

          <Section title="5. Data Security" isDark={isDark}>
            <p>
              We implement industry-standard security measures to protect your
              data.
            </p>
            <p className="mt-2">
              However, no system is 100% secure, and we cannot guarantee
              absolute protection.
            </p>
          </Section>

          <Section title="6. User Rights" isDark={isDark}>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Access your data</li>
              <li>Update your information</li>
              <li>Request deletion of your account</li>
              <li>Opt out of marketing communications</li>
            </ul>
          </Section>

          <Section title="7. Data Retention" isDark={isDark}>
            <p>We retain personal information only as long as necessary to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Provide services</li>
              <li>Meet legal obligations</li>
              <li>Resolve disputes</li>
            </ul>
          </Section>

          <Section title="8. Third-Party Links" isDark={isDark}>
            <p>
              Catalance is not responsible for the privacy practices of external
              websites linked on our platform.
            </p>
          </Section>

          <Section title="9. Children's Privacy" isDark={isDark}>
            <p>
              Catalance does not knowingly collect data from users under 18.
            </p>
          </Section>

          <Section title="10. Policy Updates" isDark={isDark}>
            <p>
              We may update this Privacy Policy from time to time. Changes will
              be posted on this page.
            </p>
          </Section>

          <Section title="11. Contact Us" isDark={isDark}>
            <p>
              For privacy concerns, contact:{" "}
              <a
                href="mailto:support@catalance.in"
                className="text-primary hover:underline"
              >
                support@catalance.in
              </a>
            </p>
          </Section>
        </div>
      </div>
    </main>
  );
};

export default PrivacyPolicy;
