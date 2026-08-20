"use client";

/**
 * @file possession-form.tsx
 * @description PossessionForm component for the listings feature.tsx.
 * @dependencies react, next/image, @/features/listings/actions/listings, @/features/listings/types, @/components/ui/button, @/components/ui/file-input
 */

import { useActionState } from "react";
import Image from "next/image";

import { uploadPossessionPhotoAction } from "@/features/listings/actions/listings";
import type { ListingActionState } from "@/features/listings/types";
import { Button } from "@/components/ui/button";
import { FileInput } from "@/components/ui/file-input";
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
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <div className="border-border space-y-3 rounded-xl border p-4 text-center lg:text-left">
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

      <div className="space-y-4">
        {photoUrl ? (
          <div className="bg-muted relative aspect-[4/3] overflow-hidden rounded-xl">
            <Image
              src={photoUrl}
              alt="Prueba de posesión"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 560px"
            />
          </div>
        ) : null}

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="possessionImage">Foto con el código</Label>
            <FileInput
              id="possessionImage"
              name="possessionImage"
              accept="image/jpeg,image/png,image/webp"
              required
              buttonLabel="Elegir de la galería"
              cameraLabel="Tomar foto"
              captureFacing="environment"
            />
          </div>

          {state?.ok === false ? (
            <p className="text-destructive text-sm" role="alert">
              {state.error}
            </p>
          ) : null}

          <Button
            type="submit"
            fullWidth
            className="lg:max-w-xs"
            loading={pending}
          >
            {photoUrl ? "Reemplazar foto y continuar" : "Subir y continuar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
