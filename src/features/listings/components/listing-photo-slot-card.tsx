/**
 * @file listing-photo-slot-card.tsx
 * @description One guided listing photo slot with per-slot camera and gallery actions.
 * @dependencies next/image, lucide-react, listing photo guides, UI primitives
 */

"use client";

import Image from "next/image";
import { Check, Trash2 } from "lucide-react";

import { ListingPhotoSlotGuide } from "@/features/listings/components/listing-photo-slot-guides";
import type { ListingPhotoSlot } from "@/features/listings/types";
import { Button } from "@/components/ui/button";
import { FileInput } from "@/components/ui/file-input";
import { cn } from "@/lib/utils";

type ListingPhotoSlotCardProps = {
  slot: ListingPhotoSlot;
  image: { id: string; imageUrl: string } | undefined;
  isNext: boolean;
  isUploading: boolean;
  disabled: boolean;
  deletePending: boolean;
  onFileReady: (file: File) => void;
  onRemove: (imageId: string) => void;
};

/**
 * ListingPhotoSlotCard
 *
 * Renders one labeled photo angle with its own Tomar foto / Elegir de la
 * galería controls so sellers can fill or replace that slot without
 * waiting on the sequential “next empty” uploader.
 *
 * @param props.slot - Guided slot title, tip, and id.
 * @param props.image - Photo already stored in this slot, if any.
 * @param props.isNext - Highlights the first empty slot as “Siguiente”.
 * @param props.isUploading - Shows upload progress for this slot.
 * @param props.disabled - Disables pickers while another upload/delete runs.
 * @param props.deletePending - Loading state for this slot’s delete button.
 * @param props.onFileReady - Uploads the prepared file into this slot.
 * @param props.onRemove - Deletes the photo currently in this slot.
 * @returns Guided photo slot card.
 * @calledBy GalleryUploadForm
 */
export function ListingPhotoSlotCard({
  slot,
  image,
  isNext,
  isUploading,
  disabled,
  deletePending,
  onFileReady,
  onRemove,
}: ListingPhotoSlotCardProps) {
  return (
    <li className="min-w-0 space-y-2">
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
            {isUploading ? (
              <p
                className="bg-background/80 text-foreground absolute inset-0 flex items-center justify-center text-sm font-medium"
                role="status"
              >
                Subiendo…
              </p>
            ) : null}
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute right-2 bottom-2 size-8 rounded-full shadow-sm"
              loading={deletePending}
              aria-label={`Eliminar foto de ${slot.title}`}
              onClick={() => onRemove(image.id)}
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
                {isUploading ? "Subiendo…" : slot.tip}
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

      <FileInput
        id={`listing-gallery-${slot.id}`}
        name={`image-${slot.id}`}
        accept="image/jpeg,image/png,image/webp"
        buttonLabel="Elegir de la galería"
        buttonAriaLabel={`Elegir de la galería: ${slot.title}`}
        cameraLabel="Tomar foto"
        cameraAriaLabel={`Tomar foto: ${slot.title}`}
        captureFacing="environment"
        hideFileName
        layout="stack"
        buttonSize="sm"
        disabled={disabled}
        onFileReady={onFileReady}
      />
    </li>
  );
}
