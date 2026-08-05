"use client";

/**
 * @file possession-form.tsx
 * @description PossessionForm component for the listings feature.tsx.
 * @dependencies react, next/image, @/features/listings/actions/listings, @/features/listings/types, @/components/ui/button
 */

import { useActionState } from "react";
import Image from "next/image";

import { uploadPossessionPhotoAction } from "@/features/listings/actions/listings";
import type { ListingActionState } from "@/features/listings/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PossessionFormProps = {
  listingId: string;
  code: string;
  photoUrl: string | null;
};

/**
 * PossessionForm
 *
 * Renders the Possession Form UI for listings.
 *
 * @param props - PossessionForm props.
 * @returns PossessionForm React element.
 * @calledBy listings pages and parent components
 */
export function PossessionForm({
  listingId,
  code,
  photoUrl,
}: PossessionFormProps) {
  const action = uploadPossessionPhotoAction.bind(null, listingId);
  const [state, formAction, pending] = useActionState<
    ListingActionState,
    FormData
  >(action, null);

  return (
    <div className="space-y-5">
      <div className="border-border space-y-3 rounded-xl border p-4 text-center">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Código de posesión
        </p>
        <p className="text-foreground font-mono text-3xl font-semibold tracking-widest">
          {code}
        </p>
        <p className="text-muted-foreground text-sm">
          Escribe este código en un papel o muéstralo en otra pantalla junto al
          iPhone, y toma una foto donde se vean ambos.
        </p>
      </div>

      {photoUrl ? (
        <div className="bg-muted relative aspect-[4/3] overflow-hidden rounded-xl">
          <Image
            src={photoUrl}
            alt="Prueba de posesión"
            fill
            className="object-cover"
            sizes="400px"
          />
        </div>
      ) : null}

      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="possessionImage">Foto con el código</Label>
          <Input
            id="possessionImage"
            name="possessionImage"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            className="cursor-pointer pt-2"
          />
        </div>

        {state?.ok === false ? (
          <p className="text-destructive text-sm" role="alert">
            {state.error}
          </p>
        ) : null}

        <Button type="submit" fullWidth loading={pending}>
          {photoUrl ? "Reemplazar foto y continuar" : "Subir y continuar"}
        </Button>
      </form>
    </div>
  );
}
