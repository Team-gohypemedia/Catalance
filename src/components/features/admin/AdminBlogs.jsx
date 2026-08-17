import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import Bold from "lucide-react/dist/esm/icons/bold";
import BookOpen from "lucide-react/dist/esm/icons/book-open";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import Check from "lucide-react/dist/esm/icons/check";
import Clock from "lucide-react/dist/esm/icons/clock";
import Code from "lucide-react/dist/esm/icons/code";
import Copy from "lucide-react/dist/esm/icons/copy";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import Eye from "lucide-react/dist/esm/icons/eye";
import EyeOff from "lucide-react/dist/esm/icons/eye-off";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Globe from "lucide-react/dist/esm/icons/globe";
import Heading2 from "lucide-react/dist/esm/icons/heading-2";
import Heading3 from "lucide-react/dist/esm/icons/heading-3";
import ImagePlus from "lucide-react/dist/esm/icons/image-plus";
import Italic from "lucide-react/dist/esm/icons/italic";
import KeyRound from "lucide-react/dist/esm/icons/key-round";
import LinkIcon from "lucide-react/dist/esm/icons/link";
import List from "lucide-react/dist/esm/icons/list";
import ListOrdered from "lucide-react/dist/esm/icons/list-ordered";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Lock from "lucide-react/dist/esm/icons/lock";
import Newspaper from "lucide-react/dist/esm/icons/newspaper";
import PenSquare from "lucide-react/dist/esm/icons/pen-square";
import Plus from "lucide-react/dist/esm/icons/plus";
import Quote from "lucide-react/dist/esm/icons/quote";
import Search from "lucide-react/dist/esm/icons/search";
import Settings2 from "lucide-react/dist/esm/icons/settings-2";
import Share2 from "lucide-react/dist/esm/icons/share-2";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Star from "lucide-react/dist/esm/icons/star";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import UploadCloud from "lucide-react/dist/esm/icons/upload-cloud";
import User from "lucide-react/dist/esm/icons/user";
import UserPlus from "lucide-react/dist/esm/icons/user-plus";
import Users from "lucide-react/dist/esm/icons/users";
import { toast } from "sonner";

import AdminLayout from "./AdminLayout";
import { AdminTopBar } from "./AdminTopBar";
import BlogMarkdown from "@/components/blog/BlogMarkdown";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/shared/context/AuthContext";

const EMPTY_BLOG = {
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

const SUGGESTED_CATEGORIES = [
  "Engineering",
  "Product & Scoping",
  "AI & Future of Work",
  "Freelance Tips",
  "Case Studies",
  "Design & UI",
  "SEO & Growth"
];

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "PUBLISHED", label: "Published" },
  { value: "DRAFT", label: "Drafts" },
  { value: "ARCHIVED", label: "Archived" }
];

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

const countWords = (text = "") =>
  String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

const generateRandomPassword = () => {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*";
  let pass = "";
  for (let i = 0; i < 12; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
};

const parseAuthResponse = async (response, fallbackMessage) => {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error?.message || fallbackMessage);
  }
  return payload;
};

