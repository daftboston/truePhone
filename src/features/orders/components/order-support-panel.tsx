"use client";

/**
 * @file order-support-panel.tsx
 * @description Seller support menu, request form, case status, and public transcript.
 * @dependencies react, next/navigation, Button, Badge, Textarea, order-support actions
 */

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderSupportCaseType } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  createOrderSupportCaseAction,
  replyToOrderSupportCaseAction,
  withdrawOrderSupportCaseAction,
} from "@/features/orders/actions/order-support";
import type { OrderSupportActionState } from "@/features/orders/schemas/order-support";
import type {
  OrderSupportClassification,
  OrderSupportOptionAvailability,
} from "@/lib/orders/order-support";
import type { SellerOrderSupportCase } from "@/lib/orders/order-support-service";

const initialState: OrderSupportActionState = null;

const CASE_OPTIONS: Array<{
  type: OrderSupportCaseType;
  title: string;
  description: string;
  availability: keyof Pick<
    OrderSupportClassification,
    "cancellation" | "fulfillmentException" | "generalSupport"
  >;
}> = [
  {
    type: "SELLER_CANCELLATION",
    title: "No puedo completar la venta",
    description: "Solicita que el equipo revise una cancelación.",
    availability: "cancellation",
  },
  {
    type: "FULFILLMENT_EXCEPTION",
    title: "Tengo un problema con el envío",
    description: "Congela la liquidación mientras revisamos el envío.",
    availability: "fulfillmentException",
  },
  {
    type: "GENERAL_SUPPORT",
    title: "Otra pregunta",
    description: "Consulta algo del pedido sin cambiar su estado.",
    availability: "generalSupport",
  },
];

/**
 * supportStatusLabel
 *
 * Maps support workflow status to concise seller-facing Spanish.
 *
 * @param status - Persisted OrderSupportCaseStatus.
 * @returns Localized status label.
 * @calledBy OrderSupportCaseCard
 */
function supportStatusLabel(status: SellerOrderSupportCase["status"]) {
  const labels: Record<SellerOrderSupportCase["status"], string> = {
    PENDING: "Pendiente",
    IN_REVIEW: "En revisión",
    NEEDS_SELLER_RESPONSE: "Esperando tu respuesta",
    ESCALATED: "Escalada",
    APPROVED: "Aprobada",
    REJECTED: "Rechazada",
    RESOLVED: "Resuelta",
    WITHDRAWN: "Retirada",
  };
  return labels[status];
}

/**
 * supportTypeLabel
 *
 * Maps case type to seller-facing Spanish.
 *
 * @param type - Persisted OrderSupportCaseType.
 * @returns Localized case type.
 * @calledBy OrderSupportCaseCard
 */
function supportTypeLabel(type: SellerOrderSupportCase["type"]) {
  if (type === "SELLER_CANCELLATION") return "Solicitud de cancelación";
  if (type === "FULFILLMENT_EXCEPTION") return "Problema con el envío";
  return "Soporte del pedido";
}

/**
 * formatSupportWhen
 *
 * Formats transcript timestamps for Colombia.
 *
 * @param value - Persisted message or case timestamp.
 * @returns Concise localized date/time.
 * @calledBy OrderSupportCaseCard
 */
