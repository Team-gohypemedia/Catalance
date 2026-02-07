import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spotlight } from "@/components/ui/spotlight";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import BookOpen from "lucide-react/dist/esm/icons/book-open";
import Clock from "lucide-react/dist/esm/icons/clock";
import User from "lucide-react/dist/esm/icons/user";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import Lightbulb from "lucide-react/dist/esm/icons/lightbulb";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import { useTheme } from "@/components/providers/theme-provider";

gsap.registerPlugin(SplitText, useGSAP);

const BlogCard = ({
  title,
  excerpt,
  category,
  readTime,
  author,
  image,
  featured,
  isDark,
}) => (
  <Link to="#" className="block group">
    <div
      className={`rounded-3xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 ${
        isDark
          ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-primary/30"
          : "bg-white border-black/5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
      } ${featured ? "md:col-span-2" : ""}`}
    >
      <div className={`relative ${featured ? "h-64" : "h-48"} overflow-hidden`}>
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-4 left-4">
          <Badge className="bg-primary text-black">{category}</Badge>
        </div>
      </div>
      <div className="p-6">
        <h3
          className={`text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2 ${isDark ? "text-white" : "text-gray-900"}`}
        >
          {title}
        </h3>
        <p
          className={`mb-4 line-clamp-2 ${isDark ? "text-neutral-400" : "text-gray-600"}`}
        >
          {excerpt}
        </p>
        <div
          className={`flex items-center justify-between text-sm ${isDark ? "text-neutral-500" : "text-gray-500"}`}
        >
          <span className="flex items-center gap-1">
            <User className="w-4 h-4" /> {author}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" /> {readTime}
          </span>
        </div>
      </div>
    </div>
  </Link>
);

const CategoryTab = ({ icon: Icon, label, active, onClick, isDark }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
      active
        ? "bg-primary text-black"
        : isDark
          ? "bg-white/5 text-neutral-400 hover:bg-white/10"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    }`}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

const Blog = () => {
  const containerRef = useRef(null);
  const heroTextRef = useRef(null);
  const heroGradientRef = useRef(null);
  const { theme } = useTheme();
  const [resolvedTheme, setResolvedTheme] = useState("dark");
  const [activeCategory, setActiveCategory] = useState("all");

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
    { id: "all", label: "All Posts", icon: BookOpen },
    { id: "trends", label: "Industry Trends", icon: TrendingUp },
    { id: "tips", label: "Tips & Guides", icon: Lightbulb },
    { id: "success", label: "Success Stories", icon: Briefcase },
  ];

  const blogPosts = [
    {
      title: "The Future of Remote Work: Trends Shaping 2024 and Beyond",
      excerpt:
        "Discover how remote work is evolving and what it means for businesses and freelancers in the coming years.",
      category: "Industry Trends",
      readTime: "8 min read",
      author: "Sarah Chen",
      image:
        "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800",
      featured: true,
    },
    {
      title: "How to Write a Winning Proposal",
      excerpt:
        "Learn the secrets to crafting proposals that win clients and grow your freelance business.",
      category: "Tips & Guides",
      readTime: "5 min read",
      author: "Marcus Johnson",
      image:
        "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=800",
    },
    {
      title: "From Side Hustle to Full-Time: Elena's Journey",
      excerpt:
        "How one freelancer turned her passion project into a six-figure business on Catalance.",
      category: "Success Stories",
      readTime: "6 min read",
      author: "Elena Rodriguez",
      image:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800",
    },
    {
      title: "Pricing Your Services: A Complete Guide",
      excerpt:
        "Stop undervaluing your work. Here's how to price your freelance services for maximum profit.",
      category: "Tips & Guides",
      readTime: "7 min read",
      author: "David Kim",
      image:
        "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=800",
    },
    {
      title: "AI and the Future of Freelancing",
      excerpt:
        "How artificial intelligence is changing the landscape for independent professionals.",
      category: "Industry Trends",
      readTime: "10 min read",
      author: "Alex Rivera",
      image:
        "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800",
    },
    {
      title: "Building Your Personal Brand Online",
      excerpt:
        "Stand out from the crowd with these proven personal branding strategies.",
      category: "Tips & Guides",
      readTime: "6 min read",
      author: "Jessica Park",
      image:
        "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=800",
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
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 backdrop-blur-md px-4 py-1.5">
            <BookOpen className="w-3.5 h-3.5 mr-2" />
            Blog
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
            <span ref={heroTextRef} className="inline-block">
              Insights for the{" "}
            </span>{" "}
            <span
              ref={heroGradientRef}
              className={`inline-block bg-clip-text text-transparent bg-linear-to-r ${isDark ? "from-primary via-yellow-200 to-primary" : "from-primary via-orange-400 to-primary"}`}
            >
              modern workforce.
            </span>
          </h1>
          <p
            className={`text-lg md:text-xl ${mutedTextColor} max-w-2xl mx-auto leading-relaxed`}
          >
            Tips, trends, and success stories to help you thrive in the
            freelance economy.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((cat) => (
            <CategoryTab
              key={cat.id}
              {...cat}
              active={activeCategory === cat.id}
              onClick={() => setActiveCategory(cat.id)}
              isDark={isDark}
            />
          ))}
        </div>

        {/* Blog Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {blogPosts.map((post, idx) => (
            <BlogCard key={idx} {...post} isDark={isDark} />
          ))}
        </div>

        {/* Load More */}
        <div className="text-center">
          <Button
            variant="outline"
            size="lg"
            className={`rounded-full px-8 ${isDark ? "border-white/20" : "border-black/10"}`}
          >
            Load More Articles <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </main>
  );
};

export default Blog;
