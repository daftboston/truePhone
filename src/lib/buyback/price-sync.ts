import { createHash } from "node:crypto";
import { JWT } from "google-auth-library";
import { prisma } from "@/lib/db";
import { parsePriceRows } from "./price-rows";
import { IPHONE_CATALOG_RETIRED_SLUGS } from "@/lib/iphone-catalog-data";

const SPREADSHEET_ID = "1ieLKp95kNdnL9GIUQBWnuK4Umdv44SxGQKvt3VJOMjc";
export async function syncBuybackPrices(importedById: string | null = null) {
  const startedAt = new Date();
  const email = process.env.BUYBACK_SHEETS_CLIENT_EMAIL;
  const key = process.env.BUYBACK_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !key) throw new Error("SHEETS_NOT_CONFIGURED");
  const client = new JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const range = encodeURIComponent("'Precios TruePhone'!A1:G500");
  const response = await client.request<{ values?: unknown[][] }>({
    url: `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?valueRenderOption=UNFORMATTED_VALUE`,
    timeout: 10_000,
    retry: false,
  });
  if (!Array.isArray(response.data.values))
    throw new Error("INVALID_SHEET_RESPONSE");
  return importBuybackPrices(response.data.values, importedById, startedAt);
}
/** Exported for isolated DB verification; never a public server action. */
export async function importBuybackPrices(
  values: unknown[][],
  importedById: string | null,
  startedAt = new Date(),
) {
  const catalog = await prisma.iphoneModelStorage.findMany({
    where: {
      iphoneModel: { slug: { notIn: [...IPHONE_CATALOG_RETIRED_SLUGS] } },
    },
    include: { iphoneModel: true, iphoneStorage: true },
  });
  const parsed = parsePriceRows(
    values,
    catalog.map((c) => ({
      iphoneModelId: c.iphoneModelId,
      iphoneStorageId: c.iphoneStorageId,
      modelName: c.iphoneModel.name,
      valueGb: c.iphoneStorage.valueGb,
    })),
  );
  const sourceHash = createHash("sha256")
    .update(JSON.stringify(values))
    .digest("hex");
  return prisma.$transaction(
    async (tx) => {
      // Serializes manual/cron imports; a late older fetch never replaces a newer import.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(82401362)`;
      const latest = await tx.buybackPriceImport.findFirst({
        orderBy: { importedAt: "desc" },
      });
      if (latest && latest.importedAt > startedAt)
        return { imported: 0, issues: parsed.issues.length, skipped: true };
      const record = await tx.buybackPriceImport.create({
        data: {
          sourceHash,
          importedById,
          validRows: parsed.rows.length,
          issues: parsed.issues,
        },
      });
      for (const row of parsed.rows) {
        await tx.buybackPrice.upsert({
          where: {
            iphoneModelId_iphoneStorageId: {
              iphoneModelId: row.iphoneModelId,
              iphoneStorageId: row.iphoneStorageId,
            },
          },
          create: { ...row, importId: record.id },
          update: {
            ...row,
            importId: record.id,
            active: true,
            syncedAt: record.importedAt,
          },
        });
      }
      for (const key of parsed.deactivate) {
        const [iphoneModelId, iphoneStorageId] = key.split(":");
        await tx.buybackPrice.updateMany({
          where: { iphoneModelId, iphoneStorageId },
          data: { active: false },
        });
      }
      return {
        imported: parsed.rows.length,
        issues: parsed.issues.length,
        skipped: false,
      };
    },
    { timeout: 20_000 },
  );
}
