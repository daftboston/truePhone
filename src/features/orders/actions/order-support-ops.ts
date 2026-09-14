"use server";

/**
 * @file order-support-ops.ts
 * @description REVIEWER/ADMIN Server Actions for assignment, messages, and support-case decisions.
 * @dependencies next/cache, auth session, order support service, Financial Core order cancellation
 */

import { revalidatePath } from "next/cache";

import {
  staffOrderSupportDecisionSchema,
  staffOrderSupportMessageSchema,
  withdrawOrderSupportCaseSchema,
  type OrderSupportActionState,
} from "@/features/orders/schemas/order-support";
import { fieldErrorsFromZod } from "@/features/orders/schemas/order";
import {
  canAccessReviewPortal,
  getCurrentProfile,
  getRequestOrigin,
} from "@/lib/auth/session";
import { cancelOrder } from "@/lib/orders";
import { classifyOrderSupportOptions } from "@/lib/orders/order-support";
import {
  addStaffOrderSupportMessage,
  approveOrderSupportCaseAfterCancellation,
  claimOrderSupportCase,
  getOrderSupportCaseForStaff,
  transitionOrderSupportCase,
} from "@/lib/orders/order-support-service";
import {
  notifyAcceptedSellerCancellation,
  notifyFulfillmentEscalated,
  notifySellerOrderSupportReply,
  notifySellerOrderSupportStatus,
} from "@/lib/notifications/order-support";
import { safeNotify } from "@/lib/notifications/marketplace";

/**
 * revalidateStaffSupportPaths
 *
 * Refreshes queue, detail, seller order, and review hub after staff mutations.
 *
 * @param caseId - Support case UUID.
 * @param orderId - Optional affected order UUID.
 * @calledBy all staff support actions
 */
function revalidateStaffSupportPaths(caseId: string, orderId?: string) {
  revalidatePath("/revision");
  revalidatePath("/revision/soporte-pedidos");
  revalidatePath(`/revision/soporte-pedidos/${caseId}`);
  revalidatePath("/ventas");
  if (orderId) revalidatePath(`/ventas/${orderId}`);
}

/**
 * requireSupportStaff
 *
 * Resolves an authenticated REVIEWER/ADMIN for ops support mutations.
 *
 * @returns Current profile or an action-state error.
 * @calledBy staff support Server Actions
 */
async function requireSupportStaff() {
  const current = await getCurrentProfile();
  if (!current) {
    return {
      current: null,
      error: {
        ok: false,
        error: "Debes iniciar sesión.",
        loginRequired: true,
      } satisfies OrderSupportActionState,
    };
  }
  if (!canAccessReviewPortal(current.profile.role)) {
    return {
      current: null,
      error: {
        ok: false,
        error: "Solo revisores y administradores pueden gestionar soporte.",
      } satisfies OrderSupportActionState,
    };
  }
  return { current, error: null };
}

/**
 * claimOrderSupportCaseAction
 *
 * Assigns an active submitted case to the authenticated staff member.
 *
 * @param _prev - Previous useActionState value.
 * @param formData - caseId.
 * @returns Assignment confirmation or conflict.
 * @calledBy OrderSupportOpsPanel
 */
export async function claimOrderSupportCaseAction(
  _prev: OrderSupportActionState,
  formData: FormData,
): Promise<OrderSupportActionState> {
  const auth = await requireSupportStaff();
  if (!auth.current) return auth.error;

  const parsed = withdrawOrderSupportCaseSchema.safeParse({
    caseId: formData.get("caseId"),
  });
  if (!parsed.success) return { ok: false, error: "Solicitud inválida." };

  const result = await claimOrderSupportCase({
    caseId: parsed.data.caseId,
    staffId: auth.current.profile.id,
  });
  if (!result.ok) return { ok: false, error: result.error };

  revalidateStaffSupportPaths(parsed.data.caseId);
  return { ok: true, message: "Solicitud asignada." };
}

/**
 * staffOrderSupportMessageAction
 *
 * Adds a public reply or private internal note to an assigned case.
 *
 * @param _prev - Previous useActionState value.
 * @param formData - caseId, body, and optional isInternal flag.
 * @returns Message confirmation or validation/assignment error.
 * @calledBy OrderSupportOpsPanel
 */
