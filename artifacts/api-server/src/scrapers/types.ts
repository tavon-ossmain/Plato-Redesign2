export interface ScraperInput {
  workspaceId: string;
  sourceConfigId: number;
  sourceType: string;
  keywords: string[];
  disqualifiers: string[];
  targetTitles: string[];
  targetIndustries: string[];
  seedUrls: string[];
  companySizeRange: string | null;
  confidenceThreshold: number;
  dailyLimit: number;
}

/**
 * A signal candidate returned by a scraper adapter.
 * All fields come from real fetched content — never synthesised.
 */
export interface RawSignal {
  company: string;
  contactName: string;
  contactTitle: string;
  contactLinkedin: string;
  source: string;
  sourcePlatform: string;
  sourceUrl: string;
  evidenceSnippet: string;
  whyNow: string;
  fitScore: number;
  confidenceScore: number;
  freshnessScore: number;
  seenAt: string;
  rawSource: string;
}

export interface ScraperAdapter {
  readonly sourceType: string;
  run(input: ScraperInput): Promise<RawSignal[]>;
}
