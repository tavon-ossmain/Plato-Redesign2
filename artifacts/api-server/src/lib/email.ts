import { Resend } from "resend";
import { logger } from "./logger";
import type { IcpConfig } from "@workspace/db/schema";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "Plato's <hello@platos.agency>";
const APP_URL = process.env.APP_URL ?? "https://plato-redesign.replit.app";

const SOURCE_LABEL: Record<string, string> = {
  linkedin:  "LinkedIn",
  reddit:    "Reddit",
  g2:        "G2 Reviews",
  jobboards: "Job Boards",
  webscrape: "Web Scrape",
};

export async function sendBriefConfirmation({
  to,
  companyName,
  workspaceId,
  icpConfig,
}: {
  to: string;
  companyName: string;
  workspaceId: string;
  icpConfig: IcpConfig;
}) {
  const signInUrl = `${APP_URL}/sign-up`;
  const bookUrl   = "https://platos.agency";

  const sources = icpConfig.signalSources
    .map((s) => SOURCE_LABEL[s] ?? s)
    .join(", ");

  const keywords = icpConfig.keywords.slice(0, 6).join(" · ");

  const disqualifiers = icpConfig.disqualifiers
    .slice(0, 3)
    .map((d) => `<li style="margin-bottom:4px">✕ &nbsp;${d}</li>`)
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Your Signal Command Center is ready</title>
</head>
<body style="margin:0;padding:0;background:#07070e;font-family:Inter,system-ui,sans-serif;color:#f4f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07070e;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:28px;" align="center">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:rgba(6,208,228,0.10);border:1px solid rgba(6,208,228,0.22);border-radius:12px;padding:10px 16px;">
                    <span style="font-size:15px;font-weight:700;color:#06d0e4;letter-spacing:-0.3px;">Plato's</span>
                    <span style="font-size:12px;color:#5a5a78;margin-left:8px;">Signal Command Center</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero card -->
          <tr>
            <td style="background:linear-gradient(145deg,#111128 0%,#0e0e20 100%);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:32px 32px 28px;box-shadow:0 4px 32px rgba(0,0,0,0.60);">

              <p style="margin:0 0 6px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#5a5a78;">
                Your workspace is ready
              </p>
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#f4f4f6;line-height:1.3;">
                Welcome to Plato's, ${companyName}
              </h1>
              <p style="margin:0 0 24px;font-size:14px;color:#9898b0;line-height:1.6;">
                We've parsed your brief and configured your Signal Command Center.
                Your ICP profile is live — book your activation call to unlock the full signal queue.
              </p>

              <!-- ICP summary -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td style="background:linear-gradient(145deg,#0d0d1e 0%,#0b0b18 100%);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:16px 18px;">

                    <p style="margin:0 0 10px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#5a5a78;">
                      ICP Definition
                    </p>
                    <p style="margin:0 0 16px;font-size:13px;color:#f4f4f6;line-height:1.6;">
                      ${icpConfig.normalizedIcp}
                    </p>

                    <p style="margin:0 0 6px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#5a5a78;">
                      Signal Sources
                    </p>
                    <p style="margin:0 0 16px;font-size:13px;color:#06d0e4;">
                      ${sources}
                    </p>

                    <p style="margin:0 0 6px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#5a5a78;">
                      Target Keywords
                    </p>
                    <p style="margin:0 0 16px;font-size:13px;color:#9898b0;">
                      ${keywords}
                    </p>

                    ${disqualifiers ? `
                    <p style="margin:0 0 6px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#5a5a78;">
                      Disqualifiers
                    </p>
                    <ul style="margin:0;padding:0 0 0 4px;list-style:none;font-size:12px;color:#9898b0;">
                      ${disqualifiers}
                    </ul>
                    ` : ""}

                    <p style="margin:${disqualifiers ? "16px" : "0"} 0 6px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#5a5a78;">
                      ICP Confidence
                    </p>
                    <p style="margin:0;font-size:20px;font-weight:700;color:#06d0e4;">
                      ${Math.round(icpConfig.confidence * 100)}%
                      <span style="font-size:12px;font-weight:400;color:#5a5a78;margin-left:4px;">· ${icpConfig.modelUsed}</span>
                    </p>

                  </td>
                </tr>
              </table>

              <!-- What's locked -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.20);border-radius:10px;padding:14px 18px;">
                    <p style="margin:0 0 8px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#f59e0b;">
                      Preview mode — activation required
                    </p>
                    <p style="margin:0;font-size:12px;color:#9898b0;line-height:1.6;">
                      Live signal delivery · Contact intelligence · Source URLs · CRM sync · Slack routing
                      — all unlock after your activation call.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTAs -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="48%" style="padding-right:8px;">
                    <a href="${signInUrl}"
                      style="display:block;text-align:center;background:linear-gradient(135deg,#06d0e4,#04a8bb);color:#07070e;font-size:13px;font-weight:700;padding:12px 0;border-radius:8px;text-decoration:none;">
                      Sign in to preview
                    </a>
                  </td>
                  <td width="48%" style="padding-left:8px;">
                    <a href="${bookUrl}"
                      style="display:block;text-align:center;background:transparent;color:#06d0e4;font-size:13px;font-weight:700;padding:11px 0;border-radius:8px;text-decoration:none;border:1px solid rgba(6,208,228,0.28);">
                      Book activation call
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 0 0;text-align:center;">
              <p style="margin:0;font-size:11px;color:#2a2a3e;line-height:1.6;">
                Plato's · Signal Command Center ·
                <a href="mailto:hello@platos.agency" style="color:#2a2a3e;text-decoration:underline;">hello@platos.agency</a>
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#2a2a3e;">
                Workspace ID: ${workspaceId}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const { data, error } = await resend.emails.send({
      from:    FROM,
      to:      [to],
      subject: `Your Signal Command Center is ready — ${companyName}`,
      html,
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
