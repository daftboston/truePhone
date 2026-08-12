# FINANCIAL_MODEL.md

**Project:** TruePhone  
**Version:** 0.5  
**Status:** Draft (settlement, shipping, 24h report window after buyer marks received, Premium fail, chargebacks locked)  
**Last Updated:** July 2026

> Source of truth for how money moves in TruePhone.  
> Business rules belong to TruePhone. Wompi is an infrastructure dependency only.  
> Related: `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/plan.md`, `docs/SHIPPING.md`

---

# 1. Purpose

This document defines the **TruePhone Financial Model**: fees, hold/payout lifecycle, cancel/dispute money rules, ledger philosophy, and how Wompi is used for **collection** and **dispersion**.

TruePhone is a **C2C marketplace** for used iPhones. It never **owns inventory for resale**. It acts as a trusted intermediary.

Depending on shipping method (`docs/SHIPPING.md`), TruePhone may take **temporary custody** for inspection (**Premium Bogotá** only in MVP). That is logistics trust — not TruePhone buying or reselling the device.

The **Financial Core** is the only authority that may authorize payouts, refunds, and financial state changes.

---

# 2. Monetization (buyer-facing)

## 2.1 All-in buyer fee (growth phase)

While TruePhone grows, the **buyer assumes all marketplace fees**.

Default checkout fee:

```text
Buyer Total = Sale Price × (1 + 0.10)
```

The **10%** is the only buyer-facing **marketplace** fee. It must be shown clearly before checkout.

Separate from the 10%:

- **TruePhone Premium shipping** (Bogotá): **$20,000 COP** paid by the **seller** (deducted from payout) — see `docs/SHIPPING.md`.
- **Carrier shipping:** seller pays Servientrega / Envía / other directly (not through TruePhone checkout).

That 10% **includes**:

1. Wompi collection fee (checkout)
2. Wompi dispersion fee (pay seller from Wompi Cuenta)
3. TruePhone marketplace margin (the remainder)

### Loyalty fee after seller cancel / no-ship

If the **seller cancels after payment** or does not send the phone: do **not** auto-refund. Buyer chooses **one-time 8%** on a replacement purchase (help find another phone) **or** a **refund**. See §5.2.

## 2.2 Seller receipt (happy path)

```text
Seller Amount (target) = Sale Price − PremiumShippingFee
```

- Default (Carrier): `PremiumShippingFee = 0` → seller receives full **Sale Price** `S`.
- Premium Bogotá: `PremiumShippingFee = 20_000` COP → seller receives `S − 20_000`.
- If a Bogotá seller switches **Premium → Carrier** before inspection commitment, clear the fee (`PremiumShippingFee = 0`), recalc seller/Wompi snapshots, and append a reversing ledger note — see `docs/SHIPPING.md` §2 method switch.

Seller still does **not** receive the buyer’s 10% fee pool. Funds release only when Financial Core authorizes payout after the canonical flow.

## 2.3 Fee split (cost of money)

| Cost                               | Rate                                       | Notes                                      |
| ---------------------------------- | ------------------------------------------ | ------------------------------------------ |
| Wompi **transaction** (collection) | **2.75% + IVA**                            | On **buyer charge amount** (`Buyer Total`) |
| Wompi **payout** (dispersion)      | **0.45% + IVA**                            | On **amount dispersed to the seller**      |
| TruePhone                          | **Remainder of the buyer marketplace fee** | After both Wompi costs (with IVA)          |

### IVA policy (locked)

- TruePhone does **not** add IVA on top of the 10% (or 8% loyalty) marketplace fee shown to the buyer.
- The only IVA TruePhone models in the Ledger for payment processing is the **IVA Wompi charges** on its service fees (assume **19%** unless the contract says otherwise).

```text
WompiCostWithIva = BaseFee × (1 + 0.19)
```

### Formulas

Let:

- `S` = Sale Price (COP pesos, integer)
- `r` = fee rate (`0.10` default, `0.08` loyalty when applicable)
- `B` = Buyer Total = `round(S × (1 + r))` — **rounding: half-up to integer pesos**
- `F` = Fee pool = `B − S`

