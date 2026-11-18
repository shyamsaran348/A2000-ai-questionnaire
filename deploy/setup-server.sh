#!/usr/bin/env bash
#
# One-time setup of a fresh Ubuntu 22.04 / 24.04 server for the A2000 app.
#
#   sudo bash deploy/setup-server.sh                  # database stays on Neon
#   sudo bash deploy/setup-server.sh --with-postgres  # also install PostgreSQL on this server
#
# Optional: DOMAIN=assessments.a2000india.com sudo -E bash deploy/setup-server.sh ...
# Safe to run again; it skips anything already done.

set -euo pipefail

WITH_PG=false
[[ "${1:-}" == "--with-postgres" ]] && WITH_PG=true

[[ $EUID -eq 0 ]] || { echo "Please run with sudo:  sudo bash $0 $*"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"          # the cloned repository
BASE="$(cd "$APP_DIR/.." && pwd)"                # holds .env.production, releases/, backups/
APP_USER="${APP_USER:-$(stat -c %U "$APP_DIR")}" # whoever owns the clone (normally "ubuntu")
APP_HOME="$(getent passwd "$APP_USER" | cut -d: -f6)"
DOMAIN="${DOMAIN:-_}"
PG_MAJOR=18                                       # must be >= the Neon server version (18)

export DEBIAN_FRONTEND=noninteractive
step() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }

step "System packages"
apt-get update -y
apt-get install -y ca-certificates curl gnupg git nginx certbot python3-certbot-nginx openssl

step "Node.js 22 LTS"
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v)" != v22* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
node -v
command -v pm2 >/dev/null 2>&1 || npm install -g pm2@5

step "PostgreSQL ${PG_MAJOR} client tools (for backups and copying data)"
if [[ ! -f /etc/apt/sources.list.d/pgdg.list ]]; then
  install -d /usr/share/postgresql-common/pgdg
  curl -fsSL -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc https://www.postgresql.org/media/keys/ACCC4CF8.asc
  . /etc/os-release
  echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt ${VERSION_CODENAME}-pgdg main" \
    > /etc/apt/sources.list.d/pgdg.list
  apt-get update -y
fi
apt-get install -y "postgresql-client-${PG_MAJOR}"

step "Swap file (building the app needs about 2 GB of memory)"
if swapon --show 2>/dev/null | grep -q /swapfile; then
  echo "Swap already enabled."
elif fallocate -l 2G /swapfile 2>/dev/null && chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile 2>/dev/null; then
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "2 GB swap enabled."
else
  rm -f /swapfile
  echo "Could not enable swap here (fine on servers with 2 GB+ memory)."
fi

step "App folders in ${BASE}"
install -d -o "$APP_USER" -g "$APP_USER" "$BASE/releases" "$BASE/backups"
if [[ ! -f "$BASE/.env.production" ]]; then
  install -m 600 -o "$APP_USER" -g "$APP_USER" "$SCRIPT_DIR/env.production.example" "$BASE/.env.production"
  echo "Created $BASE/.env.production from the template - fill it in before deploying."
fi

if $WITH_PG; then
  step "PostgreSQL ${PG_MAJOR} server on this machine"
  apt-get install -y "postgresql-${PG_MAJOR}"
  systemctl enable --now postgresql 2>/dev/null || service postgresql start
  if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='a2000'" | grep -q 1; then
    echo "Database user 'a2000' already exists - keeping its password."
  else
    DB_PASS="$(openssl rand -hex 24)"
    sudo -u postgres psql -v ON_ERROR_STOP=1 -c "CREATE ROLE a2000 LOGIN PASSWORD '${DB_PASS}';"
    DB_URL="postgresql://a2000:${DB_PASS}@127.0.0.1:5432/a2000"
    if grep -q '^DATABASE_URL=' "$BASE/.env.production"; then
      sed -i "s#^DATABASE_URL=.*#DATABASE_URL=\"${DB_URL}\"#" "$BASE/.env.production"
    else
      echo "DATABASE_URL=\"${DB_URL}\"" >> "$BASE/.env.production"
    fi
    echo "Created database user 'a2000' and wrote DATABASE_URL into $BASE/.env.production"
  fi
  sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='a2000'" | grep -q 1 \
    || sudo -u postgres createdb -O a2000 a2000

  step "Nightly database backup (02:00, kept 14 days)"
  cat > /etc/cron.d/a2000-backup <<CRON
0 2 * * * ${APP_USER} /bin/bash ${SCRIPT_DIR}/backup-db.sh >> ${BASE}/backups/backup.log 2>&1
CRON
  chmod 644 /etc/cron.d/a2000-backup
fi

step "Nginx (public web server in front of the app)"
sed "s/__DOMAIN__/${DOMAIN}/" "$SCRIPT_DIR/nginx-a2000.conf" > /etc/nginx/sites-available/a2000
ln -sfn /etc/nginx/sites-available/a2000 /etc/nginx/sites-enabled/a2000
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx 2>/dev/null || service nginx restart

step "Start the app automatically after a reboot"
env PATH="$PATH:/usr/bin" pm2 startup systemd -u "$APP_USER" --hp "$APP_HOME" >/dev/null 2>&1 \
  && echo "Enabled." || echo "Skipped (systemd not available here)."

cat <<DONE

Setup complete. Next:
  1. Edit ${BASE}/.env.production   (nano ${BASE}/.env.production)
  2. Deploy:  bash ${SCRIPT_DIR}/deploy.sh      (as ${APP_USER}, not sudo)
DONE
