"use client";

/**
 * @file gallery-upload-form.tsx
 * @description GalleryUploadForm component for the listings feature.tsx.
 * @dependencies react, next/image, @/features/listings/actions/listings, @/features/listings/types, @/components/ui/button, @/components/ui/file-input
 */

import { useActionState, useState, useTransition } from "react";
import Image from "next/image";

import {
  continueFromPhotosAction,
  deleteListingGalleryImageAction,
  uploadListingGalleryAction,
} from "@/features/listings/actions/listings";
import {
  LISTING_PHOTO_SHOT_LIST,
  MIN_LISTING_GALLERY_PHOTOS,
  type ListingActionState,
} from "@/features/listings/types";
import { Button } from "@/components/ui/button";
import { FileInput } from "@/components/ui/file-input";
import { Label } from "@/components/ui/label";

type GalleryFormProps = {
  listingId: string;
  images: { id: string; imageUrl: string }[];
};

/**
 * GalleryUploadForm
 *
 * Renders the Gallery Upload Form UI for listings.
 *
 * @param props - GalleryUploadForm props.
 * @returns GalleryUploadForm React element.
 * @calledBy listings pages and parent components
 */
export function GalleryUploadForm({ listingId, images }: GalleryFormProps) {
  const upload = uploadListingGalleryAction.bind(null, listingId);
  const [state, formAction, pending] = useActionState<
    ListingActionState,
    FormData
  >(upload, null);
  const [continuePending, startContinue] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const [deletePendingId, setDeletePendingId] = useState<string | null>(null);
  const [continueError, setContinueError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="border-border bg-muted/40 space-y-2 rounded-xl border p-4">
        <p className="text-foreground text-sm font-medium">
          Mínimo {MIN_LISTING_GALLERY_PHOTOS} fotos · {images.length} subidas
        </p>
        <p className="text-muted-foreground text-xs">
          Incluye el iPhone por todos los lados, la pantalla encendida, la salud
          de batería y el IMEI. Fotografía el iPhone que estás vendiendo.
        </p>
        <ol className="text-muted-foreground grid list-decimal gap-1 pl-4 text-xs sm:grid-cols-2">
          {LISTING_PHOTO_SHOT_LIST.map((shot, index) => (
            <li
              key={shot}
              className={
                index < images.length
                  ? "text-foreground font-medium"
                  : undefined
              }
            >
              {shot}
            </li>
          ))}
        </ol>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <form action={formAction} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="image">Agregar foto</Label>
            <FileInput
              id="image"
              name="image"
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
          {state?.ok === true ? (
            <p className="text-success text-sm" role="status">
              {state.message}
            </p>
          ) : null}
          {deleteError ? (
            <p className="text-destructive text-sm" role="alert">
              {deleteError}
            </p>
          ) : null}
          <Button type="submit" variant="outline" fullWidth loading={pending}>
            Subir foto
          </Button>
        </form>

        {images.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {images.map((image) => (
              <div key={image.id} className="space-y-2">
                <div className="bg-muted relative aspect-square overflow-hidden rounded-xl">
                  <Image
                    src={image.imageUrl}
                    alt="Foto del anuncio"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 45vw, 280px"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  fullWidth
                  loading={deletePending && deletePendingId === image.id}
                  onClick={() => {
                    setDeleteError(null);
                    setDeletePendingId(image.id);
                    startDelete(async () => {
                      const result = await deleteListingGalleryImageAction(
                        listingId,
                        image.id,
                      );
                      if (result && result.ok === false) {
                        setDeleteError(result.error);
                      }
                      setDeletePendingId(null);
                    });
                  }}
                >
                  Eliminar
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Aún no hay fotos. Empieza por el frente y el reverso con buena luz.
          </p>
        )}
      </div>

      {continueError ? (
        <p className="text-destructive text-sm" role="alert">
          {continueError}
        </p>
      ) : null}

      <Button
        type="button"
        fullWidth
        className="lg:max-w-xs"
        loading={continuePending}
        onClick={() => {
          setContinueError(null);
          startContinue(async () => {
            try {
              const result = await continueFromPhotosAction(listingId);
              if (result && result.ok === false) {
                setContinueError(result.error);
              }
            } catch {
              // redirect
            }
          });
        }}
      >
        Continuar
      </Button>
    </div>
  );
}
