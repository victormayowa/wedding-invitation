#!/usr/bin/env bash
# Runs on the server during each deployment, called by .github/workflows/deploy.yml
# after it has copied compose.yml and deploy.env to /opt/wedding.
set -euo pipefail
cd /opt/wedding

if ! command -v docker >/dev/null 2>&1; then
  echo "Installing Docker (first deployment only)"
  curl -fsSL https://get.docker.com | sh
fi
docker compose version >/dev/null

# Settings from the workflow become .env. Without an external DATABASE_URL, a Postgres
# container runs alongside the site, with a password generated once and kept on this server.
umask 077
cp deploy.env .env.next
if ! grep -q '^DATABASE_URL=' .env.next; then
  if [ ! -s .db-password ]; then
    head -c 48 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 32 > .db-password
  fi
  DB_PASSWORD="$(cat .db-password)"
  {
    echo "COMPOSE_PROFILES='bundled-db'"
    echo "POSTGRES_PASSWORD='${DB_PASSWORD}'"
    echo "DATABASE_URL='postgres://wedding:${DB_PASSWORD}@db:5432/wedding'"
  } >> .env.next
fi
mv .env.next .env
rm -f deploy.env

docker compose pull --quiet
docker compose up -d --remove-orphans --wait --wait-timeout 180
docker image prune -f >/dev/null
docker compose ps
