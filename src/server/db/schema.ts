import { pgTable, uuid, text, timestamp, boolean, integer, bigint, jsonb, pgEnum, inet } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["super_admin", "friend"]);
export const memberRoleEnum = pgEnum("member_role", ["viewer"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passHash: text("pass_hash").notNull(),
  role: roleEnum("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});

export const invites = pgTable("invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  email: text("email").notNull(),
  role: roleEnum("role").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  oneTime: boolean("one_time").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const trackers = pgTable("trackers", {
  id: uuid("id").primaryKey().defaultRandom(),
  trackerId: text("tracker_id").notNull().unique(),
  ownerUserId: uuid("owner_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  siteUrl: text("site_url").notNull(),
  origins: text("origins").array().notNull().default([]),
  active: boolean("active").notNull().default(true),
  pageRules: jsonb("page_rules"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});

export const trackerMembers = pgTable("tracker_members", {
  trackerId: text("tracker_id")
    .notNull()
    .references(() => trackers.trackerId, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: memberRoleEnum("role").notNull().default("viewer"),
});

export const events = pgTable("events", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  ts: bigint("ts", { mode: "number" }).notNull(),
  ev: text("ev").notNull(),
  sid: text("sid").notNull(),
  trackerId: text("tracker_id")
    .notNull()
    .references(() => trackers.trackerId, { onDelete: "cascade" }),
  pageUrl: text("page_url").notNull(),
  path: text("path").notNull(),
  ref: text("ref"),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  utmTerm: text("utm_term"),
  utmContent: text("utm_content"),
  sw: integer("sw"),
  sh: integer("sh"),
  quizId: text("quiz_id"),
  questionId: text("question_id"),
  answerId: text("answer_id"),
  extra: jsonb("extra"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const leads = pgTable("leads", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  ts: bigint("ts", { mode: "number" }).notNull(),
  trackerId: text("tracker_id")
    .notNull()
    .references(() => trackers.trackerId, { onDelete: "cascade" }),
  sid: text("sid").notNull(),
  email: text("email"),
  name: text("name"),
  phone: text("phone"),
  extra: jsonb("extra"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const policies = pgTable("policies", {
  id: boolean("id").primaryKey().default(true),
  maxTrackersPerUser: integer("max_trackers_per_user").notNull().default(10),
  maxCollectRpsPerOrigin: integer("max_collect_rps_per_origin").notNull().default(10),
  retentionDays: integer("retention_days").notNull().default(365),
  allowedOrigins: text("allowed_origins").array().notNull().default([]),
});

export const authAttempts = pgTable("auth_attempts", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  email: text("email"),
  ip: inet("ip"),
  success: boolean("success").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  ownedTrackers: many(trackers),
  memberTrackers: many(trackerMembers),
}));

export const trackersRelations = relations(trackers, ({ one, many }) => ({
  owner: one(users, {
    fields: [trackers.ownerUserId],
    references: [users.id],
  }),
  members: many(trackerMembers),
  events: many(events),
  leads: many(leads),
}));

export const trackerMembersRelations = relations(trackerMembers, ({ one }) => ({
  tracker: one(trackers, {
    fields: [trackerMembers.trackerId],
    references: [trackers.trackerId],
  }),
  user: one(users, {
    fields: [trackerMembers.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Invite = typeof invites.$inferSelect;
export type NewInvite = typeof invites.$inferInsert;
export type Tracker = typeof trackers.$inferSelect;
export type NewTracker = typeof trackers.$inferInsert;
export type TrackerMember = typeof trackerMembers.$inferSelect;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Policy = typeof policies.$inferSelect;
export type AuthAttempt = typeof authAttempts.$inferSelect;
export type NewAuthAttempt = typeof authAttempts.$inferInsert;

