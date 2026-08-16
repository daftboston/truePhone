/**
 * @file db.ts
 * @description Prisma client singleton with HMR-safe proxy for Next.js dev.
 * @dependencies @prisma/adapter-pg, @prisma/client, @/lib/env
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { getDatabaseUrl } from "@/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * createPrismaClient
 *
 * Builds a PrismaClient using the Postgres driver adapter.
 *
 * @returns A new PrismaClient instance.
 */
function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: getDatabaseUrl() });
  return new PrismaClient({ adapter });
}

/**
 * isStaleClient
 *
 * Detects HMR singletons missing newly generated Prisma models.
 *
 * @param client - Existing PrismaClient from globalThis.
 * @returns True when expected model delegates are missing.
 */
function isStaleClient(client: PrismaClient) {
  const delegate = client as {
    iphoneModel?: unknown;
    iphoneModelColor?: unknown;
  };

  // After `prisma generate`, HMR can keep an old singleton missing new models.
  return (
    typeof delegate.iphoneModel === "undefined" ||
    typeof delegate.iphoneModelColor === "undefined"
  );
}

/**
 * getClient
 *
 * Returns a cached Prisma client or creates a fresh one when stale/missing.
 *
 * @returns Live PrismaClient.
 */
function getClient() {
  const existing = globalForPrisma.prisma;
  if (existing && !isStaleClient(existing)) {
    return existing;
  }

  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

/**
 * prisma
 *
 * Lazy Proxy that resolves the Prisma client on each property access.
 * Avoids importing a stale singleton across Next.js HMR boundaries.
 *
 * @consumers Server actions, lib data helpers, financial-core
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    const client = getClient();
    const value = Reflect.get(client, property, receiver);

    if (typeof value === "function") {
      return value.bind(client);
    }

    return value;
  },
});
