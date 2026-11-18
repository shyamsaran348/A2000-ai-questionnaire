#!/usr/bin/env bash
#
# Back up the database to ~/a2000/backups (kept 14 days), and to S3 if BACKUP_S3_BUCKET is set.
# Runs nightly via /etc/cron.d/a2000-backup; can also be run by hand:  bash deploy/backup-db.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE="$(cd "$SCRIPT_DIR/../.." && pwd)"
set -a
# shellcheck disable=SC1091
source "$BASE/.env.production"
set +a

DEST="${BACKUP_DIR:-$BASE/backups}"
mkdir -p "$DEST"
FILE="$DEST/a2000-$(date +%Y-%m-%d-%H%M).sql.gz"

pg_dump --no-owner --no-acl "$DATABASE_URL" | gzip > "$FILE"
echo "$(date '+%F %T') backup written: $FILE ($(du -h "$FILE" | cut -f1))"

find "$DEST" -name 'a2000-*.sql.gz' -mtime +14 -delete

if [[ -n "${BACKUP_S3_BUCKET:-}" ]]; then
  aws s3 cp "$FILE" "s3://${BACKUP_S3_BUCKET}/db-backups/$(basename "$FILE")" --only-show-errors
  echo "$(date '+%F %T') uploaded to s3://${BACKUP_S3_BUCKET}/db-backups/"
fi