const AdminBlogs = () => {
  const { authFetch } = useAuth();
  const [activeTab, setActiveTab] = useState("blogs"); // "blogs" | "seo-team"
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const deferredSearch = useDeferredValue(search);

  // Modals / Drawers state
  const [viewingBlog, setViewingBlog] = useState(null); // When non-null, shows full reader/preview modal
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_BLOG);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editorSubTab, setEditorSubTab] = useState("content"); // "content" | "seo" | "preview"

  // SEO Team State
  const [seoMembers, setSeoMembers] = useState([]);
  const [loadingSeoTeam, setLoadingSeoTeam] = useState(false);
  const [seoModalOpen, setSeoModalOpen] = useState(false);
  const [newSeoName, setNewSeoName] = useState("");
  const [newSeoEmail, setNewSeoEmail] = useState("");
  const [newSeoPassword, setNewSeoPassword] = useState("");
  const [newSeoDesignation, setNewSeoDesignation] = useState("SEO Specialist");
  const [showPassword, setShowPassword] = useState(false);
  const [isCreatingSeoUser, setIsCreatingSeoUser] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [copiedKey, setCopiedKey] = useState("");

  // Reset Password State
  const [resetTarget, setResetTarget] = useState(null);
  const [resetPasswordVal, setResetPasswordVal] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Load all blogs
  const loadBlogs = async () => {
    setLoading(true);
    try {
      const response = await authFetch("/admin/blogs");
      const payload = await parseAuthResponse(response, "Failed to load blogs");
      setBlogs(Array.isArray(payload?.data) ? payload.data : []);
    } catch (err) {
      console.error("Failed to load blogs:", err);
      toast.error(err?.message || "Failed to load blogs");
    } finally {
      setLoading(false);
    }
  };

  // Load SEO team accounts
  const loadSeoTeam = async () => {
    setLoadingSeoTeam(true);
    try {
      const response = await authFetch("/admin/seo-team");
      const payload = await parseAuthResponse(response, "Failed to load SEO team");
      setSeoMembers(Array.isArray(payload?.data) ? payload.data : []);
    } catch (err) {
      console.error("Failed to load SEO team:", err);
    } finally {
      setLoadingSeoTeam(false);
    }
  };

  useEffect(() => {
    void loadBlogs();
  }, []);

  useEffect(() => {
    if (activeTab === "seo-team") {
      void loadSeoTeam();
    }
  }, [activeTab]);

  // Derived filtered blogs
  const filteredBlogs = useMemo(() => {
    const query = String(deferredSearch || "").trim().toLowerCase();
    return blogs.filter((blog) => {
      if (statusFilter !== "ALL" && blog.status !== statusFilter) return false;
      if (categoryFilter !== "ALL" && blog.category !== categoryFilter) return false;
      if (!query) return true;
      return (
        blog.title.toLowerCase().includes(query) ||
        blog.slug.toLowerCase().includes(query) ||
        (blog.category && blog.category.toLowerCase().includes(query)) ||
        (blog.authorName && blog.authorName.toLowerCase().includes(query)) ||
        (blog.excerpt && blog.excerpt.toLowerCase().includes(query))
      );
    });
  }, [blogs, deferredSearch, statusFilter, categoryFilter]);

  // Derived category list
  const availableCategories = useMemo(() => {
    const set = new Set();
    blogs.forEach((b) => {
      if (b.category) set.add(b.category);
    });
    return Array.from(set);
  }, [blogs]);

  // Stats
  const stats = useMemo(() => ({
    total: blogs.length,
    published: blogs.filter((b) => b.status === "PUBLISHED").length,
    drafts: blogs.filter((b) => b.status === "DRAFT").length,
    featured: blogs.filter((b) => b.featured).length,
    seoTeamCount: seoMembers.length
  }), [blogs, seoMembers]);

  const setField = (key, value) => {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "title" && (!current.slug || current.slug === slugify(current.title))) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  // Open Editor for Creating New
  const handleOpenCreate = () => {
    setForm({
      ...EMPTY_BLOG,
      publishedAt: new Date().toISOString().slice(0, 10)
    });
    setEditorSubTab("content");
    setEditorOpen(true);
  };

  // Open Editor for Existing Blog
  const handleOpenEdit = (blog) => {
    setForm({
      id: blog.id || "",
      title: blog.title || "",
      slug: blog.slug || "",
      excerpt: blog.excerpt || "",
      content: blog.content || "",
      category: blog.category || "Engineering",
      authorName: blog.authorName || "Catalance Editorial Team",
      coverImageUrl: blog.coverImageUrl || "",
      coverImageAlt: blog.coverImageAlt || "",
      status: blog.status || "PUBLISHED",
      featured: Boolean(blog.featured),
      seoTitle: blog.seoTitle || "",
      seoDescription: blog.seoDescription || "",
      seoKeywords: Array.isArray(blog.seoKeywords) ? blog.seoKeywords.join(", ") : "",
      canonicalUrl: blog.canonicalUrl || "",
      ogTitle: blog.ogTitle || "",
      ogDescription: blog.ogDescription || "",
      ogImageUrl: blog.ogImageUrl || "",
      publishedAt: formatDateInput(blog.publishedAt) || new Date().toISOString().slice(0, 10)
    });
    setEditorSubTab("content");
    setEditorOpen(true);
  };

  // Upload Cover Image to Cloudflare R2
  const handleCoverUpload = async (file) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await authFetch("/upload/project-image", {
        method: "POST",
        body: data
      });
      const payload = await parseAuthResponse(res, "Image upload failed");
      const url = String(payload?.data?.url || "").trim();
      if (!url) throw new Error("No URL returned");

      setField("coverImageUrl", url);
      if (!form.ogImageUrl) setField("ogImageUrl", url);
      toast.success("Cover image uploaded to R2");
    } catch (err) {
      toast.error(err?.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  // Insert markdown helpers
  const insertMarkdown = (prefix, suffix = "") => {
    const textarea = document.getElementById("admin-markdown-editor");
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

  // Save Blog
  const handleSaveBlog = async (overrideStatus) => {
    if (!form.title.trim()) {
      toast.error("Please enter an article title");
      return;
    }
    if (!form.content.trim()) {
      toast.error("Please add article content");
      return;
    }

    setSaving(true);
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

      const res = await authFetch("/admin/blogs", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      const result = await parseAuthResponse(res, "Failed to save blog");
      const saved = result?.data;
      if (!saved?.id) throw new Error("Invalid response received");

      toast.success(form.id ? "Article updated successfully!" : "Article published live!");
      setEditorOpen(false);
      void loadBlogs();
    } catch (err) {
      toast.error(err?.message || "Failed to save article");
    } finally {
      setSaving(false);
    }
  };

  // Delete Blog
  const handleDeleteBlog = async (blog) => {
    if (!window.confirm(`Delete "${blog.title}"? This cannot be undone.`)) return;

    setDeletingId(blog.id);
    try {
      const res = await authFetch(`/admin/blogs/${blog.id}`, { method: "DELETE" });
      await parseAuthResponse(res, "Failed to delete blog");
      toast.success("Article deleted");
      if (viewingBlog?.id === blog.id) setViewingBlog(null);
      void loadBlogs();
    } catch (err) {
      toast.error(err?.message || "Failed to delete blog");
    } finally {
      setDeletingId(null);
    }
  };

  // SEO Team User Creation
  const handleCreateSeoMember = async (e) => {
    e.preventDefault();
    if (!newSeoName.trim() || !newSeoEmail.trim() || !newSeoPassword.trim()) {
      toast.error("Please fill in Name, Email, and Password");
      return;
    }

    setIsCreatingSeoUser(true);
    try {
      const payload = {
        fullName: newSeoName.trim(),
        email: newSeoEmail.trim().toLowerCase(),
        password: newSeoPassword.trim(),
        designation: newSeoDesignation.trim()
      };

      const res = await authFetch("/admin/seo-team", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      await parseAuthResponse(res, "Failed to create SEO user");

      setCreatedCredentials({
        fullName: newSeoName.trim(),
        email: newSeoEmail.trim().toLowerCase(),
        password: newSeoPassword.trim()
      });

      toast.success(`SEO Team account created for ${newSeoName}!`);
      setNewSeoName("");
      setNewSeoEmail("");
      setNewSeoPassword("");
      void loadSeoTeam();
    } catch (err) {
      toast.error(err?.message || "Failed to create SEO account");
    } finally {
      setIsCreatingSeoUser(false);
    }
  };

  // Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetTarget || !resetPasswordVal.trim()) return;

    setIsResettingPassword(true);
    try {
      const res = await authFetch(`/admin/seo-team/${resetTarget.id}`, {
        method: "PATCH",
        body: JSON.stringify({ password: resetPasswordVal.trim() })
      });
      await parseAuthResponse(res, "Failed to reset password");
      toast.success(`Password updated for ${resetTarget.fullName}!`);
      setResetTarget(null);
      setResetPasswordVal("");
    } catch (err) {
      toast.error(err?.message || "Failed to reset password");
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Delete SEO member
  const handleDeleteSeoMember = async (member) => {
    if (!window.confirm(`Delete SEO account for "${member.fullName}" (${member.email})?`)) return;
    try {
      const res = await authFetch(`/admin/seo-team/${member.id}`, { method: "DELETE" });
      await parseAuthResponse(res, "Failed to delete account");
      toast.success("SEO Account deleted");
      void loadSeoTeam();
    } catch (err) {
      toast.error(err?.message || "Failed to delete account");
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedKey(""), 2500);
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background text-foreground pb-20">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8">
          {/* Top Bar with Breadcrumbs & Notifications */}
          <AdminTopBar label="Blog CMS & SEO Hub" />

          {/* Dedicated Page Header & Action Bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                <Newspaper className="h-6 w-6 text-primary" />
                Blog CMS & SEO Management
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage public articles, optimize search ranking metadata, and create author accounts.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button asChild variant="outline" size="sm" className="rounded-full gap-1.5 text-xs h-9">
                <Link to="/blog" target="_blank">
                  <Globe className="h-3.5 w-3.5" />
                  View Public Blog
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="rounded-full gap-1.5 text-xs h-9">
                <Link to="/blog/write" target="_blank">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Standalone Writer
                </Link>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full gap-1.5 text-xs font-semibold h-9 shadow-sm"
                onClick={() => {
                  setCreatedCredentials(null);
                  setNewSeoPassword(generateRandomPassword());
                  setSeoModalOpen(true);
                }}
              >
                <UserPlus className="h-3.5 w-3.5 text-primary" />
                + Create Author / SEO ID
              </Button>
              <Button
                size="sm"
                onClick={handleOpenCreate}
                className="rounded-full gap-1.5 text-xs font-semibold h-9 shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                Create Blog
              </Button>
            </div>
          </div>

          {/* Top Analytics Boxes (Metric Cards) */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-3xl border-border bg-card shadow-sm hover:border-primary/40 transition">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-xs font-medium uppercase tracking-wider">Total Articles</CardDescription>
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <BookOpen className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold">{stats.total}</div>
                <p className="text-[11px] text-muted-foreground mt-1">Managed blog publications</p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border bg-card shadow-sm hover:border-emerald-500/40 transition">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-xs font-medium uppercase tracking-wider">Published Live</CardDescription>
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                  <Check className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.published}</div>
                <p className="text-[11px] text-muted-foreground mt-1">Indexed and live on /blog</p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border bg-card shadow-sm hover:border-amber-500/40 transition">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-xs font-medium uppercase tracking-wider">Drafts</CardDescription>
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                  <FileText className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{stats.drafts}</div>
                <p className="text-[11px] text-muted-foreground mt-1">Unpublished work in progress</p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border bg-card shadow-sm hover:border-primary/40 transition">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-xs font-medium uppercase tracking-wider">Featured Hero</CardDescription>
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Star className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold">{stats.featured}</div>
                <p className="text-[11px] text-muted-foreground mt-1">Highlighted on homepage</p>
              </CardContent>
            </Card>
          </section>

          {/* Section Navigation Tabs & Action Bar */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <Button
                variant={activeTab === "blogs" ? "default" : "outline"}
                size="sm"
                className="rounded-full text-xs font-semibold gap-1.5"
                onClick={() => setActiveTab("blogs")}
              >
                <Newspaper className="h-3.5 w-3.5" />
                All Articles ({blogs.length})
              </Button>
              <Button
                variant={activeTab === "seo-team" ? "default" : "outline"}
                size="sm"
                className="rounded-full text-xs font-semibold gap-1.5"
                onClick={() => setActiveTab("seo-team")}
              >
                <Users className="h-3.5 w-3.5" />
                Author & SEO Logins ({seoMembers.length})
              </Button>
            </div>

            {activeTab === "blogs" && (
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                {/* Search Bar */}
                <div className="relative flex-1 sm:w-64">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search articles..."
                    className="pl-9 h-9 text-xs rounded-full"
                  />
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 w-32 text-xs rounded-full">
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

                {/* Category Filter */}
                {availableCategories.length > 0 && (
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-9 w-36 text-xs rounded-full">
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
            )}

            {activeTab === "seo-team" && (
              <Button
                size="sm"
                className="rounded-full text-xs font-semibold gap-1.5 ml-auto"
                onClick={() => {
                  setCreatedCredentials(null);
                  setNewSeoPassword(generateRandomPassword());
                  setSeoModalOpen(true);
                }}
              >
                <UserPlus className="h-3.5 w-3.5" />
                + Create SEO Member Account
              </Button>
            )}
          </div>

          {/* TAB 1: BLOGS CARDS / BOXES VIEW */}
          {activeTab === "blogs" && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
                  Loading blog posts...
                </div>
              ) : filteredBlogs.length === 0 ? (
                <div className="rounded-[2.5rem] border border-dashed border-border bg-card/50 p-16 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
                    <Newspaper className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-bold">No articles found</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    {search || statusFilter !== "ALL" || categoryFilter !== "ALL"
                      ? "No articles match your active filter criteria."
                      : "Start growing your organic search presence by publishing your first article."}
                  </p>
                  <Button onClick={handleOpenCreate} className="mt-6 rounded-full text-xs gap-1.5 font-semibold">
                    <Plus className="h-4 w-4" />
                    Create Your First Blog Post
                  </Button>
                </div>
              ) : (
                /* THE BOXES / CARDS GRID */
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredBlogs.map((blog) => {
                    const words = countWords(blog.content);
                    const readTime = `${Math.max(1, Math.ceil(words / 200))} min read`;

                    return (
                      <Card
                        key={blog.id}
                        className="group overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm hover:border-primary/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                      >
                        <div>
                          {/* Image Box Container */}
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

                            {/* Top Badges Floating on Card Image */}
                            <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
                              <Badge className="bg-black/80 backdrop-blur-md text-white font-medium text-[10px] px-2.5 py-0.5 rounded-full border-none">
                                {blog.category || "Insights"}
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

                          {/* Content Section */}
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

                        {/* Card Bottom Footer with Actions */}
                        <div className="px-5 pb-5 pt-0">
                          <Separator className="mb-4" />

                          <div className="flex items-center justify-between gap-2">
                            {/* Author pill */}
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

                            {/* Box Action Buttons */}
                            <div className="flex items-center gap-1.5">
                              {/* View / Inspect Blog Button */}
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-8 rounded-full px-3 text-xs gap-1.5 font-medium shadow-none hover:bg-primary hover:text-primary-foreground transition"
                                onClick={() => setViewingBlog(blog)}
                                title="View full article and inspect SEO"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                View
                              </Button>

                              {/* Edit Blog Button */}
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 rounded-full px-3 text-xs gap-1.5 font-medium"
                                onClick={() => handleOpenEdit(blog)}
                                title="Edit article in CMS"
                              >
                                <PenSquare className="h-3.5 w-3.5" />
                                Edit
                              </Button>

                              {/* Delete Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-full text-destructive hover:bg-destructive/10"
                                onClick={() => void handleDeleteBlog(blog)}
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
          )}

          {/* TAB 2: SEO TEAM LOGINS & PASSWORDS */}
          {activeTab === "seo-team" && (
            <div className="space-y-6">
              <Card className="rounded-[2.5rem] border border-border bg-card shadow-sm">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
                  <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      SEO Team Accounts & Credentials
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Create login IDs and passwords for your SEO specialists and blog writers so they can write and publish articles.
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    className="rounded-full text-xs font-semibold gap-1.5 shadow-sm"
                    onClick={() => {
                      setCreatedCredentials(null);
                      setNewSeoPassword(generateRandomPassword());
                      setSeoModalOpen(true);
                    }}
                  >
                    <UserPlus className="h-4 w-4" />
                    + Add New SEO Member
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {loadingSeoTeam ? (
                    <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
                      Loading SEO team accounts...
                    </div>
                  ) : seoMembers.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-border p-12 text-center">
                      <Users className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                      <h3 className="text-base font-semibold">No dedicated SEO team accounts yet</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Click the button above to generate login ID & password for your SEO writers.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {seoMembers.map((member) => (
                        <Card key={member.id} className="rounded-3xl border-border bg-muted/20 hover:border-primary/40 transition flex flex-col justify-between">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <Badge
                                variant={member.status === "ACTIVE" ? "default" : "destructive"}
                                className="text-[10px]"
                              >
                                {member.status}
                              </Badge>
                              <span className="text-[11px] text-muted-foreground">
                                {new Date(member.createdAt).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric"
                                })}
                              </span>
                            </div>
                            <CardTitle className="text-base font-bold truncate">{member.fullName}</CardTitle>
                            <div className="flex items-center justify-between font-mono text-xs text-primary bg-background/80 px-3 py-1.5 rounded-xl border border-border mt-2">
                              <span className="truncate">{member.email}</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(member.email, `mail-${member.id}`)}
                                className="text-muted-foreground hover:text-foreground ml-1"
                                title="Copy Email ID"
                              >
                                {copiedKey === `mail-${member.id}` ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </CardHeader>
                          <CardFooter className="pt-0 flex items-center justify-between border-t border-border mt-2 pt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-full text-xs gap-1.5 h-8"
                              onClick={() => {
                                setResetTarget(member);
                                setResetPasswordVal(generateRandomPassword());
                              }}
                            >
                              <KeyRound className="h-3 w-3" />
                              Reset Password
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive rounded-full h-8 w-8 p-0"
                              onClick={() => void handleDeleteSeoMember(member)}
                              title="Delete account"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODAL 1: VIEW & PREVIEW FULL BLOG POST (READER & SEO INSPECTOR)            */}
          {/* ========================================================================= */}
          {viewingBlog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 sm:p-6 animate-in fade-in overflow-y-auto">
              <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-[2.5rem] border border-border bg-card shadow-2xl text-foreground">
                {/* Modal Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur px-6 py-4 rounded-t-[2.5rem]">
                  <div className="flex items-center gap-2">
                    <Badge variant={viewingBlog.status === "PUBLISHED" ? "default" : "outline"} className="text-xs uppercase">
                      {viewingBlog.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">
                      /blog/{viewingBlog.slug}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {viewingBlog.status === "PUBLISHED" && (
                      <Button asChild size="sm" variant="outline" className="rounded-full text-xs gap-1.5 h-8">
                        <Link to={`/blog/${viewingBlog.slug}`} target="_blank">
                          <ExternalLink className="h-3.5 w-3.5" />
                          View Live Article
                        </Link>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="rounded-full text-xs gap-1.5 h-8 font-semibold"
                      onClick={() => {
                        const target = viewingBlog;
                        setViewingBlog(null);
                        handleOpenEdit(target);
                      }}
                    >
                      <PenSquare className="h-3.5 w-3.5" />
                      Edit Post
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full h-8 w-8 p-0"
                      onClick={() => setViewingBlog(null)}
                    >
                      &times;
                    </Button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 sm:p-10 space-y-8">
                  {/* Banner Image */}
                  {viewingBlog.coverImageUrl ? (
                    <div className="overflow-hidden rounded-3xl aspect-[21/9] w-full bg-muted">
                      <img
                        src={viewingBlog.coverImageUrl}
                        alt={viewingBlog.coverImageAlt || viewingBlog.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : null}

                  {/* Article Title & Metadata */}
                  <div className="space-y-4 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <Badge className="rounded-full bg-primary px-3 py-1 text-primary-foreground font-medium">
                        {viewingBlog.category || "Insights"}
                      </Badge>
                      <span>{formatDisplayDate(viewingBlog.publishedAt)}</span>
                      <span>&bull;</span>
                      <span>By {viewingBlog.authorName || "Catalance"}</span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                      {viewingBlog.title}
                    </h1>

                    <p className="text-base text-muted-foreground leading-relaxed">
                      {viewingBlog.excerpt}
                    </p>
                  </div>

                  {/* Rendered Markdown Body */}
                  <div className="border-t border-border pt-8">
                    <BlogMarkdown content={viewingBlog.content} />
                  </div>

                  {/* SEO Metadata Box */}
                  <div className="rounded-3xl border border-border bg-muted/20 p-6 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Attached SEO & Social Meta
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 text-xs">
                      <div>
                        <span className="text-muted-foreground block">Meta Title:</span>
                        <span className="font-semibold">{viewingBlog.seoTitle || viewingBlog.title}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Canonical URL:</span>
                        <span className="font-mono">{viewingBlog.canonicalUrl || `https://catalance.in/blog/${viewingBlog.slug}`}</span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-muted-foreground block">Meta Description:</span>
                        <span>{viewingBlog.seoDescription || viewingBlog.excerpt || "Default post excerpt"}</span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-muted-foreground block">Keywords:</span>
                        <span className="font-medium">
                          {Array.isArray(viewingBlog.seoKeywords)
                            ? viewingBlog.seoKeywords.join(", ")
                            : "None configured"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODAL 2: FULL ARTICLE EDITOR (WRITE, PREVIEW, SEO)                          */}
          {/* ========================================================================= */}
          {editorOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 sm:p-6 animate-in fade-in overflow-y-auto">
              <div className="relative w-full max-w-5xl max-h-[94vh] overflow-y-auto rounded-[2.5rem] border border-border bg-card shadow-2xl text-foreground flex flex-col justify-between">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur px-6 py-4 rounded-t-[2.5rem]">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg font-bold">
                      {form.id ? "Edit Blog Post" : "Create New Blog Post"}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="rounded-full text-xs gap-1.5"
                      onClick={() => handleSaveBlog("DRAFT")}
                      disabled={saving}
                    >
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                      Save Draft
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-full text-xs font-semibold gap-1.5 shadow-sm"
                      onClick={() => handleSaveBlog("PUBLISHED")}
                      disabled={saving}
                    >
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                      {form.status === "PUBLISHED" && form.id ? "Update Live" : "Publish Live"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full h-8 w-8 p-0"
                      onClick={() => setEditorOpen(false)}
                    >
                      &times;
                    </Button>
                  </div>
                </div>

                {/* Sub-tabs: Content vs SEO vs Preview */}
                <div className="px-6 pt-4 border-b border-border">
                  <Tabs value={editorSubTab} onValueChange={setEditorSubTab} className="w-full">
                    <TabsList className="rounded-full bg-muted/50 p-1">
                      <TabsTrigger value="content" className="rounded-full px-4 text-xs font-semibold gap-1.5">
                        <PenSquare className="h-3.5 w-3.5" />
                        Article Content
                      </TabsTrigger>
                      <TabsTrigger value="seo" className="rounded-full px-4 text-xs font-semibold gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" />
                        SEO & Social Metadata
                      </TabsTrigger>
                      <TabsTrigger value="preview" className="rounded-full px-4 text-xs font-semibold gap-1.5">
                        <Eye className="h-3.5 w-3.5" />
                        Live Preview
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Editor Content Area */}
                <div className="p-6 space-y-6">
                  {/* TAB 1: ARTICLE CONTENT */}
                  {editorSubTab === "content" && (
                    <div className="space-y-6">
                      {/* Cover Image */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Cover Image Banner</Label>
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                          {form.coverImageUrl ? (
                            <div className="relative aspect-[16/9] w-48 overflow-hidden rounded-2xl border border-border bg-black">
                              <img src={form.coverImageUrl} alt="Cover" className="h-full w-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setField("coverImageUrl", "")}
                                className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white hover:bg-red-600"
                              >
                                &times;
                              </button>
                            </div>
                          ) : null}

                          <div className="flex-1 space-y-2 w-full">
                            <div className="flex gap-2">
                              <Input
                                value={form.coverImageUrl}
                                onChange={(e) => setField("coverImageUrl", e.target.value)}
                                placeholder="Paste image URL (https://...) or upload directly"
                                className="rounded-xl h-10 text-xs flex-1"
                              />
                              <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 shrink-0">
                                {uploadingImage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
                                {uploadingImage ? "Uploading..." : "Upload to R2"}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  disabled={uploadingImage}
                                  onChange={(e) => void handleCoverUpload(e.target.files?.[0])}
                                />
                              </label>
                            </div>
                            <Input
                              value={form.coverImageAlt}
                              onChange={(e) => setField("coverImageAlt", e.target.value)}
                              placeholder="Cover image alt text (for accessibility and SEO ranking)"
                              className="rounded-xl h-9 text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Main Title */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Article Title</Label>
                        <Input
                          value={form.title}
                          onChange={(e) => setField("title", e.target.value)}
                          placeholder="e.g. Scaling Managed Engineering Teams in 2026"
                          className="rounded-xl text-lg font-bold h-12"
                        />
                      </div>

                      {/* URL Slug & Category */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">URL Slug</Label>
                          <Input
                            value={form.slug}
                            onChange={(e) => setField("slug", slugify(e.target.value))}
                            placeholder="article-slug"
                            className="rounded-xl h-10 text-xs font-mono"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Category</Label>
                          <Input
                            value={form.category}
                            onChange={(e) => setField("category", e.target.value)}
                            placeholder="e.g. Engineering, AI..."
                            className="rounded-xl h-10 text-xs"
                          />
                          <div className="flex flex-wrap gap-1 pt-1">
                            {SUGGESTED_CATEGORIES.map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setField("category", c)}
                                className={`text-[10px] px-2 py-0.5 rounded-full border transition ${
                                  form.category === c
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-muted/40 border-border text-muted-foreground"
                                }`}
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Author & Publish Date & Featured */}
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Author Name</Label>
                          <Input
                            value={form.authorName}
                            onChange={(e) => setField("authorName", e.target.value)}
                            placeholder="Catalance Editorial Team"
                            className="rounded-xl h-10 text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Publish Date</Label>
                          <Input
                            type="date"
                            value={form.publishedAt}
                            onChange={(e) => setField("publishedAt", e.target.value)}
                            className="rounded-xl h-10 text-xs"
                          />
                        </div>
                        <div className="space-y-1.5 flex flex-col justify-end">
                          <div className="flex items-center justify-between rounded-xl border border-border p-2.5 bg-muted/20">
                            <span className="text-xs font-semibold">Featured on Top</span>
                            <Switch checked={form.featured} onCheckedChange={(val) => setField("featured", val)} />
                          </div>
                        </div>
                      </div>

                      {/* Excerpt */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Excerpt / Subtitle</Label>
                        <Textarea
                          value={form.excerpt}
                          onChange={(e) => setField("excerpt", e.target.value)}
                          placeholder="Brief 1-2 sentence hook for cards, social share, and search snippets..."
                          className="min-h-[70px] rounded-2xl text-xs"
                        />
                      </div>

                      {/* Markdown Toolbar & Content Area */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold">Article Body (Markdown)</Label>
                          <span className="text-[11px] text-muted-foreground">{countWords(form.content)} words</span>
                        </div>

                        {/* Toolbar */}
                        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-muted/40 p-1 text-xs">
                          <button
                            type="button"
                            onClick={() => insertMarkdown("## ")}
                            className="p-1.5 rounded-lg hover:bg-background"
                            title="H2"
                          >
                            <Heading2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertMarkdown("### ")}
                            className="p-1.5 rounded-lg hover:bg-background"
                            title="H3"
                          >
                            <Heading3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertMarkdown("**", "**")}
                            className="p-1.5 rounded-lg hover:bg-background"
                            title="Bold"
                          >
                            <Bold className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertMarkdown("*", "*")}
                            className="p-1.5 rounded-lg hover:bg-background"
                            title="Italic"
                          >
                            <Italic className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertMarkdown("> ")}
                            className="p-1.5 rounded-lg hover:bg-background"
                            title="Quote"
                          >
                            <Quote className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertMarkdown("```\n", "\n```")}
                            className="p-1.5 rounded-lg hover:bg-background"
                            title="Code"
                          >
                            <Code className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertMarkdown("- ")}
                            className="p-1.5 rounded-lg hover:bg-background"
                            title="List"
                          >
                            <List className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertMarkdown("1. ")}
                            className="p-1.5 rounded-lg hover:bg-background"
                            title="Numbered"
                          >
                            <ListOrdered className="h-4 w-4" />
                          </button>
                        </div>

                        <Textarea
                          id="admin-markdown-editor"
                          value={form.content}
                          onChange={(e) => setField("content", e.target.value)}
                          placeholder={`# Heading\n\nWrite article content here...`}
                          className="min-h-[350px] font-mono text-xs leading-relaxed rounded-2xl p-4"
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 2: SEO & METADATA */}
                  {editorSubTab === "seo" && (
                    <div className="space-y-6">
                      <div className="rounded-2xl border border-border bg-muted/40 p-4">
                        <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                          Google Search Snippet Preview
                        </p>
                        <p className="font-mono text-[11px] text-muted-foreground truncate">
                          https://catalance.in/blog/{form.slug || "slug"}
                        </p>
                        <p className="text-sm font-semibold text-primary truncate mt-0.5">
                          {form.seoTitle || form.title || "Article Title"}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {form.seoDescription || form.excerpt || "Add description for search snippet."}
                        </p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label className="text-xs">Custom SEO Title</Label>
                          <Input
                            value={form.seoTitle}
                            onChange={(e) => setField("seoTitle", e.target.value)}
                            placeholder={form.title || "Search Engine Title"}
                            className="rounded-xl h-10 text-xs"
                          />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label className="text-xs">SEO Meta Description</Label>
                          <Textarea
                            value={form.seoDescription}
                            onChange={(e) => setField("seoDescription", e.target.value)}
                            placeholder={form.excerpt || "Description for search engines..."}
                            className="rounded-xl min-h-[70px] text-xs"
                          />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label className="text-xs">Keywords (Comma separated)</Label>
                          <Input
                            value={form.seoKeywords}
                            onChange={(e) => setField("seoKeywords", e.target.value)}
                            placeholder="engineering scaling, ai development, project management"
                            className="rounded-xl h-10 text-xs"
                          />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label className="text-xs">Canonical URL</Label>
                          <Input
                            value={form.canonicalUrl}
                            onChange={(e) => setField("canonicalUrl", e.target.value)}
                            placeholder="https://catalance.in/blog/your-slug"
                            className="rounded-xl h-10 text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: LIVE PREVIEW */}
                  {editorSubTab === "preview" && (
                    <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-6">
                      {form.coverImageUrl && (
                        <div className="overflow-hidden rounded-2xl aspect-[21/9] w-full bg-muted">
                          <img src={form.coverImageUrl} alt="Preview" className="h-full w-full object-cover" />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Badge>{form.category}</Badge>
                        <h2 className="text-3xl font-extrabold">{form.title || "Untitled Article"}</h2>
                        <p className="text-muted-foreground">{form.excerpt}</p>
                      </div>
                      <Separator />
                      <BlogMarkdown content={form.content} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODAL 3: CREATE SEO TEAM MEMBER                                            */}
          {/* ========================================================================= */}
          {seoModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in">
              <Card className="w-full max-w-lg rounded-[2.25rem] border border-border bg-card shadow-2xl overflow-hidden text-foreground">
                <CardHeader className="flex flex-row items-start justify-between border-b border-border pb-4 pt-6 px-6 sm:px-8">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <UserPlus className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-xl font-bold tracking-tight">
                        {createdCredentials ? "Account Credentials" : "Create Author / SEO ID"}
                      </CardTitle>
                    </div>
                    <CardDescription className="text-xs text-muted-foreground pl-11">
                      {createdCredentials
                        ? "Share these login details with your team member."
                        : "Generate login credentials to grant article publishing access."}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setCreatedCredentials(null);
                      setSeoModalOpen(false);
                    }}
                  >
                    &times;
                  </Button>
                </CardHeader>

                <CardContent className="p-6 sm:p-8 space-y-6">
                  {createdCredentials ? (
                    <div className="space-y-5 animate-in fade-in duration-300">
                      {/* Success Pill */}
                      <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-emerald-600 dark:text-emerald-400">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white text-xs font-bold">
                          ✓
                        </div>
                        <div className="text-xs">
                          <p className="font-bold">Account created successfully!</p>
                          <p className="text-[11px] opacity-90">
                            Active for <strong>{createdCredentials.fullName}</strong>
                          </p>
                        </div>
                      </div>

                      {/* Credentials Display Card */}
                      <div className="space-y-2.5 rounded-2xl border border-border bg-muted/30 p-4">
                        {/* Email Row */}
                        <div className="flex items-center justify-between gap-3 rounded-xl bg-background px-3.5 py-2.5 border border-border/70">
                          <div className="min-w-0">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                              Login Email
                            </span>
                            <span className="font-mono text-xs font-semibold text-foreground truncate block">
                              {createdCredentials.email}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2.5 rounded-lg text-xs gap-1 shrink-0 text-muted-foreground hover:text-foreground"
                            onClick={() => copyToClipboard(createdCredentials.email, "cred-email")}
                          >
                            {copiedKey === "cred-email" ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                            <span className="hidden sm:inline">{copiedKey === "cred-email" ? "Copied" : "Copy"}</span>
                          </Button>
                        </div>

                        {/* Password Row */}
                        <div className="flex items-center justify-between gap-3 rounded-xl bg-background px-3.5 py-2.5 border border-border/70">
                          <div className="min-w-0">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                              Password
                            </span>
                            <span className="font-mono text-xs font-semibold text-foreground truncate block">
                              {showPassword ? createdCredentials.password : "••••••••••••"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-lg text-muted-foreground"
                              onClick={() => setShowPassword(!showPassword)}
                              title={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2.5 rounded-lg text-xs gap-1 text-muted-foreground hover:text-foreground"
                              onClick={() => copyToClipboard(createdCredentials.password, "cred-pass")}
                            >
                              {copiedKey === "cred-pass" ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                              <span className="hidden sm:inline">{copiedKey === "cred-pass" ? "Copied" : "Copy"}</span>
                            </Button>
                          </div>
                        </div>

                        {/* Portal Row */}
                        <div className="flex items-center justify-between gap-3 rounded-xl bg-background px-3.5 py-2.5 border border-border/70">
                          <div className="min-w-0">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                              Writer Portal
                            </span>
                            <span className="text-xs font-semibold text-primary truncate block">
                              {window.location.origin}/blog/write
                            </span>
                          </div>
                          <Button asChild variant="ghost" size="sm" className="h-8 px-2.5 rounded-lg text-xs gap-1 shrink-0 text-primary">
                            <Link to="/blog/write" target="_blank">
                              <ExternalLink className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Open</span>
                            </Link>
                          </Button>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2 pt-2">
                        <Button
                          className="w-full h-11 rounded-full text-xs font-bold gap-2 shadow-md hover:shadow-lg transition"
                          onClick={() => {
                            const text = `Catalance Author / SEO Login:\nName: ${createdCredentials.fullName}\nEmail ID: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\nLogin Portal: ${window.location.origin}/blog/write`;
                            copyToClipboard(text, "all-creds");
                          }}
                        >
                          {copiedKey === "all-creds" ? (
                            <Check className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                          {copiedKey === "all-creds" ? "Copied to Clipboard!" : "Copy Full Login Credentials"}
                        </Button>

                        <Button
                          variant="outline"
                          className="w-full h-10 rounded-full text-xs font-semibold"
                          onClick={() => {
                            setCreatedCredentials(null);
                            setNewSeoPassword(generateRandomPassword());
                          }}
                        >
                          + Create Another Account
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleCreateSeoMember} className="space-y-4">
                      {/* Full Name */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Full Name</Label>
                        <div className="relative">
                          <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            value={newSeoName}
                            onChange={(e) => setNewSeoName(e.target.value)}
                            placeholder="e.g. Piyush Sharma"
                            className="rounded-2xl h-11 pl-10 text-xs"
                            required
                          />
                        </div>
                      </div>

                      {/* Email ID */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Email ID (Login ID)</Label>
                        <div className="relative">
                          <Users className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            type="email"
                            value={newSeoEmail}
                            onChange={(e) => setNewSeoEmail(e.target.value)}
                            placeholder="e.g. piyush@catalance.in"
                            className="rounded-2xl h-11 pl-10 text-xs"
                            required
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <Label className="font-semibold">Password</Label>
                          <button
                            type="button"
                            onClick={() => setNewSeoPassword(generateRandomPassword())}
                            className="text-primary hover:underline text-[11px] font-semibold flex items-center gap-1"
                          >
                            <Sparkles className="h-3 w-3" />
                            Auto-Generate
                          </button>
                        </div>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            value={newSeoPassword}
                            onChange={(e) => setNewSeoPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            className="rounded-2xl h-11 pl-10 pr-10 text-xs font-mono"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Role / Designation */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Designation / Role</Label>
                        <Select value={newSeoDesignation} onValueChange={setNewSeoDesignation}>
                          <SelectTrigger className="rounded-2xl h-11 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SEO Specialist">SEO Specialist</SelectItem>
                            <SelectItem value="Content Lead">Content Lead</SelectItem>
                            <SelectItem value="Blog Author">Blog Author</SelectItem>
                            <SelectItem value="SEO Manager">SEO Manager</SelectItem>
                            <SelectItem value="Technical Writer">Technical Writer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Form Actions */}
                      <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-full text-xs h-10 px-5"
                          onClick={() => setSeoModalOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          className="rounded-full text-xs font-bold gap-1.5 h-10 px-6 shadow-sm"
                          disabled={isCreatingSeoUser}
                        >
                          {isCreatingSeoUser ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          Generate Account
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODAL 4: RESET PASSWORD                                                    */}
          {/* ========================================================================= */}
          {resetTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in">
              <Card className="w-full max-w-md rounded-[2.25rem] border border-border bg-card shadow-2xl overflow-hidden text-foreground">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4 pt-6 px-6 sm:px-8">
                  <div className="space-y-0.5">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <KeyRound className="h-5 w-5 text-primary" />
                      Reset Password
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Set a new password for <strong>{resetTarget.fullName}</strong>
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full h-8 w-8 p-0"
                    onClick={() => setResetTarget(null)}
                  >
                    &times;
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4 p-6 sm:p-8">
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <Label className="font-semibold">New Password</Label>
                        <button
                          type="button"
                          onClick={() => setResetPasswordVal(generateRandomPassword())}
                          className="text-primary hover:underline text-[11px] font-semibold flex items-center gap-1"
                        >
                          <Sparkles className="h-3 w-3" />
                          Auto-Generate
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={resetPasswordVal}
                          onChange={(e) => setResetPasswordVal(e.target.value)}
                          placeholder="New password (min 6 characters)"
                          className="rounded-2xl h-11 pl-10 text-xs font-mono"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2.5 border-t border-border pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full text-xs h-10 px-5"
                        onClick={() => setResetTarget(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        className="rounded-full text-xs font-bold h-10 px-6"
                        disabled={isResettingPassword}
                      >
                        {isResettingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save New Password"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminBlogs;
