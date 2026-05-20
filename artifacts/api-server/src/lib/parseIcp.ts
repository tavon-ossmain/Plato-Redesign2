import { openai } from "./openai";
import type { IcpConfig } from "@workspace/db";

/** Briefs under this quality threshold escalate to the stronger model. */
const WEAK_BRIEF_THRESHOLD = 30; // words

const VALID_SOURCES = ["linkedin", "reddit", "g2", "jobboards", "webscrape"] as const;

type BriefInput = {
  companyName: string;
  contactEmail: string;
  icp?: string;
  useCases?: string;
  signalSources?: string[];
  additionalContext?: string;
};

function briefWordCount(brief: BriefInput): number {
  return [brief.icp, brief.useCases, brief.additionalContext]
    .filter(Boolean)
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
}

function pickModel(brief: BriefInput): "gpt-4o-mini" | "gpt-4o" {
  const wc = briefWordCount(brief);
  const hasSize = /\b(smb|enterprise|startup|employee|headcount|\d+\s*-\s*\d+)\b/i.test(
    [brief.icp, brief.useCases].join(" "),
  );
  const hasIndustry = /\b(saas|fintech|health|legal|real estate|logistics|retail|industry|sector|vertical)\b/i.test(
    [brief.icp, brief.useCases].join(" "),
  );
  if (wc >= WEAK_BRIEF_THRESHOLD && (hasSize || hasIndustry)) return "gpt-4o-mini";
  return "gpt-4o";
}

const SYSTEM_PROMPT = `You are an expert B2B go-to-market analyst. A sales signal monitoring platform needs you to parse a customer brief and return a structured ICP configuration.

Return ONLY valid JSON matching this schema (no markdown, no extra text):
{
  "normalizedIcp": "<clear 1-2 sentence ICP statement>",
  "signalSources": ["<source from: linkedin, reddit, g2, jobboards, webscrape>"],
  "keywords": ["<keyword or search theme>", ...],
  "disqualifiers": ["<company type or signal to ignore>", ...],
  "routingNotes": "<which type of rep should handle these signals and why>",
  "scoringRules": {
    "fitFactors": ["<factor that increases fit score>", ...],
    "confidenceFactors": ["<factor that increases confidence score>", ...]
  },
  "confidence": <0.0–1.0 float — your confidence in this parse>
}

Rules:
- signalSources must only contain values from: linkedin, reddit, g2, jobboards, webscrape
- keywords should be 5-12 specific search terms, not generic words
- disqualifiers should be specific: company types, industries, or signal patterns to exclude
- scoringRules should be concrete and actionable (e.g. "Title contains VP/Director/CRO", not "high title")
- If the brief is sparse, make reasonable inferences and lower confidence accordingly
- confidence < 0.6 means the brief was too vague to parse with certainty`;

export async function parseIcp(brief: BriefInput): Promise<IcpConfig> {
  const model = pickModel(brief);

  const userMessage = `
Company: ${brief.companyName}
Contact: ${brief.contactEmail}
ICP Description: ${brief.icp ?? "Not provided"}
Use Cases: ${brief.useCases ?? "Not provided"}
Requested Signal Sources: ${brief.signalSources?.join(", ") ?? "Not specified"}
Additional Context: ${brief.additionalContext ?? "None"}
`.trim();

  const response = await openai.chat.completions.create({
    model,
    temperature: 0.2,
    max_tokens: 800,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as Omit<IcpConfig, "modelUsed">;

  // Sanitise signalSources to only valid values
  const sanitisedSources = (parsed.signalSources ?? []).filter((s: string) =>
    (VALID_SOURCES as readonly string[]).includes(s),
  );

  return {
    normalizedIcp:  parsed.normalizedIcp  ?? "",
    signalSources:  sanitisedSources.length ? sanitisedSources : ["linkedin"],
    keywords:       parsed.keywords       ?? [],
    disqualifiers:  parsed.disqualifiers  ?? [],
    routingNotes:   parsed.routingNotes   ?? "",
    scoringRules: {
      fitFactors:        parsed.scoringRules?.fitFactors        ?? [],
      confidenceFactors: parsed.scoringRules?.confidenceFactors ?? [],
    },
    modelUsed:  model,
    confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
  };
}
