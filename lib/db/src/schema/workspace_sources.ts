import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const workspaceSourcesTable = pgTable("workspace_sources", {
  id:          serial("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  name:        text("name").notNull(),
  yield:       integer("yield").notNull().default(0),
  status:      text("status").notNull().default("healthy"),
});

export const insertWorkspaceSourceSchema = createInsertSchema(workspaceSourcesTable).omit({
  id: true,
});

export type InsertWorkspaceSource = z.infer<typeof insertWorkspaceSourceSchema>;
export type WorkspaceSource = typeof workspaceSourcesTable.$inferSelect;
