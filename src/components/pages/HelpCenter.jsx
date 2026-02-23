import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spotlight } from "@/components/ui/spotlight";
import { Input } from "@/components/ui/input";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import Search from "lucide-react/dist/esm/icons/search";
import HelpCircle from "lucide-react/dist/esm/icons/help-circle";
import BookOpen from "lucide-react/dist/esm/icons/book-open";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import Shield from "lucide-react/dist/esm/icons/shield";
import Users from "lucide-react/dist/esm/icons/users";
import Settings from "lucide-react/dist/esm/icons/settings";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle";
import FileText from "lucide-react/dist/esm/icons/file-text";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";

gsap.registerPlugin(SplitText, useGSAP);

const CategoryCard = ({ icon: Icon, title, description, articles, isDark }) => (
  <Link to="#" className="block group">
    <div
      className={`p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 h-full ${
        isDark
          ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-primary/30"
          : "bg-white border-black/5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
      }`}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors duration-300 ${
          isDark
            ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-black"
            : "bg-primary/10 text-primary-700 group-hover:bg-primary group-hover:text-white"
        }`}
      >
        <Icon className="w-6 h-6" />
      </div>
      <h3
        className={`text-lg font-bold mb-2 group-hover:text-primary transition-colors ${isDark ? "text-white" : "text-gray-900"}`}
      >
        {title}
      </h3>
      <p
        className={`text-sm mb-3 ${isDark ? "text-neutral-400" : "text-gray-600"}`}
      >
        {description}
      </p>
      <span
        className={`text-sm font-medium ${isDark ? "text-neutral-500" : "text-gray-500"}`}
      >
        {articles} articles
      </span>
    </div>
  </Link>
);

const ArticleLink = ({ title, isDark }) => (
  <Link
    to="#"
    className={`flex items-center justify-between p-4 rounded-xl border transition-all hover:border-primary/30 group ${
      isDark
        ? "bg-white/5 border-white/10 hover:bg-white/10"
        : "bg-white border-black/5 hover:shadow-md"
    }`}
  >
    <span
      className={`group-hover:text-primary transition-colors ${isDark ? "text-white" : "text-gray-900"}`}
    >
      {title}
    </span>
    <ChevronRight
      className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${isDark ? "text-neutral-400" : "text-gray-400"}`}
    />
  </Link>
);

const HelpCenter = () => {
  const containerRef = useRef(null);
  const heroTextRef = useRef(null);
  const heroGradientRef = useRef(null);
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

  const categories = [
    {
      icon: BookOpen,
      title: "Getting Started",
      description: "New to Catalance? Start here.",
      articles: 12,
    },
    {
      icon: Users,
      title: "Account & Profile",
      description: "Manage your account settings.",
      articles: 18,
    },
    {
      icon: CreditCard,
      title: "Payments & Billing",
      description: "Invoices, payouts, and taxes.",
      articles: 24,
    },
    {
      icon: FileText,
      title: "Projects & Contracts",
      description: "Managing your work on the platform.",
      articles: 15,
    },
    {
      icon: Shield,
      title: "Trust & Safety",
      description: "Security, disputes, and protection.",
      articles: 10,
    },
    {
      icon: Settings,
      title: "Technical Support",
      description: "Troubleshooting and FAQs.",
      articles: 22,
    },
  ];

  const popularArticles = [
    "How to create a compelling freelancer profile",
    "Understanding platform fees and payment schedules",
    "How to submit a proposal that wins",
    "Setting up two-factor authentication",
    "What to do if a client doesn't pay",
    "How to request a refund or dispute",
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

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-20">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 backdrop-blur-md px-4 py-1.5">
            <HelpCircle className="w-3.5 h-3.5 mr-2" />
            Help Center
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
            <span ref={heroTextRef} className="inline-block">
              How can we{" "}
            </span>{" "}
            <span
              ref={heroGradientRef}
              className={`inline-block bg-clip-text text-transparent bg-linear-to-r ${isDark ? "from-primary via-yellow-200 to-primary" : "from-primary via-orange-400 to-primary"}`}
            >
              help you?
            </span>
          </h1>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div
              className={`flex items-center gap-2 p-2 rounded-2xl border ${isDark ? "bg-white/5 border-white/10" : "bg-white border-black/10 shadow-lg"}`}
            >
              <div className="flex-1 flex items-center gap-3 px-4">
                <Search
                  className={`w-5 h-5 ${isDark ? "text-neutral-400" : "text-gray-400"}`}
                />
                <Input
                  type="text"
                  placeholder="Search for help articles..."
                  className="border-0 bg-transparent focus-visible:ring-0 text-lg"
                />
              </div>
              <Button size="lg" className="rounded-xl px-6">
                Search
              </Button>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold mb-8 text-center">
            Browse by Category
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat, idx) => (
              <CategoryCard key={idx} {...cat} isDark={isDark} />
            ))}
          </div>
        </div>

        {/* Popular Articles */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold mb-8 text-center">
            Popular Articles
          </h2>
          <div className="max-w-3xl mx-auto space-y-3">
            {popularArticles.map((article, idx) => (
              <ArticleLink key={idx} title={article} isDark={isDark} />
            ))}
          </div>
        </div>

        {/* Contact Support CTA */}
        <div
          className={`rounded-3xl p-12 text-center ${isDark ? "bg-white/5" : "bg-primary/5"}`}
        >
          <MessageCircle
            className={`w-12 h-12 mx-auto mb-4 ${isDark ? "text-primary" : "text-primary"}`}
          />
          <h2 className="text-3xl font-bold mb-4">Still need help?</h2>
          <p className={`${mutedTextColor} mb-8 max-w-xl mx-auto`}>
            Can&apos;t find what you&apos;re looking for? Our support team is here to
            help.
          </p>
          <Link to="/contact-us">
            <Button size="lg" className="rounded-full px-8">
              Contact Support <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
};

export default HelpCenter;
