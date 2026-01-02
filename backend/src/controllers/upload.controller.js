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
    const publicUrl = `${process.env.API_URL || "http://localhost:5000"}/api/images/${justFileName}`;
    
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
