import { pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const workspacesTable = pgTable("workspaces", {
  id:                   text("id").primaryKey(),
  name:                 text("name").notNull(),
  ownerEmail:           text("owner_email"),
  plan:                 text("plan").notNull().default("Growth"),
  quota:                integer("quota").notNull().default(200),
  used:                 integer("used").notNull().default(0),
  rawScanned:           integer("raw_scanned").notNull().default(0),
  uniqueAccounts:       integer("unique_accounts").notNull().default(0),
  duplicatesSuppressed: integer("duplicates_suppressed").notNull().default(0),
  staleSignals:         integer("stale_signals").notNull().default(0),
  icpConfig:            jsonb("icp_config").$type<IcpConfig>(),
  status:               text("status").notNull().default("preview"),
  createdAt:            timestamp("created_at").notNull().defaultNow(),
  updatedAt:            timestamp("updated_at").notNull().defaultNow(),
});

export interface IcpConfig {
  normalizedIcp:  string;
  signalSources:  string[];
  keywords:       string[];
  disqualifiers:  string[];
  routingNotes:   string;
  scoringRules: {
    fitFactors:        string[];
    confidenceFactors: string[];
  };
  modelUsed:  "gpt-4o-mini" | "gpt-4o";
  confidence: number;
}

export const insertWorkspaceSchema = createInsertSchema(workspacesTable).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;
export type Workspace = typeof workspacesTable.$inferSelect;
