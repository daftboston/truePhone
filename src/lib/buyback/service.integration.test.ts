/** Opt-in disposable database suite. Refuses remote/non-test databases. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import pg from "pg";
const url = process.env.BUYBACK_TEST_DATABASE_URL;
if (url) {
  const parsed = new URL(url);
  if (
    !["localhost", "127.0.0.1", "::1", "[::1]"].includes(parsed.hostname) ||
    !parsed.pathname.startsWith("/buyback_test")
  )
    throw new Error("Disposable LOCAL buyback_test database required");
  process.env.DATABASE_URL = url;
  process.env.DIRECT_URL = url;
}
test(
  "buyback DB lifecycle, concurrency and privacy",
  { skip: !url },
  async (t) => {
    const { prisma } = await import("@/lib/db");
    const {
      createQuote,
      readQuote,
      submitQuote,
      requestReview,
      sendOffer,
      acceptOffer,
      cancelQuote,
    } = await import("./service");
    const { photoUrls, uploadPhoto } = await import("./photos");
    const { importBuybackPrices } = await import("./price-sync");
    const run = randomUUID();
    const [seller, other, reviewer, admin] = await Promise.all(
      (["SELLER", "BUYER", "REVIEWER", "ADMIN"] as const).map((role) =>
        prisma.profile.create({ data: { authUserId: randomUUID(), role } }),
      ),
    );
    const storage = await prisma.iphoneStorage.upsert({
      where: { valueGb: 128 },
      update: {},
      create: { valueGb: 128 },
    });
    const model = await prisma.iphoneModel.create({
      data: {
        name: `Test iPhone ${run}`,
        slug: `buyback-test-${run}`,
        productLine: "IPHONE",
        generation: Math.floor(Math.random() * 1000000000) + 1000,
        variantType: "STANDARD",
        sortOrder: 999,
      },
    });
    await prisma.iphoneModelStorage.create({
      data: { iphoneModelId: model.id, iphoneStorageId: storage.id },
    });
    const priceImport = await prisma.buybackPriceImport.create({
      data: {
        sourceHash: run,
        importedById: admin.id,
        validRows: 1,
        issues: [],
      },
    });
    await prisma.buybackPrice.create({
      data: {
        iphoneModelId: model.id,
        iphoneStorageId: storage.id,
        purchasePriceCop: 705000,
        sourceRow: 2,
        importId: priceImport.id,
      },
    });
    const input = {
      clientRequestId: randomUUID(),
      iphoneModelId: model.id,
      iphoneStorageId: storage.id,
      condition: "GOOD",
      batteryHealth: 85,
      description: "Phone used for isolated database tests",
      city: "Bogotá",
      ownershipConfirmed: true,
      activationLockOff: true,
    };
    let quote = await createQuote(seller, input);
    const at = new Date("2026-11-06T17:00:00-05:00");
    const rejected = (code: string) => (e: unknown) =>
      typeof e === "object" && e !== null && "code" in e && e.code === code;
    try {
      await t.test(
        "retry uses the same draft and rejects wrong catalog/inputs",
        async () => {
          const again = await createQuote(seller, input);
          assert.equal(again.id, quote.id);
          await assert.rejects(
            createQuote(seller, { ...input, city: "Medellín" }),
            rejected("INVALID_INPUT"),
          );
          await assert.rejects(
            createQuote(seller, {
              ...input,
              iphoneStorageId: "not-a-capacity",
            }),
            rejected("INVALID_INPUT"),
          );
        },
      );
      await t.test(
        "owner/staff reads only; no internal price or path serialization",
        async () => {
          await assert.rejects(
            readQuote(other, quote.id),
            rejected("NOT_FOUND"),
          );
          await assert.rejects(
            photoUrls(other, quote.id),
            rejected("NOT_FOUND"),
          );
          assert.equal((await readQuote(reviewer, quote.id)).id, quote.id);
          for (const forbidden of [
            "purchasePriceCop",
            "priceImportId",
            "sellerId",
            "photos",
            "objectPath",
          ])
            assert.equal(forbidden in quote, false);
        },
      );
      await t.test(
        "server requires eight guided photos and rejects stale submission",
        async () => {
          await assert.rejects(
            submitQuote(
              seller,
              { quoteId: quote.id, expectedVersion: quote.version },
              at,
            ),
            rejected("INVALID_INPUT"),
          );
          await prisma.buybackPhoto.createMany({
            data: Array.from({ length: 8 }, (_, slot) => ({
              quoteId: quote.id,
              slot,
              objectPath: `test/${run}/${slot}.jpg`,
            })),
          });
          await assert.rejects(
            submitQuote(seller, { quoteId: quote.id, expectedVersion: 99 }, at),
            rejected("QUOTE_CHANGED"),
          );
          quote = await submitQuote(
            seller,
            { quoteId: quote.id, expectedVersion: quote.version },
            at,
          );
          assert.equal(quote.status, "RANGE_READY");
          assert.deepEqual(quote.range, { minCop: 605000, maxCop: 755000 });
          const form = new FormData();
          form.set("quoteId", quote.id);
          form.set("slot", "0");
          form.set(
            "file",
            new File([new Uint8Array(20)], "test.png", { type: "image/png" }),
          );
          await assert.rejects(
            uploadPhoto(seller, form),
            rejected("INVALID_STATE"),
          );
        },
      );
      await t.test(
        "sync snapshots stay immutable; invalid rows preserve last price",
        async () => {
          const header = ["Modelo", "Capacidad", "Precio de compra (COP)"];
          await importBuybackPrices(
            [header, [model.name, "128 GB", 800000]],
            admin.id,
          );
          assert.deepEqual((await readQuote(seller, quote.id)).range, {
            minCop: 605000,
            maxCop: 755000,
          });
          await assert.rejects(
            importBuybackPrices(
              [header, [model.name, "128 GB", "bad"]],
              admin.id,
            ),
          );
          const price = await prisma.buybackPrice.findUniqueOrThrow({
            where: {
              iphoneModelId_iphoneStorageId: {
                iphoneModelId: model.id,
                iphoneStorageId: storage.id,
              },
            },
          });
          assert.equal(price.purchasePriceCop, 800000);
        },
      );
      await t.test(
        "range interest computes Friday→Monday working deadline",
        async () => {
          quote = await requestReview(
            seller,
            { quoteId: quote.id, expectedVersion: quote.version },
            at,
          );
          assert.equal(quote.reviewDueAt, "2026-11-09T15:00:00.000Z");
          const retry = await requestReview(
            seller,
            { quoteId: quote.id, expectedVersion: quote.version - 1 },
            at,
          );
          assert.equal(retry.version, quote.version);
        },
      );
      await t.test(
        "seller cannot issue offers; reviewers cannot review themselves",
        async () => {
          await assert.rejects(
            sendOffer(
              seller,
              {
                quoteId: quote.id,
                expectedVersion: quote.version,
                amountCop: 700000,
              },
              at,
            ),
            rejected("FORBIDDEN"),
          );
          const own = await createQuote(reviewer, {
            ...input,
            clientRequestId: randomUUID(),
          });
          await assert.rejects(
            sendOffer(
              reviewer,
              {
                quoteId: own.id,
                expectedVersion: own.version,
                amountCop: 700000,
              },
              at,
            ),
            rejected("FORBIDDEN"),
          );
        },
      );
      await t.test(
        "offer issue + notification are atomic; stale review cannot overwrite",
        async () => {
          const previous = quote.version;
          quote = await sendOffer(
            reviewer,
            { quoteId: quote.id, expectedVersion: previous, amountCop: 700000 },
            at,
          );
          assert.equal(quote.offer?.expiresAt, "2026-11-09T23:00:00.000Z");
          await assert.rejects(
            sendOffer(
              admin,
              {
                quoteId: quote.id,
                expectedVersion: previous,
                amountCop: 710000,
              },
              at,
            ),
            rejected("QUOTE_CHANGED"),
          );
          assert.equal(
            await prisma.notification.count({
              where: { dedupeKey: `buyback:${quote.id}:offer:1` },
            }),
            1,
          );
        },
      );
      await t.test(
        "expiry and exact offer versions are checked server-side",
        async () => {
          const offer = quote.offer!;
          await assert.rejects(
            acceptOffer(
              other,
              {
                quoteId: quote.id,
                offerId: offer.id,
                expectedOfferVersion: offer.version,
              },
              at,
            ),
            rejected("NOT_FOUND"),
          );
          await assert.rejects(
            acceptOffer(
              seller,
              {
                quoteId: quote.id,
                offerId: offer.id,
                expectedOfferVersion: 99,
              },
              at,
            ),
            rejected("OFFER_CHANGED"),
          );
          await assert.rejects(
            acceptOffer(
              seller,
              {
                quoteId: quote.id,
                offerId: offer.id,
                expectedOfferVersion: offer.version,
              },
              new Date(offer.expiresAt),
            ),
            rejected("OFFER_EXPIRED"),
          );
        },
      );
      await t.test(
        "concurrent accepts are exactly-once and do not promise pickup",
        async () => {
          const offer = quote.offer!;
          const results = await Promise.all(
            Array.from({ length: 5 }, () =>
              acceptOffer(
                seller,
                {
                  quoteId: quote.id,
                  offerId: offer.id,
                  expectedOfferVersion: offer.version,
                },
                at,
              ),
            ),
          );
          quote = results[0];
          assert.equal(quote.status, "OFFER_ACCEPTED");
          assert.equal(quote.pickupStatus, "PENDING_SCHEDULING");
          assert.equal(new Set(results.map((q) => q.version)).size, 1);
          assert.equal(
            await prisma.buybackEvent.count({
              where: { quoteId: quote.id, kind: "OFFER_ACCEPTED" },
            }),
            1,
          );
        },
      );
      await t.test(
        "revised offers invalidate old acceptance and require fresh agreement",
        async () => {
          const old = quote.offer!;
          quote = await sendOffer(
            admin,
            {
              quoteId: quote.id,
              expectedVersion: quote.version,
              amountCop: 650000,
            },
            at,
          );
          assert.equal(quote.offer?.acceptedAt, null);
          assert.equal(quote.status, "OFFER_SENT");
          await assert.rejects(
            acceptOffer(
              seller,
              {
                quoteId: quote.id,
                offerId: old.id,
                expectedOfferVersion: old.version,
              },
              at,
            ),
            rejected("OFFER_CHANGED"),
          );
          const current = quote.offer!;
          quote = await acceptOffer(
            seller,
            {
              quoteId: quote.id,
              offerId: current.id,
              expectedOfferVersion: current.version,
            },
            at,
          );
          assert.equal(quote.status, "OFFER_ACCEPTED");
        },
      );
      await t.test(
        "revision-versus-accept race never accepts a superseded offer",
        async () => {
          quote = await sendOffer(
            admin,
            {
              quoteId: quote.id,
              expectedVersion: quote.version,
              amountCop: 640000,
            },
            at,
          );
          const offer = quote.offer!;
          await Promise.allSettled([
            acceptOffer(
              seller,
              {
                quoteId: quote.id,
                offerId: offer.id,
                expectedOfferVersion: offer.version,
              },
              at,
            ),
            sendOffer(
              admin,
              {
                quoteId: quote.id,
                expectedVersion: quote.version,
                amountCop: 630000,
              },
              at,
            ),
          ]);
          quote = await readQuote(seller, quote.id);
          if (quote.status === "OFFER_ACCEPTED")
            assert.equal(quote.offer?.id, offer.id);
          else {
            assert.equal(quote.status, "OFFER_SENT");
            assert.equal(quote.offer?.acceptedAt, null);
          }
        },
      );
      await t.test(
        "purchased terminal state cannot be revised, accepted or seller-cancelled",
        async () => {
          await prisma.buybackQuote.update({
            where: { id: quote.id },
            data: { status: "PURCHASED", version: { increment: 1 } },
          });
          quote = await readQuote(seller, quote.id);
          await assert.rejects(
            sendOffer(
              admin,
              {
                quoteId: quote.id,
                expectedVersion: quote.version,
                amountCop: 620000,
              },
              at,
            ),
            rejected("INVALID_STATE"),
          );
          await assert.rejects(
            cancelQuote(seller, {
              quoteId: quote.id,
              expectedVersion: quote.version,
            }),
            rejected("INVALID_STATE"),
          );
          await assert.rejects(
            acceptOffer(
              seller,
              {
                quoteId: quote.id,
                offerId: quote.offer!.id,
                expectedOfferVersion: quote.offer!.version,
              },
              at,
            ),
            rejected("INVALID_STATE"),
          );
        },
      );
      await t.test(
        "missing sheet model/price enters manual review",
        async () => {
          await prisma.buybackPrice.updateMany({
            where: { iphoneModelId: model.id },
            data: { active: false },
          });
          const manual = await createQuote(seller, {
            ...input,
            clientRequestId: randomUUID(),
          });
          await prisma.buybackPhoto.createMany({
            data: Array.from({ length: 8 }, (_, slot) => ({
              quoteId: manual.id,
              slot,
              objectPath: `test/${run}/manual/${slot}.jpg`,
            })),
          });
          const submitted = await submitQuote(
            seller,
            { quoteId: manual.id, expectedVersion: manual.version },
            at,
          );
          assert.equal(submitted.manualReview, true);
          assert.equal(submitted.range, null);
          assert.equal(submitted.status, "REVIEW_REQUESTED");
        },
      );
      await t.test(
        "all six tables enforce RLS even if SELECT is accidentally granted",
        async () => {
          const client = new pg.Client({ connectionString: url });
          await client.connect();
          const tables = [
            "buyback_price_imports",
            "buyback_prices",
            "buyback_quotes",
            "buyback_photos",
            "buyback_offers",
            "buyback_events",
          ];
          try {
            const result = await client.query(
              "SELECT relname, relrowsecurity FROM pg_class WHERE relname = ANY($1)",
              [tables],
            );
            assert.equal(result.rows.length, 6);
            assert.equal(
              result.rows.every((r) => r.relrowsecurity),
              true,
            );
            for (const role of ["anon", "authenticated"]) {
              await client.query("BEGIN");
              for (const table of tables)
                await client.query(`GRANT SELECT ON ${table} TO ${role}`);
              await client.query(`SET LOCAL ROLE ${role}`);
              for (const table of tables)
                assert.equal(
                  (await client.query(`SELECT * FROM ${table}`)).rowCount,
                  0,
                );
              await client.query("ROLLBACK");
            }
            await assert.rejects(
              client.query(
                'UPDATE buyback_photos SET slot = 99 WHERE "quoteId" = $1',
                [quote.id],
              ),
            );
          } finally {
            await client.query("ROLLBACK");
            await client.end();
          }
        },
      );
    } finally {
      // This suite refuses non-local/non-test DBs above. Clean only its own fixtures.
      const ids = (
        await prisma.buybackQuote.findMany({
          where: { iphoneModelId: model.id },
          select: { id: true },
        })
      ).map((q) => q.id);
      await prisma.notification.deleteMany({ where: { userId: seller.id } });
      await prisma.buybackEvent.deleteMany({ where: { quoteId: { in: ids } } });
      await prisma.buybackOffer.deleteMany({ where: { quoteId: { in: ids } } });
      await prisma.buybackPhoto.deleteMany({ where: { quoteId: { in: ids } } });
      await prisma.buybackQuote.deleteMany({ where: { id: { in: ids } } });
      await prisma.buybackPrice.deleteMany({
        where: { iphoneModelId: model.id },
      });
      await prisma.buybackPriceImport.deleteMany({
        where: { importedById: admin.id },
      });
      await prisma.iphoneModelStorage.deleteMany({
        where: { iphoneModelId: model.id },
      });
      await prisma.iphoneModel.delete({ where: { id: model.id } });
      await prisma.profile.deleteMany({
        where: { id: { in: [seller.id, other.id, reviewer.id, admin.id] } },
      });
      await prisma.$disconnect();
    }
  },
);
