import { useState } from "react";
import { toast } from "sonner";
import { Paperclip } from "lucide-react";
import { api } from "@/lib/api/client";
import { Spinner } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

/**
 * Assessment file uploads (spec §15). Files go to private storage through a presigned PUT and are opened through
 * GET /api/attempts/:id/files/:index, which returns a link valid for 10 minutes. No permanent URL is stored or shown.
 * Demo mode: the API hands out a fake key ("demo-upload:<key>") and the bytes stay in this tab's memory.
 */

/** Same allow-list as api/src/lib/uploads.js (the server checks again). */
export const UPLOAD_EXTENSIONS = ["pdf", "png", "jpg", "jpeg", "webp", "zip", "fig", "mp4", "docx", "pptx", "xlsx", "txt"];
export const DEFAULT_MAX_BYTES = 25 * 1024 * 1024;
export const acceptAttr = (extensions = UPLOAD_EXTENSIONS) => extensions.map((e) => `.${e}`).join(",");

const demoBlobs = new Map(); // key → File (demo only, lost on reload)

export const extOf = (name) => (/\.([a-z0-9]{1,8})$/i.exec(String(name || "").trim())?.[1] || "").toLowerCase();

export function formatBytes(n) {
  if (!n) return "0 KB";
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / 1024 / 1024).toFixed(n < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

/** Client-side check before asking the API (the server repeats it). Returns an error message or null. */
export function fileProblem(file, { extensions = UPLOAD_EXTENSIONS, maxBytes = DEFAULT_MAX_BYTES } = {}) {
  if (!extensions.includes(extOf(file.name))) return `${file.name}: use ${extensions.map((e) => e.toUpperCase()).join(", ")}.`;
  if (!file.size) return `${file.name} is empty.`;
  if (file.size > maxBytes) return `${file.name} is ${formatBytes(file.size)}. The limit is ${formatBytes(maxBytes)}.`;
  return null;
}

function putWithProgress(url, file, headers, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    for (const [k, v] of Object.entries(headers || {})) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("The upload didn't finish. Try again.")));
    xhr.onerror = () => reject(new Error("The upload failed. Check your connection and try again."));
    xhr.onabort = () => reject(new Error("Upload cancelled."));
    xhr.send(file);
  });
}

/** Upload one file for an attempt. Resolves to the { key, name, size, type } to save in submission.files. */
export async function uploadAttemptFile(attemptId, file, onProgress) {
  const res = await api.post(`/api/attempts/${attemptId}/uploads`, { name: file.name, type: file.type || "", size: file.size });
  if (String(res.uploadUrl).startsWith("demo-upload:")) {
    demoBlobs.set(res.file.key, file);
    for (const p of [20, 55, 85, 100]) {
      await new Promise((r) => setTimeout(r, 120));
      onProgress?.(p);
    }
    return res.file;
  }
  await putWithProgress(res.uploadUrl, file, res.headers, onProgress);
  return res.file;
}

function download(href, name) {
  const a = document.createElement("a");
  a.href = href;
  if (name) a.download = name;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Open (download) file #index of an attempt through a short-lived link. */
export async function openAttemptFile(attemptId, index) {
  const res = await api.get(`/api/attempts/${attemptId}/files/${index}`);
  if (String(res.url).startsWith("demo-file:")) {
    const blob = demoBlobs.get(res.url.slice("demo-file:".length));
    if (!blob) throw new Error("Demo files are kept only in the tab you uploaded them from.");
    const href = URL.createObjectURL(blob);
    download(href, res.name);
    setTimeout(() => URL.revokeObjectURL(href), 60000);
    return;
  }
  download(res.url); // the link sets Content-Disposition: attachment with the original name
}

/** A submitted file as a button that fetches a fresh 10-minute link. */
export function AttemptFileLink({ attemptId, index, file, className }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await openAttemptFile(attemptId, index);
        } catch (e) {
          toast.error(e.status === 404 ? "You can't open this file. Evaluators can open files once they claim the attempt." : e.message);
        } finally {
          setBusy(false);
        }
      }}
      className={cn("flex max-w-full items-center gap-2 text-left break-all text-primary hover:underline disabled:opacity-60", className)}
    >
      {busy ? <Spinner className="size-4 shrink-0" /> : <Paperclip className="size-4 shrink-0" />}
      <span className="min-w-0">{file.name}</span>
      {file.size > 0 && <span className="shrink-0 text-xs text-subtle">{formatBytes(file.size)}</span>}
    </button>
  );
}
