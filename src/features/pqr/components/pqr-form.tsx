"use client";

/**
 * @file pqr-form.tsx
 * @description Public PQR submission form with immediate radicado acknowledgement.
 * @dependencies react, pqr actions, UI primitives
 */

import { useActionState } from "react";

import { createPqrCaseAction } from "@/features/pqr/actions/pqr";
import type { PqrActionState } from "@/features/pqr/schemas/pqr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const initialState: PqrActionState = null;

type PqrFormProps = {
  defaultEmail?: string | null;
  defaultFullName?: string | null;
};

/**
 * PqrForm
 *
 * Collects tipo, identity, optional order id, description, and optional attachments.
 *
 * @param props.defaultEmail - Prefilled account email when signed in.
 * @param props.defaultFullName - Prefilled profile name when signed in.
 * @returns PQR submission form.
 * @calledBy /pqr page
 */
export function PqrForm({ defaultEmail, defaultFullName }: PqrFormProps) {
  const [state, formAction, pending] = useActionState(
    createPqrCaseAction,
    initialState,
  );

  if (state?.ok && state.radicado) {
    return (
      <div
        className="border-border bg-muted/40 space-y-3 rounded-xl border p-4"
        role="status"
      >
        <h2 className="text-foreground text-lg font-semibold">
          Radicado recibido
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Guarda este número de radicado. Te enviamos un correo de confirmación
          con la fecha y hora de radicación.
        </p>
        <p className="text-foreground font-mono text-base font-semibold">
          {state.radicado}
        </p>
        {state.message ? (
          <p className="text-muted-foreground text-sm">{state.message}</p>
        ) : null}
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-4"
      encType="multipart/form-data"
    >
      <div className="space-y-2">
        <Label htmlFor="tipo">Tipo</Label>
        <Select id="tipo" name="tipo" required defaultValue="PETICION">
          <option value="PETICION">Petición</option>
          <option value="QUEJA">Queja</option>
          <option value="RECLAMO">Reclamo</option>
          <option value="RETRACTO">Retracto</option>
          <option value="HABEAS_DATA">Datos personales (habeas data)</option>
          <option value="OTRO">Otro</option>
        </Select>
        {state && !state.ok && state.fieldErrors?.tipo?.[0] ? (
          <p className="text-destructive text-xs">
            {state.fieldErrors.tipo[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">Nombre completo</Label>
        <Input
          id="fullName"
          name="fullName"
          required
          autoComplete="name"
          defaultValue={defaultFullName ?? undefined}
        />
        {state && !state.ok && state.fieldErrors?.fullName?.[0] ? (
          <p className="text-destructive text-xs">
            {state.fieldErrors.fullName[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Correo de tu cuenta TruePhone</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={defaultEmail ?? undefined}
        />
        {state && !state.ok && state.fieldErrors?.email?.[0] ? (
          <p className="text-destructive text-xs">
            {state.fieldErrors.email[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="orderId">Número de pedido (opcional)</Label>
        <Input
          id="orderId"
          name="orderId"
          autoComplete="off"
          placeholder="Si tu caso es sobre una compra"
        />
        {state && !state.ok && state.fieldErrors?.orderId?.[0] ? (
          <p className="text-destructive text-xs">
            {state.fieldErrors.orderId[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="body">Descripción</Label>
        <Textarea
          id="body"
          name="body"
          required
          maxLength={4000}
          rows={6}
          placeholder="Cuéntanos qué necesitas. Si es retracto, indica el número de pedido."
        />
        {state && !state.ok && state.fieldErrors?.body?.[0] ? (
          <p className="text-destructive text-xs">
            {state.fieldErrors.body[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="attachments">Adjuntos (opcional)</Label>
        <Input
          id="attachments"
          name="attachments"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          multiple
        />
        <p className="text-muted-foreground text-xs">
          Hasta 3 archivos · JPG, PNG, WebP o PDF · máx. 4 MB c/u.
        </p>
      </div>

      {state && !state.ok ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" loading={pending}>
        Radicar
      </Button>
    </form>
  );
}
