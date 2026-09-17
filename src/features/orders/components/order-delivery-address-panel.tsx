"use client";

/**
 * @file order-delivery-address-panel.tsx
 * @description Frozen delivery address display and buyer/seller change workflow.
 * @dependencies react, delivery-address lib/actions, design-system
 */

import { useActionState, useMemo, useState } from "react";

import { ConfirmAction } from "@/components/confirm-action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  respondDeliveryAddressChangeAction,
  requestDeliveryAddressChangeAction,
} from "@/features/orders/actions/delivery-address";
import {
  DeliveryAddressFields,
  type DeliveryAddressFieldValues,
} from "@/features/orders/components/delivery-address-fields";
import type { DeliveryAddressActionState } from "@/features/orders/schemas/delivery-address";
import {
  canRequestDeliveryAddressChange,
  deliveryAddressChangeBlockedReason,
  deliveryAddressChangeStatusLabel,
  formatAddressAuditBlock,
  formatDeliveryAddressLines,
  type OrderDeliveryAddressSnapshot,
} from "@/lib/orders/delivery-address";
import { resolveCityFormState } from "@/lib/locations/colombia-cities";

type DeliveryAddressChangeRow = {
  id: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: Date;
  respondedAt: Date | null;
  oldRecipientName: string;
  oldPhone: string;
  oldCity: string;
  oldDepartment: string;
  oldAddressLine: string;
  oldNotes: string | null;
  newRecipientName: string;
  newPhone: string;
  newCity: string;
  newDepartment: string;
  newAddressLine: string;
  newNotes: string | null;
  requestedBy: { fullName: string | null; username: string | null };
  respondedBy: { fullName: string | null; username: string | null } | null;
};

type OrderDeliveryAddressPanelProps = {
  orderId: string;
  orderStatus: string;
  perspective: "buyer" | "seller";
  delivery: OrderDeliveryAddressSnapshot;
  shipment: {
    method: string;
    status: string;
    trackingCode: string | null;
    trackingUploadedAt: Date | null;
    evidenceUrl: string | null;
    inspectionAt?: Date | null;
    inTransitAt?: Date | null;
    deliveredAt?: Date | null;
    inspection?: { result: string } | null;
  } | null;
  changes: DeliveryAddressChangeRow[];
};

/**
 * formatWhen
 *
 * @param date - Timestamp to format for es-CO display.
 */
function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/**
 * OrderDeliveryAddressPanel
 *
 * Shows the frozen delivery address, pending change workflow, and audit trail.
 *
 * @param props - Order delivery snapshot and participant perspective.
 * @returns Delivery address card for buyer/seller order detail.
 * @calledBy OrderDetailView
 */
