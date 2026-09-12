"use client";

/**
 * @file review-photo-inspect.tsx
 * @description Labeled listing-review photos with a custom fullscreen inspect overlay.
 * @dependencies lucide-react, next/image, react, Button, LISTING_PHOTO_SLOTS
 */

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent } from "react";

import { Button } from "@/components/ui/button";
import { LISTING_PHOTO_SLOTS } from "@/features/listings/types";

type ReviewImage = {
  id: string;
  imageUrl: string;
  displayOrder?: number;
};

type InspectPhoto = {
  id: string;
  imageUrl: string;
  label: string;
  caption: string;
};

type ReviewPhotoInspectProps = {
  gallery: ReviewImage[];
  possession: ReviewImage | null;
  possessionCode: string | null;
};

/**
 * reviewPhotoLabel
 *
 * Resolves the guided-slot title for a gallery image, or a numbered fallback.
 *
 * @param image - Gallery row with optional displayOrder slot index.
 * @param fallbackIndex - Zero-based position among unlabeled extras.
 * @returns Spanish slot label.
 * @calledBy photosFromReview
 */
function reviewPhotoLabel(image: ReviewImage, fallbackIndex: number) {
  if (
    image.displayOrder != null &&
    image.displayOrder >= 0 &&
    image.displayOrder < LISTING_PHOTO_SLOTS.length
  ) {
    return LISTING_PHOTO_SLOTS[image.displayOrder].title;
  }
  return `Foto ${fallbackIndex + 1}`;
}

/**
 * photosFromReview
 *
 * Builds the inspect sequence: gallery slots first, possession last.
 *
 * @param gallery - Guided and extra listing photos.
 * @param possession - Possession challenge photo, if present.
 * @param possessionCode - Challenge code shown in the possession caption.
 * @returns Ordered inspect photos.
 * @calledBy ReviewPhotoInspect
 */
function photosFromReview(
  gallery: ReviewImage[],
  possession: ReviewImage | null,
  possessionCode: string | null,
): InspectPhoto[] {
  const photos: InspectPhoto[] = gallery.map((image, index) => {
    const label = reviewPhotoLabel(image, index);
    return { id: image.id, imageUrl: image.imageUrl, label, caption: label };
  });

  if (possession) {
    const caption = possessionCode
      ? `Posesión · ${possessionCode}`
      : "Posesión";
    photos.push({
      id: possession.id,
      imageUrl: possession.imageUrl,
      label: "Posesión",
      caption,
    });
  }

  return photos;
}

/**
 * ReviewPhotoInspect
 *
 * Shows the first gallery (or possession) photo large, then labeled thumbs.
 * Clicking a photo opens a fullscreen contain overlay with swipe and Esc.
 *
 * @param props.gallery - Guided and extra listing photos.
 * @param props.possession - Possession challenge photo, if present.
 * @param props.possessionCode - Challenge code shown on the possession overlay.
 * @returns Photo inspect layout, or null when there is nothing to show.
 * @calledBy ListingReviewDetailPage
 */
