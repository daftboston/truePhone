# SHIPPING.md

**Project:** TruePhone  
**Version:** 0.3  
**Status:** Draft (MVP scope locked — Bogotá city Premium, Carrier elsewhere, inspection fail refund)  
**Last Updated:** July 2026

> Source of truth for how devices move from seller to buyer.  
> Money rules: `docs/FINANCIAL_MODEL.md`. Product phases: `docs/plan.md`.

---

# 1. Purpose

TruePhone is **not** a warehouse / Amazon-style fulfillment business and does **not** own inventory for resale.

For MVP, TruePhone offers **two** shipping paths:

1. **TruePhone Premium** — Bogotá only; TruePhone picks up, inspects, delivers to buyer.
2. **Carrier shipping** — Seller ships via Servientrega, Envía, or similar and uploads the tracking code.

**Drop-off points** (StockX-style) are **post-MVP**, not required for launch.

The **Shipping module** owns method selection, tracking evidence, inspection checklists (Premium), and **delivery confirmed** signals. It does **not** authorize payouts or refunds.

---

# 2. MVP shipping methods

| ID               | Name                                   | Who can use it                                                            | Who pays logistics                   | Custody                                                   |
| ---------------- | -------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------ | --------------------------------------------------------- |
| `PREMIUM_BOGOTA` | TruePhone Premium                      | Seller **in Bogotá** (optional)                                           | **Seller** — fixed **$20,000 COP**   | TruePhone picks up, inspects, delivers to buyer           |
| `CARRIER`        | Carrier (Servientrega / Envía / other) | **All** sellers (required outside Bogotá; optional alternative in Bogotá) | **Seller** pays the carrier directly | Seller → carrier → buyer; TruePhone never holds the phone |

### Selection rules (locked)

| Seller location                                                                                                | Options                                                                        |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Bogotá (city only)**                                                                                         | Choose **Premium** ($20,000 to TruePhone) **or** **Carrier** (upload tracking) |
| **Outside Bogotá** (other cities, municipalities, and areas that are not Bogotá city — e.g. neighboring towns) | **Carrier only** — must ship with a transporter and upload the tracking code   |

**Geo rule (LOCKED):** Premium is available **only** when the seller’s profile city is **`Bogotá`**, which is auto-set when department is **`Bogotá D.C.`**. **`Alrededores de Bogotá`** / free-text towns (Soacha, etc.) and **`Otra`** are Carrier-only.

Location UX: department select (all Colombia + Bogotá D.C.) first, then city select; **Otra** and **Alrededores de Bogotá** open a free-text city/municipality field.

- Method is chosen by the **seller** after payment (when fulfilling the order), not as a buyer-paid shipping SKU at checkout.
- Buyer is told at purchase how fulfillment works and that they will have **24 hours after they mark that they received** the phone to report a problem on the order page.
- Exact buyer copy: `docs/FINANCIAL_MODEL.md` §5.1 + this doc §6.5.

### Method switch until committed (LOCKED)

Bogotá sellers may **switch Premium ↔ Carrier** until the chosen path is committed. Outside Bogotá there is nothing to switch (Carrier only).

| Direction             | Allowed while                                                                                   | Locked when                                                |
| --------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **Carrier → Premium** | Bogotá; no tracking code saved; not in transit / delivered / failed                             | Tracking uploaded (or logistics past method-selected)      |
| **Premium → Carrier** | Bogotá; inspection not `PASSED` / `FAILED`; status still `AWAITING_PICKUP` or `METHOD_SELECTED` | Ops inspection passed (or failed / in transit / delivered) |

On **Premium → Carrier**: clear `premiumShippingFeePesos` (set to `0`), recalc `sellerAmountPesos` / Wompi projections, remove or abandon the pending inspection row, and append a reversing `PREMIUM_SHIPPING_FEE` ledger note (cancel the $20,000 deduction).  
On **Carrier → Premium**: apply the $20,000 fee snapshot + ledger line as on first Premium select.

### Order support by custody stage (locked)

