/**
 * @file prisma.config.ts
 * @description Prisma CLI config: schema path and migrate connection URL.
 * @dependencies dotenv, prisma/config
 */

import { config as loadDotenv } from "dotenv";
import { defineConfig } from "prisma/config";

// Vercel injects env vars into the process. Loading a local .env there can
// blank DIRECT_URL/DATABASE_URL and fail `prisma migrate deploy`.
if (!process.env.VERCEL) {
  loadDotenv();
}

/**
 * getMigrateDatabaseUrl
 *
 * Prefers the direct/session URL (port 5432) so migrate is not stuck on
 * PgBouncer. Falls back to pooled/runtime aliases when Production only has
 * DATABASE_URL (or Vercel/Supabase POSTGRES_* integration vars).
 *
 * @returns Postgres URL for Prisma CLI migrate/push, or undefined.
 * @calledBy defineConfig datasource.url
 */
function getMigrateDatabaseUrl() {
  return (
    process.env.DIRECT_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: getMigrateDatabaseUrl(),
  },
});