export function OrderDeliveryAddressPanel({
  orderId,
  orderStatus,
  perspective,
  delivery,
  shipment,
  changes,
}: OrderDeliveryAddressPanelProps) {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestState, requestAction, requestPending] = useActionState<
    DeliveryAddressActionState,
    FormData
  >(requestDeliveryAddressChangeAction, null);
  const [respondState, respondAction, respondPending] = useActionState<
    DeliveryAddressActionState,
    FormData
  >(respondDeliveryAddressChangeAction, null);

  const initialChangeValues = useMemo<
    Partial<DeliveryAddressFieldValues>
  >(() => {
    const cityState = resolveCityFormState(delivery.deliveryCity);
    return {
      recipientName: delivery.deliveryRecipientName ?? "",
      phone: delivery.deliveryPhone ?? "",
      department: delivery.deliveryDepartment ?? "",
      cityOption: cityState.cityOption || delivery.deliveryCity || "",
      cityDetail: cityState.cityDetail,
      addressLine: delivery.deliveryAddressLine ?? "",
      notes: delivery.deliveryNotes ?? "",
    };
  }, [delivery]);

  const lines = formatDeliveryAddressLines(delivery);
  if (lines.length === 0) return null;

  const pendingChange = changes.find((change) => change.status === "PENDING");
  const isBuyer = perspective === "buyer";
  const blockReason = deliveryAddressChangeBlockedReason({
    orderStatus: orderStatus as
      "PAID" | "AWAITING_PAYMENT" | "CANCELLED" | "COMPLETED",
    deliveryAddressFrozenAt: delivery.deliveryAddressFrozenAt,
    shipment,
    hasPendingChange: Boolean(pendingChange),
  });
  const canRequest =
    isBuyer &&
    canRequestDeliveryAddressChange({
      orderStatus: orderStatus as
        "PAID" | "AWAITING_PAYMENT" | "CANCELLED" | "COMPLETED",
      deliveryAddressFrozenAt: delivery.deliveryAddressFrozenAt,
      shipment,
      hasPendingChange: Boolean(pendingChange),
    });

  const auditRows = changes.filter((change) => change.status !== "PENDING");

  return (
    <section className="border-border space-y-4 rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <h2 className="text-foreground text-sm font-semibold">
            Dirección de entrega
          </h2>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Al pagar, esta dirección queda fijada. Para cambiarla después, tú y
            el vendedor deben aceptarlo aquí, antes de que el paquete vaya a la
            transportadora o a TruePhone Premium.
          </p>
        </div>
        {delivery.deliveryAddressFrozenAt ? (
          <Badge variant="secondary" className="shrink-0">
            Fijada al pagar
          </Badge>
        ) : null}
      </div>

      <div className="bg-muted/40 space-y-1 rounded-lg p-3">
        {lines.map((line, index) => (
          <p
            key={line}
            className={
              index === 0
                ? "text-foreground text-sm font-medium"
                : "text-muted-foreground text-sm"
            }
          >
            {line}
          </p>
        ))}
      </div>

      {pendingChange ? (
        <div
          className="border-border space-y-3 rounded-lg border p-4"
          aria-live="polite"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-foreground text-sm font-semibold">
              Solicitud pendiente
            </h3>
            <Badge variant="warning">
              {deliveryAddressChangeStatusLabel(pendingChange.status)}
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs">
            {isBuyer
              ? "Propusiste esta dirección. El vendedor debe aceptarla o rechazarla."
              : "El comprador propone esta dirección:"}
          </p>
          <ul className="text-foreground space-y-1 text-sm">
            {formatAddressAuditBlock(pendingChange).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {!isBuyer ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <form action={respondAction} className="min-w-0 flex-1">
                <input type="hidden" name="changeId" value={pendingChange.id} />
                <input type="hidden" name="decision" value="accept" />
                <ConfirmAction
                  type="submit"
                  idleLabel="Aceptar cambio"
                  confirmLabel="Confirmar dirección nueva"
                  hint="La dirección del comprador se actualizará."
                  pending={respondPending}
                  variant="default"
                />
              </form>
              <form action={respondAction} className="min-w-0 flex-1">
                <input type="hidden" name="changeId" value={pendingChange.id} />
                <input type="hidden" name="decision" value="reject" />
                <ConfirmAction
                  type="submit"
                  idleLabel="Rechazar"
                  confirmLabel="Rechazar solicitud"
                  pending={respondPending}
                  variant="outline"
                />
              </form>
            </div>
          ) : (
            <p className="text-muted-foreground text-xs" role="status">
              Tu solicitud está en revisión. Te avisaremos cuando el vendedor
              responda.
            </p>
          )}
          {respondState?.ok === true ? (
            <p className="text-success text-xs" role="status">
              {respondState.message}
            </p>
          ) : null}
          {respondState?.ok === false ? (
            <p className="text-destructive text-xs" role="alert">
              {respondState.error}
            </p>
          ) : null}
        </div>
      ) : null}

      {canRequest ? (
        <div className="border-border space-y-3 rounded-lg border p-4">
          {!showRequestForm ? (
            <>
              <p className="text-muted-foreground text-xs">
                ¿Necesitas enviar el paquete a otra dirección? Pide un cambio y
                espera la confirmación del vendedor.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowRequestForm(true)}
              >
                Pedir cambio de dirección
              </Button>
            </>
          ) : (
            <form action={requestAction} className="space-y-4">
              <input type="hidden" name="orderId" value={orderId} />
              <div className="space-y-1">
                <h3 className="text-foreground text-sm font-semibold">
                  Nueva dirección propuesta
                </h3>
                <p className="text-muted-foreground text-xs">
                  El vendedor debe aceptarla antes de que se aplique.
                </p>
              </div>
              <DeliveryAddressFields
                idPrefix={`change-${orderId}`}
                initialValues={initialChangeValues}
                fieldErrors={
                  requestState?.ok === false
                    ? requestState.fieldErrors
                    : undefined
                }
              />
              <div className="flex flex-wrap gap-2">
                <Button type="submit" loading={requestPending}>
                  Enviar solicitud
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowRequestForm(false)}
                >
                  Cancelar
                </Button>
              </div>
              {requestState?.ok === true ? (
                <p className="text-success text-xs" role="status">
                  {requestState.message}
                </p>
              ) : null}
              {requestState?.ok === false ? (
                <p className="text-destructive text-xs" role="alert">
                  {requestState.error}
                </p>
              ) : null}
            </form>
          )}
        </div>
      ) : null}

      {isBuyer && blockReason && !pendingChange && orderStatus === "PAID" ? (
        <p className="text-muted-foreground text-xs" role="status">
          {blockReason}
        </p>
      ) : null}

      {auditRows.length > 0 ? (
        <div className="border-border space-y-3 border-t pt-4">
          <h3 className="text-foreground text-xs font-semibold tracking-wide uppercase">
            Historial
          </h3>
          <ul className="space-y-3">
            {auditRows.map((change) => (
              <li
                key={change.id}
                className="border-border space-y-2 rounded-lg border p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={
                      change.status === "ACCEPTED" ? "success" : "destructive"
                    }
                  >
                    {deliveryAddressChangeStatusLabel(change.status)}
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    {formatWhen(change.createdAt)}
                  </span>
                </div>
                <ul className="text-muted-foreground space-y-1 text-xs">
                  {formatAddressAuditBlock(change).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
