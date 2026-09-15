"use server";

/**
 * @file pqr-ops.ts
 * @description REVIEWER/ADMIN Server Actions for PQR assignment and responses.
 * @dependencies next/cache, auth session, pqr service, Resend email helpers
 */

import { revalidatePath } from "next/cache";

import { fieldErrorsFromZod } from "@/features/orders/schemas/order";
import {
  claimPqrCaseSchema,
  staffClosePqrCaseSchema,
  staffRespondPqrCaseSchema,
  type PqrActionState,
} from "@/features/pqr/schemas/pqr";
import { canAccessReviewPortal, getCurrentProfile } from "@/lib/auth/session";
import {
  buildPqrResponseEmail,
  formatPqrTimestamp,
} from "@/lib/pqr/notifications";
import {
  claimPqrCase,
  closePqrCase,
  respondToPqrCase,
} from "@/lib/pqr/pqr-service";
import { sendNotificationEmail } from "@/lib/notifications/email";

/**
 * revalidatePqrPaths
 *
 * Refreshes queue and detail pages after staff mutations.
 *
 * @param caseId - PqrCase cuid.
 * @calledBy all PQR ops actions
 */
function revalidatePqrPaths(caseId: string) {
  revalidatePath("/revision");
  revalidatePath("/revision/pqr");
  revalidatePath(`/revision/pqr/${caseId}`);
}

/**
 * requirePqrStaff
 *
 * Resolves an authenticated REVIEWER/ADMIN for PQR ops mutations.
 *
 * @returns Current profile or action-state error.
 * @calledBy PQR ops Server Actions
 */
async function requirePqrStaff() {
  const current = await getCurrentProfile();
  if (!current) {
    return {
      current: null,
      error: {
        ok: false,
        error: "Debes iniciar sesión.",
        loginRequired: true,
      } satisfies PqrActionState,
    };
  }
  if (!canAccessReviewPortal(current.profile.role)) {
    return {
      current: null,
      error: {
        ok: false,
        error: "No tienes permiso para gestionar PQR.",
      } satisfies PqrActionState,
    };
  }
  return { current, error: null };
}

/**
 * claimPqrCaseAction
 *
 * Assigns a PQR case to the current staff member.
 *
 * @param _prev - Previous action state.
 * @param formData - Hidden caseId field.
 * @returns Success message or error.
 * @calledBy PqrOpsPanel
 */
export async function claimPqrCaseAction(
  _prev: PqrActionState,
  formData: FormData,
): Promise<PqrActionState> {
  const staff = await requirePqrStaff();
  if (staff.error) return staff.error;

  const parsed = claimPqrCaseSchema.safeParse({
    caseId: formData.get("caseId"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Caso inválido.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const result = await claimPqrCase(
    parsed.data.caseId,
    staff.current!.profile.id,
  );
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePqrPaths(parsed.data.caseId);
  return { ok: true, message: "Caso asignado.", caseId: parsed.data.caseId };
}

/**
 * staffRespondPqrCaseAction
 *
 * Publishes a formal response and emails the submitter.
 *
 * @param _prev - Previous action state.
 * @param formData - caseId + respuesta fields.
 * @returns Success message or error.
 * @calledBy PqrOpsPanel
 */
export async function staffRespondPqrCaseAction(
  _prev: PqrActionState,
  formData: FormData,
): Promise<PqrActionState> {
  const staff = await requirePqrStaff();
  if (staff.error) return staff.error;

  const parsed = staffRespondPqrCaseSchema.safeParse({
    caseId: formData.get("caseId"),
    respuesta: formData.get("respuesta"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa la respuesta.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const result = await respondToPqrCase(
    parsed.data.caseId,
    staff.current!.profile.id,
    parsed.data.respuesta,
  );
  if (!result.ok) return { ok: false, error: result.error };

  const email = buildPqrResponseEmail({
    radicado: result.data.radicado,
    respuesta: parsed.data.respuesta,
    respondedAt: result.data.respondedAt ?? new Date(),
  });

  await sendNotificationEmail({
    to: result.data.email,
    subject: email.subject,
    text: email.text,
  });

  revalidatePqrPaths(parsed.data.caseId);
  return {
    ok: true,
    message: `Respuesta enviada · ${formatPqrTimestamp(result.data.respondedAt ?? new Date())}`,
    caseId: parsed.data.caseId,
  };
}

/**
 * staffClosePqrCaseAction
 *
 * Closes a responded PQR case for queue hygiene.
 *
 * @param _prev - Previous action state.
 * @param formData - Hidden caseId field.
 * @returns Success message or error.
 * @calledBy PqrOpsPanel
 */
export async function staffClosePqrCaseAction(
  _prev: PqrActionState,
  formData: FormData,
): Promise<PqrActionState> {
  const staff = await requirePqrStaff();
  if (staff.error) return staff.error;

  const parsed = staffClosePqrCaseSchema.safeParse({
    caseId: formData.get("caseId"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Caso inválido.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const result = await closePqrCase(parsed.data.caseId);
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePqrPaths(parsed.data.caseId);
  return { ok: true, message: "Caso cerrado.", caseId: parsed.data.caseId };
}
