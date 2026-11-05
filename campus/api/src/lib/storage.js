import { env } from "./env.js";
import { httpError } from "./errors.js";
import { DOWNLOAD_URL_TTL, UPLOAD_URL_TTL } from "./uploads.js";

/**
 * Private object storage for assessment files: Cloudflare R2 through its S3-compatible API
 * (same endpoint pattern as backend/src/lib/r2.js). The bucket stays private: the browser uploads with a presigned PUT
 * and every read is a presigned GET that expires (spec §15). Nothing here returns a permanent public URL.
 *
 * Env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME. Without them uploads answer 503.
 * The AWS SDK is imported lazily so routes that never touch files don't pay for it on a cold start.
 * Tests replace the methods on `storage` (see scripts/smoke-spec.mjs), so no request leaves the machine.
 */

export const storageConfigured = () => Boolean(env.r2.accountId && env.r2.accessKeyId && env.r2.secretAccessKey && env.r2.bucket);

export function assertStorage() {
  if (!storageConfigured()) throw httpError(503, "File uploads aren't set up yet. Add a link to your file instead.");
}

let clientPromise = null;
async function s3() {
  assertStorage();
  if (!clientPromise) {
    clientPromise = (async () => {
      const [{ S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand }, { getSignedUrl }] = await Promise.all([
        import("@aws-sdk/client-s3"),
        import("@aws-sdk/s3-request-presigner"),
      ]);
      const client = new S3Client({
        region: "auto",
        endpoint: `https://${env.r2.accountId}.r2.cloudflarestorage.com`,
        // path-style (https://<account>.r2.cloudflarestorage.com/<bucket>/<key>): one host for the bucket CORS rule
        forcePathStyle: true,
        // without this the SDK signs a CRC32 of an EMPTY body into presigned PUT URLs, and the browser's real upload fails
        requestChecksumCalculation: "WHEN_REQUIRED",
        responseChecksumValidation: "WHEN_REQUIRED",
        credentials: { accessKeyId: env.r2.accessKeyId, secretAccessKey: env.r2.secretAccessKey },
      });
      return { client, getSignedUrl, PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand };
    })().catch((err) => {
      clientPromise = null;
      throw err;
    });
  }
  return clientPromise;
}

const asciiName = (name) => String(name || "file").replace(/[^\x20-\x7e]+/g, "_").replace(/["\\]/g, "_");

export const storage = {
  /** Presigned PUT (Content-Type is signed, so the browser must send exactly `type`). */
  async presignPut({ key, type }) {
    const { client, getSignedUrl, PutObjectCommand } = await s3();
    const url = await getSignedUrl(client, new PutObjectCommand({ Bucket: env.r2.bucket, Key: key, ContentType: type }), { expiresIn: UPLOAD_URL_TTL, signableHeaders: new Set(["content-type"]) });
    return { url, expiresAt: new Date(Date.now() + UPLOAD_URL_TTL * 1000).toISOString() };
  },

  /** Presigned GET that downloads under the original file name. */
  async presignGet({ key, name, type }) {
    const { client, getSignedUrl, GetObjectCommand } = await s3();
    const filename = asciiName(name);
    const url = await getSignedUrl(
      client,
      new GetObjectCommand({
        Bucket: env.r2.bucket,
        Key: key,
        ResponseContentDisposition: `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(name || filename)}`,
        ...(type ? { ResponseContentType: type } : {}),
      }),
      { expiresIn: DOWNLOAD_URL_TTL },
    );
    return { url, expiresAt: new Date(Date.now() + DOWNLOAD_URL_TTL * 1000).toISOString() };
  },

  /** { size, type } of an uploaded object, or null when it doesn't exist (yet). */
  async head(key) {
    const { client, HeadObjectCommand } = await s3();
    try {
      const out = await client.send(new HeadObjectCommand({ Bucket: env.r2.bucket, Key: key }));
      return { size: Number(out.ContentLength) || 0, type: out.ContentType || "" };
    } catch (err) {
      if (err?.$metadata?.httpStatusCode === 404 || err?.name === "NotFound" || err?.name === "NoSuchKey") return null;
      throw httpError(503, "File storage is unavailable right now. Please try again in a minute.");
    }
  },

  async remove(key) {
    const { client, DeleteObjectCommand } = await s3();
    await client.send(new DeleteObjectCommand({ Bucket: env.r2.bucket, Key: key })).catch(() => {});
  },
};
