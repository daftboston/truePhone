# Roadmap

**Product:** TruePhone  
**Status:** Phases **0–11 + 10b–10d closed**. Phase **12** marketplace notifications, Phase **19** mobile web (including eight guided listing photo slots), UX polish, thin FAQ (`/ayuda`), buyer 8% vs refund, and in-app order-support cancellation are on `main`. Automated Pagos a Terceros → Phase **24**.  
**Business roadmap:** [plan.md](./plan.md) + [PRD.md](./PRD.md)  
**Money:** [FINANCIAL_MODEL.md](./FINANCIAL_MODEL.md)  
**Shipping:** [SHIPPING.md](./SHIPPING.md)  
**Visual tokens:** [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) (Figma look reference only)  
**Messaging product rules:** [PRD.md](./PRD.md) §25 / §36

Former working name **iPhoneSeguro** is retired. Brand in product and docs is **TruePhone**.

---

## Branch map (engineering)

| Branch                                        | Role                                                                                    |
| --------------------------------------------- | --------------------------------------------------------------------------------------- |
| `main`                                        | Production baseline — MVP slices + Explorar catalog + order-support + eight photo slots |
| `feat/listing-photo-slots`                    | **Merged** (PR #8) — eight guided listing photos with per-slot Elegir / Tomar foto      |
| `feat/seller-cancel-via-support`              | **Merged** — in-app seller support cases; staff queue at `/revision/soporte-pedidos`    |
| `feat/public-activity-counters`               | **Merged** — public counters, Phase 12, Phase 19, `/ayuda`, buyer 8% vs refund          |
| `mvp/phases-12-13`                            | **Merged / retired** — history kept after PRs #3 and #4                                 |
| `cursor/explorar-catalog-models-2974`         | **Merged** (PR #5) — 28-model Explorar catalog + glyphs                                 |
| `cursor/prisma-database-setup`                | Older Cloud agent line (Phases 2–5); superseded                                         |
| `origin/cursor/code-documentation-skill-5f7c` | Draft PR #2; skill already in-repo — do not merge as a product change                   |

```text
main  ← production
  • public counters + order party cards
  • Phase 12 marketplace notifications
  • UX polish + Phase 19 mobile web
  • in-app order-support cancellation
  • eight guided listing photo slots
```

---

## Current focus

1. Phase **8b** public listing Q&A
2. Phase **15** admin/reviewer analytics (ops only)
3. Phase **24** only when manual Wompi dispersion becomes the bottleneck

### Planned (documented in plan.md v1.3 — not current sprint)

| Feature                                            | Plan home                                     | Notes                                              |
| -------------------------------------------------- | --------------------------------------------- | -------------------------------------------------- |
| Public counters (listings total / active / bought) | Phase **3** + order party cards (Phase **9**) | Swappa-style public strip — not user analytics     |
| Extra auth: Apple + WhatsApp + Facebook            | Phase **2** roadmap                           | Chosen next methods                                |
| Public listing Q&A                                 | Phase **8b**                                  | Post-MVP; distinct from private DMs                |
| Admin / reviewer analytics                         | Phase **15** (+ Phase **13** dashboards)      | Ops only; instrument listing views here            |
| Seller views-per-listing analytics                 | Phase **24**                                  | Private seller tool; after Phase 15 view events    |
| Mobile web polish                                  | Phase **19**                                  | Native apps stay Phase **24**                      |
| Camera from the phone (listing / posesión / KYC)   | Phase **19**                                  | Mobile web **Tomar foto**; native camera is **24** |
| FAQ page                                           | Phase **23**                                  | Thin `/ayuda` shipped; legal pages still open      |

Full phase detail: [plan.md](./plan.md)

---

## Phase checklist

| Phase               | Status                                                                                       |
| ------------------- | -------------------------------------------------------------------------------------------- |
| 0 Foundation        | **Complete**                                                                                 |
| 1 Design System     | **Complete** (core primitives; Dialog/Drawer/Toast/DataTable with later forms)               |
| 2 Authentication    | **Complete** (V1 email + Google); later: Apple, WhatsApp, Facebook                           |
| 3 Profiles          | **Complete**; public counters (total / active / bought) landed                               |
| 4 Seller identity   | **Complete** (manual review pipeline)                                                        |
| 5 Listing creation  | **Complete** + seller price-guide UI (**landed** with Phase 13)                              |
| 6 Review Portal     | **Complete**                                                                                 |
| 7 Marketplace       | **Complete — closed**                                                                        |
| 8 Messaging         | **Complete — closed** (private DMs)                                                          |
| 8b Listing Q&A      | Not started — **public** questions on listings (post-MVP)                                    |
| 9 Orders            | **Complete — closed**; party cards + public counters on order detail                         |
| 10 Payments         | **Closed** for collect (Wompi + mock; fee UI 10%)                                            |
| 10b Financial Core  | **Closed** — Ledger, hold, fee engine; seller bank + manual Wompi pay; API lotes → Phase 24  |
| 10c Shipping        | **Closed** — Carrier + Premium Bogotá + buyer received → 24h                                 |
| 10d Order lifecycle | **Closed** — 24h disclosed; confirm UX; cron auto-release; seller-complete killed            |
| 11 Reviews          | **Complete — closed**                                                                        |
| 12 Notifications    | **Closed** for in-app/email marketplace events + settlement reminders; push later            |
| 13 Admin            | **Price table landed** (`RecommendedPrice` + `/revision/precios`); full dashboard still open |
| 15 Analytics        | Not started — **admin / reviewer / ops only** (+ listing-view instrumentation)               |
| 19 Mobile           | **Landed** — Tomar foto, account drawer, filter sheet, gallery swipe                         |
| 23 Launch / FAQ     | **Thin FAQ shipped** (`/ayuda`); privacy/terms/legal pages still open                        |
| 24 Post-launch      | Not started — Pagos a Terceros API, native apps, **seller listing-view analytics**, …        |

---

## MVP

MVP = Phases **0–11** plus **10b–10d**, shipping per [SHIPPING.md](./SHIPPING.md), money per [FINANCIAL_MODEL.md](./FINANCIAL_MODEL.md), and admin price guide (Phase 13 slice + Phase 5 display). Settlement reminders (Phase 12 slice) are in for launch quality.

MVP seller payouts: Financial Core **authorizes** → ops pays **manually in Wompi** → ops marks completed in TruePhone. Automated Pagos a Terceros API is **Phase 24**.

**Not MVP (but planned):** Phase 8b public Q&A, Phase 15 ops analytics, remaining Phase 23 legal pages, Apple / WhatsApp / Facebook auth.

Do not treat Figma frames as a product checklist. Figma informs colors, type, and component appearance only.

---

## Near-term sequence

1. Public listing Q&A (Phase 8b)
2. Admin / reviewer analytics (Phase 15)
3. Phase 24: automated Wompi Pagos a Terceros API (optional; MVP is manual)

## Post-MVP growth sequence (suggested)

1. Apple / WhatsApp / Facebook Sign-In (Phase 2 roadmap)
2. Phase 8b public Q&A (if not already started)
3. Admin / reviewer analytics (Phase 15) — include listing-view event instrumentation
4. Phase 24: seller private analytics — **views per listing** for each of the seller’s listings (after Phase 15 data exists)
5. Phase 24: automated Wompi Pagos a Terceros API when manual payouts become the bottleneck
