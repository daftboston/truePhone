# DATABASE.md

**Project:** TruePhone  
**Version:** 1.0  
**Last Updated:** September 2026  
**Source of schema:** `prisma/schema.prisma`

---

# Purpose

This document describes the TruePhone data model, listing lifecycle, and migration policy.

When schema and this doc disagree, update both in the same change.

---

# Stack

- PostgreSQL on **Supabase**
- **Prisma** ORM (`prisma/` + `prisma.config.ts`)
- Runtime URL: `DATABASE_URL` (pooler)
- Migrate / push URL: `DIRECT_URL` (direct)
- `prisma.config.ts` prefers `DIRECT_URL`, then `POSTGRES_URL_NON_POOLING`, then `DATABASE_URL` / `POSTGRES_*` so Vercel Production still migrates if only the pooled URL is set

---

# Migration Policy

- Prefer `prisma migrate` for shared / production schema changes
- Vercel `npm run build` runs `prisma migrate deploy` via `prisma.config.ts` so preview/production stay in sync
- Put `DATABASE_URL` and `DIRECT_URL` on **Production**, not Preview-only — Preview-only secrets make `main` deploys fail while PR previews succeed
- `prisma db push` is acceptable for early local prototyping only
- Always run `prisma generate` after schema changes
- Never commit `.env`

---

# Enums

## UserRole

`BUYER` | `SELLER` | `REVIEWER` | `ADMIN`

Guests are unauthenticated users (no enum value).

## ListingStatus (canonical)

| Status           | Meaning                                                            |
| ---------------- | ------------------------------------------------------------------ |
| `DRAFT`          | Seller editing; not submitted                                      |
| `SUBMITTED`      | Seller submitted; briefly before queue pickup                      |
| `PENDING_REVIEW` | In reviewer queue (claimed when a reviewer opens it)               |
| `APPROVED`       | Legacy / reopen-compat only — **not used as a publish gate in V1** |
| `PUBLISHED`      | Public marketplace listing (what approve writes today)             |
| `RESERVED`       | Held by an active order (Phase 9)                                  |
| `SOLD`           | Sale completed (Phase 9+)                                          |
| `REJECTED`       | Review failed (may return to draft after edits)                    |
| `ARCHIVED`       | Soft-retired from active marketplace                               |

**Seller hub (Anuncios activos / Archivados):** Active shows `DRAFT`, `SUBMITTED`, `PENDING_REVIEW`, `APPROVED`, `PUBLISHED`, `REJECTED`, and `RESERVED`. Archivados shows `ARCHIVED` and `SOLD`. Soft-deleted drafts (`deletedAt` set) are hidden from both.

**Seller archive vs system archive:** A seller may archive only a `PUBLISHED` listing (`status = ARCHIVED`, `deletedAt` stays null). Relist restores `PUBLISHED` immediately when no related order ever reached payment (`PAID` / `COMPLETED` or `fundsHeldAt` set). That blocks relist after seller-abandon cancellation or chargeback. Unpaid checkout cancels do not block relist. Draft discard still sets `deletedAt` and is not listed under Archivados.

**V1 review → publish:** reviewer approve sets `status = PUBLISHED` (and `approvedAt`) in one step. Do not require a separate `APPROVED` hop before public browse. The `APPROVED` enum value remains for history tabs / reopen edge cases that may still see old rows.

Listings must not skip forward states in product workflows. Public browse only shows `PUBLISHED` (and optionally `RESERVED` with clear UI once Orders exist).

### Happy-path lifecycle (V1)

`DRAFT` → `SUBMITTED` → `PENDING_REVIEW` → `PUBLISHED` (or `REJECTED`) → later `RESERVED` / `SOLD` / `ARCHIVED`

## Condition

`FLAWLESS` | `EXCELLENT` | `GOOD` | `FAIR` | `POOR`

## IphoneProductLine

`IPHONE` | `IPHONE_SE` | `IPHONE_AIR`

## IphoneVariantType

`STANDARD` | `MINI` | `PLUS` | `PRO` | `PRO_MAX` | `E` | `AIR`

