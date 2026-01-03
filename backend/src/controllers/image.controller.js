import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, BUCKET_NAME } from "../lib/r2.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";

export const getImage = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const fullKey = `avatars/${key}`;

  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fullKey,
    });

    const response = await s3Client.send(command);

    // Set appropriate headers
    if (response.ContentType) {
      res.setHeader("Content-Type", response.ContentType);
    }
    if (response.ContentLength) {
      res.setHeader("Content-Length", response.ContentLength);
    }
    
    // Cache control for performance
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    // Pipe the stream to the response
    response.Body.pipe(res);
  } catch (error) {
    console.error("Error fetching image from R2:", error);
    if (error.name === "NoSuchKey") {
       throw new AppError("Image not found", 404);
    }
    throw new AppError("Failed to fetch image", 500);
  }
});

// Get chat file from R2
export const getChatFile = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const fullKey = `chat/${key}`;

  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fullKey,
    });

    const response = await s3Client.send(command);

    // Set appropriate headers
    if (response.ContentType) {
      res.setHeader("Content-Type", response.ContentType);
    }
    if (response.ContentLength) {
      res.setHeader("Content-Length", response.ContentLength);
    }
    if (response.ContentDisposition) {
      res.setHeader("Content-Disposition", response.ContentDisposition);
    }
    
    // Cache control
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    // Pipe the stream to the response
    response.Body.pipe(res);
  } catch (error) {
    console.error("Error fetching chat file from R2:", error);
    if (error.name === "NoSuchKey") {
       throw new AppError("File not found", 404);
    }
    throw new AppError("Failed to fetch file", 500);
  }
});
