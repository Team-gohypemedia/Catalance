import { useEffect, useState } from "react";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import CalendarDays from "lucide-react/dist/esm/icons/calendar-days";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Tag from "lucide-react/dist/esm/icons/tag";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/shared/context/AuthContext";
import "@/components/features/engagement/FreelancerGrowthQuestPage.css";

const FreelancerGrowthQuestContestDetailPage = () => {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadContest = async () => {
      if (!authFetch || !contestId) return;
      setLoading(true);
      setError("");
      try {
        const response = await authFetch(`/engagement/contests/${contestId}`);
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.message || "Failed to load contest details.");
        }
        if (active) {
          setContest(payload?.data || null);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError?.message || "Failed to load contest details.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadContest();
    return () => {
      active = false;
    };
  }, [authFetch, contestId]);

  if (loading) {
    return (
      <div className="growth-quest-shell">
        <div className="growth-quest-page">
          <div className="flex min-h-[420px] items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="size-7 animate-spin text-primary" />
              <p className="text-sm">Loading contest details.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="growth-quest-shell">
        <div className="growth-quest-page">
          <div className="growth-quest-panel p-8">
            <Button type="button" variant="outline" onClick={() => navigate("/freelancer/growth-quest")}>
              <ArrowLeft className="size-4" />
              Back to Growth Quest
            </Button>
            <p className="mt-6 text-sm text-red-300">{error || "Contest not found."}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="growth-quest-shell">
      <div className="growth-quest-page">
        <div className="growth-quest-dashboard">
          <section className="growth-quest-panel p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Button type="button" variant="outline" onClick={() => navigate("/freelancer/growth-quest")}>
                <ArrowLeft className="size-4" />
                Back to Growth Quest
              </Button>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <Tag className="size-4" />
                  {contest.category}
                </span>
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="size-4" />
                  {contest.startDayKey}
                  {contest.endDayKey ? ` to ${contest.endDayKey}` : ""}
                </span>
              </div>
            </div>

            {contest.imageUrl ? (
              <img
                src={contest.imageUrl}
                alt={contest.title}
                className="mt-6 h-[280px] w-full rounded-2xl border border-white/10 object-cover"
              />
            ) : null}

            <div className="mt-8">
              <p className="text-[0.7rem] font-black uppercase tracking-[0.18em] text-primary">
                Admin Contest
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-white">
                {contest.title}
              </h1>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                {contest.description}
              </p>
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-lg font-black text-white">Contest Details</h2>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                {contest.detailsContent || contest.description}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default FreelancerGrowthQuestContestDetailPage;
