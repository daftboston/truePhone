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

/** Only allow relative same-origin paths for post-login redirects. */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/";
  }
  return next;
}
