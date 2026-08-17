import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import BookOpen from "lucide-react/dist/esm/icons/book-open";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import Check from "lucide-react/dist/esm/icons/check";
import Clock from "lucide-react/dist/esm/icons/clock";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import Eye from "lucide-react/dist/esm/icons/eye";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Globe from "lucide-react/dist/esm/icons/globe";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Lock from "lucide-react/dist/esm/icons/lock";
import Newspaper from "lucide-react/dist/esm/icons/newspaper";
import PenSquare from "lucide-react/dist/esm/icons/pen-square";
import Plus from "lucide-react/dist/esm/icons/plus";
import Search from "lucide-react/dist/esm/icons/search";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Star from "lucide-react/dist/esm/icons/star";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import User from "lucide-react/dist/esm/icons/user";
import { toast } from "sonner";

import SeoMeta from "@/components/common/SeoMeta";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/shared/context/AuthContext";
import { login as loginApi } from "@/shared/lib/api-client";

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "PUBLISHED", label: "Published" },
  { value: "DRAFT", label: "Drafts" },
  { value: "ARCHIVED", label: "Archived" }
];

const countWords = (text = "") =>
  String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

const parseAuthResponse = async (response, fallbackMessage) => {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error?.message || fallbackMessage);
  }
  return payload;
};

