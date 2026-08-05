---
name: code-documentation
description: Enforces file headers, function documentation, internal comments, and English-only code comments for TruePhone. Use when writing, editing, or reviewing any source file, adding new functions, or when the user asks for documentation standards.
---

# Code Documentation

## Rule

All code must be well documented.

## File Header

At the top of every file, include:

- File name
- Brief description of its purpose
- Author and date (optional)
- Dependencies or modules used
- Changelog (optional, for major updates)

## Function Documentation

Above every function, include:

- Function name
- Clear description of what it does
- Parameters (name, type, purpose)
- Return value (type and meaning)
- How it connects with other functions (who calls it, who consumes its output)
- Example usage (optional, for public functions)

## Internal Comments

Inside functions, add short comments for logical blocks.

Avoid redundant comments (don't explain obvious syntax).

Focus on clarifying intent and complex logic.

## Consistency Rule

All code, comments, and documentation must be written in English.

Exception: UX/UI text visible to the consumer can be localized (e.g., Spanish for your app users).

Maintain consistent tense and style (use imperative verbs like "Handles…", "Returns…").

---

## When to Apply

Apply this skill when:

- Creating a new file
- Adding or changing functions, hooks, server actions, or components
- Reviewing PRs or refactors
- The user mentions documentation, comments, or code standards

## Scope

| Apply to | Skip |
| -------- | ---- |
| `src/**`, `prisma/**`, `supabase/**`, scripts | `node_modules`, generated files, lockfiles |
| New logic and non-trivial edits | One-line typo fixes with no behavior change |

Do not add file headers or function docs to files you did not touch unless the user asks for a documentation pass.

## Templates

### TypeScript / TSX file header

```typescript
/**
 * @file profile.ts
 * @description Ensures a Prisma Profile row exists for each Supabase auth user.
 * @dependencies prisma, @/lib/db
 */
```

Optional metadata:

```typescript
/**
 * @author TruePhone Team
 * @date 2026-07-31
 * @changelog 2026-07-31 — Added lazy profile creation on login.
 */
```

### Function / method block

Use JSDoc for TypeScript. Imperative verbs in descriptions.

```typescript
/**
 * ensureProfile
 *
 * Creates or returns the Profile linked to a Supabase auth user.
 *
 * @param input.authUserId - Supabase `auth.users.id` UUID.
 * @param input.fullName - Display name from signup metadata; updates empty profiles.
 * @returns The existing or newly created Profile row.
 * @calledBy registerAction, loginAction, getCurrentProfile
 * @consumers profile actions, listing seller resolution
 *
 * @example
 * await ensureProfile({ authUserId: user.id, fullName: "Ana" });
 */
```

For React components:

```typescript
/**
 * ListingCard
 *
 * Renders a marketplace listing summary on browse and search pages.
 *
 * @param props.listing - Published listing with images and seller summary.
 * @returns A linked card; null when listing is missing required display fields.
 * @calledBy MarketplaceGrid, FavoritesList
 */
```

### Server Actions (`"use server"`)

Document the action like a function. Note auth requirements and redirects.

```typescript
/**
 * registerAction
 *
 * Registers a user via Supabase Auth and creates their Profile.
 *
 * @param _prev - Previous form state from useActionState.
 * @param formData - fullName, email, password, confirmPassword.
 * @returns AuthActionState on validation or auth errors; redirects on success.
 * @calledBy RegisterForm
 */
```

### Internal comments

Comment **blocks**, not every line:

```typescript
// Validate input before touching Supabase
const parsed = registerSchema.safeParse({ ... });

// Email confirmation disabled — session exists, send user to profile
if (data.session) {
  redirect("/perfil");
}
```

### SQL / Prisma migrations

```sql
-- @file 20260715000000_init.sql
-- @description Initial TruePhone schema: profiles, listings, messages.
-- @dependencies PostgreSQL 15+, Supabase
```

## Checklist

Before finishing a change:

- [ ] File header present on new or substantially edited files
- [ ] Every new or changed function has a doc block (name, description, params, return, connections)
- [ ] Non-obvious logic has block comments; no noise on obvious syntax
- [ ] Comments and docs are English; user-facing UI strings may stay Spanish
- [ ] Descriptions use imperative style ("Returns…", "Handles…", "Validates…")

## Anti-patterns

- Documenting `const x = 1` or standard imports
- Spanish in code comments (UI copy is the exception)
- Stale `@calledBy` / `@consumers` after refactors — update or remove
- Duplicating TypeScript types in prose when `@param` types are enough

## Examples

See [examples.md](examples.md) for before/after samples in this codebase.
