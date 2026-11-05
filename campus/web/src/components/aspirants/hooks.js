import { useQuery } from "@tanstack/react-query";
import { api, qs } from "@/lib/api/client";
import { BRIDGE_TRACKS } from "./data";

/** GET /api/tracks?audience=aspirants with the static bridge tracks as fallback (error or empty). */
export function useBridgeTracks() {
  const q = useQuery({
    queryKey: ["public", "tracks", "aspirants"],
    queryFn: () => api.get(`/api/tracks${qs({ audience: "aspirants" })}`),
    retry: false,
    staleTime: 5 * 60_000,
  });
  const list = Array.isArray(q.data) ? q.data.filter((t) => t.forAspirants !== false) : [];
  const usingFallback = !!q.error || (!q.isLoading && list.length === 0);
  return { ...q, data: usingFallback ? BRIDGE_TRACKS : list, usingFallback };
}
