import { Blog7 } from "@/components/blog7";
import { blogPosts } from "@/shared/data/blogPosts";

const landingPosts = blogPosts.map((post) => ({
  id: post.id,
  slug: post.slug,
  title: post.title,
  summary: post.summary,
  label: post.label,
  author: post.author,
  published: post.published,
  readTime: post.readTime,
  image: post.image,
}));

const Blog = () => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Blog7
        tagline="Catalance Insights"
        heading="Playbooks for modern freelancing teams"
        description="Six practical Catalance articles on delivery, pricing, client communication, and AI-first execution."
        buttonText="Start your Catalance project"
        buttonUrl="/get-started"
        posts={landingPosts}
      />
    </main>
  );
};

export default Blog;
