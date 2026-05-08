export const engagementRules = Object.freeze({
  dailyChallenge: {
    questionCount: 5,
    maxAttemptsPerDay: 2,
    dayBoundary: "UTC"
  },
  xp: {
    completion: 10,
    correctAnswer: 5,
    perfectBonus: 10,
    streak7Bonus: 30,
    streak15Bonus: 75,
    streak30Bonus: 150
  },
  coins: {
    completion: 5,
    correctAnswer: 2,
    streak7Bonus: 25,
    streak30Bonus: 100
  },
  badges: [
    {
      key: "streak_7",
      title: "7-Day Client Ready",
      description: "Completed a full week of Daily Growth Quests.",
      days: 7,
      icon: "flame"
    },
    {
      key: "streak_15",
      title: "15-Day Consistency",
      description: "Kept learning and practicing for fifteen days.",
      days: 15,
      icon: "badge-check"
    },
    {
      key: "streak_30",
      title: "30-Day Growth Builder",
      description: "Built a month-long habit of client-readiness practice.",
      days: 30,
      icon: "award"
    }
  ],
  levels: [
    {
      key: "LEVEL_1",
      label: "Starter",
      minXp: 0,
      completedDays: 0,
      rollingAccuracy: 0,
      streak: 0
    },
    {
      key: "LEVEL_2",
      label: "Active Learner",
      minXp: 200,
      completedDays: 5,
      rollingAccuracy: 0,
      streak: 0
    },
    {
      key: "LEVEL_3",
      label: "Skilled Contributor",
      minXp: 600,
      completedDays: 0,
      rollingAccuracy: 70,
      streak: 0
    },
    {
      key: "LEVEL_4",
      label: "Pro Contributor",
      minXp: 1500,
      completedDays: 0,
      rollingAccuracy: 80,
      streak: 15
    },
    {
      key: "GOLD",
      label: "Gold Contributor",
      minXp: 3500,
      completedDays: 0,
      rollingAccuracy: 85,
      streak: 30,
      requiresAdminSafeProfile: true
    }
  ],
  categories: [
    "CLIENT_COMMUNICATION",
    "SCOPE_MANAGEMENT",
    "DELIVERY",
    "QUALITY_CONTROL",
    "PLATFORM_RULES",
    "BUSINESS_BASICS"
  ],
  difficulties: ["BEGINNER", "INTERMEDIATE", "ADVANCED"]
});

const truthyFlagValues = new Set(["1", "true", "yes", "on"]);
const falseyFlagValues = new Set(["0", "false", "no", "off"]);

export const isFeatureFlagEnabled = (value, defaultValue = true) => {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (truthyFlagValues.has(normalized)) return true;
  if (falseyFlagValues.has(normalized)) return false;
  return defaultValue;
};

export const isEngagementMvpEnabled = () =>
  isFeatureFlagEnabled(process.env.ENGAGEMENT_MVP_ENABLED, true);

export const isAdminQuestionApprovalEnabled = () =>
  isFeatureFlagEnabled(process.env.ADMIN_QUESTION_APPROVAL_ENABLED, true);