```text
WompiCollectionBase = B × 0.0275
WompiCollection     = WompiCollectionBase × 1.19

WompiPayoutBase     = SellerAmount × 0.0045
WompiPayout         = WompiPayoutBase × 1.19

TruePhoneRevenue    = F − WompiCollection − WompiPayout
```

Happy path (Carrier): `SellerAmount = S`.  
Premium Bogotá: `SellerAmount = S − 20_000`. Wompi payout % applies to `SellerAmount` dispersed.

All Ledger amounts are **integer COP pesos**. Provider payloads use **cents** only at the adapter boundary. Never use floating point for money.

### Worked example (10%, Carrier)

| Line                                        | COP         |
| ------------------------------------------- | ----------- |
| Sale Price `S`                              | 2,000,000   |
| Buyer Total `B`                             | 2,200,000   |
| Fee pool `F`                                | 200,000     |
| Wompi collection (2.75% of `B` + IVA)       | 71,995      |
| Wompi payout (0.45% of seller amount + IVA) | 10,710      |
| **TruePhone revenue (from fee pool)**       | **117,295** |
| Seller receives                             | 2,000,000   |

### Worked example (10%, Premium Bogotá)

Buyer side unchanged. Seller side:

| Line                                | COP                           |
| ----------------------------------- | ----------------------------- |
| Sale Price `S`                      | 2,000,000                     |
| Premium shipping fee (seller)       | 20,000                        |
| Amount dispersed to seller          | 1,980,000                     |
| TruePhone Premium logistics revenue | 20,000 (separate Ledger line) |

### Display vs Ledger

| Audience     | What they see                                                                                                          |
| ------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Buyer        | Sale price + **10%** marketplace fee; **24h confirm policy** (after buyer marks received); how shipping/tracking works |
| Seller       | Expected net (`S` or `S − 20_000` if Premium); carrier costs they pay outside the platform                             |
| Ops / Ledger | Fee pool split, Premium fee, holds, refunds, chargebacks, failed payouts                                               |

Do **not** expose Wompi’s internal % to buyers unless legal/support requires it.

---

## 2.4 Fee strategy (MVP vs future)

### Is 10% high or low?

For a **trust-first used iPhone C2C** marketplace in Colombia, **10% buyer-side is in a reasonable band**, not extreme:

- It must cover Wompi collection (~2.75%+IVA on `B`), payout (~0.45%+IVA on `S`), chargebacks, disputes, review ops, and shipping program overhead.
- After Wompi costs, TruePhone keeps roughly **~5–6 points** of the sale price on a clean deal (see worked example) — workable, not fat.
- Compared to informal Facebook/OLX (0% fee, high scam risk), 10% is the **price of safety**. Buyers who care about trust will pay; pure price shoppers will not — that is intentional positioning.
- Compared to some global authenticated marketplaces (often higher effective take via seller fees + buyer fees + shipping), 10% buyer-only is **moderate**, especially while sellers still receive **100% of `S`**.

### Can you charge more?

**Yes, later — carefully.** Raising buyer fee (e.g. 12%) is easier on margin than on conversion. Prefer:

1. Keep **10%** for MVP to learn conversion and dispute rates.
2. Add **paid shipping upgrades** (Premium Bogotá **$20,000** to seller) rather than inflating the base % first.
3. Raise base % only with clear proof (low refund rate, strong brand, waitlist demand).

Do **not** jump to a high % before hold + payout + shipping trust is real in the product; otherwise the fee feels like a tax without protection.

### Future seller fee (e.g. 2%)

**Allowed as a post-MVP monetization option**, not MVP. Distinct from Premium shipping ($20,000), which is a **logistics** fee already in MVP.

