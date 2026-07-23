# PLAN.md

# TruePhone Development Plan

Version 1.1

**Visual design reference:** [Figma](https://www.figma.com/design/nloCtrpFAgGr85fhmFoHzJ/Untitled?node-id=0-1) (tokens / look only)  
**Brand:** TruePhone (former working name iPhoneSeguro is retired)  
**Business logic source:** this file + `docs/PRD.md` — not Figma

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
| Colors, type, spacing, component look | `docs/DESIGN_SYSTEM.md` + Figma + `src/app/globals.css` |

Figma is used only to absorb the **design system** (visual language).

Do **not** infer product rules, workflows, or feature priority from Figma frames. Ignore legacy “iPhoneSeguro” labels in Figma.

---

# MVP Definition

MVP is complete when Phases **0–11** are done and PRD §28 acceptance criteria are met:

- Users can register
- Sellers can create listings (including device possession proof)
- Listings require manual review
- Reviewers can approve or reject
- Approved listings become public
- Buyers can search and browse listings
- Buyers can purchase devices
- Sellers receive payment after successful completion
- Both parties can review each other
- Important actions are logged
- Workflows prioritize trust over speed

Seller identity verification (cédula + facial) is part of MVP (Phase 4).

---

# Phase Exit Criteria

| Phases | Exit bar                                                                    |
| ------ | --------------------------------------------------------------------------- |
| 0–1    | Lint, typecheck, format, CI green; design tokens in place; deployable shell |
| 2–4    | Auth + profiles + identity verification work end-to-end on staging          |
| 5–7    | Create → review → publish → browse/search works with real data              |
| 8–11   | Order + payment + reviews complete a full purchase loop                     |
| 12+    | Phase-specific quality gates (tests, SEO, monitoring as listed)             |

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

Features

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

Result: Complete authentication system.

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

Result: Professional user identities.

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
- Image upload
- Device information, condition, battery health, accessories
- Description
- IMEI validation / last-4 handling
- Activation Lock confirmation
- **Device possession verification** (one-time code + photo of device with code)
- Preview / submit for review
- Edit / delete draft

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

| Item                                               | Status   | When to do it            | Notes                                                                        |
| -------------------------------------------------- | -------- | ------------------------ | ---------------------------------------------------------------------------- |
| **Filter listing colors by selected iPhone model** | **Done** | Completed before Phase 7 | `IphoneModelColor` join + seed mappings + wizard filter + server validation. |

---

# Phase 6 — Review Portal

Goal: Human review workflow for pending listings.

Features

- Reviewer dashboard / cola de revisión
- Tabs: Pendiente / En revisión / Aprobados / Rechazados / Todos
  - **Pendiente:** `PENDING_REVIEW` without assigned `reviewerId`
  - **En revisión:** `PENDING_REVIEW` with `reviewerId` (claimed on open)
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

Result: Communication inside the platform.

Status: Complete (listing CTAs, seller↔reviewer chat, inbox + unread badges, block/report UI, light poll).

Pre–Phase 9 hardening: listing lifecycle docs aligned (`approve` → `PUBLISHED`); messaging access smoke tests in `src/lib/messages-access.test.ts` (`npm test`).

---

# Phase 9 — Orders

Features

- Create order / reserve listing
- Order timeline
- Buyer / seller dashboards
- Order history / status
- Cancel / complete order
- Receipt
- Invoices (future)

Result: Marketplace transactions.

Status: Complete (Order model; Comprar reserves listing; `/compras` + `/ventas`; cancel restores `PUBLISHED`; seller complete → `SOLD`. Payment processing is Phase 10).

---

# Phase 10 — Payments

Features

- Buyer Protection Fee
- Payment processing / confirmation
- Refund flow
- Payment history
- Webhooks / failures
- Admin payment dashboard
- Future escrow support

Result: Monetization.

Status: Complete (Payment + PaymentWebhookEvent; Wompi payment links + signed webhooks; mock provider for local; checkout from reserved order charges snapshotted total; `AWAITING_PAYMENT` → `PAID` → `COMPLETED`; `/revision/pagos` admin history).

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

Result: Users stay informed.

---

# Phase 13 — Admin Panel

Features

- Dashboard
- User / listing / order / payment management
- Reports / analytics
- Reviewer management
- Roles / permissions
- System settings / audit logs

Result: Business operations.

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

Features

- Revenue / GMV / conversion
- Listings / approval rate / review time
- Popular devices
- User / seller growth
- Search analytics

Result: Business intelligence.

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

Tasks

- Responsive improvements
- Touch interactions / bottom sheets
- Mobile navigation polish
- Image optimization
- Offline / PWA (future)

Result: Excellent mobile UX.

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
- Support center / FAQ
- Email templates / legal pages
- Production database / storage / domains
- Final QA / load testing

Result: Launch-ready platform.

---

# Phase 24 — Post-Launch

Future features

- Wishlist / price alerts / offers
- Trade-in / escrow / shipping
- More Apple devices
- Premium seller tools
- Native apps
- AI assistants
- Referral / affiliate
- Business sellers / API
- International expansion

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
