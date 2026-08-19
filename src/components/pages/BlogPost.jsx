import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import Check from "lucide-react/dist/esm/icons/check";
import Clock from "lucide-react/dist/esm/icons/clock";
import Copy from "lucide-react/dist/esm/icons/copy";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import PenSquare from "lucide-react/dist/esm/icons/pen-square";
import Share2 from "lucide-react/dist/esm/icons/share-2";
import User from "lucide-react/dist/esm/icons/user";
import { toast } from "sonner";

import BlogMarkdown from "@/components/blog/BlogMarkdown";
import SeoMeta from "@/components/common/SeoMeta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/shared/context/AuthContext";
import { request } from "@/shared/lib/api-client";

const headingSlug = (text = "") =>
  String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const cleanHeadingText = (text = "") =>
  String(text || "")
    .replace(/^[•\s\d.-]+/, "")
    .trim();

const BlogPost = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState([]);

  const isAdmin = useMemo(() => {
    if (!user) return false;
    const role = String(user?.role || "").toUpperCase();
    const roles = Array.isArray(user?.roles) ? user.roles.map((r) => String(r).toUpperCase()) : [];
    return role === "ADMIN" || roles.includes("ADMIN") || roles.includes("SEO_TEAM") || roles.includes("BLOG_AUTHOR");
  }, [user]);

  useEffect(() => {
    let ignore = false;

    const loadBlogPost = async () => {
      if (!slug) return;
      setLoading(true);
      setError("");
      try {
        const data = await request(`/blogs/${slug}`);
        if (!ignore) {
          setPost(data?.post || null);
          setRelatedPosts(Array.isArray(data?.relatedPosts) ? data.relatedPosts : []);
        }
      } catch (nextError) {
        if (!ignore) {
          console.error("Failed to load blog post:", nextError);
          setError(nextError?.message || "Failed to load article");
          setPost(null);
          setRelatedPosts([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void loadBlogPost();

    return () => {
      ignore = true;
    };
  }, [slug]);

  const canonicalUrl = useMemo(() => {
    if (post?.canonicalUrl) return post.canonicalUrl;
    if (typeof window === "undefined") return `https://catalance.in/blog/${slug || ""}`;
    return `${window.location.origin}/blog/${slug || ""}`;
  }, [post?.canonicalUrl, slug]);

  const jsonLd = useMemo(() => {
    if (!post) return null;
    return {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
      image: post.ogImageUrl || post.coverImageUrl,
      datePublished: post.publishedAt,
      author: {
        "@type": "Person",
        name: post.authorName || "Catalance Editorial Team"
      },
      publisher: {
        "@type": "Organization",
        name: "Catalance",
        logo: {
          "@type": "ImageObject",
          url: "https://catalance.in/logo.png"
        }
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": canonicalUrl
      }
    };
  }, [canonicalUrl, post]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.excerpt,
          url
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Article link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-background text-muted-foreground pt-28">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
        Loading article...
      </main>
    );
  }

  if (!post) {
    return (
      <main className="min-h-[70vh] bg-background px-6 pt-32 pb-24 text-foreground">
        <div className="mx-auto flex max-w-3xl flex-col items-start gap-4 rounded-[2rem] border border-border bg-card p-8 dark:border-white/10">
          <Badge variant="outline">Catalance Blog</Badge>
          <h1 className="text-3xl font-bold">Article not found</h1>
          <p className="text-muted-foreground">
            {error || "The article you are looking for does not exist or has moved."}
          </p>
          <Button asChild className="rounded-full">
            <Link to="/blog">Back to all articles</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground pt-28 sm:pt-32 pb-24">
      <SeoMeta
        title={`${post.seoTitle || post.title} | Catalance`}
        description={post.seoDescription || post.excerpt}
        keywords={post.seoKeywords || []}
        canonicalUrl={canonicalUrl}
        image={post.ogImageUrl || post.coverImageUrl}
        type="article"
        jsonLd={jsonLd}
      />

      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 border-b border-border pb-10">
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            to="/blog"
            className="inline-flex items-center text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back to all articles
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 rounded-full text-xs"
              onClick={handleShare}
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Share"}
            </Button>
            {isAdmin ? (
              <Button asChild size="sm" className="h-8 gap-1.5 rounded-full text-xs font-semibold">
                <Link to={`/blog/write?edit=${post.id}`}>
                  <PenSquare className="h-3.5 w-3.5" />
                  Edit Article
                </Link>
              </Button>
            ) : null}
          </div>
        </div>

        <div className="max-w-4xl space-y-4">
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground">
            <Badge className="rounded-full bg-primary px-3 py-0.5 text-primary-foreground font-semibold text-[11px]">
              {post.category || "Engineering"}
            </Badge>
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {post.publishedLabel}
            </span>
            <span>&bull;</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {post.readTime}
            </span>
            <span>&bull;</span>
            <span className="inline-flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {post.authorName || "Catalance"}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
              {post.excerpt}
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] items-start">
          <article className="min-w-0 space-y-8">
            {post.coverImageUrl ? (
              <div className="flex flex-col items-center justify-center">
                <img
                  src={post.coverImageUrl}
                  alt={post.coverImageAlt || post.title}
                  className="w-full h-auto max-h-[620px] object-contain rounded-2xl sm:rounded-3xl shadow-sm"
                />
              </div>
            ) : null}

            <div className="rounded-[2.25rem] border border-border bg-card p-6 sm:p-10 shadow-sm">
              <BlogMarkdown content={post.content} />
            </div>
          </article>

          <aside className="space-y-6 lg:sticky lg:top-28">
            <div className="rounded-[2rem] border border-border bg-card p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <p className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Article Contents
                </p>
                {(post.headings || []).length > 0 && (
                  <Badge variant="secondary" className="text-[10px] h-5 px-2 rounded-full">
                    {post.headings.length}
                  </Badge>
                )}
              </div>

              <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
                {(post.headings || []).length > 0 ? (
                  post.headings.map((heading, idx) => {
                    const cleanText = cleanHeadingText(heading);
                    const anchorId = headingSlug(heading);

                    return (
                      <a
                        key={heading}
                        href={`#${anchorId}`}
                        onClick={(e) => {
                          e.preventDefault();
                          const el = document.getElementById(anchorId);
                          if (el) {
                            el.scrollIntoView({ behavior: "smooth" });
                          }
                        }}
                        className="group flex items-start gap-2.5 rounded-xl px-2.5 py-2 text-xs text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all leading-snug"
                      >
                        <span className="font-mono text-[10px] font-bold text-muted-foreground/60 group-hover:text-primary shrink-0 mt-0.5">
                          {String(idx + 1).padStart(2, "0")}.
                        </span>
                        <span className="font-medium group-hover:font-semibold line-clamp-2">
                          {cleanText}
                        </span>
                      </a>
                    );
                  })
                ) : (
                  <p className="text-xs text-muted-foreground italic py-2">
                    Comprehensive full article
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-border bg-gradient-to-br from-primary/10 via-card to-background p-6 shadow-sm space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Need Talented Teams?</span>
              <h3 className="text-base font-extrabold text-foreground leading-snug">Turn ideas into shipped deliverables.</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Catalance scopes, vets, and manages top freelancers to ensure timely, guaranteed project delivery.
              </p>
              <Button asChild className="w-full h-10 rounded-full text-xs font-bold shadow mt-2">
                <Link to="/service">Start a Project</Link>
              </Button>
            </div>
          </aside>
        </div>
      </section>
      {relatedPosts.length > 0 ? (
        <section className="border-t border-border px-4 py-14 sm:px-6 lg:px-8 dark:border-white/10">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">Keep Reading</p>
                <h3 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">Related Articles</h3>
              </div>
              <Button asChild variant="ghost" size="sm" className="gap-1">
                <Link to="/blog">
                  All articles
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  to={`/blog/${relatedPost.slug}`}
                  className="group flex flex-col overflow-hidden rounded-[1.75rem] border border-border bg-card transition hover:border-primary/40 hover:shadow-md dark:border-white/10 dark:bg-card"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-muted">
                    {relatedPost.coverImageUrl ? (
                      <img
                        src={relatedPost.coverImageUrl}
                        alt={relatedPost.coverImageAlt || relatedPost.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 text-xs font-medium text-primary">
                        Catalance
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-5 space-y-3">
                    <div>
                      <Badge variant="outline" className="text-xs font-medium">{relatedPost.category}</Badge>
                      <h4 className="mt-2 text-base font-bold leading-snug transition group-hover:text-primary">
                        {relatedPost.title}
                      </h4>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {relatedPost.excerpt}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary pt-2">
                      Read article
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
};

export default BlogPost;
