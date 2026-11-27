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
profiles=()
if ! grep -q '^DATABASE_URL=' .env.next; then
  if [ ! -s .db-password ]; then
    head -c 48 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 32 > .db-password
  fi
  DB_PASSWORD="$(cat .db-password)"
  profiles+=(bundled-db)
  {
    echo "POSTGRES_PASSWORD='${DB_PASSWORD}'"
    echo "DATABASE_URL='postgres://wedding:${DB_PASSWORD}@db:5432/wedding'"
  } >> .env.next
fi
# PROXY=caddy: this stack answers on ports 80/443 itself. Otherwise the server's own web
# server forwards DOMAIN to 127.0.0.1:APP_PORT (deploy/nginx.conf), and nothing here
# touches ports 80/443.
if grep -q "^PROXY='caddy'" .env.next; then profiles+=(caddy); fi
echo "COMPOSE_PROFILES='$(IFS=,; echo "${profiles[*]}")'" >> .env.next
mv .env.next .env
rm -f deploy.env

docker compose pull --quiet
docker compose up -d --remove-orphans --wait --wait-timeout 180

# Remove older builds of this site's image only: the server may be shared with other projects.
current="$(sed -n "s/^IMAGE='\(.*\)'$/\1/p" .env)"
docker images "${current%:*}" --format '{{.Repository}}:{{.Tag}}' \
  | grep -v -x -e "$current" -e "${current%:*}:latest" \
  | xargs -r docker rmi >/dev/null 2>&1 || true
docker compose ps
