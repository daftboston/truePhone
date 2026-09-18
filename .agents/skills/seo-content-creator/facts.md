# TruePhone facts for content

Every claim below is sourced from `docs/`. When a doc changes, this file is wrong until updated — on any doubt, the doc wins. Cite the doc when you reuse a fact in a PR.

## Identity

| Fact | Value | Source |
| ---- | ----- | ------ |
| Brand | **TruePhone** (never "iPhoneSeguro") | `docs/PRD.md` header |
| What it is | Curated marketplace for **used iPhones** in **Colombia**; every listing is **manually reviewed** before publication | PRD §1, §4 |
| What it is not | Not a classifieds site, not a general marketplace, not a refurbisher, not an escrow company by branding | PRD §4, §62 |
| Language / currency | Spanish (Colombia) / COP | PRD §57 |
| Contact | `hola@truephone.co` | `src/lib/help/faq.ts`, `src/components/site-footer.tsx` |
| Public pages | `/`, `/explorar`, `/buscar`, `/anuncios/[slug]`, `/u/[username]`, `/ayuda` | `src/app/` |
| Roles | Guest, Buyer, Seller, Reviewer, Admin | PRD §17 |

## Buying

| Fact | Value | Source |
| ---- | ----- | ------ |
| Buyer fee | **10%** of the sale price, shown before checkout. Product name: **Compra Garantizada** / **protección TruePhone** | `docs/FINANCIAL_MODEL.md` §2.1 |
| What 10% covers | Listing review, secure collection, holding funds until the order completes; includes Wompi costs and TruePhone margin. No IVA added on top of the 10% | FINANCIAL_MODEL §2.1 |
| Payment | Wompi Checkout; cards enabled (other Wompi methods as enabled) | FINANCIAL_MODEL §5.6 |
| Settlement | Buyer pays → TruePhone holds → buyer marks **«Ya recibí el iPhone»** → buyer confirms **or 24 hours pass** → TruePhone pays the seller | FINANCIAL_MODEL §4, §5.1 |
| 24-hour rule | Only the buyer starts the clock by marking received. In 24 h they confirm or report a problem on the order page. Silence = seller gets paid | FINANCIAL_MODEL §5.1 |
| Battery tolerance | Drop **≤ 1 percentage point** vs listing is not a valid claim. **> 1 point**: return for full refund, or keep with no refund | FINANCIAL_MODEL §5.3 |
| Seller cancels after payment | Not auto-refund. Staff reviews the seller's request. If accepted: buyer chooses **full refund** or **one-time 8%** fee on a replacement purchase. Refund always stays available | FINANCIAL_MODEL §5.2 |
| Buyer cancels after payment | Refund minus Wompi collection cost | FINANCIAL_MODEL §5.2 |
| Guests can | Browse, search, view profiles, read help. Buying, favorites, messaging need an account | PRD §17.1 |

## Selling

| Fact | Value | Source |
| ---- | ----- | ------ |
| Seller commission | **0%** marketplace commission; seller receives the full sale price (minus $ 20.000 only if Premium Bogotá) | PRD §10, FINANCIAL_MODEL §2.2 |
| Identity verification | Cédula (front/back) + selfie before publishing | `docs/plan.md` Phase 4 |
| Possession proof | One-time code + photo of the device showing the code | plan.md Phase 5 |
| Required listing data | Model, storage, color, carrier/unlocked, battery health, condition, price, IMEI, repairs, Face ID/Touch ID, accessories | PRD §20 |
| Photos | Guided photo slots (front, back, sides, port, screen on, battery health screen, IMEI screen). **Check `docs/PRD.md` §20 Step 3 for the current required count before quoting a number** | PRD §20 |
| Review outcomes | Approved (published), Rejected (with reason, can fix and resubmit), Needs more information | PRD §21 |
| Price guidance | Admin-maintained recommended price range by model + storage + condition; seller chooses the final price | plan.md Phase 13 |
| Payout | To the seller's **bank account** from Wompi Cuenta after the order completes. MVP: ops sends it manually in Wompi after Financial Core authorizes | FINANCIAL_MODEL §5.5, plan.md Phase 10b |

## Shipping

| Fact | Value | Source |
| ---- | ----- | ------ |
| Who chooses | The **seller**, after payment | `docs/SHIPPING.md` §2 |
| TruePhone Premium | **Bogotá city only**. TruePhone picks up, inspects, delivers. **Seller pays $ 20.000 COP**, deducted at payout | SHIPPING §2, §3 |
| Carrier | Servientrega / Envía / other. Required outside Bogotá; optional in Bogotá. Seller pays the carrier directly and **uploads the tracking code**, visible to the buyer | SHIPPING §2, §4 |
| Buyer shipping cost at checkout | None — shipping is not a buyer-paid SKU | SHIPPING §2 |
| Drop-off points | Post-MVP; do not advertise | SHIPPING §5 |

## Security and trust

| Fact | Value | Source |
| ---- | ----- | ------ |
| IMEI | Required on every listing; reviewers check it | PRD §21 |
| Activation Lock | Seller confirms the device is free of Activation Lock; listing is not published otherwise | PRD §20 Step 5, §21 |
| Duplicate / fraud checks | Reviewers check duplicates, fraud indicators, price reasonableness | PRD §21 |
| Messaging | On-platform; phone numbers not exposed by default | PRD §25 |
| Reviews | Order-tied, after completed orders only | plan.md Phase 11 |
| Never asked by TruePhone | Apple password, verification codes, off-platform payment | `src/lib/help/faq.ts` |

## Account

| Fact | Value | Source |
| ---- | ----- | ------ |
| Login today | Email + password, Google | plan.md Phase 2 |
| Login planned | Apple, WhatsApp, Facebook — say "más adelante", never a date | plan.md Phase 2 |
| Legal pages | Full Privacidad / Términos not published yet; `/ayuda` summarizes | plan.md Phase 23 |

## Forbidden claims

Do not write any of these, even softened:

- "Garantizado", "garantía total", "100% seguro", "el más seguro de Colombia / del mundo"
- "Gratis" or "sin comisiones" for buyers (buyers pay 10%). "Sin comisión para el vendedor" is correct.
- "Reacondicionado", "certificado por Apple", "como nuevo garantizado" — TruePhone reviews listings; it does not refurbish or certify hardware.
- Android, iPad, Mac, AirPods, trade-in, cuotas / financiación, seguros, subastas, negociación de precio, app nativa iOS/Android — out of V1 scope (`docs/PRD.md` §14).
- "Envío gratis", "envío incluido" — seller pays shipping; never a buyer perk.
- "Reembolso inmediato" when a seller cancels — staff review first, then buyer chooses refund or 8% replacement.
- "Puntos de entrega" / drop-off — post-MVP.
- Specific review turnaround times ("aprobado en 2 horas") unless a doc states one.
- Comparisons that name competitors negatively. Describe TruePhone's process; do not attack Facebook Marketplace, Mercado Libre, or OLX by name in public copy.
- Any IMEI, serial number, cédula, bank data, or phone number in examples — use obvious placeholders.

## Numbers and formatting

- Money: es-CO style, matches `formatOrderMoney` → `$ 2.350.000`; add "COP" when the context is not obviously pesos.
- Percentages: `10 %` or `10%` — pick the one used on the page you edit and stay consistent (`src/lib/help/faq.ts` uses `10%`).
- Time: "24 horas" spelled out in prose; "24 h" allowed in tables.
- Dates: `8 de julio de 2026`.
