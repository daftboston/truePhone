# Seller listing check-ins + silent Destacados boost (F2)

**Status:** Implemented (draft PR)  
**Audience:** Sellers (email + in-app)

## Check-in milestones

| Day    | Trigger                                       | Channel        | Copy theme                                          |
| ------ | --------------------------------------------- | -------------- | --------------------------------------------------- |
| **7**  | `publishedAt` + 7d, still `PUBLISHED`, unsold | Email + in-app | Unique views (`Listing.views`) + tip + listing link |
| **14** | +14d, still unsold                            | Email + in-app | Review price + edit CTA (suggestion, not threat)    |
| **21** | —                                             | —              | **Deferred** (not v1)                               |

### Rules

- One notice per listing per milestone (`dedupeKey`: `listing-checkin-day7:{id}`, `listing-checkin-day14:{id}`).
- Respect `NotificationPreference`.
- Daily cron **America/Bogotá** (`0 14 * * *` UTC ≈ 09:00 Bogotá).
- Skip if not sellable at send time (`PUBLISHED` only; not `RESERVED`/`SOLD`/`ARCHIVED`/deleted).
- **No catch-up spam** if a day was missed — only send when `publishedAt` date matches exact milestone window for that cron run.
- Views: existing `Listing.views`; empty copy «aún sin vistas».

## Silent Destacados boost

After a **qualifying price drop** on a published unsold listing:

- Threshold: **≥ 3%** **or** minimum **50_000 COP** drop vs `priceAtPublish` baseline.
- Set `boostUntil = now + 7 days`.
- Home **Destacados** rail only in v1 (`listFeaturedListings` sorts boosted first).
- **Never disclosed** to seller; no «baja el precio para Destacados» copy.
- Re-drop during active `boostUntil`: **ignored** until boost ends.
- After qualifying drop: re-baseline `priceAtPublish`.

Optional seller-help one-liner (generic): visibility may adjust by quality/price signals.

## Schema

| Field            | Set when                                             |
| ---------------- | ---------------------------------------------------- |
| `publishedAt`    | `status → PUBLISHED` (legacy backfill: `approvedAt`) |
| `priceAtPublish` | Same moment                                          |
| `boostUntil`     | Qualifying price drop                                |

## Engineering

| Area          | Location                                                                       |
| ------------- | ------------------------------------------------------------------------------ |
| Cron          | `src/app/api/cron/settlement-reminders/route.ts` (daily batch; Hobby ≤2 crons) |
| Processor     | `src/lib/notifications/seller-listing-checkins.ts`                             |
| Boost helper  | `src/lib/listings/boost.ts`                                                    |
| Featured sort | `src/lib/listings-marketplace.ts` → `listFeaturedListings`                     |