## NotificationType

Settlement, marketplace, order-support, and listing Q&A events. Phase 8b additions:

`LISTING_QUESTION_NEW` | `LISTING_QUESTION_ANSWERED`

## OrderSupportCaseType

`SELLER_CANCELLATION` | `FULFILLMENT_EXCEPTION` | `GENERAL_SUPPORT`

## OrderSupportCaseStatus

`PENDING` | `IN_REVIEW` | `NEEDS_SELLER_RESPONSE` | `ESCALATED` | `APPROVED` | `REJECTED` | `RESOLVED` | `WITHDRAWN`

Terminal states are `APPROVED`, `REJECTED`, `RESOLVED`, and `WITHDRAWN`. An approved seller-cancellation case is private operations evidence; it is never a public profile counter or buyer review.

---

# Models (current)

## Profile

Seller/buyer identity linked to Supabase Auth via `authUserId`.

Notable fields: role, city, ratings, `isTrustedSeller`, `verifikStatus` (identity verification).

`verifikStatus` values: `not_submitted` | `draft` | `pending` | `verified` | `rejected`.

## IdentityVerification

Cédula + selfie submission for seller identity (Phase 4).

- Stores image URLs in Supabase Storage (`identity-docs`)
- Stores only `documentNumberLast4` + SHA-256 hash (never full cédula in plain text)
- Status: `DRAFT` → `PENDING` → `VERIFIED` | `REJECTED` (optional `IN_REVIEW`)
- Provider default: `manual` (human review); future Verifik/API can set `provider`

## IphoneModel / IphoneColor / IphoneStorage

Catalog lookup tables for listing attributes. The catalog is **product-line first**, not “generation → variant” for every iPhone.

**`IphoneProductLine`:** `IPHONE` | `IPHONE_SE` | `IPHONE_AIR`

Numbered models (12–17, including `e` variants), the SE line, and iPhone Air are independent lines. SE must never be stored as an iPhone 13/14 variant. Air must never be stored as an iPhone 17 variant.

**`IphoneModel` fields:**

| Field         | Meaning                                                              |
| ------------- | -------------------------------------------------------------------- |
| `productLine` | Independent commercial line                                          |
| `generation`  | Generation **within that line** (SE 2/3, numbered 12–17, Air 1)      |
| `variantType` | `STANDARD` \| `MINI` \| `PLUS` \| `PRO` \| `PRO_MAX` \| `E` \| `AIR` |
| `releaseYear` | Commercial introduction year                                         |
| `sortOrder`   | Stable catalog order (1 = oldest in the 2020+ set)                   |

Unique on `(productLine, generation, variantType)`. Canonical 28 models from 2020 onward live in `src/lib/iphone-catalog-data.ts`. Apply them with `npm run db:seed` (local / first provision). Browse and sell also backfill missing slugs via `ensureIphoneCatalog` so `/explorar` does not stay on the original 13-model seed. Production `npm run build` migrates only — it does not seed.

Explorar product shots (front/back hover flip) are static files in `public/catalog/` named `{slug}-front.webp` and `{slug}-back.webp`. See `public/catalog/README.md`. Seller listing photos stay in the Supabase `listing-images` bucket.

**`IphoneModelColor`** joins models to their allowed colors so `/vender` only offers colors that belong to the selected model.

**`IphoneModelStorage`** joins models to their allowed capacities (GB) the same way. Listings and recommended prices must use a storage that exists for that model.

## Listing

Core marketplace entity. Includes pricing, IMEI hash/last4, Activation Lock flags, review metadata, and `searchVector` (Postgres `tsvector`) for V1 search. `carrier` is set only when `unlocked = false` and must be a Colombian operator (`Claro`, `Movistar`, `Tigo`, `WOM`, `ETB`).

**Public browse (Phase 7):** only `status = PUBLISHED` and `deletedAt IS NULL`. Helpers live in `src/lib/listings-marketplace.ts` (`listFeaturedListings`, `listPublishedListings`, `getPublishedListingBySlug`).

