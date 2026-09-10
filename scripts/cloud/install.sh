#!/usr/bin/env bash
#
# Cloud Agent `install` phase for TruePhone.
#
# Idempotent repository bootstrap that runs after the source is checked out:
#   - installs Node dependencies and generates the Prisma client;
#   - provisions a local PostgreSQL role + database;
#   - writes a local .env with dev defaults when one is absent;
#   - applies Prisma migrations and seeds the iPhone catalog.
#
# Safe to run repeatedly and against a warm snapshot: every step checks for or
# converges to the desired state instead of assuming a clean machine.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

DB_USER="user"
DB_PASSWORD="pass"
DB_NAME="truephone"

# Detect the installed PostgreSQL major version (e.g. "16").
PG_VERSION="$(ls /usr/lib/postgresql 2>/dev/null | sort -n | tail -1 || true)"
if [ -z "${PG_VERSION}" ]; then
  echo "PostgreSQL is not installed in the base image." >&2
  exit 1
fi

# Bring the cluster online so migrations and seeding can connect. Ignore the
# error emitted when it is already running.
sudo pg_ctlcluster "${PG_VERSION}" main start 2>/dev/null || true

# Wait until Postgres accepts connections.
for _ in $(seq 1 30); do
  if pg_isready -h 127.0.0.1 -p 5432 >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

# Create the login role if it does not already exist.
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1; then
  sudo -u postgres psql -c "CREATE ROLE \"${DB_USER}\" LOGIN PASSWORD '${DB_PASSWORD}';"
fi

# Create the database owned by that role if it does not already exist.
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
  sudo -u postgres createdb -O "${DB_USER}" "${DB_NAME}"
fi

# Write local dev environment variables when none are present. These are
# non-secret local defaults: a local Postgres and placeholder Supabase keys so
# the app boots. Genuine Supabase keys can be supplied as secrets for
# authenticated flows.
if [ ! -f .env ]; then
  cat > .env <<'EOF'
DATABASE_URL="postgresql://user:pass@127.0.0.1:5432/truephone"
DIRECT_URL="postgresql://user:pass@127.0.0.1:5432/truephone"
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=public-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
EOF
fi

# Install dependencies from the lockfile and generate the Prisma client.
npm ci

# Apply migrations and seed the canonical catalog (both idempotent).
npx prisma migrate deploy
npm run db:seed

echo "TruePhone install complete."
