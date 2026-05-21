import { clerkClient, getAuth } from "@clerk/express";
import { and, eq } from "drizzle-orm";
import { db, workspacesTable } from "@workspace/db";
import type { Request } from "express";

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function primaryEmailForRequest(req: Request): Promise<string | null> {
  const auth = getAuth(req);
  const clerkUserId = auth?.userId;
  if (!clerkUserId) return null;

  const user = await clerkClient.users.getUser(clerkUserId);
  return user.emailAddresses
    .find((email) => email.id === user.primaryEmailAddressId)
    ?.emailAddress
    ?.toLowerCase() ?? null;
}

export async function isAdminRequest(req: Request): Promise<boolean> {
  const email = await primaryEmailForRequest(req);
  return Boolean(email && adminEmails().includes(email));
}

export async function canAccessWorkspace(req: Request, workspaceId: string): Promise<boolean> {
  if (await isAdminRequest(req)) return true;

  const email = await primaryEmailForRequest(req);
  if (!email) return false;

  const [workspace] = await db
    .select({ id: workspacesTable.id })
    .from(workspacesTable)
    .where(and(eq(workspacesTable.id, workspaceId), eq(workspacesTable.ownerEmail, email)))
    .limit(1);

  return Boolean(workspace);
}
