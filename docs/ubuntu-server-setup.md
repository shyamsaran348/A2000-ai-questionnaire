# Ubuntu server setup (AWS Lightsail, all-in-one)

This guide runs the whole A2000 questionnaire app on one Ubuntu server: the Next.js app, a local
PostgreSQL database, Nginx in front for HTTPS, and nightly database backups. It replaces Vercel and Neon.

No code changes are needed. The app picks the database driver from `DATABASE_URL`: a `*.neon.tech`
address uses the Neon HTTP driver; anything else, such as the local `127.0.0.1` database, uses `pg`.
Everything server-specific lives in [`deploy/`](../deploy).

## How it fits together

```
Browser ──HTTPS 443──▶ Nginx ──▶ Next.js app on 127.0.0.1:3000 (run by PM2) ──▶ PostgreSQL 18 on 127.0.0.1:5432
                                                     │
                                                     └──▶ Gmail / Zoho SMTP (port 465) for emails
```

Code moves from the laptop to GitHub and then to the server (`git clone` the first time, then `deploy.sh`). Nothing is copied
by hand.

### Folder layout on the server

| Path | What it is |
| --- | --- |
| `~/a2000/app` | The Git clone. `deploy.sh` builds from here. |
| `~/a2000/.env.production` | Secrets and settings (mode 600, never in Git) |
| `~/a2000/releases/<timestamp>` | Built copies of the app. The 3 newest are kept. |
| `~/a2000/current` | A link to the release that is running |
| `~/a2000/backups` | Nightly database dumps (14 days) and the Neon export |

### What the scripts do

| File | Run as | Purpose |
| --- | --- | --- |
| `deploy/setup-server.sh [--with-postgres]` | `sudo`, once | Installs git, Nginx, certbot, Node 22 and PM2, the PostgreSQL 18 client tools, and 2 GB of swap. Creates the folders and `.env.production` and enables the Nginx site. With `--with-postgres` it also installs the PostgreSQL 18 server, creates the `a2000` role (with a random password) and the `a2000` database, writes `DATABASE_URL`, and installs the nightly backup cron job. You can run it again safely. |
| `deploy/copy-data-from-neon.sh "<neon url>"` | normal user, once | Exports Neon with `pg_dump`, imports into the local database and compares row counts. It refuses to run if the target database already has tables. |
| `deploy/deploy.sh` | normal user, for every release | `git pull`, `npm ci`, `next build` (standalone), copies the build into a new release, switches `current`, reloads PM2, then runs a health check. `--rollback` switches back to the previous release. Set `SKIP_PULL=1` to build without pulling. |
| `deploy/backup-db.sh` | cron 02:00, or by hand | `pg_dump \| gzip` into `~/a2000/backups`, keeping 14 days. Also uploads to S3 if `BACKUP_S3_BUCKET` is set. |
| `deploy/ecosystem.config.cjs` | used by PM2 | Starts the app (`server.js`) with `--env-file=~/a2000/.env.production` on `127.0.0.1:3000`, and restarts it if it uses more than 700 MB. |
| `deploy/nginx-a2000.conf` | used by the setup script | Listens on port 80 and proxies to port 3000 with the forwarded headers. Caches `/_next/static` for a year. Allows request bodies up to 20 MB (submissions carry a PDF). |

---

## 1. Collect the settings

Three values from the current setup are needed. They are in `.env.local` on the development laptop
(`cat .env.local` in the project folder), and also under Vercel → Project → Settings → Environment Variables.

| Variable | Use |
| --- | --- |
| `DATABASE_URL` (Neon, contains `neon.tech`) | Only for the one-time data copy (step 5). The server uses its own database. |
| `GMAIL_USER` | The mailbox that sends the emails |
| `GMAIL_APP_PASSWORD` | The 16-character app password. If it is lost, create a new one at myaccount.google.com → Security → App passwords. |

Keep these values out of chat, email and Git.

## 2. Create the server

On Lightsail (lightsail.aws.amazon.com), choose **Create instance**:

1. Region **Mumbai (ap-south-1)**, platform Linux/Unix, blueprint **OS Only → Ubuntu 24.04 LTS**.
2. Plan: **2 GB memory or more.** `next build` needs about 1.5 GB, and the setup script adds 2 GB of swap as a safety margin.
3. Create it, then **Networking → Create static IP** and attach it to the instance.
4. Instance **Networking → IPv4 Firewall → Add rule → HTTPS (443)**. Ports 22 and 80 are open by default.
5. Instance **Snapshots → Enable automatic snapshots**.

Open a terminal with **Connect using SSH**, the browser-based terminal. All commands below run there as the default
`ubuntu` user.

## 3. Install everything

```bash
mkdir -p ~/a2000 && cd ~/a2000
git clone https://github.com/shyamsaran348/A2000-ai-questionnaire.git app
cd app
sudo bash deploy/setup-server.sh --with-postgres
```

If the domain's DNS already points at the server, pass it now and skip the `sed` in step 7:
`sudo DOMAIN=assessments.a2000india.com bash deploy/setup-server.sh --with-postgres`.

