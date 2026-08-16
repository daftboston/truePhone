/**
 * @file session.ts
 * @description Auth session helpers: current user/profile, redirects, role labels.
 * @dependencies next/headers, next/navigation, @/lib/supabase/server, @/lib/auth/profile
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ensureProfile, getProfileByAuthUserId } from "@/lib/auth/profile";

/**
 * getAuthUser
 *
 * Reads the authenticated Supabase user from the server client.
 *
 * @returns Auth user or null when unauthenticated / error.
 * @calledBy getCurrentProfile, requireAuthUser, protected pages
 */
export async function getAuthUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

/**
 * requireAuthUser
 *
 * Ensures a logged-in user; redirects to login with next path when missing.
 *
 * @param nextPath - Post-login redirect path; defaults to `/`.
 * @returns Authenticated Supabase user.
 * @calledBy Server pages and actions that require login
 */
export async function requireAuthUser(nextPath = "/") {
  const user = await getAuthUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return user;
}

/**
 * getCurrentProfile
 *
 * Resolves the auth user and linked Profile, creating a Profile when missing.
 *
 * @returns `{ user, profile }` or null when unauthenticated.
 * @calledBy requireCurrentProfile, layout/nav, account pages
 */
export async function getCurrentProfile() {
  const user = await getAuthUser();
  if (!user) {
    return null;
  }

  const profile = await getProfileByAuthUserId(user.id);
  if (profile) {
    return { user, profile };
  }

  const created = await ensureProfile({
    authUserId: user.id,
    fullName:
      typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : typeof user.user_metadata?.fullName === "string"
          ? user.user_metadata.fullName
          : null,
  });

  return { user, profile: created };
}

/**
 * requireCurrentProfile
 *
 * Ensures auth + Profile; redirects to login when missing.
 *
 * @param nextPath - Post-login redirect path; defaults to `/`.
 * @returns `{ user, profile }` for the current session.
 * @calledBy Account routes, seller/buyer actions
 */
export async function requireCurrentProfile(nextPath = "/") {
  const current = await getCurrentProfile();
  if (!current) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return current;
}

/**
 * getRequestOrigin
 *
 * Derives the absolute origin from request headers or site env fallback.
 *
 * @returns Origin URL string (e.g. https://example.com).
 * @calledBy Auth actions needing redirect/callback URLs
 */
export async function getRequestOrigin() {
  const headerStore = await headers();
  const origin = headerStore.get("origin");
  if (origin) {
    return origin;
  }

  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  if (host) {
    return `${proto}://${host}`;
  }

  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/**
 * roleLabel
 *
 * Maps Profile role enum values to Spanish display labels.
 *
 * @param role - Profile role string (BUYER, SELLER, etc.).
 * @returns Localized label or the raw role when unknown.
 * @calledBy Profile UI, admin displays
 */
export function roleLabel(role: string) {
  switch (role) {
    case "BUYER":
      return "Comprador";
    case "SELLER":
      return "Vendedor";
    case "REVIEWER":
      return "Revisor";
    case "ADMIN":
      return "Administrador";
    default:
      return role;
  }
}

/**
 * canAccessReviewPortal
 *
 * Checks whether a role may enter the reviewer portal (identity + listing queues).
 *
 * @param role - Profile role string.
 * @returns True for REVIEWER or ADMIN.
 * @calledBy Review portal layout/guards
 */
export function canAccessReviewPortal(role: string) {
  return role === "REVIEWER" || role === "ADMIN";
}
