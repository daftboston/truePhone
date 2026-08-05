"use client";

/**
 * @file order-shipping-panel.tsx
 * @description Order shipping UI: method select, tracking, Premium ops inspection, buyer receipt/confirm/report.
 * @dependencies shipping actions, financial-core fees, eligibility/labels, UI primitives
 */

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Shipment, ShipmentInspection } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  confirmOrderReceivedAction,
  markOrderReceivedByBuyerAction,
  recordPremiumInspectionAction,
  reportOrderProblemAction,
  selectShippingMethodAction,
  switchCarrierToPremiumAction,
  switchPremiumToCarrierAction,
  uploadCarrierTrackingAction,
} from "@/features/shipping/actions/shipping";
import type { ShippingActionState } from "@/features/shipping/schemas/shipping";
import { PREMIUM_SHIPPING_FEE_PESOS } from "@/lib/financial-core/fees";
import { formatOrderMoney } from "@/lib/format-money";
import {
  availableShippingMethods,
  canSwitchCarrierToPremium,
  canSwitchPremiumToCarrier,
} from "@/lib/shipping/eligibility";
import {
  CARRIER_OPTIONS,
  inspectionResultLabel,
  shipmentStatusLabel,
  shippingMethodLabel,
} from "@/lib/shipping/labels";

type ShipmentWithInspection = Shipment & {
  inspection: ShipmentInspection | null;
};

type OrderShippingPanelProps = {
  orderId: string;
  orderStatus: string;
  perspective: "buyer" | "seller";
  isOps?: boolean;
  sellerCity: string | null;
  shipment: ShipmentWithInspection | null;
  buyerConfirmDeadlineAt: Date | null;
  buyerConfirmedAt: Date | null;
  payoutFrozen: boolean;
  premiumShippingFeePesos: number;
  currency?: string;
};

const initial: ShippingActionState = null;

/**
 * formatWhen
 *
 * Formats a timestamp for shipping status copy in es-CO locale.
 *
 * @param date - Date to format.
 * @returns Medium date + short time string.
 * @calledBy OrderShippingPanel
 */
function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/**
 * ActionFeedback
 *
 * Shows success or error feedback from a shipping server action.
 *
 * @param props.state - Latest ShippingActionState from useActionState.
 * @returns Status or alert paragraph, or null when idle.
 * @calledBy OrderShippingPanel
 */
function ActionFeedback({ state }: { state: ShippingActionState }) {
  if (!state) return null;
  if (state.ok) {
    return (
      <p className="text-muted-foreground text-sm" role="status">
        {state.message}
      </p>
    );
  }
  return (
    <p className="text-destructive text-sm" role="alert">
      {state.error}
    </p>
  );
}

/**
 * canBuyerMarkReceived
 *
 * Returns true when the buyer may acknowledge physical receipt.
 * Carrier: tracking present. Premium: inspection passed or in transit.
 *
 * @param shipment - Current shipment with optional inspection.
 * @returns Whether the "Ya recibí" CTA should show.
 * @calledBy OrderShippingPanel
 */
function canBuyerMarkReceived(shipment: ShipmentWithInspection): boolean {
  if (shipment.deliveredAt) return false;
  if (shipment.status === "FAILED" || shipment.status === "RETURNED") {
    return false;
  }
  if (shipment.method === "CARRIER") {
    return Boolean(shipment.trackingCode);
  }
  if (shipment.method === "PREMIUM_BOGOTA") {
    return (
      shipment.inspection?.result === "PASSED" ||
      shipment.status === "IN_TRANSIT"
    );
  }
  return false;
}

/**
 * OrderShippingPanel
 *
 * Renders shipping method, tracking, Premium inspection, and buyer confirm/report flows.
 *
 * @param props - Order/shipment context and actor perspective (buyer/seller/ops).
 * @returns Shipping section for PAID/COMPLETED orders; null otherwise.
 * @calledBy OrderDetailView
 */
