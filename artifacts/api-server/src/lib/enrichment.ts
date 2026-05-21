import { logger } from "./logger.js";
import { enrichSignalsWithApollo } from "./apollo.js";
import type { RawSignal } from "../scrapers/types.js";

type PageSnapshot = {
  url: string;
  html: string;
  text: string;
};

const GENERIC_HOSTS = new Set([
  "reddit.com",
  "www.reddit.com",
  "news.ycombinator.com",
  "remoteok.com",
  "www.remoteok.com",
  "g2.com",
  "www.g2.com",
]);

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/g;

function unique<T>(values: T[]): T[] {
  return [...new Set(values.filter(Boolean))];
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function domainFromUrl(value: string | undefined): string {
  if (!value) return "";
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    return url.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function normalizeDomain(value: string | undefined): string {
  if (!value) return "";
  const direct = domainFromUrl(value);
  if (direct) return direct;
  const cleaned = value.toLowerCase().replace(/^www\./, "").replace(/[^a-z0-9.-]/g, "");
  return cleaned.includes(".") ? cleaned : "";
}

function isCorporateDomain(domain: string): boolean {
  return Boolean(domain) && !GENERIC_HOSTS.has(domain);
}

function sourceDomain(signal: RawSignal): string {
  const explicit = normalizeDomain(signal.companyDomain);
  if (isCorporateDomain(explicit)) return explicit;

  const companyAsDomain = normalizeDomain(signal.company);
  if (isCorporateDomain(companyAsDomain)) return companyAsDomain;

  const sourceHost = domainFromUrl(signal.sourceUrl);
  return isCorporateDomain(sourceHost) ? sourceHost : "";
}

function candidateUrls(domain: string): string[] {
  if (!domain) return [];
  return unique([
    `https://${domain}`,
    `https://${domain}/contact`,
    `https://${domain}/about`,
    `https://${domain}/team`,
    `https://${domain}/careers`,
  ]);
}

function extractEmails(text: string): string[] {
  const emails = text.match(EMAIL_RE) ?? [];
  return unique(emails.map((email) => email.toLowerCase()))
    .filter((email) => !email.endsWith(".png") && !email.endsWith(".jpg") && !email.includes("example.com"));
}

function extractPhones(text: string): string[] {
  return unique(text.match(PHONE_RE) ?? [])
    .map((phone) => phone.replace(/\s+/g, " ").trim())
    .filter((phone) => phone.replace(/\D/g, "").length >= 10);
}

function extractLinkedIn(html: string): string {
  const matches = html.match(/https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[^"'<\s)]+/gi) ?? [];
  return matches[0] ?? "";
}

function chooseEmail(emails: string[], contactName: string): string {
  if (emails.length === 0) return "";
  const usable = emails.filter((email) => !/^(info|support|hello|sales|contact|admin)@/i.test(email));
  if (!contactName || contactName === "Unknown") return usable[0] ?? emails[0] ?? "";

  const [first, ...rest] = contactName.toLowerCase().split(/\s+/).filter(Boolean);
  const last = rest.at(-1) ?? "";
  const preferred = emails.find((email) =>
    (first && email.includes(first)) || (last && email.includes(last)),
  );
  return preferred ?? usable[0] ?? emails[0] ?? "";
}

function buildPatternGuess(contactName: string, domain: string): string {
  if (!contactName || contactName === "Unknown" || !domain) return "";
  const parts = contactName.toLowerCase().replace(/[^a-z\s-]/g, "").split(/\s+/).filter(Boolean);
  if (parts.length < 2) return "";
  const first = parts[0];
  const last = parts.at(-1);
  if (!first || !last) return "";
  return `${first}.${last}@${domain}`;
}

async function fetchPage(url: string): Promise<PageSnapshot | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "accept": "text/html,application/xhtml+xml",
        "user-agent": process.env.ENRICHMENT_USER_AGENT ?? "platos-enrichment-bot/1.0",
      },
      signal: AbortSignal.timeout(Number(process.env.ENRICHMENT_FETCH_TIMEOUT_MS ?? 9_000)),
    });

    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType && !contentType.includes("text/html")) return null;

    const html = await response.text();
    return { url, html, text: stripHtml(html) };
  } catch (err) {
    logger.debug({ err, url }, "Public enrichment page fetch failed");
    return null;
  }
}

