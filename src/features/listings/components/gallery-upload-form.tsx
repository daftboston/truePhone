/**
 * @file gallery-upload-form.tsx
 * @description Guided eight-slot listing photo gallery with per-slot capture.
 * @dependencies react, next/image, lucide-react, listing actions/types, UI primitives
 * @changelog 2026-09-10 — Mobile one-slot focus, optimistic preview, delete confirm.
 */

"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Check, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FileInput } from "@/components/ui/file-input";
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
  layout?: "row" | "stack";
};

/**
 * SlotCaptureControls
 *
 * Per-slot gallery and camera pickers that upload as soon as a file is ready.
 *
 * @param props.inputId - Unique input id for the hidden file control.
 * @param props.title - Slot title used in accessible button names.
 * @param props.disabled - True while another upload is in flight.
 * @param props.onFileReady - Uploads the compressed file into this slot.
 * @param props.layout - Button arrangement; row fits overlays.
 * @returns Elegir / Tomar foto controls.
 * @calledBy GalleryUploadForm slot cards
 */
function SlotCaptureControls({
  inputId,
  title,
  disabled,
  onFileReady,
  layout = "stack",
}: SlotCaptureProps) {
  return (
    <FileInput
      id={inputId}
      name={`image-${inputId}`}
      accept="image/jpeg,image/png,image/webp"
      buttonLabel="Elegir"
      buttonAriaLabel={`Elegir foto de la galería: ${title}`}
      cameraLabel="Tomar foto"
      cameraAriaLabel={`Tomar foto: ${title}`}
      captureFacing="environment"
      hideFileName
      layout={layout}
      buttonSize="sm"
      disabled={disabled}
      onFileReady={onFileReady}
    />
  );
}

