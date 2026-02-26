import { useEffect, useMemo, useRef, useState } from "react";
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

const HELP_CATEGORIES = [
  {
    id: "getting-started",
    icon: BookOpen,
    title: "Getting Started",
    description: "Basics to launch your first project quickly and clearly."
  },
  {
    id: "account-profile",
    icon: Users,
    title: "Account & Profile",
    description: "Manage profile, security, access, and account settings."
  },
  {
    id: "payments-billing",
    icon: CreditCard,
    title: "Payments & Billing",
    description: "Invoices, payout timing, payment methods, and billing support."
  },
  {
    id: "projects-contracts",
    icon: FileText,
    title: "Projects & Contracts",
    description: "Milestones, scope updates, deliverables, and workflows."
  },
  {
    id: "trust-safety",
    icon: Shield,
    title: "Trust & Safety",
    description: "Disputes, account protection, and platform safeguards."
  },
  {
    id: "technical-support",
    icon: Settings,
    title: "Technical Support",
    description: "Troubleshoot login, notifications, upload, and app issues."
  }
];

const HELP_ARTICLES = [
  {
    id: "create-project-brief",
    categoryId: "getting-started",
    title: "How to create a project brief",
    summary: "Define scope, deliverables, timeline, and budget so freelancers can quote accurately.",
    readTime: "4 min read",
    updatedAt: "Updated February 2026",
    popularity: 98,
    tags: ["project brief", "scope", "timeline"],
    guide: [
      "Start with one clear outcome: what should be delivered and how success will be measured.",
      "Add must-have requirements, preferred tech stack, budget range, and timeline expectations.",
      "Include examples and constraints early to avoid revisions and scope confusion later."
    ]
  },
  {
    id: "choose-right-service",
    categoryId: "getting-started",
    title: "Choosing the right service before posting",
    summary: "Pick the service category that matches your outcome to improve proposal quality.",
    readTime: "3 min read",
    updatedAt: "Updated February 2026",
    popularity: 82,
    tags: ["services", "matching", "project setup"],
    guide: [
      "Map your goal to one primary service and add secondary services only when needed.",
      "Avoid broad multi-service requests when the first milestone can be solved by one expert.",
      "Use category-specific details so the right freelancers self-select quickly."
    ]
  },
  {
    id: "first-client-call-checklist",
    categoryId: "getting-started",
    title: "First project call checklist",
    summary: "Run a structured kickoff call that aligns scope, communication, and delivery dates.",
    readTime: "5 min read",
    updatedAt: "Updated January 2026",
    popularity: 73,
    tags: ["kickoff", "communication", "project management"],
    guide: [
      "Confirm goals, stakeholders, deadlines, and approval flow in the first 15 minutes.",
      "Agree on async channels, meeting cadence, and response-time expectations.",
      "Close with milestone deadlines and a written summary shared on the same day."
    ]
  },
  {
    id: "improve-profile-visibility",
    categoryId: "account-profile",
    title: "Improve your profile visibility",
    summary: "Increase profile trust and ranking with stronger positioning and proof.",
    readTime: "4 min read",
    updatedAt: "Updated February 2026",
    popularity: 91,
    tags: ["profile", "visibility", "trust"],
    guide: [
      "Use a specific headline tied to one niche and one measurable result.",
      "Show 3 to 5 portfolio outcomes with before-and-after business impact.",
      "Keep skills and service tags aligned with the work you want to receive."
    ]
  },
  {
    id: "reset-password-and-security",
    categoryId: "account-profile",
    title: "Reset password and secure your account",
    summary: "Recover access and lock your account with stronger security settings.",
    readTime: "3 min read",
    updatedAt: "Updated January 2026",
    popularity: 66,
    tags: ["password", "security", "account access"],
    guide: [
      "Use forgot password from login and complete reset from the email link.",
      "Set a unique password and avoid reuse across work accounts.",
      "Review login devices and remove sessions you do not recognize."
    ]
  },
  {
    id: "switch-between-client-freelancer-roles",
    categoryId: "account-profile",
    title: "Switch between client and freelancer roles",
    summary: "Use one account with multiple roles while keeping activity and workflows organized.",
    readTime: "3 min read",
    updatedAt: "Updated February 2026",
    popularity: 58,
    tags: ["roles", "account", "client", "freelancer"],
    guide: [
      "Select your active role at login or from your account switcher.",
      "Role-specific dashboards keep projects, chats, and actions separated.",
      "If a role is missing, complete the related onboarding path first."
    ]
  },
  {
    id: "how-payout-timelines-work",
    categoryId: "payments-billing",
    title: "How payout timelines work",
    summary: "Understand release windows, verification steps, and payout status updates.",
    readTime: "4 min read",
    updatedAt: "Updated February 2026",
    popularity: 88,
    tags: ["payout", "billing", "timeline"],
    guide: [
      "Payout timing starts after milestone verification and payment release.",
      "Track status from pending to processing to paid in your payments panel.",
      "Contact support if status remains unchanged beyond the stated processing window."
    ]
  },
  {
    id: "download-invoices-and-receipts",
    categoryId: "payments-billing",
    title: "Download invoices and receipts",
    summary: "Get tax-ready billing records for each project and transaction.",
    readTime: "2 min read",
    updatedAt: "Updated January 2026",
    popularity: 64,
    tags: ["invoice", "receipt", "tax"],
    guide: [
      "Open Payments, filter by project or date, and download the invoice PDF.",
      "For combined statements, export transactions for your selected period.",
      "Check your billing profile details to ensure invoice accuracy."
    ]
  },
  {
    id: "fix-failed-payment-method",
    categoryId: "payments-billing",
    title: "Fix a failed payment method",
    summary: "Resolve card or bank payment failures and retry safely.",
    readTime: "3 min read",
    updatedAt: "Updated February 2026",
    popularity: 69,
    tags: ["payment failed", "card", "billing"],
    guide: [
      "Confirm card/bank details, spending limits, and international transaction settings.",
      "Retry from billing after updating your payment method.",
      "If failure persists, use an alternate method and share the error code with support."
    ]
  },
  {
    id: "set-up-milestone-contracts",
    categoryId: "projects-contracts",
    title: "Setting milestone-based contracts",
    summary: "Break work into clear checkpoints with payment and acceptance criteria.",
    readTime: "5 min read",
    updatedAt: "Updated February 2026",
    popularity: 95,
    tags: ["milestones", "contracts", "project delivery"],
    guide: [
      "Define each milestone by deliverable, due date, and acceptance condition.",
      "Set review windows and revision limits to keep timelines predictable.",
      "Release payments only when milestone outcomes match the agreed criteria."
    ]
  },
  {
    id: "manage-scope-change-requests",
    categoryId: "projects-contracts",
    title: "Managing scope change requests",
    summary: "Handle new requests without derailing timelines or pricing.",
    readTime: "4 min read",
    updatedAt: "Updated January 2026",
    popularity: 77,
    tags: ["scope change", "contracts", "delivery"],
    guide: [
      "Document requested changes and classify them as in-scope or new scope.",
      "Update timeline and pricing before starting additional work.",
      "Get written approval in chat before applying change requests."
    ]
  },
  {
    id: "mark-deliverables-complete",
    categoryId: "projects-contracts",
    title: "Mark deliverables complete and request review",
    summary: "Submit delivery with context so review and approvals move faster.",
    readTime: "3 min read",
    updatedAt: "Updated February 2026",
    popularity: 71,
    tags: ["deliverables", "review", "project status"],
    guide: [
      "Attach final files, notes, and deployment details with each submission.",
      "Reference the acceptance checklist to speed up client verification.",
      "Ask for consolidated feedback in one review cycle when possible."
    ]
  },
  {
    id: "how-to-open-a-dispute",
    categoryId: "trust-safety",
    title: "How to open a dispute",
    summary: "Escalate unresolved project conflicts using the guided dispute flow.",
    readTime: "4 min read",
    updatedAt: "Updated February 2026",
    popularity: 84,
    tags: ["dispute", "conflict resolution", "safety"],
    guide: [
      "Open the project and submit a dispute with evidence and timeline context.",
      "Attach files, chat references, and clear requested outcomes.",
      "A project manager reviews details and shares next-step actions."
    ]
  },
  {
    id: "report-suspicious-activity",
    categoryId: "trust-safety",
    title: "Report suspicious activity",
    summary: "Flag phishing, fake profiles, or abusive behavior quickly.",
    readTime: "2 min read",
    updatedAt: "Updated January 2026",
    popularity: 55,
    tags: ["security", "abuse", "reporting"],
    guide: [
      "Use in-app report options on messages, profiles, or projects.",
      "Avoid sharing passwords, OTPs, or payment details outside secure flows.",
      "If urgent, contact support with screenshots and timestamps."
    ]
  },
  {
    id: "escrow-and-payment-protection",
    categoryId: "trust-safety",
    title: "Escrow and payment protection basics",
    summary: "Understand how milestone funding and release protect both parties.",
    readTime: "3 min read",
    updatedAt: "Updated February 2026",
    popularity: 79,
    tags: ["escrow", "protection", "payments"],
    guide: [
      "Client payments are held securely until milestone verification.",
      "Freelancers get clearer payment visibility through milestone tracking.",
      "Disputes route through platform review when expectations are not met."
    ]
  },
  {
    id: "fix-login-issues",
    categoryId: "technical-support",
    title: "Fix login issues quickly",
    summary: "Resolve common sign-in problems across desktop and mobile devices.",
    readTime: "3 min read",
    updatedAt: "Updated February 2026",
    popularity: 87,
    tags: ["login", "auth", "troubleshooting"],
    guide: [
      "Verify email/password, role selection, and account verification status.",
      "Clear browser cache or retry in private mode to rule out stale sessions.",
      "If still blocked, reset password and share the exact error message with support."
    ]
  },
  {
    id: "notification-troubleshooting",
    categoryId: "technical-support",
    title: "Notification troubleshooting guide",
    summary: "Restore email and in-app notifications for project updates.",
    readTime: "3 min read",
    updatedAt: "Updated January 2026",
    popularity: 62,
    tags: ["notifications", "email", "settings"],
    guide: [
      "Check notification preferences in profile settings.",
      "Whitelist Catalance sender addresses in your email provider.",
      "Enable browser and device push permissions for real-time alerts."
    ]
  },
  {
    id: "file-upload-errors",
    categoryId: "technical-support",
    title: "Resolve file upload errors",
    summary: "Fix upload failures related to size, format, or unstable network connections.",
    readTime: "4 min read",
    updatedAt: "Updated February 2026",
    popularity: 68,
    tags: ["uploads", "attachments", "errors"],
    guide: [
      "Confirm file size and format are supported before upload.",
      "Retry on a stable connection and avoid multiple large uploads in parallel.",
      "If upload fails repeatedly, share file type and size with support."
    ]
  }
];

