import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import ImagePlus from "lucide-react/dist/esm/icons/image-plus";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import PencilLine from "lucide-react/dist/esm/icons/pencil-line";
import Plus from "lucide-react/dist/esm/icons/plus";
import Search from "lucide-react/dist/esm/icons/search";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";

import AdminLayout from "./AdminLayout";
import { AdminTopBar } from "./AdminTopBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/shared/context/AuthContext";
import { toast } from "sonner";

const EMPTY_BLOG = {
  id: "",
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category: "Insights",
  authorName: "Catalance Editorial Team",
  coverImageUrl: "",
  coverImageAlt: "",
  status: "DRAFT",
  featured: false,
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  canonicalUrl: "",
  ogTitle: "",
  ogDescription: "",
  ogImageUrl: "",
  publishedAt: ""
};

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
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

const inflateBlogForm = (blog) => ({
  id: blog.id || "",
  title: blog.title || "",
  slug: blog.slug || "",
  excerpt: blog.excerpt || "",
  content: blog.content || "",
  category: blog.category || "Insights",
  authorName: blog.authorName || "Catalance Editorial Team",
  coverImageUrl: blog.coverImageUrl || "",
  coverImageAlt: blog.coverImageAlt || "",
  status: blog.status || "DRAFT",
  featured: Boolean(blog.featured),
  seoTitle: blog.seoTitle || "",
  seoDescription: blog.seoDescription || "",
  seoKeywords: Array.isArray(blog.seoKeywords) ? blog.seoKeywords.join(", ") : "",
  canonicalUrl: blog.canonicalUrl || "",
  ogTitle: blog.ogTitle || "",
  ogDescription: blog.ogDescription || "",
  ogImageUrl: blog.ogImageUrl || "",
  publishedAt: formatDateInput(blog.publishedAt)
});

const parseAuthResponse = async (response, fallbackMessage) => {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      payload?.message ||
        payload?.error?.message ||
        fallbackMessage
    );
  }
  return payload;
};

