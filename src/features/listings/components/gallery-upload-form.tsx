/**
 * @file gallery-upload-form.tsx
 * @description Guided eight-slot listing photo gallery with continuous auto-upload.
 * @dependencies react, next/image, lucide-react, listing actions/types, UI primitives
 */

"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Check, Trash2 } from "lucide-react";

import {
  continueFromPhotosAction,
  deleteListingGalleryImageAction,
  uploadListingGalleryAction,
} from "@/features/listings/actions/listings";
import { ListingPhotoSlotGuide } from "@/features/listings/components/listing-photo-slot-guides";
import {
  LISTING_PHOTO_SLOTS,
  MAX_LISTING_GALLERY_PHOTOS,
  MIN_LISTING_GALLERY_PHOTOS,
} from "@/features/listings/types";
import { Button } from "@/components/ui/button";
import { FileInput } from "@/components/ui/file-input";
import { cn } from "@/lib/utils";

type GalleryImage = { id: string; imageUrl: string };

type GalleryFormProps = {
  listingId: string;
  images: GalleryImage[];
};

/**
 * GalleryUploadForm
 *
 * Guided marketplace photo step: eight labeled slots with example icons, then
 * optional extra angles. Each pick/capture uploads immediately into the next
 * empty slot (no second “Subir” tap). Sellers continue once every slot is
 * filled; extras are welcome but never required.
 *
 * @param props.listingId - Draft listing id.
 * @param props.images - Existing gallery images ordered by displayOrder.
 * @returns Guided photo upload UI.
 * @calledBy ListingPhotosPage
 */
