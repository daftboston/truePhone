/**
 * @file ops-disputes.ts
 * @description Admin server actions for chargebacks, ops refunds, and dispute resolution.
 * @dependencies next/cache, financial-core chargebacks, ops-dispute schemas
 */

"use server";

import { revalidatePath } from "next/cache";

import {
  authorizeOpsRefundSchema,
  markChargebackAbsorbedSchema,
  recordChargebackSchema,
  resolveDisputeForSellerSchema,
} from "@/features/disputes/schemas/ops-dispute";
import type { OpsDisputeActionState } from "@/features/disputes/types";
import {
  authorizeOpsRefund,
  markChargebackAbsorbed,
  recordChargebackReceived,
  resolveDisputeForSeller,
} from "@/lib/financial-core";
import { getCurrentProfile, getRequestOrigin } from "@/lib/auth/session";

/**
 * requireAdmin
 *
 * Gates dispute mutations to ADMIN profiles.
 *
 * @returns Profile id or failed action state.
 * @calledBy All ops dispute actions
 */
async function requireAdmin(): Promise<
  { ok: true; profileId: string } | { ok: false; state: OpsDisputeActionState }
> {
  const current = await getCurrentProfile();
  if (!current) {
    return { ok: false, state: { ok: false, error: "Debes iniciar sesión." } };
  }
  if (current.profile.role !== "ADMIN") {
    return {
      ok: false,
      state: {
        ok: false,
        error:
          "Solo administradores pueden gestionar contracargos y reembolsos.",
      },
    };
  }
  return { ok: true, profileId: current.profile.id };
}

function revalidateDisputePaths(orderId?: string) {
  revalidatePath("/revision/disputas");
  revalidatePath("/revision/pagos");
  revalidatePath("/revision");
  revalidatePath("/compras");
  revalidatePath("/ventas");
  if (orderId) {
    revalidatePath(`/compras/${orderId}`);
    revalidatePath(`/ventas/${orderId}`);
  }
}

/**
 * authorizeOpsRefundAction
 *
 * ADMIN authorizes a buyer refund for a frozen / disputed order.
 *
 * @param _prev - Previous useActionState value.
 * @param formData - orderId, reason, listingOutcome, notes.
 * @returns OpsDisputeActionState.
 * @calledBy OpsDisputeActions
 */
export async function authorizeOpsRefundAction(
  _prev: OpsDisputeActionState,
  formData: FormData,
): Promise<OpsDisputeActionState> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.state;

  const parsed = authorizeOpsRefundSchema.safeParse({
    orderId: formData.get("orderId"),
    reason: formData.get("reason"),
    listingOutcome: formData.get("listingOutcome") || undefined,
    notes: String(formData.get("notes") ?? "").trim() || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: "Revisa el formulario de reembolso." };
  }

  const result = await authorizeOpsRefund({
    orderId: parsed.data.orderId,
    actorProfileId: gate.profileId,
    siteOrigin: await getRequestOrigin(),
    reason: parsed.data.reason,
    listingOutcome: parsed.data.listingOutcome,
    notes: parsed.data.notes,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidateDisputePaths(parsed.data.orderId);
  return {
    ok: true,
    message: result.alreadyRecorded
      ? "El reembolso ya estaba registrado."
      : `Reembolso autorizado${
          result.refundPesos != null
            ? ` por ${result.refundPesos.toLocaleString("es-CO")} COP`
            : ""
        }.`,
  };
}

/**
 * resolveDisputeForSellerAction
 *
 * ADMIN clears payout freeze in the seller’s favor.
 *
 * @param _prev - Previous useActionState value.
 * @param formData - orderId + optional memo.
 * @returns OpsDisputeActionState.
 * @calledBy OpsDisputeActions
 */
export async function resolveDisputeForSellerAction(
  _prev: OpsDisputeActionState,
  formData: FormData,
): Promise<OpsDisputeActionState> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.state;

  const parsed = resolveDisputeForSellerSchema.safeParse({
    orderId: formData.get("orderId"),
    memo: String(formData.get("memo") ?? "").trim() || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: "Pedido inválido." };
  }

  const result = await resolveDisputeForSeller({
    orderId: parsed.data.orderId,
    actorProfileId: gate.profileId,
    memo: parsed.data.memo,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidateDisputePaths(parsed.data.orderId);
  return {
    ok: true,
    message:
      "Disputa resuelta a favor del vendedor. El pago queda descongelado para liquidación.",
  };
}

/**
 * recordChargebackAction
 *
 * ADMIN manually records a chargeback when the provider signal was missed.
 *
 * @param _prev - Previous useActionState value.
 * @param formData - paymentId + optional amount / reference / memo.
 * @returns OpsDisputeActionState.
 * @calledBy OpsDisputeActions, RecordChargebackForm
 */
export async function recordChargebackAction(
  _prev: OpsDisputeActionState,
  formData: FormData,
): Promise<OpsDisputeActionState> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.state;

  const amountRaw = String(formData.get("amountPesos") ?? "").trim();
  const parsed = recordChargebackSchema.safeParse({
    paymentId: formData.get("paymentId"),
    amountPesos: amountRaw ? amountRaw : undefined,
    providerReference:
      String(formData.get("providerReference") ?? "").trim() || undefined,
    memo: String(formData.get("memo") ?? "").trim() || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: "Revisa los datos del contracargo." };
  }

  const result = await recordChargebackReceived({
    paymentId: parsed.data.paymentId,
    amountPesos: parsed.data.amountPesos,
    providerReference: parsed.data.providerReference,
    memo: parsed.data.memo,
    source: "ops",
    actorProfileId: gate.profileId,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidateDisputePaths();
  return {
    ok: true,
    message: result.alreadyRecorded
      ? "El contracargo ya estaba registrado."
      : "Contracargo registrado. El pago al vendedor queda congelado si aún no se liquidó.",
  };
}

/**
 * markChargebackAbsorbedAction
 *
 * ADMIN acknowledges TruePhone absorbs a post-payout chargeback.
 *
 * @param _prev - Previous useActionState value.
 * @param formData - orderId + optional notes.
 * @returns OpsDisputeActionState.
 * @calledBy OpsDisputeActions
 */
export async function markChargebackAbsorbedAction(
  _prev: OpsDisputeActionState,
  formData: FormData,
): Promise<OpsDisputeActionState> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.state;

  const parsed = markChargebackAbsorbedSchema.safeParse({
    orderId: formData.get("orderId"),
    notes: String(formData.get("notes") ?? "").trim() || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: "Pedido inválido." };
  }

  const result = await markChargebackAbsorbed({
    orderId: parsed.data.orderId,
    actorProfileId: gate.profileId,
    notes: parsed.data.notes,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidateDisputePaths(parsed.data.orderId);
  return {
    ok: true,
    message: result.alreadyRecorded
      ? "La absorción ya estaba registrada."
      : "Contracargo marcado como absorbido por TruePhone (Cuenta Wompi).",
  };
}
