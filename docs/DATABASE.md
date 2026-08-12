# DATABASE.md

**Project:** TruePhone  
**Version:** 1.0  
**Last Updated:** July 2026  
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

---

# Migration Policy

- Prefer `prisma migrate` for shared / production schema changes
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

**V1 review → publish:** reviewer approve sets `status = PUBLISHED` (and `approvedAt`) in one step. Do not require a separate `APPROVED` hop before public browse. The `APPROVED` enum value remains for history tabs / reopen edge cases that may still see old rows.

Listings must not skip forward states in product workflows. Public browse only shows `PUBLISHED` (and optionally `RESERVED` with clear UI once Orders exist).

### Happy-path lifecycle (V1)

`DRAFT` → `SUBMITTED` → `PENDING_REVIEW` → `PUBLISHED` (or `REJECTED`) → later `RESERVED` / `SOLD` / `ARCHIVED`

## Condition

`FLAWLESS` | `EXCELLENT` | `GOOD` | `FAIR` | `POOR`

## NotificationType

`BUYER_RECEIVED_CONFIRM` | `BUYER_CONFIRM_REMINDER`

Settlement-critical types first (Phase 12). Additional event types can extend the enum later.

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

Catalog lookup tables for listing attributes.

**`IphoneModelColor`** joins models to their allowed colors so `/vender` only offers colors that belong to the selected model.

## Listing

Core marketplace entity. Includes pricing, IMEI hash/last4, Activation Lock flags, review metadata, and `searchVector` (Postgres `tsvector`) for V1 search.

**Public browse (Phase 7):** only `status = PUBLISHED` and `deletedAt IS NULL`. Helpers live in `src/lib/listings-marketplace.ts` (`listFeaturedListings`, `listPublishedListings`, `getPublishedListingBySlug`).

## ListingImage

Ordered images per listing (`imageType`: `gallery` | `possession`).

## DevicePossessionChallenge

One-time possession code + photo proving the seller has the physical device (Phase 5).

- Linked 1:1 to a listing
- `code` shown to seller; `photoUrl` after upload
- Required before submit for review

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
| `payoutFrozen`                                                        | Dispute / chargeback freeze                                                      |
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

| Field                    | Notes                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| `orderId`                | FK → Order                                                                               |
| `paymentId` / `payoutId` | Optional links                                                                           |
| `type`                   | `PAYMENT_APPROVED`, `HOLD_CREATED`, `FEE_SNAPSHOT`, payout/refund/dispute/confirm events |
| `amountPesos`            | Integer COP                                                                              |
| `memo` / `metadata`      | Human + structured context                                                               |

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

| Field                          | Notes                                                                                                           |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `orderId`                      | Unique FK → Order                                                                                               |
| `method`                       | `PREMIUM_BOGOTA` \| `CARRIER`                                                                                   |
| `status`                       | `METHOD_SELECTED` \| `AWAITING_PICKUP` \| `INSPECTION` \| `IN_TRANSIT` \| `DELIVERED` \| `FAILED` \| `RETURNED` |
| `carrierName` / `trackingCode` | Required for Carrier before buyer can mark received; visible to buyer                                           |
| `premiumFeeCop`                | `20000` when Premium selected; `0` for Carrier                                                                  |
| `deliveredAt`                  | Buyer receipt ack; Financial Core sets `buyerConfirmDeadlineAt` (+24h)                                          |

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

Documented for later phases (see also `docs/FINANCIAL_MODEL.md`, `docs/SHIPPING.md`):

- **AuditLog** — reviewer and admin actions
- **Dispute** — first-class dispute entity (freeze today is `Order.payoutFrozen` + Ledger)

---

# Indexes and search

- Unique constraints: `profiles.authUserId`, `listings.slug`, `listings.imeiHash`
- Listing: `@@index([status])`, `@@index([sellerId])`
- RecommendedPrice: unique `(iphoneModelId, iphoneStorageId, condition)`; indexes on `iphoneModelId`, `condition`
- Notification: unique `dedupeKey`; indexes `(userId, createdAt)`, `(userId, readAt)`, `orderId`
- Message / block / report: see **Message**, **UserBlock**, **ConversationReport** above
- Order: `(buyerId, createdAt)`, `(sellerId, createdAt)`, `listingId`, `status`; partial unique on `listingId` where `AWAITING_PAYMENT` \| `PAID`
- Payment: `reference` unique; `(orderId, createdAt)`, `(buyerId, createdAt)`, `status`, provider ids
- Webhook events: unique `(provider, externalEventKey)`
- V1 search: Prisma filters + `searchVector` maintenance (trigger or app-side update)
- Meilisearch is Phase 14; do not depend on it for MVP

---

# Soft deletes

`listings.deletedAt` marks logical deletion. Prefer soft delete for marketplace entities that need audit history.
