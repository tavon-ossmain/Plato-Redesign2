# Self-hosting Plato's Core on a DigitalOcean Droplet

## Recommended droplet

| Spec | Minimum | Comfortable |
|---|---|---|
| Plan | Basic | General Purpose |
| RAM | 2 GB | 4 GB |
| CPU | 1 vCPU | 2 vCPU |
| OS | Ubuntu 24.04 LTS | Ubuntu 24.04 LTS |

---

## One-time droplet setup

```bash
# 1. Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# 2. Install Docker Compose v2 plugin (included with Docker CE ≥ 24)
docker compose version   # verify

# 3. (Optional but recommended) Install nginx for TLS termination
sudo apt install -y nginx certbot python3-certbot-nginx
```

---

## Deploy the app

```bash
# 1. Clone the repo onto the droplet
git clone https://github.com/tavon-ossmain/Plato-Redesign2.git platos
cd platos

# 2. Create your env file
cp deploy/.env.example deploy/.env
nano deploy/.env          # fill in every value

# 3. Build and start (first run takes ~3-5 min to build images)
docker compose -f deploy/docker-compose.yml up -d --build

# 4. Tail logs to confirm startup
docker compose -f deploy/docker-compose.yml logs -f
```

You should see:
```
api  | INFO: Server listening  port: 8080
api  | INFO: Job runner started  intervalMs: 60000
```

The app is now reachable at `http://<droplet-ip>`.

---

## HTTPS with Let's Encrypt (recommended)

```bash
# Replace yourdomain.com with your actual domain (DNS must point to the droplet first)
sudo certbot --nginx -d yourdomain.com

# Certbot will auto-renew — verify the timer is active
systemctl status certbot.timer
```

Then update `APP_URL` in `deploy/.env` to `https://yourdomain.com` and restart:

```bash
docker compose -f deploy/docker-compose.yml restart api
```

---

## Day-to-day operations

```bash
# Pull latest code and rebuild
git pull
docker compose -f deploy/docker-compose.yml up -d --build

# View live API logs
docker compose -f deploy/docker-compose.yml logs -f api

# Run seed script
docker compose -f deploy/docker-compose.yml exec api \
  node --enable-source-maps artifacts/api-server/dist/index.mjs seed

# Run a one-off DB migration after schema changes
docker compose -f deploy/docker-compose.yml run --rm migrate

# Restart just the API
docker compose -f deploy/docker-compose.yml restart api

# Stop everything
docker compose -f deploy/docker-compose.yml down

# Stop everything AND wipe the database
docker compose -f deploy/docker-compose.yml down -v
```

---

## Environment variables reference

See `deploy/.env.example` for the full list with descriptions.

Required before first boot:
- `POSTGRES_PASSWORD` — strong password, never the example value
- `APP_URL` — your public domain (`https://yourdomain.com`)
- `SESSION_SECRET` — 32+ random characters
- `CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` — from Clerk dashboard
- `OPENAI_API_KEY` — for ICP brief parsing
- `RESEND_API_KEY` — for activation emails
- `ADMIN_EMAILS` — comma-separated list of admin Clerk emails

---

## Job runner

The API container runs the scraper job runner as an in-process `setInterval` loop — no separate container needed. It:

- Ticks every `JOB_RUNNER_INTERVAL_MS` (default 60 s)
- Picks up `scraper_jobs` with `status = queued` whose `source_configs.status = active`
- Writes real signal rows to the `signals` table
- Records `run_log` and `error_message` per job

**Preview workspaces are never executed** — the runner only processes jobs joined to an `active` source config.

---

## Clerk configuration

After deploying you need to add your droplet's domain to Clerk:
1. Go to **Clerk Dashboard → Domains**
2. Add `yourdomain.com` as a production domain
3. Copy the new `pk_live_...` / `sk_live_...` keys into `deploy/.env`
4. Rebuild: `docker compose -f deploy/docker-compose.yml up -d --build`
