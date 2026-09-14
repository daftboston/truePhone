"use server";

/**
 * @file identity.ts
 * @description Server actions for verification (identity.ts).
 * @dependencies next/cache, next/navigation, @/features/verification/schemas/identity, @/features/verification/types, @/lib/auth/identity
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  approveIdentitySchema,
  documentLast4,
  hashDocumentNumber,
  rejectIdentitySchema,
  resolveCedulaNumberInput,
  resolveOptionalIdentityFile,
} from "@/features/verification/schemas/identity";
import {
  fieldErrorsFromZod,
  type VerificationActionState,
} from "@/features/verification/types";
import {
  canDecideIdentityReview,
  getLatestIdentityVerification,
  getOrCreateDraftVerification,
} from "@/lib/auth/identity";
import { getCurrentProfile, getRequestOrigin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  notifyIdentityReviewed,
  safeNotify,
} from "@/lib/notifications/marketplace";
import { createClient } from "@/lib/supabase/server";

const IDENTITY_BUCKET = "identity-docs";
/** Matches next.config.ts experimental.serverActions.bodySizeLimit. */
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * requireSellerDraft
 *
 * Supports verification by implementing requireSellerDraft.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy verification UI and related modules
 */
async function requireSellerDraft() {
  const current = await getCurrentProfile();
  if (!current) {
    return { ok: false as const, error: "Debes iniciar sesión." };
  }

  const draft = await getOrCreateDraftVerification(current.profile.id);

  if (draft.status === "PENDING" || draft.status === "IN_REVIEW") {
    return {
      ok: false as const,
      error: "Tu verificación ya está en revisión.",
    };
  }
  if (draft.status === "VERIFIED") {
    return { ok: false as const, error: "Tu identidad ya está verificada." };
  }
  if (draft.status === "REJECTED") {
    return {
      ok: false as const,
      error:
        "Tu verificación fue rechazada. Vuelve a intentarlo desde el inicio.",
    };
  }

  return { ok: true as const, current, draft };
}

/**
 * uploadIdentityImage
 *
 * Supports verification by implementing uploadIdentityImage.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy verification UI and related modules
 */