- **Before commitment:** a paid seller may submit **No puedo completar la venta**. It is a request; only REVIEWER/ADMIN approval invokes Financial Core cancellation. Approval sets an existing shipment to `CANCELLED` and archives the listing.
- **After commitment, before buyer receipt:** cancellation is replaced by **Tengo un problema con el envío**. Carrier tracking, Premium pickup, or Premium inspection means custody may exist, so creating the case freezes payout. Staff may continue fulfillment; ADMIN alone may unfreeze, convert to cancellation when the device never entered buyer custody, or escalate refund/dispute handling.
- **After buyer receipt:** the seller has general support only. Device and delivery claims use the buyer’s existing **Reportar un problema** flow.

Support cases never authorize money by themselves. Financial Core remains the only owner of Ledger, refund, entitlement, and payout mutations.

### Premium fee

- Amount: **20,000 COP** (fixed for MVP).
- Payer: **seller**.
- Settlement: deduct from seller payout (`Seller Amount = Sale Price − 20,000` when Premium was used). Ledger line `PREMIUM_SHIPPING_FEE`.
- Not part of the buyer’s 10% marketplace fee.

### Carrier cost

- Seller pays Servientrega / Envía / other **directly**.
- TruePhone does **not** generate prepaid labels in MVP (may add later).
- TruePhone requires the seller to upload the **transporter tracking code** so ops and the **buyer** can verify the phone was sent.

---

# 3. Method A — TruePhone Premium (Bogotá only)

**Positioning:** Highest trust in Bogotá. Founder/ops can pick up, inspect, and hand-deliver.

**Price:** **$20,000 COP** charged to the **seller** (deducted at payout).

## Workflow

1. Buyer pays → Financial Core holds funds (`PaymentApproved`).
2. Seller (Bogotá) selects **Premium**.
3. TruePhone schedules pickup with the seller.
4. At pickup, **before accepting** the device, TruePhone performs inspection:
   - IMEI
   - Serial
   - Storage
   - Color
   - Cosmetic condition
   - Accessories
   - Battery health reading (for dispute defense)
5. If inspection **fails** vs listing → **do not take** the device; **full refund to the buyer**; unpublish or correct the listing (prefer catching issues in listing review). See `docs/FINANCIAL_MODEL.md` §5.2b.
6. If inspection **passes** → secure the device and transport **directly to the buyer**.
7. Buyer marks **Ya recibí el iPhone** → starts the buyer’s **24h to report a problem** clock (ops inspection / hand-off do **not** start the clock).

## Benefits

- Highest trust
- In-person inspection
- Fewer disputes
- Fits early ops (Bogotá-based)

## MVP notes

- Geo-fence: seller **city = Bogotá** only (not surrounding municipalities).
- Ops may be fully manual at first (admin marks pickup scheduled / in transit / delivered).
- Persist inspection checklist on the shipment.

---

# 4. Method B — Carrier shipping (national + Bogotá alternative)

**Positioning:** Default outside Bogotá; optional in Bogotá if seller declines Premium.

## Workflow

1. Buyer pays → hold.
2. Seller selects **Carrier** (mandatory outside Bogotá).
3. Seller packs and ships with **Servientrega, Envía, or another transporter** (seller pays carrier).
4. Seller **must upload** in-app:
   - Transporter / carrier name
   - **Tracking code** (required)
   - Optional: receipt photo, pack photos (recommended)
5. Buyer (and TruePhone) can **see the tracking code** on the order.
6. Buyer marks **Ya recibí el iPhone** when they have the device → **24h** confirm clock. Seller uploads tracking only (no seller “mark delivered” as clock starter).

## Benefits

- Works nationwide without TruePhone traveling
- Proof the seller actually sent the phone
- Buyer transparency via tracking code

## MVP notes

- No prepaid label API required for launch.
- **Tracking code upload is mandatory** before the order can move to “in transit” / before payout eligibility after delivery.
- TruePhone does not hold the device.

---

# 5. Post-MVP (not launch-blocking)