| Phase                 | Buyer fee                                                                      | Seller marketplace fee | Premium Bogotá       | Seller receives (Carrier)             |
| --------------------- | ------------------------------------------------------------------------------ | ---------------------- | -------------------- | ------------------------------------- |
| **MVP (locked)**      | 10% (or **one-time 8%** only on a replacement buy after seller cancel/no-ship) | **0%**                 | optional **$20,000** | Full `S` (or `S − 20_000` if Premium) |
| **Future (optional)** | may stay 10% or adjust                                                         | e.g. **2%** of `S`     | as product allows    | `S − sellerFee − premiumIfAny`        |

Guidance if you introduce ~2% seller fee later:

- Position as **platform access / payout fee**, not a surprise at payout. Show it when listing/pricing.
- Keep seller acquisition story honest: early growth = **0% seller**; later = small cut once GMV and trust are proven.
- Prefer charging sellers who are **power / pro** first, not casual one-phone sellers.
- Never let a seller fee bypass the canonical hold → confirm → payout order.
- Financial Core must snapshot seller fee at order time like the buyer fee.

MVP implementation must **not** deduct a seller fee. Ledger may reserve a future `sellerFee` line item as `0`.

---

# 3. Domain principles

| Module             | Owns                                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| Marketplace        | Listings, orders (commercial state), buyer/seller UX, confirmation                                        |
| Shipping           | Method (Premium Bogotá / Carrier), tracking upload, inspection, delivery signals — see `docs/SHIPPING.md` |
| Notifications      | Email / in-app messages                                                                                   |
| **Financial Core** | Holds, freezes, ledger, payouts, refunds, fee calculation                                                 |

Rules:

- Money never moves directly from buyer to seller.
- Marketplace / Shipping **must not** call Wompi payout/refund APIs directly.
- Only the Financial Core authorizes financial mutations.
- Wompi is replaceable via provider adapters.

---

# 4. Canonical settlement flow (LOCKED)

This is the **only** happy-path settlement model for TruePhone. Implement it; do not invent alternatives.

```text
Buyer pays
    → TruePhone holds (Financial Core; funds via Wompi Cuenta — seller NOT paid)
    → Device ships (Shipping module; docs/SHIPPING.md)
    → Buyer marks “Ya recibí el iPhone”
    → Buyer confirms device matches listing
         OR 24 hours pass with no response (auto-release)
    → TruePhone pays the seller (Pagos a Terceros → bank)
    → Order completed
```

Same flow in one line:

> **Buyer pays → TruePhone holds → buyer marks received → buyer confirms (or 24h) → then TruePhone pays the seller.**

### What “completed” means

An order is financially and commercially **completed** only after:

1. `PaymentApproved` (hold active), and
2. Buyer marked received (`deliveredAt` + `buyerConfirmDeadlineAt`), and
3. `BuyerConfirmed` **or** `BuyerConfirmExpired` (24h), and
4. no active dispute freeze, and
5. `PayoutCompleted` (seller bank credited via Wompi Cuenta).

Reviews and “venta exitosa” counters must wait for this definition of completed (or an explicit ops exception recorded in the Ledger).

### Legacy flow — MUST DIE

The previous product behavior is **forbidden** as settlement:

- ❌ Seller clicks “Completar pedido” / `completeOrder` while status is merely `PAID`
- ❌ Treating seller action as “money done” or “sale done”
- ❌ Seller or ops “mark delivered” as the start of the confirm clock
- ❌ Marking listing `SOLD` / unlocking reviews **before** payout (or before confirm/24h + payout authorization rules)

Sellers may still perform **shipping** actions (choose Premium/Carrier, upload tracking, cooperate with pickup). Those are Shipping events — **not** Financial Core settlement.

Until Phase 10d removes seller-driven completion from the app, treat any remaining UI as **legacy technical debt**, not the product rule.

Dispute / battery branch: see §5.3–5.4.

Refunds are **never automatic from UI alone**. Flows may _request_ refunds; Financial Core authorizes and records them in the Ledger.

---

# 5. Locked MVP business policies

## 5.0 Settlement authority

Only the Financial Core may authorize payout after the canonical flow in §4. Marketplace and Shipping never pay the seller.

## 5.1 After buyer marks received — 24 hours to report a problem (LOCKED)

