/**
 * @file route.ts
 * @description Supabase Auth code exchange callback; ensures Profile then redirects.
 * @dependencies ensureProfile, safeNextPath, createClient
 */

import { NextResponse } from "next/server";

import { ensureProfile } from "@/lib/auth/profile";
import { safeNextPath } from "@/features/auth/types";
import { createClient } from "@/lib/supabase/server";

/**
 * GET
 *
 * Exchanges ?code for a session, mirrors the user into Profile, redirects to next.
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
      await ensureProfile({
        authUserId: data.user.id,
        fullName:
          typeof data.user.user_metadata?.full_name === "string"
            ? data.user.user_metadata.full_name
            : typeof data.user.user_metadata?.name === "string"
              ? data.user.user_metadata.name
              : null,
      });

      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth_callback", origin));
}
