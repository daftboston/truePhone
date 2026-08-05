# Code Documentation Examples

## File header — before

```typescript
import { prisma } from "@/lib/db";

type EnsureProfileInput = {
  authUserId: string;
  fullName?: string | null;
};

export async function ensureProfile({ authUserId, fullName }: EnsureProfileInput) {
```

## File header — after

```typescript
/**
 * @file profile.ts
 * @description Links Supabase Auth users to Prisma Profile rows.
 * @dependencies @/lib/db (prisma)
 */

import { prisma } from "@/lib/db";

type EnsureProfileInput = {
  authUserId: string;
  fullName?: string | null;
};

/**
 * ensureProfile
 *
 * Returns an existing Profile or creates one with role BUYER.
 *
 * @param input.authUserId - Supabase auth user UUID.
 * @param input.fullName - Optional name; backfills when profile has no fullName.
 * @returns Profile row from Prisma.
 * @calledBy registerAction, loginAction, auth/callback/route, getCurrentProfile
 * @consumers profile actions, session helpers, listing ownership checks
 */
export async function ensureProfile({ authUserId, fullName }: EnsureProfileInput) {
```

---

## Internal comments — good

```typescript
export async function registerAction(_prev: AuthActionState, formData: FormData) {
  const parsed = registerSchema.safeParse({ ... });
  if (!parsed.success) {
    return { ok: false, error: "...", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const origin = await getRequestOrigin();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ ... });

  if (error) {
    return { ok: false, error: authErrorMessage(error.message) };
  }

  // Mirror auth user into application profiles table
  if (data.user) {
    await ensureProfile({ authUserId: data.user.id, fullName: parsed.data.fullName });
  }

  // Confirmed session — skip email verification UI
  if (data.session) {
    redirect("/perfil");
  }

  return { ok: true, message: "Te enviamos un correo..." };
}
```

Note: the `message` string is Spanish UI copy — allowed by the consistency rule.

---

## Internal comments — avoid

```typescript
// Get supabase client
const supabase = await createClient();

// Call signUp
const { data, error } = await supabase.auth.signUp({ ... });

// Check if error exists
if (error) {
```

---

## React component

```tsx
/**
 * @file RegisterForm.tsx
 * @description Client form for email/password registration.
 * @dependencies registerAction, auth schemas, design-system Button
 */

/**
 * RegisterForm
 *
 * Collects signup fields and submits to registerAction.
 *
 * @returns Form with validation errors and success message state.
 * @calledBy src/app/(auth)/register/page.tsx
 */
export function RegisterForm() {
  // ...
}
```

---

## Small helper — still document

Even short utilities need the function block (header optional on tiny single-export files if the export doc is sufficient):

```typescript
/**
 * safeNextPath
 *
 * Restricts post-login redirects to same-origin relative paths.
 *
 * @param next - Raw `next` query param from login/register.
 * @returns Sanitized path defaulting to `/`.
 * @calledBy loginAction, signInWithGoogleAction, auth/callback/route
 */
export function safeNextPath(next: string | null | undefined): string {
```
