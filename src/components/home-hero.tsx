/**
 * @file home-hero.tsx
 * @description Static home hero with TruePhone brand, explore and sell CTAs.
 * @dependencies next/image, next/link, lucide-react, ui/button, @/lib/utils
 * @changelog 2026-09-11 — Hero CTAs use the default 44px Button height.
 */

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type HomeHeroProps = {
  className?: string;
};

/**
 * HomeHero
 *
 * Renders one branded hero: visible TruePhone headline, explore primary,
 * sell secondary.
 *
 * @param props.className - Optional section className.
 * @returns Home marketing hero.
 * @calledBy HomePage
 */
export function HomeHero({ className }: HomeHeroProps) {
  return (
    <section className={cn(className)} aria-labelledby="home-hero-heading">
      <div className="home-hero-panel relative overflow-hidden rounded-2xl md:rounded-3xl">
        <div className="home-hero-pattern absolute inset-0" aria-hidden />

        <div className="relative grid items-center gap-6 px-7 py-8 sm:px-10 sm:py-9 md:grid-cols-[1.1fr_0.9fr] md:gap-8 md:px-12 md:py-10 lg:gap-10 lg:px-16 lg:py-11">
          <div className="relative z-10 max-w-lg text-left">
            <h1
              id="home-hero-heading"
              className="text-foreground text-[1.625rem] leading-[1.1] font-semibold tracking-tight sm:text-[1.875rem] md:text-[2.125rem] md:leading-[1.08] lg:text-[2.375rem]"
            >
              Compra inteligente.
              <br />
              Compra TruePhone.
            </h1>
            <p className="text-muted-foreground mt-3 flex max-w-md flex-wrap items-center gap-1.5 text-sm leading-snug md:mt-3.5 md:text-[0.9375rem]">
              <span>iPhones verificados, precios justos y sin sorpresas.</span>
              <CheckCircle2
                className="text-success fill-success/15 size-4 shrink-0 md:size-[1.125rem]"
                aria-hidden
              />
            </p>
            <div className="mt-5 flex flex-wrap gap-2 md:mt-6">
              <Button asChild className="px-5 text-sm font-medium md:px-6">
                <Link href="/explorar">Explorar iPhones</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="px-5 text-sm font-medium md:px-6"
              >
                <Link href="/vender">Vender</Link>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto flex w-full items-center justify-center md:justify-end">
            <Image
              src="/hero/phones-cluster-v4.png"
              alt=""
              width={534}
              height={568}
              className="home-hero-phones h-auto max-h-[11.5rem] w-full max-w-[15rem] object-contain sm:max-h-[13rem] sm:max-w-[17rem] md:max-h-[14.5rem] md:max-w-[19rem] lg:max-h-[16rem] lg:max-w-[21rem]"
              sizes="(max-width: 768px) 240px, 336px"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
