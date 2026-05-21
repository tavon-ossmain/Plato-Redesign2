import type { ScraperAdapter, ScraperInput, RawSignal } from "../types.js";
import { logger } from "../../lib/logger.js";

interface RedditPost {
  title: string;
  selftext: string;
  author: string;
  url: string;
  permalink: string;
  score: number;
  created_utc: number;
  subreddit: string;
}

interface RedditSearchResponse {
  data: {
    children: Array<{ data: RedditPost }>;
  };
}

function freshnessScore(createdUtc: number): number {
  const ageH = (Date.now() - createdUtc * 1000) / 3_600_000;
  if (ageH < 1)   return 98;
  if (ageH < 24)  return 85;
  if (ageH < 72)  return 70;
  if (ageH < 168) return 55;
  if (ageH < 336) return 40;
  if (ageH < 720) return 25;
  return 10;
}

function fitScore(text: string, keywords: string[], disqualifiers: string[]): number {
  const lower = text.toLowerCase();
  if (disqualifiers.some((d) => lower.includes(d.toLowerCase()))) return 0;
  const total = keywords.length;
  if (total === 0) return 10;
  const hits = keywords.filter((k) => lower.includes(k.toLowerCase())).length;
  return Math.min(90, Math.round((hits / total) * 80) + 10);
}

function confidenceScore(post: RedditPost): number {
  const karmaPoints = Math.min(30, Math.floor(Math.log1p(post.score) * 5));
  const bodyBonus = post.selftext && post.selftext.length > 100 ? 20 : 0;
  return Math.min(90, 40 + karmaPoints + bodyBonus);
}

/** Very naive company extractor from post body. Returns empty string if uncertain. */
function extractCompany(text: string): string {
  const patterns = [
    /\bat ([A-Z][a-zA-Z0-9&.\- ]{2,30})/,
    /\bfor ([A-Z][a-zA-Z0-9&.\- ]{2,30})/,
    /\bwith ([A-Z][a-zA-Z0-9&.\- ]{2,30})/,
    /([A-Z][a-zA-Z0-9]{2,20})\s+is hiring/i,
    /([A-Z][a-zA-Z0-9]{2,20})\s+is looking/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[1]) return m[1].trim();
  }
  return "";
}

export const redditAdapter: ScraperAdapter = {
  sourceType: "reddit",

  async run(input: ScraperInput): Promise<RawSignal[]> {
    const query = input.keywords.slice(0, 5).join(" OR ");
    const url =
      `https://www.reddit.com/search.json` +
      `?q=${encodeURIComponent(query)}&sort=new&t=week&limit=25&type=link`;

    let body: RedditSearchResponse;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "platos-signal-bot/1.0 (signal research)" },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        logger.warn({ status: res.status, url }, "Reddit search returned non-OK");
        return [];
      }
      body = (await res.json()) as RedditSearchResponse;
    } catch (err) {
      logger.error({ err }, "Reddit fetch failed");
      return [];
    }

    const posts = body?.data?.children ?? [];
    const results: RawSignal[] = [];

    for (const { data: post } of posts) {
      if (results.length >= input.dailyLimit) break;

      const fullText = `${post.title} ${post.selftext}`;
      const fit = fitScore(fullText, input.keywords, input.disqualifiers);
      if (fit === 0) continue;

      const snippet = `${post.title}\n${post.selftext.slice(0, 300)}`.trim();
      const company = extractCompany(fullText) || post.subreddit;

      results.push({
        company,
        contactName:      post.author,
        contactTitle:     "Reddit Author",
        contactLinkedin:  "",
        source:           "Reddit",
        sourcePlatform:   "reddit",
        sourceUrl:        `https://reddit.com${post.permalink}`,
        evidenceSnippet:  snippet.slice(0, 500),
        whyNow:           post.title.slice(0, 200),
        fitScore:         fit,
        confidenceScore:  confidenceScore(post),
        freshnessScore:   freshnessScore(post.created_utc),
        seenAt:           new Date(post.created_utc * 1000).toISOString(),
        rawSource:        JSON.stringify({ id: post.url, subreddit: post.subreddit, score: post.score }),
      });
    }

    logger.info(
      { workspaceId: input.workspaceId, sourceConfigId: input.sourceConfigId, found: results.length },
      "Reddit adapter complete",
    );
    return results;
  },
};
