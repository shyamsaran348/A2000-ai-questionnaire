# Moving to AWS

The app is a standard Next.js server plus a PostgreSQL database, so it can run on AWS
without code changes. This page lists what to set up and which settings to change.

## 1. Database → Amazon RDS for PostgreSQL (or Aurora PostgreSQL)

1. Create the database in **ap-south-1 (Mumbai)**, or keep the app and database in the same
   region as each other. Every page load makes database calls, so the app server and the
   database must be in the same region.
2. Copy the data across from Neon:
   ```bash
   pg_dump --no-owner --no-acl "$NEON_DATABASE_URL" > a2000.sql
   psql "$RDS_DATABASE_URL" < a2000.sql
   ```
3. Set `DATABASE_URL` to the RDS connection string, e.g.
   `postgresql://user:password@your-db.xxxx.ap-south-1.rds.amazonaws.com:5432/a2000?sslmode=require`

The app detects that it is no longer Neon and switches to the standard `pg` driver with a
connection pool automatically (see `src/lib/db/neon.ts`). Missing tables and indexes are
created on start-up.

## 2. App → AWS App Runner, ECS (Fargate) or an EC2 instance

`next.config.ts` already uses `output: "standalone"`, which produces a self-contained server:

```bash
npm ci && npm run build
# deploy .next/standalone, plus .next/static → .next/standalone/.next/static
#                         and public        → .next/standalone/public
node .next/standalone/server.js   # listens on $PORT (default 3000)
```

App Runner or ECS behind a load balancer are the simplest options. Run the app in the
**same region as the database**.

If you instead run the app on AWS Lambda (many short-lived instances), put **RDS Proxy** in
front of the database and use its endpoint in `DATABASE_URL`, and keep `DB_POOL_MAX` low
(2–5) so the database isn't flooded with connections.

## 3. Environment variables to set on AWS

| Variable | Notes |
|---|---|
| `DATABASE_URL` | RDS / Aurora connection string |
| `NEXT_PUBLIC_APP_URL` | The new public address, e.g. `https://assessments.a2000india.com`; used in invitation links |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Company mailbox (e.g. Zoho), or keep `GMAIL_USER` / `GMAIL_APP_PASSWORD` |
| `NOTIFICATION_EMAIL`, `MAIL_REPLY_TO` | Same values as today |
| `DB_POOL_MAX` | Optional, default 5 |

Store secrets in AWS Secrets Manager or SSM Parameter Store, not in the image.

## 4. Things that only apply to Vercel

- `vercel.json` (`"regions": ["sin1"]`) only tells Vercel to run the app next to the
  current Neon database in Singapore. AWS ignores it; delete it after the move.
- If the database moves region while the app is still on Vercel, change `sin1` to the
  Vercel region closest to the new database (e.g. `bom1` for Mumbai).

## 5. After the move

- Create a customer, open the portal link from the invitation email, submit, and check
  that the notification email arrives.
- Point the domain's DNS at the new app, then retire the Vercel project and Neon database
  once everything has been verified.
