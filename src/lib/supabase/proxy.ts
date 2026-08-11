/**
 * @file proxy.ts
 * @description Middleware session refresh and route auth redirects for Supabase.
 * @dependencies @supabase/ssr, next/server, @/features/auth/types, @/lib/env
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { safeNextPath } from "@/features/auth/types";
import { getSupabaseEnv } from "@/lib/env";

const PROTECTED_PREFIXES = [
  "/perfil",
  "/vender",
  "/compras",
  "/ventas",
  "/pagos",
  "/favoritos",
  "/mensajes",
  "/verificacion",
  "/revision",
];
const AUTH_PREFIXES = ["/login", "/registro", "/recuperar"];

/**
 * matchesPrefix
 *
 * Checks whether a pathname equals or starts with any of the given prefixes.
 *
 * @param pathname - Request pathname.
 * @param prefixes - Route prefix list.
 * @returns True when pathname matches a prefix.
 */
function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * withPathnameHeaders
 *
 * Forwards the current pathname and search into request headers for RSC.
 *
 * @param request - Incoming NextRequest.
 * @returns NextResponse.next with x-pathname and x-search headers.
 */
function withPathnameHeaders(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  requestHeaders.set("x-search", request.nextUrl.search);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

/**
 * updateSession
 *
 * Refreshes the Supabase Auth session and enforces auth for protected routes.
 * Redirects anonymous users away from protected prefixes and signed-in users
 * away from auth pages.
 *
 * @param request - Incoming middleware request.
 * @returns Redirect or next response with refreshed auth cookies.
 * @calledBy Next.js middleware / proxy entry
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = withPathnameHeaders(request);

  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = withPathnameHeaders(request);
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value);
        });
      },
    },
  });

  // Keeps the session fresh for Server Components. Do not remove.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;
  const { pathname, search } = request.nextUrl;
  const nextAfterLogin = safeNextPath(`${pathname}${search}`);

  if (!user && matchesPrefix(pathname, PROTECTED_PREFIXES)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", nextAfterLogin);
    return NextResponse.redirect(loginUrl);
  }

  if (user && matchesPrefix(pathname, AUTH_PREFIXES)) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  return supabaseResponse;
}
