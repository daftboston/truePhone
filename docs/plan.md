# PLAN.md

# TruePhone Development Plan

Version 1.3

**Engineering status:** Phases **0–11 + 10b–10d closed**. Phase **12** settlement reminders + Phase **13** price table are on `main`. Active line: `cursor/explorar-catalog-models-2974` (28-model Explorar catalog). Next after merge: Phase **3/9** public counters. See [ROADMAP.md](./ROADMAP.md).

**Visual design reference:** [Figma](https://www.figma.com/design/nloCtrpFAgGr85fhmFoHzJ/Untitled?node-id=0-1) (tokens / look only)  
**Brand:** TruePhone (former working name iPhoneSeguro is retired)  
**Business logic source:** this file + `docs/PRD.md` — not Figma  
**Changelog (v1.3):** Chosen next auth = Apple + WhatsApp + Facebook; profile counters locked to Swappa-style public display (incl. order parties); removed user self-serve analytics (Phase 15 = admin/reviewer only).

---

# Purpose

This document defines the development roadmap for TruePhone.

The project is intentionally built in incremental phases.

Every phase should result in a functional, testable application.

No phase should introduce unnecessary complexity.

The objective is to build a production-quality marketplace while learning modern full-stack software engineering.

---

# Development Philosophy

The order of implementation is intentional.

Always build:

1. Foundations
2. Authentication
3. Trust pipelines (listing → review)
4. Marketplace discovery
5. Transactions
6. Growth
7. Scale

Each phase builds on the previous one.

Do not skip phases.

Trust is the product. Marketplace browse ships only after listings can be created and manually reviewed.

---

# Visual Design vs Business Logic

| Concern                               | Source of truth                                         |
| ------------------------------------- | ------------------------------------------------------- |
| What to build, when, and why          | **This plan** + `docs/PRD.md`                           |
| Money, fees, payouts, refunds         | `docs/FINANCIAL_MODEL.md`                               |
| Shipping methods & custody            | `docs/SHIPPING.md`                                      |
| Colors, type, spacing, component look | `docs/DESIGN_SYSTEM.md` + Figma + `src/app/globals.css` |

Figma is used only to absorb the **design system** (visual language).

Do **not** infer product rules, workflows, or feature priority from Figma frames. Ignore legacy “iPhoneSeguro” labels in Figma.

---

# MVP Definition

MVP is complete when Phases **0–11** plus **Financial Core settlement**, **Shipping (3 methods)**, and PRD acceptance criteria are met:

- Users can register
- Sellers can create listings (including device possession proof)
- Listings require manual review
- Reviewers can approve or reject
- Approved listings become public
- Buyers can search and browse listings
- Buyers can purchase devices (**10%** marketplace fee; cards via Wompi)
- Buyer selects / understands fulfillment (**Premium Bogotá** or **Carrier** — see `docs/SHIPPING.md`)
- Funds held until buyer confirm **or 24h after buyer marks received** (**24h rule disclosed at purchase**)
- Sellers receive payout to **bank account** from **Wompi Cuenta** after successful completion (minus **$20,000** if Premium). **MVP:** ops pays manually in Wompi after Financial Core authorizes; **Phase 24:** automated Pagos a Terceros API.
- Sellers see **recommended price references** (model + storage + condition) while pricing; admins maintain the table
- Both parties can review each other
- Important actions are logged (including Ledger)
- Workflows prioritize trust over speed

Canonical rules: `docs/FINANCIAL_MODEL.md`, `docs/SHIPPING.md`.

Seller identity verification (cédula + facial) is part of MVP (Phase 4).

---

# Phase Exit Criteria

| Phases      | Exit bar                                                                                              |
| ----------- | ----------------------------------------------------------------------------------------------------- |
| 0–1         | Lint, typecheck, format, CI green; design tokens in place; deployable shell                           |
| 2–4         | Auth + profiles + identity verification work end-to-end on staging                                    |
| 5–7         | Create → review → publish → browse/search works with real data                                        |
| 8–11        | Order + collect payment + reviews (legacy loop); superseded by 10b–10d for settlement                 |
| **10b–10d** | Hold → ship (Carrier / Premium) → buyer marks received → confirm/24h (disclosed at buy) → bank payout |
| 12+         | Phase-specific quality gates (tests, SEO, monitoring as listed)                                       |

Early phases do not require the full Phase 19 test suite. Add smoke tests as features land.

---

# Phase 0 — Project Foundation

Goal: Create a professional development environment.

Deliverables

- Next.js setup
- TypeScript
- Tailwind CSS
- shadcn/ui
- ESLint
- Prettier
- Husky
- Git / GitHub
- Folder structure
- Documentation (including DATABASE + API stubs)
- Environment variables
- Design tokens (aligned with DESIGN_SYSTEM / Figma look)
- Theme + dark mode
- Component library foundation
- CI (GitHub Actions)
- Vercel project linked

Result: A clean, deployable project.

Status: Complete (Vercel connected; keep docs in sync as features land).

---

# Phase 1 — Design System

Goal: Build reusable UI before features, using the design system.

Deliverables

- Typography scale (Geist)
- Buttons (black primary CTA)
- Inputs
- Cards
- Badges (including Trust / VERIFICADO)
- Avatars
- Dialogs / Drawers
- Tables
- Top app header (logo + cart)
- Bottom navigation (Home, Search, Sell, Purchases, Profile)
- Filter chips
- Listing card shell
- Price display + fee breakdown
- Guarantee / Compra Garantizada banner
- Review queue row
- Step progress header
- Pagination
- Skeletons / empty / error / loading states
- Toasts / forms / icons
- Responsive + accessible layout
- Dark mode derived carefully from the light-first visual system

Result: UI foundation ready for auth and marketplace screens.

Status: Core Phase 1 complete (P0–P2 primitives + homepage showcase). Dialog, Drawer, Toast, and DataTable ship with Phase 2+ form/dashboard needs.

---

# Phase 2 — Authentication

Goal: Users can create accounts securely.

Features (V1 — landed)

- Sign up / login / logout
- Forgot / reset password
- Email verification
- Google Sign In
- Protected routes
- Session management
- Profile creation
- User settings
- Avatar upload
- Roles: Buyer, Seller, Reviewer, Admin

Result: Complete authentication system (email + Google).

### Recommended auth methods (post-V1 — fit TruePhone’s dynamics)

TruePhone is a **Colombia-first, mobile-heavy, iPhone-focused** C2C marketplace. Expand login options without weakening KYC gates (Phase 4).

#### Chosen next methods (product decision)

| Method                                  | Priority | Why it fits                                                                       | When                                                                     |
| --------------------------------------- | -------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Apple Sign-In**                       | High     | Audience buys/sells iPhones; expected on iOS Safari                               | Post-MVP polish (pair with Phase 19 mobile)                              |
| **WhatsApp login / OTP via WhatsApp**   | High     | Dominant channel in Colombia; lower friction than email for many users            | Post-MVP; Meta WhatsApp Business / Cloud API; rate limits + fraud checks |
| **Facebook / Meta login**               | High     | Familiar from CO classifieds culture; acquisition channel many buyers already use | Post-MVP with Apple + WhatsApp; privacy copy must be clear               |
| **Apple Hide My Email / private relay** | Support  | Comes with Apple Sign-In; support + profile email flows must still work           | With Apple Sign-In                                                       |

#### Optional later (security hardening — not required for launch growth)

These are **not** “social login.” They add a second check or replace passwords. See product notes below; implement in **Phase 21** only if needed.

| Method                  | Role                                                                                                                                | When                                                            |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **Phone OTP (SMS)**     | One-time code by SMS to prove you own that number (login or step-up)                                                                | Optional; WhatsApp may cover the same “prove phone” habit in CO |
| **MFA (multi-factor)**  | After password/social login, ask for a second proof (app code, SMS, etc.) — especially REVIEWER/ADMIN and sellers with bank payouts | Phase 21                                                        |
| **Passkeys / WebAuthn** | Device unlock (Face ID / fingerprint) instead of password                                                                           | Phase 21 or later                                               |
| **Magic link**          | Email one-tap login without password                                                                                                | Optional anytime                                                |

**Policy notes**

- Identity verification (Phase 4 cédula + facial) remains required for high-trust selling regardless of login method.
- Do not expose phone numbers on public profiles by default (same rule as messaging).
- Prefer a small set of well-supported methods (email + Google + Apple + WhatsApp + Facebook) over many half-integrated providers.

Status: V1 complete (email + Google). Chosen next: Apple, WhatsApp, Facebook (not blocking MVP).

---

# Phase 3 — User Profiles

Features

- Public profiles
- Profile editing (bio, city, photo)
- Seller statistics
- Join date / completed sales / ratings
- Verification badges (UI)
- Trusted Seller badge
- Profile sharing

### Public activity counters (Swappa-style — required)

This is **not** a private analytics dashboard. It is a **public trust strip** on every user, same idea as Swappa’s sale-party cards:

> Listings: **N** total, **N** active, **N** bought

| Counter    | Definition                                                                                                            |
| ---------- | --------------------------------------------------------------------------------------------------------------------- |
| **total**  | Listings the user has created (product may exclude pure drafts from the public total — lock one rule and stick to it) |
| **active** | Listings currently on market (`PUBLISHED` / equivalent)                                                               |
| **bought** | Completed purchases as **buyer** (`COMPLETED` orders)                                                                 |

**Where it must appear**

1. **Public profile** (`/perfil/...` or public seller/buyer profile)
2. **Own account profile** (`/perfil`)
3. **Order / sale detail** — side-by-side **Seller** and **Buyer** cards (participants in that order), each showing avatar, display name, member since, rating, and the three counters — so both parties can judge reputation during the transaction (Swappa reference UX)

Do **not** show private funnels (views, conversion, payout math) to other users. Counts come from listings + orders tables, never hand-edited fields. Spanish UI example: `Anuncios: 3 en total, 0 activos, 1 comprado`.

### Pending follow-up

| Item                                          | Status  | When                           | Notes                                                                       |
| --------------------------------------------- | ------- | ------------------------------ | --------------------------------------------------------------------------- |
| **Public counters (total / active / bought)** | Pending | ASAP on Phase 3 + order detail | Profile pages + order party cards; reuse one small presentational component |

Result: Professional user identities with transparent public activity stats.

---

# Phase 4 — Seller Identity Verification

Goal: Sellers prove who they are before high-trust selling.

Features

- Multi-step progress UI
- Cédula de ciudadanía capture
- Facial recognition / liveness
- Privacy messaging
- Verification status on profile
- Gate listing publish until verified (MVP policy)

Result: Identity-verified sellers.

---

# Phase 5 — Listing Creation

Features

- Create listing / drafts
- Image upload (file / gallery picker). **Camera from the phone** is Phase **19** — do not bolt it onto Phase 5.
- Device information, condition, battery health, accessories
- Description
- IMEI validation / last-4 handling
- Activation Lock confirmation
- **Device possession verification** (one-time code + photo of device with code)
- Preview / submit for review
- Edit / delete draft
- **Recommended price reference (seller-facing)** — when setting price, show admin-maintained guide for **model + storage + condition** (data from Phase 13 price table; can ship UI once table exists)

Listing lifecycle

1. Draft
2. Submitted
3. Pending Review
4. Published (approve writes `PUBLISHED` directly; `APPROVED` enum is legacy/compat only — see DATABASE.md)
5. Reserved (Phase 9)
6. Sold (Phase 9+)
7. Archived
8. Rejected (terminal from review; may reopen to draft)

Result: Complete seller workflow with possession proof.

### Pending follow-up (not blocking Phase 6)

| Item                                               | Status   | When to do it            | Notes                                                                                                     |
| -------------------------------------------------- | -------- | ------------------------ | --------------------------------------------------------------------------------------------------------- |
| **Filter listing colors by selected iPhone model** | **Done** | Completed before Phase 7 | `IphoneModelColor` join + seed mappings + wizard filter + server validation.                              |
| **Seller price guide UI**                          | **Done** | With Phase 13 data       | Read-only reference from `RecommendedPrice` next to price on `/vender` device step; never blocks publish. |

---

# Phase 6 — Review Portal

Goal: Human review workflow for pending listings.

Features

- Reviewer dashboard / cola de revisión
- Tabs: Pendiente / En revisión / Aprobados / Rechazados / Todos
  - **Pendiente:** `SUBMITTED` or `PENDING_REVIEW` without assigned `reviewerId`
  - **En revisión:** `PENDING_REVIEW` with `reviewerId` (claimed on open; `SUBMITTED` is promoted)
  - **Aprobados / Rechazados:** history for tracking and corrections
  - **Todos:** active queue + history
- Approve / reject listing (approve → `PUBLISHED`; reject → `REJECTED` + seller-facing reason)
- Re-open decisions: update notes or change approve ↔ reject after the fact
- Internal notes (`reviewerNotes`)
- Image review (gallery + possession)
- Duplicate detection (same IMEI hash or same seller + model in active statuses)
- Quality checklist (guidance UI; not persisted)
- Listing detail history fields (`reviewedAt`, `approvedAt`, rejection reason)
- Trust-standard messaging

Result: Human review workflow.

Status: Complete (listing review queue, claim-on-open, approve/reject + re-open, seller-facing rejection reason, seller listing hub). `/revision` hub shows live queue counts (anuncios + identidad); staff entry via Mi TruePhone → Operaciones only.

---

# Phase 7 — Marketplace

Goal: Buyers discover verified devices.

Features

- Home hero + featured listings
- Browse listings
- Listing details (gallery, badges, specs, seller card, Compra Garantizada)
- Search + sorting + filtering (Postgres / Prisma; filter chips)
- Pagination
- Favorite listings
- Share listing
- Recently viewed
- Basic SEO metadata on public pages

Also shipped with / after this phase (same discovery surface):

- Explore hub `/explorar` (series + model picker) → filtered `/buscar`
- Home model typeahead (models by series, not listing search)
- Account pages under `src/app/(account)/` only (`/perfil`, `/compras`, `/favoritos`, `/mensajes`, `/vender` list, `/ventas`) — do not reintroduce parallel `src/app/compras` / `src/app/perfil` / `src/app/favoritos` trees
- Recently viewed: **localStorage V1** (`src/lib/recently-viewed.ts`); hydrate cards via Server Action — no server history table yet
- Seller listing summary `/vender/[listingId]` (status, rejection reason, reopen draft)
- Home Swappa-inspired hero + trust strip (TruePhone voice); featured / recently viewed below

### Public vs account vs ops chrome

| Surface                                 | Purpose                  | Entry                                                                                                      |
| --------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| **Public chrome**                       | Discovery only           | Header: logo · Explorar · search · profile/login · Vender. Bottom nav: Inicio · Explorar · Vender · Perfil |
| **Mi TruePhone** (`(account)` sidebar)  | Transactions + messaging | Compras, Mensajes, Favoritos, Ventas, Verificación — **not** in the public header                          |
| **Operaciones** (REVIEWER / ADMIN only) | Trust queues             | Sidebar → Revisión → `/revision` hub (queue counts) → anuncios / identidad. Never in public buyer chrome   |

Result: Users can discover and inspect devices.

Status: Complete (hero + slim public nav + account/ops split).

---

# Phase 8 — Messaging

Goal: Keep buyer ↔ seller (and seller ↔ reviewer) communication on-platform.

Features (V1)

- Buyer ↔ seller chat on `PUBLISHED` listings (listing-scoped threads)
- Seller ↔ assigned reviewer on `PENDING_REVIEW` / `REJECTED`
- Conversation list (`/mensajes`) + thread view
- Unread count / badge
- Send via Server Actions; refresh / light poll (Realtime later)
- Block user / report conversation (minimal)

Future (not V1)

- Image sharing, typing indicator, rich read-receipt UI
- Supabase Realtime
- Email / push “new message” (see Phase 12 Notifications)
- **Public listing Q&A** → see **Phase 8b** (distinct from private DMs)

Result: Communication inside the platform.

Status: Complete (listing CTAs, seller↔reviewer chat, inbox + unread badges, block/report UI, light poll).

Pre–Phase 9 hardening: listing lifecycle docs aligned (`approve` → `PUBLISHED`); messaging access smoke tests in `src/lib/messages-access.test.ts` (`npm test`).

---

# Phase 8b — Public listing Q&A

Goal: Every **published** listing has a **public** question thread so prospective buyers can ask about the device and sellers can answer — without opening a private negotiation chat.

**Why not Phase 8 V1?** Private messaging is for serious buyer↔seller threads (and seller↔reviewer). Public Q&A is a discovery/trust surface (like product questions on retail sites). Keep them separate so private DMs stay negotiation-safe and public answers build listing credibility for everyone.

### Features

- Public Q&A section on listing detail (`/anuncios/[slug]`)
- Guests can **read**; asking requires auth (Buyer+)
- Seller (listing owner) can answer; optional “mark as official answer”
- Thread per listing (questions + answers visible to all visitors)
- Basic moderation: report question/answer; hide by REVIEWER/ADMIN; block spam / off-platform contact fishing
- Notifications to seller on new question; to asker on answer (depends on Phase 12)
- Soft rules in copy: no phone numbers / off-platform payment; nudge to Compra Garantizada for purchase

### Out of scope for 8b

- Replacing private Phase 8 messaging
- Real-time collaborative editing
- Anonymous posting (identity should remain a registered user for trust)

### Recommended timing

**Post-MVP**, after Phase 8 + Phase 12 notifications (so sellers are alerted). Can land before or beside Phase 14/15. Do **not** block settlement (10b–10d).

Result: Transparent pre-purchase answers on every listing.

Status: Not started.

---

# Phase 9 — Orders

Features

- Create order / reserve listing
- Order timeline
- Buyer / seller dashboards
- Order history / status
- Cancel order
- Receipt
- Invoices (future)
- **Party cards on order detail:** seller + buyer summary cards with avatar, name, member since, rating, and public counters (`total` / `active` / `bought`) — see Phase 3 Swappa-style strip

Result: Marketplace transactions (commercial shell).

Status: Complete as a **legacy shell** (Order model; Comprar reserves listing; `/compras` + `/ventas`; cancel restores `PUBLISHED`).

**Deprecated as settlement:** seller `completeOrder` / “Completar pedido” while merely `PAID`. That path **must die** in Phase 10d. Canonical completion is:

> Buyer pays → hold → buyer marks received → buyer confirms (or 24h) → TruePhone pays seller → completed

See `docs/FINANCIAL_MODEL.md` §4.

---

# Phase 10 — Payments (collection)

Features

- Buyer marketplace fee (**10%**; loyalty **8%** entitlement after seller cancel)
- Payment processing / confirmation (Wompi Checkout; cards enabled)
- Webhooks / failures
- Admin payment history
- Refund **requests** only — authorization lives in Financial Core (Phase 10b)

Result: Buyer collection works.

Status: **Partial / collect-only** (Payment + PaymentWebhookEvent; Wompi links + signed webhooks; mock provider). Fee engine + hold live in Phase 10b (10%). Seller “complete order” is retired as settlement.

Canonical rules: `docs/FINANCIAL_MODEL.md`.

---

# Phase 10b — Financial Core

Goal: Only the Financial Core moves money after collection.

Features

- Ledger (append-only)
- Hold after `PaymentApproved`
- Fee engine: 10% / 8% snapshots; Wompi 2.75%+IVA and 0.45%+IVA cost lines; **no** IVA on TruePhone’s % fee
- Buyer confirm + **24h auto-release** after buyer marks received
- Cancel rules: buyer cancel absorbs Wompi collection fee; **seller cancel / no-ship** → buyer chooses **one-time 8% replacement purchase** OR **refund** (not auto-refund)
- Battery policy (≤1% not refundable; >1% return full refund or keep)
- Chargebacks / failed payouts: TruePhone absorbs (Ledger + ops)
- Payouts: **Wompi Cuenta → seller bank account**; **MVP dispersion is manual in Wompi** (ops supervision after Financial Core authorizes)
- Dispute freeze
- Domain events; marketplace must not call payout/refund APIs directly
- **Automated** Pagos a Terceros API lotes → **Phase 24** (not MVP)

Result: Trusted settlement.

Status: **Core landed** (fee engine 10%/8%, Ledger, hold on payment, cancel money rules, payout adapter mock/manual/stub, seller `completeOrder` retired as settlement). Buyer “Ya recibí” + 24h window landed. **Seller bank UI (`/pagos`) + ops manual Wompi queue (`/revision/pagos` → Ya pagué en Wompi) landed.** Live API lotes deferred to Phase 24.

---

# Phase 10c — Shipping (MVP: Premium Bogotá + Carrier)

Goal: Device moves seller → buyer. Canonical rules: `docs/SHIPPING.md`.

### Methods (MVP)

1. **TruePhone Premium** — Bogotá only; TruePhone picks up, inspects, delivers; **seller pays $20,000 COP** (deducted at payout).
2. **Carrier** — Servientrega / Envía / other; seller pays carrier; **must upload tracking code** (visible to buyer). Required outside Bogotá; optional alternative inside Bogotá.

Drop-off points: **post-MVP**.

### Features

- Seller chooses method after payment (Bogotá: Premium or Carrier; else Carrier only); may switch Premium ↔ Carrier until tracking/inspection commitment (fee snapshot + ledger updated)
- Carrier: tracking code upload + buyer-visible tracking on order
- Premium: ops/admin pickup → inspection checklist → deliver; fee snapshot `20000`
- Shipment states + `deliveredAt` (buyer receipt ack; starts 24h clock)
- Events into Financial Core / Notifications

Suggested build order: **Carrier first** (national), then **Premium Bogotá**.

Status: **Landed** (Shipment + inspection models; seller method select + Premium↔Carrier switch until committed; Carrier tracking upload + buyer-visible code; buyer “Ya recibí” → 24h window; Premium ops inspection + $20k fee snapshot; buyer confirm / report).

---

# Phase 10d — Order lifecycle alignment

Goal: **Kill seller-driven completion.** Wire orders to the canonical settlement flow only.

Canonical:

> **Buyer pays → TruePhone holds → buyer marks received → buyer confirms (or 24h) → then TruePhone pays the seller.**

Features

- Order states: hold → shipping → delivered → awaiting confirm → payout → completed (plus cancel/dispute)
- **Checkout / purchase disclosure:** show the **24-hour** auto-release rule **when the buyer buys** (mandatory — `docs/FINANCIAL_MODEL.md` §5.1)
- Buyer confirmation UX after delivery
- 24h auto-release job
- Remove or disable seller “Completar pedido” as a settlement action
- Seller actions: choose Premium/Carrier, upload tracking, cooperate with Premium pickup
- Listing `SOLD` + reviews only after payout-completed (or Ledger ops exception)
- Timelines in UI match Financial Model §4

Status: **Landed** (24h disclosure at listing buy + pay CTA; order timeline hold → ship → received → confirm/24h → payout → completed; seller bank reminder when no default account; secured cron `GET /api/cron/buyer-confirm-expiry` + `vercel.json` hourly schedule; seller-complete already retired in 10b).

---

# Phase 11 — Reviews

Features

- Buyer reviews seller / seller reviews buyer
- Ratings
- Review moderation / reporting
- Trust score

Result: Marketplace reputation.

Status: Complete (order-tied reviews on `COMPLETED` orders; one review per participant; `sellerRating` / `totalReviews` + Vendedor de confianza thresholds; report + `/revision/resenas` moderation; public profile review list).

---

# Phase 12 — Notifications

Features

- Email + in-app notifications
- Preferences / unread indicators
- Activity center
- Push (future)
- **Settlement reminders:** buyer marked received → confirm CTA; countdown toward **24h** auto-release (complements checkout disclosure in Phase 10d)

Result: Users stay informed.

Status: **Settlement slice landed** (in-app + email on buyer «Ya recibí»; hourly cron reminders within 6h of deadline; `/notificaciones` activity center + preferences). Push and non-settlement event types remain future work.

---

# Phase 13 — Admin Panel

Features

- Dashboard
- User / listing / order / payment management
- Reports / analytics
- Reviewer management
- Roles / permissions
- System settings / audit logs
- **Recommended iPhone price table (LOCKED for MVP admin)**
  - Admin UI (table) to create/update **reference prices** by:
    - iPhone **model**
    - **Storage** (memory)
    - **Condition / physical state** (align with listing `Condition` enum)
  - Optional: notes, effective dates, min/max band
  - Used to show sellers a **pricing reference** in the sell flow (Phase 5 UI)
  - Does **not** force the seller’s price; guidance only
  - ADMIN (or REVIEWER if product allows) only

Result: Business operations + pricing intelligence for sellers.

Status: Price table slice landed (`RecommendedPrice` + admin CRUD at `/revision/precios`). Full admin dashboard still open.

---

# Phase 14 — Search Enhancement

Features

- Meilisearch
- Autocomplete / typo tolerance / synonyms
- Instant search
- Popular / recent / saved searches (future)

Result: Faster marketplace discovery (beyond V1 Postgres search).

---

# Phase 15 — Analytics

**Audience: ADMIN and REVIEWER / ops only.** There is **no** buyer/seller self-serve analytics dashboard. Everyday users get public **activity counters** on profiles and order cards (Phase 3) — not charts or funnels.

Features (ops / admin / reviewer)

- Revenue / GMV / conversion
- Listings / approval rate / review time
- Popular devices
- User / seller growth
- Search analytics
- Reviewer queue health (throughput, rejection reasons) — useful on `/revision` and admin dashboards (Phase 13)

Instrumentation for product decisions still follows PRD §54 (events), but surfaces belong to ops — not Mi TruePhone for buyers/sellers.

Result: Business / ops intelligence.

Status: Not started.

---

# Phase 16 — Advanced Trust

Features (beyond MVP verification already in Phases 4–6)

- Enhanced fraud detection
- Deeper IMEI / Activation Lock tooling
- Flag suspicious listings
- Reporting improvements
- Manual review upgrades

Result: Marketplace differentiation.

---

# Phase 17 — Performance

Tasks

- Image optimization / caching / streaming
- Lazy loading / bundle / code splitting
- Database indexing
- Performance monitoring

Result: Fast marketplace.

---

# Phase 18 — SEO

Tasks

- Metadata / Open Graph / Twitter Cards
- Sitemap / robots / structured data
- Canonical URLs / dynamic metadata
- Listing indexing
- Blog foundation (future)

Result: Organic growth.

---

# Phase 19 — Mobile Optimization

Goal: TruePhone is used primarily on **phones** in Colombia. Phase 1/7 already ship responsive layouts; this phase makes mobile the **primary** quality bar (not an afterthought).

**Scope:** Excellent **responsive web** (mobile browser). **Native apps** remain Phase 24.

Tasks

- Responsive improvements across browse, listing detail, sell wizard, orders, messaging
- Touch interactions / bottom sheets / thumb-zone CTAs
- Mobile navigation polish (bottom nav + header; safe areas)
- Image optimization (gallery swipe, LCP on listing pages)
- Form UX on small screens (sell flow, bank details, verification)
- Auth flows usable on mobile (prep for Apple / WhatsApp / Facebook from Phase 2 roadmap)
- **Tomar foto** (mobile web camera) — see below; do this properly in this phase, not as a Phase 5 leftover
- Offline / PWA (future stretch)

## Tomar foto (do this properly — not a one-attribute shortcut)

Sellers in Colombia often create listings on the phone they are selling. Phase 5 only has a file picker. Phase 19 must add an explicit camera path without breaking the gallery path.

**Surfaces**

| Surface                 | Route / form             | Camera               | Why                                                   |
| ----------------------- | ------------------------ | -------------------- | ----------------------------------------------------- |
| Listing gallery         | `/vender/…/fotos`        | Rear (`environment`) | Clear shots of the iPhone                             |
| Possession proof        | `/vender/…/posesion`     | Rear (`environment`) | Device + possession code in one frame                 |
| Cédula frente / reverso | `/verificacion/cedula-*` | Rear (`environment`) | Document on a flat surface                            |
| Selfie                  | `/verificacion/selfie`   | Front (`user`)       | Face match vs cédula (already hints `capture="user"`) |

**How to implement (acceptance)**

- Two visible Spanish actions on each photo step: **Elegir de la galería** and **Tomar foto**. Never a single control that sometimes opens the camera.
- Hide native browser chrome (**Choose File** / **no file selected**). Copy stays Spanish (`lang="es"`).
- On iOS/Android Safari/Chrome, **Tomar foto** must open the system camera (HTML `capture` on a dedicated input is enough if both actions exist).
- Gallery must always remain available. Do not force camera-only.
- On desktop, hide **Tomar foto** or let it fall back to the file picker (`capture` is ignored). Do not show a broken webcam UI.
- Prefer the existing [`FileInput`](../src/components/ui/file-input.tsx) (extend it) — no second upload component.
- Possession copy should remind the seller to photograph the **iPhone and the code together**.
- Test on a real iPhone (Safari) and an Android Chrome device, not only desktop DevTools.

**Out of scope (do not pull into Phase 19)**

- Custom in-browser `getUserMedia` viewfinder, filters, or multi-shot camera app
- Native iOS/Android camera SDK — Phase **24**
- Changing upload size/type rules or storage buckets
- Translating user-typed listing text

Result: Excellent mobile web UX, including camera capture for sell + KYC photos.

Status: Not started as a dedicated polish pass (baseline responsive exists from earlier phases). **Tomar foto** is specified here; implement when Phase 19 is the active line.

---

# Phase 20 — Testing

Tasks

- Unit / integration / e2e
- Accessibility / performance / security
- Visual regression

Result: Reliable software.

---

# Phase 21 — Security

Tasks

- Rate limiting / CSRF / XSS / injection defenses
- Audit logging / security headers
- Secrets management
- Permission testing / session hardening
- Fraud detection improvements

Result: Production-ready security.

---

# Phase 22 — Monitoring

Tasks

- Logging / error tracking
- Performance / database / uptime monitoring
- Alerts / analytics integration

Result: Operational visibility.

---

# Phase 23 — Launch Preparation

Tasks

- Privacy / Terms / Cookie policies
- **Support center / FAQ page** (canonical `/ayuda` or `/faq` — see below)
- Email templates / legal pages
- Production database / storage / domains
- Final QA / load testing

### FAQ page (canonical)

**Already planned here** (also teaser FAQ on Home per PRD §29; Help Center outline PRD §41). Ship a dedicated FAQ page before public launch marketing.

Suggested FAQ clusters (Spanish copy; English only in docs):

1. **Qué es TruePhone** — curated review, trust vs classifieds
2. **Comprar** — fee 10% / loyalty 8%, Compra Garantizada, 24h rule after “Ya recibí”
3. **Vender** — review process, identity verification, possession proof, recommended prices
4. **Envíos** — Premium Bogotá vs Carrier (link `docs/SHIPPING.md` rules in product language)
5. **Pagos y desembolsos** — hold, seller bank, when seller gets paid
6. **Seguridad** — IMEI, Activation Lock, fraud reporting
7. **Cuenta** — login methods, verification, deleting account

Link FAQ from footer, Help, and key empty states. Keep answers short; deep policy lives on legal pages.

Result: Launch-ready platform.

---

# Phase 24 — Post-Launch

Future features

- **Automated seller payouts via Wompi Pagos a Terceros API** (`POST /payouts` lotes + payout webhooks). MVP pays sellers **manually in the Wompi dashboard** after Financial Core authorizes — human supervision by design. Automation is feasible (API + keys already stubbed in code) when volume justifies removing the ops step; keep Ledger authorization as the only money gate either way.
- Wishlist / price alerts / offers
- BRE-B seller payouts (MVP is bank-only via Wompi Cuenta)
- Trade-in programs
- More Apple devices
- Premium seller tools
- **Native apps** (iOS / Android) — after Phase 19 mobile web is excellent. In-app camera SDK belongs here; Phase 19 is mobile-web **Tomar foto** only.
- AI assistants
- Referral / affiliate
- Business sellers / API
- International expansion
- Passkeys / advanced auth if not landed in Phase 21

---

# Success Criteria

Every completed phase should satisfy:

- Production-quality code for that phase’s scope
- Documentation updated
- Responsive and accessible where UI ships
- Phase-appropriate tests
- Secure defaults for new surfaces
- Deployable

Review before moving to the next phase.

---

# Final Goal

TruePhone is not being built to become the largest marketplace.

It is being built to become the most trusted marketplace for buying and selling used iPhones.

Every phase should move the product closer to that goal.