const CATEGORY_BY_ID = Object.fromEntries(
  HELP_CATEGORIES.map((category) => [category.id, category])
);

const HelpCenter = () => {
  const { theme } = useTheme();
  const isDark = theme !== "light";

  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState("all");
  const [selectedArticleId, setSelectedArticleId] = useState(HELP_ARTICLES[0]?.id || "");
  const resultsRef = useRef(null);

  const normalizedQuery = query.trim().toLowerCase();

  const articlesMatchingQuery = useMemo(
    () =>
      HELP_ARTICLES.filter((article) => {
        if (!normalizedQuery) return true;

        const searchableText = [
          article.title,
          article.summary,
          article.tags.join(" "),
          article.guide.join(" ")
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalizedQuery);
      }),
    [normalizedQuery]
  );

  const categoryResultCounts = useMemo(
    () =>
      HELP_CATEGORIES.reduce(
        (acc, category) => ({
          ...acc,
          [category.id]: articlesMatchingQuery.filter(
            (article) => article.categoryId === category.id
          ).length
        }),
        {}
      ),
    [articlesMatchingQuery]
  );

  const filteredArticles = useMemo(() => {
    if (activeCategoryId === "all") return articlesMatchingQuery;
    return articlesMatchingQuery.filter(
      (article) => article.categoryId === activeCategoryId
    );
  }, [activeCategoryId, articlesMatchingQuery]);

  useEffect(() => {
    if (!filteredArticles.length) {
      setSelectedArticleId("");
      return;
    }

    const hasSelectedArticle = filteredArticles.some(
      (article) => article.id === selectedArticleId
    );

    if (!hasSelectedArticle) {
      setSelectedArticleId(filteredArticles[0].id);
    }
  }, [filteredArticles, selectedArticleId]);

  const selectedArticle = useMemo(
    () => HELP_ARTICLES.find((article) => article.id === selectedArticleId) || null,
    [selectedArticleId]
  );

  const popularArticles = useMemo(() => {
    const source = filteredArticles.length ? filteredArticles : HELP_ARTICLES;
    return [...source].sort((a, b) => b.popularity - a.popularity).slice(0, 6);
  }, [filteredArticles]);

  const handleSearch = (event) => {
    event.preventDefault();
    setQuery(queryInput);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleClearFilters = () => {
    setQueryInput("");
    setQuery("");
    setActiveCategoryId("all");
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const totalCategoryResults = Object.values(categoryResultCounts).reduce(
    (sum, value) => sum + value,
    0
  );

  return (
    <main className={`min-h-screen ${isDark ? "bg-black text-white" : "bg-white text-gray-900"}`}>
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

          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">How can we help?</h1>
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
                value={queryInput}
                onChange={(event) => setQueryInput(event.target.value)}
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
            {(query || activeCategoryId !== "all") && (
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl px-5"
                onClick={handleClearFilters}
              >
                Clear
              </Button>
            )}
          </form>

          {query ? (
            <p className={`mt-3 text-sm ${isDark ? "text-neutral-400" : "text-gray-600"}`}>
              {totalCategoryResults} results for &quot;{query}&quot;
            </p>
          ) : null}
        </section>

        <section ref={resultsRef} className="mt-12">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold">Categories</h2>
            {activeCategoryId !== "all" && (
              <p className={isDark ? "text-sm text-neutral-400" : "text-sm text-gray-600"}>
                Active: {CATEGORY_BY_ID[activeCategoryId]?.title}
              </p>
            )}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button
              type="button"
              onClick={() => setActiveCategoryId("all")}
              className={`rounded-2xl border p-5 text-left transition ${
                activeCategoryId === "all"
                  ? "border-primary bg-primary/10"
                  : isDark
                    ? "border-white/10 bg-white/[0.03] hover:border-primary/40"
                    : "border-black/10 bg-white hover:border-primary/50"
              }`}
            >
              <h3 className="text-lg font-semibold">All Topics</h3>
              <p className={`mt-2 text-sm ${isDark ? "text-neutral-300" : "text-gray-600"}`}>
                Browse every guide across all categories.
              </p>
              <p className={`mt-3 text-xs ${isDark ? "text-neutral-400" : "text-gray-500"}`}>
                {articlesMatchingQuery.length} guides
              </p>
            </button>

            {HELP_CATEGORIES.map((category) => {
              const Icon = category.icon;
              const resultCount = categoryResultCounts[category.id] || 0;
              const isActive = activeCategoryId === category.id;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategoryId(category.id)}
                  className={`rounded-2xl border p-5 text-left transition ${
                    isActive
                      ? "border-primary bg-primary/10"
                      : isDark
                        ? "border-white/10 bg-white/[0.03] hover:border-primary/40"
                        : "border-black/10 bg-white hover:border-primary/50"
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
                  <p className={`mt-3 text-xs ${isDark ? "text-neutral-400" : "text-gray-500"}`}>
                    {resultCount} {resultCount === 1 ? "guide" : "guides"}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold">Guides & Articles</h2>
          {filteredArticles.length === 0 ? (
            <div
              className={`mt-5 rounded-2xl border p-6 ${
                isDark ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-white"
              }`}
            >
              <p className={isDark ? "text-neutral-300" : "text-gray-600"}>
                No matching articles found. Try a broader keyword or clear filters.
              </p>
              <Button onClick={handleClearFilters} className="mt-4">
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {filteredArticles.map((article) => (
                <button
                  key={article.id}
                  type="button"
                  onClick={() => setSelectedArticleId(article.id)}
                  className={`rounded-xl border p-4 text-left transition ${
                    selectedArticleId === article.id
                      ? "border-primary bg-primary/10"
                      : isDark
                        ? "border-white/10 bg-white/[0.03] hover:border-primary/40"
                        : "border-black/10 bg-white hover:border-primary/50"
                  }`}
                >
                  <p className="font-medium">{article.title}</p>
                  <p className={`mt-2 text-sm ${isDark ? "text-neutral-300" : "text-gray-600"}`}>
                    {article.summary}
                  </p>
                  <div className={`mt-3 flex gap-2 text-xs ${isDark ? "text-neutral-400" : "text-gray-500"}`}>
                    <span>{CATEGORY_BY_ID[article.categoryId]?.title}</span>
                    <span>|</span>
                    <span>{article.readTime}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {selectedArticle ? (
          <section
            className={`mt-12 rounded-3xl border p-7 md:p-8 ${
              isDark ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-gray-50"
            }`}
          >
            <p className={`text-sm ${isDark ? "text-neutral-400" : "text-gray-600"}`}>
              {CATEGORY_BY_ID[selectedArticle.categoryId]?.title}
            </p>
            <h2 className="mt-1 text-3xl font-semibold">{selectedArticle.title}</h2>
            <p className={`mt-2 text-sm ${isDark ? "text-neutral-400" : "text-gray-600"}`}>
              {selectedArticle.updatedAt} | {selectedArticle.readTime}
            </p>

            <p className={`mt-5 text-base ${isDark ? "text-neutral-200" : "text-gray-700"}`}>
              {selectedArticle.summary}
            </p>

            <ol className="mt-5 space-y-3">
              {selectedArticle.guide.map((point, index) => (
                <li
                  key={point}
                  className={`rounded-xl border p-4 text-sm ${
                    isDark ? "border-white/10 bg-black/40 text-neutral-200" : "border-black/10 bg-white text-gray-700"
                  }`}
                >
                  <span className="font-semibold">{index + 1}. </span>
                  {point}
                </li>
              ))}
            </ol>

            <div className="mt-5 flex flex-wrap gap-2">
              {selectedArticle.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="rounded-full px-3 py-1 text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/contact-us">
                  Need Support
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/service">Explore Services</Link>
              </Button>
            </div>
          </section>
        ) : null}

        <section className="mt-12">
          <h2 className="text-2xl font-semibold">Popular Articles</h2>
          <div className="mt-5 space-y-3">
            {popularArticles.map((article) => (
              <article
                key={article.id}
                className={`flex items-center justify-between gap-4 rounded-xl border p-4 ${
                  isDark ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-white"
                }`}
              >
                <div>
                  <p className="font-medium">{article.title}</p>
                  <p className={`text-sm ${isDark ? "text-neutral-400" : "text-gray-500"}`}>
                    {CATEGORY_BY_ID[article.categoryId]?.title} | {article.readTime}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  className="shrink-0"
                  onClick={() => setSelectedArticleId(article.id)}
                >
                  Open
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </article>
            ))}
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
