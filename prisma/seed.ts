/**
 * @file seed.ts
 * @description Seeds the 28-model iPhone catalog plus per-model colors and storages.
 * @dependencies dotenv, @prisma/adapter-pg, @prisma/client, iphone-catalog-sync
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { syncIphoneCatalog } from "../src/lib/iphone-catalog-sync";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

/**
 * main
 *
 * Applies the canonical catalog from `iphone-catalog-data.ts`.
 *
 * @returns Resolves when seed logging completes.
 */
async function main() {
  const result = await syncIphoneCatalog(prisma);
  console.log(
    `Seeded ${result.models} models, ${result.colors} colors, ${result.storages} storages, ${result.colorLinks} model↔color links, ${result.storageLinks} model↔storage links.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
