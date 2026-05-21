# Self-hosting Plato's Core on a DigitalOcean Droplet

Replit remains dev/staging. The droplet runs the full production stack:
the customer app, admin panel, API, webhook receiver, and scraper worker.

---

## Architecture

```
                 ┌─────────────────────────────────┐
  Browser ──────▶│  nginx (443 / TLS termination)  │
                 └────────────┬────────────────────┘
                              │
                 ┌────────────▼────────────────────┐
                 │  PM2: platos-core-web (port 8080)│
                 │  Express: /api + static frontend │
                 └────────────┬────────────────────┘
                              │
                 ┌────────────▼────────────────────┐
                 │  PM2: platos-core-worker         │
                 │  Scraper job runner (no HTTP)    │
                 └────────────┬────────────────────┘
                              │
                 ┌────────────▼────────────────────┐
                 │  PostgreSQL 16                  │
                 └─────────────────────────────────┘
```

Both PM2 processes share the same `DATABASE_URL`. Tenant isolation is
enforced by `workspace_id` throughout the schema and all queries.

---

## Recommended droplet

| Spec | Minimum |
|---|---|
| Plan | Basic |
| RAM | 2 GB |
| CPU | 1 vCPU |
| OS  | Ubuntu 24.04 LTS |

---

## One-time droplet setup

```bash
# 1 — Install Node 24 via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 24
nvm use 24
nvm alias default 24

# 2 — Install pnpm
corepack enable
corepack prepare pnpm@latest --activate

# 3 — Install PM2 globally
npm install -g pm2

# 4 — Install PostgreSQL 16
sudo apt update
sudo apt install -y postgresql-16
sudo systemctl enable --now postgresql

# 5 — Install nginx
sudo apt install -y nginx certbot python3-certbot-nginx
sudo systemctl enable --now nginx

# 6 — Create the database
sudo -u postgres psql -c "CREATE USER platos WITH PASSWORD 'your_strong_password';"
sudo -u postgres psql -c "CREATE DATABASE platos OWNER platos;"

# 7 — Create log directory
sudo mkdir -p /var/log/platos
sudo chown $USER /var/log/platos
```

---

## Deploy the app

```bash
# 1 — Clone the repo
git clone https://github.com/tavon-ossmain/Plato-Redesign2.git /var/www/platos
cd /var/www/platos

# 2 — Install dependencies
pnpm install --frozen-lockfile

# 3 — Create env file (copy example, then fill in all values)
cp .env.example .env
nano .env

# 4 — Run database migrations
pnpm --filter @workspace/db run push

# 5 — Build for production (compiles API + frontend)
pnpm run build:prod

# 6 — Start with PM2
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup    # follow the printed command to enable auto-restart on reboot
```

### Verify

```bash
pm2 list           # both processes should show "online"
pm2 logs           # tail all logs
curl -s http://localhost:8080/api/healthz   # should return {"ok":true}
```

---

## nginx configuration

Create `/etc/nginx/sites-available/platos`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # TLS — filled in by certbot
    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    # Proxy everything to Express (which serves API + static frontend)
    location / {
        proxy_pass         http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/platos /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Issue TLS certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Clerk configuration (required after first deploy)

Before auth works you must register your production domain with Clerk:

1. Go to **Clerk Dashboard → Domains → Add domain**
2. Add `yourdomain.com`
3. Copy the new `pk_live_...` / `sk_live_...` keys
4. Update `.env` with the new keys
5. Rebuild the frontend (the publishable key is baked in at build time):

```bash
pnpm run build:prod
pm2 reload platos-core-web
```

---

## Day-to-day operations

```bash
# Pull and redeploy
cd /var/www/platos
git pull
pnpm install --frozen-lockfile
pnpm run build:prod
pm2 reload ecosystem.config.cjs --env production

# Apply schema changes after a migration
pnpm --filter @workspace/db run push

# Seed sample data
NODE_ENV=production pnpm --filter @workspace/api-server run seed

# Tail logs
pm2 logs platos-core-web    # API + frontend
pm2 logs platos-core-worker # scraper job runner

# Restart individual process
pm2 restart platos-core-web
pm2 restart platos-core-worker

# Stop everything
pm2 stop all
```

---

## Environment variables

All config comes from `.env` in the project root. See `.env.example` for the full
reference. Required before first boot:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `APP_URL` | Public URL — used in email CTAs |
| `CLERK_SECRET_KEY` | Clerk backend key |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk frontend key (baked into build) |
| `OPENAI_API_KEY` | ICP brief parsing |
| `RESEND_API_KEY` | Transactional email |
| `RESEND_FROM_EMAIL` | From address for outbound emails |
| `ADMIN_EMAILS` | Comma-separated admin email addresses |

Optional:

| Variable | Default | Purpose |
|---|---|---|
| `INTERNAL_SLACK_WEBHOOK_URL` | _(none)_ | Slack ping on workspace activation |
| `JOB_RUNNER_INTERVAL_MS` | `60000` | Worker polling interval |
| `JOB_RUNNER_CONCURRENCY` | `3` | Max concurrent scraper jobs per tick |
| `ENABLE_PLAYWRIGHT` | `false` | Enable headless LinkedIn scraper |
| `FRONTEND_DIST` | auto-detected | Override path to built frontend files |

---

## Scraper worker

`platos-core-worker` is a separate PM2 process with no HTTP server.
It polls `scraper_jobs` every `JOB_RUNNER_INTERVAL_MS` and:

- Only processes jobs with `status = queued` AND `source_configs.status = active`
- Preview workspaces (status `preview_paused`) are **never** executed
- Writes real signal rows to `signals` with `workspace_id` isolation
- Records `run_log` and `error_message` per job
- Marks failed jobs `failed` — no silent suppression

The web process (`platos-core-web`) does **not** run the worker — the two
processes are fully separated and only share `DATABASE_URL`.