export function ReviewPhotoInspect({
  gallery,
  possession,
  possessionCode,
}: ReviewPhotoInspectProps) {
  const photos = photosFromReview(gallery, possession, possessionCode);
  const hero = photos[0];
  const thumbs = photos.slice(1);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const pointerStartX = useRef<number | null>(null);

  /**
   * goTo
   *
   * Moves the overlay photo, wrapping at the ends.
   *
   * @param nextIndex - Target index in `photos`.
   */
  function goTo(nextIndex: number) {
    if (photos.length === 0) return;
    const wrapped =
      ((nextIndex % photos.length) + photos.length) % photos.length;
    setOpenIndex(wrapped);
  }

  useEffect(() => {
    if (openIndex == null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    /**
     * onKeyDown
     *
     * Esc closes; arrows move when more than one photo exists.
     *
     * @param event - Window keyboard event.
     */
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenIndex(null);
        return;
      }
      if (photos.length < 2) return;
      if (event.key === "ArrowLeft") {
        setOpenIndex((current) =>
          current == null
            ? current
            : (current - 1 + photos.length) % photos.length,
        );
      }
      if (event.key === "ArrowRight") {
        setOpenIndex((current) =>
          current == null ? current : (current + 1) % photos.length,
        );
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [openIndex, photos.length]);

  /**
   * onPointerDown
   *
   * Records the swipe start X on the overlay image.
   *
   * @param event - Pointer event on the inspect stage.
   */
  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    pointerStartX.current = event.clientX;
  }

  /**
   * onPointerUp
   *
   * Advances or rewinds when the horizontal swipe exceeds 40px.
   *
   * @param event - Pointer event on the inspect stage.
   */
  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = pointerStartX.current;
    pointerStartX.current = null;
    if (start == null || photos.length < 2 || openIndex == null) return;
    const delta = event.clientX - start;
    if (delta <= -40) goTo(openIndex + 1);
    if (delta >= 40) goTo(openIndex - 1);
  }

  if (!hero) return null;

  const openPhoto = openIndex != null ? photos[openIndex] : null;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpenIndex(0)}
        className="bg-muted relative block aspect-[4/3] w-full overflow-hidden rounded-xl"
        aria-label={`Ampliar ${hero.label}`}
      >
        <Image
          src={hero.imageUrl}
          alt={hero.label}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 90vw, 560px"
        />
        <span className="bg-background/80 text-foreground pointer-events-none absolute inset-x-0 bottom-0 px-2 py-1 text-center text-xs">
          {hero.caption}
        </span>
      </button>

      {thumbs.length > 0 ? (
        <div className="grid grid-cols-4 gap-2">
          {thumbs.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setOpenIndex(index + 1)}
              className="bg-muted relative aspect-square overflow-hidden rounded-lg"
              aria-label={`Ampliar ${photo.label}`}
            >
              <Image
                src={photo.imageUrl}
                alt={photo.label}
                fill
                className="object-cover"
                sizes="22vw"
              />
              <span className="bg-background/80 text-foreground pointer-events-none absolute inset-x-0 bottom-0 truncate px-1 py-0.5 text-center text-[10px]">
                {photo.caption}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {openPhoto ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={openPhoto.caption}
          className="bg-foreground/90 text-background fixed inset-0 z-50 flex flex-col"
          onClick={() => setOpenIndex(null)}
        >
          <div
            className="relative flex items-center justify-between gap-2 px-4 py-3"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="min-w-0 truncate text-sm font-medium">
              {openPhoto.caption}
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setOpenIndex(null)}
            >
              <X className="size-4" aria-hidden />
              Cerrar
            </Button>
          </div>
          <div className="relative min-h-0 flex-1 p-4">
            <div
              className="relative h-full touch-pan-y"
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
              onPointerCancel={() => {
                pointerStartX.current = null;
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <Image
                src={openPhoto.imageUrl}
                alt={openPhoto.label}
                fill
                draggable={false}
                className="pointer-events-none object-contain"
                sizes="100vw"
              />
              {photos.length > 1 ? (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute top-1/2 left-3 -translate-y-1/2"
                    aria-label="Foto anterior"
                    onClick={() => goTo((openIndex ?? 0) - 1)}
                  >
                    <ChevronLeft className="size-4" aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute top-1/2 right-3 -translate-y-1/2"
                    aria-label="Foto siguiente"
                    onClick={() => goTo((openIndex ?? 0) + 1)}
                  >
                    <ChevronRight className="size-4" aria-hidden />
                  </Button>
                </>
              ) : null}
            </div>
          </div>
          <div
            className="relative flex items-center justify-between gap-3 px-4 py-3"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-xs opacity-80">
              {openIndex != null ? openIndex + 1 : 1} / {photos.length}
            </p>
            <a
              href={openPhoto.imageUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium underline-offset-4 hover:underline"
            >
              Abrir original
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
