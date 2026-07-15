import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ensureProfile, getProfileByAuthUserId } from "@/lib/auth/profile";

export async function getAuthUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

export async function requireAuthUser(nextPath = "/") {
  const user = await getAuthUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return user;
}

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

export async function requireCurrentProfile(nextPath = "/") {
  const current = await getCurrentProfile();
  if (!current) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return current;
}

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
