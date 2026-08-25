/**
 * @file gallery-upload-form.tsx
 * @description Guided eight-slot listing photo gallery with per-slot capture.
 * @dependencies react, next/image, lucide-react, listing actions/types, UI primitives
 * @changelog 2026-08-25 — Tomar foto / galería on each slot; replace in place.
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
  extraGalleryImages,
  galleryImageAtOrder,
  guidedSlotFillCount,
  isGuidedGalleryComplete,
  LISTING_PHOTO_SLOTS,
  MAX_LISTING_GALLERY_PHOTOS,
  MIN_LISTING_GALLERY_PHOTOS,
  nextEmptyGuidedSlotIndex,
  nextExtraDisplayOrder,
} from "@/features/listings/types";
import { Button } from "@/components/ui/button";
import { FileInput } from "@/components/ui/file-input";
import { cn } from "@/lib/utils";

type GalleryImage = { id: string; imageUrl: string; displayOrder: number };

type GalleryFormProps = {
  listingId: string;
  images: GalleryImage[];
};

type SlotCaptureProps = {
  inputId: string;
  title: string;
  disabled: boolean;
  onFileReady: (file: File) => void;
};

/**
 * SlotCaptureControls
 *
 * Per-slot gallery and camera pickers that upload as soon as a file is ready.
 *
 * @param props.inputId - Unique input id for the hidden file control.
 * @param props.title - Slot title used in accessible button names.
 * @param props.disabled - True while another upload or delete is in flight.
 * @param props.onFileReady - Uploads the compressed file into this slot.
 * @returns Stacked Elegir de la galería / Tomar foto controls.
 * @calledBy GalleryUploadForm slot cards
 */
function SlotCaptureControls({
  inputId,
  title,
  disabled,
  onFileReady,
}: SlotCaptureProps) {
  return (
    <FileInput
      id={inputId}
      name={`image-${inputId}`}
      accept="image/jpeg,image/png,image/webp"
      buttonLabel="Elegir de la galería"
      buttonAriaLabel={`Elegir de la galería: ${title}`}
      cameraLabel="Tomar foto"
      cameraAriaLabel={`Tomar foto: ${title}`}
      captureFacing="environment"
      hideFileName
      layout="stack"
      buttonSize="sm"
      disabled={disabled}
      onFileReady={onFileReady}
    />
  );
}

/**
 * GalleryUploadForm
 *
 * Guided marketplace photo step: eight labeled slots with example icons.
 * Each slot has its own gallery/camera actions so the seller can fill or
 * replace that angle without shifting the others. Extras stay optional.
 *
 * @param props.listingId - Draft listing id.
 * @param props.images - Existing gallery images with displayOrder slot indexes.
 * @returns Guided photo upload UI.
 * @calledBy ListingPhotosPage
 */
