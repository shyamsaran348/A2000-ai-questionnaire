#!/usr/bin/env bash
#
# Copy all data from the current Neon database into the database in .env.production
# (the local PostgreSQL created by setup-server.sh --with-postgres).
#
#   bash deploy/copy-data-from-neon.sh "postgresql://...neon.tech/neondb?sslmode=require"
#
# The Neon URL is the DATABASE_URL currently set in Vercel. The target must be empty;
# run this BEFORE the first deploy.sh, and stop using the Vercel site once copied.

set -euo pipefail

NEON_URL="${1:-}"
[[ "$NEON_URL" == *neon.tech* ]] || { echo "Usage: bash $0 \"<Neon DATABASE_URL>\""; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE="$(cd "$SCRIPT_DIR/../.." && pwd)"
set -a
# shellcheck disable=SC1091
source "$BASE/.env.production"
set +a
[[ "$DATABASE_URL" != *neon.tech* ]] || { echo "DATABASE_URL in .env.production still points at Neon."; exit 1; }

EXISTING="$(psql "$DATABASE_URL" -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'")"
if [[ "$EXISTING" != "0" ]]; then
  echo "The target database already has ${EXISTING} tables. Refusing to overwrite it."
  exit 1
fi

DUMP="$BASE/backups/neon-export-$(date +%Y-%m-%d-%H%M).sql"
mkdir -p "$BASE/backups"
echo "==> Exporting from Neon"
pg_dump --no-owner --no-acl "$NEON_URL" > "$DUMP"
echo "==> Importing into the new database"
psql -v ON_ERROR_STOP=1 -q "$DATABASE_URL" < "$DUMP"

echo "==> Row counts (Neon vs new)"
for t in customers questionnaire_submissions questionnaire_answers; do
  a="$(psql "$NEON_URL" -tAc "SELECT count(*) FROM $t" 2>/dev/null || echo -)"
  b="$(psql "$DATABASE_URL" -tAc "SELECT count(*) FROM $t" 2>/dev/null || echo -)"
  printf '  %-28s %6s  %6s  %s\n' "$t" "$a" "$b" "$([[ "$a" == "$b" ]] && echo OK || echo MISMATCH)"
done
echo "Export kept at $DUMP"
