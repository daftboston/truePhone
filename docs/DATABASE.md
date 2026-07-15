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

| Status           | Meaning                                          |
| ---------------- | ------------------------------------------------ |
| `DRAFT`          | Seller editing; not submitted                    |
| `SUBMITTED`      | Seller submitted; awaiting queue pickup          |
| `PENDING_REVIEW` | In reviewer queue                                |
| `APPROVED`       | Passed review; not yet public (or internal gate) |
| `PUBLISHED`      | Public marketplace listing                       |
| `RESERVED`       | Held by an active order                          |
| `SOLD`           | Sale completed                                   |
| `REJECTED`       | Review failed (may return to draft after edits)  |
| `ARCHIVED`       | Soft-retired from active marketplace             |

Listings must not skip states. Public browse only shows `PUBLISHED` (and optionally `RESERVED` with clear UI).

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

## Listing

Core marketplace entity. Includes pricing, IMEI hash/last4, Activation Lock flags, review metadata, and `searchVector` (Postgres `tsvector`) for V1 search.

## ListingImage

Ordered images per listing (`imageType`: `gallery` | `possession`).

## DevicePossessionChallenge

One-time possession code + photo proving the seller has the physical device (Phase 5).

- Linked 1:1 to a listing
- `code` shown to seller; `photoUrl` after upload
- Required before submit for review

## Message

Buyer ↔ seller thread scoped to a listing.

## Review

Ratings between users. `orderId` is reserved for a future `Order` model (not implemented yet).

## Favorite

Unique `(userId, listingId)` favorites.

---

# Planned schema (not yet in Prisma)

Documented for Phase 9+; implement when those phases start:

- **Order** — purchase lifecycle; wire `Review.orderId`
- **Payment** / webhook event tables
- **AuditLog** — reviewer and admin actions

---

# Indexes and search

- Unique constraints: `profiles.authUserId`, `listings.slug`, `listings.imeiHash`
- V1 search: Prisma filters + `searchVector` maintenance (trigger or app-side update)
- Meilisearch is Phase 14; do not depend on it for MVP

---

# Soft deletes

`listings.deletedAt` marks logical deletion. Prefer soft delete for marketplace entities that need audit history.
