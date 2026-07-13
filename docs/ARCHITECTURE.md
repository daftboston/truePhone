**Project:** TruePhone  
**Version:** 1.1  
**Status:** Draft  
**Last Updated:** July 2026  
**Visual tokens:** [Figma](https://www.figma.com/design/nloCtrpFAgGr85fhmFoHzJ/Untitled?node-id=0-1) (look only; business logic is plan.md + PRD)

---

# 1. Purpose

This document defines the software architecture of TruePhone.

It explains **how the platform should be built**, **why architectural decisions were made**, and **the engineering principles that must guide future development**.

This document is the technical constitution of the project.

Every engineer, designer, product manager, and AI coding assistant working on TruePhone should understand and follow these principles before contributing code.

When implementation details conflict with these principles, the principles take precedence.

---

# 2. Engineering Philosophy

TruePhone is not being built as a prototype.

It is being built as a long-term software platform capable of supporting millions of users, thousands of daily transactions, and years of continuous development.

Every architectural decision should optimize for:

- Maintainability
- Scalability
- Reliability
- Security
- Performance
- Developer Experience
- User Experience

We intentionally avoid shortcuts that create technical debt unless there is a clearly documented business reason.

Code should be written as if another engineer will maintain it five years from now.

---

# 3. Architecture Principles

These principles guide every engineering decision.

---

## 3.1 Trust First

Trust is the company's competitive advantage.

The architecture must support trust through:

- Secure authentication
- Data integrity
- Auditability
- Manual review workflows
- Reliable transactions
- Transparent business logic

If a technical shortcut weakens trust, it should not be implemented.

---

## 3.2 Simplicity Over Cleverness

Prefer solutions that are easy to understand.

Avoid unnecessary abstraction.

Avoid premature optimization.

Avoid complex patterns when simpler solutions are sufficient.

Readable code is more valuable than clever code.

---

## 3.3 Server-First Architecture

Rendering should occur on the server whenever possible.

Client-side JavaScript should only be added when it provides clear user value.

Benefits include:

- Better SEO
- Faster initial page loads
- Smaller JavaScript bundles
- Lower hydration costs
- Improved security
- Better caching opportunities

The browser should receive only the JavaScript required for interactivity.

---

## 3.4 Feature-Based Development

The application should be organized around business domains rather than technical layers.

For example:

- Listings
- Orders
- Messages
- Reviews
- Authentication
- Favorites

Each feature should own its own components, actions, validation, and business logic.

This reduces coupling and improves maintainability.

---

## 3.5 Strong Typing Everywhere

TypeScript should be used throughout the project.

Avoid the use of `any`.

Types should represent the business domain accurately.

Shared types should live in well-defined locations.

Compile-time safety is preferred over runtime debugging.

---

## 3.6 Reuse Before Reinvention

Before creating new code, determine whether an existing solution already exists.

Prefer:

- Reusable components
- Shared utilities
- Common hooks
- Shared validation schemas

Avoid duplicate implementations.

---

## 3.7 Explicit Over Implicit

Code should be obvious.

Avoid hidden behavior.

Avoid "magic."

Business logic should be easy to discover and understand.

---

## 3.8 Progressive Enhancement

The application should remain usable even when advanced browser features are unavailable.

Enhancements should improve the experience without becoming mandatory whenever practical.

---

# 4. Product Architecture

TruePhone follows a layered architecture.

```
┌───────────────────────────────┐
│           Browser             │
└───────────────┬───────────────┘
                │
┌───────────────▼───────────────┐
│      Next.js Application      │
│                               │
│  Server Components            │
│  Client Components            │
│  Server Actions               │
│  Route Handlers               │
└───────────────┬───────────────┘
                │
┌───────────────▼───────────────┐
│      Business Logic Layer     │
│                               │
│ Services                      │
│ Validation                    │
│ Permissions                   │
│ Domain Rules                  │
└───────────────┬───────────────┘
                │
┌───────────────▼───────────────┐
│       Data Access Layer       │
│                               │
│ Prisma ORM                    │
│ PostgreSQL                    │
│ Supabase                      │
└───────────────┬───────────────┘
                │
┌───────────────▼───────────────┐
│      External Services        │
│                               │
│ Auth                          │
│ Storage                       │
│ Email                         │
│ Analytics                     │
│ Payments                      │
└───────────────────────────────┘
```

Each layer has a single responsibility.

Layers should communicate through well-defined interfaces.

Business rules should never leak into presentation components.

---

# 5. High-Level System Overview

TruePhone is a modern web application built using a server-first architecture.

Core responsibilities include:

- User authentication
- Marketplace listings
- Manual review workflow
- Messaging
- Orders
- Reviews
- Payments
- Administration

The application consists of:

- Public website
- Authenticated marketplace
- Reviewer portal
- Administrative portal

These experiences share the same codebase while maintaining clear separation of responsibilities.

---

# 6. Technology Stack

Technology choices should prioritize stability, developer productivity, long-term maintenance, and scalability.

Every dependency introduced into the project should solve a real problem.

---

## Frontend

### Next.js

Primary web framework.

Chosen because it provides:

- App Router
- React Server Components
- Server Actions
- Excellent SEO
- Streaming
- Route-level code splitting
- Built-in optimization
- Strong Vercel integration

Next.js is the foundation of the application architecture.

---

### React

Responsible for building reusable user interfaces.

Component composition is preferred over inheritance.

Interfaces should remain declarative and predictable.

---

### TypeScript

Provides static typing across the entire codebase.

Benefits include:

- Better tooling
- Safer refactoring
- Reduced runtime bugs
- Improved developer experience

Type safety is considered a core architectural requirement.

---

### Tailwind CSS

Utility-first styling system.

Chosen because it provides:

- Consistent design
- Fast development
- Small production bundles
- Easy design token integration

Custom CSS should be minimized.

Shared design tokens should drive visual consistency.

---

### shadcn/ui

Primary component foundation.

Chosen because:

- Components are owned by the project
- Fully customizable
- Accessible by default
- No runtime dependency
- Easy to extend

Components should be customized to match the TruePhone Design System.

---

### React Hook Form

Provides performant and scalable form management.

Especially useful for:

- Multi-step forms
- Validation
- Draft saving
- Dynamic fields

---

### Zod

Single source of truth for validation.

Validation schemas should be shared between client and server whenever possible.

Never duplicate validation logic.

---

### Framer Motion

Used for meaningful animations.

Animations should support usability rather than decoration.

Subtle motion improves perceived quality without distracting users.

---

# 7. Backend Technology

TruePhone uses a Backend-for-Frontend (BFF) architecture powered by Next.js.

Instead of maintaining a completely separate backend application, business logic lives close to the features that use it while remaining properly separated from the UI.

This approach reduces complexity, improves type safety, and simplifies deployment.

---

### Server Actions

Server Actions are the preferred mechanism for data mutations.

Use Server Actions for:

- Creating listings
- Updating profiles
- Sending messages
- Creating orders
- Saving favorites
- Leaving reviews

Benefits include:

- End-to-end type safety
- Simpler architecture
- Reduced API boilerplate
- Better integration with React Server Components

---

### Route Handlers

Use Route Handlers only when HTTP endpoints are required.

Examples include:

- Third-party webhooks
- Public APIs
- Payment provider callbacks
- Mobile application APIs
- External integrations

Internal UI interactions should prefer Server Actions.

---

# 8. Why This Architecture?

TruePhone is intentionally designed to optimize for:

- Developer productivity
- Long-term maintainability
- Performance
- Scalability
- Security
- SEO
- Accessibility

This architecture minimizes unnecessary complexity while leaving room for future growth.

It allows a small engineering team to build and maintain a sophisticated marketplace without managing multiple independent backend services prematurely.

As the platform evolves, services can be extracted gradually if operational requirements justify the added complexity.

Until then, the architecture favors simplicity, clear boundaries, and excellent developer experience.

---

# 9. Architecture Goals

The architecture is considered successful if it enables the team to:

- Ship features quickly without sacrificing quality.
- Scale the platform without major rewrites.
- Maintain a consistent codebase over time.
- Protect user data and marketplace integrity.
- Deliver a fast, reliable user experience.
- Onboard new developers with minimal friction.
- Allow AI coding assistants to understand and extend the system consistently.

Every architectural decision should support these goals.

When evaluating new technologies or patterns, ask:

- Does this reduce complexity?
- Does this improve maintainability?
- Does this improve scalability?
- Does this strengthen security?
- Does this improve the developer experience?
- Does this improve the user experience?

If the answer is "no," the change should be reconsidered.

---

# 10. Folder Structure

```
src/
  app/                 # Next.js App Router (routes, layouts)
  components/
    ui/                # shadcn / shared primitives
    providers/         # Theme and other client providers
  features/            # Domain modules (auth, listings, reviews, …)
    <domain>/
      actions/         # Server Actions
      components/      # Feature-specific UI
      schemas/         # Zod schemas
  hooks/               # Shared React hooks
  lib/                 # Shared utilities (cn, db client, supabase)
  services/            # Domain services / integrations
  types/               # Shared TypeScript types
```

Rules:

- Prefer `src/lib/` for shared helpers. Do not grow a parallel `src/utils/` tree.
- Feature code lives under `src/features/<domain>/`.
- Do not put business logic in `src/components/ui`.
- Server Components by default; Client Components only for interactivity.

---

# 11. Supabase Role

Supabase provides:

| Concern    | Use                                                         |
| ---------- | ----------------------------------------------------------- |
| PostgreSQL | Primary database (Prisma)                                   |
| Auth       | Email/password + Google (Phase 2)                           |
| Storage    | Listing images, verification photos (ID, device possession) |

Prisma talks to Postgres via:

- `DATABASE_URL` — pooled connection (runtime / app)
- `DIRECT_URL` — direct connection (migrations / `db push`)

Do not bypass Prisma for routine app queries. Use the Supabase client for Auth and Storage.

---

# 12. Authentication (Phase 2)

- Provider: **Supabase Auth**
- Sessions: server-readable cookies via Supabase SSR helpers
- Profile row in `profiles` linked by `authUserId`
- Roles: `BUYER`, `SELLER`, `REVIEWER`, `ADMIN` (enforced in Server Actions + RLS later)
- Protected routes check session on the server before rendering sensitive pages

---

# 13. Data Access Patterns

## Server Actions

Preferred for UI mutations:

- Create / update listings
- Submit for review
- Approve / reject
- Favorites, messages, orders, reviews

## Route Handlers

Use only when HTTP endpoints are required:

- Payment webhooks
- External integrations
- Public machine APIs

## Validation

- **Zod** as the single validation source
- Share schemas between client forms and Server Actions
- **React Hook Form** for multi-step and complex forms (listing creation, verification)

---

# 14. Search Strategy

| Stage            | Approach                                           |
| ---------------- | -------------------------------------------------- |
| V1 (Phase 7)     | Postgres filters + `searchVector` / Prisma queries |
| Later (Phase 14) | Meilisearch for typo tolerance and instant search  |

Do not introduce Meilisearch before V1 browse/search works.

---

# 15. Environment Variables

See `.env.example`:

| Variable                        | Purpose                           |
| ------------------------------- | --------------------------------- |
| `DATABASE_URL`                  | Prisma runtime (PgBouncer pooler) |
| `DIRECT_URL`                    | Prisma migrate / db push          |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (browser-safe)    |

Server-only secrets (service role, payment keys) must never use the `NEXT_PUBLIC_` prefix.

---

# 16. Deployment

- Hosting: **Vercel**
- CI: GitHub Actions (format, lint, typecheck, build)
- Preview deployments per PR once Vercel is linked

---

# 17. Related Documents

- `docs/plan.md` — phase order and MVP
- `docs/DATABASE.md` — schema and listing lifecycle
- `docs/API.md` — Server Actions / Route Handler conventions
- `docs/DESIGN_SYSTEM.md` — visual tokens
