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

Purchase / reserve / payment lifecycle (Phases 9–10).

| Field                                            | Notes                                                      |
| ------------------------------------------------ | ---------------------------------------------------------- |
| `listingId`                                      | FK → Listing                                               |
| `buyerId` / `sellerId`                           | FK → Profile                                               |
| `status`                                         | `AWAITING_PAYMENT` \| `PAID` \| `CANCELLED` \| `COMPLETED` |
| `equipmentPrice` / `platformFee` / `totalPrice`  | Snapshots at reserve (COP pesos)                           |
| `cancelReason` / `cancelledAt` / `cancelledById` | Set on cancel                                              |
| `paidAt`                                         | Set when Compra Garantizada payment succeeds               |
| `completedAt`                                    | Set when seller marks complete after `PAID`                |

**Rules:**

- Create order only from `PUBLISHED` listing → listing becomes `RESERVED`, order `AWAITING_PAYMENT`
- Buyer pays snapshotted `totalPrice` (equipment + 6% protection) via Payment / Wompi (or mock)
- Webhook (or mock confirm) → order `PAID`
- Cancel `AWAITING_PAYMENT` or `PAID` → listing returns to `PUBLISHED` (paid cancels attempt refund)
- Complete `PAID` (seller) → listing `SOLD`, seller `totalSales++`
- Partial unique index: at most one active (`AWAITING_PAYMENT` \| `PAID`) order per listing

Table: `orders`.

## Payment

Compra Garantizada checkout (Phase 10). Buyer is charged `amount` = order `totalPrice` (includes snapshotted 6% fee).

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

## Favorite

Unique `(userId, listingId)` favorites.

---

# Planned schema (not yet in Prisma)

Documented for later phases:

- **AuditLog** — reviewer and admin actions

---

# Indexes and search

- Unique constraints: `profiles.authUserId`, `listings.slug`, `listings.imeiHash`
- Listing: `@@index([status])`, `@@index([sellerId])`
- Message / block / report: see **Message**, **UserBlock**, **ConversationReport** above
- Order: `(buyerId, createdAt)`, `(sellerId, createdAt)`, `listingId`, `status`; partial unique on `listingId` where `AWAITING_PAYMENT` \| `PAID`
- Payment: `reference` unique; `(orderId, createdAt)`, `(buyerId, createdAt)`, `status`, provider ids
- Webhook events: unique `(provider, externalEventKey)`
- V1 search: Prisma filters + `searchVector` maintenance (trigger or app-side update)
- Meilisearch is Phase 14; do not depend on it for MVP

---

# Soft deletes

`listings.deletedAt` marks logical deletion. Prefer soft delete for marketplace entities that need audit history.