export function GalleryUploadForm({ listingId, images }: GalleryFormProps) {
  const filledCount = guidedSlotFillCount(images);
  const extras = extraGalleryImages(images);
  const nextSlotIndex = nextEmptyGuidedSlotIndex(images);
  const nextSlot =
    nextSlotIndex !== null ? LISTING_PHOTO_SLOTS[nextSlotIndex] : null;
  const isComplete = isGuidedGalleryComplete(images);
  const extraOrder = nextExtraDisplayOrder(images);
  const galleryFull = images.length >= MAX_LISTING_GALLERY_PHOTOS;

  const [uploadPending, startUpload] = useTransition();
  const [continuePending, startContinue] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const [deletePendingId, setDeletePendingId] = useState<string | null>(null);
  const [uploadOrder, setUploadOrder] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const uploadLock = useRef(false);
  const busy = uploadPending || deletePending;

  /**
   * uploadFile
   *
   * Sends one prepared image into a specific slot index.
   *
   * @param displayOrder - Guided or extra slot index.
   * @param file - Compressed image ready for the Server Action.
   * @calledBy SlotCaptureControls onFileReady
   */
  function uploadFile(displayOrder: number, file: File) {
    const replacing = Boolean(galleryImageAtOrder(images, displayOrder));
    if ((!replacing && galleryFull) || uploadLock.current) return;
    uploadLock.current = true;
    setUploadOrder(displayOrder);
    setError(null);
    setStatus(null);

    const formData = new FormData();
    formData.append("image", file);

    startUpload(async () => {
      try {
        const result = await uploadListingGalleryAction(
          listingId,
          displayOrder,
          formData,
        );
        if (result?.ok === false) {
          setError(result.error);
        } else if (result?.ok === true) {
          setStatus(result.message ?? "Foto agregada.");
        }
      } finally {
        uploadLock.current = false;
        setUploadOrder(null);
      }
    });
  }

  /**
   * removeImage
   *
   * Deletes a gallery image and clears local feedback. Guided slots stay
   * in place; extras compact on the server.
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
            {filledCount} de {MIN_LISTING_GALLERY_PHOTOS} fotos
          </p>
          <p className="text-muted-foreground max-w-md text-sm">
            {isComplete
              ? "Listo. Puedes cambiar cualquier foto, agregar extras o continuar."
              : nextSlot
                ? `Siguiente: ${nextSlot.title}. ${nextSlot.tip}`
                : null}
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
          const image = galleryImageAtOrder(images, index);
          const isNext = !image && index === nextSlotIndex;
          const isUploadingInto = uploadPending && uploadOrder === index;

          return (
            <li key={slot.id} className="min-w-0 space-y-2">
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
                      key={image.imageUrl}
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
              <SlotCaptureControls
                inputId={`listing-gallery-${slot.id}`}
                title={slot.title}
                disabled={busy}
                onFileReady={(file) => uploadFile(index, file)}
              />
              {isUploadingInto && image ? (
                <p className="text-muted-foreground text-xs" role="status">
                  Subiendo…
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>

      {isComplete ? (
        <div className="border-border space-y-3 rounded-2xl border border-dashed p-4">
          <div className="space-y-1">
            <p className="text-foreground text-sm font-medium">
              Fotos extra (opcional)
            </p>
            <p className="text-muted-foreground text-sm">
              {extras.length} de{" "}
              {MAX_LISTING_GALLERY_PHOTOS - LISTING_PHOTO_SLOTS.length} extras.
              Detalles, rayones o accesorios que quieras mostrar.
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {extras.map((image, index) => (
              <li key={image.id} className="min-w-0 space-y-2">
                <div className="relative aspect-square overflow-hidden rounded-xl">
                  <Image
                    key={image.imageUrl}
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
                </div>
                <SlotCaptureControls
                  inputId={`listing-gallery-extra-${image.displayOrder}`}
                  title={`Foto extra ${index + 1}`}
                  disabled={busy}
                  onFileReady={(file) => uploadFile(image.displayOrder, file)}
                />
                {uploadPending && uploadOrder === image.displayOrder ? (
                  <p className="text-muted-foreground text-xs" role="status">
                    Subiendo…
                  </p>
                ) : null}
              </li>
            ))}
            {extraOrder !== null ? (
              <li className="min-w-0 space-y-2">
                <div className="border-border bg-muted/50 flex aspect-square flex-col items-center justify-center rounded-xl border border-dashed px-3 text-center">
                  <p className="text-foreground text-sm font-medium">
                    Foto extra
                  </p>
                  <p className="text-muted-foreground text-[11px] leading-snug">
                    {uploadPending && uploadOrder === extraOrder
                      ? "Subiendo…"
                      : "Opcional"}
                  </p>
                </div>
                <SlotCaptureControls
                  inputId={`listing-gallery-extra-${extraOrder}`}
                  title="Foto extra"
                  disabled={busy}
                  onFileReady={(file) => uploadFile(extraOrder, file)}
                />
              </li>
            ) : null}
          </ul>
        </div>
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
