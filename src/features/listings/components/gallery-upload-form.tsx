/**
 * @file gallery-upload-form.tsx
 * @description Guided eight-slot listing photo gallery with per-slot auto-upload.
 * @dependencies react, next/image, lucide-react, listing actions/types, UI primitives
 */

"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Trash2 } from "lucide-react";

import {
  continueFromPhotosAction,
  deleteListingGalleryImageAction,
  uploadListingGalleryAction,
} from "@/features/listings/actions/listings";
import { ListingPhotoSlotCard } from "@/features/listings/components/listing-photo-slot-card";
import {
  extraGalleryImages,
  galleryImageByDisplayOrder,
  guidedSlotFillCount,
  isGuidedGalleryComplete,
  nextEmptyGuidedSlotIndex,
  nextExtraSlotIndex,
} from "@/features/listings/photo-slots";
import {
  LISTING_PHOTO_SLOTS,
  MAX_LISTING_GALLERY_PHOTOS,
  MIN_LISTING_GALLERY_PHOTOS,
} from "@/features/listings/types";
import { Button } from "@/components/ui/button";
import { FileInput } from "@/components/ui/file-input";

type GalleryImage = { id: string; imageUrl: string; displayOrder: number };

type GalleryFormProps = {
  listingId: string;
  images: GalleryImage[];
};

/**
 * GalleryUploadForm
 *
 * Guided marketplace photo step: eight labeled slots, each with its own
 * camera and gallery actions. Picks upload immediately into that slot
 * (replace if it already has a photo). Optional extras appear after every
 * guided angle is filled.
 *
 * @param props.listingId - Draft listing id.
 * @param props.images - Existing gallery images with stable displayOrder slots.
 * @returns Guided photo upload UI.
 * @calledBy ListingPhotosPage
 */
export function GalleryUploadForm({ listingId, images }: GalleryFormProps) {
  const byOrder = galleryImageByDisplayOrder(images);
  const extras = extraGalleryImages(images);
  const filledCount = guidedSlotFillCount(images);
  const nextSlotIndex = nextEmptyGuidedSlotIndex(images);
  const nextSlot =
    nextSlotIndex != null ? LISTING_PHOTO_SLOTS[nextSlotIndex] : null;
  const extraSlotIndex = nextExtraSlotIndex(images);
  const isComplete = isGuidedGalleryComplete(images);
  const isFull = extraSlotIndex == null;

  const [uploadPending, startUpload] = useTransition();
  const [continuePending, startContinue] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [deletePendingId, setDeletePendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const uploadLock = useRef(false);

  /**
   * uploadFile
   *
   * Sends one prepared image into a specific gallery slot.
   *
   * @param file - Compressed image ready for the Server Action.
   * @param slotIndex - Guided (0–7) or extra (8–11) displayOrder.
   * @calledBy FileInput onFileReady
   */
  function uploadFile(file: File, slotIndex: number) {
    if (uploadLock.current) return;
    uploadLock.current = true;
    setError(null);
    setStatus(null);
    setUploadingSlot(slotIndex);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("slotIndex", String(slotIndex));

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
        setUploadingSlot(null);
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

  const pickersDisabled = uploadPending || deletePending;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="text-foreground text-sm font-medium">
            {filledCount} de {MIN_LISTING_GALLERY_PHOTOS} fotos
          </p>
          <p className="text-muted-foreground max-w-md text-sm">
            {isComplete
              ? "Listo. Puedes cambiar cualquier foto, agregar extras o continuar."
              : nextSlot
                ? `Siguiente: ${nextSlot.title}. ${nextSlot.tip}`
                : "Agrega las fotos guiadas del dispositivo."}
          </p>
        </div>
        <div
          className="bg-muted h-1.5 w-full max-w-[9rem] overflow-hidden rounded-full"
          role="progressbar"
          aria-valuenow={filledCount}
          aria-valuemin={0}
          aria-valuemax={MIN_LISTING_GALLERY_PHOTOS}
          aria-label="Progreso de fotos"
        >
          <div
            className="bg-primary h-full rounded-full transition-[width] duration-300 ease-out"
            style={{
              width: `${(filledCount / MIN_LISTING_GALLERY_PHOTOS) * 100}%`,
            }}
          />
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {LISTING_PHOTO_SLOTS.map((slot, index) => {
          const image = byOrder.get(index);

          return (
            <ListingPhotoSlotCard
              key={slot.id}
              slot={slot}
              image={image}
              isNext={!image && index === nextSlotIndex}
              isUploading={uploadPending && uploadingSlot === index}
              disabled={pickersDisabled}
              deletePending={
                Boolean(image) && deletePending && deletePendingId === image?.id
              }
              onFileReady={(file) => uploadFile(file, index)}
              onRemove={removeImage}
            />
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

      {isComplete && !isFull ? (
        <div className="border-border bg-muted/30 space-y-3 rounded-2xl border p-4">
          <div className="space-y-1">
            <p className="text-foreground text-sm font-medium">
              Agregar foto extra (opcional)
            </p>
            <p className="text-muted-foreground text-xs">
              Detalles, rayones o accesorios que quieras mostrar.
            </p>
          </div>
          <FileInput
            id="listing-gallery-extra"
            name="image-extra"
            accept="image/jpeg,image/png,image/webp"
            buttonLabel="Elegir de la galería"
            cameraLabel="Tomar foto"
            captureFacing="environment"
            hideFileName
            disabled={pickersDisabled || extraSlotIndex == null}
            onFileReady={(file) => {
              if (extraSlotIndex == null) return;
              uploadFile(file, extraSlotIndex);
            }}
          />
          {uploadPending &&
          uploadingSlot != null &&
          uploadingSlot >= LISTING_PHOTO_SLOTS.length ? (
            <p className="text-muted-foreground text-sm" role="status">
              Subiendo foto…
            </p>
          ) : null}
        </div>
      ) : null}

      {isFull ? (
        <p className="text-muted-foreground text-sm">
          Llegaste al máximo de {MAX_LISTING_GALLERY_PHOTOS} fotos. Cambia una
          de las guiadas o elimina una extra para reemplazarla.
        </p>
      ) : null}

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
