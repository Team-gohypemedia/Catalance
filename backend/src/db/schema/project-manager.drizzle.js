import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "CLIENT",
  "FREELANCER",
  "PROJECT_MANAGER",
  "ADMIN",
]);
export const userStatusEnum = pgEnum("user_status", ["ACTIVE", "SUSPENDED", "PENDING_APPROVAL"]);
export const projectStatusEnum = pgEnum("pm_project_status", [
  "PROPOSAL",
  "STARTED",
  "IN_PROGRESS",
  "COMPLETED",
  "ISSUE_RAISED",
]);
export const assignmentStatusEnum = pgEnum("pm_assignment_status", ["ACTIVE", "INACTIVE", "REPLACED"]);
export const meetingStatusEnum = pgEnum("pm_meeting_status", ["SCHEDULED", "RESCHEDULED", "CANCELLED", "COMPLETED"]);
export const meetingPlatformEnum = pgEnum("pm_meeting_platform", ["ZOOM", "GOOGLE_MEET", "INTERNAL"]);
export const meetingParticipantScopeEnum = pgEnum("pm_meeting_participant_scope", ["CLIENT", "FREELANCER", "BOTH"]);
export const milestoneCodeEnum = pgEnum("pm_milestone_code", ["PHASE_1", "PHASE_2", "PHASE_3", "PHASE_FINAL"]);
export const milestoneStatusEnum = pgEnum("pm_milestone_status", ["LOCKED", "PENDING", "APPROVED", "PAID"]);
export const reportSeverityEnum = pgEnum("pm_report_severity", ["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const reportStatusEnum = pgEnum("pm_report_status", ["IN_REVIEW", "RESOLVED", "ESCALATED"]);
export const profileRequestStatusEnum = pgEnum("pm_profile_request_status", ["PENDING", "APPROVED", "REJECTED"]);

const tableTimestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    fullName: varchar("full_name", { length: 160 }).notNull(),
    avatarUrl: text("avatar_url"),
    phoneNumber: varchar("phone_number", { length: 32 }),
    role: userRoleEnum("role").notNull().default("FREELANCER"),
    status: userStatusEnum("status").notNull().default("ACTIVE"),
    metadata: jsonb("metadata").default(sql`'{}'::jsonb`).notNull(),
    ...tableTimestamps,
  },
  (table) => ({
    usersEmailUnique: uniqueIndex("users_email_unique").on(table.email),
    usersRoleIdx: index("users_role_idx").on(table.role),
  })
);

export const projectManagers = pgTable(
  "project_managers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    onboardingStatus: varchar("onboarding_status", { length: 32 }).notNull().default("PENDING"),
    expertise: text("expertise").array().default(sql`ARRAY[]::text[]`).notNull(),
    yearsOfExperience: integer("years_of_experience").default(0).notNull(),
    availability: varchar("availability", { length: 120 }),
    workloadPreference: varchar("workload_preference", { length: 120 }),
    identificationUpload: text("identification_upload"),
    supportingDocuments: jsonb("supporting_documents").default(sql`'[]'::jsonb`).notNull(),
    ...tableTimestamps,
  },
  (table) => ({
    projectManagersUserUnique: uniqueIndex("project_managers_user_unique").on(table.userId),
  })
);

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    companyName: varchar("company_name", { length: 160 }),
    profile: jsonb("profile").default(sql`'{}'::jsonb`).notNull(),
    ...tableTimestamps,
  },
  (table) => ({
    clientsUserUnique: uniqueIndex("clients_user_unique").on(table.userId),
  })
);

export const freelancers = pgTable(
  "freelancers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 160 }),
    bio: text("bio"),
    skills: text("skills").array().default(sql`ARRAY[]::text[]`).notNull(),
    rating: integer("rating").default(0).notNull(),
    reviewsCount: integer("reviews_count").default(0).notNull(),
    yearsOfExperience: integer("years_of_experience").default(0).notNull(),
    isAvailable: boolean("is_available").default(true).notNull(),
    portfolioUrl: text("portfolio_url"),
    ...tableTimestamps,
  },
  (table) => ({
    freelancersUserUnique: uniqueIndex("freelancers_user_unique").on(table.userId),
    freelancersAvailabilityIdx: index("freelancers_availability_idx").on(table.isAvailable),
  })
);

export const projects = pgTable(
  "pm_projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectCode: varchar("project_code", { length: 32 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description").notNull(),
    category: varchar("category", { length: 120 }),
    visibility: varchar("visibility", { length: 32 }).default("private").notNull(),
    status: projectStatusEnum("status").notNull().default("PROPOSAL"),
    budgetTotal: integer("budget_total").default(0).notNull(),
    timelineEstimate: varchar("timeline_estimate", { length: 120 }),
    clientId: uuid("client_id").notNull().references(() => clients.id),
    projectManagerId: uuid("project_manager_id").notNull().references(() => projectManagers.id),
    handoverFinalizedAt: timestamp("handover_finalized_at", { withTimezone: true }),
    ...tableTimestamps,
  },
  (table) => ({
    projectsCodeUnique: uniqueIndex("pm_projects_code_unique").on(table.projectCode),
    projectsStatusIdx: index("pm_projects_status_idx").on(table.status),
    projectsPmIdx: index("pm_projects_pm_idx").on(table.projectManagerId),
  })
);

