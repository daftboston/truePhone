# Multi-platform availability hold (F3)

**Status:** Implemented (draft PR)  
**Audience:** Sellers (wizard), buyers (listing + buy path), ops (audit via `AvailabilityHoldEvent`)  
**Legal:** Lawyer copy in T&C, FAQ, wizard modal — bump `LEGAL_LAST_UPDATED` in same PR.

## Problem

Sellers may list the same iPhone on Facebook, Mercado Libre, or elsewhere. Buyers on TruePhone need protection from paying for a device that was already sold off-platform.

## Product rules

### Sell wizard

- Boolean `alsoListedElsewhere` (yes/no), persisted draft → publish.
- Selecting **yes** requires a mandatory modal (Spanish Lawyer copy) with a non–pre-checked checkbox before save.
- On publish (when flag is set): in-app reminder (+ optional email) to pause/archive if sold elsewhere.

### Public listing

- Badge: **«También en otros sitios»**
- Support line: factual, protective — confirms availability before charging.

### Buy path (flagged listings only)

1. Buyer taps Comprar → `AvailabilityHold` **PENDING** (no Wompi, no Financial Core hold).
2. Buyer UI: «Esperando confirmación del vendedor» + server-driven countdown (`expiresAt`, 2h).
3. Seller: email + in-app to confirm still available.
4. Seller **sí** → **CONFIRMED**; checkout unlocked for **that `buyerId` + `holdId`** only; `unlockExpiresAt` ≈ 30m; then normal `RESERVED` + `AWAITING_PAYMENT` + Wompi.
5. Seller **no** → **DENIED**; listing **ARCHIVED**; buyer «no disponible» + CTA Explorar (not retracto).
6. Timeout 2h → **EXPIRED** (lazy on `requestAvailabilityHold` when `expiresAt` passes; daily cron is a backup sweep); buyer released; listing stays **PUBLISHED**.
7. Late sí after EXPIRED → reject **LATE_CONFIRM** (event only).
8. Timeout vs confirm race → one winner; other no-ops (transactional updates).
9. Second buyer → blocked while another hold is **PENDING**, or while a **CONFIRMED** unlock window is open for a different buyer (no second Wompi).
10. Non-flagged listings: unchanged direct checkout.
11. **Hard server gate:** no Wompi session / Payment Link until hold **CONFIRMED** and linked order belongs to hold buyer.
12. Mistaken charge → full refund, no Wompi fee on buyer (existing refund policy).
13. Compra Garantizada / retracto only after `PaymentApproved`.
14. Recidivism sanctions (2–3 timeouts/no) — **out of v1**.

## Schema

| Model / field                 | Purpose                                                                            |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| `Listing.alsoListedElsewhere` | Seller disclosure                                                                  |
| `AvailabilityHold`            | `listingId`, `buyerId`, `status`, `expiresAt`, `unlockExpiresAt?`, `orderId?`      |
| `AvailabilityHoldEvent`       | Append-only audit (`WARNING_ACK`, transitions, `LATE_CONFIRM`, `paymentAttemptId`) |

**Uniqueness (enforced in service + DB indexes):**

- At most one **PENDING** hold per listing.
- At most one **PENDING** hold per buyer (globally).

## Engineering

| Area                 | Location                                                           |
| -------------------- | ------------------------------------------------------------------ |
| Hold service         | `src/lib/availability-hold/service.ts`                             |
| Buyer/seller actions | `src/features/availability-hold/actions/`                          |
| Wompi gate           | `src/lib/payments.ts` → `startCheckoutForOrder`                    |
| Order create gate    | `src/lib/orders.ts` → `createOrderAndReserveListing`               |
| Wizard UI            | `src/features/listings/components/also-listed-elsewhere-field.tsx` |
| Waiting UI           | `src/app/(account)/compras/disponibilidad/[holdId]/page.tsx`       |
| Expiry backstop      | `src/app/api/cron/settlement-reminders/route.ts` (daily batch)     |
| Notifications        | `src/lib/notifications/availability-hold.ts`                       |

## Cron & Vercel Hobby

**Primary expiry is lazy** on read (`getHoldByIdForParticipant`, `getBuyerHoldForListing`), confirm/deny, buy (`requestAvailabilityHold`, `createOrderAndReserveListing`), and checkout (`startCheckoutForOrder`). When `expiresAt` or `unlockExpiresAt` has passed, the hold transitions to **EXPIRED** before gates run — the 2h buyer countdown matches server state without waiting for cron.

**Vercel Hobby** allows at most **two cron entries**, each **once per day** (no hourly/minutely). `vercel.json` keeps the existing pair:

| Schedule      | Route                            | Also runs                                                               |
| ------------- | -------------------------------- | ----------------------------------------------------------------------- |
| `0 16 * * *`  | `/api/cron/buyer-confirm-expiry` | Financial Core 24h auto-release                                         |
| `30 16 * * *` | `/api/cron/settlement-reminders` | Settlement reminders + **hold expiry backstop** + seller check-ins (F2) |

The daily hold backstop expires any stale holds missed by lazy paths and sends buyer notifications. **Vercel Pro** would allow additional or hourly cron routes if ops wants a tighter sweep later.

## Tests

- Hold state machine + Wompi gate unit tests in `src/lib/availability-hold/`.
- Role / gate tests ensure no checkout URL without **CONFIRMED** hold on flagged listings.
