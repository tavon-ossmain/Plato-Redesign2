import type { ScraperAdapter, ScraperInput, RawSignal } from "../types.js";
import { logger } from "../../lib/logger.js";
import { textFitScore } from "../scoring.js";

interface RemoteOKJob {
  id: string | number;
  company: string;
  company_logo?: string;
  position: string;
  description: string;
  tags: string[];
  url: string;
  date: string;
}

interface HNComment {
  objectID: string;
  author: string;
  comment_text: string;
  created_at: string;
  story_title?: string;
}

interface HNSearchResponse {
  hits: HNComment[];
}

function freshnessScore(isoDate: string): number {
  const ageH = (Date.now() - new Date(isoDate).getTime()) / 3_600_000;
  if (ageH < 24)  return 85;
  if (ageH < 72)  return 70;
  if (ageH < 168) return 55;
  if (ageH < 336) return 40;
  if (ageH < 720) return 25;
  return 10;
}

async function fetchRemoteOK(
  input: ScraperInput,
): Promise<RawSignal[]> {
  let jobs: RemoteOKJob[];
  try {
    const res = await fetch("https://remoteok.com/api", {
      headers: { "User-Agent": "platos-signal-bot/1.0" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return [];
    const raw = (await res.json()) as [{ legal: string }, ...RemoteOKJob[]];
    jobs = raw.slice(1) as RemoteOKJob[];
  } catch (err) {
    logger.warn({ err }, "RemoteOK fetch failed");
    return [];
  }

  const results: RawSignal[] = [];
  for (const job of jobs) {
    if (results.length >= Math.floor(input.dailyLimit * 0.6)) break;
    const searchText = `${job.position} ${job.description} ${(job.tags ?? []).join(" ")}`;
    const fit = textFitScore(searchText, input.keywords, input.disqualifiers);
    if (fit === 0) continue;

    results.push({
      company:         job.company ?? "Unknown Company",
      contactName:     "",
      contactTitle:    job.position ?? "Open Role",
      contactLinkedin: "",
      source:          "Job Boards",
      sourcePlatform:  "remoteok",
      sourceUrl:       job.url ?? `https://remoteok.com/remote-jobs/${job.id}`,
      evidenceSnippet: job.description?.slice(0, 500) ?? "",
      whyNow:          `${job.company} is actively hiring for ${job.position}`,
      fitScore:        fit,
      confidenceScore: 70,
      freshnessScore:  freshnessScore(job.date),
      seenAt:          new Date(job.date).toISOString(),
      rawSource:       JSON.stringify({ id: job.id, tags: job.tags }),
    });
  }
  return results;
}

async function fetchHNWhoIsHiring(
  input: ScraperInput,
): Promise<RawSignal[]> {
  const q = input.keywords.slice(0, 3).join(" ");
  const url =
    `https://hn.algolia.com/api/v1/search` +
    `?query=${encodeURIComponent(q)}&tags=comment,story_author_whoishiring&hitsPerPage=20`;
  let data: HNSearchResponse;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return [];
    data = (await res.json()) as HNSearchResponse;
  } catch (err) {
    logger.warn({ err }, "HN Who is Hiring fetch failed");
    return [];
  }

  const results: RawSignal[] = [];
  for (const hit of data.hits ?? []) {
    if (results.length >= Math.floor(input.dailyLimit * 0.4)) break;
    const text = hit.comment_text?.replace(/<[^>]+>/g, " ") ?? "";
    const fit = textFitScore(text, input.keywords, input.disqualifiers);
    if (fit === 0) continue;

    const companyMatch = text.match(/^([A-Z][a-zA-Z0-9&., ]{1,30})\s*[|(]/);
    const company = companyMatch?.[1]?.trim() ?? "HN Company";

    results.push({
      company,
      contactName:     hit.author,
      contactTitle:    "Recruiter / Poster",
      contactLinkedin: "",
      source:          "Job Boards",
      sourcePlatform:  "hn_hiring",
      sourceUrl:       `https://news.ycombinator.com/item?id=${hit.objectID}`,
      evidenceSnippet: text.slice(0, 500),
      whyNow:          `${company} posted a hiring comment on Hacker News`,
      fitScore:        fit,
      confidenceScore: 65,
      freshnessScore:  freshnessScore(hit.created_at),
      seenAt:          new Date(hit.created_at).toISOString(),
      rawSource:       JSON.stringify({ objectID: hit.objectID }),
    });
  }
  return results;
}

export const jobboardsAdapter: ScraperAdapter = {
  sourceType: "jobboards",

  async run(input: ScraperInput): Promise<RawSignal[]> {
    const [remoteok, hn] = await Promise.all([
      fetchRemoteOK(input),
      fetchHNWhoIsHiring(input),
    ]);
    const combined = [...remoteok, ...hn].slice(0, input.dailyLimit);
    logger.info(
      { workspaceId: input.workspaceId, sourceConfigId: input.sourceConfigId, found: combined.length },
      "JobBoards adapter complete",
    );
    return combined;
  },
};
