/**
 * @file types.ts
 * @description Shared types and helpers for the verification feature.
 * @dependencies @prisma/client
 */

import type {
  IdentityVerification,
  IdentityVerificationStatus,
} from "@prisma/client";

export type VerificationActionState =
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

export const VERIFICATION_STEPS = [
  { id: "privacidad", title: "Privacidad", path: "/verificacion" },
  {
    id: "cedula-frente",
    title: "Cédula (frente)",
    path: "/verificacion/cedula-frente",
  },
  {
    id: "cedula-reverso",
    title: "Cédula (reverso)",
    path: "/verificacion/cedula-reverso",
  },
  { id: "selfie", title: "Selfie", path: "/verificacion/selfie" },
  { id: "revisar", title: "Revisar", path: "/verificacion/revisar" },
] as const;

/**
 * fieldErrorsFromZod
 *
 * Flattens Zod issues into a field-name → messages map for form UI.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy verification UI and related modules
 */
export function fieldErrorsFromZod(
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
 * isSellerIdentityVerified
 *
 * Predicate helper used by verification UI and actions.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy verification UI and related modules
 */
export function isSellerIdentityVerified(verifikStatus: string) {
  return verifikStatus === "verified";
}

/**
 * canContinueVerification
 *
 * Predicate helper used by verification UI and actions.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy verification UI and related modules
 */
export function canContinueVerification(status: IdentityVerificationStatus) {
  return status === "DRAFT";
}

/**
 * verificationLockedPath
 *
 * Returns a redirect target when the seller should not edit the wizard.
 *
 * @param status - Current identity verification status.
 * @returns Path to redirect, or null when DRAFT is editable.
 * @calledBy Identity wizard pages
 */
export function verificationLockedPath(
  status: IdentityVerificationStatus,
): string | null {
  if (status === "VERIFIED") return "/verificacion";
  if (status === "PENDING" || status === "IN_REVIEW") {
    return "/verificacion/enviada";
  }
  if (status === "REJECTED") return "/verificacion";
  return null;
}

/**
 * verificationStatusLabel
 *
 * Supports verification by implementing verificationStatusLabel.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy verification UI and related modules
 */
export function verificationStatusLabel(status: string) {
  switch (status) {
    case "verified":
    case "VERIFIED":
      return "Verificado";
    case "pending":
    case "PENDING":
    case "IN_REVIEW":
      return "En revisión";
    case "rejected":
    case "REJECTED":
      return "Rechazado";
    case "draft":
    case "DRAFT":
      return "En progreso";
    default:
      return "Sin enviar";
  }
}

/**
 * nextVerificationPath
 *
 * Returns the next incomplete identity-verification wizard step.
 *
 * @param draft - Current identity verification row, if any.
 * @returns Path under `/verificacion`.
 * @calledBy verificationNavHref, verification pages
 */
export function nextVerificationPath(draft: IdentityVerification | null) {
  if (!draft || !draft.privacyAcceptedAt) return "/verificacion";
  if (!draft.documentNumberHash || !draft.frontImageUrl) {
    return "/verificacion/cedula-frente";
  }
  if (!draft.backImageUrl) return "/verificacion/cedula-reverso";
  if (!draft.selfieImageUrl) return "/verificacion/selfie";
  return "/verificacion/revisar";
}

/**
 * verificationNavHref
 *
 * Sidebar destination for Verificación. Never returns `/vender` — that
 * made Mis anuncios and Verificación both look selected.
 *
 * @param input.verifikStatus - Profile identity status.
 * @param input.verification - Latest identity verification row, if any.
 * @returns A `/verificacion` path.
 * @calledBy AuthenticatedSidebarShell, ProfilePage
 */
export function verificationNavHref(input: {
  verifikStatus: string;
  verification?: IdentityVerification | null;
}) {
  if (isSellerIdentityVerified(input.verifikStatus)) {
    return "/verificacion";
  }
  if (input.verifikStatus === "pending") {
    return "/verificacion/enviada";
  }
  if (input.verifikStatus === "rejected") {
    return "/verificacion";
  }
  return input.verification
    ? nextVerificationPath(input.verification)
    : "/verificacion";
}