`Listing.views` is a denormalized unique-visitor-day count from `ListingViewEvent` (Phase **15**). It is **ops-only** — never shown on public profiles or order party cards. Seller private “views per listing” remains Phase **24**.

## ListingViewEvent

Durable listing view log (`listing_view_events`). One row per visitor per listing per UTC day.

| Field       | Notes                                                     |
| ----------- | --------------------------------------------------------- |
| `listingId` | FK → `Listing` (cascade)                                  |
| `viewerId`  | Optional FK → `Profile`; null for guests                  |
| `dedupeKey` | `u:{profileId}` or `h:{sha256 prefix}` of IP + User-Agent |
| `viewedOn`  | UTC date; unique with `(listingId, dedupeKey)`            |
| `createdAt` | First recorded instant for that day                       |

Seller self-views and crawler/preview User-Agents are skipped. Recorded from `/anuncios/[slug]` via `recordListingView`. Ops dashboard: `/revision/analitica`.

## ListingImage

Ordered images per listing (`imageType`: `gallery` | `possession`). Gallery `displayOrder` **0–7** maps 1:1 to the eight guided slots (Frente → IMEI). Deleting a guided photo leaves a gap so other angles do not shift. Indexes **8–11** are optional extras.

## DevicePossessionChallenge

One-time possession code + photo proving the seller has the physical device (Phase 5).

- Linked 1:1 to a listing
- `code` shown to seller; `photoUrl` after upload
- Required before submit for review

## ListingQuestion / ListingQuestionAnswer / ListingQuestionReport

Public listing Q&A (Phase **8b**). Separate from private `Message` threads.

**ListingQuestion** (`listing_questions`)

| Field                     | Notes                                    |
| ------------------------- | ---------------------------------------- |
| `listingId`               | FK → `Listing` (cascade)                 |
| `askerId`                 | FK → `Profile` (`ListingQuestionsAsked`) |
| `body`                    | Plain text question                      |
| `hiddenAt` / `hiddenById` | Soft-hide after staff moderation         |
| `createdAt` / `updatedAt` | Timestamps                               |

**ListingQuestionAnswer** (`listing_question_answers`)

| Field                     | Notes                                               |
| ------------------------- | --------------------------------------------------- |
| `questionId`              | Unique FK → `ListingQuestion` (one official answer) |
| `sellerId`                | Listing owner                                       |
| `body`                    | Plain text answer                                   |
| `hiddenAt` / `hiddenById` | Soft-hide after staff moderation                    |

**ListingQuestionReport** (`listing_question_reports`)

Report a question **or** an answer (`questionId` XOR `answerId`, enforced in SQL). Staff hide or dismiss (`resolvedAt` / `resolvedById`). Queue: `/revision/preguntas`.

**Rules:**

- Guests may read visible threads; asking requires a signed-in profile who is not the seller
- Ask only while listing `PUBLISHED`; seller may answer while `PUBLISHED` or `RESERVED`
- Hidden questions (and their answers) are omitted from public listing pages
- Do not store Q&A in `messages`

**Indexes:** `(listingId, createdAt)`, `askerId`; unique `questionId` on answers; report indexes on `questionId`, `answerId`, `reporterId`, `resolvedAt`.

## Message

Buyer ↔ seller (and seller ↔ reviewer) thread scoped to a **listing**. There is no separate `Conversation` table in V1 — a thread is inferred from `(listingId, senderId, receiverId)`.

| Field        | Notes                                        |
| ------------ | -------------------------------------------- |
| `listingId`  | FK → `Listing`                               |
| `senderId`   | FK → `Profile` (`SentMessages`)              |
| `receiverId` | FK → `Profile` (`ReceivedMessages`)          |
| `content`    | Plain text                                   |
| `isRead`     | Default `false`; mark read when thread opens |
| `createdAt`  | Default `now()`                              |

Table: `messages`.

**Indexes:**

- `(receiverId, isRead)` — unread inbox
- `(listingId, createdAt)` — thread order
- `(senderId, listingId)` — participant lookups

## UserBlock

