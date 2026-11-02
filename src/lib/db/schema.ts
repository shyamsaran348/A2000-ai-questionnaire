import { pgTable, uuid, text, timestamp, boolean, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";

export const caseStatusEnum = pgEnum("case_status", [
  "draft",
  "in_progress",
  "ready_for_review",
  "completed",
  "archived",
]);

export const sectionStatusEnum = pgEnum("section_status", [
  "not_started",
  "in_progress",
  "submitted",
  "returned_for_changes",
]);

export const workflowModeEnum = pgEnum("workflow_mode", [
  "parallel",
  "sequential",
]);

// Organization / Hospital Clients
export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  industry: text("industry").default("Healthcare").notNull(),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Questionnaire Templates (Hospital, FMCG/Masala, etc.)
export const templates = pgTable("templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").unique().notNull(), // e.g., "hospital_discovery_v1"
  title: text("title").notNull(),
  description: text("description"),
  industry: text("industry").notNull(),
  version: integer("version").default(1).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  sectionsData: jsonb("sections_data").$type<any[]>().notNull(), // Complete structured definition
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Case: Specific engagement for an organization
export const cases = pgTable("cases", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  templateId: uuid("template_id").references(() => templates.id).notNull(),
  templateVersion: integer("template_version").notNull(),
  caseCode: text("case_code").unique().notNull(), // e.g. "CASE-2026-HOSP-01"
  title: text("title").notNull(),
  status: caseStatusEnum("status").default("draft").notNull(),
  workflowMode: workflowModeEnum("workflow_mode").default("parallel").notNull(),
  currentSectionOrder: integer("current_section_order").default(1).notNull(),
  createdBy: text("created_by").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Per-case Section Assignment
export const caseSections = pgTable("case_sections", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id").references(() => cases.id, { onDelete: "cascade" }).notNull(),
  sectionNumber: integer("section_number").notNull(),
  sectionKey: text("section_key").notNull(),
  title: text("title").notNull(),
  department: text("department").notNull(),
  assignedContactName: text("assigned_contact_name"),
  assignedContactEmail: text("assigned_contact_email"),
  status: sectionStatusEnum("status").default("not_started").notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  submittedBy: text("submitted_by"),
  returnReason: text("return_reason"),
  lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).defaultNow().notNull(),
});

// Passwordless Magic Link Tokens
export const caseAccessTokens = pgTable("case_access_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id").references(() => cases.id, { onDelete: "cascade" }).notNull(),
  caseSectionId: uuid("case_section_id").references(() => caseSections.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").unique().notNull(),
  recipientEmail: text("recipient_email").notNull(),
  role: text("role").default("department").notNull(), // "department" | "client_lead" | "admin"
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Answers
export const answers = pgTable("answers", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id").references(() => cases.id, { onDelete: "cascade" }).notNull(),
  questionKey: text("question_key").notNull(),
  sectionNumber: integer("section_number").notNull(),
  value: jsonb("value").notNull(), // string, array, or object
  answeredByName: text("answered_by_name"),
  answeredByEmail: text("answered_by_email"),
  department: text("department"),
  currentRevision: integer("current_revision").default(1).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Answer Revision History (Append-only audit)
export const answerRevisions = pgTable("answer_revisions", {
  id: uuid("id").defaultRandom().primaryKey(),
  answerId: uuid("answer_id").references(() => answers.id, { onDelete: "cascade" }).notNull(),
  caseId: uuid("case_id").references(() => cases.id, { onDelete: "cascade" }).notNull(),
  questionKey: text("question_key").notNull(),
  value: jsonb("value").notNull(),
  revisionNumber: integer("revision_number").notNull(),
  changedByName: text("changed_by_name"),
  changedByEmail: text("changed_by_email"),
  department: text("department"),
  changeReason: text("change_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Audit Log
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id").references(() => cases.id, { onDelete: "cascade" }).notNull(),
  eventType: text("event_type").notNull(), // case_created, section_submitted, returned_for_changes, exported_excel, exported_pdf
  actorName: text("actor_name"),
  actorEmail: text("actor_email"),
  actorRole: text("actor_role"),
  notes: text("notes"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Section Comments
export const sectionComments = pgTable("section_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id").references(() => cases.id, { onDelete: "cascade" }).notNull(),
  caseSectionId: uuid("case_section_id").references(() => caseSections.id, { onDelete: "cascade" }),
  questionKey: text("question_key"),
  authorName: text("author_name").notNull(),
  authorEmail: text("author_email").notNull(),
  department: text("department").notNull(),
  commentText: text("comment_text").notNull(),
  isInternalA2000: boolean("is_internal_a2000").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

