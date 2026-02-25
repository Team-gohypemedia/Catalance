import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, BUCKET_NAME, PUBLIC_URL_PREFIX } from "../lib/r2.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { prisma } from "../lib/prisma.js";

const METADATA_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const MAX_PREVIEW_IMAGE_BYTES = 8 * 1024 * 1024;

const MIME_TO_EXTENSION = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
  "image/avif": ".avif",
};

const normalizePublicPrefix = () => {
  const raw = String(PUBLIC_URL_PREFIX || "").trim();
  if (!raw) return "";

  const stripped = raw.replace(/^['"]+|['"]+$/g, "");
  const explicitUrl = stripped.match(/https?:\/\/[^\s'"]+/i)?.[0] || "";
  const hostCandidate =
    explicitUrl ||
    stripped.match(/[a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s'"]*)?/i)?.[0] ||
    "";
  if (!hostCandidate) return "";

  const hasProtocol = /^https?:\/\//i.test(hostCandidate);
  const normalized = hasProtocol ? hostCandidate : `https://${hostCandidate}`;

  try {
    return new URL(normalized).toString().replace(/\/+$/, "");
  } catch {
    return "";
  }
};

const buildPublicUrl = (key) => {
  const prefix = normalizePublicPrefix();
  return prefix ? `${prefix}/${key}` : key;
};

const normalizePathSegment = (value) =>
  String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "_");

const buildFreelancerProfilePrefix = (userId) =>
  `freelancers/${normalizePathSegment(userId)}/profile`;

const inferFileExtension = ({ originalName = "", mimeType = "", fallback = ".bin" }) => {
  const rawName = String(originalName || "").trim();
  let extensionSource = rawName;
  try {
    if (/^https?:\/\//i.test(rawName)) {
      extensionSource = new URL(rawName).pathname;
    }
  } catch {
    extensionSource = rawName;
  }

  const fromName = path
    .extname(extensionSource.split(/[?#]/)[0] || "")
    .toLowerCase()
    .trim();
  if (fromName) return fromName;

  const normalizedMime = String(mimeType || "").toLowerCase().split(";")[0].trim();
  return MIME_TO_EXTENSION[normalizedMime] || fallback;
};

const normalizeExternalUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) {
    throw new AppError("URL is required", 400);
  }

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  let parsed;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new AppError("Invalid URL provided", 400);
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new AppError("Only HTTP/HTTPS URLs are allowed", 400);
  }

  return parsed.toString();
};

const resolveAbsoluteUrl = (base, maybeRelative) => {
  const raw = String(maybeRelative || "").trim();
  if (!raw) return "";

  try {
    return new URL(raw, base).toString();
  } catch {
    return "";
  }
};

const extractMetaContent = (html, key) => {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(
    `<meta[^>]+(?:property|name)=["']${escapedKey}["'][^>]+content=["']([^"']+)["']|` +
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escapedKey}["']`,
    "i"
  );
  const match = String(html || "").match(regex);
  return match ? String(match[1] || match[2] || "").trim() : "";
};

const extractR2KeyFromUrl = (value) => {
  const url = String(value || "").trim();
  if (!url) return null;

  const publicPrefix = normalizePublicPrefix();
  if (publicPrefix && url.startsWith(`${publicPrefix}/`)) {
    return url.slice(publicPrefix.length + 1);
  }

  const marker = "/api/images/";
  const markerIndex = url.indexOf(marker);
  if (markerIndex !== -1) {
    const extracted = decodeURIComponent(url.slice(markerIndex + marker.length));
    if (!extracted) return null;
    return extracted.includes("/") ? extracted : `avatars/${extracted}`;
  }

  const isAbsoluteUrl = /^https?:\/\//i.test(url);
  if (isAbsoluteUrl) {
    return null;
  }

  const normalized = decodeURIComponent(url.replace(/^\/+/, ""));
  if (!normalized) return null;
  return normalized.includes("/") ? normalized : `avatars/${normalized}`;
};

const buildProjectTitleFallback = (projectUrl) => {
  try {
    const parsed = new URL(projectUrl);
    return parsed.hostname.replace(/^www\./i, "");
  } catch {
    return "Project";
  }
};

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError("No file uploaded", 400);
  }

  const userId = req.user?.sub;
  
  // 1. Delete old avatar if it exists
  if (userId) {
    try {
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { avatar: true }
      });

      if (currentUser?.avatar) {
        const oldKey = extractR2KeyFromUrl(currentUser.avatar);

        if (oldKey) {
            try {
                await s3Client.send(new DeleteObjectCommand({
                    Bucket: BUCKET_NAME,
                    Key: oldKey
                }));
                console.log(`Deleted old avatar: ${oldKey}`);
            } catch (delErr) {
                console.warn("Failed to delete old avatar:", delErr);
                // Don't fail the upload just because delete failed
            }
        }
      }
    } catch (e) {
      console.warn("Error checking old avatar:", e);
    }
  }

  const file = req.file;
  const fileExt = inferFileExtension({
    originalName: file.originalname,
    mimeType: file.mimetype,
    fallback: ".jpg"
  });
  const profilePrefix = userId ? buildFreelancerProfilePrefix(userId) : null;
  const fileName = profilePrefix
    ? `${profilePrefix}/avatar/${uuidv4()}${fileExt}`
    : `avatars/${uuidv4()}${fileExt}`;

  try {
    // 2. Upload new avatar
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await s3Client.send(command);

    const publicUrl = buildPublicUrl(fileName);

    res.json({
      data: {
        url: publicUrl,
        key: fileName
      }
    });
  } catch (error) {
    console.error("R2 Upload Error:", error);
    throw new AppError("Failed to upload image", 500);
  }
});