One-way block between profiles (`blockerId`, `blockedId`). Unique pair. Used to stop messaging between users.

## ConversationReport

Report a listing-scoped conversation for moderation (`reporterId`, `listingId`, `reason`).

## Review

Order-tied ratings between buyer and seller after a **completed** sale (Phase 11).

| Field                           | Notes                                        |
| ------------------------------- | -------------------------------------------- |
| `orderId`                       | Required FK → `Order`                        |
| `reviewerId` / `reviewedUserId` | FK → Profile (must be the two order parties) |
| `rating`                        | Integer 1–5                                  |
| `comment`                       | Optional written feedback                    |
| `hiddenAt` / `hiddenById`       | Soft-hide after staff moderation             |

**Rules:**

- Only when order `status = COMPLETED`
- At most one review per `(orderId, reviewerId)`
- On create: recompute reviewed user’s `sellerRating` (avg of visible ratings) and `totalReviews`
- Trust score: `isTrustedSeller` when `totalReviews ≥ 3` and `sellerRating ≥ 4.5`
- Hidden reviews are excluded from averages and public lists

## ReviewReport

Report an abusive marketplace review (`reviewId`, `reporterId`, `reason`). Staff resolve via hide or dismiss (`resolvedAt` / `resolvedById`). Queue: `/revision/resenas`.

## Order

Purchase / reserve / payment lifecycle (Phases 9–10b).

| Field                                                                 | Notes                                                                            |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `listingId`                                                           | FK → Listing                                                                     |
| `buyerId` / `sellerId`                                                | FK → Profile                                                                     |
| `status`                                                              | `AWAITING_PAYMENT` \| `PAID` (hold) \| `CANCELLED` \| `COMPLETED` (after payout) |
| `equipmentPrice` / `platformFee` / `totalPrice`                       | Snapshots at reserve (COP pesos)                                                 |
| `feeRateBps`                                                          | 1000 = 10%, 800 = loyalty 8%                                                     |
| `wompiCollectionPesos` / `wompiPayoutPesos` / `truephoneRevenuePesos` | Fee-pool cost snapshots                                                          |
| `sellerAmountPesos` / `premiumShippingFeePesos` / `sellerFeePesos`    | Seller-side snapshots (`sellerFeePesos` = 0 in MVP)                              |
| `fundsHeldAt` / `payoutAuthorizedAt` / `payoutCompletedAt`            | Financial Core settlement                                                        |
| `buyerConfirmedAt` / `buyerConfirmDeadlineAt`                         | Confirm or 24h auto-release after buyer marks received                           |
| `payoutFrozen`                                                        | Dispute / chargeback freeze; ops queue at `/revision/disputas`                   |
| `sellerFulfillmentAbandonedAt`                                        | Seller cancel / no-ship after pay                                                |
| `cancelReason` / `cancelledAt` / `cancelledById`                      | Set on cancel                                                                    |
| `paidAt`                                                              | Set when Compra Garantizada payment succeeds                                     |
| `completedAt`                                                         | Set only after Financial Core `PayoutCompleted`                                  |

**Rules:**

- Create order only from `PUBLISHED` listing → listing becomes `RESERVED`, order `AWAITING_PAYMENT`
- Buyer pays snapshotted `totalPrice` (equipment + marketplace fee; **10%** default or one-time **8%** loyalty)
- Webhook (or mock confirm) → payment approved / order `PAID` + Ledger hold (**seller not paid**)
- **Canonical completion (LOCKED):** buyer marks received → buyer confirm **or** 24h → Financial Core payout → then `COMPLETED` / listing `SOLD`
- **Forbidden:** seller marks complete on `PAID` alone (legacy `completeOrder` retired)
- Cancel rules per Financial Model (buyer vs seller after pay)
- Partial unique index: at most one active (`AWAITING_PAYMENT` \| `PAID`) order per listing

Table: `orders`.

## OrderSupportCase / OrderSupportMessage

Seller-created support workflow for a paid order. This domain is separate from listing-scoped `Message`, because staff need workflow state, assignment, internal notes, and durable decision evidence.

