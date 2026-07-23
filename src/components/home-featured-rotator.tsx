"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { PriceDisplay } from "@/components/price-display";
import { SellerCard } from "@/components/seller-card";
import { TrustBadge } from "@/components/trust-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ROTATE_MS = 4000;

export type FeaturedListingSlide = {
  id: string;
  href: string;
  title: string;
  imageUrl?: string;
  price: number;
  equipmentPrice: number;
  protectionFee?: number;
  conditionLabel: string;
  sellerName: string;
  sellerAvatarUrl?: string;
  sellerVerified: boolean;
  sellerSubtitle?: string;
};

type HomeFeaturedRotatorProps = {
  listings: FeaturedListingSlide[];
  className?: string;
};

export function HomeFeaturedRotator({
  listings,
  className,
}: HomeFeaturedRotatorProps) {
  const labelId = useId();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const length = listings.length;
  const slide = listings[index] ?? listings[0];

  const go = useCallback(
    (next: number) => {
      if (length === 0) return;
      setIndex(((next % length) + length) % length);
    },
    [length],
  );

  useEffect(() => {
    if (paused || length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % length);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [paused, length]);

  if (!slide) return null;

  return (
    <section
      className={cn(
        "shadow-card border-border relative grid gap-6 rounded-2xl border p-4 md:grid-cols-2 md:gap-10 md:rounded-3xl md:p-8",
        className,
      )}
      role="region"
      aria-roledescription="carrusel"
      aria-labelledby={labelId}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div className="bg-muted relative min-h-56 overflow-hidden rounded-2xl md:min-h-96">
        {slide.imageUrl ? (
          <Image
            src={slide.imageUrl}
            alt={slide.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 480px"
            priority={index === 0}
          />
        ) : (
          <div className="text-muted-foreground flex h-full min-h-56 items-center justify-center text-sm md:min-h-96">
            Sin foto
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <h2
            id={labelId}
            className="text-foreground text-xl font-semibold md:text-3xl"
            aria-live="polite"
          >
            {slide.title}
          </h2>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{slide.conditionLabel}</Badge>
            <TrustBadge />
          </div>
        </div>
        <PriceDisplay
          price={slide.price}
          equipmentPrice={slide.equipmentPrice}
          protectionFee={slide.protectionFee}
        />
        <SellerCard
          name={slide.sellerName}
          avatarUrl={slide.sellerAvatarUrl}
          verified={slide.sellerVerified}
          subtitle={slide.sellerSubtitle}
        />
        <Button fullWidth asChild>
          <Link href={slide.href}>Ver anuncio</Link>
        </Button>
      </div>

      {length > 1 ? (
        <>
          <button
            type="button"
            className="bg-background/90 text-foreground hover:bg-background absolute top-1/2 left-2 z-10 -translate-y-1/2 rounded-full p-2 shadow-sm md:left-3"
            aria-label="Anuncio anterior"
            onClick={() => go(index - 1)}
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            className="bg-background/90 text-foreground hover:bg-background absolute top-1/2 right-2 z-10 -translate-y-1/2 rounded-full p-2 shadow-sm md:right-3"
            aria-label="Anuncio siguiente"
            onClick={() => go(index + 1)}
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>

          <div
            className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-2 md:bottom-4"
            role="tablist"
            aria-label="Anuncios destacados"
          >
            {listings.map((item, i) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Ir a anuncio ${i + 1}: ${item.title}`}
                className={cn(
                  "h-1 rounded-full transition-all",
                  i === index
                    ? "bg-foreground w-6"
                    : "bg-foreground/30 hover:bg-foreground/60 w-3",
                )}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