export const uploadProjectImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError("No file uploaded", 400);
  }

  const userId = req.user?.sub;
  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const file = req.file;
  const fileExt = inferFileExtension({
    originalName: file.originalname,
    mimeType: file.mimetype,
    fallback: ".jpg"
  });
  const basePrefix = buildFreelancerProfilePrefix(userId);
  const key = `${basePrefix}/projects/manual/${uuidv4()}${fileExt}`;

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
      })
    );

    return res.json({
      data: {
        url: buildPublicUrl(key),
        key,
        name: file.originalname
      }
    });
  } catch (error) {
    console.error("Project image upload failed:", error);
    throw new AppError("Failed to upload project image", 500);
  }
});

export const createProjectPreview = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const normalizedUrl = normalizeExternalUrl(req.body?.url);

  let title = "";
  let description = "";
  let remoteImageUrl = "";

  try {
    const metadataResponse = await fetch(normalizedUrl, {
      headers: {
        "User-Agent": METADATA_USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      },
      signal: AbortSignal.timeout(12000)
    });

    if (metadataResponse.ok) {
      const html = await metadataResponse.text();
      title =
        extractMetaContent(html, "og:title") ||
        extractMetaContent(html, "twitter:title") ||
        (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "").trim();
      description =
        extractMetaContent(html, "og:description") ||
        extractMetaContent(html, "twitter:description") ||
        extractMetaContent(html, "description");

      const candidateImage =
        extractMetaContent(html, "og:image") ||
        extractMetaContent(html, "twitter:image") ||
        extractMetaContent(html, "image");
      remoteImageUrl = resolveAbsoluteUrl(normalizedUrl, candidateImage);
    }
  } catch (error) {
    console.warn("Project metadata fetch failed:", error?.message || error);
  }

  let storedImageUrl = null;
  let storedImageKey = null;

  if (remoteImageUrl) {
    try {
      const imageResponse = await fetch(remoteImageUrl, {
        headers: {
          "User-Agent": METADATA_USER_AGENT,
          Accept: "image/*,*/*;q=0.8"
        },
        signal: AbortSignal.timeout(15000)
      });

      if (imageResponse.ok) {
        const contentType = String(
          imageResponse.headers.get("content-type") || "image/jpeg"
        )
          .split(";")[0]
          .trim()
          .toLowerCase();

        if (contentType.startsWith("image/")) {
          const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
          if (imageBuffer.length > 0 && imageBuffer.length <= MAX_PREVIEW_IMAGE_BYTES) {
            const previewExt = inferFileExtension({
              mimeType: contentType,
              originalName: remoteImageUrl,
              fallback: ".jpg"
            });
            const key = `${buildFreelancerProfilePrefix(
              userId
            )}/projects/previews/${uuidv4()}${previewExt}`;

            await s3Client.send(
              new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: key,
                Body: imageBuffer,
                ContentType: contentType
              })
            );

            storedImageKey = key;
            storedImageUrl = buildPublicUrl(key);
          }
        }
      }
    } catch (error) {
      console.warn("Project preview image fetch/upload failed:", error?.message || error);
    }
  }

  res.json({
    success: true,
    data: {
      url: normalizedUrl,
      title: title || buildProjectTitleFallback(normalizedUrl),
      description: description || "",
      image: storedImageUrl,
      key: storedImageKey,
      sourceImage: remoteImageUrl || null
    }
  });
});

// Upload chat file to R2 (any file type)
export const uploadChatFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError("No file uploaded", 400);
  }

  const file = req.file;
  const fileExt = path.extname(file.originalname);
  const safeFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
  const uniqueId = uuidv4();
  const fileName = `chat/${uniqueId}${fileExt}`;

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      // Set content disposition for downloadable files
      ContentDisposition: file.mimetype.startsWith("image/") 
        ? "inline" 
        : `attachment; filename="${safeFileName}"`,
    });

    await s3Client.send(command);

    // For chat files, use the chat images endpoint
    const baseUrl = process.env.API_URL || `${req.protocol}://${req.get("host")}`;
    const publicUrl = `${baseUrl}/api/images/chat/${uniqueId}${fileExt}`;

    console.log(`Chat file uploaded: ${fileName}`);

    res.json({
      data: {
        url: publicUrl,
        key: fileName,
        name: file.originalname,
        size: file.size,
        type: file.mimetype
      }
    });
  } catch (error) {
    console.error("R2 Chat Upload Error:", error);
    throw new AppError("Failed to upload file", 500);
  }
});

