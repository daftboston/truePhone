"use client";

/**
 * @file order-support-ops-panel.tsx
 * @description Staff assignment, transcript, internal notes, replies, and decision controls.
 * @dependencies react, next/navigation, Button, Badge, Textarea, staff support actions
 */

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  claimOrderSupportCaseAction,
  staffOrderSupportDecisionAction,
  staffOrderSupportMessageAction,
} from "@/features/orders/actions/order-support-ops";
import type { OrderSupportActionState } from "@/features/orders/schemas/order-support";
import type { StaffOrderSupportCase } from "@/lib/orders/order-support-service";

const initialState: OrderSupportActionState = null;

/**
 * StaffMessageForm
 *
 * Sends either a seller-visible reply or a private staff note.
 *
 * @param props.caseId - Assigned support case.
 * @param props.isInternal - Whether the message is staff-only.
 * @returns Message form with inline feedback.
 * @calledBy OrderSupportOpsPanel
 */
function StaffMessageForm({
  caseId,
  isInternal,
}: {
  caseId: string;
  isInternal: boolean;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    staffOrderSupportMessageAction,
    initialState,
  );

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [router, state]);

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="caseId" value={caseId} />
      <input
        type="hidden"
        name="isInternal"
        value={isInternal ? "true" : "false"}
      />
      <label
        htmlFor={`${isInternal ? "internal" : "reply"}-${caseId}`}
        className="text-foreground text-sm font-medium"
      >
        {isInternal ? "Nota interna" : "Responder al vendedor"}
      </label>
      <Textarea
        id={`${isInternal ? "internal" : "reply"}-${caseId}`}
        name="body"
        maxLength={2000}
        required
        placeholder={
          isInternal
            ? "Solo visible para revisores y administradores."
            : "El vendedor verá este mensaje en su pedido."
        }
        disabled={pending}
      />
      {state && !state.ok ? (
        <p className="text-destructive text-sm" role="alert">
          {state.fieldErrors?.body?.[0] ?? state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="text-muted-foreground text-sm" role="status">
          {state.message}
        </p>
      ) : null}
      <Button
        type="submit"
        size="sm"
        variant={isInternal ? "outline" : "default"}
        loading={pending}
      >
        {isInternal ? "Guardar nota" : "Enviar respuesta"}
      </Button>
    </form>
  );
}

/**
 * OrderSupportOpsPanel
 *
 * Renders the complete staff workflow for one submitted order-support case.
 *
 * @param props.supportCase - Full case detail including internal notes.
 * @param props.currentStaffId - Authenticated REVIEWER/ADMIN profile id.
 * @param props.currentStaffRole - Role used to hide ADMIN-only financial choices.
 * @returns Assignment, transcript, messaging, and decision controls.
 * @calledBy OrderSupportCasePage
 */