**Only the buyer** starts the confirm clock via **Ya recibí el iPhone** on the order page. Seller/ops do **not** start this window (Carrier tracking upload and Premium inspection/hand-off are logistics only).

Clock starts when the buyer marks the order received (`Shipment.deliveredAt` = buyer receipt ack; `Order.buyerConfirmDeadlineAt = now + 24h`).

During those **24 hours** the buyer should use/check the phone and, on the order page:

1. **Confirm it matches** the listing → Financial Core may authorize payout (or wait until window ends — product may pay on confirm immediately; either way silence at 24h pays seller).
2. **Report a problem** (device does not match / defect / battery policy, etc.) → payout is **frozen** until dispute resolution.
3. **Do nothing for 24 hours** → TruePhone **pays the seller** (auto-release).

Framing for UX copy: the buyer has **24 hours after they mark that they received the phone** to notify that something is wrong. If they do not notify, we assume it is OK and pay the seller.

### Mandatory disclosure

**At purchase** (checkout + order confirmation) **and again when the buyer marks received**:

- Once you mark that you received the phone, you have **24 hours** to check it and report if it is not correct (on the order page).
- If you do not report a problem within 24 hours, TruePhone will **pay the seller**.
- Battery ≤1% drop is not grounds for a problem report (T&Cs).
- Tracking code is visible when the seller ships by carrier.

UX ownership: Phase **10d** (purchase + order UI) + Phase **12** (push/email reminders). Product rule lives here.

## 5.2 Cancels after payment

| Who cancels | After `PaymentApproved`                              | Money outcome                                                                                                                                                                                                                         |
| ----------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Buyer**   | Yes                                                  | Buyer **absorbs Wompi collection fees**. Refund = `B − WompiCollection` (integer pesos). TruePhone does not refund the processing cost Wompi already took. Listing returns to marketplace per order rules.                            |
| **Seller**  | Yes (or seller does not ship / abandons fulfillment) | **Do not auto-refund immediately.** Offer the buyer a **choice**: (A) **stay on TruePhone** — help find another phone with a **one-time 8%** marketplace fee on that replacement purchase, **or** (B) **full refund**. Buyer decides. |

Seller cancel / no-ship after payment is a trust failure. Retention path (8%) is preferred in UX copy, but **refund must always remain available**.

### Loyalty 8% — what it means (mechanics) (LOCKED)

Triggered only when the **seller cancels after payment** or **fails to send** the phone (fulfillment abandoned).

1. TruePhone does **not** force an immediate refund.
2. Buyer is offered:
   - **Option A — Continue shopping:** help find another listing; that **one** replacement checkout uses **8%** marketplace fee instead of 10%.
   - **Option B — Refund:** full refund of eligible amounts (per Financial Core / cancel rules).
3. The **8% applies only to that one replacement purchase** tied to this failed order — **not** to later purchases, and not forever. After that one buy (or if they choose refund and never use it), normal fee is **10%** again.
4. If they choose A but never complete a replacement purchase within an ops-defined window, entitlement expires and they can still request refund (product default: keep refund available until entitlement used or buyer explicitly closes the case).

Implement as a single-use `FeeEntitlement` linked to the failed `orderId` (see DATABASE planned schema).

**Shipping fees on cancel:**

- **Premium $20,000:** do not deduct if pickup never happened; if already picked up / in TruePhone custody, ops + Ledger decide (default: fee earned / non-refundable to seller).
- **Carrier:** seller’s payment to Servientrega/Envía is outside TruePhone; not refunded by TruePhone.

## 5.2b Premium inspection fail (LOCKED)

If TruePhone Premium pickup inspection **fails** vs the listing (before accepting the device):

1. **Do not take** the device from the seller.
2. **Full refund to the buyer** of eligible amounts (`B` / order total per Financial Core rules).
3. Listing outcome (ops):
   - **Unpublish / eliminate** the listing, **or**
   - **Correct the listing description** and return to review if the mismatch was fixable.
4. Prefer catching issues earlier in the **listing verification / review** pipeline so Premium fails are rare.

