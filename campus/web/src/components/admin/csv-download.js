/**
 * Download a CSV export from the API (or the demo engine) as a file.
 *   await downloadCsv("/api/admin/reports/finance.csv?from=2026-10-01", "campus-finance.csv")
 * The JSON api client can't read CSV, so real mode uses fetch with the same bearer token.
 */
import { api, ApiError, IS_DEMO, tokenStore } from "@/lib/api/client";

const API_URL = (import.meta.env.VITE_CAMPUS_API_URL || "").replace(/\/$/, "");

export async function downloadCsv(path, filename) {
  let text;
  if (IS_DEMO) {
    text = await api.get(path);
  } else {
    const token = tokenStore.get();
    const res = await fetch(`${API_URL}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    text = await res.text();
    if (!res.ok) {
      let message = res.statusText || "Export failed";
      try {
        message = JSON.parse(text)?.error?.message || message;
      } catch {
        /* not JSON */
      }
      throw new ApiError(message, res.status);
    }
  }
  // BOM so Excel opens rupee signs and Indian names correctly
  const blob = new Blob(["﻿", typeof text === "string" ? text : ""], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
