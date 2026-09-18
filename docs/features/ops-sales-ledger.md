# Ops sales ledger — `/revision/ventas` (F1)

**Status:** Implemented (draft PR)  
**Audience:** `REVIEWER` + `ADMIN` (read-only money surface)

## Purpose

Single ops view of every order movement: unpaid, paid, in progress, completed, cancelled, disputes — with filters and newest-activity default sort.

**Not** a payout console: mark-paid, authorize-payout, and complete stay on `/revision/pagos` + Financial Core.

## Columns

| Column           | Source                                        |
| ---------------- | --------------------------------------------- |
| Listing key      | `slug` (+ internal `id` on detail)            |
| Listing price    | `Order.equipmentPrice` / listing snapshot     |
| Seller / buyer   | `Profile` relations                           |
| Model            | `IphoneModel.name`                            |
| Published        | `Listing.publishedAt` (fallback `approvedAt`) |
| Purchased / paid | `Order.paidAt`                                |
| Carrier delivery | `Shipment` carrier timestamps                 |
| Premium delivery | Premium shipment milestones                   |
| «Ya recibí»      | `Order` buyer-received markers                |
| 24h window       | `buyerConfirmDeadlineAt` start/end            |
| Outcome          | status chip + cancel/dispute hints            |

## Filters

Seller, buyer, model, listing slug/id, date range, status.

## Role matrix

| Field class                     | REVIEWER                    | ADMIN |
| ------------------------------- | --------------------------- | ----- |
| Order/listing/shipment timeline | ✓                           | ✓     |
| Bank / payout identifiers       | **stripped at query layer** | ✓     |

API/query helpers use separate Prisma `select` shapes — not UI-only hiding.

## Engineering

| Area    | Location                                |
| ------- | --------------------------------------- |
| Queries | `src/lib/ops-sales-ledger.ts`           |
| Page    | `src/app/revision/ventas/page.tsx`      |
| Nav     | `account-nav.tsx`, `/revision` hub card |

## Indexes

Added on `orders(status, updatedAt)` and listing ops filters as needed for date/status queries.
