"use server";

/**
 * @file auth.ts
 * @description Server actions for email/password auth, Google OAuth, recovery, and logout.
 * @dependencies next/navigation, auth schemas/types, ensureProfile, Supabase server client
 */

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

/**
 * fieldErrorsFromZod
 *
 * Flattens Zod issues into a field-name → messages map for form UI.
 *
 * @param error - Zod validation error from safeParse.
 * @returns Record of field keys to error message arrays.
 * @calledBy loginAction, registerAction, recoverAction, updatePasswordAction, resendConfirmationAction
 */
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

/**
 * loginAction
 *
 * Signs in with email/password, ensures a Profile row, then redirects.
 *
 * @param _prev - Previous form state from useActionState.
 * @param formData - email, password, optional next.
 * @returns AuthActionState on validation or auth errors; redirects on success.
 * @calledBy LoginForm
 */
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

  // Mirror auth user into application profiles table
  await ensureProfile({
    authUserId: data.user.id,
    fullName:
      typeof data.user.user_metadata?.full_name === "string"
        ? data.user.user_metadata.full_name
        : null,
  });

  redirect(safeNextPath(parsed.data.next));
}

/**
 * registerAction
 *
 * Registers a user via Supabase Auth and creates their Profile.
 *
 * @param _prev - Previous form state from useActionState.
 * @param formData - fullName, email, password, confirmPassword.
 * @returns AuthActionState on validation/auth errors or when email confirmation is required; redirects when session exists.
 * @calledBy RegisterForm
 */
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

  // Mirror auth user into application profiles table
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

/**
 * recoverAction
 *
 * Sends a password-reset email without revealing whether the account exists.
 *
 * @param _prev - Previous form state from useActionState.
 * @param formData - email.
 * @returns AuthActionState with a generic success message or validation/auth error.
 * @calledBy RecoverForm
 */
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

/**
 * updatePasswordAction
 *
 * Sets a new password for the recovery-session user, then redirects to profile.
 *
 * @param _prev - Previous form state from useActionState.
 * @param formData - password, confirmPassword.
 * @returns AuthActionState on errors; redirects to `/perfil` on success.
 * @calledBy UpdatePasswordForm
 */
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

/**
 * signInWithGoogleAction
 *
 * Starts Google OAuth and redirects to the provider URL.
 *
 * @param next - Optional post-login path passed through the auth callback.
 * @returns Error object when OAuth URL cannot be created; otherwise redirects.
 * @calledBy GoogleSignInButton
 */
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

/**
 * logoutAction
 *
 * Signs out the current Supabase session and returns to the home page.
 *
 * @returns Never resolves successfully; always redirects to `/`.
 * @calledBy LogoutButton
 */
export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

/**
 * resendConfirmationAction
 *
 * Resends the signup confirmation email without revealing account existence.
 *
 * @param _prev - Previous form state from useActionState.
 * @param formData - email.
 * @returns AuthActionState with generic success or validation/auth error.
 * @calledBy LoginForm (when unconfirmed-email error is shown)
 */
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