function formatSupportWhen(value: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

/**
 * OrderSupportCaseCard
 *
 * Displays one seller-safe case transcript with reply and pending withdrawal actions.
 *
 * @param props.supportCase - Case without internal staff notes.
 * @returns Auditable conversation card.
 * @calledBy OrderSupportPanel
 */
function OrderSupportCaseCard({
  supportCase,
}: {
  supportCase: SellerOrderSupportCase;
}) {
  const router = useRouter();
  const [replyState, replyAction, replyPending] = useActionState(
    replyToOrderSupportCaseAction,
    initialState,
  );
  const [withdrawState, withdrawAction, withdrawPending] = useActionState(
    withdrawOrderSupportCaseAction,
    initialState,
  );
  const active = [
    "PENDING",
    "IN_REVIEW",
    "NEEDS_SELLER_RESPONSE",
    "ESCALATED",
  ].includes(supportCase.status);
  const canWithdraw =
    supportCase.status === "PENDING" &&
    !supportCase.assignedStaffId &&
    !supportCase.reviewedAt;

  useEffect(() => {
    if (replyState?.ok || withdrawState?.ok) router.refresh();
  }, [replyState, router, withdrawState]);

  return (
    <article className="border-border space-y-4 rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-foreground text-sm font-semibold">
            {supportTypeLabel(supportCase.type)}
          </h3>
          <p className="text-muted-foreground text-xs">
            {formatSupportWhen(supportCase.createdAt)}
          </p>
        </div>
        <Badge variant="outline">
          {supportStatusLabel(supportCase.status)}
        </Badge>
      </div>

      <div className="bg-muted/60 rounded-lg p-3">
        <p className="text-muted-foreground text-xs font-medium">
          Tu solicitud
        </p>
        <p className="text-foreground mt-1 text-sm whitespace-pre-wrap">
          {supportCase.initialReason}
        </p>
      </div>

      {supportCase.decisionNote ? (
        <div className="border-border border-l-2 pl-3">
          <p className="text-muted-foreground text-xs font-medium">
            Decisión del equipo
          </p>
          <p className="text-foreground mt-1 text-sm whitespace-pre-wrap">
            {supportCase.decisionNote}
          </p>
        </div>
      ) : null}

      {supportCase.messages.length > 0 ? (
        <ol className="space-y-3" aria-label="Conversación con soporte">
          {supportCase.messages.map((message) => (
            <li key={message.id} className="border-border border-t pt-3">
              <div className="flex flex-wrap justify-between gap-2 text-xs">
                <span className="text-foreground font-medium">
                  {message.senderId === supportCase.sellerId
                    ? "Tú"
                    : message.sender.fullName || "Equipo TruePhone"}
                </span>
                <span className="text-muted-foreground">
                  {formatSupportWhen(message.createdAt)}
                </span>
              </div>
              <p className="text-foreground mt-1 text-sm whitespace-pre-wrap">
                {message.body}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-muted-foreground text-sm">
          El equipo aún no ha enviado mensajes.
        </p>
      )}

      {active ? (
        <form action={replyAction} className="space-y-2">
          <input type="hidden" name="caseId" value={supportCase.id} />
          <label
            htmlFor={`support-reply-${supportCase.id}`}
            className="text-foreground text-sm font-medium"
          >
            Responder
          </label>
          <Textarea
            id={`support-reply-${supportCase.id}`}
            name="body"
            maxLength={2000}
            placeholder="Escribe tu respuesta"
            disabled={replyPending}
          />
          {replyState && !replyState.ok ? (
            <p className="text-destructive text-sm" role="alert">
              {replyState.fieldErrors?.body?.[0] ?? replyState.error}
            </p>
          ) : null}
          {replyState?.ok ? (
            <p className="text-muted-foreground text-sm" role="status">
              {replyState.message}
            </p>
          ) : null}
          <Button type="submit" size="sm" loading={replyPending}>
            Enviar respuesta
          </Button>
        </form>
      ) : null}

      {canWithdraw ? (
        <form action={withdrawAction}>
          <input type="hidden" name="caseId" value={supportCase.id} />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            loading={withdrawPending}
          >
            Retirar solicitud
          </Button>
          {withdrawState && !withdrawState.ok ? (
            <p className="text-destructive mt-2 text-sm" role="alert">
              {withdrawState.error}
            </p>
          ) : null}
        </form>
      ) : null}
    </article>
  );
}

/**
 * availabilityForOption
 *
 * Resolves one menu option's current classifier result.
 *
 * @param classification - Server-derived support option matrix.
 * @param key - Option availability key.
 * @returns Availability record.
 * @calledBy OrderSupportPanel
 */
function availabilityForOption(
  classification: OrderSupportClassification,
  key: (typeof CASE_OPTIONS)[number]["availability"],
): OrderSupportOptionAvailability {
  return classification[key];
}

/**
 * OrderSupportPanel
 *
 * Replaces email support with contextual request paths and an in-page conversation.
 *
 * @param props.orderId - Paid seller order.
 * @param props.classification - Server-derived eligibility matrix.
 * @param props.cases - Existing seller-safe case history.
 * @returns Support menu, request form, and existing cases.
 * @calledBy OrderDetailView
 */
export function OrderSupportPanel({
  orderId,
  classification,
  cases,
}: {
  orderId: string;
  classification: OrderSupportClassification;
  cases: SellerOrderSupportCase[];
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(cases.length === 0);
  const [selectedType, setSelectedType] = useState<OrderSupportCaseType | null>(
    null,
  );
  const [confirmed, setConfirmed] = useState(false);
  const [state, action, pending] = useActionState(
    createOrderSupportCaseAction,
    initialState,
  );

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [router, state]);

  const selected = CASE_OPTIONS.find((option) => option.type === selectedType);

  return (
    <section className="border-border space-y-4 rounded-xl border p-4">
      <div className="space-y-1">
        <h2 className="text-foreground text-sm font-semibold">
          Soporte del pedido
        </h2>
        <p className="text-muted-foreground text-sm">
          Las solicitudes se gestionan aquí. No necesitas abrir tu correo.
        </p>
      </div>

      <Button
        type="button"
        variant={menuOpen ? "outline" : "default"}
        fullWidth
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? "Cerrar opciones" : "Contactar soporte"}
      </Button>

      {menuOpen ? (
        <div className="space-y-2">
          {CASE_OPTIONS.map((option) => {
            const availability = availabilityForOption(
              classification,
              option.availability,
            );
            if (!availability.allowed) return null;
            return (
              <button
                key={option.type}
                type="button"
                className="border-border hover:bg-muted/60 focus-visible:ring-ring w-full rounded-lg border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
                onClick={() => {
                  setSelectedType(option.type);
                  setConfirmed(false);
                }}
              >
                <span className="text-foreground block text-sm font-medium">
                  {option.title}
                </span>
                <span className="text-muted-foreground mt-1 block text-xs">
                  {option.description}
                </span>
              </button>
            );
          })}
          {classification.buyerDisputeHandoff ? (
            <p className="text-muted-foreground text-xs">
              El comprador debe usar «Reportar un problema» para reclamos sobre
              el dispositivo o la entrega. Tú aún puedes abrir «Otra pregunta».
            </p>
          ) : null}
        </div>
      ) : null}

      {selected ? (
        <form action={action} className="bg-muted/40 space-y-3 rounded-lg p-3">
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="type" value={selected.type} />
          <div>
            <p className="text-foreground text-sm font-semibold">
              {selected.title}
            </p>
            {selected.type === "SELLER_CANCELLATION" ? (
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                Enviar esto no cancela el pedido de inmediato. El equipo lo
                revisará. Si lo acepta, el anuncio se archivará y el comprador
                elegirá una compra de reemplazo con 8% o el reembolso total. El
                incidente permanece privado para operaciones.
              </p>
            ) : null}
          </div>
          <label
            htmlFor="support-initial-reason"
            className="text-foreground text-sm font-medium"
          >
            Cuéntanos qué pasó
          </label>
          <Textarea
            id="support-initial-reason"
            name="initialReason"
            minLength={10}
            maxLength={1000}
            required
            placeholder="Explica el problema y cualquier detalle útil."
            disabled={pending}
          />
          {selected.type === "SELLER_CANCELLATION" ? (
            <label className="text-foreground flex items-start gap-2 text-xs">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                className="mt-0.5"
              />
              <span>
                Entiendo que esta es una solicitud y que TruePhone debe
                aprobarla antes de cancelar.
              </span>
            </label>
          ) : null}
          {state && !state.ok ? (
            <p className="text-destructive text-sm" role="alert">
              {state.fieldErrors?.initialReason?.[0] ?? state.error}
            </p>
          ) : null}
          {state?.ok ? (
            <p className="text-muted-foreground text-sm" role="status">
              {state.message}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedType(null)}
            >
              Volver
            </Button>
            <Button
              type="submit"
              variant={
                selected.type === "SELLER_CANCELLATION"
                  ? "destructive"
                  : "default"
              }
              size="sm"
              loading={pending}
              disabled={
                pending ||
                (selected.type === "SELLER_CANCELLATION" && !confirmed)
              }
            >
              Enviar solicitud
            </Button>
          </div>
        </form>
      ) : null}

      {cases.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-foreground text-sm font-semibold">
            Tus solicitudes
          </h3>
          {cases.map((supportCase) => (
            <OrderSupportCaseCard
              key={supportCase.id}
              supportCase={supportCase}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
