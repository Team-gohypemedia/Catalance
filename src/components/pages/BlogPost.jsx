import { Link, useParams } from "react-router-dom";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import Clock from "lucide-react/dist/esm/icons/clock";
import User from "lucide-react/dist/esm/icons/user";
import Calendar from "lucide-react/dist/esm/icons/calendar";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { blogPosts, getBlogPostBySlug } from "@/shared/data/blogPosts";

const BlogPost = () => {
  const { slug } = useParams();
  const post = getBlogPostBySlug(slug || "");

  if (!post) {
    return (
      <main className="min-h-[70vh] bg-background px-6 py-24 text-foreground">
        <div className="mx-auto flex max-w-3xl flex-col items-start gap-4">
          <Badge variant="outline">Blog</Badge>
          <h1 className="text-3xl font-semibold">Article not found</h1>
          <p className="text-muted-foreground">
            The article you are looking for does not exist or has moved.
          </p>
          <Button asChild>
            <Link to="/blog">Back to blog</Link>
          </Button>
        </div>
      </main>
    );
  }

  const relatedPosts = blogPosts
    .filter((candidate) => candidate.slug !== post.slug)
    .slice(0, 3);

  return (
    <main className="bg-background text-foreground">
      <article className="mx-auto max-w-4xl px-6 pb-20 pt-14">
        <Link
          to="/blog"
          className="mb-8 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to all articles
        </Link>

        <div className="mb-8">
          <Badge className="mb-4">{post.label}</Badge>
          <h1 className="mb-4 text-balance text-3xl font-semibold leading-tight md:text-5xl">
            {post.title}
          </h1>
          <p className="mb-6 max-w-3xl text-lg text-muted-foreground">
            {post.summary}
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center">
              <User className="mr-2 h-4 w-4" />
              {post.author}
            </span>
            <span className="inline-flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              {post.published}
            </span>
            <span className="inline-flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              {post.readTime}
            </span>
          </div>
        </div>

        <img
          src={post.image}
          alt={post.title}
          className="mb-10 h-[320px] w-full rounded-2xl object-cover md:h-[420px]"
        />

        <div className="space-y-8">
          <p className="text-lg leading-relaxed text-muted-foreground">
            {post.content.intro}
          </p>

          {post.content.sections.map((section) => (
            <section key={section.heading} className="space-y-3">
              <h2 className="text-2xl font-semibold">{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p
                  key={`${section.heading}-${paragraph.slice(0, 24)}`}
                  className="leading-relaxed text-muted-foreground"
                >
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </article>

      <section className="border-t border-border/60 px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <h3 className="mb-8 text-2xl font-semibold">Related articles</h3>
          <div className="grid gap-6 md:grid-cols-3">
            {relatedPosts.map((relatedPost) => (
              <Link
                key={relatedPost.id}
                to={`/blog/${relatedPost.slug}`}
                className="group rounded-xl border border-border/60 p-5 transition-colors hover:border-primary/40"
              >
                <Badge variant="outline" className="mb-3">
                  {relatedPost.label}
                </Badge>
                <h4 className="mb-2 text-lg font-medium transition-colors group-hover:text-primary">
                  {relatedPost.title}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {relatedPost.summary}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default BlogPost;
