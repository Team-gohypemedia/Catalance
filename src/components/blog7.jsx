import { Link } from "react-router-dom";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

const isExternalHref = (href = "") => /^https?:\/\//i.test(href);

const BlogLink = ({ href, className, children, ...props }) => {
  if (isExternalHref(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className={className}
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <Link to={href} className={className} {...props}>
      {children}
    </Link>
  );
};

const Blog7 = ({
  tagline = "Latest Updates",
  heading = "Blog Posts",
  description = "Discover the latest trends, tips, and best practices in modern web development. From UI components to design systems, stay updated with our expert insights.",
  buttonText = "View all articles",
  buttonUrl = "https://shadcnblocks.com",

  posts = [
    {
      id: "post-1",
      slug: "getting-started-with-shadcn-ui",
      title: "Getting Started with shadcn/ui Components",
      summary:
        "Learn how to quickly integrate and customize shadcn/ui components in your Next.js projects. We'll cover installation, theming, and best practices for building modern interfaces.",
      label: "Tutorial",
      author: "Sarah Chen",
      published: "1 Jan 2024",
      url: "https://shadcnblocks.com",
      image: "/images/block/placeholder-dark-1.svg",
    },
    {
      id: "post-2",
      slug: "building-accessible-web-applications",
      title: "Building Accessible Web Applications",
      summary:
        "Explore how to create inclusive web experiences using shadcn/ui's accessible components. Discover practical tips for implementing ARIA labels, keyboard navigation, and semantic HTML.",
      label: "Accessibility",
      author: "Marcus Rodriguez",
      published: "1 Jan 2024",
      url: "https://shadcnblocks.com",
      image: "/images/block/placeholder-dark-1.svg",
    },
    {
      id: "post-3",
      slug: "design-systems-with-tailwind-css",
      title: "Modern Design Systems with Tailwind CSS",
      summary:
        "Dive into creating scalable design systems using Tailwind CSS and shadcn/ui. Learn how to maintain consistency while building flexible and maintainable component libraries.",
      label: "Design Systems",
      author: "Emma Thompson",
      published: "1 Jan 2024",
      url: "https://shadcnblocks.com",
      image: "/images/block/placeholder-dark-1.svg",
    },
  ]
}) => {
  const resolvedButtonUrl = buttonUrl || "/blog";

  return (
    <section className="py-32">
      <div className="container mx-auto flex flex-col items-center gap-16 lg:px-16">
        <div className="text-center">
          <Badge variant="secondary" className="mb-6">
            {tagline}
          </Badge>
          <h2
            className="mb-3 text-pretty text-3xl font-semibold md:mb-4 md:text-4xl lg:mb-6 lg:max-w-3xl lg:text-5xl">
            {heading}
          </h2>
          <p
            className="mb-8 text-muted-foreground md:text-base lg:max-w-2xl lg:text-lg">
            {description}
          </p>
          <Button variant="link" className="w-full sm:w-auto" asChild>
            <BlogLink href={resolvedButtonUrl} className="inline-flex items-center">
              <span>{buttonText}</span>
              <ArrowRight className="ml-2 size-4" />
            </BlogLink>
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {posts.map((post) => {
            const postUrl = post.url || `/blog/${post.slug}`;

            return (
              <Card key={post.id} className="grid grid-rows-[auto_auto_1fr_auto]">
                <div className="aspect-[16/9] w-full">
                  <BlogLink
                    href={postUrl}
                    className="block h-full w-full transition-opacity duration-200 fade-in hover:opacity-70"
                  >
                    <img
                      src={post.image}
                      alt={post.title}
                      className="h-full w-full object-cover object-center"
                    />
                  </BlogLink>
                </div>
                <CardHeader>
                  <h3 className="text-lg font-semibold hover:underline md:text-xl">
                    <BlogLink href={postUrl}>{post.title}</BlogLink>
                  </h3>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {post.summary}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {post.label ? <Badge variant="outline">{post.label}</Badge> : null}
                    {post.author ? <span>{post.author}</span> : null}
                    {post.published ? <span>{post.published}</span> : null}
                    {post.readTime ? <span>{post.readTime}</span> : null}
                  </div>
                </CardContent>
                <CardFooter>
                  <BlogLink
                    href={postUrl}
                    className="flex items-center text-foreground hover:underline"
                  >
                    Read more
                    <ArrowRight className="ml-2 size-4" />
                  </BlogLink>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export { Blog7 };
