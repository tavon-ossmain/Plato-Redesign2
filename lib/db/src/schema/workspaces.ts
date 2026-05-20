import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const workspacesTable = pgTable("workspaces", {
  id:                   text("id").primaryKey(),
  name:                 text("name").notNull(),
  plan:                 text("plan").notNull().default("Growth"),
  quota:                integer("quota").notNull().default(200),
  used:                 integer("used").notNull().default(0),
  rawScanned:           integer("raw_scanned").notNull().default(0),
  uniqueAccounts:       integer("unique_accounts").notNull().default(0),
  duplicatesSuppressed: integer("duplicates_suppressed").notNull().default(0),
  staleSignals:         integer("stale_signals").notNull().default(0),
  createdAt:            timestamp("created_at").notNull().defaultNow(),
  updatedAt:            timestamp("updated_at").notNull().defaultNow(),
});

export const insertWorkspaceSchema = createInsertSchema(workspacesTable).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;
export type Workspace = typeof workspacesTable.$inferSelect;