| Field                       | Notes                                                                    |
| --------------------------- | ------------------------------------------------------------------------ |
| `orderId` / `sellerId`      | The affected order and its seller; both are re-checked on every mutation |
| `type`                      | Cancellation, fulfillment exception, or general support                  |
| `status`                    | Queue lifecycle from `PENDING` to a terminal decision                    |
| `initialReason`             | Required seller explanation                                              |
| `assignedStaffId`           | REVIEWER/ADMIN currently responsible                                     |
| `decisionNote`              | Required staff rationale for terminal decisions                          |
| `reviewedAt` / `resolvedAt` | First review and terminal timestamps                                     |

Messages belong to one case and one sender. `isInternal = true` is visible only to REVIEWER/ADMIN and is never included in the seller transcript.

Active seller-cancellation cases are unique per order through a partial unique database index. Resolved history remains available for audit. Queue indexes cover status/time, type/status/time, order/status, and assignee/status.

Table: `order_support_cases`, `order_support_messages`.

## Payment

Compra Garantizada checkout (Phase 10). Buyer is charged `amount` = order `totalPrice` (includes snapshotted marketplace fee).

| Field                                                      | Notes                                                                                  |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `orderId` / `buyerId`                                      | FKs                                                                                    |
| `provider`                                                 | `WOMPI` \| `MOCK`                                                                      |
| `status`                                                   | `PENDING` \| `REQUIRES_ACTION` \| `SUCCEEDED` \| `FAILED` \| `REFUNDED` \| `CANCELLED` |
| `amount` / `equipmentPrice` / `platformFee`                | COP pesos snapshots                                                                    |
| `reference`                                                | Unique merchant reference                                                              |
| `providerCheckoutId` / `providerPaymentId` / `checkoutUrl` | Provider ids + redirect URL                                                            |
| `paidAt` / `refundedAt` / `refundAmount`                   | Settlement timestamps                                                                  |

Table: `payments`.

## PaymentWebhookEvent

Idempotent store of provider webhook deliveries (`provider` + `externalEventKey` unique). Payload JSON; links to `paymentId` when matched.

Table: `payment_webhook_events`.

## LedgerEntry

Append-only money facts (Phase 10b). Financial Core is the only writer.

| Field                    | Notes                                                                                                       |
| ------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `orderId`                | FK → Order                                                                                                  |
| `paymentId` / `payoutId` | Optional links                                                                                              |
| `type`                   | `PAYMENT_APPROVED`, `HOLD_CREATED`, `FEE_SNAPSHOT`, payout/refund/`CHARGEBACK_*`/`DISPUTE_*`/confirm events |
| `amountPesos`            | Integer COP                                                                                                 |
| `memo` / `metadata`      | Human + structured context                                                                                  |

Table: `ledger_entries`.

## Payout

Seller bank dispersion from Wompi Cuenta (Phase 10b). Provider: `MOCK` (local auto-complete), `MANUAL` (ops pays in Wompi dashboard after authorize — **MVP**), or `WOMPI` (API stub until Phase 24).

Table: `payouts`.

## SellerBankAccount

Payout destination PII (MVP bank only: legal id, bank, AHORROS/CORRIENTE, account number).

Table: `seller_bank_accounts`.

## FeeEntitlement

Single-use **8%** marketplace fee after seller cancel / no-ship (`sourceOrderId`). Buyer may choose refund instead (`status = REFUNDED`).

Table: `fee_entitlements`.

## Shipment

Device fulfillment (Phase 10c). One shipment per paid order. Shipping never authorizes payouts/refunds.

| Field                          | Notes                                                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `orderId`                      | Unique FK → Order                                                                                                              |
| `method`                       | `PREMIUM_BOGOTA` \| `CARRIER`                                                                                                  |
| `status`                       | `METHOD_SELECTED` \| `AWAITING_PICKUP` \| `INSPECTION` \| `IN_TRANSIT` \| `DELIVERED` \| `CANCELLED` \| `FAILED` \| `RETURNED` |
| `carrierName` / `trackingCode` | Required for Carrier before buyer can mark received; visible to buyer                                                          |
| `premiumFeeCop`                | `20000` when Premium selected; `0` for Carrier                                                                                 |
| `deliveredAt`                  | Buyer receipt ack; Financial Core sets `buyerConfirmDeadlineAt` (+24h)                                                         |

