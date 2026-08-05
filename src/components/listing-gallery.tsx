"use client";

/**
 * @file listing-gallery.tsx
 * @description Client image gallery with main preview and thumbnail selection.
 * @dependencies next/image, react, @/lib/utils
 */

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

type GalleryImage = {
  id: string;
  imageUrl: string;
};

type ListingGalleryProps = {
  images: GalleryImage[];
  alt: string;
  className?: string;
};

/**
 * ListingGallery
 *
 * Lets buyers browse listing photos; shows a placeholder when images are empty.
 *
 * @param props.images - Gallery images with id and imageUrl.
 * @param props.alt - Alt text for the active image.
 * @param props.className - Optional className.
 * @returns Interactive gallery or empty-state placeholder.
 * @calledBy PublicListingPage and seller listing review surfaces
 */
export function ListingGallery({
  images,
  alt,
  className,
}: ListingGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex] ?? images[0];

  if (!active) {
    return (
      <div
        className={cn(
          "bg-muted text-muted-foreground flex aspect-[4/5] items-center justify-center rounded-2xl text-sm",
          className,
        )}
      >
        Sin foto
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="bg-muted relative aspect-[4/5] overflow-hidden rounded-2xl">
        <Image
          src={active.imageUrl}
          alt={`${alt} · foto ${activeIndex + 1}`}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 480px"
        />
      </div>
      {images.length > 1 ? (
        <ul className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <li key={image.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Ver foto ${index + 1}`}
                aria-pressed={index === activeIndex}
                className={cn(
                  "border-border relative size-16 overflow-hidden rounded-lg border",
                  index === activeIndex && "ring-primary ring-2 ring-offset-2",
                )}
              >
                <Image
                  src={image.imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
