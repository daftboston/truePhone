/**
 * @file types.ts
 * @description Shared auth action state and helpers for Supabase error mapping and safe redirects.
 * @dependencies none
 */

/**
 * Result shape returned by auth server actions bound to useActionState.
 * `null` is the idle initial state before the first submission.
 */
export type AuthActionState =
  | {
      ok: true;
      message?: string;
    }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
    }
  | null;

/**
 * authErrorMessage
 *
 * Maps Supabase Auth error strings to Spanish user-facing copy.
 *
 * @param codeOrMessage - Raw error message or code from Supabase Auth.
 * @returns Localized error string safe to show in forms.
 * @calledBy loginAction, registerAction, recoverAction, updatePasswordAction, signInWithGoogleAction, resendConfirmationAction
 */
export function authErrorMessage(codeOrMessage: string | undefined): string {
  const value = (codeOrMessage ?? "").toLowerCase();

  if (value.includes("invalid login credentials")) {
    return "Correo o contraseña incorrectos.";
  }
  if (value.includes("email not confirmed")) {
    return "Confirma tu correo para continuar. Revisa tu bandeja de entrada.";
  }
  if (value.includes("user already registered")) {
    return "Ya existe una cuenta con este correo.";
  }
  if (value.includes("password")) {
    return "La contraseña no cumple los requisitos.";
  }
  if (value.includes("rate limit") || value.includes("too many")) {
    return "Demasiados intentos. Espera un momento e intenta de nuevo.";
  }
  if (value.includes("provider") || value.includes("oauth")) {
    return "No pudimos conectar con Google. Intenta de nuevo.";
  }

  return "No pudimos completar la solicitud. Intenta de nuevo.";
}

/**
 * safeNextPath
 *
 * Restricts post-login redirects to same-origin relative paths.
 *
 * @param next - Raw `next` query param from login/register/OAuth.
 * @returns Sanitized path defaulting to `/`.
 * @calledBy loginAction, signInWithGoogleAction, auth/callback/route
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/";
  }
  return next;
}
