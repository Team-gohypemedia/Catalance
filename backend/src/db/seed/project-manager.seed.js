export const pmSeedPayload = {
  users: [
    {
      email: "pm@catalance.in",
      fullName: "Catalance PM",
      role: "PROJECT_MANAGER",
      status: "ACTIVE",
    },
    {
      email: "client@catalance.in",
      fullName: "Catalance Client",
      role: "CLIENT",
      status: "ACTIVE",
    },
    {
      email: "freelancer@catalance.in",
      fullName: "Catalance Freelancer",
      role: "FREELANCER",
      status: "ACTIVE",
    },
  ],
  projectTemplate: {
    title: "Catalance PM Module Implementation",
    description: "Seed project for PM module end-to-end validation.",
    category: "Web Platform",
    visibility: "private",
    status: "IN_PROGRESS",
    budgetTotal: 250000,
    timelineEstimate: "6 weeks",
  },
  milestones: [
    { code: "PHASE_1", title: "Kickoff & UI Design", payoutPercent: 0, sequence: 1 },
    { code: "PHASE_2", title: "Core Development", payoutPercent: 25, sequence: 2 },
    { code: "PHASE_3", title: "Integration & Testing", payoutPercent: 25, sequence: 3 },
    { code: "PHASE_FINAL", title: "Launch & Documentation", payoutPercent: 50, sequence: 4 },
  ],
};