export const projectAssignments = pgTable(
  "project_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    freelancerId: uuid("freelancer_id").notNull().references(() => freelancers.id),
    assignedByPmId: uuid("assigned_by_pm_id").notNull().references(() => projectManagers.id),
    status: assignmentStatusEnum("status").notNull().default("ACTIVE"),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
    replacedAt: timestamp("replaced_at", { withTimezone: true }),
    metadata: jsonb("metadata").default(sql`'{}'::jsonb`).notNull(),
    ...tableTimestamps,
  },
  (table) => ({
    assignmentProjectFreelancerUnique: uniqueIndex("pm_assignment_project_freelancer_unique").on(
      table.projectId,
      table.freelancerId,
      table.status
    ),
    assignmentProjectIdx: index("pm_assignment_project_idx").on(table.projectId),
  })
);

export const projectMessages = pgTable(
  "project_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    senderUserId: uuid("sender_user_id").references(() => users.id),
    senderLabel: varchar("sender_label", { length: 64 }).notNull(),
    senderRole: userRoleEnum("sender_role").notNull(),
    content: text("content").notNull(),
    attachments: jsonb("attachments").default(sql`'[]'::jsonb`).notNull(),
    ...tableTimestamps,
  },
  (table) => ({
    messageProjectIdx: index("pm_message_project_idx").on(table.projectId),
  })
);

export const projectMessageReads = pgTable(
  "project_message_reads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectMessageId: uuid("project_message_id").notNull().references(() => projectMessages.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    readAt: timestamp("read_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    messageReadUnique: uniqueIndex("pm_message_read_unique").on(table.projectMessageId, table.userId),
  })
);

export const meetings = pgTable(
  "pm_meetings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    projectManagerId: uuid("project_manager_id").notNull().references(() => projectManagers.id),
    title: varchar("title", { length: 180 }).notNull(),
    participantScope: meetingParticipantScopeEnum("participant_scope").notNull().default("BOTH"),
    platform: meetingPlatformEnum("platform").notNull().default("INTERNAL"),
    meetingLink: text("meeting_link"),
    notes: text("notes"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    status: meetingStatusEnum("status").notNull().default("SCHEDULED"),
    ...tableTimestamps,
  },
  (table) => ({
    meetingPmTimeIdx: index("pm_meeting_pm_time_idx").on(table.projectManagerId, table.startsAt),
    meetingTimeCheck: check("pm_meeting_time_check", sql`${table.endsAt} > ${table.startsAt}`),
  })
);

export const meetingParticipants = pgTable(
  "pm_meeting_participants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    meetingId: uuid("meeting_id").notNull().references(() => meetings.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    participantType: varchar("participant_type", { length: 32 }).notNull(),
    isOrganizer: boolean("is_organizer").default(false).notNull(),
    ...tableTimestamps,
  },
  (table) => ({
    meetingParticipantUnique: uniqueIndex("pm_meeting_participant_unique").on(table.meetingId, table.userId),
  })
);

export const milestones = pgTable(
  "pm_milestones",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    code: milestoneCodeEnum("code").notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    payoutPercent: integer("payout_percent").notNull(),
    payoutAmount: integer("payout_amount").notNull().default(0),
    status: milestoneStatusEnum("status").notNull().default("LOCKED"),
    sequence: integer("sequence").notNull(),
    notes: text("notes"),
    ...tableTimestamps,
  },
  (table) => ({
    milestoneProjectCodeUnique: uniqueIndex("pm_milestone_project_code_unique").on(table.projectId, table.code),
  })
);

export const milestoneApprovals = pgTable(
  "pm_milestone_approvals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    milestoneId: uuid("milestone_id").notNull().references(() => milestones.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    approvedByPmId: uuid("approved_by_pm_id").notNull().references(() => projectManagers.id),
    approvalNote: text("approval_note"),
    approvedAt: timestamp("approved_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    milestoneApprovalUnique: uniqueIndex("pm_milestone_approval_unique").on(table.projectId, table.milestoneId),
  })
);

export const freelancerInternalReviews = pgTable("pm_freelancer_internal_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  freelancerId: uuid("freelancer_id").notNull().references(() => freelancers.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  reviewedByPmId: uuid("reviewed_by_pm_id").notNull().references(() => projectManagers.id),
  rating: integer("rating").notNull(),
  reviewText: text("review_text").notNull(),
  privateNotes: text("private_notes"),
  ...tableTimestamps,
});

