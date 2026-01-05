import { S3Client } from "@aws-sdk/client-s3";
import { env } from "../config/env.js";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "44b4900bc48bb8b07ffb6a3";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;

if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.warn("R2 credentials not found in environment variables");
}

export const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export const BUCKET_NAME = process.env.R2_BUCKET_NAME || "catalance";
export const PUBLIC_URL_PREFIX = process.env.R2_PUBLIC_URL || "https://pub-44b4900bc48bb8b07ffb6a3.r2.dev";