export async function staffOrderSupportMessageAction(
  _prev: OrderSupportActionState,
  formData: FormData,
): Promise<OrderSupportActionState> {
  const auth = await requireSupportStaff();
  if (!auth.current) return auth.error;

  const parsed = staffOrderSupportMessageSchema.safeParse({
    caseId: formData.get("caseId"),
    body: formData.get("body"),
    isInternal: formData.get("isInternal") === "true",
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa el mensaje.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const result = await addStaffOrderSupportMessage({
    ...parsed.data,
    staffId: auth.current.profile.id,
  });
  if (!result.ok) return { ok: false, error: result.error };

  revalidateStaffSupportPaths(parsed.data.caseId);
  if (!parsed.data.isInternal) {
    await safeNotify(
      notifySellerOrderSupportReply({
        caseId: parsed.data.caseId,
        messageId: result.data.messageId,
        preview: parsed.data.body,
        siteOrigin: await getRequestOrigin(),
      }),
    );
  }
  return {
    ok: true,
    message: parsed.data.isInternal
      ? "Nota interna guardada."
      : "Respuesta enviada.",
  };
}

/**
 * staffOrderSupportDecisionAction
 *
 * Applies role-gated workflow decisions; cancellation approval invokes Financial Core first.
 *
 * @param _prev - Previous useActionState value.
 * @param formData - caseId, decision, and required note.
 * @returns Decision confirmation or recoverable race/policy error.
 * @calledBy OrderSupportOpsPanel
 */
export async function staffOrderSupportDecisionAction(
  _prev: OrderSupportActionState,
  formData: FormData,
): Promise<OrderSupportActionState> {
  const auth = await requireSupportStaff();
  if (!auth.current) return auth.error;

  const parsed = staffOrderSupportDecisionSchema.safeParse({
    caseId: formData.get("caseId"),
    decision: formData.get("decision"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa la decisión.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const supportCase = await getOrderSupportCaseForStaff(parsed.data.caseId);
  if (!supportCase) return { ok: false, error: "Solicitud no encontrada." };

  const isAdmin = auth.current.profile.role === "ADMIN";
  const isFulfillment = supportCase.type === "FULFILLMENT_EXCEPTION";
  if (
    isFulfillment &&
    [
      "APPROVE_CANCELLATION",
      "REJECT",
      "RESOLVE",
      "CONTINUE_FULFILLMENT",
    ].includes(parsed.data.decision) &&
    !isAdmin
  ) {
    return {
      ok: false,
      error:
        "Los resultados financieros de problemas de envío requieren un administrador.",
    };
  }

  const claim = await claimOrderSupportCase({
    caseId: supportCase.id,
    staffId: auth.current.profile.id,
  });
  if (!claim.ok) return { ok: false, error: claim.error };

  if (parsed.data.decision === "APPROVE_CANCELLATION") {
    if (
      supportCase.type !== "SELLER_CANCELLATION" &&
      supportCase.type !== "FULFILLMENT_EXCEPTION"
    ) {
      return {
        ok: false,
        error: "Esta solicitud no admite una cancelación.",
      };
    }

    const alreadyCancelledAsSellerAbandon =
      supportCase.order.status === "CANCELLED" &&
      Boolean(supportCase.order.sellerFulfillmentAbandonedAt);
    if (!alreadyCancelledAsSellerAbandon) {
      const classification = classifyOrderSupportOptions(supportCase.order);
      const stillEligible =
        supportCase.type === "SELLER_CANCELLATION"
          ? classification.cancellation.allowed
          : classification.fulfillmentException.allowed;
      if (!stillEligible) {
        return {
          ok: false,
          error:
            supportCase.type === "SELLER_CANCELLATION" &&
            classification.fulfillmentCommitted
              ? "El envío se comprometió después de la solicitud. Escala el caso como problema de envío."
              : "El pedido ya entró en recepción o liquidación. No puede cancelarse por esta vía.",
        };
      }

      const cancelResult = await cancelOrder({
        orderId: supportCase.orderId,
        actorId: auth.current.profile.id,
        reason: parsed.data.note,
        siteOrigin: await getRequestOrigin(),
        asOpsSellerAbandon: true,
      });
      if (!cancelResult.ok) {
        return {
          ok: false,
          error: `${cancelResult.error} La solicitud permanece abierta para recuperarla.`,
        };
      }
    }

    const approved = await approveOrderSupportCaseAfterCancellation({
      caseId: supportCase.id,
      staffId: auth.current.profile.id,
      note: parsed.data.note,
    });
    if (!approved.ok) return { ok: false, error: approved.error };

    revalidateStaffSupportPaths(supportCase.id, supportCase.orderId);
    await safeNotify(
      notifyAcceptedSellerCancellation({
        orderId: supportCase.orderId,
        caseId: supportCase.id,
        siteOrigin: await getRequestOrigin(),
      }),
    );
    return {
      ok: true,
      message:
        "Cancelación aprobada. El anuncio quedó archivado y el comprador ya puede elegir 8% o reembolso.",
    };
  }

  let status: "NEEDS_SELLER_RESPONSE" | "ESCALATED" | "REJECTED" | "RESOLVED";
  let unfreezePayout = false;
  switch (parsed.data.decision) {
    case "REQUEST_SELLER_RESPONSE":
      status = "NEEDS_SELLER_RESPONSE";
      break;
    case "ESCALATE":
      status = "ESCALATED";
      break;
    case "REJECT":
      status = "REJECTED";
      unfreezePayout = isFulfillment;
      break;
    case "CONTINUE_FULFILLMENT":
      if (!isFulfillment) {
        return {
          ok: false,
          error: "Continuar envío solo aplica a problemas de cumplimiento.",
        };
      }
      status = "RESOLVED";
      unfreezePayout = true;
      break;
    case "RESOLVE":
      if (isFulfillment) {
        return {
          ok: false,
          error:
            "En problemas de envío elige continuar cumplimiento, cancelar o escalar.",
        };
      }
      status = "RESOLVED";
      break;
  }

  const transitioned = await transitionOrderSupportCase({
    caseId: supportCase.id,
    staffId: auth.current.profile.id,
    status,
    note: parsed.data.note,
    unfreezePayout,
  });
  if (!transitioned.ok) return { ok: false, error: transitioned.error };

  revalidateStaffSupportPaths(supportCase.id, supportCase.orderId);
  const siteOrigin = await getRequestOrigin();
  await safeNotify(
    notifySellerOrderSupportStatus({
      caseId: supportCase.id,
      status:
        status === "NEEDS_SELLER_RESPONSE"
          ? "Necesitamos tu respuesta para continuar."
          : status === "ESCALATED"
            ? "Escalamos tu solicitud para una revisión adicional."
            : status === "REJECTED"
              ? "El equipo rechazó la solicitud. Revisa la nota de decisión."
              : "El equipo marcó la solicitud como resuelta.",
      eventKey: `${status}:${transitioned.data.eventKey}`,
      siteOrigin,
    }),
  );
  if (status === "ESCALATED" && isFulfillment) {
    await safeNotify(
      notifyFulfillmentEscalated({
        caseId: supportCase.id,
        siteOrigin,
      }),
    );
  }
  return { ok: true, message: "Estado actualizado." };
}
