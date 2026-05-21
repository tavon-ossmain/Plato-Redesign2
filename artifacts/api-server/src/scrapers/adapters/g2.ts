import type { ScraperAdapter, ScraperInput, RawSignal } from "../types.js";
import { logger } from "../../lib/logger.js";

/**
 * G2 is kept as a first-class source config so operators can sell/preview it
 * without failing the worker. Live G2 collection should be wired through an
 * approved provider or explicit customer-approved seed URLs.
 */
export const g2Adapter: ScraperAdapter = {
  sourceType: "g2",

  async run(input: ScraperInput): Promise<RawSignal[]> {
    logger.info(
      { workspaceId: input.workspaceId, sourceConfigId: input.sourceConfigId },
      "G2 adapter is not enabled yet — skipping cleanly instead of failing the job.",
    );
    return [];
  },
};
