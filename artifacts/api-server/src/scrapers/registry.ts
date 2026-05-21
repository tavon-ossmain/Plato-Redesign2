import type { ScraperAdapter } from "./types.js";
import { redditAdapter }       from "./adapters/reddit.js";
import { jobboardsAdapter }    from "./adapters/jobboards.js";
import { genericWebDomAdapter } from "./adapters/generic_web_dom.js";
import { playwrightAdapter }   from "./adapters/playwright.js";

const adapters: ScraperAdapter[] = [
  redditAdapter,
  jobboardsAdapter,
  genericWebDomAdapter,
  playwrightAdapter,
];

const registry = new Map<string, ScraperAdapter>(
  adapters.map((a) => [a.sourceType, a]),
);

export function getAdapter(sourceType: string): ScraperAdapter | undefined {
  return registry.get(sourceType);
}

export function listAdapterTypes(): string[] {
  return [...registry.keys()];
}
