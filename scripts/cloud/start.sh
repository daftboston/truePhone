#!/usr/bin/env bash
#
# Cloud Agent `start` phase for TruePhone.
#
# Per-boot reconciliation: brings the local PostgreSQL cluster online so the
# Prisma-backed app can connect. Runs on every boot and tolerates an
# already-running cluster.
set -euo pipefail

PG_VERSION="$(ls /usr/lib/postgresql 2>/dev/null | sort -n | tail -1 || true)"
if [ -z "${PG_VERSION}" ]; then
  echo "PostgreSQL is not installed in the base image." >&2
  exit 1
fi

# Start the cluster; ignore the "already running" error on warm boots.
sudo pg_ctlcluster "${PG_VERSION}" main start 2>/dev/null || true

# Confirm readiness before returning so downstream services can rely on it.
for _ in $(seq 1 30); do
  if pg_isready -h 127.0.0.1 -p 5432 >/dev/null 2>&1; then
    echo "PostgreSQL is ready on 127.0.0.1:5432."
    exit 0
  fi
  sleep 1
done

echo "PostgreSQL did not become ready in time." >&2
exit 1