/**
 * GalleryUploadForm
 *
 * Guided marketplace photo step: eight labeled slots. Mobile focuses one
 * slot at a time; desktop keeps a grid with overlay capture on empty cards.
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

  const [focusedIndex, setFocusedIndex] = useState(
    () => nextEmptyGuidedSlotIndex(images) ?? 0,
  );
  const [previews, setPreviews] = useState<Record<number, string>>({});
  const [uploadPending, startUpload] = useTransition();
  const [continuePending, startContinue] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const [deletePendingId, setDeletePendingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [uploadOrder, setUploadOrder] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const uploadLock = useRef(false);

  useEffect(() => {
    return () => {
      Object.values(previews).forEach((url) => URL.revokeObjectURL(url));
    };
    // Revoke leftover object URLs only on unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * setSlotPreview
   *
   * Stores a local object-URL preview for a slot while the server upload runs.
   *
   * @param displayOrder - Slot index.
   * @param file - Compressed image.
   * @calledBy uploadFile
   */
  function setSlotPreview(displayOrder: number, file: File) {
    setPreviews((current) => {
      const previous = current[displayOrder];
      if (previous) URL.revokeObjectURL(previous);
      return { ...current, [displayOrder]: URL.createObjectURL(file) };
    });
  }

  /**
   * uploadFile
   *
   * Sends one prepared image into a specific slot index with a local preview.
   *
   * @param displayOrder - Guided or extra slot index.
   * @param file - Compressed image ready for the Server Action.
   * @calledBy SlotCaptureControls onFileReady
   */
  function uploadFile(displayOrder: number, file: File) {
    const replacing = Boolean(galleryImageAtOrder(images, displayOrder));
    if ((!replacing && galleryFull) || uploadLock.current) {
      if (uploadLock.current) {
        setError("Espera a que termine la subida anterior.");
      }
      return;
    }
    uploadLock.current = true;
    setUploadOrder(displayOrder);
    setError(null);
    setStatus(null);
    setSlotPreview(displayOrder, file);

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
          if (displayOrder < LISTING_PHOTO_SLOTS.length) {
            const taken = new Set(
              images.map((image) => image.displayOrder).concat(displayOrder),
            );
            const next = LISTING_PHOTO_SLOTS.findIndex(
              (_, index) => !taken.has(index),
            );
            if (next >= 0) setFocusedIndex(next);
          }
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
   * Deletes a gallery image after inline confirmation.
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
      setDeleteConfirmId(null);
    });
  }

  const focusedSlot = LISTING_PHOTO_SLOTS[focusedIndex];
  const focusedImage = galleryImageAtOrder(images, focusedIndex);
  const focusedPreview =
    previews[focusedIndex] ?? focusedImage?.imageUrl ?? null;
  const focusedUploading = uploadPending && uploadOrder === focusedIndex;

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">
        Estas 8 fotos son las que el revisor y el comprador usarán para confiar
        en el iPhone.
      </p>

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
            className="bg-primary h-full rounded-full transition-[width] duration-300 ease-out motion-reduce:transition-none"
            style={{
              width: `${(filledCount / MIN_LISTING_GALLERY_PHOTOS) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="space-y-3 pb-28 sm:hidden sm:pb-0">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {LISTING_PHOTO_SLOTS.map((slot, index) => {
            const image = galleryImageAtOrder(images, index);
            const preview = previews[index] ?? image?.imageUrl ?? null;
            const selected = index === focusedIndex;
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => setFocusedIndex(index)}
                className={cn(
                  "relative size-12 shrink-0 overflow-hidden rounded-lg border",
                  selected
                    ? "border-primary ring-primary/20 ring-2"
                    : "border-border",
                )}
                aria-label={slot.title}
                aria-current={selected ? true : undefined}
              >
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="text-muted-foreground flex size-full items-center justify-center text-[10px]">
                    {index + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="border-border bg-card relative aspect-square overflow-hidden rounded-2xl border">
          {focusedPreview ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
              <img
                src={focusedPreview}
                alt={`Foto: ${focusedSlot.title}`}
                className="size-full object-cover"
              />
              {focusedUploading ? (
                <div className="bg-background/70 text-foreground absolute inset-0 flex items-center justify-center text-sm">
                  Subiendo…
                </div>
              ) : null}
            </>
          ) : (
            <div className="bg-muted/50 flex h-full flex-col items-center justify-center gap-2 px-6 pb-20 text-center">
              <div className="text-primary size-16">
                <ListingPhotoSlotGuide slotId={focusedSlot.id} />
              </div>
              <p className="text-foreground text-sm font-medium">
                {focusedSlot.title}
              </p>
              <p className="text-muted-foreground text-xs">{focusedSlot.tip}</p>
            </div>
          )}
          <div className="bg-background/90 absolute inset-x-0 bottom-0 p-2.5">
            <SlotCaptureControls
              inputId={`listing-gallery-focus-${focusedSlot.id}`}
              title={focusedSlot.title}
              layout="row"
              disabled={uploadPending && uploadOrder !== focusedIndex}
              onFileReady={(file) => uploadFile(focusedIndex, file)}
            />
          </div>
        </div>
        {focusedImage ? (
          deleteConfirmId === focusedImage.id ? (
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs" role="status">
                ¿Quitar esta foto?
              </p>
              <Button
                type="button"
                variant="outline"
                fullWidth
                loading={deletePending && deletePendingId === focusedImage.id}
                onClick={() => removeImage(focusedImage.id)}
              >
                Sí, quitar esta foto
              </Button>
              <Button
                type="button"
                variant="ghost"
                fullWidth
                disabled={deletePending}
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => setDeleteConfirmId(focusedImage.id)}
            >
              Quitar foto
            </Button>
          )
        ) : null}
      </div>

      <ul className="hidden grid-cols-2 gap-3 sm:grid sm:grid-cols-3 sm:gap-4">
        {LISTING_PHOTO_SLOTS.map((slot, index) => {
          const image = galleryImageAtOrder(images, index);
          const preview = previews[index] ?? image?.imageUrl ?? null;
          const isNext = !image && index === nextSlotIndex;
          const isUploadingInto = uploadPending && uploadOrder === index;

          return (
            <li key={slot.id} className="min-w-0 space-y-2">
              <div
                className={cn(
                  "border-border bg-card relative aspect-square overflow-hidden rounded-2xl border motion-reduce:transition-none",
                  isNext && "border-primary ring-primary/20 ring-2",
                  preview && "border-transparent",
                )}
              >
                {preview ? (
                  <>
                    {image && !previews[index] ? (
                      <Image
                        key={image.imageUrl}
                        src={image.imageUrl}
                        alt={`Foto: ${slot.title}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 45vw, 200px"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={preview}
                        alt={`Foto: ${slot.title}`}
                        className="size-full object-cover"
                      />
                    )}
                    <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 bg-gradient-to-b from-black/55 to-transparent p-2.5">
                      <span className="text-xs font-medium text-white">
                        {slot.title}
                      </span>
                      <span className="bg-success text-success-foreground inline-flex size-5 items-center justify-center rounded-full">
                        <Check className="size-3" strokeWidth={3} aria-hidden />
                      </span>
                    </div>
                    {isUploadingInto ? (
                      <div className="bg-background/70 text-foreground absolute inset-0 flex items-center justify-center text-sm">
                        Subiendo…
                      </div>
                    ) : null}
                    {image && deleteConfirmId === image.id ? (
                      <div className="bg-background/90 absolute inset-x-2 bottom-2 space-y-1 rounded-lg p-2">
                        <p className="text-muted-foreground text-[11px]">
                          ¿Quitar esta foto?
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          fullWidth
                          loading={
                            deletePending && deletePendingId === image.id
                          }
                          onClick={() => removeImage(image.id)}
                        >
                          Sí, quitar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          fullWidth
                          onClick={() => setDeleteConfirmId(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : image ? (
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="absolute right-2 bottom-2 size-8 rounded-full"
                        loading={deletePending && deletePendingId === image.id}
                        aria-label={`Eliminar foto de ${slot.title}`}
                        onClick={() => setDeleteConfirmId(image.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    ) : null}
                    <div className="absolute inset-x-2 bottom-2 opacity-0 transition-opacity focus-within:opacity-100 hover:opacity-100">
                      <SlotCaptureControls
                        inputId={`listing-gallery-replace-${slot.id}`}
                        title={slot.title}
                        disabled={uploadPending}
                        onFileReady={(file) => uploadFile(index, file)}
                      />
                    </div>
                  </>
                ) : (
                  <div
                    className={cn(
                      "flex h-full flex-col items-center justify-center gap-2 px-3 pb-16 text-center",
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
                    <div className="absolute inset-x-2 bottom-2">
                      <SlotCaptureControls
                        inputId={`listing-gallery-${slot.id}`}
                        title={slot.title}
                        disabled={uploadPending}
                        onFileReady={(file) => uploadFile(index, file)}
                      />
                    </div>
                  </div>
                )}
              </div>
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
                  {deleteConfirmId === image.id ? (
                    <div className="bg-background/90 absolute inset-x-1.5 bottom-1.5 space-y-1 rounded-lg p-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        fullWidth
                        loading={deletePending && deletePendingId === image.id}
                        onClick={() => removeImage(image.id)}
                      >
                        Sí, quitar
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="absolute right-1.5 bottom-1.5 size-8 rounded-full"
                      loading={deletePending && deletePendingId === image.id}
                      aria-label={`Eliminar foto extra ${index + 1}`}
                      onClick={() => setDeleteConfirmId(image.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
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
                  disabled={uploadPending}
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
