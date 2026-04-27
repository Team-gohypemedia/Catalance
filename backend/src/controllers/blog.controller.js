import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";

const BLOG_STATUS = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED"
};

const BLOG_STATUS_VALUES = new Set(Object.values(BLOG_STATUS));
const ARTICLE_DATE_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric"
});

const normalizeText = (value = "") => String(value ?? "").trim();

const normalizeLongText = (value = "") =>
  String(value ?? "").replace(/\r/g, "").trim();

const normalizeSlug = (value = "") =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

const normalizeKeywords = (value) => {
  const source = Array.isArray(value)
    ? value
    : String(value || "")
        .split(",");
  const seen = new Set();
  const keywords = [];

  for (const raw of source) {
    const next = normalizeText(raw);
    const key = next.toLowerCase();
    if (!next || seen.has(key)) continue;
    seen.add(key);
    keywords.push(next);
  }

  return keywords.slice(0, 20);
};

const countWords = (value = "") =>
  normalizeLongText(value)
    .split(/\s+/)
    .filter(Boolean).length;

const estimateReadTime = (content = "") => {
  const words = countWords(content);
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
};

const formatPublishedDate = (value) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return ARTICLE_DATE_FORMATTER.format(date);
};

const buildExcerpt = (excerpt = "", content = "") => {
  const trimmedExcerpt = normalizeLongText(excerpt);
  if (trimmedExcerpt) return trimmedExcerpt;
  const plain = normalizeLongText(content)
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_`>#-]/g, "")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.slice(0, 220).trim();
};

const deriveHeadings = (content = "") =>
  normalizeLongText(content)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^##+\s+/.test(line))
    .map((line) => line.replace(/^##+\s+/, "").trim())
    .filter(Boolean)
    .slice(0, 12);

const normalizeStatus = (value = "") => {
  const status = normalizeText(value).toUpperCase();
  if (!BLOG_STATUS_VALUES.has(status)) {
    throw new AppError("Invalid blog status", 400);
  }
  return status;
};

const normalizeNullableUrl = (value = "") => {
  const raw = normalizeText(value);
  if (!raw) return null;

  try {
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const parsed = new URL(withProtocol);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Unsupported protocol");
    }
    return parsed.toString();
  } catch {
    throw new AppError("One of the blog URLs is invalid", 400);
  }
};

const buildPublicBlogDto = (post) => ({
  id: post.id,
  slug: post.slug,
  title: post.title,
  excerpt: buildExcerpt(post.excerpt, post.content),
  category: post.category || "Insights",
  authorName: post.authorName,
  coverImageUrl: post.coverImageUrl || "",
  coverImageAlt: post.coverImageAlt || post.title,
  featured: Boolean(post.featured),
  readTime: estimateReadTime(post.content),
  publishedAt: post.publishedAt,
  publishedLabel: formatPublishedDate(post.publishedAt),
  seoTitle: post.seoTitle || post.title,
  seoDescription: post.seoDescription || buildExcerpt(post.excerpt, post.content),
  seoKeywords: post.seoKeywords || [],
  canonicalUrl: post.canonicalUrl || "",
  ogTitle: post.ogTitle || post.seoTitle || post.title,
  ogDescription: post.ogDescription || post.seoDescription || buildExcerpt(post.excerpt, post.content),
  ogImageUrl: post.ogImageUrl || post.coverImageUrl || "",
  headings: deriveHeadings(post.content)
});

const buildAdminBlogDto = (post) => ({
  ...buildPublicBlogDto(post),
  status: post.status,
  content: post.content,
  excerpt: post.excerpt,
  coverImageUrl: post.coverImageUrl || "",
  coverImageAlt: post.coverImageAlt || "",
  seoTitle: post.seoTitle || "",
  seoDescription: post.seoDescription || "",
  seoKeywords: post.seoKeywords || [],
  canonicalUrl: post.canonicalUrl || "",
  ogTitle: post.ogTitle || "",
  ogDescription: post.ogDescription || "",
  ogImageUrl: post.ogImageUrl || "",
  createdAt: post.createdAt,
  updatedAt: post.updatedAt
});

const parseBlogPayload = (body = {}, existingPost = null) => {
  const title = normalizeText(body.title);
  const content = normalizeLongText(body.content);
  const baseSlug = normalizeSlug(body.slug || title);

  if (!title) {
    throw new AppError("Blog title is required", 400);
  }

  if (!baseSlug) {
    throw new AppError("A valid blog slug could not be generated", 400);
  }

  if (!content) {
    throw new AppError("Blog content is required", 400);
  }

  const status = normalizeStatus(body.status || existingPost?.status || BLOG_STATUS.DRAFT);
  const nextPublishedAt =
    status === BLOG_STATUS.PUBLISHED
      ? body.publishedAt
        ? new Date(body.publishedAt)
        : existingPost?.publishedAt || new Date()
      : body.publishedAt
        ? new Date(body.publishedAt)
        : existingPost?.publishedAt || null;

  if (nextPublishedAt && Number.isNaN(nextPublishedAt.getTime())) {
    throw new AppError("Invalid published date", 400);
  }

  return {
    slug: baseSlug,
    title,
    excerpt: buildExcerpt(body.excerpt, content),
    content,
    category: normalizeText(body.category) || "Insights",
    authorName: normalizeText(body.authorName) || existingPost?.authorName || "Catalance Editorial Team",
    coverImageUrl: normalizeNullableUrl(body.coverImageUrl),
    coverImageAlt: normalizeText(body.coverImageAlt) || null,
    status,
    featured: Boolean(body.featured),
    seoTitle: normalizeText(body.seoTitle) || null,
    seoDescription: normalizeLongText(body.seoDescription) || null,
    seoKeywords: normalizeKeywords(body.seoKeywords),
    canonicalUrl: normalizeNullableUrl(body.canonicalUrl),
    ogTitle: normalizeText(body.ogTitle) || null,
    ogDescription: normalizeLongText(body.ogDescription) || null,
    ogImageUrl: normalizeNullableUrl(body.ogImageUrl),
    publishedAt: nextPublishedAt
  };
};

const ensureUniqueSlug = async (slug, currentId = null) => {
  const existing = await prisma.blogPost.findFirst({
    where: {
      slug,
      ...(currentId ? { NOT: { id: currentId } } : {})
    },
    select: { id: true }
  });

  if (existing) {
    throw new AppError("That blog slug already exists", 409);
  }
};

export const getPublishedBlogs = asyncHandler(async (_req, res) => {
  const posts = await prisma.blogPost.findMany({
    where: { status: BLOG_STATUS.PUBLISHED },
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }]
  });

  res.json({ data: posts.map(buildPublicBlogDto) });
});

export const getPublishedBlogBySlug = asyncHandler(async (req, res) => {
  const slug = normalizeSlug(req.params.slug);
  if (!slug) {
    throw new AppError("Blog slug is required", 400);
  }

  const post = await prisma.blogPost.findFirst({
    where: {
      slug,
      status: BLOG_STATUS.PUBLISHED
    }
  });

  if (!post) {
    throw new AppError("Blog post not found", 404);
  }

  const relatedPosts = await prisma.blogPost.findMany({
    where: {
      status: BLOG_STATUS.PUBLISHED,
      NOT: { id: post.id },
      ...(post.category ? { category: post.category } : {})
    },
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
    take: 3
  });

  res.json({
    data: {
      post: {
        ...buildPublicBlogDto(post),
        content: post.content
      },
      relatedPosts: relatedPosts.map(buildPublicBlogDto)
    }
  });
});

export const getAdminBlogs = asyncHandler(async (_req, res) => {
  const posts = await prisma.blogPost.findMany({
    orderBy: [{ updatedAt: "desc" }]
  });

  res.json({ data: posts.map(buildAdminBlogDto) });
});

export const getAdminBlogById = asyncHandler(async (req, res) => {
  const id = normalizeText(req.params.blogId);
  if (!id) {
    throw new AppError("Blog id is required", 400);
  }

  const post = await prisma.blogPost.findUnique({
    where: { id }
  });

  if (!post) {
    throw new AppError("Blog post not found", 404);
  }

  res.json({ data: buildAdminBlogDto(post) });
});

export const upsertAdminBlog = asyncHandler(async (req, res) => {
  const currentId = normalizeText(req.body.id);
  const existingPost = currentId
    ? await prisma.blogPost.findUnique({ where: { id: currentId } })
    : null;

  if (currentId && !existingPost) {
    throw new AppError("Blog post not found", 404);
  }

  const payload = parseBlogPayload(req.body, existingPost);
  await ensureUniqueSlug(payload.slug, existingPost?.id || null);

  const savedPost = existingPost
    ? await prisma.blogPost.update({
        where: { id: existingPost.id },
        data: payload
      })
    : await prisma.blogPost.create({
        data: payload
      });

  res.json({ data: buildAdminBlogDto(savedPost) });
});

export const deleteAdminBlog = asyncHandler(async (req, res) => {
  const id = normalizeText(req.params.blogId);
  if (!id) {
    throw new AppError("Blog id is required", 400);
  }

  const existingPost = await prisma.blogPost.findUnique({
    where: { id },
    select: { id: true }
  });

  if (!existingPost) {
    throw new AppError("Blog post not found", 404);
  }

  await prisma.blogPost.delete({
    where: { id }
  });

  res.json({ data: { success: true } });
});
