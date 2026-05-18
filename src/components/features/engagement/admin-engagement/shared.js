export const STATUS_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING_APPROVAL", label: "Pending approval" },
  { value: "APPROVED", label: "Approved" },
  { value: "DRAFT", label: "Draft" },
  { value: "REJECTED", label: "Rejected" },
];

export const CATEGORY_OPTIONS = [
  { value: "CLIENT_COMMUNICATION", label: "Client communication" },
  { value: "SCOPE_MANAGEMENT", label: "Scope management" },
  { value: "DELIVERY", label: "Delivery" },
  { value: "QUALITY_CONTROL", label: "Quality control" },
  { value: "PLATFORM_RULES", label: "Platform rules" },
  { value: "BUSINESS_BASICS", label: "Business basics" },
];

export const DIFFICULTY_OPTIONS = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

export const TYPE_OPTIONS = [
  { value: "MCQ", label: "MCQ" },
  { value: "TRUE_FALSE", label: "True / false" },
  { value: "SCENARIO_MCQ", label: "Scenario MCQ" },
];

export const DAILY_SET_SIZE = 5;

export const createTodayKey = () => new Date().toISOString().slice(0, 10);

export const toLineArray = (value) =>
  String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

export const toLinkArray = (value) =>
  toLineArray(value).map((item) => {
    const [label, ...urlParts] = item.split("|");
    return {
      label: (label || "Reference").trim(),
      url: urlParts.join("|").trim(),
    };
  });

export const emptyForm = {
  questionText: "",
  type: "MCQ",
  category: "CLIENT_COMMUNICATION",
  skillTag: "client_readiness",
  difficulty: "BEGINNER",
  options: [
    { id: "A", text: "" },
    { id: "B", text: "" },
    { id: "C", text: "" },
    { id: "D", text: "" },
  ],
  correctOptionId: "A",
  explanation: "",
  status: "PENDING_APPROVAL",
};

export const emptyContestForm = {
  title: "",
  description: "",
  detailsContent: "",
  imageUrl: "",
  category: "Contest",
  ctaLabel: "View Contest",
  goalSummary: "",
  submissionInstructions: "",
  rewardSummary: "",
  rewardCoins: 0,
  rewardXp: 0,
  badgeKey: "",
  badgeTitle: "",
  badgeDescription: "",
  badgeIcon: "award",
  deliverables: [""],
  reviewCriteria: [""],
  resourceLinks: [{ label: "", url: "" }],
  acceptedAssetTypes: ["image", "document", "link"],
  maxAttachments: 8,
  startDayKey: createTodayKey(),
  endDayKey: "",
  status: "DRAFT",
};

export const emptyContestReviewForm = {
  submissionId: "",
  status: "APPROVED",
  reviewNote: "",
  rewardCoins: 0,
  rewardXp: 0,
};

export const statusClassName = {
  APPROVED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
  PUBLISHED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
  PENDING_APPROVAL: "border-[#facc15]/20 bg-[#facc15]/10 text-[#fde68a]",
  PENDING: "border-[#facc15]/20 bg-[#facc15]/10 text-[#fde68a]",
  DRAFT: "border-white/10 bg-white/[0.04] text-muted-foreground",
  REJECTED: "border-red-500/20 bg-red-500/10 text-red-200",
  NEEDS_CHANGES: "border-primary/20 bg-primary/10 text-primary",
  ARCHIVED: "border-white/10 bg-white/[0.04] text-muted-foreground",
};

export const contestSubmissionStatusOptions = [
  "ALL",
  "PENDING",
  "APPROVED",
  "NEEDS_CHANGES",
  "REJECTED",
];

export const cloneQuestionToForm = (question) => ({
  questionText: question?.questionText || "",
  type: question?.type || "MCQ",
  category: question?.category || "CLIENT_COMMUNICATION",
  skillTag: question?.skillTag || "client_readiness",
  difficulty: question?.difficulty || "BEGINNER",
  options:
    Array.isArray(question?.options) && question.options.length
      ? question.options.map((option, index) => ({
          id: option.id || String.fromCharCode(65 + index),
          text: option.text || "",
        }))
      : emptyForm.options,
  correctOptionId: question?.correctOptionId || "A",
  explanation: question?.explanation || "",
  status:
    question?.status && ["DRAFT", "PENDING_APPROVAL", "APPROVED"].includes(question.status)
      ? question.status
      : "PENDING_APPROVAL",
});
