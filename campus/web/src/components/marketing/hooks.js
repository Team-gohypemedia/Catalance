import { useQuery } from "@tanstack/react-query";
import { api, qs } from "@/lib/api/client";
import { FALLBACK_COLLEGE_BOARD, FALLBACK_STATS, FALLBACK_TRACKS } from "./data";

const SOFT = { retry: false, staleTime: 5 * 60_000 };

/** GET /api/public/stats — falls back to static numbers on error. */
export function usePublicStats() {
  const q = useQuery({ queryKey: ["public", "stats"], queryFn: () => api.get("/api/public/stats"), ...SOFT });
  const usingFallback = !!q.error || (!q.isLoading && !q.data);
  return { ...q, data: usingFallback ? FALLBACK_STATS : q.data, usingFallback };
}

/**
 * GET /api/tracks — falls back to the static list of 9 tracks on error.
 * `fillEmpty` also uses the fallback when the API returns [] (marketing teasers).
 */
export function useTracks({ fillEmpty = false } = {}) {
  const q = useQuery({ queryKey: ["public", "tracks"], queryFn: () => api.get("/api/tracks"), ...SOFT });
  const empty = Array.isArray(q.data) && q.data.length === 0;
  const usingFallback = !!q.error || (fillEmpty && empty);
  return { ...q, data: usingFallback ? FALLBACK_TRACKS : q.data, usingFallback };
}

/** GET /api/leaderboard?scope=colleges — falls back to a static board on error. */
export function useCollegeBoard(period = "season", { fillEmpty = false } = {}) {
  const q = useQuery({
    queryKey: ["public", "leaderboard", "colleges", period],
    queryFn: () => api.get(`/api/leaderboard${qs({ scope: "colleges", period })}`),
    ...SOFT,
  });
  const empty = !q.data?.items?.length;
  const usingFallback = !!q.error || (fillEmpty && !q.isLoading && empty);
  return { ...q, data: usingFallback ? FALLBACK_COLLEGE_BOARD : q.data, usingFallback };
}
