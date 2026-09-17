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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-foreground text-sm font-semibold">
          Dirección de entrega
        </h2>
        {delivery.deliveryAddressFrozenAt ? (
          <Badge variant="secondary">Fijada al pagar</Badge>
        ) : null}
      </div>

      <p className="text-muted-foreground text-xs">
        La dirección queda fijada al confirmarse el pago. Un cambio solo procede
        si comprador y vendedor lo aceptan en la plataforma antes de entregar el
        paquete a la transportadora o a TruePhone Premium.
      </p>

      <ul className="text-foreground space-y-1 text-sm">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      {pendingChange ? (
        <div className="bg-muted/50 space-y-3 rounded-lg p-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-foreground text-sm font-medium">
              Solicitud de cambio pendiente
            </p>
            <Badge variant="warning">
              {deliveryAddressChangeStatusLabel(pendingChange.status)}
            </Badge>
          </div>
          <ul className="text-muted-foreground space-y-1 text-xs">
            {formatAddressAuditBlock(pendingChange).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {!isBuyer ? (
            <div className="flex flex-wrap gap-2">
              <form action={respondAction}>
                <input type="hidden" name="changeId" value={pendingChange.id} />
                <input type="hidden" name="decision" value="accept" />
                <ConfirmAction
                  type="submit"
                  idleLabel="Aceptar cambio"
                  confirmLabel="Confirmar dirección nueva"
                  pending={respondPending}
                  variant="default"
                />
              </form>
              <form action={respondAction}>
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
            <p className="text-muted-foreground text-xs">
              Espera la respuesta del vendedor en la plataforma.
            </p>
          )}
        </div>
      ) : null}

      {canRequest ? (
        <div className="space-y-3">
          {!showRequestForm ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowRequestForm(true)}
            >
              Pedir cambio de dirección
            </Button>
          ) : (
            <form action={requestAction} className="space-y-3">
              <input type="hidden" name="orderId" value={orderId} />
              <p className="text-foreground text-sm font-medium">
                Propón la nueva dirección
              </p>
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
            </form>
          )}
        </div>
      ) : null}

      {isBuyer && blockReason && !pendingChange && orderStatus === "PAID" ? (
        <p className="text-muted-foreground text-xs">{blockReason}</p>
      ) : null}

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

      {auditRows.length > 0 ? (
        <div className="border-border space-y-2 border-t pt-3">
          <p className="text-foreground text-xs font-semibold tracking-wide uppercase">
            Historial de cambios
          </p>
          <ul className="space-y-3 text-xs">
            {auditRows.map((change) => (
              <li key={change.id} className="text-muted-foreground space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={
                      change.status === "ACCEPTED" ? "success" : "destructive"
                    }
                  >
                    {deliveryAddressChangeStatusLabel(change.status)}
                  </Badge>
                  <span>{formatWhen(change.createdAt)}</span>
                </div>
                {formatAddressAuditBlock(change).map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
