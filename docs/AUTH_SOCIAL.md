# AUTH_SOCIAL.md

**Product:** TruePhone  
**Scope:** Google Sign-In via Supabase Auth (web / Next.js). Apple / WhatsApp / Facebook are deferred.  
**Code:** Google button on `/login` and `/registro`; callback at `/auth/callback`

> App code does not store Google secrets. Those live in the Supabase Auth dashboard and Google Cloud.

Related: `docs/plan.md` Phase 2, official guide: [Supabase — Google](https://supabase.com/docs/guides/auth/social-login/auth-google)

---

# 1. How TruePhone uses Google login

| Layer         | What happens                                                                       |
| ------------- | ---------------------------------------------------------------------------------- |
| UI            | `/login` and `/registro` show **Continuar con Google**                             |
| Server Action | `signInWithGoogleAction` → `supabase.auth.signInWithOAuth({ provider: "google" })` |
| Redirect back | Google → Supabase → `https://<your-site>/auth/callback?code=…&next=…`              |
| Profile       | Callback creates/updates a Prisma `Profile` (`ensureProfile`)                      |

Email + password stays available. Seller **KYC (cédula + selfie)** is still required before publishing — login method does not replace identity verification.

---

# 2. Shared Supabase settings (do this once)

In the [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Authentication**:

### 2.1 Site URL

| Environment | Site URL                                                                        |
| ----------- | ------------------------------------------------------------------------------- |
| Local       | `http://localhost:3000` (or `http://127.0.0.1:3000` — pick one and stick to it) |
| Production  | `https://truephone.co` (or your live domain)                                    |

Also set in Vercel / `.env`:

```bash
NEXT_PUBLIC_SITE_URL=https://truephone.co
```

### 2.2 Redirect URLs (allow list)

```text
http://localhost:3000/auth/callback
http://127.0.0.1:3000/auth/callback
https://true-phone.vercel.app/auth/callback
https://*.vercel.app/auth/callback
https://truephone.co/auth/callback
https://www.truephone.co/auth/callback
```

(Use your real domains.)

### 2.3 Callback URL for Google Cloud

Google redirects to **Supabase**, not directly to TruePhone:

```text
https://<PROJECT_REF>.supabase.co/auth/v1/callback
```

Find `PROJECT_REF` in **Project Settings → General → Reference ID**.

---

# 3. Google Sign-In (setup)

### 3.1 Google Cloud

1. Open [Google Cloud Console](https://console.cloud.google.com/) → create or select a project (e.g. `TruePhone`).
2. Configure the OAuth consent screen:
   - User type: **External** (unless you have a Workspace org-only app).
   - App name: **TruePhone**.
   - Support email: your team email.
3. **Clients** → **Create client** → Application type **Web application**.
4. **Authorized redirect URIs** — **required**:
   - `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
5. Copy **Client ID** and **Client Secret**.

### 3.2 Supabase → Authentication → Providers → Google

1. Enable Google.
2. Paste **Client ID** and **Client Secret**.
3. Save.

### 3.3 Verify

1. `npm run dev` with env pointing at that Supabase project.
2. Open `/login` → **Continuar con Google**.
3. Complete consent → land on `/perfil` (or `next` path).
4. Confirm a `profiles` row exists for that `auth_user_id`.

---

# 4. Production checklist

| Step                                                            | Owner         | Done |
| --------------------------------------------------------------- | ------------- | ---- |
| `NEXT_PUBLIC_SITE_URL` = production domain                      | Vercel env    | [ ]  |
| Supabase Site URL + Redirect URLs include prod `/auth/callback` | Supabase Auth | [ ]  |
| Google Web client redirect = Supabase `/auth/v1/callback`       | Google Cloud  | [ ]  |
| Google enabled in Supabase Providers                            | Supabase      | [ ]  |
| Smoke test Google on production                                 | QA            | [ ]  |

---

# 5. Local development notes

- Google against a **hosted Supabase project** works from localhost if Redirect URLs include `http://localhost:3000/auth/callback`.
- You do **not** put Google Client Secret in the Next.js `.env` — only Supabase URL + anon key.
- If Google is disabled in Supabase, the button still appears; the action fails with a Spanish error.

---

# 6. Code map

| File                                                                                                                  | Role                                 |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| [`src/features/auth/components/google-sign-in-button.tsx`](../src/features/auth/components/google-sign-in-button.tsx) | Google button                        |
| [`src/features/auth/actions/auth.ts`](../src/features/auth/actions/auth.ts)                                           | `signInWithGoogleAction`             |
| [`src/app/auth/callback/route.ts`](../src/app/auth/callback/route.ts)                                                 | PKCE code exchange + `ensureProfile` |
| [`src/lib/auth/profile.ts`](../src/lib/auth/profile.ts)                                                               | Creates `Profile` for new auth users |

---

# 7. Deferred (not live)

| Method              | Status                                                                                                                                                                      |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Apple Sign-In       | Deferred. Helper code may exist in-repo; do not show in UI until product asks. Setup notes: [Supabase Apple](https://supabase.com/docs/guides/auth/social-login/auth-apple) |
| WhatsApp / Facebook | Post-MVP per `docs/plan.md` Phase 2                                                                                                                                         |