// Delete chat attachment from R2 and database
export const deleteChatAttachment = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user?.sub;

  if (!messageId) {
    throw new AppError("Message ID is required", 400);
  }

  // Find the message
  const message = await prisma.chatMessage.findUnique({
    where: { id: messageId },
    include: { conversation: true }
  });

  if (!message) {
    throw new AppError("Message not found", 404);
  }

  // Check if user is the sender of the message
  if (message.senderId && message.senderId !== userId) {
    throw new AppError("You can only delete your own attachments", 403);
  }

  if (!message.attachment) {
    throw new AppError("Message has no attachment", 400);
  }

  const attachment = message.attachment;

  // Delete from R2 if we have the key
  if (attachment.url) {
    try {
      // Extract key from URL: /api/images/chat/uuid.ext -> chat/uuid.ext
      const urlParts = attachment.url.split("/api/images/");
      if (urlParts.length > 1) {
        const key = urlParts[1]; // chat/uuid.ext
        
        await s3Client.send(new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key
        }));
        console.log(`Deleted chat attachment from R2: ${key}`);
      }
    } catch (delErr) {
      console.error("Failed to delete from R2:", delErr);
      // Continue to clear from DB even if R2 delete fails
    }
  }
  // Check if message has text content
  const hasTextContent = message.content && message.content.trim().length > 0;

  // If there's no text content, mark message as deleted entirely
  if (!hasTextContent) {
    await prisma.chatMessage.update({
      where: { id: messageId },
      data: { 
        attachment: null,
        deleted: true,
        content: null
      }
    });
  } else {
    // Just clear the attachment, keep the text content
    await prisma.chatMessage.update({
      where: { id: messageId },
      data: { attachment: null }
    });
  }

  res.json({
    success: true,
    message: "Attachment deleted successfully",
    deleted: !hasTextContent
  });
});

// Resume upload to R2 (PDF, DOC, DOCX)
export const uploadResume = asyncHandler(async (req, res) => {
  console.log("[uploadResume] *** FUNCTION CALLED ***");
  console.log("[uploadResume] req.file exists:", !!req.file);
  console.log("[uploadResume] req.user:", req.user);
  
  if (!req.file) {
    throw new AppError("No file uploaded", 400);
  }

  const userId = req.user?.sub;
  const userEmail = req.user?.email;

  let targetUser = null;
  if (userId) {
    targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        freelancerProfile: {
          select: { resume: true }
        }
      }
    });
  }

  if (!targetUser && userEmail) {
    targetUser = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        email: true,
        freelancerProfile: {
          select: { resume: true }
        }
      }
    });
  }

  if (!targetUser) {
    throw new AppError("User not found for resume save", 404);
  }

  // 1. Delete old resume if it exists (Non-blocking)
  const currentResume = targetUser.freelancerProfile?.resume;
  if (currentResume) {
    try {
      const oldKey = extractR2KeyFromUrl(currentResume);
      if (oldKey) {
        console.log(`[uploadResume] Attempting to delete old resume: ${oldKey}`);
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: oldKey
          })
        );
        console.log(`[uploadResume] Deleted old resume from R2: ${oldKey}`);
      }
    } catch (e) {
      console.warn("[uploadResume] Error checking old resume:", e);
    }
  }

  const file = req.file;
  const fileExt = path.extname(file.originalname);
  const uniqueId = uuidv4();
  const profilePrefix = buildFreelancerProfilePrefix(targetUser.id);
  const fileName = `${profilePrefix}/resume/${uniqueId}${fileExt}`;

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      // Resumes should probably be inline to view in browser, or attachment. 
      // Let's use inline so it opens in new tab.
      ContentDisposition: "inline",
    });

    await s3Client.send(command);

    const publicUrl = buildPublicUrl(fileName);

    console.log(`[uploadResume] Resume uploaded to R2: ${fileName}`);
    console.log(`[uploadResume] Public URL: ${publicUrl}`);
    console.log(`[uploadResume] userId from JWT: ${userId}`);
    console.log(`[uploadResume] userEmail from JWT: ${userEmail}`);
    console.log(`[uploadResume] Full req.user object:`, JSON.stringify(req.user, null, 2));

    await prisma.freelancerProfile.upsert({
      where: { userId: targetUser.id },
      update: { resume: publicUrl },
      create: {
        userId: targetUser.id,
        resume: publicUrl
      }
    });
    
    console.log(`[uploadResume] SUCCESS: Resume saved to database for user`);

    res.json({
      data: {
        url: publicUrl,
        key: fileName,
        name: file.originalname,
        saved: true
      }
    });

  } catch (error) {
    console.error("R2 Resume Upload Error:", error);
    // Return specific error to help debug
    throw new AppError(`Failed to upload resume: ${error.message}`, 500);
  }
});
