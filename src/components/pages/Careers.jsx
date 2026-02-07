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
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Users from "lucide-react/dist/esm/icons/users";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Clock from "lucide-react/dist/esm/icons/clock";
import Heart from "lucide-react/dist/esm/icons/heart";
import Zap from "lucide-react/dist/esm/icons/zap";
import Coffee from "lucide-react/dist/esm/icons/coffee";
import Wallet from "lucide-react/dist/esm/icons/wallet";
import GraduationCap from "lucide-react/dist/esm/icons/graduation-cap";
import Globe from "lucide-react/dist/esm/icons/globe";
import Laptop from "lucide-react/dist/esm/icons/laptop";
import Plane from "lucide-react/dist/esm/icons/plane";
import { useTheme } from "@/components/providers/theme-provider";

gsap.registerPlugin(SplitText, useGSAP);

const BenefitCard = ({ icon: Icon, title, description, isDark }) => (
  <div
    className={`group relative p-6 rounded-2xl backdrop-blur-md border transition-all duration-300 hover:-translate-y-1 ${
      isDark
        ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-primary/30"
        : "bg-white/60 border-black/5 hover:bg-white hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
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
      className={`text-lg font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}
    >
      {title}
    </h3>
    <p
      className={`text-sm leading-relaxed ${isDark ? "text-neutral-400" : "text-gray-600"}`}
    >
      {description}
    </p>
  </div>
);

