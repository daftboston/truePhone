# API.md

**Project:** TruePhone  
**Version:** 1.0  
**Last Updated:** July 2026

---

# Purpose

TruePhone prefers **Server Actions** over a large public REST surface.

This document defines when to use Server Actions vs Route Handlers, and how to structure them.

---

# Principles

1. Mutations from the UI use Server Actions.
2. Route Handlers exist only when an HTTP endpoint is required.
3. Validate every input with **Zod**.
4. Enforce auth and roles on the server — never trust the client.
5. Return typed, predictable results (`{ ok: true, data } | { ok: false, error }`).
6. Log sensitive marketplace actions for auditability.

---

# Server Actions

Preferred for:

- Auth-adjacent profile updates
- Creating / editing listings
- Submitting device possession proof
- Reviewer approve / reject
- Favorites, messages, orders, reviews
- Notification preferences

## Conventions

- File under `src/features/<domain>/actions/`
- Mark with `"use server"`
- Revalidate paths/tags after successful mutations
- Keep actions thin: validate → authorize → call service → return result

## Example shape

```ts
"use server";

export async function submitListingForReview(input: unknown) {
  const parsed = submitListingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "INVALID_INPUT" };
  }
  // authorize + mutate…
  return { ok: true as const, data: { listingId: "…" } };
}
```

---

# Route Handlers

Use `src/app/api/**/route.ts` for:

| Endpoint type         | Example                     |
| --------------------- | --------------------------- |
| Payment webhooks      | Stripe / Wompi callbacks    |
| External integrations | Identity vendor webhooks    |
| Public machine APIs   | Future mobile / partner API |

Do **not** create Route Handlers for ordinary form posts from the Next.js UI.

---

# Auth in handlers and actions

- Resolve the Supabase session on the server
- Load `Profile` by `authUserId`
- Check `UserRole` before reviewer/admin operations
- Return `UNAUTHORIZED` / `FORBIDDEN` without leaking internals

---

# Errors

Use stable error codes for the UI:

- `UNAUTHORIZED`
- `FORBIDDEN`
- `INVALID_INPUT`
- `NOT_FOUND`
- `CONFLICT` (e.g. invalid listing state transition)
- `INTERNAL`

User-facing copy follows `docs/COPY_GUIDELINES.md`.

---

# Versioning

Internal Server Actions are not versioned.

If a public HTTP API is added later, version it under `/api/v1/…` and document endpoints here.

---

# Related

- `docs/ARCHITECTURE.md` — BFF and stack
- `docs/DATABASE.md` — state machines and models
- `docs/plan.md` — when domains ship