Ledger: `RefundApproved` + reason `PREMIUM_INSPECTION_FAILED`.

## 5.3 Battery health tolerance

During the buying / shipping process, battery health may drop slightly.

| Observed drop vs listing | Policy                                                                                                                                             |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **≤ 1 percentage point** | **Not** grounds for refund or dispute win. Advise buyers in copy/T&Cs.                                                                             |
| **> 1 percentage point** | Buyer may claim. TruePhone offers: **(A) return device → full refund** of eligible amounts, or **(B) keep the device → no refund** (accept as-is). |

Inspection on **Premium Bogotá** should record battery reading at handoff when possible to reduce he-said-she-said.

## 5.4 Chargebacks & failed payouts (TruePhone absorbs)

| Event                                                     | Who absorbs                                | Financial Core behavior                                                                                                                                                         |
| --------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Card chargeback** / payment dispute from buyer’s bank   | **TruePhone** via **Wompi Cuenta** balance | Freeze related payout if not yet paid; Ledger `CHARGEBACK_*`; loss hits Cuenta / TruePhone cash; if seller already paid, TruePhone still absorbed the chargeback against Cuenta |
| **Failed seller payout** (bad account, bank reject, etc.) | **TruePhone** operationally owns fixing it | Retry with corrected destination; seller unpaid until `PayoutCompleted`; Ledger records failed attempts                                                                         |

Credit-card collection is intentional for MVP growth; chargeback risk is accepted as a business cost funded from **Wompi Cuenta**. Keep enough Cuenta balance for obligations + chargeback buffer.

Sandbox: use Wompi **modo de pruebas** for all integration tests before production keys.

## 5.5 Payout destination (MVP)

**MVP: bank account only** (Pagos a Terceros classic bank fields).

- Seller must save: `legalIdType`, `legalId`, bank, `AHORROS`/`CORRIENTE`, account number, name, email.
- Dispersion origin: **Wompi Cuenta** (`accountId` from Wompi accounts API), funded by online collections.
- **BRE-B: post-MVP** (keep adapter design open; do not build UX yet).

Rationale: simpler ops; pairs with card checkout and Wompi Cuenta dispersion.

## 5.6 Buyer payment methods (MVP)

Accept methods Wompi Checkout supports that matter for growth, especially **credit cards**. PSE/Nequi/etc. may be enabled as Wompi allows. Financial Core must remain method-agnostic at the domain layer.

---

# 6. Wompi as infrastructure (two products)

Two distinct surfaces: different keys, base URLs, webhooks.

## 6.1 Product A — Receive payments (Checkout)

**Role:** Charge buyer `Buyer Total` (marketplace fee only; Premium is seller-side).

| Concern               | Approach                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| APIs                  | Sandbox / production `wompi.co/v1`                                                             |
| Keys                  | `pub_*` / `prv_*` + integrity + events secrets                                                 |
| MVP integration       | Widget / Web Checkout / Payment Links (current codebase path OK until Financial Core refactor) |
| Amounts               | Cents at adapter boundary                                                                      |
| Webhooks              | `transaction.updated`, checksum verified, idempotent                                           |
| Meaning of `APPROVED` | TruePhone received funds toward Wompi Cuenta settlement — **seller not paid**                  |

## 6.2 Product B — Pagos a Terceros (dispersion)

**Role:** Pay seller from **Wompi Cuenta** after Financial Core authorization.

| Concern           | Approach                                                                                                                                     |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth              | `x-api-key` + `user-principal-id` (API path)                                                                                                 |
| API               | `https://api.payouts.wompi.co/v1` (bank lotes); v2 when BRE-B arrives                                                                        |
| Origin            | **Wompi Cuenta** only for MVP dispersion                                                                                                     |
| **MVP ops mode**  | **Manual in Wompi dashboard** after TruePhone shows `PAYOUT_AUTHORIZED` + seller bank details — human supervision before money leaves Cuenta |
| **Phase 24**      | Automated `POST /payouts` lotes + payout webhooks (adapter already stubbed)                                                                  |
| Shape (API)       | One seller payout per lote; `idempotency-key` required                                                                                       |
| Destination (MVP) | Bank account fields collected from seller (`SellerBankAccount`)                                                                              |
| Webhooks (API)    | Separate Pagos a Terceros URL: `payout.updated`, `transaction.updated`                                                                       |
| Before send       | Check Cuenta balance + limits; validate seller bank data                                                                                     |

