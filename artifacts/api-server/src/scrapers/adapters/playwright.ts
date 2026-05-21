import type { ScraperAdapter, ScraperInput, RawSignal } from "../types.js";
import { logger } from "../../lib/logger.js";

/**
 * Playwright adapter — placeholder.
 *
 * Playwright is not installed in this environment. To enable:
 *   1. Set env var ENABLE_PLAYWRIGHT=true
 *   2. Install: pnpm --filter @workspace/api-server add playwright
 *   3. Replace this stub with a real headless-browser implementation
 *
 * Until then, this adapter queues cleanly and returns no results,
 * which is logged honestly in the job run_log.
 */
export const playwrightAdapter: ScraperAdapter = {
  sourceType: "linkedin",

  async run(input: ScraperInput): Promise<RawSignal[]> {
    if (process.env["ENABLE_PLAYWRIGHT"] !== "true") {
      logger.info(
        { workspaceId: input.workspaceId, sourceConfigId: input.sourceConfigId },
        "Playwright adapter is disabled. Set ENABLE_PLAYWRIGHT=true and install playwright to enable.",
      );
      return [];
    }

    logger.warn(
      { workspaceId: input.workspaceId, sourceConfigId: input.sourceConfigId },
      "ENABLE_PLAYWRIGHT=true but Playwright is not yet implemented. Returning empty.",
    );
    return [];
  },
};
