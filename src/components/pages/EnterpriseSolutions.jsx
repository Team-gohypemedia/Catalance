import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spotlight } from "@/components/ui/spotlight";
import { Card, CardContent } from "@/components/ui/card";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import Building2 from "lucide-react/dist/esm/icons/building-2";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import Users from "lucide-react/dist/esm/icons/users";
import Zap from "lucide-react/dist/esm/icons/zap";
import Lock from "lucide-react/dist/esm/icons/lock";
import BarChart3 from "lucide-react/dist/esm/icons/bar-chart-3";
import Headphones from "lucide-react/dist/esm/icons/headphones";
import Globe from "lucide-react/dist/esm/icons/globe";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import { useTheme } from "@/components/providers/theme-provider";

gsap.registerPlugin(SplitText, useGSAP);

const FeatureCard = ({ icon: Icon, title, description, isDark }) => (
  <div
    className={`group p-8 rounded-3xl border transition-all duration-300 hover:-translate-y-1 ${
      isDark
        ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-primary/30"
        : "bg-white border-black/5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
    }`}
  >
    <div
      className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300 ${
        isDark
          ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-black"
          : "bg-primary/10 text-primary-700 group-hover:bg-primary group-hover:text-white"
      }`}
    >
      <Icon className="w-7 h-7" />
    </div>
    <h3
      className={`text-xl font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}
    >
      {title}
    </h3>
    <p
      className={`leading-relaxed ${isDark ? "text-neutral-400" : "text-gray-600"}`}
    >
      {description}
    </p>
  </div>
);

const EnterpriseSolutions = () => {
  const containerRef = useRef(null);
  const heroTextRef = useRef(null);
  const heroGradientRef = useRef(null);
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
      gsap.set(heroGradientRef.current, { autoAlpha: 0, y: 30, scale: 0.95 });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.to(childSplit.chars, {
        autoAlpha: 1,
        y: 0,
        rotateX: 0,
        stagger: 0.02,
        duration: 1,
      }).to(
        heroGradientRef.current,
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
        },
        "-=0.6",
      );
    },
    { scope: containerRef },
  );

  const features = [
    {
      icon: Users,
      title: "Dedicated Talent Teams",
      description:
        "Build custom teams of vetted professionals who work exclusively on your projects.",
    },
    {
      icon: ShieldCheck,
      title: "Enterprise Security",
      description:
        "SOC 2 certified with SSO, role-based access, and comprehensive audit logs.",
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description:
        "Real-time dashboards to track project progress, spending, and team performance.",
    },
    {
      icon: Lock,
      title: "IP Protection",
      description:
        "Built-in NDA workflows and secure file sharing with enterprise-grade encryption.",
    },
    {
      icon: Headphones,
      title: "Priority Support",
      description:
        "Dedicated account manager and 24/7 priority support for your organization.",
    },
    {
      icon: Globe,
      title: "Global Compliance",
      description:
        "Automated tax documentation and compliance across 120+ countries.",
    },
  ];

  const trustedBy = [
    "Fortune 500 Companies",
    "Fast-Growing Startups",
    "Government Agencies",
    "Leading Universities",
  ];

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
      <Spotlight
        className="top-40 right-0 md:right-40 opacity-30"
        fill={isDark ? "#3b82f6" : "#60a5fa"}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-20">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-20">
          <Badge className="mb-6 bg-blue-500/10 text-blue-500 border-blue-500/20 backdrop-blur-md px-4 py-1.5">
            <Building2 className="w-3.5 h-3.5 mr-2" />
            Enterprise Solutions
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
            <span ref={heroTextRef} className="inline-block">
              Scale your workforce{" "}
            </span>{" "}
            <span
              ref={heroGradientRef}
              className={`inline-block bg-clip-text text-transparent bg-linear-to-r ${isDark ? "from-primary via-yellow-200 to-primary" : "from-primary via-orange-400 to-primary"}`}
            >
              without limits.
            </span>
          </h1>
          <p
            className={`text-lg md:text-xl ${mutedTextColor} max-w-2xl mx-auto leading-relaxed mb-10`}
          >
            Streamline your entire freelance workforce with enterprise-grade
            tools, security, and support designed for organizations at scale.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full">
                Schedule a Demo <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button
                size="lg"
                variant="outline"
                className={`h-14 px-8 text-lg rounded-full ${isDark ? "border-white/20" : "border-black/10"}`}
              >
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>

        {/* Trusted By */}
        <div className="mb-20">
          <p
            className={`text-center text-sm font-medium mb-6 ${mutedTextColor}`}
          >
            TRUSTED BY INDUSTRY LEADERS
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            {trustedBy.map((company, idx) => (
              <div
                key={idx}
                className={`px-6 py-3 rounded-full border ${isDark ? "bg-white/5 border-white/10" : "bg-gray-100 border-black/5"}`}
              >
                <span
                  className={`font-medium ${isDark ? "text-neutral-300" : "text-gray-700"}`}
                >
                  {company}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-20">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Zap className="w-3.5 h-3.5 mr-2" />
              Features
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Everything you need at scale.
            </h2>
            <p className={`${mutedTextColor} max-w-2xl mx-auto`}>
              Purpose-built for enterprise teams managing distributed
              workforces.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <FeatureCard key={idx} {...feature} isDark={isDark} />
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                Why Enterprise?
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Built for the way modern enterprises work.
              </h2>
              <ul className="space-y-4">
                {[
                  "Reduce time-to-hire by 70%",
                  "Cut operational costs by 40%",
                  "Access vetted talent in 24 hours",
                  "Integrated invoicing & payments",
                  "Customizable workflows",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span
                      className={isDark ? "text-neutral-200" : "text-gray-700"}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div
                className={`absolute -inset-4 rounded-3xl bg-linear-to-r from-primary to-blue-600 ${isDark ? "opacity-20" : "opacity-10"} blur-2xl`}
              />
              <img
                src="https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&q=80&w=800"
                alt="Enterprise dashboard"
                className="relative rounded-3xl w-full object-cover shadow-2xl"
              />
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative rounded-[2.5rem] overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-r from-primary/20 to-blue-500/20" />
          <div
            className={`absolute inset-0 bg-linear-to-r ${isDark ? "from-black/80 via-black/50 to-transparent" : "from-white/80 via-white/50 to-transparent"} z-10`}
          />
          <div className="relative z-20 p-12 md:p-24 text-center max-w-3xl mx-auto">
            <h2
              className={`text-4xl md:text-5xl font-bold mb-6 ${isDark ? "text-white" : "text-black"}`}
            >
              Transform your talent strategy today.
            </h2>
            <p
              className={`text-xl mb-10 ${isDark ? "text-neutral-300" : "text-gray-700"}`}
            >
              Join leading enterprises that trust Catalance to power their
              workforce.
            </p>
            <Link to="/contact">
              <Button
                size="lg"
                className="h-14 px-10 text-lg rounded-full bg-primary text-black hover:bg-primary/90 shadow-[0_0_20px_rgba(253,200,0,0.3)]"
              >
                Get Started <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default EnterpriseSolutions;
