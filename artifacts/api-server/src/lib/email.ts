import { Resend } from "resend";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "./logger";

const FROM    = process.env.RESEND_FROM_EMAIL ?? "Plato's <hello@platos.agency>";
const APP_URL = process.env.APP_URL ?? "";
const CALENDLY = "https://calendly.com/platos-io/15min";

// Inline the logo so it renders in email clients regardless of deployment state
function loadLogoDataUri(): string {
  try {
    const assetsDir = join(dirname(fileURLToPath(import.meta.url)), "../assets");
    const buf = readFileSync(join(assetsDir, "logo.png"));
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    // Fall back to hosted URL if file is missing (e.g. local dev without assets)
    return `${APP_URL}/api/assets/logo.png`;
  }
}

const LOGO_URL = loadLogoDataUri();

// ── HTML builder ─────────────────────────────────────────────────

export function buildWorkspacePreviewEmail({
  companyName,
  signUpUrl,
}: {
  companyName: string;
  signUpUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Your Plato's Core workspace preview is ready</title>
</head>
<body style="margin:0;padding:0;background:#05060A;-webkit-font-smoothing:antialiased;mso-line-height-rule:exactly;">

  <!-- Preheader -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:#05060A;">
    We generated your signal workspace preview from your brief. Activate live sourcing when you're ready.
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <!-- Outer -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#05060A;padding:40px 16px 56px;">
    <tr>
      <td align="center">
        <!-- Main card -->
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0"
          style="max-width:560px;width:100%;background:#0B0D13;border:1px solid rgba(255,255,255,0.12);border-radius:22px;overflow:hidden;">

          <!-- ── 1. HEADER ── -->
          <tr>
            <td style="padding:32px 36px 24px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <!-- Logo -->
                    <img src="${LOGO_URL}" alt="Plato's Strix" width="260"
                      style="max-width:260px;height:auto;display:block;margin-bottom:20px;border:0;"
                      onerror="this.style.display='none'" />
                    <!-- Status pill -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;">
                      <tr>
                        <td style="background:rgba(52,211,153,0.10);border:1px solid rgba(52,211,153,0.28);border-radius:100px;padding:4px 12px;">
                          <span style="font-family:Inter,system-ui,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.04em;color:#34D399;">
                            ● &nbsp;Workspace Preview Created
                          </span>
                        </td>
                      </tr>
                    </table>
                    <!-- Eyebrow -->
                    <p style="margin:0;font-family:Inter,system-ui,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#25D6FF;">
                      Plato's Core
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── 2–4. HEADLINE + BODY + NOTICE ── -->
          <tr>
            <td style="padding:32px 36px 0;">

              <!-- Headline -->
              <h1 style="margin:0 0 14px;font-family:Inter,system-ui,sans-serif;font-size:26px;font-weight:700;line-height:1.25;color:#F8FAFC;">
                Your workspace preview is ready.
              </h1>

              <!-- Personalized body -->
              <p style="margin:0 0 20px;font-family:Inter,system-ui,sans-serif;font-size:15px;line-height:1.7;color:#CBD5E1;">
                We used your brief to generate a starter signal workspace for
                <strong style="color:#F8FAFC;">${companyName}</strong>.
                Inside, you'll see your normalized ICP, recommended signal sources, keywords,
                disqualifiers, and routing notes.
              </p>

              <!-- Trust / clarity note -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);border-left:3px solid rgba(37,214,255,0.50);border-radius:0 10px 10px 0;padding:14px 18px;">
                    <p style="margin:0;font-family:Inter,system-ui,sans-serif;font-size:13px;line-height:1.65;color:#94A3B8;">
                      <strong style="color:#CBD5E1;">This is a preview workspace.</strong>
                      Live sourcing, full opportunities, contact info, CRM sync, Slack routing, and daily signal delivery unlock after activation.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- ── 5. PRIMARY CTA ── -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
                <tr>
                  <td align="center">
                    <a href="${signUpUrl}"
                      style="display:block;font-family:Inter,system-ui,sans-serif;font-size:15px;font-weight:700;color:#FFFFFF;background:#7C3AED;text-decoration:none;padding:15px 24px;border-radius:12px;text-align:center;letter-spacing:-0.01em;mso-padding-alt:15px 24px;">
                      Open Workspace Preview
                    </a>
                  </td>
                </tr>
              </table>

              <!-- ── 6. SECONDARY CTA ── -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">
                <tr>
                  <td align="center">
                    <a href="${CALENDLY}"
                      style="display:block;font-family:Inter,system-ui,sans-serif;font-size:14px;font-weight:600;color:#25D6FF;background:transparent;text-decoration:none;padding:14px 24px;border-radius:12px;text-align:center;border:1px solid rgba(37,214,255,0.30);letter-spacing:-0.01em;">
                      Book Activation Call
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ── 7. WHAT HAPPENS NEXT ── -->
          <tr>
            <td style="padding:0 36px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:22px 22px 10px;">
                <tr>
                  <td>
                    <p style="margin:0 0 16px;font-family:Inter,system-ui,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.10em;text-transform:uppercase;color:#64748B;">
                      What happens next
                    </p>

                    ${[
                      "Sign in with the same email you used in the brief.",
                      "Review your ICP, sources, keywords, and routing plan.",
                      "Book activation to turn on live sourcing and workflow delivery.",
                    ].map((step, i) => `
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;">
                      <tr>
                        <td width="30" valign="top" style="padding-top:1px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="width:22px;height:22px;background:rgba(37,214,255,0.10);border:1px solid rgba(37,214,255,0.28);border-radius:50%;text-align:center;vertical-align:middle;">
                                <span style="font-family:Inter,system-ui,sans-serif;font-size:11px;font-weight:700;color:#25D6FF;line-height:22px;">${i + 1}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td style="padding-left:10px;">
                          <p style="margin:0;font-family:Inter,system-ui,sans-serif;font-size:13px;line-height:1.6;color:#94A3B8;">${step}</p>
                        </td>
                      </tr>
                    </table>`).join("")}

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── 8. WHAT UNLOCKS AFTER ACTIVATION ── -->
          <tr>
            <td style="padding:0 36px 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                style="background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.20);border-radius:14px;padding:20px 22px;">
                <tr>
                  <td>
                    <p style="margin:0 0 14px;font-family:Inter,system-ui,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.10em;text-transform:uppercase;color:#A78BFA;">
                      What unlocks after activation
                    </p>

                    ${[
                      "Live signal sourcing",
                      "Full opportunity details",
                      "Contact enrichment",
                      "CRM + Slack routing",
                      "Managed outreach options",
                    ].map((item) => `
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
                      <tr>
                        <td width="18" valign="middle">
                          <span style="font-family:Inter,system-ui,sans-serif;font-size:13px;color:#7C3AED;">✦</span>
                        </td>
                        <td style="padding-left:8px;">
                          <span style="font-family:Inter,system-ui,sans-serif;font-size:13px;color:#CBD5E1;">${item}</span>
                        </td>
                      </tr>
                    </table>`).join("")}

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── 9. FOOTER ── -->
          <tr>
            <td style="padding:20px 36px 28px;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0 0 2px;font-family:Inter,system-ui,sans-serif;font-size:13px;font-weight:600;color:#475569;">
                Plato's Agency
              </p>
              <p style="margin:0 0 6px;font-family:Inter,system-ui,sans-serif;font-size:12px;color:#334155;">
                Signal-aware lead intelligence for sales teams.
              </p>
              <a href="mailto:hello@platos.agency"
                style="font-family:Inter,system-ui,sans-serif;font-size:12px;color:#25D6FF;text-decoration:none;">
                hello@platos.agency
              </a>
              <p style="margin:14px 0 0;font-family:Inter,system-ui,sans-serif;font-size:11px;color:#1E293B;">
                You received this because you created a Plato's Core workspace preview.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ── Plain-text builder ────────────────────────────────────────────