const formatDisplayDate = (value) => {
  if (!value) return "Draft";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Draft";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

const BlogManage = () => {
  const { user, isAuthenticated, authFetch, login: setAuthSession } = useAuth();
  const navigate = useNavigate();

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [deletingId, setDeletingId] = useState(null);

  // Guest login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const loadArticles = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await authFetch("/blogs/manage/all");
      const payload = await parseAuthResponse(res, "Failed to load articles");
      setArticles(Array.isArray(payload?.data) ? payload.data : []);
    } catch (err) {
      console.error("Could not load articles:", err);
      toast.error(err?.message || "Failed to load articles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      void loadArticles();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const handleInlineLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const authPayload = await loginApi({
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword
      });
      setAuthSession(authPayload?.user, authPayload?.accessToken);
      toast.success(`Welcome back, ${authPayload?.user?.fullName || "Author"}!`);
    } catch (err) {
      toast.error(err?.message || "Sign in failed. Check your email and password.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDeleteArticle = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    setDeletingId(id);
    try {
      const res = await authFetch(`/blogs/manage/${id}`, { method: "DELETE" });
      await parseAuthResponse(res, "Failed to delete article");
      toast.success("Article deleted");
      setArticles((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      toast.error(err?.message || "Failed to delete article");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredArticles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return articles.filter((b) => {
      if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
      if (categoryFilter !== "ALL" && b.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        b.title.toLowerCase().includes(q) ||
        b.slug.toLowerCase().includes(q) ||
        (b.category && b.category.toLowerCase().includes(q)) ||
        (b.authorName && b.authorName.toLowerCase().includes(q)) ||
        (b.excerpt && b.excerpt.toLowerCase().includes(q))
      );
    });
  }, [articles, search, statusFilter, categoryFilter]);

  const availableCategories = useMemo(() => {
    const set = new Set();
    articles.forEach((b) => {
      if (b.category) set.add(b.category);
    });
    return Array.from(set);
  }, [articles]);

  const stats = useMemo(() => ({
    total: articles.length,
    published: articles.filter((b) => b.status === "PUBLISHED").length,
    drafts: articles.filter((b) => b.status === "DRAFT").length,
    featured: articles.filter((b) => b.featured).length
  }), [articles]);

  if (!isAuthenticated) {
    return (
      <main className="min-h-[85vh] pt-28 pb-16 bg-background text-foreground flex items-center justify-center p-4">
        <SeoMeta title="Author Sign In | Catalance Blog" description="Sign in to view and manage your articles." />
        <Card className="w-full max-w-md rounded-[2.25rem] border border-border shadow-2xl overflow-hidden">
          <CardHeader className="text-center space-y-3 pb-6 pt-8 px-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <PenSquare className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Author Sign In</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Sign in with your Catalance account to manage your live and draft articles.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-8">
            <form onSubmit={handleInlineLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="text-xs font-semibold">Email ID</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="author@catalance.in"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="rounded-2xl h-11 text-xs"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="login-password" className="text-xs font-semibold">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="rounded-2xl h-11 text-xs"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-11 rounded-full text-xs font-bold gap-2 mt-2 shadow-sm" disabled={isLoggingIn}>
                {isLoggingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                Sign In to View Articles
              </Button>
            </form>
            <div className="mt-6 border-t border-border pt-4 text-center">
              <Link to="/blog" className="text-xs text-muted-foreground hover:text-foreground">
                &larr; Back to Public Blog
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground pt-24 sm:pt-28 pb-20">
      <SeoMeta title="Manage Articles & Cards | Catalance Blog" description="Manage all published and draft articles." />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Link to="/blog" className="hover:text-foreground transition flex items-center gap-1">
                <ArrowLeft className="h-3.5 w-3.5" /> Blog
              </Link>
              <span>/</span>
              <span className="font-semibold text-foreground">Article Management</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <Newspaper className="h-7 w-7 text-primary" />
              Live & Draft Blog Boxes
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              View all your blog posts in cards, inspect live links, and jump into the writer to edit or create articles.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button asChild variant="outline" size="sm" className="rounded-full text-xs h-10 px-4 gap-1.5">
              <Link to="/blog">
                <Globe className="h-4 w-4" />
                Public Blog
              </Link>
            </Button>
            <Button asChild size="sm" className="rounded-full text-xs font-bold h-10 px-5 gap-1.5 shadow-md">
              <Link to="/blog/write">
                <Plus className="h-4 w-4" />
                Write New Blog
              </Link>
            </Button>
          </div>
        </div>

        {/* Metric Stat Boxes */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-3xl border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-xs font-medium uppercase tracking-wider">Total Articles</CardDescription>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BookOpen className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-xs font-medium uppercase tracking-wider">Published Live</CardDescription>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <Check className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.published}</div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-xs font-medium uppercase tracking-wider">Drafts</CardDescription>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                <FileText className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{stats.drafts}</div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-xs font-medium uppercase tracking-wider">Featured</CardDescription>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Star className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold">{stats.featured}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-2 rounded-2xl border border-border">
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, keyword, category..."
              className="pl-9 h-10 text-xs rounded-xl border-none bg-muted/40"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 text-xs rounded-xl w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {availableCategories.length > 0 && (
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-10 text-xs rounded-xl w-36">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {availableCategories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Cards Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
            Loading articles...
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="rounded-[2.5rem] border border-dashed border-border bg-card p-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
              <Newspaper className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold">No articles found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {search || statusFilter !== "ALL"
                ? "No articles match your search criteria."
                : "You have not created any articles yet."}
            </p>
            <Button asChild className="mt-6 rounded-full text-xs font-bold px-6">
              <Link to="/blog/write">
                <Plus className="h-4 w-4 mr-1.5" />
                Create Your First Article
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map((blog) => {
              const words = countWords(blog.content);
              const readTime = `${Math.max(1, Math.ceil(words / 200))} min read`;

              return (
                <Card
                  key={blog.id}
                  className="group overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm hover:border-primary/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Cover Banner Container */}
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted/30">
                      {blog.coverImageUrl ? (
                        <img
                          src={blog.coverImageUrl}
                          alt={blog.coverImageAlt || blog.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-muted text-muted-foreground/50">
                          <BookOpen className="h-10 w-10 stroke-[1.5]" />
                        </div>
                      )}

                      {/* Top Badges */}
                      <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
                        <Badge className="bg-black/80 backdrop-blur-md text-white font-medium text-[10px] px-2.5 py-0.5 rounded-full border-none">
                          {blog.category || "Engineering"}
                        </Badge>
                        <Badge
                          variant={blog.status === "PUBLISHED" ? "default" : "secondary"}
                          className="text-[10px] uppercase font-semibold rounded-full shadow"
                        >
                          {blog.status}
                        </Badge>
                      </div>

                      {blog.featured ? (
                        <div className="absolute right-3 top-3">
                          <Badge className="bg-amber-500 text-black font-bold text-[10px] px-2 py-0.5 rounded-full shadow gap-1">
                            <Star className="h-3 w-3 fill-current" />
                            Featured
                          </Badge>
                        </div>
                      ) : null}
                    </div>

                    {/* Card Body */}
                    <CardHeader className="pb-3 pt-5 px-5">
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1.5">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDisplayDate(blog.publishedAt)}</span>
                        <span>&bull;</span>
                        <Clock className="h-3 w-3" />
                        <span>{readTime}</span>
                      </div>

                      <CardTitle className="text-base font-bold leading-snug tracking-tight line-clamp-2 group-hover:text-primary transition">
                        {blog.title}
                      </CardTitle>

                      <CardDescription className="text-xs text-muted-foreground line-clamp-2 mt-2 leading-relaxed">
                        {blog.excerpt || "No excerpt summary provided."}
                      </CardDescription>
                    </CardHeader>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="px-5 pb-5 pt-0">
                    <Separator className="mb-4" />

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-6 w-6 text-[10px] border border-border">
                          <AvatarFallback className="font-semibold bg-muted">
                            {(blog.authorName || "C")[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[11px] text-muted-foreground truncate font-medium max-w-[90px] sm:max-w-[110px]">
                          {blog.authorName || "Catalance"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {blog.status === "PUBLISHED" && blog.slug ? (
                          <Button asChild variant="secondary" size="sm" className="h-8 rounded-full px-3 text-xs gap-1">
                            <Link to={`/blog/${blog.slug}`} target="_blank">
                              <Eye className="h-3.5 w-3.5" />
                              Live
                            </Link>
                          </Button>
                        ) : null}

                        <Button asChild variant="outline" size="sm" className="h-8 rounded-full px-3 text-xs gap-1 font-semibold">
                          <Link to={`/blog/write?edit=${blog.id}`}>
                            <PenSquare className="h-3.5 w-3.5" />
                            Edit
                          </Link>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-full text-destructive hover:bg-destructive/10"
                          onClick={() => void handleDeleteArticle(blog.id, blog.title)}
                          disabled={deletingId === blog.id}
                          title="Delete article"
                        >
                          {deletingId === blog.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

export default BlogManage;
