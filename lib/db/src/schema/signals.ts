import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const signalsTable = pgTable("signals", {
  id:                 text("id").primaryKey(),
  workspaceId:        text("workspace_id").notNull(),
  company:            text("company").notNull(),
  contactName:        text("contact_name").notNull(),
  contactTitle:       text("contact_title").notNull(),
  contactLinkedin:    text("contact_linkedin").notNull().default(""),
  source:             text("source").notNull(),
  sourcePlatform:     text("source_platform").notNull(),
  sourceUrl:          text("source_url").notNull().default(""),
  evidenceSnippet:    text("evidence_snippet").notNull().default(""),
  whyNow:             text("why_now").notNull().default(""),
  fitScore:           integer("fit_score").notNull().default(0),
  confidenceScore:    integer("confidence_score").notNull().default(0),
  freshnessScore:     integer("freshness_score").notNull().default(0),
  seenAt:             timestamp("seen_at", { mode: "string" }).notNull(),
  lastVerifiedAt:     timestamp("last_verified_at", { mode: "string" }).notNull(),
  disposition:        text("disposition").notNull().default("suppressed"),
  recommendedChannel: text("recommended_channel").notNull().default(""),
  owner:              text("owner").notNull().default("Unassigned"),
  route:              text("route").notNull().default("unrouted"),
  crmStatus:          text("crm_status").notNull().default("clean"),
  dedupeStatus:       text("dedupe_status").notNull().default("unique"),
  modelPath:          text("model_path").notNull().default(""),
  rawSource:          text("raw_source").notNull().default(""),
  feedback:           text("feedback"),
  createdAt:          timestamp("created_at").notNull().defaultNow(),
  updatedAt:          timestamp("updated_at").notNull().defaultNow(),
});

export const insertSignalSchema = createInsertSchema(signalsTable).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertSignal = z.infer<typeof insertSignalSchema>;
export type Signal = typeof signalsTable.$inferSelect;
