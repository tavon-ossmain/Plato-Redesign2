/**
 * Seed script — run once to populate the database with initial data.
 * Safe to re-run: uses INSERT ... ON CONFLICT DO NOTHING.
 */
import { db } from "@workspace/db";
import {
  workspacesTable,
  signalsTable,
  workspaceSourcesTable,
} from "@workspace/db/schema";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("Seeding workspaces…");
  await db
    .insert(workspacesTable)
    .values([
      {
        id: "ws-1",
        name: "Acme Corp",
        plan: "Growth",
        quota: 200,
        used: 143,
        rawScanned: 14302,
        uniqueAccounts: 1847,
        duplicatesSuppressed: 412,
        staleSignals: 223,
        status: "active",
      },
      {
        id: "ws-2",
        name: "TechFlow",
        plan: "Scale",
        quota: 500,
        used: 312,
        rawScanned: 29100,
        uniqueAccounts: 3201,
        duplicatesSuppressed: 780,
        staleSignals: 401,
        status: "active",
      },
    ])
    .onConflictDoNothing();

  console.log("Seeding workspace sources…");
  // Delete existing sources for these workspaces first to allow re-seeding cleanly
  await db.execute(
    sql`DELETE FROM workspace_sources WHERE workspace_id IN ('ws-1','ws-2')`,
  );
  await db.insert(workspaceSourcesTable).values([
    { workspaceId: "ws-1", name: "LinkedIn",   yield: 38, status: "healthy"  },
    { workspaceId: "ws-1", name: "G2",         yield: 24, status: "healthy"  },
    { workspaceId: "ws-1", name: "Reddit",     yield: 17, status: "degraded" },
    { workspaceId: "ws-1", name: "Job Boards", yield: 14, status: "healthy"  },
    { workspaceId: "ws-1", name: "Web Scrape", yield: 7,  status: "error"    },
    { workspaceId: "ws-2", name: "LinkedIn",   yield: 41, status: "healthy"  },
    { workspaceId: "ws-2", name: "G2",         yield: 22, status: "healthy"  },
    { workspaceId: "ws-2", name: "Reddit",     yield: 19, status: "healthy"  },
    { workspaceId: "ws-2", name: "Job Boards", yield: 11, status: "degraded" },
    { workspaceId: "ws-2", name: "Web Scrape", yield: 7,  status: "error"    },
  ]);

  console.log("Seeding signals…");
  await db
    .insert(signalsTable)
    .values([
      {
        id: "sig-001",
        workspaceId: "ws-1",
        company: "Lattice Systems",
        contactName: "Jordan Park",
        contactTitle: "VP Sales Ops",
        contactLinkedin: "linkedin.com/in/jordanpark",
        source: "LinkedIn",
        sourcePlatform: "linkedin",
        sourceUrl: "https://linkedin.com/posts/lattice-hiring-sdr",
        evidenceSnippet:
          "We're scaling our outbound team by 3x this quarter and looking for a tool that gives reps verified buying signals — not spray-and-pray lists.",
        whyNow: "Active hiring for SDR roles, Q2 budget cycle open",
        fitScore: 92,
        confidenceScore: 88,
        freshnessScore: 97,
        seenAt: "2025-05-19T09:12:00Z",
        lastVerifiedAt: "2025-05-19T09:14:22Z",
        disposition: "billable_opportunity",
        recommendedChannel: "LinkedIn DM",
        owner: "Alex Rivera",
        route: "routed",
        crmStatus: "clean",
        dedupeStatus: "unique",
        modelPath: "high-intent-outbound",
        rawSource: "linkedin_post",
        feedback: null,
      },
      {
        id: "sig-002",
        workspaceId: "ws-1",
        company: "Meridian Capital",
        contactName: "Sam Okonkwo",
        contactTitle: "Head of Revenue",
        contactLinkedin: "linkedin.com/in/samokonkwo",
        source: "G2",
        sourcePlatform: "g2",
        sourceUrl: "https://g2.com/products/outbound/reviews",
        evidenceSnippet:
          "Just evaluated three intent tools. None of them filtered CRM duplicates properly. We shipped 200 leads last month, 60% were already in our system.",
        whyNow: "Public competitor complaint, actively evaluating replacements",
        fitScore: 86,
        confidenceScore: 79,
        freshnessScore: 84,
        seenAt: "2025-05-19T08:44:00Z",
        lastVerifiedAt: "2025-05-19T08:47:11Z",
        disposition: "billable_opportunity",
        recommendedChannel: "Email",
        owner: "Maya Chen",
        route: "unrouted",
        crmStatus: "clean",
        dedupeStatus: "unique",
        modelPath: "competitor-displacement",
        rawSource: "g2_review",
        feedback: null,
      },
      {
        id: "sig-003",
        workspaceId: "ws-1",
        company: "Cloudform",
        contactName: "Priya Desai",
        contactTitle: "Sales Enablement Lead",
        contactLinkedin: "linkedin.com/in/priyadesai",
        source: "Reddit",
        sourcePlatform: "reddit",
        sourceUrl: "https://reddit.com/r/sales/comments/xyz",
        evidenceSnippet:
          "Anyone using signal tools that aren't just recycled ZoomInfo? We want real intent, not demographic targeting.",
        whyNow: "Community question seeking active vendor recommendations",
        fitScore: 74,
        confidenceScore: 69,
        freshnessScore: 91,
        seenAt: "2025-05-19T07:30:00Z",
        lastVerifiedAt: "2025-05-19T07:31:00Z",
        disposition: "intent_update",
        recommendedChannel: "Cold Email",
        owner: "Unassigned",
        route: "unrouted",
        crmStatus: "clean",
        dedupeStatus: "unique",
        modelPath: "community-intent",
        rawSource: "reddit_comment",
        feedback: null,
      },
      {
        id: "sig-004",
        workspaceId: "ws-1",
        company: "NovaBridge",
        contactName: "Tyler Walsh",
        contactTitle: "Director of Demand Gen",
        contactLinkedin: "linkedin.com/in/tylerwalsh",
        source: "LinkedIn",
        sourcePlatform: "linkedin",
        sourceUrl: "https://linkedin.com/posts/novabridge-tools",
        evidenceSnippet:
          "Excited to announce our partnership with Outreach. Scaling up the outbound motion starting Q2.",
        whyNow: "Tech stack expansion signal",
        fitScore: 61,
        confidenceScore: 54,
        freshnessScore: 72,
        seenAt: "2025-05-18T15:20:00Z",
        lastVerifiedAt: "2025-05-18T15:21:00Z",
        disposition: "watchlist",
        recommendedChannel: "LinkedIn DM",
        owner: "Unassigned",
        route: "unrouted",
        crmStatus: "duplicate",
        dedupeStatus: "duplicate",
        modelPath: "tech-intent",
        rawSource: "linkedin_post",
        feedback: null,
      },
      {
        id: "sig-005",
        workspaceId: "ws-1",
        company: "Stratum Analytics",
        contactName: "Chloe Nguyen",
        contactTitle: "CMO",
        contactLinkedin: "linkedin.com/in/chloeng",
        source: "Job Posting",
        sourcePlatform: "job_board",
        sourceUrl: "https://greenhouse.io/stratumanalytics/jobs",
        evidenceSnippet:
          "Hiring: Enterprise Account Executive with experience in intent-based outbound. Must have worked with signal tools.",
        whyNow: "AE hiring — outbound scaling signal",
        fitScore: 88,
        confidenceScore: 83,
        freshnessScore: 79,
        seenAt: "2025-05-18T12:05:00Z",
        lastVerifiedAt: "2025-05-18T12:06:30Z",
        disposition: "billable_opportunity",
        recommendedChannel: "Email",
        owner: "Alex Rivera",
        route: "routed",
        crmStatus: "clean",
        dedupeStatus: "unique",
        modelPath: "hiring-intent",
        rawSource: "job_board",
        feedback: null,
      },
    ])
    .onConflictDoNothing();

  console.log("✓ Seed complete");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