const JobCard = ({ title, department, location, type, isDark }) => (
  <Link to="/contact" className="block group">
    <div
      className={`p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${
        isDark
          ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-primary/30"
          : "bg-white border-black/5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3
            className={`text-xl font-bold mb-2 group-hover:text-primary transition-colors ${isDark ? "text-white" : "text-gray-900"}`}
          >
            {title}
          </h3>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Badge
              variant="secondary"
              className={`${isDark ? "bg-primary/10 text-primary border-primary/20" : "bg-primary/10 text-primary-700"}`}
            >
              {department}
            </Badge>
            <span
              className={`flex items-center gap-1 ${isDark ? "text-neutral-400" : "text-gray-600"}`}
            >
              <MapPin className="w-3.5 h-3.5" /> {location}
            </span>
            <span
              className={`flex items-center gap-1 ${isDark ? "text-neutral-400" : "text-gray-600"}`}
            >
              <Clock className="w-3.5 h-3.5" /> {type}
            </span>
          </div>
        </div>
        <div>
          <Button
            variant="ghost"
            className={`group-hover:bg-primary group-hover:text-black transition-all ${isDark ? "text-white" : "text-gray-900"}`}
          >
            Apply Now{" "}
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </div>
  </Link>
);

const Careers = () => {
  const containerRef = useRef(null);
  const heroTextRef = useRef(null);
  const heroGradientRef = useRef(null);
  const heroDescRef = useRef(null);
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
      gsap.set(heroDescRef.current, { autoAlpha: 0, y: 20 });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.to(childSplit.chars, {
        autoAlpha: 1,
        y: 0,
        rotateX: 0,
        stagger: 0.02,
        duration: 1,
      })
        .to(
          heroGradientRef.current,
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
          },
          "-=0.6",
        )
        .to(
          heroDescRef.current,
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
          },
          "-=0.4",
        );
    },
    { scope: containerRef },
  );

  const benefits = [
    {
      icon: Wallet,
      title: "Competitive Salary",
      description:
        "Industry-leading compensation packages with equity options for all team members.",
    },
    {
      icon: Heart,
      title: "Health & Wellness",
      description:
        "Comprehensive health, dental, and vision insurance for you and your family.",
    },
    {
      icon: Laptop,
      title: "Remote First",
      description:
        "Work from anywhere in the world. We believe great talent isn't bound by geography.",
    },
    {
      icon: GraduationCap,
      title: "Learning Budget",
      description:
        "Annual learning stipend for courses, conferences, and professional development.",
    },
    {
      icon: Plane,
      title: "Unlimited PTO",
      description:
        "Take the time you need. We trust you to manage your work-life balance.",
    },
    {
      icon: Coffee,
      title: "Team Retreats",
      description:
        "Quarterly team retreats to connect, collaborate, and celebrate together.",
    },
  ];

  const openPositions = [
    {
      title: "Senior Full-Stack Engineer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
    },
    {
      title: "Product Designer",
      department: "Design",
      location: "Remote",
      type: "Full-time",
    },
    {
      title: "Growth Marketing Manager",
      department: "Marketing",
      location: "Remote",
      type: "Full-time",
    },
    {
      title: "Customer Success Lead",
      department: "Operations",
      location: "Remote",
      type: "Full-time",
    },
    {
      title: "DevOps Engineer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
    },
    {
      title: "Content Strategist",
      department: "Marketing",
      location: "Remote",
      type: "Contract",
    },
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

      {/* Spotlights */}
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
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 backdrop-blur-md px-4 py-1.5 hover:bg-primary/20 transition-colors">
            <Sparkles className="w-3.5 h-3.5 mr-2" />
            We're Hiring
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
            <span ref={heroTextRef} className="inline-block">
              Build the future of{" "}
            </span>{" "}
            <span
              ref={heroGradientRef}
              className={`inline-block bg-clip-text text-transparent bg-gradient-to-r ${isDark ? "from-primary via-yellow-200 to-primary" : "from-primary via-orange-400 to-primary"}`}
            >
              work with us.
            </span>
          </h1>
          <p
            ref={heroDescRef}
            className={`text-lg md:text-xl ${mutedTextColor} max-w-2xl mx-auto leading-relaxed`}
          >
            Join a team of passionate individuals who are reshaping how
            businesses connect with independent talent worldwide.
          </p>
        </div>

        {/* Culture Section */}
        <div className="mb-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-blue-500/10 text-blue-500 border-blue-500/20">
                <Users className="w-3.5 h-3.5 mr-2" />
                Our Culture
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Where ambition meets opportunity.
              </h2>
              <p className={`${mutedTextColor} text-lg leading-relaxed mb-6`}>
                At Catalance, we believe that the best work happens when people
                are empowered to do their best. We foster a culture of
                transparency, innovation, and mutual respect.
              </p>
              <ul className="space-y-4">
                {[
                  "Collaborate with world-class talent",
                  "Ship products that impact millions",
                  "Grow your career with purpose",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <Zap className="w-3.5 h-3.5 text-primary" />
                    </div>
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
                className={`absolute -inset-4 rounded-3xl bg-gradient-to-r from-primary to-purple-600 ${isDark ? "opacity-20" : "opacity-10"} blur-2xl`}
              />
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800"
                alt="Team collaboration"
                className="relative rounded-3xl w-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-32">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
              <Heart className="w-3.5 h-3.5 mr-2" />
              Benefits
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Perks that matter.
            </h2>
            <p className={`${mutedTextColor} max-w-2xl mx-auto`}>
              We take care of our team so they can focus on doing their best
              work.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, idx) => (
              <BenefitCard key={idx} {...benefit} isDark={isDark} />
            ))}
          </div>
        </div>

        {/* Open Positions Section */}
        <div className="mb-32">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-500/10 text-purple-500 border-purple-500/20">
              <Globe className="w-3.5 h-3.5 mr-2" />
              Open Positions
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Find your place.
            </h2>
            <p className={`${mutedTextColor} max-w-2xl mx-auto`}>
              Explore our current openings and join our mission.
            </p>
          </div>
          <div className="space-y-4">
            {openPositions.map((job, idx) => (
              <JobCard key={idx} {...job} isDark={isDark} />
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative rounded-[2.5rem] overflow-hidden">
          <div className="absolute inset-0 bg-primary/10" />
          <div
            className={`absolute inset-0 bg-gradient-to-r ${isDark ? "from-black/80 via-black/50 to-transparent" : "from-white/80 via-white/50 to-transparent"} z-10`}
          />
          <img
            src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=2070"
            alt="Join our team"
            className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale"
          />

          <div className="relative z-20 p-12 md:p-24 text-center max-w-3xl mx-auto">
            <h2
              className={`text-4xl md:text-6xl font-bold mb-6 ${isDark ? "text-white" : "text-black"}`}
            >
              Don't see your role?
            </h2>
            <p
              className={`text-xl mb-10 ${isDark ? "text-neutral-300" : "text-gray-700"}`}
            >
              We're always looking for exceptional talent. Send us your resume
              and let's start a conversation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <Button
                  size="lg"
                  className="h-14 px-8 text-lg rounded-full bg-primary text-black hover:bg-primary/90 shadow-[0_0_20px_rgba(253,200,0,0.3)] hover:shadow-[0_0_30px_rgba(253,200,0,0.5)] transition-all transform hover:-translate-y-1"
                >
                  Get in Touch <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Careers;
