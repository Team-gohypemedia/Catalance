import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import BookOpen from "lucide-react/dist/esm/icons/book-open";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import Clock from "lucide-react/dist/esm/icons/clock";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Newspaper from "lucide-react/dist/esm/icons/newspaper";
import Search from "lucide-react/dist/esm/icons/search";
import ShieldAlert from "lucide-react/dist/esm/icons/shield-alert";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Star from "lucide-react/dist/esm/icons/star";
import User from "lucide-react/dist/esm/icons/user";

import SeoMeta from "@/components/common/SeoMeta";
import { SEO_DATA } from "@/shared/lib/seo-config";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/shared/context/AuthContext";
import { request } from "@/shared/lib/api-client";

const BLOG_PAGE_TITLE = SEO_DATA.blog.title;
const BLOG_PAGE_DESCRIPTION = SEO_DATA.blog.description;

const Blog = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const deferredSearch = useDeferredValue(search);

  const isAdmin = useMemo(() => {
    if (!user) return false;
    const role = String(user?.role || "").toUpperCase();
    const roles = Array.isArray(user?.roles) ? user.roles.map((r) => String(r).toUpperCase()) : [];
    return role === "ADMIN" || roles.includes("ADMIN") || roles.includes("SEO_TEAM") || roles.includes("BLOG_AUTHOR");
  }, [user]);

  const loadBlogs = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await request("/blogs");
      const list = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : [];
      setPosts(list);
    } catch (err) {
      console.error("Could not fetch published blogs:", err);
      setError(err?.message || "Failed to load articles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBlogs();
  }, []);

  const categories = useMemo(() => {
    const allCategories = posts
      .map((post) => post.category || "Engineering")
      .filter(Boolean);
    return ["All", ...new Set(allCategories)];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const query = String(deferredSearch || "").trim().toLowerCase();
    return posts.filter((post) => {
      const matchesCategory =
        selectedCategory === "All" || (post.category || "Engineering") === selectedCategory;
      if (!matchesCategory) return false;
      if (!query) return true;
      return [post.title, post.excerpt, post.category, post.authorName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [deferredSearch, posts, selectedCategory]);

  const canonicalUrl =
    typeof window !== "undefined" ? `${window.location.origin}/blog` : "https://catalance.in/blog";

  return (
    <main className="min-h-screen bg-background text-foreground pt-28 sm:pt-32 pb-24">
      <SeoMeta
        title={BLOG_PAGE_TITLE}
        description={BLOG_PAGE_DESCRIPTION}
        canonicalUrl={canonicalUrl}
        type="website"
        keywords={[
          "freelance delivery",
          "ai talent",
          "software engineering",
          "catalance blog",
          "project scoping",
          "freelance marketplace"
        ]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "Catalance Blog",
          description: BLOG_PAGE_DESCRIPTION,
          url: canonicalUrl
        }}
      />

      {/* Hero Header Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="border-b border-border pb-10">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Catalance Editorial & Knowledge Hub
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
              Insights for building high-impact software & products.
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              In-depth articles on hiring top engineers, project scoping, AI tooling, marketplace delivery, and scaling tech teams.
            </p>
          </div>
        </div>

        {/* Search & Category Filter Pills */}
        <div className="mt-8 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="relative w-full lg:max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search articles by title, topic, or author..."
              className="h-11 rounded-2xl border-border bg-card pl-11 text-xs text-foreground placeholder:text-muted-foreground shadow-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  selectedCategory === category
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Articles Card Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-10">
        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground text-sm">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
            Loading live articles...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-destructive/30 bg-destructive/10 p-8 text-center space-y-3">
            <ShieldAlert className="mx-auto h-8 w-8 text-destructive" />
            <p className="text-sm font-semibold text-destructive">{error}</p>
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => void loadBlogs()}>
              Retry
            </Button>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="rounded-[2.5rem] border border-dashed border-border bg-card p-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
              <BookOpen className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold">No articles match your search</h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              Try adjusting your search terms or category filter to find published articles.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group flex flex-col justify-between overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm hover:border-primary/50 hover:shadow-xl transition-all duration-300"
              >
                <div>
                  {/* Card Cover Banner */}
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                    {post.coverImageUrl ? (
                      <img
                        src={post.coverImageUrl}
                        alt={post.coverImageAlt || post.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-muted text-primary/40 font-semibold">
                        <BookOpen className="h-10 w-10 stroke-[1.5]" />
                      </div>
                    )}

                    {/* Category & Status Pills */}
                    <div className="absolute left-3 top-3 flex items-center gap-1.5">
                      <Badge className="bg-black/80 backdrop-blur-md text-white font-medium text-[10px] px-2.5 py-0.5 rounded-full border-none">
                        {post.category || "Engineering"}
                      </Badge>
                    </div>

                    {post.featured ? (
                      <div className="absolute right-3 top-3">
                        <Badge className="bg-amber-500 text-black font-bold text-[10px] px-2.5 py-0.5 rounded-full shadow gap-1">
                          <Star className="h-3 w-3 fill-current" />
                          Featured
                        </Badge>
                      </div>
                    ) : null}
                  </div>

                  {/* Card Content */}
                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{post.publishedLabel || "Recent"}</span>
                      <span>&bull;</span>
                      <Clock className="h-3 w-3" />
                      <span>{post.readTime}</span>
                    </div>

                    <h2 className="text-lg font-bold leading-snug tracking-tight text-foreground group-hover:text-primary transition line-clamp-2">
                      {post.title}
                    </h2>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-6 pb-6 pt-0">
                  <Separator className="mb-4" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="h-6 w-6 text-[10px] border border-border">
                        <AvatarFallback className="font-semibold bg-muted">
                          {(post.authorName || "C")[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground truncate font-medium max-w-[120px]">
                        {post.authorName || "Catalance"}
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:underline">
                      Read Article
                      <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Bottom CTA Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-20">
        <div className="rounded-[2.5rem] border border-border bg-gradient-to-r from-primary/10 via-card to-background p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs uppercase tracking-widest text-primary font-bold">Scale with Catalance</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Turn insights into delivered software milestones.
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
              Hire vetted developers, designers, and growth specialists backed by managed milestone protection.
            </p>
          </div>
          <Button asChild className="rounded-full px-8 h-12 text-xs font-bold shadow-md hover:shadow-lg shrink-0">
            <Link to="/service">Start Your Project</Link>
          </Button>
        </div>
      </section>
    </main>
  );
};

export default Blog;