If the repository is private, cloning asks for a username and password. Use a GitHub
[personal access token](https://github.com/settings/tokens) (read-only, Contents) as the password.

## 4. Fill in `.env.production`

```bash
nano ~/a2000/.env.production
```

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | `"http://<static IP>"` for now, then `"https://assessments.a2000india.com"` after step 7. It is built into the app at build time, so re-run `deploy.sh` after changing it. |
| `DATABASE_URL` | **Leave as is.** The setup script wrote `postgresql://a2000:…@127.0.0.1:5432/a2000`. |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | From step 1 |
| `NOTIFICATION_EMAIL` | Where submission notifications go (default `ramyadevi@a2000india.com`) |
| `SMTP_*`, `MAIL_FROM_NAME`, `MAIL_REPLY_TO` | Optional: send from a company Zoho mailbox instead of Gmail (better deliverability) |

Keep every value in double quotes. Save with Ctrl+O, Enter, then exit with Ctrl+X.

## 5. Copy the data from Neon

Do this **before the first deploy**, while the local database is still empty:

```bash
bash deploy/copy-data-from-neon.sh "postgresql://...neon.tech/neondb?sslmode=require"
```

Every row in the comparison table should say `OK`. The export is kept in `~/a2000/backups/neon-export-*.sql`.

## 6. Build and start

```bash
bash deploy/deploy.sh
```

Wait for `App is running: …`, then open `http://<static IP>`. Check that:

- staff sign-in works and the existing customers are listed;
- creating a test customer sends the invitation email (use your own address);
- the portal link in that email opens and autosaves answers;
- submitting sends the notification email with the PDF.

PM2 starts the app again after a crash or a reboot (`pm2 startup` was set up by the setup script).

## 7. Domain and HTTPS

1. DNS for a2000india.com: add an **A** record with name `assessments` and the static IP as its value.
2. Once `ping assessments.a2000india.com` shows the static IP:

   ```bash
   sudo sed -i 's/server_name _;/server_name assessments.a2000india.com;/' /etc/nginx/sites-available/a2000
   sudo nginx -t && sudo systemctl reload nginx
   sudo certbot --nginx -d assessments.a2000india.com
   ```

   Certbot adds the 443 configuration, an HTTP→HTTPS redirect and automatic renewal.
3. Set `NEXT_PUBLIC_APP_URL="https://assessments.a2000india.com"` in `.env.production`, then run
   `bash deploy/deploy.sh`.

## 8. Retire Vercel and Neon

- After the copy in step 5, any new answers saved through the Vercel site go to Neon and will **not**
  reach the server. Switch the Vercel site off, or make it redirect to the new domain, as soon as the server works.
- Invitation emails sent before the move contain the old Vercel address. A redirect keeps those links working.
- Keep the Neon project for a week or two as a fallback, then delete it.

---

## Day-to-day operations

| Task | Command (on the server) |
| --- | --- |
| Release a new version | `cd ~/a2000/app && bash deploy/deploy.sh` |
| Roll back | `bash deploy/deploy.sh --rollback` |
| Status / logs | `pm2 status` · `pm2 logs a2000 --lines 100` |
| Restart | `pm2 restart a2000` |
| Back up now | `bash deploy/backup-db.sh` |
| Restore a backup | `gunzip -c ~/a2000/backups/a2000-<date>.sql.gz \| psql "$DATABASE_URL"` (restore into an empty database) |
| Database shell | `source ~/a2000/.env.production && psql "$DATABASE_URL"` |
| Nginx logs | `sudo tail -f /var/log/nginx/error.log` |
| OS updates | `sudo apt update && sudo apt upgrade -y` (then `sudo reboot` if asked) |

## Troubleshooting

| Symptom | Likely cause and fix |
| --- | --- |
| `deploy.sh` says `DATABASE_URL is empty` | The setup script was run without `--with-postgres`, or the line was deleted. Run the setup script again with `--with-postgres`. |
| The build is killed or stops with an out-of-memory error | The server has less than 2 GB of memory. Check swap with `free -h`, or resize to a larger plan from a snapshot. |
| `502 Bad Gateway` | The app is not running. Check `pm2 logs a2000`; often a value in `.env.production` is missing or has no quotes. |
| Emails not sending | Check `GMAIL_APP_PASSWORD` (16 characters, no spaces needed) and look at `pm2 logs`. AWS blocks only port 25, and the app uses 465. |
| Links in emails point to the IP or the wrong host | Set `NEXT_PUBLIC_APP_URL`, then run `deploy.sh` again. The value is fixed at build time. |
| `copy-data-from-neon.sh` refuses to run | The local database already has tables, usually because the app started before the copy. Ask a developer before you drop anything. |
| Certbot cannot find a server block | The `server_name` is still `_`. Run the `sed` command in step 7. |

## Security notes

- The app listens only on `127.0.0.1`. Only ports 22, 80 and 443 are public.
- PostgreSQL listens only on localhost and has a random password. `.env.production` is readable only by the app user.
- Still open in the app itself: portal and customer API routes are not yet checked on the server, and the staff passkey
  is hard-coded. Fix these before sharing the site widely, and consider making the GitHub repository private.
