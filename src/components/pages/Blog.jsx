import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Search from "lucide-react/dist/esm/icons/search";

import SeoMeta from "@/components/common/SeoMeta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { request } from "@/shared/lib/api-client";

const BLOG_PAGE_TITLE = "Catalance Blog | Freelance Growth, Delivery and SEO Insights";
const BLOG_PAGE_DESCRIPTION =
  "Catalance articles on freelance growth, delivery systems, pricing, client operations, and SEO-ready execution.";

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    let ignore = false;

    const loadBlogs = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await request("/blogs");
        if (!ignore) {
          setPosts(Array.isArray(data) ? data : []);
        }
      } catch (nextError) {
        if (!ignore) {
          console.error("Failed to load blog posts:", nextError);
          setError(nextError?.message || "Failed to load blogs");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void loadBlogs();

    return () => {
      ignore = true;
    };
  }, []);

  const categories = useMemo(() => {
    const allCategories = posts
      .map((post) => post.category || "Insights")
      .filter(Boolean);
    return ["All", ...new Set(allCategories)];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const query = String(deferredSearch || "").trim().toLowerCase();
    return posts.filter((post) => {
      const matchesCategory =
        selectedCategory === "All" || (post.category || "Insights") === selectedCategory;
      if (!matchesCategory) return false;
      if (!query) return true;
      return [post.title, post.excerpt, post.category, post.authorName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [deferredSearch, posts, selectedCategory]);

  const featuredPost =
    filteredPosts.find((post) => post.featured) ||
    filteredPosts[0] ||
    null;
  const supportingPosts = featuredPost
    ? filteredPosts.filter((post) => post.id !== featuredPost.id)
    : filteredPosts;

  const canonicalUrl =
    typeof window !== "undefined" ? `${window.location.origin}/blog` : "/blog";

  return (
    <main className="min-h-screen bg-[#090909] text-white">
      <SeoMeta
        title={BLOG_PAGE_TITLE}
        description={BLOG_PAGE_DESCRIPTION}
        canonicalUrl={canonicalUrl}
        type="website"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "Catalance Blog",
          description: BLOG_PAGE_DESCRIPTION,
          url: canonicalUrl
        }}
      />

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,200,0,0.18),_transparent_32%),linear-gradient(180deg,_rgba(255,255,255,0.04),_transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-16 sm:px-6 lg:px-8 lg:pb-16 lg:pt-24">
          <div className="max-w-3xl">
            <Badge className="rounded-full bg-[#ffc800] px-3 py-1 text-black">Catalance Blog</Badge>
            <h1 className="mt-5 max-w-4xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Articles for teams that want sharper execution, not generic advice.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Practical writing on delivery systems, AI implementation, SEO, pricing, and client operations from the Catalance side of the table.
            </p>
          </div>

          <div className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search blog posts"
                className="h-12 rounded-full border-white/10 bg-white/[0.04] pl-11 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full px-4 py-2 text-sm transition ${selectedCategory === category ? "bg-[#ffc800] text-black" : "border border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:text-white"}`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center text-slate-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading blog posts...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-6 py-10 text-center text-sm text-red-200">
            {error}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
            <h2 className="text-2xl font-semibold">No posts match this filter</h2>
            <p className="mt-3 text-sm text-slate-400">Try another keyword or clear the category filter.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {featuredPost ? (
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_420px]">
                <Link
                  to={`/blog/${featuredPost.slug}`}
                  className="group overflow-hidden rounded-[2rem] border border-white/10 bg-[#121212] transition hover:border-[#ffc800]/40"
                >
                  <div className="grid h-full lg:grid-cols-[minmax(0,1fr)_280px]">
                    <div className="flex flex-col justify-between p-6 sm:p-8">
                      <div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                          <Badge variant="outline" className="border-[#ffc800]/30 text-[#ffc800]">{featuredPost.category}</Badge>
                          <span>{featuredPost.publishedLabel}</span>
                          <span>{featuredPost.readTime}</span>
                        </div>
                        <h2 className="mt-5 text-balance text-3xl font-semibold leading-tight sm:text-4xl">
                          {featuredPost.title}
                        </h2>
                        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
                          {featuredPost.excerpt}
                        </p>
                      </div>
                      <div className="mt-8 flex items-center gap-4 text-sm">
                        <span className="text-slate-400">{featuredPost.authorName}</span>
                        <span className="inline-flex items-center gap-2 text-[#ffc800]">
                          Read article
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </div>
                    <div className="min-h-[260px] overflow-hidden bg-[#1b1b1b]">
                      {featuredPost.coverImageUrl ? (
                        <img
                          src={featuredPost.coverImageUrl}
                          alt={featuredPost.coverImageAlt || featuredPost.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,200,0,0.2),_transparent_35%)] text-sm text-slate-500">
                          Featured article
                        </div>
                      )}
                    </div>
                  </div>
                </Link>

                <div className="grid gap-6">
                  {supportingPosts.slice(0, 2).map((post) => (
                    <Link
                      key={post.id}
                      to={`/blog/${post.slug}`}
                      className="group rounded-[1.75rem] border border-white/10 bg-[#101010] p-5 transition hover:border-white/20"
                    >
                      <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                        <span>{post.category}</span>
                        <span>{post.readTime}</span>
                      </div>
                      <h3 className="mt-4 text-xl font-semibold leading-tight text-white transition group-hover:text-[#ffc800]">
                        {post.title}
                      </h3>
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">
                        {post.excerpt}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {supportingPosts.slice(featuredPost ? 2 : 0).map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="group overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#101010] transition hover:border-[#ffc800]/30"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-[#171717]">
                    {post.coverImageUrl ? (
                      <img
                        src={post.coverImageUrl}
                        alt={post.coverImageAlt || post.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-[radial-gradient(circle,_rgba(255,200,0,0.2),_transparent_42%)] text-sm text-slate-500">
                        Catalance
                      </div>
                    )}
                  </div>
                  <div className="space-y-4 p-5">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                      <Badge variant="outline">{post.category}</Badge>
                      <span>{post.publishedLabel}</span>
                    </div>
                    <h3 className="text-xl font-semibold leading-tight text-white transition group-hover:text-[#ffc800]">
                      {post.title}
                    </h3>
                    <p className="line-clamp-3 text-sm leading-6 text-slate-400">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between pt-2 text-sm">
                      <span className="text-slate-400">{post.authorName}</span>
                      <span className="inline-flex items-center gap-2 text-[#ffc800]">
                        Read
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="border-t border-white/10 bg-[#0d0d0d]">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-12 sm:px-6 lg:flex-row lg:items-center lg:px-8">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#ffc800]">Need execution support?</p>
            <h2 className="mt-3 text-3xl font-semibold">Turn a blog insight into a shipped project.</h2>
          </div>
          <Button asChild className="rounded-full bg-[#ffc800] px-6 text-black hover:bg-[#ffd84d]">
            <Link to="/get-started">Start your Catalance project</Link>
          </Button>
        </div>
      </section>
    </main>
  );
};

export default Blog;
