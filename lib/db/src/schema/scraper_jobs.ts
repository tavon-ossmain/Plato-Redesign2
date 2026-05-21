import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const scraperJobsTable = pgTable("scraper_jobs", {
  id:             serial("id").primaryKey(),
  workspaceId:    text("workspace_id").notNull(),
  sourceConfigId: integer("source_config_id").notNull(),
  jobType:        text("job_type").notNull(), // e.g. "linkedin_scrape"
  status:         text("status").notNull().default("paused"), // paused | queued | running | completed | failed
  attempts:       integer("attempts").notNull().default(0),
  runLog:         text("run_log"),
  errorMessage:   text("error_message"),
  nextRunAt:      timestamp("next_run_at"),
  lastRunAt:      timestamp("last_run_at"),
  createdAt:      timestamp("created_at").notNull().defaultNow(),
  updatedAt:      timestamp("updated_at").notNull().defaultNow(),
});

export const insertScraperJobSchema = createInsertSchema(scraperJobsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertScraperJob = z.infer<typeof insertScraperJobSchema>;
export type ScraperJob = typeof scraperJobsTable.$inferSelect;