**Why manual first:** Extra ops supervision on every dispersion. Automation is feasible (Wompi documents JSON/file lotes) and is scheduled for Phase 24 when volume justifies it. Financial Core still owns **authorization**; only the last mile (Wompi send) changes.

---

# 7. Financial Core responsibilities

1. **Price** — Snapshot `S`, rate (`10%`/`8%`), `B`, projected Wompi costs, shipping fee lines.
2. **Collect** — Checkout + webhook → `PaymentApproved`.
3. **Hold** — Seller amount obligated, not payable.
4. **Freeze** — Disputes, chargebacks, battery claims in progress.
5. **Authorize payout** — On `BuyerConfirmed` **or** 24h auto-release after buyer marks received, if not frozen.
6. **Disperse** — After `PAYOUT_AUTHORIZED`: **MVP** ops pays in Wompi dashboard then marks completed in TruePhone; **Phase 24** API lote + webhooks.
7. **Refund** — Per §5.2–5.3 only after authorization; Ledger first-class.
8. **Absorb losses** — Chargebacks and irrecoverable payout failures booked as TruePhone cost (§5.4).
9. **Ledger** — Append-only money facts.

### Domain events (indicative)

| Event                                                                       | When                                      |
| --------------------------------------------------------------------------- | ----------------------------------------- |
| `PaymentApproved` / `PaymentFailed`                                         | Checkout result                           |
| `ShipmentDelivered`                                                         | Shipping module                           |
| `BuyerConfirmed`                                                            | Buyer explicit confirm                    |
| `BuyerConfirmExpired`                                                       | 24h elapsed → treat as confirm for payout |
| `DisputeOpened` / `DisputeResolved`                                         | Freeze / unfreeze                         |
| `PayoutAuthorized` / `PayoutSubmitted` / `PayoutCompleted` / `PayoutFailed` | Dispersion lifecycle                      |
| `RefundApproved` / `RefundCompleted`                                        | Refund lifecycle                          |
| `ChargebackReceived`                                                        | Provider / bank signal                    |

---

# 8. Status mapping (indicative)

### Checkout

| Wompi                | Financial Core            |
| -------------------- | ------------------------- |
| `PENDING`            | `PAYMENT_PENDING`         |
| `APPROVED`           | `PAYMENT_APPROVED` (hold) |
| `DECLINED` / `ERROR` | `PAYMENT_FAILED`          |
| `VOIDED`             | `PAYMENT_VOIDED`          |

### Payout

| Wompi tx                            | Financial Core                                           |
| ----------------------------------- | -------------------------------------------------------- |
| `PENDING` / `PROCESSING`            | `PAYOUT_IN_FLIGHT`                                       |
| `APPROVED`                          | `PAYOUT_COMPLETED`                                       |
| `FAILED` / `REJECTED` / `CANCELLED` | `PAYOUT_FAILED` (retry / ops; TruePhone owns resolution) |

Do not mark marketplace order fully **completed** until payout succeeds (or an explicit ops exception is Ledger-recorded).

---

# 9. Security & ops checklist

- Separate Sandbox vs Production keys and webhook URLs (checkout **and** payouts).
- Verify every webhook checksum; respond `2xx`; idempotent processing.
- Never expose integrity/events secrets to the browser.
- Unique checkout `reference`; unique payout `idempotency-key`.
- HTTPS webhooks; check Wompi Cuenta balance before dispersion.
- Seller bank details treated as sensitive PII.

---

## Still open (narrow)

