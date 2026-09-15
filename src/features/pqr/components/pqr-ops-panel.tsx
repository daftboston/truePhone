"use client";

/**
 * @file pqr-ops-panel.tsx
 * @description Staff assignment and response controls for one PQR case.
 * @dependencies react, next/navigation, pqr ops actions, UI primitives
 */

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { ConfirmAction } from "@/components/confirm-action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  claimPqrCaseAction,
  staffClosePqrCaseAction,
  staffRespondPqrCaseAction,
} from "@/features/pqr/actions/pqr-ops";
import type { PqrActionState } from "@/features/pqr/schemas/pqr";
import { pqrStatusLabel, pqrTipoLabel } from "@/lib/pqr/pqr-labels";
import type { StaffPqrCase } from "@/lib/pqr/pqr-service";

const initialState: PqrActionState = null;

/**
 * PqrOpsPanel
 *
 * Renders assignment, response, and close controls for one PQR case.
 *
 * @param props.pqrCase - Full case detail from staff service.
 * @param props.currentStaffId - Authenticated REVIEWER/ADMIN profile id.
 * @returns Staff workflow panel.
 * @calledBy PqrCasePage
 */
export function PqrOpsPanel({
  pqrCase,
  currentStaffId,
}: {
  pqrCase: StaffPqrCase;
  currentStaffId: string;
}) {
  const router = useRouter();
  const [claimState, claimAction, claimPending] = useActionState(
    claimPqrCaseAction,
    initialState,
  );
  const [respondState, respondAction, respondPending] = useActionState(
    staffRespondPqrCaseAction,
    initialState,
  );
  const [closeState, closeAction, closePending] = useActionState(
    staffClosePqrCaseAction,
    initialState,
  );

  useEffect(() => {
    if (claimState?.ok || respondState?.ok || closeState?.ok) router.refresh();
  }, [router, claimState, respondState, closeState]);

  const assignedToSelf = pqrCase.assignedStaffId === currentStaffId;
  const canRespond =
    pqrCase.status !== "CLOSED" && (assignedToSelf || !pqrCase.assignedStaffId);

  return (
    <section className="border-border space-y-6 rounded-xl border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-foreground text-sm font-semibold">Gestión PQR</h2>
        <Badge variant="outline">{pqrTipoLabel(pqrCase.tipo)}</Badge>
        <Badge variant="secondary">{pqrStatusLabel(pqrCase.status)}</Badge>
      </div>

      <dl className="text-muted-foreground grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs">Radicado</dt>
          <dd className="text-foreground font-mono font-medium">
            {pqrCase.radicado}
          </dd>
        </div>
        <div>
          <dt className="text-xs">Correo</dt>
          <dd className="text-foreground">{pqrCase.email}</dd>
        </div>
        <div>
          <dt className="text-xs">Nombre</dt>
          <dd className="text-foreground">{pqrCase.fullName}</dd>
        </div>
        <div>
          <dt className="text-xs">Pedido</dt>
          <dd className="text-foreground">{pqrCase.orderId ?? "—"}</dd>
        </div>
      </dl>

      <div className="space-y-2">
        <h3 className="text-foreground text-sm font-medium">Descripción</h3>
        <p className="text-muted-foreground text-sm whitespace-pre-wrap">
          {pqrCase.body}
        </p>
      </div>

      {pqrCase.respuesta ? (
        <div className="space-y-2">
          <h3 className="text-foreground text-sm font-medium">
            Respuesta publicada
          </h3>
          <p className="text-muted-foreground text-sm whitespace-pre-wrap">
            {pqrCase.respuesta}
          </p>
          {pqrCase.respondedAt ? (
            <p className="text-muted-foreground text-xs">
              {new Intl.DateTimeFormat("es-CO", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(pqrCase.respondedAt)}
              {pqrCase.respondedBy
                ? ` · ${pqrCase.respondedBy.fullName || pqrCase.respondedBy.username || "equipo"}`
                : null}
            </p>
          ) : null}
        </div>
      ) : null}

      {!pqrCase.assignedStaffId && pqrCase.status === "PENDING" ? (
        <form action={claimAction}>
          <input type="hidden" name="caseId" value={pqrCase.id} />
          <Button type="submit" size="sm" loading={claimPending}>
            Asignarme este caso
          </Button>
          {claimState && !claimState.ok ? (
            <p className="text-destructive mt-2 text-sm">{claimState.error}</p>
          ) : null}
        </form>
      ) : pqrCase.assignedStaff ? (
        <p className="text-muted-foreground text-xs">
          Asignado a{" "}
          {pqrCase.assignedStaff.fullName ||
            pqrCase.assignedStaff.username ||
            "equipo"}
        </p>
      ) : null}

      {canRespond ? (
        <form action={respondAction} className="space-y-2">
          <input type="hidden" name="caseId" value={pqrCase.id} />
          <label
            htmlFor={`respuesta-${pqrCase.id}`}
            className="text-foreground text-sm font-medium"
          >
            Responder al consumidor
          </label>
          <Textarea
            id={`respuesta-${pqrCase.id}`}
            name="respuesta"
            required
            maxLength={4000}
            rows={5}
            defaultValue={pqrCase.respuesta ?? ""}
            placeholder="Respuesta formal que se enviará por correo al radicante."
            disabled={respondPending}
          />
          {respondState && !respondState.ok ? (
            <p className="text-destructive text-sm">{respondState.error}</p>
          ) : null}
          {respondState?.ok ? (
            <p className="text-muted-foreground text-sm">
              {respondState.message}
            </p>
          ) : null}
          <Button type="submit" size="sm" loading={respondPending}>
            Enviar respuesta
          </Button>
        </form>
      ) : null}

      {pqrCase.status === "RESPONDED" ? (
        <form action={closeAction}>
          <input type="hidden" name="caseId" value={pqrCase.id} />
          <ConfirmAction
            type="submit"
            variant="outline"
            size="sm"
            fullWidth={false}
            pending={closePending}
            idleLabel="Cerrar caso"
            confirmLabel="¿Cerrar este caso?"
            hint="El consumidor ya recibió respuesta. Cerrar mueve el caso al archivo."
          />
          {closeState && !closeState.ok ? (
            <p className="text-destructive mt-2 text-sm">{closeState.error}</p>
          ) : null}
          {closeState?.ok ? (
            <p className="text-muted-foreground mt-2 text-sm">
              {closeState.message}
            </p>
          ) : null}
        </form>
      ) : null}
    </section>
  );
}
