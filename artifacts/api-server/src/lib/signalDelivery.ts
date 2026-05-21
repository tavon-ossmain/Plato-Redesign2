import { eq } from "drizzle-orm";
import { db, signalsTable, workspacesTable } from "@workspace/db";
import { logger } from "./logger.js";

type SignalRow = typeof signalsTable.$inferSelect;

const DELIVERABLE_DISPOSITIONS = new Set(["billable", "watchlist", "billable_opportunity", "intent_update"]);

function field(label: string, value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  return `*${label}:* ${value}`;
}

function signalText(signal: SignalRow): string {
  return [
    `*${signal.company}*`,
    field("Contact", [signal.contactName, signal.contactTitle].filter(Boolean).join(" · ")),
    field("Fit", `${signal.fitScore}`),
    field("Confidence", `${signal.confidenceScore}`),
    field("Why now", signal.whyNow),
    field("Channel", signal.recommendedChannel),
    field("Email", signal.contactEmail),
    field("Phone", signal.contactPhone),
    field("Domain", signal.companyDomain),
    field("Enrichment", `${signal.enrichmentStatus} via ${signal.enrichmentSource}`),
    signal.sourceUrl ? `<${signal.sourceUrl}|View source>` : "",
  ].filter(Boolean).join("\n");
}

async function postSlack(webhookUrl: string, signal: SignalRow): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      text: `New Plato signal: ${signal.company}`,
      blocks: [
        {
          type: "header",
          text: { type: "plain_text", text: "New buyer-intent signal", emoji: false },
        },
        {
          type: "section",
          text: { type: "mrkdwn", text: signalText(signal) },
        },
      ],
    }),
    signal: AbortSignal.timeout(Number(process.env.SLACK_DELIVERY_TIMEOUT_MS ?? 8_000)),
  });

  if (!response.ok) {
    throw new Error(`Slack webhook returned ${response.status}`);
  }
}

export async function deliverSignalsToSlack(workspaceId: string, signals: SignalRow[]): Promise<void> {
  const deliverable = signals.filter((signal) => DELIVERABLE_DISPOSITIONS.has(signal.disposition));
  if (deliverable.length === 0) return;

  const [workspace] = await db
    .select({
      id: workspacesTable.id,
      name: workspacesTable.name,
      slackWebhookUrl: workspacesTable.slackWebhookUrl,
    })
    .from(workspacesTable)
    .where(eq(workspacesTable.id, workspaceId))
    .limit(1);

  if (!workspace?.slackWebhookUrl) {
    logger.info({ workspaceId, count: deliverable.length }, "No client Slack webhook set — skipping signal delivery");
    return;
  }

  for (const signal of deliverable) {
    try {
      await postSlack(workspace.slackWebhookUrl, signal);
      logger.info({ workspaceId, signalId: signal.id }, "Delivered signal to client Slack");
    } catch (err) {
      logger.warn({ err, workspaceId, signalId: signal.id }, "Client Slack delivery failed");
    }
  }
}