async function fetchPublicSnapshots(signal: RawSignal, domain: string): Promise<PageSnapshot[]> {
  const maxPages = Number(process.env.ENRICHMENT_MAX_PAGES_PER_SIGNAL ?? 4);
  const urls = unique([
    signal.sourceUrl && signal.sourceUrl.startsWith("http") ? signal.sourceUrl : "",
    ...candidateUrls(domain),
  ]).slice(0, Math.max(1, maxPages));

  const snapshots: PageSnapshot[] = [];
  for (const url of urls) {
    const page = await fetchPage(url);
    if (page) snapshots.push(page);
  }
  return snapshots;
}

async function enrichWithPublicWeb(signal: RawSignal): Promise<RawSignal> {
  const domain = sourceDomain(signal);
  const pages = await fetchPublicSnapshots(signal, domain);
  const combinedText = [signal.evidenceSnippet, signal.whyNow, ...pages.map((page) => page.text)].join("\n");
  const combinedHtml = pages.map((page) => page.html).join("\n");

  const emails = extractEmails(combinedText);
  const phones = extractPhones(combinedText);
  const linkedin = signal.contactLinkedin || extractLinkedIn(combinedHtml);
  const selectedEmail = signal.contactEmail || chooseEmail(emails, signal.contactName);
  const guessedEmail = selectedEmail || buildPatternGuess(signal.contactName, domain);
  const selectedPhone = signal.contactPhone || phones[0] || "";

  const enriched: RawSignal = {
    ...signal,
    contactLinkedin: linkedin,
    contactEmail: guessedEmail,
    contactPhone: selectedPhone,
    companyDomain: signal.companyDomain || domain,
    enrichmentSource: "platos_public_web",
    enrichmentStatus:
      selectedEmail || selectedPhone || linkedin
        ? "enriched_public"
        : guessedEmail
          ? "guessed_email_pattern"
          : domain
            ? "company_enriched"
            : "not_found",
    rawSource: JSON.stringify({
      ...safeRaw(signal.rawSource),
      enrichment: {
        provider: "platos_public_web",
        domain: signal.companyDomain || domain,
        pagesChecked: pages.map((page) => page.url),
        emailsFound: emails.length,
        phonesFound: phones.length,
        guessedEmail: Boolean(guessedEmail && !selectedEmail),
      },
    }),
  };

  return enriched;
}

function safeRaw(rawSource: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(rawSource) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : { rawSource };
  } catch {
    return { rawSource };
  }
}

async function enrichPublicWebBatch(signals: RawSignal[]): Promise<RawSignal[]> {
  const limit = Number(process.env.PUBLIC_WEB_ENRICHMENT_LIMIT_PER_RUN ?? 50);
  const candidates = signals.slice(0, Math.max(0, limit));
  const untouched = signals.slice(candidates.length).map((signal) => ({
    ...signal,
    enrichmentSource: signal.enrichmentSource ?? "none",
    enrichmentStatus: signal.enrichmentStatus ?? "skipped_public_limit",
  }));

  const enriched: RawSignal[] = [];
  for (const signal of candidates) {
    try {
      enriched.push(await enrichWithPublicWeb(signal));
    } catch (err) {
      logger.warn({ err, sourceUrl: signal.sourceUrl }, "Public enrichment failed for signal");
      enriched.push({ ...signal, enrichmentSource: "platos_public_web", enrichmentStatus: "error" });
    }
  }

  return [...enriched, ...untouched];
}

function needsPaidFallback(signal: RawSignal): boolean {
  if (process.env.APOLLO_API_KEY && process.env.ENRICHMENT_ALLOW_APOLLO_FALLBACK !== "false") {
    return !signal.contactEmail || !signal.companyDomain;
  }
  return false;
}

export async function enrichSignals(signals: RawSignal[]): Promise<RawSignal[]> {
  if (process.env.ENRICHMENT_ENABLED === "false") {
    return signals.map((signal) => ({
      ...signal,
      enrichmentSource: signal.enrichmentSource ?? "none",
      enrichmentStatus: signal.enrichmentStatus ?? "disabled",
    }));
  }

  const publicEnriched = await enrichPublicWebBatch(signals);
  const fallbackCandidates = publicEnriched.filter(needsPaidFallback);
  if (fallbackCandidates.length === 0) return publicEnriched;

  const fallbackResults = await enrichSignalsWithApollo(fallbackCandidates);
  const bySourceUrl = new Map(fallbackResults.map((signal) => [signal.sourceUrl, signal]));
  return publicEnriched.map((signal) => bySourceUrl.get(signal.sourceUrl) ?? signal);
}