Table: `shipments`.

## ShipmentInspection

Premium Bogotá checklist (IMEI, serial, storage, color, accessories, battery %, notes). `PASSED` → may deliver; `FAILED` → device not accepted, payout frozen for refund ops.

Table: `shipment_inspections`.

## Favorite

Unique `(userId, listingId)` favorites.

## RecommendedPrice

Admin-maintained seller pricing guide (Phase 13). Unique on `(iphoneModelId, iphoneStorageId, condition)`.

| Field                           | Meaning                                              |
| ------------------------------- | ---------------------------------------------------- |
| `priceCop`                      | Reference sale price (integer COP pesos)             |
| `minPriceCop` / `maxPriceCop`   | Optional guidance band                               |
| `notes`                         | Internal admin notes                                 |
| `effectiveFrom` / `effectiveTo` | Optional validity window; lookup skips inactive rows |

Does **not** force listing price — guidance only. Seller-facing display: `/vender` device step (`SellerPriceGuide`).

Table: `recommended_prices`.

## Notification

In-app activity rows (Phase 12). Idempotent via unique `dedupeKey` (e.g. `buyer-received:{orderId}`, `buyer-confirm-reminder:{orderId}`).

| Field            | Notes                                     |
| ---------------- | ----------------------------------------- |
| `userId`         | FK → Profile (recipient)                  |
| `type`           | `NotificationType`                        |
| `title` / `body` | Spanish UX copy                           |
| `href`           | Relative path (e.g. `/compras/{orderId}`) |
| `orderId`        | Optional FK → Order                       |
| `readAt`         | Null = unread for badges                  |
| `emailSentAt`    | Set after successful email delivery       |
| `dedupeKey`      | Unique; cron / retry safe                 |

Table: `notifications`.

## NotificationPreference

Per-user channel flags (`emailEnabled`, `emailOrderUpdates`, `inAppEnabled`). Defaults = all on when no row exists.

Table: `notification_preferences`.

---

# Planned schema (not yet in Prisma)

Documented for later phases (see also `docs/FINANCIAL_MODEL.md`, `docs/SHIPPING.md`, `docs/plan.md`):

- **AuditLog** — reviewer and admin actions
- **Dispute** — first-class dispute entity (MVP freeze is `Order.payoutFrozen` + Ledger; ops UI at `/revision/disputas`)

---

# Indexes and search

- Unique constraints: `profiles.authUserId`, `listings.slug`, `listings.imeiHash`
- Listing: `@@index([status])`, `@@index([sellerId])`, `@@index([views])`
- ListingViewEvent: unique `(listingId, dedupeKey, viewedOn)`; indexes `(listingId, createdAt)`, `createdAt`, `viewerId`
- RecommendedPrice: unique `(iphoneModelId, iphoneStorageId, condition)`; indexes on `iphoneModelId`, `condition`
- Notification: unique `dedupeKey`; indexes `(userId, createdAt)`, `(userId, readAt)`, `orderId`
- Message / block / report: see **Message**, **UserBlock**, **ConversationReport** above
- Order: `(buyerId, createdAt)`, `(sellerId, createdAt)`, `listingId`, `status`; partial unique on `listingId` where `AWAITING_PAYMENT` \| `PAID`
- Order support: queue/status/order/assignee indexes; partial unique active seller cancellation per order
- Payment: `reference` unique; `(orderId, createdAt)`, `(buyerId, createdAt)`, `status`, provider ids
- Webhook events: unique `(provider, externalEventKey)`
- V1 search: Prisma filters + `searchVector` maintenance (trigger or app-side update)
- Meilisearch is Phase 14; do not depend on it for MVP

---

# Soft deletes

`listings.deletedAt` marks logical deletion. Prefer soft delete for marketplace entities that need audit history.