export function buildWorkspacePreviewEmailText({
  companyName,
  signUpUrl,
}: {
  companyName: string;
  signUpUrl: string;
}): string {
  return `PLATO'S CORE — Workspace Preview Created
==========================================

Your workspace preview is ready.

We used your brief to generate a starter signal workspace for ${companyName}.
Inside, you'll see your normalized ICP, recommended signal sources, keywords,
disqualifiers, and routing notes.

NOTE: This is a preview workspace. Live sourcing, full opportunities, contact
info, CRM sync, Slack routing, and daily signal delivery unlock after activation.


OPEN WORKSPACE PREVIEW
${signUpUrl}

BOOK ACTIVATION CALL
${CALENDLY}


WHAT HAPPENS NEXT
1. Sign in with the same email you used in the brief.
2. Review your ICP, sources, keywords, and routing plan.
3. Book activation to turn on live sourcing and workflow delivery.


WHAT UNLOCKS AFTER ACTIVATION
  ✦ Live signal sourcing
  ✦ Full opportunity details
  ✦ Contact enrichment
  ✦ CRM + Slack routing
  ✦ Managed outreach options


---
Plato's Agency
Signal-aware lead intelligence for sales teams.
hello@platos.agency

You received this because you created a Plato's Core workspace preview.
`;
}

