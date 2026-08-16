/**
 * @file proxy.ts
 * @description Next.js request proxy entry that refreshes the Supabase auth session.
 * @dependencies next/server, @/lib/supabase/proxy
 */

import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

/**
 * proxy
 *
 * Delegates each matched request to updateSession for cookie-based auth refresh.
 *
 * @param request - Incoming NextRequest.
 * @returns NextResponse from the Supabase session updater.
 * @calledBy Next.js proxy/middleware runtime
 * @consumers All matched app routes (see config.matcher)
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - common static image extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
