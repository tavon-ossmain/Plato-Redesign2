import { logger } from "./logger.js";
import type { RawSignal } from "../scrapers/types.js";

const APOLLO_BASE_URL = "https://api.apollo.io/api/v1";

type ApolloPerson = {
  email?: string | null;
  phone_numbers?: Array<{ raw_number?: string | null; sanitized_number?: string | null }> | null;
  organization?: {
    primary_domain?: string | null;
    website_url?: string | null;
  } | null;
};

type ApolloOrganization = {
  primary_domain?: string | null;
  website_url?: string | null;
};

function cleanDomain(value: string | null | undefined): string {
  if (!value) return "";
  try {
    const withProtocol = value.startsWith("http") ? value : `https://${value}`;
    return new URL(withProtocol).hostname.replace(/^www\./, "");
  } catch {
    return value.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] ?? "";
  }
}

async function apolloFetch<T>(path: string, params: Record<string, string>): Promise<T | null> {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) return null;

  const url = new URL(`${APOLLO_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "accept": "application/json",
      "cache-control": "no-cache",
      "x-api-key": apiKey,
    },
    signal: AbortSignal.timeout(Number(process.env.APOLLO_TIMEOUT_MS ?? 10_000)),
  });

  if (!response.ok) {
    logger.warn({ status: response.status, path }, "Apollo enrichment request failed");
    return null;
  }

  return response.json() as Promise<T>;
}

async function enrichOne(signal: RawSignal): Promise<RawSignal> {
  if (!process.env.APOLLO_API_KEY) {
    return { ...signal, enrichmentStatus: "skipped_no_apollo_key", enrichmentSource: "none" };
  }

  const domain = cleanDomain(signal.companyDomain);
  const name = signal.contactName === "Unknown" ? "" : signal.contactName;

  try {
    const revealPersonalEmails = process.env.APOLLO_REVEAL_PERSONAL_EMAILS === "true" ? "true" : "false";
    const revealPhoneNumber = process.env.APOLLO_REVEAL_PHONE_NUMBER === "true" ? "true" : "false";

    const personPayload = name || domain
      ? await apolloFetch<{ person?: ApolloPerson | null }>("/people/match", {
          name,
          domain,
          reveal_personal_emails: revealPersonalEmails,
          reveal_phone_number: revealPhoneNumber,
        })
      : null;

    const person = personPayload?.person ?? null;
    const phone =
      person?.phone_numbers?.[0]?.sanitized_number ??
      person?.phone_numbers?.[0]?.raw_number ??
      "";
    const personDomain = cleanDomain(
      person?.organization?.primary_domain ?? person?.organization?.website_url,
    );

    const orgPayload = !personDomain && domain
      ? await apolloFetch<{ organization?: ApolloOrganization | null }>("/organizations/enrich", { domain })
      : null;
    const orgDomain = cleanDomain(
      orgPayload?.organization?.primary_domain ?? orgPayload?.organization?.website_url,
    );

    const enriched: RawSignal = {
      ...signal,
      contactEmail: signal.contactEmail || person?.email || "",
      contactPhone: signal.contactPhone || phone,
      companyDomain: signal.companyDomain || personDomain || orgDomain || domain,
      enrichmentSource: "apollo",
      enrichmentStatus: person || orgPayload?.organization ? "enriched" : "not_found",
    };

    return enriched;
  } catch (err) {
    logger.warn({ err, sourceUrl: signal.sourceUrl }, "Apollo enrichment skipped after error");
    return { ...signal, enrichmentStatus: "error", enrichmentSource: "apollo" };
  }
}

export async function enrichSignalsWithApollo(signals: RawSignal[]): Promise<RawSignal[]> {
  const limit = Number(process.env.APOLLO_ENRICHMENT_LIMIT_PER_RUN ?? 25);
  const candidates = signals.slice(0, Math.max(0, limit));
  const untouched = signals.slice(candidates.length).map((signal) => ({
    ...signal,
    enrichmentStatus: signal.enrichmentStatus ?? "skipped_limit",
    enrichmentSource: signal.enrichmentSource ?? "none",
  }));

  const enriched = [];
  for (const signal of candidates) {
    enriched.push(await enrichOne(signal));
  }

  return [...enriched, ...untouched];
}