// ── Activation email ─────────────────────────────────────────────

export function buildActivationEmail({
  companyName,
  appUrl,
  sources,
}: {
  companyName: string;
  appUrl: string;
  sources: string[];
}): string {
  const sourceList = sources.length > 0
    ? sources.join(" · ")
    : "configured sources";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Your signal workspace is live</title>
</head>
<body style="margin:0;padding:0;background:#05060A;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#05060A;">
    Signal sourcing is now active. Your first signals are on the way.
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#05060A;padding:40px 16px 56px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0"
        style="max-width:560px;width:100%;background:#0B0D13;border:1px solid rgba(255,255,255,0.12);border-radius:22px;overflow:hidden;">

        <tr>
          <td style="padding:32px 36px 24px;border-bottom:1px solid rgba(255,255,255,0.06);">
            <img src="${LOGO_URL}" alt="Plato's Strix" width="260"
              style="max-width:260px;height:auto;display:block;margin-bottom:20px;border:0;" onerror="this.style.display='none'" />
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;">
              <tr>
                <td style="background:rgba(52,211,153,0.10);border:1px solid rgba(52,211,153,0.28);border-radius:100px;padding:4px 12px;">
                  <span style="font-family:Inter,system-ui,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.04em;color:#34D399;">
                    ● &nbsp;Workspace Activated
                  </span>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-family:Inter,system-ui,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#25D6FF;">
              Plato's Core
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:32px 36px 0;">
            <h1 style="margin:0 0 14px;font-family:Inter,system-ui,sans-serif;font-size:26px;font-weight:700;line-height:1.25;color:#F8FAFC;">
              You're live. Signal delivery is starting.
            </h1>
            <p style="margin:0 0 20px;font-family:Inter,system-ui,sans-serif;font-size:15px;line-height:1.7;color:#CBD5E1;">
              Your workspace for <strong style="color:#F8FAFC;">${companyName}</strong> has been activated.
              Signal sourcing is now running across <strong style="color:#F8FAFC;">${sourceList}</strong>.
              Scored, de-duped signals will appear in your queue as they're detected.
            </p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:rgba(52,211,153,0.06);border:1px solid rgba(52,211,153,0.18);border-left:3px solid rgba(52,211,153,0.50);border-radius:0 10px 10px 0;padding:14px 18px;">
                  <p style="margin:0;font-family:Inter,system-ui,sans-serif;font-size:13px;line-height:1.65;color:#94A3B8;">
                    <strong style="color:#CBD5E1;">What's now active:</strong>
                    live signal sourcing, full opportunity details, contact intelligence, and delivery via your configured channels.
                  </p>
                </td>
              </tr>
            </table>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">
              <tr>
                <td align="center">
                  <a href="${appUrl}"
                    style="display:block;font-family:Inter,system-ui,sans-serif;font-size:15px;font-weight:700;color:#FFFFFF;background:#059669;text-decoration:none;padding:15px 24px;border-radius:12px;text-align:center;">
                    Open Signal Workspace →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 36px 28px;border-top:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0 0 2px;font-family:Inter,system-ui,sans-serif;font-size:13px;font-weight:600;color:#475569;">Plato's Agency</p>
            <p style="margin:0 0 6px;font-family:Inter,system-ui,sans-serif;font-size:12px;color:#334155;">Signal-aware lead intelligence for sales teams.</p>
            <a href="mailto:hello@platos.agency" style="font-family:Inter,system-ui,sans-serif;font-size:12px;color:#25D6FF;text-decoration:none;">hello@platos.agency</a>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildActivationEmailText({
  companyName,
  appUrl,
  sources,
}: {
  companyName: string;
  appUrl: string;
  sources: string[];
}): string {
  return `PLATO'S CORE — Workspace Activated
=====================================

You're live. Signal delivery is starting.

Your workspace for ${companyName} has been activated.
Signal sourcing is now running across: ${sources.join(", ") || "your configured sources"}.

Open your signal workspace:
${appUrl}

---
Plato's Agency · hello@platos.agency
`;
}

export async function sendActivationEmail({
  to,
  companyName,
  sources,
}: {
  to: string;
  companyName: string;
  sources: string[];
}) {
  if (!process.env.RESEND_API_KEY) {
    logger.warn({ to }, "RESEND_API_KEY not set — skipping activation email");
    return;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { data, error } = await resend.emails.send({
      from:    FROM,
      to:      [to],
      subject: `You're live — signal delivery is starting for ${companyName}`,
      html:    buildActivationEmail({ companyName, appUrl: `${APP_URL}/app`, sources }),
      text:    buildActivationEmailText({ companyName, appUrl: `${APP_URL}/app`, sources }),
    });
    if (error) {
      logger.warn({ error, to }, "Activation email delivery error");
    } else {
      logger.info({ emailId: data?.id, to }, "Activation email sent");
    }
  } catch (err) {
    logger.warn({ err, to }, "Failed to send activation email");
  }
}

// ── Internal Slack ping on activation ────────────────────────────

export async function sendAdminSlackActivation({
  workspaceName,
  ownerEmail,
  plan,
  quota,
  sources,
  deliveryMode,
}: {
  workspaceName: string;
  ownerEmail: string | null;
  plan: string;
  quota: number;
  sources: string[];
  deliveryMode: string;
}) {
  const url = process.env.INTERNAL_SLACK_WEBHOOK_URL;
  if (!url) {
    logger.info("INTERNAL_SLACK_WEBHOOK_URL not set — skipping Slack ping");
    return;
  }
  try {
    const adminUrl = `${APP_URL}/admin`;
    const modeLabel = deliveryMode === "managed" ? "STRIX Managed" : "DIY";
    const payload = {
      text: `🚀 Workspace activated: ${workspaceName}`,
      blocks: [
        {
          type: "header",
          text: { type: "plain_text", text: "🚀 Workspace Activated", emoji: true },
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Company*\n${workspaceName}` },
            { type: "mrkdwn", text: `*Owner*\n${ownerEmail ?? "—"}` },
            { type: "mrkdwn", text: `*Plan*\n${plan}` },
            { type: "mrkdwn", text: `*Weekly Quota*\n${quota} signals` },
            { type: "mrkdwn", text: `*Delivery*\n${modeLabel}` },
            { type: "mrkdwn", text: `*Sources*\n${sources.join(", ") || "—"}` },
          ],
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: { type: "plain_text", text: "Open Admin Panel", emoji: true },
              url: adminUrl,
              style: "primary",
            },
          ],
        },
      ],
    };
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      logger.warn({ status: resp.status }, "Slack activation ping failed");
    } else {
      logger.info("Slack activation ping sent");
    }
  } catch (err) {
    logger.warn({ err }, "Failed to send Slack activation ping");
  }
}

// ── Sender ────────────────────────────────────────────────────────

export async function sendBriefConfirmation({
  to,
  companyName,
}: {
  to: string;
  companyName: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    logger.warn({ to }, "RESEND_API_KEY not set — skipping confirmation email");
    return;
  }

  const resend    = new Resend(process.env.RESEND_API_KEY);
  const signUpUrl = `${APP_URL}/sign-up`;

  try {
    const { data, error } = await resend.emails.send({
      from:    FROM,
      to:      [to],
      subject: "Your Plato's Core workspace preview is ready",
      html:    buildWorkspacePreviewEmail({ companyName, signUpUrl }),
      text:    buildWorkspacePreviewEmailText({ companyName, signUpUrl }),
    });

    if (error) {
      logger.warn({ error, to }, "Resend delivery error");
    } else {
      logger.info({ emailId: data?.id, to }, "Brief confirmation email sent");
    }
  } catch (err) {
    logger.warn({ err, to }, "Failed to send brief confirmation email");
  }
}
