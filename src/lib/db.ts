import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { getDatabaseUrl } from "@/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: getDatabaseUrl() });
  return new PrismaClient({ adapter });
}

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