export function OrderSupportOpsPanel({
  supportCase,
  currentStaffId,
  currentStaffRole,
}: {
  supportCase: StaffOrderSupportCase;
  currentStaffId: string;
  currentStaffRole: string;
}) {
  const router = useRouter();
  const [claimState, claimAction, claimPending] = useActionState(
    claimOrderSupportCaseAction,
    initialState,
  );
  const [decisionState, decisionAction, decisionPending] = useActionState(
    staffOrderSupportDecisionAction,
    initialState,
  );
  const active = [
    "PENDING",
    "IN_REVIEW",
    "NEEDS_SELLER_RESPONSE",
    "ESCALATED",
  ].includes(supportCase.status);
  const assignedToCurrent = supportCase.assignedStaffId === currentStaffId;
  const canHandle = active && assignedToCurrent;
  const isAdmin = currentStaffRole === "ADMIN";
  const isFulfillment = supportCase.type === "FULFILLMENT_EXCEPTION";

  useEffect(() => {
    if (claimState?.ok || decisionState?.ok) router.refresh();
  }, [claimState, decisionState, router]);

  return (
    <div className="space-y-5">
      <section className="border-border space-y-3 rounded-xl border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-foreground text-sm font-semibold">Asignación</h2>
          <Badge variant="outline">
            {supportCase.assignedStaff
              ? supportCase.assignedStaff.fullName ||
                supportCase.assignedStaff.username ||
                "Equipo"
              : "Sin asignar"}
          </Badge>
        </div>
        {!supportCase.assignedStaffId && active ? (
          <form action={claimAction}>
            <input type="hidden" name="caseId" value={supportCase.id} />
            <Button type="submit" loading={claimPending}>
              Asignarme solicitud
            </Button>
            {claimState && !claimState.ok ? (
              <p className="text-destructive mt-2 text-sm" role="alert">
                {claimState.error}
              </p>
            ) : null}
          </form>
        ) : null}
        {supportCase.assignedStaffId && !assignedToCurrent && active ? (
          <p className="text-muted-foreground text-sm">
            Otro miembro del equipo está gestionando esta solicitud.
          </p>
        ) : null}
      </section>

      <section className="border-border space-y-4 rounded-xl border p-4">
        <h2 className="text-foreground text-sm font-semibold">
          Conversación y notas
        </h2>
        <div className="bg-muted/60 rounded-lg p-3">
          <p className="text-muted-foreground text-xs font-medium">
            Motivo inicial del vendedor
          </p>
          <p className="text-foreground mt-1 text-sm whitespace-pre-wrap">
            {supportCase.initialReason}
          </p>
        </div>
        {supportCase.messages.length > 0 ? (
          <ol className="space-y-3">
            {supportCase.messages.map((message) => (
              <li key={message.id} className="border-border border-t pt-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-foreground font-medium">
                    {message.sender.fullName ||
                      message.sender.username ||
                      "Usuario"}
                  </span>
                  {message.isInternal ? (
                    <Badge variant="secondary">Interna</Badge>
                  ) : null}
                  <span className="text-muted-foreground ml-auto">
                    {new Intl.DateTimeFormat("es-CO", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(message.createdAt))}
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
            Aún no hay respuestas ni notas.
          </p>
        )}

        {canHandle ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <StaffMessageForm caseId={supportCase.id} isInternal={false} />
            <StaffMessageForm caseId={supportCase.id} isInternal />
          </div>
        ) : null}
      </section>

      {canHandle ? (
        <section className="border-border space-y-3 rounded-xl border p-4">
          <h2 className="text-foreground text-sm font-semibold">Decisión</h2>
          <form action={decisionAction} className="space-y-3">
            <input type="hidden" name="caseId" value={supportCase.id} />
            <label
              htmlFor={`support-decision-${supportCase.id}`}
              className="text-foreground text-sm font-medium"
            >
              Siguiente paso
            </label>
            <select
              id={`support-decision-${supportCase.id}`}
              name="decision"
              className="border-input bg-background ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              required
              defaultValue=""
            >
              <option value="" disabled>
                Selecciona una acción
              </option>
              <option value="REQUEST_SELLER_RESPONSE">
                Solicitar información al vendedor
              </option>
              <option value="ESCALATE">Escalar</option>
              {supportCase.type === "SELLER_CANCELLATION" ? (
                <>
                  <option value="APPROVE_CANCELLATION">
                    Aceptar cancelación
                  </option>
                  <option value="REJECT">Rechazar cancelación</option>
                </>
              ) : null}
              {supportCase.type === "GENERAL_SUPPORT" ? (
                <option value="RESOLVE">Marcar resuelta</option>
              ) : null}
              {isFulfillment && isAdmin ? (
                <>
                  <option value="CONTINUE_FULFILLMENT">
                    Continuar cumplimiento y descongelar
                  </option>
                  <option value="APPROVE_CANCELLATION">
                    Convertir en cancelación aceptada
                  </option>
                  <option value="REJECT">
                    Rechazar excepción y descongelar
                  </option>
                </>
              ) : null}
            </select>
            <label
              htmlFor={`support-note-${supportCase.id}`}
              className="text-foreground text-sm font-medium"
            >
              Nota de decisión
            </label>
            <Textarea
              id={`support-note-${supportCase.id}`}
              name="note"
              minLength={5}
              maxLength={1000}
              required
              placeholder="Explica la decisión y el siguiente paso."
              disabled={decisionPending}
            />
            {decisionState && !decisionState.ok ? (
              <p className="text-destructive text-sm" role="alert">
                {decisionState.fieldErrors?.note?.[0] ?? decisionState.error}
              </p>
            ) : null}
            {decisionState?.ok ? (
              <p className="text-muted-foreground text-sm" role="status">
                {decisionState.message}
              </p>
            ) : null}
            <Button type="submit" loading={decisionPending}>
              Guardar decisión
            </Button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
