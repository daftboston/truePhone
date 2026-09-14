/**
 * @file route.ts
 * @description Supabase Auth code exchange callback; ensures Profile then redirects.
 * @dependencies ensureProfile, safeNextPath, createClient, legal acceptance
 */

import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

import { safeNextPath } from "@/features/auth/types";
import { ensureProfile, getProfileByAuthUserId } from "@/lib/auth/profile";
import {
  LEGAL_SIGNUP_PENDING_COOKIE,
  recordLegalAcceptance,
} from "@/lib/legal/acceptance";
import { getRequestAuditMeta } from "@/lib/legal/request-meta";
import { createClient } from "@/lib/supabase/server";

/**
 * GET
 *
 * Exchanges ?code for a session, mirrors the user into Profile, redirects to next.
 * Records signup legal acceptance when the register-flow cookie is present.
 *
 * @param request - Callback request with code and optional next query params.
 * @returns Redirect to next path or /login?error=auth_callback.
 * @calledBy Supabase Auth email/OAuth redirects
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const meta = data.user.user_metadata ?? {};
      const given =
        typeof meta.given_name === "string" ? meta.given_name.trim() : "";
      const family =
        typeof meta.family_name === "string" ? meta.family_name.trim() : "";
      const combinedName = [given, family].filter(Boolean).join(" ");
      const fullName =
        typeof meta.full_name === "string" && meta.full_name.trim()
          ? meta.full_name.trim()
          : typeof meta.name === "string" && meta.name.trim()
            ? meta.name.trim()
            : combinedName || null;

      const existingProfile = await getProfileByAuthUserId(data.user.id);
      const profile =
        existingProfile ??
        (await ensureProfile({
          authUserId: data.user.id,
          fullName,
        }));

      const cookieStore = await cookies();
      const pendingSignupLegal =
        cookieStore.get(LEGAL_SIGNUP_PENDING_COOKIE)?.value === "1";
      if (pendingSignupLegal) {
        const audit = getRequestAuditMeta(await headers());
        await recordLegalAcceptance({
          userId: profile.id,
          source: "signup",
          ipAddress: audit.ipAddress,
          userAgent: audit.userAgent,
        });
        cookieStore.delete(LEGAL_SIGNUP_PENDING_COOKIE);
      }

      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth_callback", origin));
}