- **Drop-off points** (seller brings phone to a TruePhone/partner location for inspection + ship) — deferred.
- Prepaid labels / carrier API integration.
- BRE-B, multi-city Premium network, etc.

---

# 6. Cross-cutting rules

## 6.1 Domain boundary

| Shipping may                                      | Shipping must not                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------- |
| Create shipment, store tracking, logistics status | Call Wompi payout/refund                                                  |
| Store Premium inspection results                  | Release seller funds                                                      |
| Emit shipping domain events                       | Change Ledger balances (Financial Core records the $20,000 fee at payout) |

## 6.2 Custody

- **Carrier:** seller → transporter → buyer.
- **Premium:** brief TruePhone custody for inspect + deliver. Not a purchase by TruePhone.

## 6.3 After buyer marks received (canonical settlement)

> **Buyer pays → TruePhone holds → buyer marks received → buyer confirms (or 24h) → then TruePhone pays the seller.**

Shipping logistics end when the device is in transit / handed off. **`deliveredAt`** is the buyer’s receipt ack and starts the 24h window. Seller “mark complete” / seller “mark delivered” is **not** settlement.

## 6.4 Domain events (indicative)

| Event                                   | Meaning                                                                           |
| --------------------------------------- | --------------------------------------------------------------------------------- |
| `ShippingMethodSelected`                | Seller chose Premium or Carrier                                                   |
| `ShippingMethodSwitched`                | Bogotá seller switched Premium ↔ Carrier before commitment (fee snapshot updated) |
| `ShipmentCreated`                       | Fulfillment record created                                                        |
| `InspectionPassed` / `InspectionFailed` | Premium only                                                                      |
| `CarrierTrackingUploaded`               | Tracking code saved; visible to buyer                                             |
| `ShipmentInTransit`                     | On the way                                                                        |
| `BuyerMarkedReceived`                   | Buyer ack; sets `deliveredAt` + starts 24h confirm window                         |
| `ShipmentFailed` / `ShipmentReturned`   | Exceptions                                                                        |

## 6.5 What the buyer must see

At **purchase / checkout** (and on the order page):

1. Funds are held until after the buyer marks received; they have **24 hours after marking received** to report if it is not correct (on the order page).
2. If they do **not** report a problem in 24h, TruePhone **pays the seller**.
3. Seller will fulfill via **TruePhone Premium (Bogotá city only)** and/or **a carrier with a visible tracking code**.
4. After tracking is uploaded: **carrier name + tracking code** on the order.
5. When the shipment is in flight: CTA **Ya recibí el iPhone**; after that, confirm OK or report a problem, plus the 24h reminder.

---

# 7. Data the MVP must capture (conceptual)

- `method` (`PREMIUM_BOGOTA` | `CARRIER`)
- Status timeline
- For Carrier: `carrierName`, `trackingCode` (required), optional evidence URLs
- For Premium: inspection checklist + readings; `premiumFeeCop = 20000`
- `deliveredAt`
- Seller city / Bogotá eligibility flag

Schema: update `docs/DATABASE.md` when implementing Phase 10c.

---

# 8. Open before build

1. Allowed carrier list — **LOCKED for MVP:** Servientrega, Envía, Interrapidisimo, Coordinadora, Otro.
2. ~~Who may mark Carrier `delivered`~~ → **LOCKED:** only the **buyer** (“Ya recibí el iPhone”) starts the 24h window. Carrier: seller uploads tracking. Premium: ops inspection/hand-off are logistics only.
3. Exact city field value for “Bogotá” — **LOCKED:** profile city select value `Bogotá`. Surroundings use `Alrededores de Bogotá` (Carrier only).
4. If Premium already picked up then order cancels — fee earned vs refunded (default: earned).

---

# 9. Implementation order (Phase 10c)

1. **Carrier** — tracking upload + buyer-visible code + delivered (unblocks national MVP).
2. **Premium Bogotá** — admin/ops pickup + inspection + $20,000 seller fee at payout.

Drop-off: not in this phase.
