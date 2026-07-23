"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SLIDES = [
  {
    id: "buy",
    headline: "Compra Inteligente.\nCompra TruePhone.",
    support: "iPhones verificados, precios justos y sin sorpresas.",
    ctaLabel: "Comprar iPhones",
    ctaHref: "/explorar",
    showVerifiedCheck: true,
    image: {
      src: "/hero/phones-cluster-v4.png",
      width: 534,
      height: 568,
      className:
        "max-w-[15rem] sm:max-w-[17rem] md:max-w-[19rem] lg:max-w-[21rem] max-h-[11.5rem] sm:max-h-[13rem] md:max-h-[14.5rem] lg:max-h-[16rem]",
      sizes: "(max-width: 768px) 240px, 336px",
    },
  },
  {
    id: "catalog",
    headline: "Tu Próximo iPhone\nEstá Aquí",
    support: "Miles de iPhones usados listos para un nuevo dueño.",
    ctaLabel: "Explorar Catálogo",
    ctaHref: "/explorar",
    showVerifiedCheck: false,
    image: {
      src: "/hero/phones-row-v1.png",
      width: 783,
      height: 486,
      className:
        "max-w-[18rem] sm:max-w-[22rem] md:max-w-[26rem] lg:max-w-[30rem] max-h-[10rem] sm:max-h-[11.5rem] md:max-h-[12.5rem] lg:max-h-[14rem]",
      sizes: "(max-width: 768px) 288px, 480px",
    },
  },
  {
    id: "specialized",
    headline: "Solo iPhones.\nNada Más.",
    support: "El marketplace especializado para comprar y vender iPhones.",
    ctaLabel: "Ver Catálogo",
    ctaHref: "/explorar",
    showVerifiedCheck: false,
    image: {
      src: "/hero/phones-verified-v1.png",
      width: 525,
      height: 458,
      className:
        "max-w-[16rem] sm:max-w-[18rem] md:max-w-[20rem] lg:max-w-[22rem] max-h-[11.5rem] sm:max-h-[13rem] md:max-h-[14.5rem] lg:max-h-[16rem]",
      sizes: "(max-width: 768px) 256px, 352px",
    },
  },
  {
    id: "verified",
    headline: "Verificados Antes\nde Publicarse",
    support:
      "Cada anuncio es revisado para ofrecer una experiencia más segura.",
    ctaLabel: "Ver iPhones Verificados",
    ctaHref: "/explorar",
    showVerifiedCheck: false,
    image: {
      src: "/hero/phones-verified-scan-v2.png",
      width: 895,
      height: 649,
      className:
        "max-w-[20rem] sm:max-w-[24rem] md:max-w-[28rem] lg:max-w-[32rem] max-h-[13.5rem] sm:max-h-[15.5rem] md:max-h-[17.5rem] lg:max-h-[19.5rem]",
      sizes: "(max-width: 768px) 320px, 512px",
    },
  },
] as const;

type HomeHeroProps = {
  className?: string;
};

function HeroPhonesImage({
  src,
  width,
  height,
  className,
  sizes,
  priority,
}: {
  src: string;
  width: number;
  height: number;
  className: string;
  sizes: string;
  priority?: boolean;
}) {
  return (
    <div className="relative mx-auto flex w-full items-center justify-center md:justify-end">
      <Image
        src={src}
        alt=""
        width={width}
        height={height}
        className={cn(
          "home-hero-phones h-auto w-full object-contain",
          className,
        )}
        sizes={sizes}
        priority={priority}
      />
    </div>
  );
}

export function HomeHero({ className }: HomeHeroProps) {
  const labelId = useId();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const slide = SLIDES[index] ?? SLIDES[0];

  const go = useCallback((next: number) => {
    const length = SLIDES.length;
    setIndex(((next % length) + length) % length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % SLIDES.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [paused]);

  return (
    <section className={cn(className)} aria-labelledby={labelId}>
      <h1 id={labelId} className="sr-only">
        TruePhone — iPhones usados con confianza
      </h1>

      <div
        className="home-hero-panel relative overflow-hidden rounded-2xl md:rounded-3xl"
        role="region"
        aria-roledescription="carrusel"
        aria-label="Presentación TruePhone"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={(event) => {
          if (
            !event.currentTarget.contains(event.relatedTarget as Node | null)
          ) {
            setPaused(false);
          }
        }}
      >
        <div className="home-hero-pattern absolute inset-0" aria-hidden />

        <div
          className={cn(
            "relative grid items-center gap-6 px-7 py-8 sm:px-10 sm:py-9 md:grid-cols-[1.1fr_0.9fr] md:gap-8 md:px-12 md:py-10 lg:gap-10 lg:px-16 lg:py-11",
            slide.id === "verified" && "pb-10 md:pb-12 lg:pb-14",
          )}
        >
          <div className="relative z-10 max-w-lg text-left">
            <p
              className="text-foreground text-[1.625rem] leading-[1.1] font-semibold tracking-tight whitespace-pre-line sm:text-[1.875rem] md:text-[2.125rem] md:leading-[1.08] lg:text-[2.375rem]"
              aria-live="polite"
            >
              {slide.headline}
            </p>
            <p className="text-muted-foreground mt-3 flex max-w-md flex-wrap items-center gap-1.5 text-sm leading-snug md:mt-3.5 md:text-[0.9375rem]">
              <span>{slide.support}</span>
              {slide.showVerifiedCheck ? (
                <CheckCircle2
                  className="text-success fill-success/15 size-4 shrink-0 md:size-[1.125rem]"
                  aria-hidden
                />
              ) : null}
            </p>
            <div className="mt-5 md:mt-6">
              <Button
                asChild
                className="h-10 rounded-lg px-5 text-sm font-medium md:h-11 md:px-6"
              >
                <Link href={slide.ctaHref}>{slide.ctaLabel}</Link>
              </Button>
            </div>
          </div>

          <HeroPhonesImage
            key={slide.id}
            src={slide.image.src}
            width={slide.image.width}
            height={slide.image.height}
            className={cn(
              slide.image.className,
              slide.id === "verified" && "-translate-y-1",
            )}
            sizes={slide.image.sizes}
            priority={index === 0}
          />
        </div>

        <button
          type="button"
          className="text-muted-foreground hover:text-foreground absolute top-1/2 left-0.5 z-10 -translate-y-1/2 rounded-full p-1.5 opacity-50 transition-opacity hover:opacity-100 md:left-1"
          aria-label="Diapositiva anterior"
          onClick={() => go(index - 1)}
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-0.5 z-10 -translate-y-1/2 rounded-full p-1.5 opacity-50 transition-opacity hover:opacity-100 md:right-1"
          aria-label="Diapositiva siguiente"
          onClick={() => go(index + 1)}
        >
          <ChevronRight className="size-5" aria-hidden />
        </button>

        <div
          className="absolute bottom-2.5 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 md:bottom-3"
          role="tablist"
          aria-label="Diapositivas"
        >
          {SLIDES.map((item, i) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Ir a diapositiva ${i + 1}: ${item.headline.split("\n")[0]}`}
              className={cn(
                "h-1 rounded-full transition-all",
                i === index
                  ? "bg-foreground/60 w-4"
                  : "bg-foreground/15 hover:bg-foreground/35 w-2",
              )}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
