import Activity from "lucide-react/dist/esm/icons/activity";
import Crown from "lucide-react/dist/esm/icons/crown";
import Medal from "lucide-react/dist/esm/icons/medal";
import Star from "lucide-react/dist/esm/icons/star";
import Trophy from "lucide-react/dist/esm/icons/trophy";
import Zap from "lucide-react/dist/esm/icons/zap";
import { cn } from "@/shared/lib/utils";
import { getInitials } from "./shared";

const GrowthQuestWeeklyRankingPanel = ({ leaderboard, currentUserId }) => {
  const entries = Array.isArray(leaderboard?.entries) ? leaderboard.entries : [];
  const currentUser = leaderboard?.currentUser || null;
  let visibleEntries = currentUser
    ? [
        ...entries.slice(0, 5),
        ...entries.filter(
          (entry, index) =>
            index >= 5 &&
            (entry.userId === currentUserId ||
              Math.abs(Number(entry.rank || 0) - Number(currentUser.rank || 0)) <= 1)
        ),
      ].filter((entry, index, array) => array.findIndex((item) => item.userId === entry.userId) === index)
    : entries.slice(0, 5);

  if (visibleEntries.length < 5) {
    const mockNames = ["Alex Rivera", "Sarah Chen", "Jordan Smith", "Taylor Wong", "Casey Jones"];
    const existingRanks = new Set(visibleEntries.map((entry) => Number(entry.rank)));
    let nextRank = 1;

    while (visibleEntries.length < 5) {
      if (!existingRanks.has(nextRank)) {
        visibleEntries.push({
          userId: `mock-${nextRank}`,
          fullName: mockNames[visibleEntries.length % mockNames.length],
          rank: nextRank,
          totalCoins: 0,
          isMock: true,
        });
      }
      nextRank += 1;
    }

    visibleEntries.sort((left, right) => Number(left.rank) - Number(right.rank));
  }

  return (
    <div
      className="weekly-ranking"
      style={{
        borderRadius: "18px",
        border: "1px solid rgba(80,55,18,0.4)",
        padding: "1.5rem",
        boxShadow: "0 12px 48px rgba(0,0,0,0.5)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <svg
        style={{ position: "absolute", top: "1rem", right: "1.25rem", width: "80px", height: "80px", opacity: 0.18, pointerEvents: "none" }}
        viewBox="0 0 80 80"
        fill="none"
      >
        <path d="M10 40 C10 28 15 18 22 12 C20 22 20 32 24 40 C18 38 14 39 10 40Z" fill="#d3be92" />
        <path d="M10 40 C10 52 15 62 22 68 C20 58 20 48 24 40 C18 42 14 41 10 40Z" fill="#d3be92" opacity="0.7" />
        <path d="M70 40 C70 28 65 18 58 12 C60 22 60 32 56 40 C62 38 66 39 70 40Z" fill="#d3be92" />
        <path d="M70 40 C70 52 65 62 58 68 C60 58 60 48 56 40 C62 42 66 41 70 40Z" fill="#d3be92" opacity="0.7" />
        <circle cx="40" cy="74" r="4" fill="#d3be92" opacity="0.9" />
        <circle cx="32" cy="72" r="2.5" fill="#d3be92" opacity="0.6" />
        <circle cx="48" cy="72" r="2.5" fill="#d3be92" opacity="0.6" />
      </svg>

      <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1.25rem" }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{ width: "4rem", height: "4rem", borderRadius: "0.85rem", background: "linear-gradient(145deg,rgba(255,193,7,0.25),rgba(180,130,0,0.15))", border: "1px solid rgba(200,160,50,0.5)", display: "grid", placeItems: "center", boxShadow: "0 0 24px rgba(255,193,7,0.15),inset 0 1px 0 rgba(255,255,255,0.08)" }}>
            <Trophy className="size-7" style={{ color: "#ffc107", filter: "drop-shadow(0 0 8px rgba(255,193,7,0.5))" }} />
          </div>
        </div>
        <div>
          <h3 style={{ fontSize: "1.5rem", fontWeight: 900, letterSpacing: "0.04em", color: "#f3ead5", lineHeight: 1.1, textTransform: "uppercase" }}>Weekly Ranking</h3>
          <p style={{ marginTop: "0.4rem", fontSize: "0.82rem", lineHeight: 1.65, color: "#a99c84" }}>
            Compete for weekly XP rank. Contest rewards and Growth Quest activity both count here.
          </p>
        </div>
      </div>

      <div style={{ borderRadius: "18px", border: "1px solid rgba(51,41,23,0.8)", overflow: "hidden" }}>
        <div className="weekly-ranking__table-head" style={{ display: "grid", gridTemplateColumns: "72px 1fr 120px", gap: "0.75rem", borderBottom: "1px solid rgba(45,36,19,0.8)", padding: "0.65rem 1.25rem", fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(143,132,107,0.8)" }}>
          <span>Rank</span>
          <span>Freelancer</span>
          <span style={{ textAlign: "right" }}>Coins Earned</span>
        </div>

        <div style={{ display: "grid", gap: "0.5rem", padding: "0.75rem" }}>
          {visibleEntries.length ? (
            visibleEntries.map((entry) => {
              const isMe = entry.userId === currentUserId;
              return (
                <div
                  key={entry.userId}
                  className="weekly-ranking__row group"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "72px 1fr 120px",
                    alignItems: "center",
                    gap: "0.75rem",
                    borderRadius: "14px",
                    border: `1px solid ${isMe ? "rgba(255,193,7,0.4)" : Number(entry.rank) <= 3 ? "rgba(255,255,255,0.12)" : "rgba(52,42,23,0.8)"}`,
                    padding: "0.85rem 1rem",
                    boxShadow: isMe ? "0 4px 20px -5px rgba(255,193,7,0.1)" : "none",
                    transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {Number(entry.rank) <= 3 ? (
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: Number(entry.rank) === 1 ? "#ffc107" : Number(entry.rank) === 2 ? "#e2e8f0" : "#cd7f32" }} />
                  ) : null}

                  <div style={{ display: "grid", placeItems: "center" }}>
                    {Number(entry.rank) === 1 ? (
                      <div className="relative">
                        <Crown className="size-6 text-amber-400" style={{ filter: "drop-shadow(0 0 8px rgba(251,191,36,0.6))" }} />
                        <span className="absolute -bottom-1 -right-1 text-[10px] font-black text-amber-500/50">1</span>
                      </div>
                    ) : Number(entry.rank) === 2 ? (
                      <div className="relative">
                        <Medal className="size-6 text-slate-300" />
                        <span className="absolute -bottom-1 -right-1 text-[10px] font-black text-slate-400/50">2</span>
                      </div>
                    ) : Number(entry.rank) === 3 ? (
                      <div className="relative">
                        <Medal className="size-6 text-amber-700/80" />
                        <span className="absolute -bottom-1 -right-1 text-[10px] font-black text-amber-800/50">3</span>
                      </div>
                    ) : (
                      <div style={{ fontSize: "1.25rem", fontVariantNumeric: "tabular-nums", fontWeight: 800, color: "rgba(234,215,166,0.5)" }}>
                        {entry.rank}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", minWidth: 0 }}>
                    <div
                      style={{
                        width: "2.8rem",
                        height: "2.8rem",
                        borderRadius: "12px",
                        flexShrink: 0,
                        border: `1px solid ${isMe ? "rgba(255,193,7,0.3)" : "rgba(255,255,255,0.08)"}`,
                        background: isMe ? "rgba(255,193,7,0.05)" : "rgba(255,255,255,0.02)",
                        display: "grid",
                        placeItems: "center",
                        fontSize: "0.85rem",
                        fontWeight: 900,
                        color: isMe ? "#ffc107" : "#d8c7a1",
                      }}
                    >
                      {getInitials(isMe ? "You" : entry.fullName)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: "0.95rem", fontWeight: 700, color: isMe ? "#fff" : "#f0e6cf", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {isMe ? "You" : entry.fullName}
                      </p>
                      <div style={{ marginTop: "0.15rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: isMe ? "#ffc107" : "rgba(159,146,120,0.6)" }}>
                          {entry.engagementLevelLabel || "Starter"}
                        </span>
                        {isMe ? (
                          <span className="rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-black text-amber-500">
                            CURRENTLY AT RANK {entry.rank}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="weekly-ranking__coins" style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.35rem" }}>
                      <span style={{ fontSize: "1.1rem", fontWeight: 900, color: isMe ? "#ffc107" : "#f1d48b", fontVariantNumeric: "tabular-nums" }}>
                        {(entry.weeklyCoins ?? entry.totalCoins ?? 0).toLocaleString()}
                      </span>
                      <Star className={cn("size-3.5", isMe ? "text-amber-400" : "text-amber-500/60")} />
                    </div>
                    <p style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(125,114,93,0.5)", marginTop: "0.1rem" }}>
                      Coins Earned
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ borderRadius: "12px", border: "1px dashed rgba(58,45,17,0.8)", background: "rgba(26,20,9,0.8)", padding: "1.25rem", fontSize: "0.85rem", color: "#a99c84" }}>
              Weekly rankings will appear after freelancers start earning XP this week.
            </div>
          )}
        </div>
      </div>

      {currentUser ? (
        <div className="weekly-ranking__totals" style={{ marginTop: "1rem", borderRadius: "14px", border: "1px solid rgba(255,193,7,0.15)", background: "rgba(255,193,7,0.03)", padding: "0.9rem 1.1rem", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", backdropFilter: "blur(4px)" }}>
          <div style={{ width: "2.4rem", height: "2.4rem", borderRadius: "0.75rem", background: "rgba(255,193,7,0.1)", border: "1px solid rgba(255,193,7,0.2)", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Activity className="size-4.5 text-amber-500" />
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)" }}>
              Your Weekly Totals
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <Crown className="size-3 text-amber-500" />
                <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#fff" }}>
                  Rank #{currentUser.rank}
                </span>
              </div>
              <div style={{ width: "1px", height: "12px", background: "rgba(255,255,255,0.1)" }} />
              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <Zap className="size-3 text-amber-500" />
                <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#fff" }}>
                  {(currentUser.weeklyXp || 0).toLocaleString()} XP
                </span>
              </div>
              <div style={{ width: "1px", height: "12px", background: "rgba(255,255,255,0.1)" }} />
              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <Star className="size-3 text-amber-500" />
                <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#fff" }}>
                  {(currentUser.weeklyCoins || 0).toLocaleString()} coins
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default GrowthQuestWeeklyRankingPanel;
