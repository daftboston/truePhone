# Roadmap

**Product:** TruePhone  
**Status:** Phases 0–11 collect/marketplace loop present → **MVP settlement nearly complete** (seller bank + **manual** Wompi dispersion landed; API lotes → Phase 24; Phase 12/13 remain)  
**Business roadmap:** [plan.md](./plan.md) + [PRD.md](./PRD.md)  
**Money:** [FINANCIAL_MODEL.md](./FINANCIAL_MODEL.md)  
**Shipping:** [SHIPPING.md](./SHIPPING.md)  
**Visual tokens:** [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) (Figma look reference only)  
**Messaging product rules:** [PRD.md](./PRD.md) §25 / §36

Former working name **iPhoneSeguro** is retired. Brand in product and docs is **TruePhone**.

---

## Current focus

1. Admin **recommended price table** (Phase **13** slice) + seller guide in sell flow (Phase **5**)
2. Phase 12 settlement notifications (24h reminders)
3. Chargeback / refund ops tooling as volume grows
4. Phase 24 when ready: automate Pagos a Terceros API lotes (replace manual Wompi step)

### Planned (documented in plan.md v1.3 — not current sprint)

| Feature                                            | Plan home                                     | Notes                                          |
| -------------------------------------------------- | --------------------------------------------- | ---------------------------------------------- |
| Public counters (listings total / active / bought) | Phase **3** + order party cards (Phase **9**) | Swappa-style public strip — not user analytics |
| Extra auth: Apple + WhatsApp + Facebook            | Phase **2** roadmap                           | Chosen next methods                            |
| Public listing Q&A                                 | Phase **8b**                                  | Post-MVP; distinct from private DMs            |
| Admin / reviewer analytics                         | Phase **15** (+ Phase **13** dashboards)      | Ops only — no buyer/seller analytics app       |
| Mobile web polish                                  | Phase **19**                                  | Native apps stay Phase **24**                  |
| FAQ page                                           | Phase **23**                                  | Canonical help/FAQ before launch               |

Full phase detail: [plan.md](./plan.md)

---

## Phase checklist

| Phase               | Status                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| 0 Foundation        | Complete                                                                                         |
| 1 Design System     | Complete (core primitives; Dialog/Drawer/Toast/DataTable with later forms)                       |
| 2 Authentication    | Complete (V1 email + Google); **next: Apple, WhatsApp, Facebook**                                |
| 3 Profiles          | Complete; **public counters follow-up** (total / active / bought)                                |
| 4 Seller identity   | Complete (manual review pipeline)                                                                |
| 5 Listing creation  | Complete + **pending** seller price-guide UI (needs Phase 13 table)                              |
| 6 Review Portal     | Complete                                                                                         |
| 7 Marketplace       | Complete                                                                                         |
| 8 Messaging         | Complete (private DMs)                                                                           |
| 8b Listing Q&A      | Not started — **public** questions on listings (post-MVP)                                        |
| 9 Orders            | Complete; **party cards + public counters** still to land on order detail                        |
| 10 Payments         | Collect-only (Wompi + mock; fee UI 10%)                                                          |
| 10b Financial Core  | Core landed — Ledger, hold, fee engine; **seller bank + manual Wompi pay**; API lotes → Phase 24 |
| 10c Shipping        | Landed — Carrier tracking + Premium Bogotá + buyer received → 24h                                |
| 10d Order lifecycle | Landed — **24h disclosed at buy/pay**; confirm UX; cron auto-release; seller-complete killed     |
| 11 Reviews          | Complete                                                                                         |
| 12 Notifications    | Not started — include 24h reminders                                                              |
| 13 Admin            | Not started — **priority: recommended price table**                                              |
| 15 Analytics        | Not started — **admin / reviewer / ops only**                                                    |
| 19 Mobile           | Not started as polish pass — responsive baseline exists                                          |
| 23 Launch / FAQ     | Not started — FAQ page in launch prep                                                            |

---

## MVP

MVP = Phases **0–11** plus **10b–10d**, shipping per [SHIPPING.md](./SHIPPING.md), money per [FINANCIAL_MODEL.md](./FINANCIAL_MODEL.md), and admin price guide (Phase 13 slice + Phase 5 display).

MVP seller payouts: Financial Core **authorizes** → ops pays **manually in Wompi** → ops marks completed in TruePhone. Automated Pagos a Terceros API is **Phase 24**.

**Not MVP (but planned):** Phase 8b public Q&A, Phase 15 ops analytics, Phase 19 mobile polish pass, Phase 23 FAQ page, Apple / WhatsApp / Facebook auth. Public profile counters are a small Phase 3/9 polish and can land earlier.

Do not treat Figma frames as a product checklist. Figma informs colors, type, and component appearance only.

---

## Near-term sequence

1. Admin recommended prices (Phase 13) → seller reference in `/vender` (Phase 5)
2. Notifications for buyer-received + 24h reminders (Phase 12)
3. Public activity counters on profiles + order party cards (Phase 3 / 9)
4. Phase 24: automated Wompi Pagos a Terceros API (optional; MVP is manual)

## Post-MVP growth sequence (suggested)

1. FAQ page (Phase 23 can start early for support load)
2. Mobile polish (Phase 19) + Apple / WhatsApp / Facebook Sign-In (Phase 2 roadmap)
3. Public listing Q&A (Phase 8b) after notifications
4. Admin / reviewer analytics (Phase 15)
