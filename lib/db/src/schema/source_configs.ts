import { pgTable, serial, text, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sourceConfigsTable = pgTable("source_configs", {
  id:                  serial("id").primaryKey(),
  workspaceId:         text("workspace_id").notNull(),
  sourceType:          text("source_type").notNull(), // linkedin | reddit | g2 | jobboards | web
  status:              text("status").notNull().default("preview_paused"), // preview_paused | active | paused | disabled
  keywords:            jsonb("keywords").$type<string[]>().notNull().default([]),
  disqualifiers:       jsonb("disqualifiers").$type<string[]>().notNull().default([]),
  targetTitles:        jsonb("target_titles").$type<string[]>().notNull().default([]),
  targetIndustries:    jsonb("target_industries").$type<string[]>().notNull().default([]),
  seedUrls:            jsonb("seed_urls").$type<string[]>().notNull().default([]),
  companySizeRange:    text("company_size_range"),
  confidenceThreshold: real("confidence_threshold").notNull().default(0.7),
  dailyLimit:          integer("daily_limit").notNull().default(50),
  runFrequency:        text("run_frequency").notNull().default("daily"),
  createdFrom:         text("created_from").notNull().default("brief_ai"),
  createdAt:           timestamp("created_at").notNull().defaultNow(),
  updatedAt:           timestamp("updated_at").notNull().defaultNow(),
});

export const insertSourceConfigSchema = createInsertSchema(sourceConfigsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSourceConfig = z.infer<typeof insertSourceConfigSchema>;
export type SourceConfig = typeof sourceConfigsTable.$inferSelect;
