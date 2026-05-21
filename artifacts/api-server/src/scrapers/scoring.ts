const STOP_WORDS = new Set([
  "and",
  "are",
  "for",
  "from",
  "into",
  "the",
  "that",
  "their",
  "this",
  "with",
  "your",
]);

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function keywordTokens(keyword: string): string[] {
  return normalize(keyword)
    .split(" ")
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
}

function keywordMatchWeight(normalizedText: string, keyword: string): number {
  const normalizedKeyword = normalize(keyword);
  if (!normalizedKeyword) return 0;

  if (normalizedText.includes(normalizedKeyword)) return 1;

  const tokens = keywordTokens(keyword);
  if (tokens.length === 0) return 0;

  const hits = tokens.filter((token) => normalizedText.includes(token)).length;
  const coverage = hits / tokens.length;

  if (coverage >= 0.8) return 0.85;
  if (coverage >= 0.6) return 0.65;
  if (coverage >= 0.4) return 0.35;
  return 0;
}

export function textFitScore(
  text: string,
  keywords: string[],
  disqualifiers: string[],
): number {
  const normalizedText = normalize(text);
  if (!normalizedText) return 0;

  const hasDisqualifier = disqualifiers.some((disqualifier) => {
    const normalizedDisqualifier = normalize(disqualifier);
    return normalizedDisqualifier && normalizedText.includes(normalizedDisqualifier);
  });
  if (hasDisqualifier) return 0;

  const usableKeywords = keywords
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  if (usableKeywords.length === 0) return 10;

  const weightedHits = usableKeywords.reduce(
    (sum, keyword) => sum + keywordMatchWeight(normalizedText, keyword),
    0,
  );
  if (weightedHits === 0) return 0;

  // Signals are short evidence snippets, not full ICP documents. A strong
  // match on 2-3 buyer-intent themes should surface even if the page does not
  // contain every keyword GPT generated from the customer's brief.
  return Math.min(90, Math.round(weightedHits * 28) + 10);
}