async function uploadIdentityImage(
  authUserId: string,
  kind: "front" | "back" | "selfie",
  file: File,
): Promise<{ path: string } | { error: string }> {
  if (!ALLOWED_TYPES.has(file.type)) {
    return { error: "Usa una imagen JPG, PNG o WebP." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: "La imagen debe pesar máximo 4 MB." };
  }

  const extension = file.type.split("/")[1] ?? "jpg";
  const objectPath = `${authUserId}/${kind}-${Date.now()}.${extension}`;
  const supabase = await createClient();
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from(IDENTITY_BUCKET)
    .upload(objectPath, bytes, {
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    return {
      error:
        "No pudimos subir el archivo. Confirma que el bucket «identity-docs» existe en Supabase.",
    };
  }

  // Private bucket: store the object path; owners can create signed URLs later.
  return { path: `${IDENTITY_BUCKET}/${objectPath}` };
}

/**
 * acceptPrivacyAction
 *
 * Server action: accept privacy for authenticated verification flows.
 *
 * @param _prev - Previous form state from useActionState when applicable.
 * @param formDataOrArgs - FormData or typed action arguments.
 * @returns Action state on errors; may redirect on success.
 * @calledBy verification components
 */
export async function acceptPrivacyAction(): Promise<VerificationActionState> {
  const result = await requireSellerDraft();
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  const { current, draft } = result;

  await prisma.identityVerification.update({
    where: { id: draft.id },
    data: { privacyAcceptedAt: new Date() },
  });

  await prisma.profile.update({
    where: { id: current.profile.id },
    data: { verifikStatus: "draft" },
  });

  revalidatePath("/verificacion");
  redirect("/verificacion/cedula-frente");
}

/**
 * saveCedulaFrontAction
 *
 * Server action: save cedula front for authenticated verification flows.
 *
 * @param _prev - Previous form state from useActionState when applicable.
 * @param formDataOrArgs - FormData or typed action arguments.
 * @returns Action state on errors; may redirect on success.
 * @calledBy verification components
 */
export async function saveCedulaFrontAction(
  _prev: VerificationActionState,
  formData: FormData,
): Promise<VerificationActionState> {
  const result = await requireSellerDraft();
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  const { current, draft } = result;

  if (!draft.privacyAcceptedAt) {
    return { ok: false, error: "Primero acepta el aviso de privacidad." };
  }

  const numberResult = resolveCedulaNumberInput(
    formData.get("documentNumber"),
    Boolean(draft.documentNumberHash),
  );
  if (!numberResult.ok) {
    return {
      ok: false,
      error: numberResult.error,
      fieldErrors: numberResult.fieldErrors,
    };
  }

  const fileResult = resolveOptionalIdentityFile(
    formData.get("frontImage"),
    draft.frontImageUrl,
    "Sube la foto del frente de tu cédula.",
  );
  if (!fileResult.ok) {
    return { ok: false, error: fileResult.error };
  }

  let frontImageUrl = draft.frontImageUrl;
  if (fileResult.file) {
    const upload = await uploadIdentityImage(
      current.user.id,
      "front",
      fileResult.file,
    );
    if ("error" in upload) {
      return { ok: false, error: upload.error };
    }
    frontImageUrl = upload.path;
  }

  await prisma.identityVerification.update({
    where: { id: draft.id },
    data: {
      ...(numberResult.documentNumber
        ? {
            documentNumberHash: hashDocumentNumber(numberResult.documentNumber),
            documentNumberLast4: documentLast4(numberResult.documentNumber),
          }
        : {}),
      frontImageUrl,
    },
  });

  revalidatePath("/verificacion");
  redirect("/verificacion/cedula-reverso");
}

/**
 * saveCedulaBackAction
 *
 * Server action: save cedula back for authenticated verification flows.
 *
 * @param _prev - Previous form state from useActionState when applicable.
 * @param formDataOrArgs - FormData or typed action arguments.
 * @returns Action state on errors; may redirect on success.
 * @calledBy verification components
 */
export async function saveCedulaBackAction(
  _prev: VerificationActionState,
  formData: FormData,
): Promise<VerificationActionState> {
  const result = await requireSellerDraft();
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  const { current, draft } = result;

  if (!draft.frontImageUrl) {
    return { ok: false, error: "Completa primero el frente de la cédula." };
  }

  const fileResult = resolveOptionalIdentityFile(
    formData.get("backImage"),
    draft.backImageUrl,
    "Sube la foto del reverso de tu cédula.",
  );
  if (!fileResult.ok) {
    return { ok: false, error: fileResult.error };
  }

  let backImageUrl = draft.backImageUrl;
  if (fileResult.file) {
    const upload = await uploadIdentityImage(
      current.user.id,
      "back",
      fileResult.file,
    );
    if ("error" in upload) {
      return { ok: false, error: upload.error };
    }
    backImageUrl = upload.path;
  }

  await prisma.identityVerification.update({
    where: { id: draft.id },
    data: { backImageUrl },
  });

  revalidatePath("/verificacion");
  redirect("/verificacion/selfie");
}

/**
 * saveSelfieAction
 *
 * Server action: save selfie for authenticated verification flows.
 *
 * @param _prev - Previous form state from useActionState when applicable.
 * @param formDataOrArgs - FormData or typed action arguments.
 * @returns Action state on errors; may redirect on success.
 * @calledBy verification components
 */
export async function saveSelfieAction(
  _prev: VerificationActionState,
  formData: FormData,
): Promise<VerificationActionState> {
  const result = await requireSellerDraft();
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  const { current, draft } = result;

  if (!draft.backImageUrl) {
    return { ok: false, error: "Completa primero el reverso de la cédula." };
  }

  const fileResult = resolveOptionalIdentityFile(
    formData.get("selfieImage"),
    draft.selfieImageUrl,
    "Sube una selfie clara de tu rostro.",
  );
  if (!fileResult.ok) {
    return { ok: false, error: fileResult.error };
  }

  let selfieImageUrl = draft.selfieImageUrl;
  if (fileResult.file) {
    const upload = await uploadIdentityImage(
      current.user.id,
      "selfie",
      fileResult.file,
    );
    if ("error" in upload) {
      return { ok: false, error: upload.error };
    }
    selfieImageUrl = upload.path;
  }

  await prisma.identityVerification.update({
    where: { id: draft.id },
    data: { selfieImageUrl },
  });

  revalidatePath("/verificacion");
  redirect("/verificacion/revisar");
}

/**
 * submitIdentityVerificationAction
 *
 * Server action: submit identity verification for authenticated verification flows.
 *
 * @param _prev - Previous form state from useActionState when applicable.
 * @param formDataOrArgs - FormData or typed action arguments.
 * @returns Action state on errors; may redirect on success.
 * @calledBy verification components
 */
export async function submitIdentityVerificationAction(): Promise<VerificationActionState> {
  const result = await requireSellerDraft();
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  const { current, draft } = result;

  if (
    !draft.privacyAcceptedAt ||
    !draft.documentNumberHash ||
    !draft.frontImageUrl ||
    !draft.backImageUrl ||
    !draft.selfieImageUrl
  ) {
    return {
      ok: false,
      error: "Completa todos los pasos antes de enviar.",
    };
  }

  await prisma.identityVerification.update({
    where: { id: draft.id },
    data: {
      status: "PENDING",
      submittedAt: new Date(),
    },
  });

  await prisma.profile.update({
    where: { id: current.profile.id },
    data: { verifikStatus: "pending" },
  });

  revalidatePath("/verificacion");
  revalidatePath("/vender");
  revalidatePath("/perfil");
  revalidatePath("/revision/identidad");
  redirect("/verificacion/enviada");
}

/**
 * requireIdentityReviewer
 *
 * Gates identity-review mutations to REVIEWER and ADMIN profiles.
 *
 * @returns Current session or an error state.
 * @calledBy claim, approve, and reject identity actions
 */
async function requireIdentityReviewer() {
  const current = await getCurrentProfile();
  if (!current) {
    return { ok: false as const, error: "Debes iniciar sesión." };
  }
  if (current.profile.role !== "REVIEWER" && current.profile.role !== "ADMIN") {
    return {
      ok: false as const,
      error: "No tienes permiso para revisar identidades.",
    };
  }
  return { ok: true as const, current };
}

/**
 * claimIdentityForReviewAction
 *
 * Assigns an unclaimed PENDING/IN_REVIEW identity case to the current reviewer.
 * Does not steal a case already claimed by someone else.
 *
 * @param verificationId - IdentityVerification id.
 * @returns Action state; callers refresh the detail page.
 * @calledBy Identity review detail page
 */
export async function claimIdentityForReviewAction(verificationId: string) {
  const gate = await requireIdentityReviewer();
  if (!gate.ok) return gate;

  const verification = await prisma.identityVerification.findUnique({
    where: { id: verificationId },
  });
  if (
    !verification ||
    (verification.status !== "PENDING" && verification.status !== "IN_REVIEW")
  ) {
    return {
      ok: false as const,
      error: "Esta verificación no está en la cola.",
    };
  }

  if (!verification.reviewerId) {
    await prisma.identityVerification.update({
      where: { id: verification.id },
      data: {
        status: "IN_REVIEW",
        reviewerId: gate.current.profile.id,
      },
    });
    revalidatePath("/revision/identidad");
    revalidatePath(`/revision/identidad/${verification.id}`);
    revalidatePath("/revision");
  }

  return { ok: true as const };
}

/**
 * approveIdentityVerificationAction
 *
 * Approves identity verification and sets verifikStatus to verified.
 * Does not change Profile.role — SELLER is set on first PUBLISHED listing.
 *
 * @param _prev - Previous form state from useActionState.
 * @param formData - verificationId from the review form.
 * @returns Action state on errors or success message.
 * @calledBy IdentityReviewActions
 */
export async function approveIdentityVerificationAction(
  _prev: VerificationActionState,
  formData: FormData,
): Promise<VerificationActionState> {
  const gate = await requireIdentityReviewer();
  if (!gate.ok) return { ok: false, error: gate.error };
  const current = gate.current;

  const parsed = approveIdentitySchema.safeParse({
    verificationId: formData.get("verificationId"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Solicitud inválida." };
  }

  const verification = await prisma.identityVerification.findUnique({
    where: { id: parsed.data.verificationId },
  });
  if (
    !verification ||
    (verification.status !== "PENDING" && verification.status !== "IN_REVIEW")
  ) {
    return { ok: false, error: "Esta verificación no está pendiente." };
  }
  if (
    !canDecideIdentityReview({
      status: verification.status,
      reviewerId: verification.reviewerId,
      actorId: current.profile.id,
      actorRole: current.profile.role,
    })
  ) {
    return {
      ok: false,
      error: "Otro revisor ya tiene este caso.",
    };
  }

  await prisma.$transaction([
    prisma.identityVerification.update({
      where: { id: verification.id },
      data: {
        status: "VERIFIED",
        reviewedAt: new Date(),
        reviewerId: current.profile.id,
        rejectionReason: null,
      },
    }),
    // Identity verify only — role stays BUYER until first listing is PUBLISHED.
    prisma.profile.update({
      where: { id: verification.profileId },
      data: {
        verifikStatus: "verified",
        verifikVerifiedAt: new Date(),
      },
    }),
  ]);

  revalidatePath("/revision/identidad");
  revalidatePath(`/revision/identidad/${verification.id}`);
  revalidatePath("/vender");
  revalidatePath("/perfil");
  revalidatePath("/notificaciones");
  revalidatePath("/", "layout");
  await safeNotify(
    notifyIdentityReviewed({
      verificationId: verification.id,
      approved: true,
      siteOrigin: await getRequestOrigin(),
    }),
  );
  return { ok: true, message: "Identidad aprobada." };
}

/**
 * rejectIdentityVerificationAction
 *
 * Server action: reject identity verification for authenticated verification flows.
 *
 * @param _prev - Previous form state from useActionState when applicable.
 * @param formDataOrArgs - FormData or typed action arguments.
 * @returns Action state on errors; may redirect on success.
 * @calledBy verification components
 */
export async function rejectIdentityVerificationAction(
  _prev: VerificationActionState,
  formData: FormData,
): Promise<VerificationActionState> {
  const gate = await requireIdentityReviewer();
  if (!gate.ok) return { ok: false, error: gate.error };
  const current = gate.current;

  const parsed = rejectIdentitySchema.safeParse({
    verificationId: formData.get("verificationId"),
    rejectionReason: formData.get("rejectionReason"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa el motivo del rechazo.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const verification = await prisma.identityVerification.findUnique({
    where: { id: parsed.data.verificationId },
  });
  if (
    !verification ||
    (verification.status !== "PENDING" && verification.status !== "IN_REVIEW")
  ) {
    return { ok: false, error: "Esta verificación no está pendiente." };
  }
  if (
    !canDecideIdentityReview({
      status: verification.status,
      reviewerId: verification.reviewerId,
      actorId: current.profile.id,
      actorRole: current.profile.role,
    })
  ) {
    return {
      ok: false,
      error: "Otro revisor ya tiene este caso.",
    };
  }

  await prisma.$transaction([
    prisma.identityVerification.update({
      where: { id: verification.id },
      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
        reviewerId: current.profile.id,
        rejectionReason: parsed.data.rejectionReason,
      },
    }),
    prisma.profile.update({
      where: { id: verification.profileId },
      data: {
        verifikStatus: "rejected",
        verifikVerifiedAt: null,
      },
    }),
  ]);

  revalidatePath("/revision/identidad");
  revalidatePath(`/revision/identidad/${verification.id}`);
  revalidatePath("/vender");
  revalidatePath("/perfil");
  revalidatePath("/notificaciones");
  revalidatePath("/", "layout");
  await safeNotify(
    notifyIdentityReviewed({
      verificationId: verification.id,
      approved: false,
      rejectionReason: parsed.data.rejectionReason,
      siteOrigin: await getRequestOrigin(),
    }),
  );
  return { ok: true, message: "Verificación rechazada." };
}

/**
 * startIdentityRetryAction
 *
 * Opens a new DRAFT after a rejected identity case so the seller can resubmit
 * without losing the previous rejection reason on the old row.
 *
 * @returns Action state; redirects to /verificacion on success.
 * @calledBy RetryIdentityButton
 */
export async function startIdentityRetryAction(): Promise<VerificationActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return { ok: false, error: "Debes iniciar sesión." };
  }

  const latest = await getLatestIdentityVerification(current.profile.id);
  if (!latest || latest.status !== "REJECTED") {
    return {
      ok: false,
      error: "No hay una verificación rechazada para reintentar.",
    };
  }

  await prisma.$transaction([
    prisma.identityVerification.create({
      data: {
        profileId: current.profile.id,
        status: "DRAFT",
        provider: "manual",
      },
    }),
    prisma.profile.update({
      where: { id: current.profile.id },
      data: {
        verifikStatus: "draft",
        verifikVerifiedAt: null,
      },
    }),
  ]);

  revalidatePath("/verificacion");
  revalidatePath("/vender");
  revalidatePath("/perfil");
  redirect("/verificacion");
}

/**
 * getSellerVerificationSummary
 *
 * Supports verification by implementing getSellerVerificationSummary.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy verification UI and related modules
 */
export async function getSellerVerificationSummary(profileId: string) {
  return getLatestIdentityVerification(profileId);
}
