/**
 * PM2 ecosystem config for Plato's Core self-hosted deployment.
 *
 * Usage:
 *   pm2 start ecosystem.config.cjs --env production
 *   pm2 save
 *   pm2 startup   # auto-restart on reboot
 */

const fs = require("node:fs");

const DEPLOY_DIR = process.env.PLATOS_DEPLOY_DIR || "/var/www/platos";
const ENV_PATH = process.env.PLATOS_ENV_PATH || `${DEPLOY_DIR}/.env`;

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  return fs.readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .reduce((acc, line) => {
      const idx = line.indexOf("=");
      if (idx === -1) return acc;
      const key = line.slice(0, idx).trim();
      const raw = line.slice(idx + 1).trim();
      acc[key] = raw.replace(/^["']|["']$/g, "");
      return acc;
    }, {});
}

const fileEnv = loadEnvFile(ENV_PATH);

module.exports = {
  apps: [
    {
      // ── Web: Express API + static frontend ─────────────────────── //
      name: "platos-core-web",
      script: "node",
      args: "--enable-source-maps artifacts/api-server/dist/index.mjs",
      cwd: DEPLOY_DIR,
      env: {
        ...fileEnv,
        NODE_ENV: "production",
        PORT: "8080",
      },
      watch: false,
      max_memory_restart: "512M",
      instances: 1,
      exec_mode: "fork",
      // Restart policy
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: "5s",
      // Logging
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      out_file: "/var/log/platos/web.out.log",
      error_file: "/var/log/platos/web.err.log",
      merge_logs: true,
    },

    {
      // ── Worker: scraper job runner ──────────────────────────────── //
      name: "platos-core-worker",
      script: "node",
      args: "--enable-source-maps artifacts/api-server/dist/worker.mjs",
      cwd: DEPLOY_DIR,
      env: {
        ...fileEnv,
        NODE_ENV: "production",
        // Tune polling interval and concurrency via env if needed
        // JOB_RUNNER_INTERVAL_MS: "60000",
        // JOB_RUNNER_CONCURRENCY: "3",
      },
      watch: false,
      max_memory_restart: "256M",
      instances: 1,
      exec_mode: "fork",
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: "5s",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      out_file: "/var/log/platos/worker.out.log",
      error_file: "/var/log/platos/worker.err.log",
      merge_logs: true,
    },
  ],
};