1. ~~Who may mark Carrier `delivered`~~ → **LOCKED:** buyer “Ya recibí el iPhone” starts the 24h window; seller/ops do not. Carrier tracking / Premium logistics are separate.
2. Production checkout UX: keep Payment Links vs move to Widget (integrity secret already available as `WOMPI_INTEGRITY_SECRET`).
3. Reconcile Wompi **contract** rates vs dashboard list prices for Cuenta dispersion.
4. Ops window: how long the single-use 8% entitlement stays open before we nudge refund / expire (default: keep refund available until used or buyer closes case).
5. **Post-MVP only:** whether/when to introduce a small **seller marketplace fee** (e.g. 2%) — see §2.4. Not in MVP. Premium $20,000 is already in MVP as logistics.

---

# 11. Gap vs current codebase

Present: collect via Wompi/mock; **10%** fee engine + Ledger hold; shipping (Carrier + Premium); **buyer** starts 24h clock via “Ya recibí”; checkout/pay **24h disclosure**; hourly cron auto-release (`/api/cron/buyer-confirm-expiry`); seller cannot complete as settlement; payout adapter mock/manual/stub; **Phase 12 settlement reminders** (received confirm + pre-deadline nudge).

Missing for full MVP model:

- ~~Seller bank account UI + require default bank for settlement destination~~
- ~~Ops manual dispersion queue (authorized → pay in Wompi → mark completed)~~
- ~~Phase 12 settlement reminders (complements checkout disclosure)~~
- Chargeback webhook ingestion UX / ops tooling

**Post-MVP (Phase 24):** Live Pagos a Terceros lote API (`WOMPI_PAYOUTS_*`) + payout webhooks — replaces manual Wompi dashboard step only.

No implementation is implied by this document alone beyond what Phases 10b–10d have shipped in code.

---

# 12. Reference links (Wompi)

### Receive payments

- [Ambientes y llaves](https://docs.wompi.co/docs/colombia/ambientes-y-llaves/)
- [Widget & Checkout Web](https://docs.wompi.co/docs/colombia/widget-checkout-web/)
- [Links de pago](https://docs.wompi.co/docs/colombia/links-de-pago/)
- [Transacciones](https://docs.wompi.co/docs/colombia/transacciones/)
- [Eventos](https://docs.wompi.co/docs/colombia/eventos/)
- [Tokens de aceptación](https://docs.wompi.co/docs/colombia/tokens-de-aceptacion/)
- [Impuestos](https://docs.wompi.co/docs/colombia/impuestos/)
- [Datos de prueba (sandbox)](https://docs.wompi.co/docs/colombia/datos-de-prueba-en-sandbox/)

### Pagos a Terceros / Wompi Cuenta

- [Introducción](https://docs.wompi.co/docs/colombia/introduccion-pagos-a-terceros/)
- [Activación](https://docs.wompi.co/docs/colombia/activacion-pagos-a-terceros/)
- [Configuración inicial](https://docs.wompi.co/docs/colombia/configuracion-inicial-pagos-a-terceros/)
- [Ambientes y llaves](https://docs.wompi.co/docs/colombia/ambientes-y-llaves-pagos-a-terceros/)
- [Crea tu primer lote](https://docs.wompi.co/docs/colombia/crea-tu-primer-lote/)
- [Eventos](https://docs.wompi.co/docs/colombia/eventos-pagos-a-terceros/)
- [Consulta de saldos](https://docs.wompi.co/docs/colombia/consulta-saldos-pagos-a-terceros/)
- [Sandbox](https://docs.wompi.co/docs/colombia/pruebas-sandbox-pagos-a-terceros/)
- [Postman](https://docs.wompi.co/file/payouts/api-publica-payouts.postman.json)

### BRE-B (post-MVP)

- [Guía](https://docs.wompi.co/docs/colombia/guia-integracion-breb/) · [Previsualizar](https://docs.wompi.co/docs/colombia/previsualizar-breb/) · [Crear dispersión](https://docs.wompi.co/docs/colombia/crear-dispersion-breb/) · [Eventos](https://docs.wompi.co/docs/colombia/eventos-breb/)
