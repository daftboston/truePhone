"use server";

import { redirect } from "next/navigation";

import {
  loginSchema,
  recoverSchema,
  registerSchema,
  updatePasswordSchema,
} from "@/features/auth/schemas/auth";
import {
  authErrorMessage,
  safeNextPath,
  type AuthActionState,
} from "@/features/auth/types";
import { ensureProfile } from "@/lib/auth/profile";
import { getRequestOrigin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

function fieldErrorsFromZod(
  error: import("zod").ZodError,
): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key !== "string") continue;
    fieldErrors[key] ??= [];
    fieldErrors[key].push(issue.message);
  }
  return fieldErrors;
}

export async function loginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los datos e intenta de nuevo.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return { ok: false, error: authErrorMessage(error?.message) };
  }

  await ensureProfile({
    authUserId: data.user.id,
    fullName:
      typeof data.user.user_metadata?.full_name === "string"
        ? data.user.user_metadata.full_name
        : null,
  });

  redirect(safeNextPath(parsed.data.next));
}

export async function registerAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los datos e intenta de nuevo.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const origin = await getRequestOrigin();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${origin}/auth/callback?next=/perfil`,
    },
  });

  if (error) {
    return { ok: false, error: authErrorMessage(error.message) };
  }

  if (data.user) {
    await ensureProfile({
      authUserId: data.user.id,
      fullName: parsed.data.fullName,
    });
  }

  // If email confirmation is disabled, session exists — go to profile.
  if (data.session) {
    redirect("/perfil");
  }

  return {
    ok: true,
    message:
      "Te enviamos un correo para confirmar tu cuenta. Ábrelo para continuar.",
  };
}

export async function recoverAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = recoverSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los datos e intenta de nuevo.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const origin = await getRequestOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${origin}/auth/callback?next=/auth/actualizar-contrasena`,
    },
  );

  if (error) {
    return { ok: false, error: authErrorMessage(error.message) };
  }

  // Same message whether or not the email exists (avoid account enumeration).
  return {
    ok: true,
    message:
      "Si existe una cuenta con ese correo, te enviamos un enlace para restablecer la contraseña.",
  };
}

export async function updatePasswordAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = updatePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los datos e intenta de nuevo.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      error: "Tu sesión expiró. Solicita un nuevo enlace de recuperación.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { ok: false, error: authErrorMessage(error.message) };
  }

  redirect("/perfil");
}

export async function signInWithGoogleAction(next?: string) {
  const origin = await getRequestOrigin();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(safeNextPath(next))}`,
    },
  });

  if (error || !data.url) {
    return { ok: false as const, error: authErrorMessage(error?.message) };
  }

  redirect(data.url);
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function resendConfirmationAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = recoverSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Ingresa un correo válido.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const origin = await getRequestOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/perfil`,
    },
  });

  if (error) {
    return { ok: false, error: authErrorMessage(error.message) };
  }

  return {
    ok: true,
    message:
      "Si la cuenta existe y no está confirmada, te enviamos un nuevo correo.",
  };
}
