import type { ScraperAdapter, ScraperInput, RawSignal } from "../types.js";
import { logger } from "../../lib/logger.js";

/**
 * Generic web DOM adapter.
 *
 * Requires seed URLs to be configured externally (not yet a first-class field
 * in source_configs). If no seed URLs are available this adapter returns an
 * empty result set and logs an actionable message — it will never invent data.
 *
 * When seed URLs are wired in, it fetches each page, strips HTML tags to plain
 * text, checks for keyword matches, and returns a signal per matching page.
 */

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function fitScore(text: string, keywords: string[], disqualifiers: string[]): number {
  const lower = text.toLowerCase();
  if (disqualifiers.some((d) => lower.includes(d.toLowerCase()))) return 0;
  const total = keywords.length;
  if (total === 0) return 10;
  const hits = keywords.filter((k) => lower.includes(k.toLowerCase())).length;
  return Math.min(90, Math.round((hits / total) * 80) + 10);
}

function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([^<]{1,120})<\/title>/i);
  return m?.[1]?.trim() ?? "";
}

async function scrapeUrl(
  pageUrl: string,
  input: ScraperInput,
): Promise<RawSignal | null> {
  let html: string;
  try {
    const res = await fetch(pageUrl, {
      headers: { "User-Agent": "platos-signal-bot/1.0" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return null;
    html = await res.text();
  } catch (err) {
    logger.warn({ err, url: pageUrl }, "generic_web_dom fetch failed");
    return null;
  }

  const text  = stripHtml(html);
  const fit   = fitScore(text, input.keywords, input.disqualifiers);
  if (fit === 0) return null;

  const pageTitle = extractTitle(html);
  const snippet   = text.slice(0, 500);

  return {
    company:         new URL(pageUrl).hostname.replace(/^www\./, ""),
    contactName:     "",
    contactTitle:    "",
    contactLinkedin: "",
    source:          "Web Scrape",
    sourcePlatform:  "web_dom",
    sourceUrl:       pageUrl,
    evidenceSnippet: snippet,
    whyNow:          pageTitle || pageUrl,
    fitScore:        fit,
    confidenceScore: 50,
    freshnessScore:  75,
    seenAt:          new Date().toISOString(),
    rawSource:       JSON.stringify({ url: pageUrl, title: pageTitle }),
  };
}

export const genericWebDomAdapter: ScraperAdapter = {
  sourceType: "web",

  async run(input: ScraperInput): Promise<RawSignal[]> {
    const seedUrls: string[] = (input as unknown as { seedUrls?: string[] }).seedUrls ?? [];

    if (seedUrls.length === 0) {
      logger.info(
        { workspaceId: input.workspaceId, sourceConfigId: input.sourceConfigId },
        "generic_web_dom: no seed URLs configured — skipping run. " +
          "Add seed URLs to this source config to enable web scraping.",
      );
      return [];
    }

    const cap     = Math.min(seedUrls.length, input.dailyLimit);
    const pending = seedUrls.slice(0, cap).map((u) => scrapeUrl(u, input));
    const settled = await Promise.allSettled(pending);

    const results: RawSignal[] = [];
    for (const r of settled) {
      if (r.status === "fulfilled" && r.value) results.push(r.value);
    }

    logger.info(
      { workspaceId: input.workspaceId, sourceConfigId: input.sourceConfigId, found: results.length },
      "generic_web_dom adapter complete",
    );
    return results;
  },
};
