# Roadmap

**Product:** TruePhone  
**Status:** Phases **0–11 + 10b–10d closed**. MVP settlement loop landed (manual Wompi payouts). Phase **12** settlement reminders + Phase **13** price table (and Phase **5** seller guide) landed in code — finish/harden on branch `mvp/phases-12-13`, then soft-launch polish. Automated Pagos a Terceros → Phase **24**.  
**Business roadmap:** [plan.md](./plan.md) + [PRD.md](./PRD.md)  
**Money:** [FINANCIAL_MODEL.md](./FINANCIAL_MODEL.md)  
**Shipping:** [SHIPPING.md](./SHIPPING.md)  
**Visual tokens:** [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) (Figma look reference only)  
**Messaging product rules:** [PRD.md](./PRD.md) §25 / §36

Former working name **iPhoneSeguro** is retired. Brand in product and docs is **TruePhone**.

---

## Branch map (engineering)

| Branch                                        | Role                                                                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `main`                                        | Production baseline (last merge: listing color filter; **behind** MVP work)                                         |
| `mvp/phases-12-13`                            | **Active** — closes Phase 12/13 MVP slices on top of settlement already shipped from former `mvp/close-phases-7-11` |
| `mvp/close-phases-7-11`                       | **Retired name** — history preserved via rename; Phases 7–11 + 10b–10d already shipped on this line                 |
| `cursor/prisma-database-setup`                | Older Cloud agent line (Phases 2–5); superseded by `main` / MVP branches                                            |
| `origin/cursor/code-documentation-skill-5f7c` | Docs/skill PR branch; not product feature work                                                                      |

```text
main (Jul 19)
  │
  └── mvp/close-phases-7-11  (renamed →)
        └── mvp/phases-12-13   ← you are here
              • 7–11 marketplace loop      DONE (committed)
              • 10b–10d settlement         DONE (committed)
              • 12 notifications slice     in working tree
              • 13 price table + /vender   in working tree
```

---

## Current focus

1. Finish & harden Phase **12** / **13** on `mvp/phases-12-13` (commit, stage smoke, merge toward `main`)
2. Chargeback / refund ops (`/revision/disputas` + Wompi `VOIDED` ingestion) — landing on this branch
3. Small polish still open inside earlier phases: public counters (3/9), order party cards
4. Phase **24** only when manual Wompi dispersion becomes the bottleneck

### Planned (documented in plan.md v1.3 — not current sprint)

| Feature                                            | Plan home                                     | Notes                                              |
| -------------------------------------------------- | --------------------------------------------- | -------------------------------------------------- |
| Public counters (listings total / active / bought) | Phase **3** + order party cards (Phase **9**) | Swappa-style public strip — not user analytics     |
| Extra auth: Apple + WhatsApp + Facebook            | Phase **2** roadmap                           | Chosen next methods                                |
| Public listing Q&A                                 | Phase **8b**                                  | Post-MVP; distinct from private DMs                |
| Admin / reviewer analytics                         | Phase **15** (+ Phase **13** dashboards)      | Ops only — no buyer/seller analytics app           |
| Mobile web polish                                  | Phase **19**                                  | Native apps stay Phase **24**                      |
| Camera from the phone (listing / posesión / KYC)   | Phase **19**                                  | Mobile web **Tomar foto**; native camera is **24** |
| FAQ page                                           | Phase **23**                                  | Canonical help/FAQ before launch                   |

Full phase detail: [plan.md](./plan.md)

---

## Phase checklist

| Phase                    | Status                                                                                       |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| 0 Foundation             | **Complete**                                                                                 |
| 1 Design System          | **Complete** (core primitives; Dialog/Drawer/Toast/DataTable with later forms)               |
| 2 Authentication         | **Complete** (V1 email + Google); later: Apple, WhatsApp, Facebook                           |
| 3 Profiles               | **Complete**; public counters follow-up (total / active / bought)                            |
| 4 Seller identity        | **Complete** (manual review pipeline)                                                        |
| 5 Listing creation       | **Complete** + seller price-guide UI (**landed** with Phase 13)                              |
| 6 Review Portal          | **Complete**                                                                                 |
| 7 Marketplace            | **Complete — closed**                                                                        |
| 8 Messaging              | **Complete — closed** (private DMs)                                                          |
| 8b Listing Q&A           | Not started — **public** questions on listings (post-MVP)                                    |
| 9 Orders                 | **Complete — closed**; party cards + public counters still to land on order detail           |
| 10 Payments              | **Closed** for collect (Wompi + mock; fee UI 10%)                                            |
| 10b Financial Core       | **Closed** — Ledger, hold, fee engine; seller bank + manual Wompi pay; API lotes → Phase 24  |
| 10c Shipping             | **Closed** — Carrier + Premium Bogotá + buyer received → 24h                                 |
| 10d Order lifecycle      | **Closed** — 24h disclosed; confirm UX; cron auto-release; seller-complete killed            |
| 11 Reviews               | **Complete — closed**                                                                        |
| 12 Notifications         | **Settlement slice landed** — received confirm + deadline reminders; activity center         |
| 13 Admin                 | **Price table landed** (`RecommendedPrice` + `/revision/precios`); full dashboard still open |
| 15 Analytics             | Not started — **admin / reviewer / ops only**                                                |
| 19 Mobile                | Not started as polish pass — responsive baseline exists; **Tomar foto** is in this phase     |
| 23 Launch / FAQ          | Not started — FAQ page in launch prep                                                        |
| 24 Auto payouts / native | Not started — Pagos a Terceros API + native apps (post-MVP)                                  |

---

## MVP

MVP = Phases **0–11** plus **10b–10d**, shipping per [SHIPPING.md](./SHIPPING.md), money per [FINANCIAL_MODEL.md](./FINANCIAL_MODEL.md), and admin price guide (Phase 13 slice + Phase 5 display). Settlement reminders (Phase 12 slice) are in for launch quality.

MVP seller payouts: Financial Core **authorizes** → ops pays **manually in Wompi** → ops marks completed in TruePhone. Automated Pagos a Terceros API is **Phase 24**.

**Not MVP (but planned):** Phase 8b public Q&A, Phase 15 ops analytics, Phase 19 mobile polish pass, Phase 23 FAQ page, Apple / WhatsApp / Facebook auth. Public profile counters are a small Phase 3/9 polish and can land earlier.

Do not treat Figma frames as a product checklist. Figma informs colors, type, and component appearance only.

---

## Near-term sequence

1. Harden & merge Phase 12 + 13 work on `mvp/phases-12-13` → `main`
2. Public activity counters on profiles + order party cards (Phase 3 / 9)
3. Chargeback / refund ops (`/revision/disputas`) — in working tree on `mvp/phases-12-13`
4. Phase 24: automated Wompi Pagos a Terceros API (optional; MVP is manual)

## Post-MVP growth sequence (suggested)

1. FAQ page (Phase 23 can start early for support load)
2. Mobile polish (Phase 19: responsive + **Tomar foto** on sell / posesión / cédula / selfie) + Apple / WhatsApp / Facebook Sign-In (Phase 2 roadmap)
3. Public listing Q&A (Phase 8b)
4. Admin / reviewer analytics (Phase 15)
