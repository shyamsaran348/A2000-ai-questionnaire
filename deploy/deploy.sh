#!/usr/bin/env bash
#
# Build the latest code and (re)start the app with zero manual steps.
# Run as the normal user (not sudo):   bash ~/a2000/app/deploy/deploy.sh
#
# Each deploy goes into its own folder under releases/; "current" points at the live one.
# To roll back:  bash deploy/deploy.sh --rollback

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BASE="$(cd "$APP_DIR/.." && pwd)"
ENV_FILE="$BASE/.env.production"
PORT="${PORT:-3000}"
step() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }

[[ $EUID -ne 0 ]] || { echo "Run this as your normal user, without sudo."; exit 1; }
[[ -f "$ENV_FILE" ]] || { echo "Missing $ENV_FILE - run setup-server.sh first, then fill it in."; exit 1; }
grep -qE '^DATABASE_URL=.+' "$ENV_FILE" || { echo "DATABASE_URL is empty in $ENV_FILE"; exit 1; }

restart_and_check() {
  APP_ENV_FILE="$ENV_FILE" pm2 startOrReload "$SCRIPT_DIR/ecosystem.config.cjs" --update-env
  pm2 save >/dev/null
  for _ in $(seq 1 40); do
    if curl -fsS -o /dev/null "http://127.0.0.1:${PORT}/"; then
      echo "App is running: $(readlink "$BASE/current")"
      return 0
    fi
    sleep 1
  done
  echo "The app did not respond. See the logs with:  pm2 logs a2000 --lines 100"
  return 1
}

if [[ "${1:-}" == "--rollback" ]]; then
  PREV="$(ls -1dt "$BASE"/releases/*/ | sed -n 2p)"
  [[ -n "$PREV" ]] || { echo "No previous release to roll back to."; exit 1; }
  step "Rolling back to ${PREV}"
  ln -sfn "${PREV%/}" "$BASE/current"
  restart_and_check
  exit $?
fi

cd "$APP_DIR"
if [[ "${SKIP_PULL:-0}" != 1 ]] && git rev-parse --git-dir >/dev/null 2>&1; then
  step "Getting the latest code"
  git pull --ff-only
fi

step "Installing packages"
npm ci --no-audit --no-fund

step "Building"
# NEXT_PUBLIC_* settings are baked in at build time, so the build needs the env file too.
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a
NODE_OPTIONS="--max-old-space-size=1536" npm run build

step "Preparing the release"
REL="$BASE/releases/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$REL/.next"
cp -R .next/standalone/. "$REL/"
cp -R .next/static "$REL/.next/static"
cp -R public "$REL/public"
ln -sfn "$REL" "$BASE/current"

step "Starting"
restart_and_check

# Keep the three newest releases for rollback.
ls -1dt "$BASE"/releases/*/ | tail -n +4 | xargs -r rm -rf