export function GalleryUploadForm({ listingId, images }: GalleryFormProps) {
  const filled = images.slice(0, LISTING_PHOTO_SLOTS.length);
  const extras = images.slice(LISTING_PHOTO_SLOTS.length);
  const nextSlot =
    LISTING_PHOTO_SLOTS[
      Math.min(filled.length, LISTING_PHOTO_SLOTS.length - 1)
    ];
  const isComplete = filled.length >= MIN_LISTING_GALLERY_PHOTOS;
  const slotsFull = filled.length >= LISTING_PHOTO_SLOTS.length;
  const isFull = images.length >= MAX_LISTING_GALLERY_PHOTOS;

  const [uploadPending, startUpload] = useTransition();
  const [continuePending, startContinue] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const [deletePendingId, setDeletePendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const uploadLock = useRef(false);

  /**
   * uploadFile
   *
   * Sends one prepared image to the gallery action and surfaces feedback.
   *
   * @param file - Compressed image ready for the Server Action.
   * @calledBy FileInput onFileReady
   */
  function uploadFile(file: File) {
    if (isFull || uploadLock.current) return;
    uploadLock.current = true;
    setError(null);
    setStatus(null);

    const formData = new FormData();
    formData.append("image", file);

    startUpload(async () => {
      try {
        const result = await uploadListingGalleryAction(
          listingId,
          null,
          formData,
        );
        if (result?.ok === false) {
          setError(result.error);
        } else if (result?.ok === true) {
          setStatus(result.message ?? "Foto agregada.");
        }
      } finally {
        uploadLock.current = false;
      }
    });
  }

  /**
   * removeImage
   *
   * Deletes a gallery image and clears local feedback.
   *
   * @param imageId - ListingImage id to remove.
   * @calledBy slot delete controls
   */
  function removeImage(imageId: string) {
    setError(null);
    setStatus(null);
    setDeletePendingId(imageId);
    startDelete(async () => {
      const result = await deleteListingGalleryImageAction(listingId, imageId);
      if (result && result.ok === false) {
        setError(result.error);
      }
      setDeletePendingId(null);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="text-foreground text-sm font-medium">
            {filled.length} de {MIN_LISTING_GALLERY_PHOTOS} fotos
          </p>
          <p className="text-muted-foreground max-w-md text-sm">
            {isComplete
              ? "Listo. Puedes agregar fotos extra o continuar al siguiente paso."
              : `Siguiente: ${nextSlot.title}. ${nextSlot.tip}`}
          </p>
        </div>
        <div
          className="bg-muted h-1.5 w-full max-w-[9rem] overflow-hidden rounded-full"
          role="progressbar"
          aria-valuenow={filled.length}
          aria-valuemin={0}
          aria-valuemax={MIN_LISTING_GALLERY_PHOTOS}
          aria-label="Progreso de fotos"
        >
          <div
            className="bg-primary h-full rounded-full transition-[width] duration-300 ease-out"
            style={{
              width: `${(filled.length / MIN_LISTING_GALLERY_PHOTOS) * 100}%`,
            }}
          />
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {LISTING_PHOTO_SLOTS.map((slot, index) => {
          const image = filled[index];
          const isNext = !image && index === filled.length;
          const isUploadingInto = uploadPending && isNext;

          return (
            <li key={slot.id} className="min-w-0">
              <div
                className={cn(
                  "border-border bg-card relative aspect-square overflow-hidden rounded-2xl border transition-[box-shadow,border-color]",
                  isNext &&
                    "border-primary ring-primary/20 shadow-[var(--shadow-card)] ring-2",
                  image && "border-transparent",
                )}
              >
                {image ? (
                  <>
                    <Image
                      src={image.imageUrl}
                      alt={`Foto: ${slot.title}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 45vw, 200px"
                    />
                    <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 bg-gradient-to-b from-black/55 to-transparent p-2.5">
                      <span className="text-xs font-medium text-white">
                        {slot.title}
                      </span>
                      <span className="bg-success text-success-foreground inline-flex size-5 items-center justify-center rounded-full">
                        <Check className="size-3" strokeWidth={3} aria-hidden />
                      </span>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="absolute right-2 bottom-2 size-8 rounded-full shadow-sm"
                      loading={deletePending && deletePendingId === image.id}
                      aria-label={`Eliminar foto de ${slot.title}`}
                      onClick={() => removeImage(image.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </>
                ) : (
                  <div
                    className={cn(
                      "flex h-full flex-col items-center justify-center gap-2 px-3 text-center",
                      isNext ? "bg-accent/40" : "bg-muted/50",
                    )}
                  >
                    <div
                      className={cn(
                        "size-14 sm:size-16",
                        isNext ? "text-primary" : "text-muted-foreground/70",
                      )}
                    >
                      <ListingPhotoSlotGuide slotId={slot.id} />
                    </div>
                    <div className="space-y-0.5">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          isNext ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {slot.title}
                      </p>
                      <p className="text-muted-foreground line-clamp-2 text-[11px] leading-snug">
                        {isUploadingInto ? "Subiendo…" : slot.tip}
                      </p>
                    </div>
                    {isNext ? (
                      <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                        Siguiente
                      </span>
                    ) : null}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {extras.length > 0 ? (
        <div className="border-border space-y-3 rounded-2xl border border-dashed p-4">
          <p className="text-muted-foreground text-sm">
            {extras.length} foto{extras.length === 1 ? "" : "s"} extra de{" "}
            {MAX_LISTING_GALLERY_PHOTOS - LISTING_PHOTO_SLOTS.length}{" "}
            disponibles. Son opcionales: ayudan a mostrar detalles o accesorios.
          </p>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {extras.map((image, index) => (
              <li
                key={image.id}
                className="relative aspect-square overflow-hidden rounded-xl"
              >
                <Image
                  src={image.imageUrl}
                  alt={`Foto extra ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="120px"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="absolute right-1.5 bottom-1.5 size-8 rounded-full"
                  loading={deletePending && deletePendingId === image.id}
                  aria-label={`Eliminar foto extra ${index + 1}`}
                  onClick={() => removeImage(image.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!isFull ? (
        <div className="border-border bg-muted/30 space-y-3 rounded-2xl border p-4">
          <div className="space-y-1">
            <p className="text-foreground text-sm font-medium">
              {slotsFull
                ? "Agregar foto extra (opcional)"
                : `Agregar ${nextSlot.title.toLowerCase()}`}
            </p>
            <p className="text-muted-foreground text-xs">
              {slotsFull
                ? "Detalles, rayones o accesorios que quieras mostrar."
                : "Elige o toma la foto: se sube sola al hueco siguiente."}
            </p>
          </div>
          <FileInput
            id="listing-gallery-image"
            name="image"
            accept="image/jpeg,image/png,image/webp"
            buttonLabel="Elegir de la galería"
            cameraLabel="Tomar foto"
            captureFacing="environment"
            hideFileName
            disabled={uploadPending || deletePending}
            onFileReady={uploadFile}
          />
          {uploadPending ? (
            <p className="text-muted-foreground text-sm" role="status">
              Subiendo foto…
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          Llegaste al máximo de {MAX_LISTING_GALLERY_PHOTOS} fotos. Elimina una
          para reemplazarla.
        </p>
      )}

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
      {status && !error ? (
        <p className="text-success text-sm" role="status">
          {status}
        </p>
      ) : null}

      <Button
        type="button"
        fullWidth
        className="lg:max-w-xs"
        loading={continuePending}
        disabled={!isComplete || uploadPending}
        onClick={() => {
          setError(null);
          startContinue(async () => {
            try {
              const result = await continueFromPhotosAction(listingId);
              if (result && result.ok === false) {
                setError(result.error);
              }
            } catch {
              // redirect throws
            }
          });
        }}
      >
        Continuar
      </Button>
    </div>
  );
}