export function OrderShippingPanel({
  orderId,
  orderStatus,
  perspective,
  isOps = false,
  sellerCity,
  shipment,
  buyerConfirmDeadlineAt,
  buyerConfirmedAt,
  payoutFrozen,
  premiumShippingFeePesos,
  currency = "COP",
}: OrderShippingPanelProps) {
  const router = useRouter();
  const isBuyer = perspective === "buyer";
  const isSeller = perspective === "seller";
  const methods = availableShippingMethods(sellerCity);
  const [showReport, setShowReport] = useState(false);

  const [selectState, selectAction, selectPending] = useActionState(
    selectShippingMethodAction,
    initial,
  );
  const [switchPremiumState, switchPremiumAction, switchPremiumPending] =
    useActionState(switchCarrierToPremiumAction, initial);
  const [switchCarrierState, switchCarrierAction, switchCarrierPending] =
    useActionState(switchPremiumToCarrierAction, initial);
  const [trackState, trackAction, trackPending] = useActionState(
    uploadCarrierTrackingAction,
    initial,
  );
  const [receivedState, receivedAction, receivedPending] = useActionState(
    markOrderReceivedByBuyerAction,
    initial,
  );
  const [inspectState, inspectAction, inspectPending] = useActionState(
    recordPremiumInspectionAction,
    initial,
  );
  const [confirmState, confirmAction, confirmPending] = useActionState(
    confirmOrderReceivedAction,
    initial,
  );
  const [reportState, reportAction, reportPending] = useActionState(
    reportOrderProblemAction,
    initial,
  );

  useEffect(() => {
    const ok =
      selectState?.ok ||
      switchPremiumState?.ok ||
      switchCarrierState?.ok ||
      trackState?.ok ||
      receivedState?.ok ||
      inspectState?.ok ||
      confirmState?.ok ||
      reportState?.ok;
    if (ok) router.refresh();
  }, [
    selectState,
    switchPremiumState,
    switchCarrierState,
    trackState,
    receivedState,
    inspectState,
    confirmState,
    reportState,
    router,
  ]);

  if (orderStatus !== "PAID" && orderStatus !== "COMPLETED") {
    return null;
  }

  const delivered = Boolean(shipment?.deliveredAt);
  const showSwitchToPremium =
    isSeller &&
    orderStatus === "PAID" &&
    canSwitchCarrierToPremium({
      sellerCity,
      shipment,
    });
  const showSwitchToCarrier =
    isSeller &&
    orderStatus === "PAID" &&
    canSwitchPremiumToCarrier({
      sellerCity,
      shipment,
    });
  const showMarkReceived =
    isBuyer &&
    orderStatus === "PAID" &&
    shipment &&
    canBuyerMarkReceived(shipment) &&
    !buyerConfirmDeadlineAt;
  const canConfirm =
    isBuyer &&
    orderStatus === "PAID" &&
    Boolean(buyerConfirmDeadlineAt) &&
    !buyerConfirmedAt &&
    !payoutFrozen;

  return (
    <section className="border-border space-y-4 rounded-xl border p-4">
      <div className="space-y-1">
        <h2 className="text-foreground text-sm font-semibold">Envío</h2>
        <p className="text-muted-foreground text-xs">
          Fondos en custodia hasta que confirmes recepción y que el iPhone está
          correcto (o 24 horas sin reporte).
        </p>
      </div>

      {!shipment && isSeller && orderStatus === "PAID" ? (
        <form action={selectAction} className="space-y-3">
          <input type="hidden" name="orderId" value={orderId} />
          <p className="text-foreground text-sm">
            Elige cómo enviarás el iPhone
            {sellerCity ? (
              <span className="text-muted-foreground">
                {" "}
                (tu ciudad: {sellerCity})
              </span>
            ) : (
              <span className="text-muted-foreground">
                {" "}
                (completa tu ciudad en el perfil: elige Bogotá para Premium)
              </span>
            )}
            .
          </p>
          <div className="grid gap-2">
            {methods.includes("PREMIUM_BOGOTA") ? (
              <Button
                type="submit"
                name="method"
                value="PREMIUM_BOGOTA"
                variant="outline"
                fullWidth
                loading={selectPending}
              >
                TruePhone Premium · Bogotá (
                {formatOrderMoney(PREMIUM_SHIPPING_FEE_PESOS, currency)}{" "}
                descontados de tu pago)
              </Button>
            ) : null}
            <Button
              type="submit"
              name="method"
              value="CARRIER"
              fullWidth
              loading={selectPending}
            >
              Transportadora (Servientrega / Envía / otra)
            </Button>
          </div>
          <ActionFeedback state={selectState} />
        </form>
      ) : null}

      {!shipment && isBuyer && orderStatus === "PAID" ? (
        <p className="text-muted-foreground text-sm">
          El vendedor aún no eligió el método de envío. Verás el seguimiento
          aquí cuando lo suba.
        </p>
      ) : null}

      {shipment ? (
        <div className="space-y-3 text-sm">
          <dl className="grid gap-2">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Método</dt>
              <dd className="text-foreground font-medium">
                {shippingMethodLabel(shipment.method)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Estado</dt>
              <dd className="text-foreground font-medium">
                {shipmentStatusLabel(shipment.status)}
              </dd>
            </div>
            {shipment.method === "PREMIUM_BOGOTA" ||
            premiumShippingFeePesos > 0 ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">
                  Fee Premium (vendedor)
                </dt>
                <dd className="text-foreground">
                  {formatOrderMoney(
                    shipment.premiumFeeCop || premiumShippingFeePesos,
                    currency,
                  )}
                </dd>
              </div>
            ) : null}
            {shipment.carrierName ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Transportadora</dt>
                <dd className="text-foreground">{shipment.carrierName}</dd>
              </div>
            ) : null}
            {shipment.trackingCode ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Seguimiento</dt>
                <dd className="text-foreground font-mono text-xs">
                  {shipment.trackingCode}
                </dd>
              </div>
            ) : null}
            {shipment.deliveredAt ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Recepción confirmada</dt>
                <dd className="text-foreground">
                  {formatWhen(shipment.deliveredAt)}
                </dd>
              </div>
            ) : null}
            {shipment.inspection ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Inspección</dt>
                <dd className="text-foreground">
                  {inspectionResultLabel(shipment.inspection.result)}
                </dd>
              </div>
            ) : null}
          </dl>

          {showSwitchToPremium ? (
            <form
              action={switchPremiumAction}
              className="border-border space-y-2 rounded-lg border border-dashed p-3"
            >
              <input type="hidden" name="orderId" value={orderId} />
              <p className="text-muted-foreground text-xs">
                ¿Prefieres TruePhone Premium? Puedes cambiar mientras no hayas
                guardado el código de seguimiento. Se descontarán{" "}
                {formatOrderMoney(PREMIUM_SHIPPING_FEE_PESOS, currency)} de tu
                pago.
              </p>
              <Button
                type="submit"
                variant="outline"
                fullWidth
                loading={switchPremiumPending}
              >
                Cambiar a TruePhone Premium (Bogotá)
              </Button>
              <ActionFeedback state={switchPremiumState} />
            </form>
          ) : null}

          {showSwitchToCarrier ? (
            <form
              action={switchCarrierAction}
              className="border-border space-y-2 rounded-lg border border-dashed p-3"
            >
              <input type="hidden" name="orderId" value={orderId} />
              <p className="text-muted-foreground text-xs">
                ¿Prefieres enviar por transportadora? Puedes cambiar mientras
                TruePhone no haya aprobado la inspección. Se cancelará el
                descuento de{" "}
                {formatOrderMoney(PREMIUM_SHIPPING_FEE_PESOS, currency)} de
                Premium.
              </p>
              <Button
                type="submit"
                variant="outline"
                fullWidth
                loading={switchCarrierPending}
              >
                Cambiar a transportadora
              </Button>
              <ActionFeedback state={switchCarrierState} />
            </form>
          ) : null}

          {shipment.method === "CARRIER" &&
          isSeller &&
          !delivered &&
          orderStatus === "PAID" ? (
            <form
              action={trackAction}
              className="border-border space-y-3 rounded-lg border p-3"
            >
              <p className="text-foreground text-sm font-medium">
                {shipment.trackingCode
                  ? "Actualizar seguimiento"
                  : "Subir código de seguimiento"}
              </p>
              <input type="hidden" name="orderId" value={orderId} />
              <div className="space-y-2">
                <Label htmlFor="carrierName">Transportadora</Label>
                <Select
                  id="carrierName"
                  name="carrierName"
                  required
                  defaultValue={shipment.carrierName ?? "Servientrega"}
                  disabled={trackPending}
                >
                  {CARRIER_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="trackingCode">Código de seguimiento</Label>
                <Input
                  id="trackingCode"
                  name="trackingCode"
                  required
                  minLength={4}
                  defaultValue={shipment.trackingCode ?? ""}
                  placeholder="Ej. 1234567890"
                  disabled={trackPending}
                />
              </div>
              <Button type="submit" fullWidth loading={trackPending}>
                Guardar seguimiento
              </Button>
              <ActionFeedback state={trackState} />
            </form>
          ) : null}

          {shipment.method === "PREMIUM_BOGOTA" &&
          isOps &&
          !delivered &&
          shipment.status !== "FAILED" &&
          orderStatus === "PAID" ? (
            <div className="border-border space-y-3 rounded-lg border p-3">
              <p className="text-foreground text-sm font-medium">
                Operaciones · inspección Premium
              </p>
              <form action={inspectAction} className="space-y-3">
                <input type="hidden" name="orderId" value={orderId} />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="imeiMatch" defaultChecked />
                  IMEI coincide
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="serialMatch" defaultChecked />
                  Serial coincide
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="storageMatch" defaultChecked />
                  Almacenamiento coincide
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="colorMatch" defaultChecked />
                  Color coincide
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="accessoriesOk" defaultChecked />
                  Accesorios OK
                </label>
                <div className="space-y-2">
                  <Label htmlFor="batteryHealthPct">Batería %</Label>
                  <Input
                    id="batteryHealthPct"
                    name="batteryHealthPct"
                    type="number"
                    min={0}
                    max={100}
                    placeholder="85"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea id="notes" name="notes" className="min-h-16" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="submit"
                    name="result"
                    value="PASSED"
                    size="sm"
                    loading={inspectPending}
                  >
                    Aprobar inspección
                  </Button>
                  <Button
                    type="submit"
                    name="result"
                    value="FAILED"
                    variant="outline"
                    size="sm"
                    loading={inspectPending}
                  >
                    Rechazar (no aceptar equipo)
                  </Button>
                </div>
                <ActionFeedback state={inspectState} />
              </form>
            </div>
          ) : null}

          {shipment.method === "PREMIUM_BOGOTA" && isSeller && !delivered ? (
            <p className="text-muted-foreground text-xs">
              TruePhone coordinará la recogida e inspección en Bogotá. Tu pago
              descuenta{" "}
              {formatOrderMoney(
                shipment.premiumFeeCop || PREMIUM_SHIPPING_FEE_PESOS,
                currency,
              )}
              {showSwitchToCarrier
                ? ". Puedes cambiar a transportadora mientras no se apruebe la inspección."
                : "."}
            </p>
          ) : null}

          {isBuyer &&
          orderStatus === "PAID" &&
          !buyerConfirmDeadlineAt &&
          shipment &&
          !canBuyerMarkReceived(shipment) &&
          shipment.status !== "FAILED" ? (
            <p className="text-muted-foreground text-xs">
              {shipment.method === "CARRIER"
                ? "Cuando el vendedor suba el seguimiento, podrás marcar que recibiste el iPhone."
                : "Cuando TruePhone complete la inspección y el envío, podrás marcar que recibiste el iPhone."}
            </p>
          ) : null}
        </div>
      ) : null}

      {showMarkReceived ? (
        <form
          action={receivedAction}
          className="border-border space-y-2 rounded-lg border p-3"
        >
          <input type="hidden" name="orderId" value={orderId} />
          <p className="text-foreground text-sm font-medium">
            ¿Ya tienes el iPhone?
          </p>
          <p className="text-muted-foreground text-xs">
            Al confirmar recepción empiezan 24 horas para revisar el equipo y
            confirmar que está correcto o reportar un problema.
          </p>
          <Button type="submit" fullWidth loading={receivedPending}>
            Ya recibí el iPhone
          </Button>
          <ActionFeedback state={receivedState} />
        </form>
      ) : null}

      {canConfirm ? (
        <div className="border-border space-y-3 rounded-lg border p-3">
          <p className="text-foreground text-sm font-medium">
            ¿El iPhone llegó bien?
          </p>
          <p className="text-muted-foreground text-xs">
            Tienes hasta{" "}
            <span className="text-foreground font-medium">
              {formatWhen(buyerConfirmDeadlineAt!)}
            </span>{" "}
            (24 horas desde que confirmaste recepción) para confirmar o reportar
            un problema. Si no reportas, TruePhone paga al vendedor.
          </p>
          <form action={confirmAction}>
            <input type="hidden" name="orderId" value={orderId} />
            <Button type="submit" fullWidth loading={confirmPending}>
              Confirmar que está correcto
            </Button>
          </form>
          <ActionFeedback state={confirmState} />
          {!showReport ? (
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => setShowReport(true)}
            >
              Reportar un problema
            </Button>
          ) : (
            <form action={reportAction} className="space-y-2">
              <input type="hidden" name="orderId" value={orderId} />
              <Textarea
                name="reason"
                required
                minLength={8}
                placeholder="Describe qué no coincide con el anuncio…"
                className="min-h-20"
                disabled={reportPending}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReport(false)}
                >
                  Volver
                </Button>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  loading={reportPending}
                >
                  Enviar reporte
                </Button>
              </div>
              <ActionFeedback state={reportState} />
            </form>
          )}
        </div>
      ) : null}

      {isBuyer && buyerConfirmedAt ? (
        <p className="text-muted-foreground text-xs" role="status">
          Confirmaste el dispositivo el {formatWhen(buyerConfirmedAt)}.
        </p>
      ) : null}

      {payoutFrozen ? (
        <p className="text-destructive text-xs" role="status">
          El pago al vendedor está congelado por un reporte o disputa.
        </p>
      ) : null}
    </section>
  );
}
