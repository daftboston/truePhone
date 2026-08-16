/**
 * @file server.ts
 * @description Server Supabase client bound to Next.js cookies.
 * @dependencies @supabase/ssr, next/headers, @/lib/env
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseEnv } from "@/lib/env";

/**
 * createClient
 *
 * Creates a cookie-aware Supabase server client for RSC and Server Actions.
 * Cookie writes may fail in read-only Server Components; refresh runs in proxy.
 *
 * @returns Promise resolving to a Supabase server client.
 * @calledBy auth/session, server actions, protected pages
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component where cookies are read-only.
          // Session refresh is handled in src/lib/supabase/proxy.ts.
        }
      },
    },
  });
}