const AdminBlogs = () => {
  const { authFetch } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState(EMPTY_BLOG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingField, setUploadingField] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    let ignore = false;

    const loadBlogs = async () => {
      setLoading(true);
      try {
        const response = await authFetch("/admin/blogs");
        const payload = await parseAuthResponse(response, "Failed to load blogs");
        if (ignore) return;
        const nextBlogs = Array.isArray(payload?.data) ? payload.data : [];
        setBlogs(nextBlogs);
        if (nextBlogs.length > 0) {
          setSelectedId((current) => current || nextBlogs[0].id);
          setForm((current) => (current.id ? current : inflateBlogForm(nextBlogs[0])));
        }
      } catch (error) {
        if (!ignore) {
          console.error("Failed to load blogs:", error);
          toast.error(error?.message || "Failed to load blogs");
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
  }, [authFetch]);

  useEffect(() => {
    if (!selectedId) return;
    const selectedBlog = blogs.find((blog) => blog.id === selectedId);
    if (selectedBlog) {
      setForm(inflateBlogForm(selectedBlog));
    }
  }, [blogs, selectedId]);

  const filteredBlogs = useMemo(() => {
    const query = String(deferredSearch || "").trim().toLowerCase();
    return blogs.filter((blog) => {
      const matchesStatus = statusFilter === "ALL" || blog.status === statusFilter;
      if (!matchesStatus) return false;
      if (!query) return true;
      return [blog.title, blog.slug, blog.category, blog.authorName]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(query));
    });
  }, [blogs, deferredSearch, statusFilter]);

  const selectedBlog = useMemo(
    () => blogs.find((blog) => blog.id === selectedId) || null,
    [blogs, selectedId]
  );

  const stats = useMemo(() => ({
    total: blogs.length,
    published: blogs.filter((blog) => blog.status === "PUBLISHED").length,
    drafts: blogs.filter((blog) => blog.status === "DRAFT").length,
    featured: blogs.filter((blog) => blog.featured).length
  }), [blogs]);

  const setField = (key, value) => {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "title" && (!current.slug || current.slug === slugify(current.title))) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const createNewBlog = () => {
    setSelectedId("");
    setForm(EMPTY_BLOG);
  };

  const handleImageUpload = async (fieldName, file) => {
    if (!file) return;
    setUploadingField(fieldName);
    try {
      const data = new FormData();
      data.append("file", file);
      const response = await authFetch("/upload/project-image", {
        method: "POST",
        body: data
      });
      const payload = await parseAuthResponse(response, "Failed to upload image");
      const uploadedUrl = String(payload?.data?.url || "").trim();
      if (!uploadedUrl) {
        throw new Error("Image upload returned no URL");
      }

      setField(fieldName, uploadedUrl);
      if (fieldName === "coverImageUrl" && !form.ogImageUrl) {
        setField("ogImageUrl", uploadedUrl);
      }
      toast.success("Image uploaded to R2");
    } catch (error) {
      console.error("Blog image upload failed:", error);
      toast.error(error?.message || "Failed to upload image");
    } finally {
      setUploadingField("");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        slug: slugify(form.slug || form.title),
        seoKeywords: form.seoKeywords
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        publishedAt: form.publishedAt ? new Date(`${form.publishedAt}T00:00:00`).toISOString() : null
      };

      const response = await authFetch("/admin/blogs", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      const result = await parseAuthResponse(response, "Failed to save blog");
      const savedBlog = result?.data;
      if (!savedBlog?.id) {
        throw new Error("Blog save response was invalid");
      }

      setBlogs((current) => {
        const exists = current.some((blog) => blog.id === savedBlog.id);
        const next = exists
          ? current.map((blog) => (blog.id === savedBlog.id ? savedBlog : blog))
          : [savedBlog, ...current];
        return next.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
      });
      setSelectedId(savedBlog.id);
      setForm(inflateBlogForm(savedBlog));
      toast.success(form.id ? "Blog updated" : "Blog created");
    } catch (error) {
      console.error("Failed to save blog:", error);
      toast.error(error?.message || "Failed to save blog");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!form.id) {
      createNewBlog();
      return;
    }

    const confirmed = window.confirm(`Delete "${form.title}"? This cannot be undone.`);
    if (!confirmed) return;

    setDeleting(true);
    try {
      const response = await authFetch(`/admin/blogs/${form.id}`, {
        method: "DELETE"
      });
      await parseAuthResponse(response, "Failed to delete blog");
      const remaining = blogs.filter((blog) => blog.id !== form.id);
      setBlogs(remaining);
      if (remaining.length > 0) {
        setSelectedId(remaining[0].id);
        setForm(inflateBlogForm(remaining[0]));
      } else {
        setSelectedId("");
        setForm(EMPTY_BLOG);
      }
      toast.success("Blog deleted");
    } catch (error) {
      console.error("Failed to delete blog:", error);
      toast.error(error?.message || "Failed to delete blog");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8">
          <AdminTopBar label="Blog CMS" />

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="border-white/10 bg-gradient-to-br from-[#131313] to-[#1e1b12] text-white">
              <CardHeader className="pb-2">
                <CardDescription className="text-slate-400">Total Posts</CardDescription>
                <CardTitle className="text-3xl">{stats.total}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-white/10 bg-[#111111]">
              <CardHeader className="pb-2">
                <CardDescription>Published</CardDescription>
                <CardTitle className="text-3xl">{stats.published}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-white/10 bg-[#111111]">
              <CardHeader className="pb-2">
                <CardDescription>Drafts</CardDescription>
                <CardTitle className="text-3xl">{stats.drafts}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-white/10 bg-[#111111]">
              <CardHeader className="pb-2">
                <CardDescription>Featured</CardDescription>
                <CardTitle className="text-3xl">{stats.featured}</CardTitle>
              </CardHeader>
            </Card>
          </section>

          <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <Card className="border-white/10 bg-[#0f0f10]">
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>All Blogs</CardTitle>
                    <CardDescription>Manage public blog content and SEO.</CardDescription>
                  </div>
                  <Button onClick={createNewBlog} className="gap-2 rounded-full">
                    <Plus className="h-4 w-4" />
                    New
                  </Button>
                </div>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by title or slug"
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All statuses</SelectItem>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading blogs...
                  </div>
                ) : filteredBlogs.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-muted-foreground">
                    No blogs found for the current filter.
                  </div>
                ) : (
                  filteredBlogs.map((blog) => (
                    <button
                      key={blog.id}
                      type="button"
                      onClick={() => setSelectedId(blog.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${selectedId === blog.id ? "border-[#ffc800]/50 bg-[#ffc800]/[0.08]" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <Badge variant="outline">{blog.status}</Badge>
                        {blog.featured ? <Badge className="bg-[#ffc800] text-black">Featured</Badge> : null}
                      </div>
                      <p className="line-clamp-2 text-sm font-semibold text-white">{blog.title}</p>
                      <p className="mt-2 line-clamp-2 text-xs text-slate-400">{blog.excerpt}</p>
                      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{blog.category}</span>
                        <span>{blog.publishedLabel || "Unscheduled"}</span>
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-white/10 bg-[#0f0f10]">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle>{form.id ? "Edit Blog Post" : "Create Blog Post"}</CardTitle>
                    <CardDescription>Write once, publish to the public blog page with SEO metadata.</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="gap-2" onClick={handleDelete} disabled={deleting || saving}>
                      {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      Delete
                    </Button>
                    <Button className="gap-2" onClick={handleSave} disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PencilLine className="h-4 w-4" />}
                      {form.id ? "Update Blog" : "Save Blog"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input value={form.title} onChange={(event) => setField("title", event.target.value)} placeholder="Blog title" />
                    </div>
                    <div className="space-y-2">
                      <Label>Slug</Label>
                      <Input value={form.slug} onChange={(event) => setField("slug", slugify(event.target.value))} placeholder="blog-slug" />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Input value={form.category} onChange={(event) => setField("category", event.target.value)} placeholder="Growth, Product, SEO..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Author Name</Label>
                      <Input value={form.authorName} onChange={(event) => setField("authorName", event.target.value)} placeholder="Catalance Editorial Team" />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={form.status} onValueChange={(value) => setField("status", value)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Publish Date</Label>
                      <Input type="date" value={form.publishedAt} onChange={(event) => setField("publishedAt", event.target.value)} />
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <Label>Cover Image URL</Label>
                        <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-[#ffc800]">
                          <ImagePlus className="h-4 w-4" />
                          {uploadingField === "coverImageUrl" ? "Uploading..." : "Upload to R2"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) => void handleImageUpload("coverImageUrl", event.target.files?.[0])}
                          />
                        </label>
                      </div>
                      <Input value={form.coverImageUrl} onChange={(event) => setField("coverImageUrl", event.target.value)} placeholder="https://..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Cover Image Alt</Label>
                      <Input value={form.coverImageAlt} onChange={(event) => setField("coverImageAlt", event.target.value)} placeholder="Descriptive image alt text" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-white">Featured on blog landing page</p>
                      <p className="text-xs text-slate-400">Featured posts get priority in the public hero section.</p>
                    </div>
                    <Switch checked={form.featured} onCheckedChange={(checked) => setField("featured", checked)} />
                  </div>

                  <div className="space-y-2">
                    <Label>Excerpt</Label>
                    <Textarea value={form.excerpt} onChange={(event) => setField("excerpt", event.target.value)} placeholder="Short summary for cards, hero, and SEO fallback." className="min-h-[100px]" />
                  </div>

                  <div className="space-y-2">
                    <Label>Content (Markdown)</Label>
                    <Textarea value={form.content} onChange={(event) => setField("content", event.target.value)} placeholder={"# Opening headline\n\nWrite the full article in markdown..."} className="min-h-[420px] font-mono text-sm" />
                  </div>

                  <Separator />

                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <Sparkles className="h-4 w-4 text-[#ffc800]" />
                    SEO Metadata
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-2">
                      <Label>SEO Title</Label>
                      <Input value={form.seoTitle} onChange={(event) => setField("seoTitle", event.target.value)} placeholder="Optional custom title tag" />
                    </div>
                    <div className="space-y-2">
                      <Label>Canonical URL</Label>
                      <Input value={form.canonicalUrl} onChange={(event) => setField("canonicalUrl", event.target.value)} placeholder="https://www.catalance.in/blog/slug" />
                    </div>
                    <div className="space-y-2 lg:col-span-2">
                      <Label>SEO Description</Label>
                      <Textarea value={form.seoDescription} onChange={(event) => setField("seoDescription", event.target.value)} placeholder="Meta description for search results and social previews." className="min-h-[96px]" />
                    </div>
                    <div className="space-y-2 lg:col-span-2">
                      <Label>SEO Keywords</Label>
                      <Input value={form.seoKeywords} onChange={(event) => setField("seoKeywords", event.target.value)} placeholder="freelance growth, ai delivery, project scoping" />
                    </div>
                    <div className="space-y-2">
                      <Label>OG Title</Label>
                      <Input value={form.ogTitle} onChange={(event) => setField("ogTitle", event.target.value)} placeholder="Optional social title" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <Label>OG Image URL</Label>
                        <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-[#ffc800]">
                          <ImagePlus className="h-4 w-4" />
                          {uploadingField === "ogImageUrl" ? "Uploading..." : "Upload to R2"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) => void handleImageUpload("ogImageUrl", event.target.files?.[0])}
                          />
                        </label>
                      </div>
                      <Input value={form.ogImageUrl} onChange={(event) => setField("ogImageUrl", event.target.value)} placeholder="https://..." />
                    </div>
                    <div className="space-y-2 lg:col-span-2">
                      <Label>OG Description</Label>
                      <Textarea value={form.ogDescription} onChange={(event) => setField("ogDescription", event.target.value)} placeholder="Optional social description override." className="min-h-[96px]" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-[#0f0f10]">
                <CardHeader>
                  <CardTitle>Quick Preview</CardTitle>
                  <CardDescription>How the card content will roughly appear on the public blog page.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
                  <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/30">
                    {form.coverImageUrl ? (
                      <img src={form.coverImageUrl} alt={form.coverImageAlt || form.title || "Blog cover"} className="h-52 w-full object-cover" />
                    ) : (
                      <div className="flex h-52 items-center justify-center bg-gradient-to-br from-[#1b1b1b] to-[#26200f] text-sm text-slate-500">
                        No cover image
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{form.status}</Badge>
                      {form.featured ? <Badge className="bg-[#ffc800] text-black">Featured</Badge> : null}
                      <Badge variant="secondary">{form.category || "Insights"}</Badge>
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-white">{form.title || "Untitled blog post"}</h3>
                      <p className="mt-2 text-sm text-slate-400">{form.authorName || "Catalance Editorial Team"}</p>
                    </div>
                    <p className="text-sm leading-7 text-slate-300">{form.excerpt || "Add an excerpt to improve card previews and search snippets."}</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">SEO title</p>
                        <p className="mt-2 text-sm text-white">{form.seoTitle || form.title || "Using blog title as fallback"}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Social image</p>
                        <p className="mt-2 text-sm text-white break-all">{form.ogImageUrl || form.coverImageUrl || "Using cover image as fallback"}</p>
                      </div>
                    </div>
                    {selectedBlog ? (
                      <p className="text-xs text-slate-500">Last updated {new Date(selectedBlog.updatedAt).toLocaleString("en-IN")}</p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminBlogs;