export const reports = pgTable(
  "pm_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id").notNull().references(() => projects.id),
    raisedByPmId: uuid("raised_by_pm_id").notNull().references(() => projectManagers.id),
    category: varchar("category", { length: 120 }).notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    description: text("description").notNull(),
    severity: reportSeverityEnum("severity").notNull().default("MEDIUM"),
    status: reportStatusEnum("status").notNull().default("IN_REVIEW"),
    attachments: jsonb("attachments").default(sql`'[]'::jsonb`).notNull(),
    ...tableTimestamps,
  },
  (table) => ({
    reportsProjectIdx: index("pm_reports_project_idx").on(table.projectId),
  })
);

export const projectHandoverChecklist = pgTable(
  "pm_project_handover_checklist",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    sourceCodeTransferred: boolean("source_code_transferred").notNull().default(false),
    documentationFinalized: boolean("documentation_finalized").notNull().default(false),
    credentialsShared: boolean("credentials_shared").notNull().default(false),
    finalFilesDelivered: boolean("final_files_delivered").notNull().default(false),
    noPendingIssues: boolean("no_pending_issues").notNull().default(false),
    verifiedByPmId: uuid("verified_by_pm_id").references(() => projectManagers.id),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    ...tableTimestamps,
  },
  (table) => ({
    handoverProjectUnique: uniqueIndex("pm_handover_project_unique").on(table.projectId),
  })
);

export const profileEditRequests = pgTable("pm_profile_edit_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectManagerId: uuid("project_manager_id").notNull().references(() => projectManagers.id, { onDelete: "cascade" }),
  payload: jsonb("payload").notNull(),
  status: profileRequestStatusEnum("status").notNull().default("PENDING"),
  reviewedByAdminUserId: uuid("reviewed_by_admin_user_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  rejectionReason: text("rejection_reason"),
  ...tableTimestamps,
});

export const notifications = pgTable("pm_notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 180 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 60 }).notNull().default("general"),
  isRead: boolean("is_read").notNull().default(false),
  payload: jsonb("payload").default(sql`'{}'::jsonb`).notNull(),
  ...tableTimestamps,
});

export const projectRelations = relations(projects, ({ one, many }) => ({
  client: one(clients, { fields: [projects.clientId], references: [clients.id] }),
  projectManager: one(projectManagers, { fields: [projects.projectManagerId], references: [projectManagers.id] }),
  assignments: many(projectAssignments),
  messages: many(projectMessages),
  meetings: many(meetings),
  milestones: many(milestones),
  approvals: many(milestoneApprovals),
  reports: many(reports),
  handover: many(projectHandoverChecklist),
}));

export const businessRuleSql = {
  pmMax10ActiveProjects: sql`
CREATE OR REPLACE FUNCTION enforce_pm_max_10_active_projects()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.project_manager_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF (SELECT COUNT(*) FROM pm_projects
      WHERE project_manager_id = NEW.project_manager_id
      AND status IN ('PROPOSAL', 'STARTED', 'IN_PROGRESS', 'ISSUE_RAISED')
      AND deleted_at IS NULL
      AND id <> COALESCE(NEW.id, gen_random_uuid())) >= 10 THEN
    RAISE EXCEPTION 'Project Manager cannot exceed 10 active projects';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;`,
  preventMeetingOverlaps: sql`
CREATE OR REPLACE FUNCTION enforce_pm_meeting_conflict()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pm_meetings m
    WHERE m.project_manager_id = NEW.project_manager_id
      AND m.id <> COALESCE(NEW.id, gen_random_uuid())
      AND m.deleted_at IS NULL
      AND tstzrange(m.starts_at, m.ends_at, '[)') && tstzrange(NEW.starts_at, NEW.ends_at, '[)')
      AND m.status IN ('SCHEDULED', 'RESCHEDULED')
  ) THEN
    RAISE EXCEPTION 'Meeting time conflict for Project Manager';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;`,
  milestonePayoutRestriction: sql`
ALTER TABLE pm_milestones
ADD CONSTRAINT pm_milestone_payout_rule
CHECK (
  (code = 'PHASE_1' AND payout_percent = 0) OR
  (code = 'PHASE_2' AND payout_percent = 25) OR
  (code = 'PHASE_3' AND payout_percent = 25) OR
  (code = 'PHASE_FINAL' AND payout_percent = 50)
);`,
  closureDependsOnHandover: sql`
CREATE OR REPLACE FUNCTION enforce_project_close_on_handover()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'COMPLETED' THEN
    IF NOT EXISTS (
      SELECT 1 FROM pm_project_handover_checklist h
      WHERE h.project_id = NEW.id
        AND h.source_code_transferred
        AND h.documentation_finalized
        AND h.credentials_shared
        AND h.final_files_delivered
        AND h.no_pending_issues
        AND h.deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Project cannot close until handover checklist is fully verified';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;`,
};

