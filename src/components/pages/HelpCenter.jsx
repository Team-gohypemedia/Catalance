import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/components/providers/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import Search from "lucide-react/dist/esm/icons/search";
import HelpCircle from "lucide-react/dist/esm/icons/help-circle";
import BookOpen from "lucide-react/dist/esm/icons/book-open";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import Shield from "lucide-react/dist/esm/icons/shield";
import Users from "lucide-react/dist/esm/icons/users";
import Settings from "lucide-react/dist/esm/icons/settings";
import FileText from "lucide-react/dist/esm/icons/file-text";

const CATEGORIES = [
  {
    icon: BookOpen,
    title: "Getting Started",
    description: "Basics to launch your first project.",
  },
  {
    icon: Users,
    title: "Account & Profile",
    description: "Manage profile, security, and access.",
  },
  {
    icon: CreditCard,
    title: "Payments & Billing",
    description: "Invoices, payouts, and billing support.",
  },
  {
    icon: FileText,
    title: "Projects & Contracts",
    description: "Milestones, scope, and delivery workflows.",
  },
  {
    icon: Shield,
    title: "Trust & Safety",
    description: "Disputes, security, and protection.",
  },
  {
    icon: Settings,
    title: "Technical Support",
    description: "Troubleshoot common platform issues.",
  },
];

const ARTICLES = [
  { title: "How to create a project brief", category: "Getting Started" },
  { title: "Improve your profile visibility", category: "Account & Profile" },
  { title: "How payout timelines work", category: "Payments & Billing" },
  { title: "Setting milestone-based contracts", category: "Projects & Contracts" },
  { title: "How to open a dispute", category: "Trust & Safety" },
  { title: "Fix login and notification issues", category: "Technical Support" },
];

const HelpCenter = () => {
  const { theme } = useTheme();
  const isDark = theme !== "light";
  const [query, setQuery] = useState("");
  const resultsRef = useRef(null);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredCategories = useMemo(() => {
    if (!normalizedQuery) return CATEGORIES;

    return CATEGORIES.filter((category) => {
      const text = `${category.title} ${category.description}`.toLowerCase();
      return text.includes(normalizedQuery);
    });
  }, [normalizedQuery]);

  const filteredArticles = useMemo(() => {
    if (!normalizedQuery) return ARTICLES;

    return ARTICLES.filter((article) => {
      const text = `${article.title} ${article.category}`.toLowerCase();
      return text.includes(normalizedQuery);
    });
  }, [normalizedQuery]);

  const handleSearch = (event) => {
    event.preventDefault();
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main
      className={`min-h-screen ${isDark ? "bg-black text-white" : "bg-white text-gray-900"}`}
    >
      <div className="mx-auto max-w-6xl px-5 pb-20 pt-28 md:px-8 md:pt-32">
        <section
          className={`rounded-3xl border p-7 md:p-10 ${
            isDark ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-gray-50"
          }`}
        >
          <Badge
            className={`mb-5 border px-4 py-1.5 ${
              isDark
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-primary/40 bg-primary/10 text-primary"
            }`}
          >
            <HelpCircle className="mr-1 h-3.5 w-3.5" />
            Help Center
          </Badge>

          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            How can we help?
          </h1>
          <p className={`mt-3 text-base ${isDark ? "text-neutral-300" : "text-gray-600"}`}>
            Search help topics and find the right guide quickly.
          </p>

          <form
            onSubmit={handleSearch}
            className={`mt-6 flex flex-col gap-3 rounded-2xl border p-2 sm:flex-row sm:items-center ${
              isDark ? "border-white/10 bg-black/30" : "border-black/10 bg-white"
            }`}
          >
            <div className="relative flex-1">
              <Search
                className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
                  isDark ? "text-neutral-400" : "text-gray-500"
                }`}
              />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search help articles"
                className={`h-11 border-none pl-10 shadow-none ${
                  isDark
                    ? "bg-transparent text-white placeholder:text-neutral-500"
                    : "bg-transparent text-gray-900 placeholder:text-gray-500"
                }`}
              />
            </div>
            <Button type="submit" className="h-11 rounded-xl px-6 font-semibold">
              Search Help
            </Button>
          </form>

          {normalizedQuery ? (
            <p className={`mt-3 text-sm ${isDark ? "text-neutral-400" : "text-gray-600"}`}>
              {filteredCategories.length + filteredArticles.length} results for &quot;
              {query}
              &quot;
            </p>
          ) : null}
        </section>

        <section ref={resultsRef} className="mt-12">
          <h2 className="text-2xl font-semibold">Categories</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCategories.map((category) => {
              const Icon = category.icon;

              return (
                <article
                  key={category.title}
                  className={`rounded-2xl border p-5 ${
                    isDark ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-white"
                  }`}
                >
                  <div
                    className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${
                      isDark ? "bg-primary/15 text-primary" : "bg-primary/10 text-primary"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold">{category.title}</h3>
                  <p className={`mt-2 text-sm ${isDark ? "text-neutral-300" : "text-gray-600"}`}>
                    {category.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold">Popular Articles</h2>
          <div className="mt-5 space-y-3">
            {filteredArticles.length === 0 ? (
              <p className={isDark ? "text-neutral-400" : "text-gray-600"}>No matching articles found.</p>
            ) : (
              filteredArticles.map((article) => (
                <article
                  key={article.title}
                  className={`flex items-center justify-between rounded-xl border p-4 ${
                    isDark ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-white"
                  }`}
                >
                  <div>
                    <p className="font-medium">{article.title}</p>
                    <p className={`text-sm ${isDark ? "text-neutral-400" : "text-gray-500"}`}>
                      {article.category}
                    </p>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section
          className={`mt-12 rounded-3xl border p-7 text-center ${
            isDark ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-gray-50"
          }`}
        >
          <h2 className="text-2xl font-semibold">Still need help?</h2>
          <p className={`mt-2 text-sm ${isDark ? "text-neutral-300" : "text-gray-600"}`}>
            Contact support and we&apos;ll assist you directly.
          </p>
          <Button asChild className="mt-5 rounded-full px-6">
            <Link to="/contact-us">
              Contact Support
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </section>
      </div>
    </main>
  );
};

export default HelpCenter;
