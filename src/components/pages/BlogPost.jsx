import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Link, useParams } from "react-router-dom";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import Clock from "lucide-react/dist/esm/icons/clock";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import User from "lucide-react/dist/esm/icons/user";

import SeoMeta from "@/components/common/SeoMeta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { request } from "@/shared/lib/api-client";

const markdownClassName =
  "prose prose-invert max-w-none prose-headings:font-semibold prose-headings:text-white prose-p:text-slate-300 prose-p:leading-8 prose-li:text-slate-300 prose-li:leading-7 prose-a:text-[#ffc800] prose-strong:text-white prose-blockquote:border-l-[#ffc800] prose-blockquote:text-slate-300 prose-code:text-[#ffc800]";

const BlogPost = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    if (typeof window === "undefined") return `/blog/${slug || ""}`;
    return `${window.location.origin}/blog/${slug || ""}`;
  }, [post?.canonicalUrl, slug]);

  const jsonLd = post
    ? {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.seoDescription || post.excerpt,
        author: {
          "@type": "Person",
          name: post.authorName
        },
        datePublished: post.publishedAt,
        dateModified: post.publishedAt,
        image: post.ogImageUrl || post.coverImageUrl || undefined,
        mainEntityOfPage: canonicalUrl,
        articleSection: post.category
      }
    : null;

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#090909] text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading article...
      </main>
    );
  }

  if (!post) {
    return (
      <main className="min-h-[70vh] bg-[#090909] px-6 py-24 text-white">
        <div className="mx-auto flex max-w-3xl flex-col items-start gap-4 rounded-[2rem] border border-white/10 bg-white/[0.03] p-8">
          <Badge variant="outline">Blog</Badge>
          <h1 className="text-3xl font-semibold">Article not found</h1>
          <p className="text-slate-400">
            {error || "The article you are looking for does not exist or has moved."}
          </p>
          <Button asChild className="rounded-full bg-[#ffc800] text-black hover:bg-[#ffd84d]">
            <Link to="/blog">Back to blog</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#090909] text-white">
      <SeoMeta
        title={`${post.seoTitle || post.title} | Catalance`}
        description={post.seoDescription || post.excerpt}
        keywords={post.seoKeywords || []}
        canonicalUrl={canonicalUrl}
        image={post.ogImageUrl || post.coverImageUrl}
        type="article"
        jsonLd={jsonLd}
      />

      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,200,0,0.16),_transparent_32%)]">
        <div className="mx-auto max-w-6xl px-4 pb-12 pt-14 sm:px-6 lg:px-8 lg:pb-16 lg:pt-20">
          <Link
            to="/blog"
            className="inline-flex items-center text-sm text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to all articles
          </Link>

          <div className="mt-8 max-w-4xl">
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
              <Badge className="rounded-full bg-[#ffc800] px-3 py-1 text-black">{post.category}</Badge>
              <span className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {post.publishedLabel}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {post.readTime}
              </span>
              <span className="inline-flex items-center gap-2">
                <User className="h-4 w-4" />
                {post.authorName}
              </span>
            </div>
            <h1 className="mt-6 text-balance text-4xl font-semibold leading-tight sm:text-5xl">
              {post.title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              {post.excerpt}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_240px]">
          <article className="min-w-0">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#111111]">
              {post.coverImageUrl ? (
                <img
                  src={post.coverImageUrl}
                  alt={post.coverImageAlt || post.title}
                  className="h-[260px] w-full object-cover sm:h-[340px] lg:h-[440px]"
                />
              ) : (
                <div className="flex h-[260px] items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,200,0,0.2),_transparent_36%)] text-sm text-slate-500 sm:h-[340px] lg:h-[440px]">
                  Catalance blog
                </div>
              )}
            </div>

            <div className="mt-10 rounded-[2rem] border border-white/10 bg-[#101010] px-5 py-8 sm:px-8 lg:px-10">
              <div className={markdownClassName}>
                <ReactMarkdown>{post.content}</ReactMarkdown>
              </div>
            </div>
          </article>

          <aside className="space-y-5 lg:sticky lg:top-28 lg:h-fit">
            <div className="rounded-[1.75rem] border border-white/10 bg-[#101010] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">In this article</p>
              <div className="mt-4 space-y-3">
                {(post.headings || []).length > 0 ? (
                  post.headings.map((heading) => (
                    <p key={heading} className="text-sm leading-6 text-slate-300">
                      {heading}
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No section outline available.</p>
                )}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-[#121212] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[#ffc800]">Need support?</p>
              <h2 className="mt-3 text-xl font-semibold">Turn this idea into shipped work.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Catalance helps clients scope, hire, and deliver with freelancer-first systems.
              </p>
              <Button asChild className="mt-5 w-full rounded-full bg-[#ffc800] text-black hover:bg-[#ffd84d]">
                <Link to="/get-started">Start a project</Link>
              </Button>
            </div>
          </aside>
        </div>
      </section>

      {relatedPosts.length > 0 ? (
        <section className="border-t border-white/10 px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-[#ffc800]">More from Catalance</p>
                <h3 className="mt-2 text-3xl font-semibold">Related articles</h3>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  to={`/blog/${relatedPost.slug}`}
                  className="group overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#101010] transition hover:border-[#ffc800]/30"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-[#171717]">
                    {relatedPost.coverImageUrl ? (
                      <img
                        src={relatedPost.coverImageUrl}
                        alt={relatedPost.coverImageAlt || relatedPost.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-500">Catalance</div>
                    )}
                  </div>
                  <div className="space-y-3 p-5">
                    <Badge variant="outline">{relatedPost.category}</Badge>
                    <h4 className="text-lg font-semibold transition group-hover:text-[#ffc800]">
                      {relatedPost.title}
                    </h4>
                    <p className="text-sm leading-6 text-slate-400">
                      {relatedPost.excerpt}
                    </p>
                    <span className="inline-flex items-center gap-2 text-sm text-[#ffc800]">
                      Read article
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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
