/**
 * Plato's Core — standalone scraper worker process.
 *
 * Run with PM2 as `platos-core-worker`.
 * Shares DATABASE_URL with the web process; no HTTP server.
 */
import { logger } from "./lib/logger.js";
import { startJobRunner, stopJobRunner } from "./scrapers/runner.js";

logger.info("Plato's Core worker starting");

startJobRunner();

function shutdown(signal: string) {
  logger.info({ signal }, "Worker shutting down");
  stopJobRunner();
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));
