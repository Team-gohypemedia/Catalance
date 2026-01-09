import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, BUCKET_NAME, PUBLIC_URL_PREFIX } from "../lib/r2.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { prisma } from "../lib/prisma.js";

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
        let oldKey = null;

        if (currentUser.avatar.includes(PUBLIC_URL_PREFIX)) {
          // Old R2 public URL
          oldKey = currentUser.avatar.replace(`${PUBLIC_URL_PREFIX}/`, "");
        } else if (currentUser.avatar.includes("/api/images/")) {
           // New Proxy URL: http://.../api/images/filename.ext
           // We just need the filename.
           const parts = currentUser.avatar.split("/");
           const filename = parts[parts.length - 1];
           if (filename) {
               oldKey = `avatars/${filename}`;
           }
        }

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
  const fileExt = path.extname(file.originalname);
  const fileName = `avatars/${uuidv4()}${fileExt}`;

  try {
    // 2. Upload new avatar
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await s3Client.send(command);

    // Use local proxy URL
    // We don't have request context here easily for full URL unless we use req.get('host')
    // But frontend expects a URL.
    // If we return a relative path, we must ensure frontend handles it.
    // BUT current frontend code uses whatever we send as `avatar`.
    // If we send `/api/images/...`, and `img src="/api/images..."`, it works relative to domain.
    // Backend API is mounted at /api, so the full path is /api/images/avatars/UUID...
    // The image.routes.js is mounted at /images.
    // get(":key") -> key matches filename.
    // fileName is avatars/UUID. 
    // Wait, controller does `avatars/${key}`.
    // So if I pass just the filename (uuid.ext) to the route, it works.
    const justFileName = path.basename(fileName);
    const baseUrl = process.env.API_URL || `${req.protocol}://${req.get("host")}`;
    const publicUrl = `${baseUrl}/api/images/${justFileName}`;
    
    // Fallback if we want relative:
    // const publicUrl = `/api/images/${justFileName}`; 
    // But client might be on different port (5173 vs 5000). Relative URL only works if proxy is set up or same origin.
    // React app usually runs on 5173. Backend on 5000.
    // Client MUST receive full URL or use API_BASE_URL.
    // Let's rely on constructing a full URL.
    
    // Note: process.env.API_URL should be set in production.
    // For local dev, we default to localhost:5000.

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

  // 1. Delete old resume if it exists (Non-blocking)
  if (userId) {
    try {
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { resume: true }
      });

      if (currentUser?.resume) {
        let oldKey = null;
        try {
            // Check for various URL formats
            if (currentUser.resume.includes("/api/images/resumes/")) {
                const parts = currentUser.resume.split("/resumes/");
                if (parts.length > 1) {
                    oldKey = `resumes/${parts[1]}`;
                }
            } else if (currentUser.resume.includes("/resumes/")) {
                // fallback if just the key or different URL structure
                const parts = currentUser.resume.split("/resumes/");
                if (parts.length > 1) {
                    oldKey = `resumes/${parts[1]}`;
                }
            }

            if (oldKey) {
                console.log(`[uploadResume] Attempting to delete old resume: ${oldKey}`);
                await s3Client.send(new DeleteObjectCommand({
                    Bucket: BUCKET_NAME,
                    Key: oldKey
                }));
                console.log(`[uploadResume] Deleted old resume from R2: ${oldKey}`);
            }
        } catch (innerErr) {
             console.warn("[uploadResume] Failed to parse or delete old resume:", innerErr);
        }
      }
    } catch (e) {
      console.warn("[uploadResume] Error checking old resume:", e);
    }
  }

  const file = req.file;
  const fileExt = path.extname(file.originalname);
  const safeFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
  const uniqueId = uuidv4();
  // Store in resumes/ folder
  const fileName = `resumes/${uniqueId}${fileExt}`;

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

    // Construct public URL
    // Backend mounted at /api, but images endpoint is /images.
    // So we can use the same image proxy or a new one. 
    // The image.routes.js proxies /:key. If key has slashes (resumes/uuid.pdf), it might need encodeURIComponent or better handling.
    // However, our existing proxy likely handles the key directly or expects flat structure.
    // Let's check image.routes.js...
    // Actually, image.routes.js is likely just serving from R2. 
    // If we want a separate endpoint, or just use the same.
    // Let's use a specific endpoint for resumes if needed, OR just rely on the same /api/images proxy if it supports folders.
    // Existing uploadImage uses `avatars/` prefix in the controller, but the proxy route takes `:key`. 
    // If the proxy route is `router.get("/:key", ...)` it matches only segment. 
    // If we use `/api/images/resumes/filename` we need the route to support it.
    // For now, let's use a direct link logic.
    // Actually, let's just use the `avatars/` logic style: return a URL matching what the proxy expects.
    // If strict on URL structure, we might need to update image.routes.js.
    // Let's assume for now we return a URL like `/api/images/resumes/${uniqueId}${fileExt}`.
    // And I will Update image.routes.js to handle full paths or just `resumes/` prefix.
    const baseUrl = process.env.API_URL || `${req.protocol}://${req.get("host")}`;
    const publicUrl = `${baseUrl}/api/images/resumes/${uniqueId}${fileExt}`;

    console.log(`[uploadResume] Resume uploaded to R2: ${fileName}`);
    console.log(`[uploadResume] Public URL: ${publicUrl}`);
    console.log(`[uploadResume] userId from JWT: ${userId}`);
    console.log(`[uploadResume] userEmail from JWT: ${userEmail}`);
    console.log(`[uploadResume] Full req.user object:`, JSON.stringify(req.user, null, 2));

    // Save resume URL to database
    let savedCount = 0;
    if (userId) {
      console.log(`[uploadResume] Attempting to save resume for userId: ${userId}`);
      const result = await prisma.user.updateMany({
        where: { id: userId },
        data: { resume: publicUrl },
      });
      console.log(`[uploadResume] Save result for userId:`, result);
      savedCount += result.count;
    }
    if (!savedCount && userEmail) {
      console.log(`[uploadResume] Attempting to save resume for email: ${userEmail}`);
      const result = await prisma.user.updateMany({
        where: { email: userEmail },
        data: { resume: publicUrl },
      });
      console.log(`[uploadResume] Save result for email:`, result);
      savedCount += result.count;
    }
    
    console.log(`[uploadResume] Total saved count: ${savedCount}`);
    
    if (!savedCount) {
      console.error(`[uploadResume] FAILED: No user found to save resume`);
      throw new AppError("User not found for resume save", 404);
    }
    
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
