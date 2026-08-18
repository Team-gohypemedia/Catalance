import React, { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import Bold from "lucide-react/dist/esm/icons/bold";
import Check from "lucide-react/dist/esm/icons/check";
import Code from "lucide-react/dist/esm/icons/code";
import Columns from "lucide-react/dist/esm/icons/columns";
import Copy from "lucide-react/dist/esm/icons/copy";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import Eye from "lucide-react/dist/esm/icons/eye";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Globe from "lucide-react/dist/esm/icons/globe";
import Heading2 from "lucide-react/dist/esm/icons/heading-2";
import Heading3 from "lucide-react/dist/esm/icons/heading-3";
import ImagePlus from "lucide-react/dist/esm/icons/image-plus";
import Italic from "lucide-react/dist/esm/icons/italic";
import LinkIcon from "lucide-react/dist/esm/icons/link";
import List from "lucide-react/dist/esm/icons/list";
import ListOrdered from "lucide-react/dist/esm/icons/list-ordered";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Lock from "lucide-react/dist/esm/icons/lock";
import Newspaper from "lucide-react/dist/esm/icons/newspaper";
import PenSquare from "lucide-react/dist/esm/icons/pen-square";
import Plus from "lucide-react/dist/esm/icons/plus";
import Quote from "lucide-react/dist/esm/icons/quote";
import Settings2 from "lucide-react/dist/esm/icons/settings-2";
import Share2 from "lucide-react/dist/esm/icons/share-2";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import UploadCloud from "lucide-react/dist/esm/icons/upload-cloud";
import { toast } from "sonner";

import BlogMarkdown from "@/components/blog/BlogMarkdown";
import SeoMeta from "@/components/common/SeoMeta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/shared/context/AuthContext";
import { login as loginApi } from "@/shared/lib/api-client";

const SUGGESTED_CATEGORIES = [
  "Engineering",
  "Product & Scoping",
  "AI & Future of Work",
  "Freelance Tips",
  "Case Studies",
  "Design & UI",
  "SEO & Growth"
];

const EMPTY_BLOG_STATE = {
  id: "",
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category: "Engineering",
  authorName: "Catalance Editorial Team",
  coverImageUrl: "",
  coverImageAlt: "",
  status: "PUBLISHED",
  featured: false,
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  canonicalUrl: "",
  ogTitle: "",
  ogDescription: "",
  ogImageUrl: "",
  publishedAt: new Date().toISOString().slice(0, 10)
};

const slugify = (value = "") =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const formatDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

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

const BlogUpload = () => {
  const { user, isAuthenticated, authFetch, login: setAuthSession } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const editIdParam = searchParams.get("edit");

  const [form, setForm] = useState(EMPTY_BLOG_STATE);
  const [viewMode, setViewMode] = useState("split"); // "split" | "editor" | "preview"
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [seoDrawerOpen, setSeoDrawerOpen] = useState(false);
  const [liveSuccessPost, setLiveSuccessPost] = useState(null);
  const [copiedSuccessUrl, setCopiedSuccessUrl] = useState(false);

  // Admin / Author login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const wordCount = useMemo(() => countWords(form.content), [form.content]);
  const readTimeEstimate = useMemo(() => {
    const minutes = Math.max(1, Math.ceil(wordCount / 200));
    return `${minutes} min read`;
  }, [wordCount]);

  const setField = (field, value) => {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "title" && (!current.slug || current.slug === slugify(current.title))) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const isAuthorizedAuthor = useMemo(() => {
    if (!user) return false;
    const role = String(user?.role || "").toUpperCase();
    const roles = Array.isArray(user?.roles) ? user.roles.map((r) => String(r).toUpperCase()) : [];
    return (
      role === "ADMIN" ||
      role === "SEO_TEAM" ||
      role === "BLOG_AUTHOR" ||
      roles.includes("ADMIN") ||
      roles.includes("SEO_TEAM") ||
      roles.includes("BLOG_AUTHOR")
    );
  }, [user]);

  // Load article if editId is provided
  useEffect(() => {
    if (!isAuthenticated || !isAuthorizedAuthor || !editIdParam) return;
    const loadTarget = async () => {
      try {
        const res = await authFetch(`/blogs/manage/${editIdParam}`);
        const payload = await parseAuthResponse(res, "Failed to load article");
        const target = payload?.data;
        if (target) {
          setForm({
            id: target.id || "",
            title: target.title || "",
            slug: target.slug || "",
            excerpt: target.excerpt || "",
            content: target.content || "",
            category: target.category || "Engineering",
            authorName: target.authorName || "Catalance Editorial Team",
            coverImageUrl: target.coverImageUrl || "",
            coverImageAlt: target.coverImageAlt || "",
            status: target.status || "PUBLISHED",
            featured: Boolean(target.featured),
            seoTitle: target.seoTitle || "",
            seoDescription: target.seoDescription || "",
            seoKeywords: Array.isArray(target.seoKeywords) ? target.seoKeywords.join(", ") : "",
            canonicalUrl: target.canonicalUrl || "",
            ogTitle: target.ogTitle || "",
            ogDescription: target.ogDescription || "",
            ogImageUrl: target.ogImageUrl || "",
            publishedAt: formatDateInput(target.publishedAt) || new Date().toISOString().slice(0, 10)
          });
        }
      } catch (err) {
        console.error("Could not fetch target article:", err);
      }
    };
    void loadTarget();
  }, [isAuthenticated, isAuthorizedAuthor, editIdParam]);

  useEffect(() => {
    if (user?.fullName && !form.id && form.authorName === "Catalance Editorial Team") {
      setForm((curr) => ({ ...curr, authorName: user.fullName }));
    }
  }, [user]);

  const handleInlineLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const authPayload = await loginApi({
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword
      });
      const loggedUser = authPayload?.user;
      const role = String(loggedUser?.role || "").toUpperCase();
      const roles = Array.isArray(loggedUser?.roles) ? loggedUser.roles.map((r) => String(r).toUpperCase()) : [];
      const hasAccess = (
        role === "ADMIN" ||
        role === "SEO_TEAM" ||
        role === "BLOG_AUTHOR" ||
        roles.includes("ADMIN") ||
        roles.includes("SEO_TEAM") ||
        roles.includes("BLOG_AUTHOR")
      );
      if (!hasAccess) {
        toast.error("Access denied. Only Administrators and authorized blog authors can write articles. Please use admin credentials.");
        return;
      }
      setAuthSession(loggedUser, authPayload?.accessToken);
      toast.success(`Welcome back, ${loggedUser?.fullName || "Author"}!`);
    } catch (err) {
      toast.error(err?.message || "Sign in failed. Check your email and password.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleCoverUpload = async (file) => {
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await authFetch("/upload/project-image", {
        method: "POST",
        body: data
      });
      const payload = await parseAuthResponse(res, "Image upload failed");
      const url = String(payload?.data?.url || "").trim();
      if (!url) throw new Error("No image URL returned");

      setField("coverImageUrl", url);
      if (!form.ogImageUrl) setField("ogImageUrl", url);
      toast.success("Cover image uploaded to R2");
    } catch (err) {
      toast.error(err?.message || "Failed to upload image.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const insertMarkdown = (prefix, suffix = "") => {
    const textarea = document.getElementById("blog-writer-textarea");
    if (!textarea) return;

    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const selected = form.content.substring(start, end) || "text";
    const replacement = `${prefix}${selected}${suffix}`;

    const newContent =
      form.content.substring(0, start) + replacement + form.content.substring(end);
    setField("content", newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selected.length
      );
    }, 50);
  };

  const handleSaveBlog = async (overrideStatus) => {
    if (!isAuthorizedAuthor) {
      toast.error("You are not authorized to save or publish articles. Only Administrators and authorized authors have permission.");
      return;
    }
    if (!form.title.trim()) {
      toast.error("Please enter a title for your blog.");
      return;
    }
    if (!form.content.trim()) {
      toast.error("Please write article content before saving.");
      return;
    }

    setIsSaving(true);
    try {
      const statusToSave = overrideStatus || form.status || "PUBLISHED";
      const payload = {
        ...form,
        status: statusToSave,
        slug: slugify(form.slug || form.title),
        seoKeywords: form.seoKeywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
        publishedAt: form.publishedAt
          ? new Date(`${form.publishedAt}T00:00:00`).toISOString()
          : new Date().toISOString()
      };

      const res = await authFetch("/blogs/manage", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      const result = await parseAuthResponse(res, "Failed to save blog post");
      const saved = result?.data;

      if (!saved?.id) throw new Error("Invalid response received");

      setForm((curr) => ({
        ...curr,
        id: saved.id,
        slug: saved.slug,
        status: saved.status
      }));

      if (statusToSave === "PUBLISHED") {
        setLiveSuccessPost({
          ...form,
          id: saved.id,
          slug: saved.slug,
          status: "PUBLISHED"
        });
        toast.success("Article published live on Catalance!");
      } else {
        toast.success("Draft saved successfully!");
      }
    } catch (err) {
      toast.error(err?.message || "Failed to save article.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartNew = () => {
    setForm({
      ...EMPTY_BLOG_STATE,
      authorName: user?.fullName || "Catalance Editorial Team",
      publishedAt: new Date().toISOString().slice(0, 10)
    });
    setSearchParams({});
    toast.info("Created new blank article.");
  };

  if (!isAuthenticated || !isAuthorizedAuthor) {
    return (
      <main className="min-h-[85vh] pt-28 pb-16 bg-background text-foreground flex items-center justify-center p-4">
        <SeoMeta
          title="Admin & Author Sign In | Catalance Blog"
          description="Log in with admin credentials to author, edit, and publish SEO-optimized articles on Catalance."
        />
        <Card className="w-full max-w-md rounded-[2.25rem] border border-border shadow-2xl overflow-hidden">
          <CardHeader className="text-center space-y-2 pb-6 pt-8 px-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Lock className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Admin & Author Sign In</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-8">
            <form onSubmit={handleInlineLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="text-xs font-semibold">Admin / Author Email ID</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="admin@catalance.in"
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
                Sign In with Admin Credentials
              </Button>
            </form>
            <div className="mt-6 border-t border-border pt-4 flex items-center justify-between text-xs text-muted-foreground">
              <Link to="/blog" className="hover:text-foreground">
                &larr; Public Blog
              </Link>
              <Link to="/" className="hover:text-foreground">
                Go to Home &rarr;
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground pt-28 sm:pt-32 pb-24 flex flex-col">
      <SeoMeta
        title={form.title ? `Editing: ${form.title} | Catalance Writer` : "Write & Upload Blog | Catalance"}
        description="Dedicated blog writing and live preview studio."
      />

      <div className="mx-auto max-w-[1600px] w-full px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Action Bar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm" className="h-9 px-3 rounded-full text-xs gap-1.5">
              <Link to="/blog/manage">
                <ArrowLeft className="h-3.5 w-3.5" />
                All Articles
              </Link>
            </Button>
            <span className="text-muted-foreground/40">|</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm truncate max-w-[200px] sm:max-w-[350px]">
                {form.title || "Untitled Article"}
              </span>
              <Badge variant={form.status === "PUBLISHED" ? "default" : "outline"} className="text-[10px] uppercase">
                {form.status}
              </Badge>
            </div>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center rounded-full border border-border bg-card p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                viewMode === "split"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Columns className="h-3.5 w-3.5" />
              <span>Write & Live Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("editor")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                viewMode === "editor"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <PenSquare className="h-3.5 w-3.5" />
              <span>Write Only</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                viewMode === "preview"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Preview</span>
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            {form.id && form.slug && form.status === "PUBLISHED" ? (
              <Button asChild variant="outline" size="sm" className="hidden sm:flex h-9 rounded-full text-xs gap-1.5">
                <Link to={`/blog/${form.slug}`} target="_blank">
                  <Globe className="h-3.5 w-3.5" />
                  Live Article
                </Link>
              </Button>
            ) : null}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSeoDrawerOpen(true)}
              className="h-9 rounded-full text-xs gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>SEO & Meta</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleSaveBlog("DRAFT")}
              disabled={isSaving}
              className="h-9 rounded-full text-xs gap-1.5"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
              <span>Save Draft</span>
            </Button>

            <Button
              size="sm"
              onClick={() => handleSaveBlog("PUBLISHED")}
              disabled={isSaving}
              className="h-9 rounded-full text-xs font-bold gap-1.5 px-4 shadow-sm"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              <span>{form.status === "PUBLISHED" && form.id ? "Update Live" : "Publish Article"}</span>
            </Button>
          </div>
        </div>

        {/* Studio Workspace Layout */}
        <div className="grid gap-8 lg:grid-cols-2 items-start">
          {/* ========================================================================= */}
          {/* LEFT WRITER PANEL                                                         */}
          {/* ========================================================================= */}
          {(viewMode === "editor" || viewMode === "split") && (
            <div
              className={`space-y-6 ${
                viewMode === "editor" ? "lg:col-span-2 max-w-4xl mx-auto w-full" : ""
              }`}
            >
              {/* Cover Image Link & Alt Section with Upload Button */}
              <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <ImagePlus className="h-4 w-4 text-primary" />
                    Cover Image
                  </Label>
                  {form.coverImageUrl && (
                    <button
                      type="button"
                      onClick={() => setField("coverImageUrl", "")}
                      className="text-[11px] text-destructive hover:underline font-medium"
                    >
                      Remove Cover
                    </button>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Image Link or Upload</Label>
                    <div className="flex gap-2">
                      <Input
                        value={form.coverImageUrl}
                        onChange={(e) => setField("coverImageUrl", e.target.value)}
                        placeholder="Paste URL or upload image"
                        className="rounded-xl h-10 text-xs font-mono flex-1"
                      />
                      <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-3.5 h-10 text-xs font-semibold shrink-0 shadow-sm hover:bg-primary/90 transition">
                        {isUploadingImage ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <UploadCloud className="h-3.5 w-3.5" />
                        )}
                        <span>{isUploadingImage ? "Uploading..." : "Upload"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isUploadingImage}
                          onChange={(e) => void handleCoverUpload(e.target.files?.[0])}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Image Alt Text (SEO)</Label>
                    <Input
                      value={form.coverImageAlt}
                      onChange={(e) => setField("coverImageAlt", e.target.value)}
                      placeholder="Descriptive explanation for Google SEO"
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>
                </div>

                {/* Live Cover Preview Thumbnail */}
                {form.coverImageUrl ? (
                  <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl border border-border bg-muted/50 mt-2">
                    <img
                      src={form.coverImageUrl}
                      alt={form.coverImageAlt || "Cover Preview"}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    💡 Click <strong>Upload</strong> to pick an image from your device or paste any direct link (Unsplash, CDN).
                  </p>
                )}
              </div>

              {/* Headline */}
              <div className="space-y-1">
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  placeholder="Article Headline..."
                  className="w-full bg-transparent text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight placeholder:text-muted-foreground/40 outline-none border-b border-border/60 pb-3 focus:border-primary transition"
                />
              </div>

              {/* Category selector & Author */}
              <div className="space-y-3 rounded-2xl border border-border p-4 bg-muted/20">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Category</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_CATEGORIES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setField("category", c)}
                        className={`text-xs px-3 py-1 rounded-full border transition ${
                          form.category === c
                            ? "bg-primary text-primary-foreground border-primary font-medium"
                            : "bg-background border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 pt-1">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-muted-foreground">Author</Label>
                    <Input
                      value={form.authorName}
                      onChange={(e) => setField("authorName", e.target.value)}
                      placeholder="Author name"
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-muted-foreground">URL Slug</Label>
                    <Input
                      value={form.slug}
                      onChange={(e) => setField("slug", slugify(e.target.value))}
                      placeholder="article-slug"
                      className="rounded-xl h-9 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Subtitle / Excerpt */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Subtitle / Excerpt
                </Label>
                <Textarea
                  value={form.excerpt}
                  onChange={(e) => setField("excerpt", e.target.value)}
                  placeholder="A clear 1-2 sentence hook for cards and search results..."
                  className="min-h-[70px] rounded-2xl text-xs resize-none"
                />
              </div>

              {/* Markdown Toolbar */}
              <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-border bg-muted/40 p-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => insertMarkdown("## ")}
                  className="p-1.5 rounded-lg hover:bg-background transition"
                  title="Heading 2"
                >
                  <Heading2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown("### ")}
                  className="p-1.5 rounded-lg hover:bg-background transition"
                  title="Heading 3"
                >
                  <Heading3 className="h-4 w-4" />
                </button>
                <div className="h-4 w-px bg-border mx-1" />
                <button
                  type="button"
                  onClick={() => insertMarkdown("**", "**")}
                  className="p-1.5 rounded-lg hover:bg-background transition"
                  title="Bold"
                >
                  <Bold className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown("*", "*")}
                  className="p-1.5 rounded-lg hover:bg-background transition"
                  title="Italic"
                >
                  <Italic className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown("> ")}
                  className="p-1.5 rounded-lg hover:bg-background transition"
                  title="Quote"
                >
                  <Quote className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown("```\n", "\n```")}
                  className="p-1.5 rounded-lg hover:bg-background transition"
                  title="Code Block"
                >
                  <Code className="h-4 w-4" />
                </button>
                <div className="h-4 w-px bg-border mx-1" />
                <button
                  type="button"
                  onClick={() => insertMarkdown("- ")}
                  className="p-1.5 rounded-lg hover:bg-background transition"
                  title="Bullet List"
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown("1. ")}
                  className="p-1.5 rounded-lg hover:bg-background transition"
                  title="Numbered List"
                >
                  <ListOrdered className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown("[", "](https://catalance.in)")}
                  className="p-1.5 rounded-lg hover:bg-background transition"
                  title="Link"
                >
                  <LinkIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Main Markdown Textarea */}
              <div className="space-y-1">
                <Textarea
                  id="blog-writer-textarea"
                  value={form.content}
                  onChange={(e) => setField("content", e.target.value)}
                  placeholder={`# Introduction\n\nWrite your article in Markdown here. Use headings, bullet lists, and code blocks...`}
                  className="min-h-[480px] font-mono text-xs leading-relaxed rounded-2xl p-5 border-border focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* RIGHT LIVE RENDERED PREVIEW PANEL                                         */}
          {/* ========================================================================= */}
          {(viewMode === "split" || viewMode === "preview") && (
            <div
              className={`sticky top-28 space-y-6 ${
                viewMode === "preview" ? "lg:col-span-2 max-w-4xl mx-auto w-full" : ""
              }`}
            >
              <div className="rounded-[2.25rem] border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
                {/* Live Rendered Cover Image */}
                {form.coverImageUrl ? (
                  <div className="overflow-hidden rounded-2xl aspect-[21/9] w-full bg-muted">
                    <img
                      src={form.coverImageUrl}
                      alt={form.coverImageAlt || form.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : null}

                {/* Live Rendered Header */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge className="rounded-full bg-primary px-2.5 py-0.5 text-primary-foreground font-medium text-[11px]">
                      {form.category || "Engineering"}
                    </Badge>
                    <span>{form.publishedAt || "Today"}</span>
                    <span>&bull;</span>
                    <span>{readTimeEstimate}</span>
                    <span>&bull;</span>
                    <span>By {form.authorName || "Catalance"}</span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    {form.title || "Untitled Article"}
                  </h1>

                  {form.excerpt && (
                    <p className="text-base text-muted-foreground leading-relaxed">
                      {form.excerpt}
                    </p>
                  )}
                </div>

                <Separator />

                {/* Rendered Markdown Body */}
                <div className="pt-1">
                  {form.content ? (
                    <BlogMarkdown content={form.content} />
                  ) : (
                    <p className="text-xs text-muted-foreground italic py-16 text-center">
                      Live preview renders here in real time as you write on the left...
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SEO & Social Metadata Drawer/Modal */}
      {seoDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in">
          <Card className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[2.25rem] border border-border shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4 pt-6 px-6">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  SEO & Social Metadata
                </CardTitle>
                <CardDescription className="text-xs">
                  Optimize your article for search rankings and social media cards.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full h-8 w-8 p-0"
                onClick={() => setSeoDrawerOpen(false)}
              >
                &times;
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              {/* SERP Snippet Preview */}
              <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Google Search Snippet Preview
                </p>
                <p className="font-mono text-xs text-muted-foreground truncate">
                  https://catalance.in/blog/{form.slug || "slug"}
                </p>
                <p className="text-sm font-semibold text-primary truncate">
                  {form.seoTitle || form.title || "Article Title Preview"}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {form.seoDescription || form.excerpt || "Add description for search snippet..."}
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <Label className="text-xs font-semibold">SEO Title Tag</Label>
                    <span className="text-muted-foreground text-[11px]">
                      {(form.seoTitle || form.title || "").length}/60 chars
                    </span>
                  </div>
                  <Input
                    value={form.seoTitle}
                    onChange={(e) => setField("seoTitle", e.target.value)}
                    placeholder={form.title || "Search Title"}
                    className="rounded-xl h-10 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <Label className="text-xs font-semibold">SEO Meta Description</Label>
                    <span className="text-muted-foreground text-[11px]">
                      {(form.seoDescription || form.excerpt || "").length}/160 chars
                    </span>
                  </div>
                  <Textarea
                    value={form.seoDescription}
                    onChange={(e) => setField("seoDescription", e.target.value)}
                    placeholder={form.excerpt || "Meta description under 160 chars..."}
                    className="rounded-xl min-h-[70px] text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Keywords (Comma Separated)</Label>
                  <Input
                    value={form.seoKeywords}
                    onChange={(e) => setField("seoKeywords", e.target.value)}
                    placeholder="react, freelance growth, engineering teams"
                    className="rounded-xl h-10 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Canonical URL</Label>
                  <Input
                    value={form.canonicalUrl}
                    onChange={(e) => setField("canonicalUrl", e.target.value)}
                    placeholder="https://catalance.in/blog/your-slug"
                    className="rounded-xl h-10 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <Button className="rounded-full text-xs" onClick={() => setSeoDrawerOpen(false)}>
                  Apply Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LIVE PUBLISHED ARTICLE SUCCESS CARD MODAL                                 */}
      {/* ========================================================================= */}
      {liveSuccessPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in">
          <Card className="w-full max-w-lg rounded-[2.5rem] border border-border bg-card shadow-2xl overflow-hidden text-foreground">
            <CardHeader className="flex flex-row items-start justify-between border-b border-border pb-4 pt-6 px-6 sm:px-8">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live on Website
                </div>
                <CardTitle className="text-xl font-extrabold tracking-tight">
                  Article Published Successfully!
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Your article is now live and indexed on the public Catalance blog.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full h-8 w-8 p-0"
                onClick={() => setLiveSuccessPost(null)}
              >
                &times;
              </Button>
            </CardHeader>

            <CardContent className="p-6 sm:p-8 space-y-5">
              {/* Published Article Card Preview */}
              <div className="overflow-hidden rounded-2xl border border-border bg-muted/30 shadow-sm">
                {liveSuccessPost.coverImageUrl && (
                  <div className="aspect-[21/9] w-full overflow-hidden bg-black">
                    <img
                      src={liveSuccessPost.coverImageUrl}
                      alt={liveSuccessPost.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary text-primary-foreground text-[10px] rounded-full px-2 py-0.5">
                      {liveSuccessPost.category || "Engineering"}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      By {liveSuccessPost.authorName || "Catalance"}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold leading-snug line-clamp-2">
                    {liveSuccessPost.title}
                  </h3>
                  {liveSuccessPost.excerpt && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {liveSuccessPost.excerpt}
                    </p>
                  )}
                </div>
              </div>

              {/* URL Link & Copy Bar */}
              <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background p-2 px-3">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-semibold uppercase text-muted-foreground block">
                    Live Public URL
                  </span>
                  <span className="text-xs font-mono text-primary truncate block">
                    {window.location.origin}/blog/{liveSuccessPost.slug}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 rounded-lg text-xs gap-1.5 shrink-0"
                  onClick={() => {
                    const url = `${window.location.origin}/blog/${liveSuccessPost.slug}`;
                    navigator.clipboard.writeText(url);
                    setCopiedSuccessUrl(true);
                    setTimeout(() => setCopiedSuccessUrl(false), 2000);
                  }}
                >
                  {copiedSuccessUrl ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span>{copiedSuccessUrl ? "Copied!" : "Copy Link"}</span>
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Button asChild className="w-full h-11 rounded-full text-xs font-bold gap-2 shadow-md">
                  <Link to={`/blog/${liveSuccessPost.slug}`} target="_blank">
                    <Globe className="h-4 w-4" />
                    Open Live Article on Website
                    <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                  </Link>
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    asChild
                    variant="outline"
                    className="h-10 rounded-full text-xs font-semibold gap-1.5"
                  >
                    <Link to="/blog/manage">
                      <Newspaper className="h-3.5 w-3.5" />
                      All Article Cards
                    </Link>
                  </Button>

                  <Button
                    variant="secondary"
                    className="h-10 rounded-full text-xs font-semibold gap-1.5"
                    onClick={() => {
                      setLiveSuccessPost(null);
                      handleStartNew();
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Write Next Blog
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
};

export default BlogUpload;
