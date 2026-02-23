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
import Star from "lucide-react/dist/esm/icons/star";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import Code from "lucide-react/dist/esm/icons/code";
import Palette from "lucide-react/dist/esm/icons/palette";
import PenTool from "lucide-react/dist/esm/icons/pen-tool";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import Video from "lucide-react/dist/esm/icons/video";
import Megaphone from "lucide-react/dist/esm/icons/megaphone";
import Users from "lucide-react/dist/esm/icons/users";

gsap.registerPlugin(SplitText, useGSAP);

const CategoryCard = ({ icon: Icon, title, count, isDark }) => (
  <Link to="/service" className="block group">
    <div
      className={`p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${
        isDark
          ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-primary/30"
          : "bg-white border-black/5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
      }`}
    >
      <div
        className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-colors duration-300 ${
          isDark
            ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-black"
            : "bg-primary/10 text-primary-700 group-hover:bg-primary group-hover:text-white"
        }`}
      >
        <Icon className="w-7 h-7" />
      </div>
      <h3
        className={`text-lg font-bold mb-1 group-hover:text-primary transition-colors ${isDark ? "text-white" : "text-gray-900"}`}
      >
        {title}
      </h3>
      <p className={`text-sm ${isDark ? "text-neutral-400" : "text-gray-600"}`}>
        {count} professionals
      </p>
    </div>
  </Link>
);

const TalentCard = ({
  name,
  role,
  rating,
  projects,
  location,
  isDark,
}) => (
  <Link to="/service" className="block group">
    <div
      className={`p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${
        isDark
          ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-primary/30"
          : "bg-white border-black/5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
      }`}
    >
      <div className="min-w-0">
          <h3
            className={`text-lg font-bold mb-1 group-hover:text-primary transition-colors truncate ${isDark ? "text-white" : "text-gray-900"}`}
          >
            {name}
          </h3>
          <p
            className={`text-sm mb-2 ${isDark ? "text-neutral-400" : "text-gray-600"}`}
          >
            {role}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="flex items-center gap-1 text-primary">
              <Star className="w-3.5 h-3.5 fill-primary" /> {rating}
            </span>
            <span
              className={`flex items-center gap-1 ${isDark ? "text-neutral-400" : "text-gray-600"}`}
            >
              <Briefcase className="w-3.5 h-3.5" /> {projects} projects
            </span>
            <span
              className={`flex items-center gap-1 ${isDark ? "text-neutral-400" : "text-gray-600"}`}
            >
              <MapPin className="w-3.5 h-3.5" /> {location}
            </span>
          </div>
      </div>
    </div>
  </Link>
);

const BrowseTalent = () => {
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
    { icon: Code, title: "Development", count: "15,000+" },
    { icon: Palette, title: "Design", count: "8,500+" },
    { icon: PenTool, title: "Writing", count: "6,200+" },
    { icon: TrendingUp, title: "Marketing", count: "4,800+" },
    { icon: Video, title: "Video & Animation", count: "3,500+" },
    { icon: Megaphone, title: "Social Media", count: "2,900+" },
  ];

  const featuredTalent = [
    {
      name: "Mohd Kaif",
      role: "Full-Stack Developer",
      rating: "4.9",
      projects: "127",
      location: "Singapore",
    },
    {
      name: "Ravindra Nath Jha",
      role: "UI/UX Designer",
      rating: "5.0",
      projects: "89",
      location: "New York",
    },
    {
      name: "Kshitij Sharma",
      role: "Content Strategist",
      rating: "4.8",
      projects: "156",
      location: "Barcelona",
    },
    {
      name: "Aniket Thakur",
      role: "Motion Designer",
      rating: "4.9",
      projects: "73",
      location: "Seoul",
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

      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20 opacity-50"
        fill={isDark ? "#fdc800" : "#f59e0b"}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-20">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 backdrop-blur-md px-4 py-1.5 hover:bg-primary/20 transition-colors">
            <Users className="w-3.5 h-3.5 mr-2" />
            50,000+ Professionals
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
            <span ref={heroTextRef} className="inline-block">
              Find your perfect{" "}
            </span>{" "}
            <span
              ref={heroGradientRef}
              className={`inline-block bg-clip-text text-transparent bg-linear-to-r ${isDark ? "from-primary via-yellow-200 to-primary" : "from-primary via-orange-400 to-primary"}`}
            >
              match.
            </span>
          </h1>
          <p
            className={`text-lg md:text-xl ${mutedTextColor} max-w-2xl mx-auto leading-relaxed mb-8`}
          >
            Browse our curated network of world-class freelancers ready to bring
            your vision to life.
          </p>

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
                  placeholder="Search for skills, roles, or expertise..."
                  className="border-0 bg-transparent focus-visible:ring-0 text-lg"
                />
              </div>
              <Button size="lg" className="rounded-xl px-6">
                Search
              </Button>
            </div>
          </div>
        </div>

        {/* Categories Section */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">
              Browse by Category
            </h2>
            <Link
              to="/service"
              className="text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat, idx) => (
              <CategoryCard key={idx} {...cat} isDark={isDark} />
            ))}
          </div>
        </div>

        {/* Featured Talent Section */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">Featured Talent</h2>
            <Link
              to="/service"
              className="text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {featuredTalent.map((talent, idx) => (
              <TalentCard key={idx} {...talent} isDark={isDark} />
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div
          className={`rounded-3xl p-12 text-center ${isDark ? "bg-white/5" : "bg-primary/5"}`}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to get started?
          </h2>
          <p className={`${mutedTextColor} mb-8 max-w-xl mx-auto`}>
            Tell us about your project and we&apos;ll match you with the perfect
            talent.
          </p>
          <Link to="/service">
            <Button size="lg" className="rounded-full px-8">
              Post a Project <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
};

export default BrowseTalent;
