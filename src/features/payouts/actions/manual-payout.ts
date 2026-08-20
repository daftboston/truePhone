/**
 * @file manual-payout.ts
 * @description Admin server action: mark AUTHORIZED payout completed after Wompi pay.
 * @dependencies next/cache, financial-core confirmManualPayoutCompleted
 */

"use server";

import { revalidatePath } from "next/cache";

import { confirmManualPayoutCompleted } from "@/lib/financial-core";
import { getCurrentProfile, getRequestOrigin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  notifySellerPayoutSent,
  safeNotify,
} from "@/lib/notifications/marketplace";

export type ManualPayoutActionState =
  { ok: true; message: string } | { ok: false; error: string } | null;

/**
 * markManualPayoutCompletedAction
 *
 * ADMIN confirms seller was paid in the Wompi dashboard (MVP supervised path).
 *
 * @param _prev - Previous useActionState value.
 * @param formData - payoutId + optional providerReference.
 * @returns ManualPayoutActionState.
 * @calledBy MarkManualPayoutButton
 */
export async function markManualPayoutCompletedAction(
  _prev: ManualPayoutActionState,
  formData: FormData,
): Promise<ManualPayoutActionState> {
  const current = await getCurrentProfile();
  if (!current || current.profile.role !== "ADMIN") {
    return {
      ok: false,
      error: "Solo administradores pueden confirmar liquidaciones.",
    };
  }

  const payoutId = String(formData.get("payoutId") ?? "").trim();
  if (!payoutId) {
    return { ok: false, error: "Liquidación inválida." };
  }

  const providerReference =
    String(formData.get("providerReference") ?? "").trim() || null;

  const result = await confirmManualPayoutCompleted({
    payoutId,
    providerReference,
    actorProfileId: current.profile.id,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath("/revision/pagos");
  revalidatePath("/revision");
  revalidatePath("/ventas");
  revalidatePath("/compras");
  revalidatePath("/notificaciones");
  revalidatePath("/", "layout");

  const payout = await prisma.payout.findUnique({
    where: { id: payoutId },
    select: { orderId: true },
  });
  if (payout) {
    await safeNotify(
      notifySellerPayoutSent({
        orderId: payout.orderId,
        siteOrigin: await getRequestOrigin(),
      }),
    );
  }

  return {
    ok: true,
    message: "Liquidación marcada como pagada. El pedido quedó completado.",
  };
}
