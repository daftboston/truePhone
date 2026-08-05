/**
 * @file client.ts
 * @description Browser Supabase client for Client Components.
 * @dependencies @supabase/ssr, @/lib/env
 */

import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnv } from "@/lib/env";

/**
 * createClient
 *
 * Creates a browser Supabase client with the public anon key.
 *
 * @returns Supabase browser client.
 * @calledBy Client auth forms and browser-side session reads
 */
export function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
