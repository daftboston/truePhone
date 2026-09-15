"use server";

/**
 * @file pqr.ts
 * @description Server Action to create a consumer PQR case with immediate radicado ack.
 * @dependencies next/cache, auth session, pqr service, Resend email helpers
 */

import { revalidatePath } from "next/cache";

import { fieldErrorsFromZod } from "@/features/orders/schemas/order";
import {
  createPqrCaseSchema,
  type PqrActionState,
} from "@/features/pqr/schemas/pqr";
import { getCurrentProfile } from "@/lib/auth/session";
import { LEGAL_CONTACT_EMAIL } from "@/lib/legal/constants";
import {
  buildPqrAckEmail,
  buildPqrStaffAlertEmail,
  formatPqrTimestamp,
} from "@/lib/pqr/notifications";
import { createPqrCase, pqrTipoLabel } from "@/lib/pqr/pqr-service";
import { sendNotificationEmail } from "@/lib/notifications/email";
import { createClient } from "@/lib/supabase/server";

const PQR_BUCKET = "pqr-attachments";
const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;
const MAX_ATTACHMENTS = 3;
const ALLOWED_ATTACHMENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

/**
 * uploadPqrAttachments
 *
 * Optionally uploads up to three attachments for a PQR case.
 *
 * @param files - FileList from the form.
 * @param email - Submitter email used for storage path namespacing.
 * @returns Stored attachment metadata or error.
 * @calledBy createPqrCaseAction
 */
async function uploadPqrAttachments(
  files: File[],
  email: string,
): Promise<
  | { ok: true; attachments: { path: string; name: string; type: string }[] }
  | { ok: false; error: string }
> {
  const validFiles = files
    .filter((file) => file.size > 0)
    .slice(0, MAX_ATTACHMENTS);
  if (validFiles.length === 0) {
    return { ok: true, attachments: [] };
  }

  const supabase = await createClient();
  const attachments: { path: string; name: string; type: string }[] = [];

  for (const file of validFiles) {
    if (!ALLOWED_ATTACHMENT_TYPES.has(file.type)) {
      return {
        ok: false,
        error: "Adjuntos: usa JPG, PNG, WebP o PDF (máx. 4 MB c/u).",
      };
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      return { ok: false, error: "Cada adjunto debe pesar máximo 4 MB." };
    }

    const safeEmail = email.replace(/[^a-zA-Z0-9@._-]/g, "_");
    const extension =
      file.type === "application/pdf"
        ? "pdf"
        : (file.type.split("/")[1] ?? "jpg");
    const objectPath = `${safeEmail}/${Date.now()}-${attachments.length}.${extension}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error } = await supabase.storage
      .from(PQR_BUCKET)
      .upload(objectPath, bytes, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      return {
        ok: false,
        error:
          "No pudimos subir los adjuntos. Envía tu caso sin archivos o escríbenos por correo.",
      };
    }

    attachments.push({
      path: `${PQR_BUCKET}/${objectPath}`,
      name: file.name,
      type: file.type,
    });
  }

  return { ok: true, attachments };
}

/**
 * createPqrCaseAction
 *
 * Validates and persists a PQR case, then emails radicado ack to the submitter.
 *
 * @param _prev - Previous action state.
 * @param formData - Public PQR form payload.
 * @returns Success with radicado or validation error.
 * @calledBy PqrForm
 */
export async function createPqrCaseAction(
  _prev: PqrActionState,
  formData: FormData,
): Promise<PqrActionState> {
  const parsed = createPqrCaseSchema.safeParse({
    tipo: formData.get("tipo"),
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    orderId: formData.get("orderId"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los campos marcados.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const current = await getCurrentProfile();
  const attachmentFiles = formData
    .getAll("attachments")
    .filter((entry): entry is File => entry instanceof File);
  const upload = await uploadPqrAttachments(attachmentFiles, parsed.data.email);
  if (!upload.ok) {
    return { ok: false, error: upload.error };
  }

  const result = await createPqrCase({
    ...parsed.data,
    userId: current?.profile.id ?? null,
    attachments: upload.attachments.length > 0 ? upload.attachments : null,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  const tipoLabel = pqrTipoLabel(result.data.tipo);
  const ack = buildPqrAckEmail({
    radicado: result.data.radicado,
    tipoLabel,
    createdAt: result.data.createdAt,
  });

  await sendNotificationEmail({
    to: parsed.data.email,
    subject: ack.subject,
    text: ack.text,
  });

  const staffAlert = buildPqrStaffAlertEmail({
    radicado: result.data.radicado,
    tipoLabel,
    fullName: parsed.data.fullName,
    email: parsed.data.email,
  });

  await sendNotificationEmail({
    to: LEGAL_CONTACT_EMAIL,
    subject: staffAlert.subject,
    text: staffAlert.text,
  });

  revalidatePath("/revision/pqr");

  return {
    ok: true,
    message: `Radicado ${result.data.radicado} · ${formatPqrTimestamp(result.data.createdAt)}`,
    radicado: result.data.radicado,
    createdAt: result.data.createdAt.toISOString(),
    caseId: result.data.id,
  };
}
