import { relations, sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgPolicy,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";


// Permission types
export type MovePermission = "creator" | "everyone";
export type DeletePermission = "creator" | "everyone";

// Tables

export const users = pgTable("users", {
  id: text("id").primaryKey(), // visitorId from fingerprint
  username: text("username").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  pgPolicy("users are readable", {
    for: 'select',
    to: authenticatedRole,
    using: sql`true`,
  }),

  pgPolicy("users can update their own profile", {
    for: 'update',
    to: authenticatedRole,
    using: sql`${table.id} = auth.jwt() -> 'user_metadata' ->> 'visitor_id'`,
    withCheck: sql`${table.id} = auth.jwt() -> 'user_metadata' ->> 'visitor_id'`,
  }),
]);

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdById: text("created_by_id").notNull().references(() => users.id),
  isLocked: boolean("is_locked").notNull().default(false),
  movePermission: text("move_permission")
    .$type<MovePermission>()
    .notNull()
    .default("creator"),
  deletePermission: text("delete_permission")
    .$type<DeletePermission>()
    .notNull()
    .default("creator"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  pgPolicy("session is readable by anyone", {
    for: 'select',
    to: authenticatedRole,
    using: sql`true`,
  }),
  pgPolicy("only creator can update session permissions", {
    for: 'update',
    to: authenticatedRole,
    using: sql`auth.jwt()->'user_metadata'->>'visitor_id' = ${table.createdById}`,
    withCheck: sql`auth.jwt()->'user_metadata'->>'visitor_id' = ${table.createdById}`,
  }),
]);

export const sessionParticipants = pgTable(
  "session_participants",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sessionId: text("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("participant"), // "creator" | "participant"
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.sessionId] }),
    pgPolicy("session participants are readable by anyone", {
      for: 'select',
      to: authenticatedRole,
      using: sql`true`,
    }),
    pgPolicy("user can join a session", {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${table.userId} = auth.jwt()->'user_metadata'->>'visitor_id'`,
    }),
  ],
);

export const cards = pgTable("cards", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  content: text("content").notNull().default(""),
  color: text("color").notNull().default("#fef08a"),
  x: real("x").notNull().default(100),
  y: real("y").notNull().default(100),
  votes: integer("votes").notNull().default(0),
  votedBy: jsonb("voted_by").$type<string[]>().notNull().default([]),
  createdById: text("created_by_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => [
  pgPolicy("cards are readable by anyone", {
    for: 'select',
    to: authenticatedRole,
    using: sql`true`,
  }),
  pgPolicy("anyone can create a card", {
    for: 'insert',
    to: authenticatedRole,
    withCheck: sql`${table.createdById} = auth.jwt()->'user_metadata'->>'visitor_id'`,
  }),
  // Move card:
  // - creator always
  // - OR anyone if session.move_permission = 'everyone'
  pgPolicy("update card if allowed", {
    for: 'update',
    to: authenticatedRole,
    using: sql`
      ${table.createdById} = auth.jwt()->'user_metadata'->>'visitor_id'
      or exists (
        select 1
        from sessions s
        where s.id = ${table.sessionId}
        and s.move_permission = 'everyone'
      )`,
    // prevent ownership changes
    withCheck: sql`auth.jwt() -> 'user_metadata' ->> 'visitor_id' = ${table.createdById}`,
  }),

  pgPolicy("session creator can delete empty cards", {
    for: 'delete',
    to: authenticatedRole,
    using: sql`
      (${table.content} = '')
      and exists (
        select 1
        from sessions s
        where s.id = ${table.sessionId}
        and s.created_by_id = auth.jwt() -> 'user_metadata' ->> 'visitor_id'`,
    withCheck: sql`${table.content} = ''`,
  }),

  pgPolicy("card creator can delete own cards", {
    for: 'delete',
    to: authenticatedRole,
    using: sql`${table.createdById} = auth.jwt() -> 'user_metadata' ->> 'visitor_id'`,
    withCheck: sql`${table.createdById} = auth.jwt() -> 'user_metadata' ->> 'visitor_id'`,
  }),
]);

// Relations

export const usersRelations = relations(users, ({ many }) => ({
  participations: many(sessionParticipants),
  cards: many(cards),
}));

export const sessionsRelations = relations(sessions, ({ many }) => ({
  participants: many(sessionParticipants),
  cards: many(cards),
}));

export const sessionParticipantsRelations = relations(
  sessionParticipants,
  ({ one }) => ({
    user: one(users, {
      fields: [sessionParticipants.userId],
      references: [users.id],
    }),
    session: one(sessions, {
      fields: [sessionParticipants.sessionId],
      references: [sessions.id],
    }),
  }),
);

export const cardsRelations = relations(cards, ({ one }) => ({
  session: one(sessions, {
    fields: [cards.sessionId],
    references: [sessions.id],
  }),
  creator: one(users, {
    fields: [cards.createdById],
    references: [users.id],
  }),
}));

// Types

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type SessionRole = "creator" | "participant";
export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;
export type SessionParticipant = typeof sessionParticipants.$inferSelect;
export type NewSessionParticipant = typeof sessionParticipants.$inferInsert;
