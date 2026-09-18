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
11. **Hard server gate:** no Wompi session / Payment Link until hold **CONFIRMED** and linked order belongs to hold buyer (`assertCheckoutAllowedForFlaggedListing` before `provider.createCheckout`, including when reusing a stale checkout URL).
12. **Webhook re-check:** on Wompi `APPROVED`, `markPaymentSucceeded` re-validates the hold; if missing or `unlockExpiresAt` passed, order stays **AWAITING_PAYMENT**, payment is fully refunded (mistaken capture), and a `PAYMENT_ATTEMPT` audit row is appended when a hold row exists.
13. Mistaken charge → full refund, no Wompi fee on buyer (existing refund policy).
14. Compra Garantizada / retracto only after `PaymentApproved`.
15. Recidivism sanctions (2–3 timeouts/no) — **out of v1**.

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

| Area                 | Location                                                                |
| -------------------- | ----------------------------------------------------------------------- |
| Hold service         | `src/lib/availability-hold/service.ts`                                  |
| Buyer/seller actions | `src/features/availability-hold/actions/`                               |
| Wompi gate           | `src/lib/payments.ts` → `startCheckoutForOrder`, `markPaymentSucceeded` |
| Order create gate    | `src/lib/orders.ts` → `createOrderAndReserveListing`                    |
| Wizard UI            | `src/features/listings/components/also-listed-elsewhere-field.tsx`      |
| Waiting UI           | `src/app/(account)/compras/disponibilidad/[holdId]/page.tsx`            |
| Expiry backstop      | `src/app/api/cron/tick` (daily batch) + lazy paths on read/buy/checkout |
| Notifications        | `src/lib/notifications/availability-hold.ts`                            |

## Cron & Vercel Hobby

**Primary expiry is lazy** on read (`getHoldByIdForParticipant`, `getBuyerHoldForListing`), confirm/deny, buy (`requestAvailabilityHold`, `createOrderAndReserveListing`), and checkout (`startCheckoutForOrder`). When `expiresAt` or `unlockExpiresAt` has passed, the hold transitions to **EXPIRED** before gates run — the 2h buyer countdown matches server state without waiting for cron.

**Vercel Hobby** allows at most **two cron entries**, each **once per day** (sub-daily schedules such as `0 * * * *` fail deploy). This PR uses **one** daily dispatcher:

| Schedule     | Route            | Behavior (daily batch)                                                                           |
| ------------ | ---------------- | ------------------------------------------------------------------------------------------------ |
| `0 14 * * *` | `/api/cron/tick` | Hold expiry backstop + seller check-ins (F2) + buyer-confirm auto-release + settlement reminders |

**Lazy expiry remains primary** for the 2h hold window; the daily tick is a backstop sweep only.

Dispatcher: `src/lib/cron/tick.ts`. Manual dry-runs: `/api/cron/tick`, `/api/cron/buyer-confirm-expiry`, `/api/cron/settlement-reminders` with `CRON_SECRET`.

## Tests

- Hold state machine + Wompi gate unit tests in `src/lib/availability-hold/checkout-gate.test.ts`.
- Checkout gate blocks without **CONFIRMED** unlock, when unlock expired, and payment-success path refunds mistaken capture instead of leaving order **PAID**.
