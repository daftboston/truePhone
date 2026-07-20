import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { FilterChip, FilterChipGroup } from "@/components/filter-chip";
import { GuaranteeBanner } from "@/components/guarantee-banner";
import { ListingCard } from "@/components/listing-card";
import { PriceDisplay } from "@/components/price-display";
import { SellerCard } from "@/components/seller-card";
import { TrustBadge } from "@/components/trust-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <AppShell className="pb-24 md:pb-0" mainClassName="gap-8 md:gap-12">
      <section className="space-y-4 md:grid md:grid-cols-[1.2fr_0.8fr] md:items-end md:gap-10">
        <div className="space-y-3">
          <h1 className="text-foreground text-3xl font-semibold tracking-tight md:text-5xl md:leading-tight">
            Compra con total tranquilidad
          </h1>
          <p className="text-muted-foreground max-w-xl text-base md:text-lg">
            El Marketplace confiable para comprar y vender iPhones usados en
            Colombia.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row md:justify-end">
          <Button fullWidth className="md:w-auto md:px-6" asChild>
            <Link href="/buscar">Explorar iPhones</Link>
          </Button>
          <Button
            variant="outline"
            fullWidth
            className="md:w-auto md:px-6"
            asChild
          >
            <Link href="/vender">Vender mi iPhone</Link>
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <FilterChipGroup>
          <FilterChip label="Todos" selected />
          <FilterChip label="iPhone 15" />
          <FilterChip label="iPhone 14" />
          <FilterChip label="iPhone 13" />
        </FilterChipGroup>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-foreground text-lg font-semibold md:text-2xl">
            Equipos destacados
          </h2>
          <TrustBadge />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
          <ListingCard
            href="/buscar"
            title="iPhone 15 Pro"
            price={5299000}
            batteryHealth={98}
            verified
            conditionLabel="Como nuevo"
          />
          <ListingCard
            href="/buscar"
            title="iPhone 14"
            price={2899000}
            batteryHealth={91}
            verified
            conditionLabel="Excelente"
          />
          <ListingCard
            href="/buscar"
            title="iPhone 13"
            price={2199000}
            batteryHealth={87}
            verified
            conditionLabel="Bueno"
            className="hidden md:block"
          />
          <ListingCard
            href="/buscar"
            title="iPhone 15"
            price={3999000}
            batteryHealth={95}
            verified
            conditionLabel="Como nuevo"
            className="hidden lg:block"
          />
        </div>
        <p className="text-muted-foreground text-xs md:text-sm">
          Vista previa de diseño. El catálogo en vivo llega con la fase de
          marketplace.
        </p>
      </section>

      <GuaranteeBanner className="md:max-w-3xl" />

      <section className="shadow-card border-border grid gap-6 rounded-2xl border p-4 md:grid-cols-2 md:gap-10 md:rounded-3xl md:p-8">
        <div className="bg-muted flex min-h-56 items-center justify-center rounded-2xl md:min-h-96">
          <p className="text-muted-foreground text-sm">Galería del equipo</p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-foreground text-xl font-semibold md:text-3xl">
              iPhone 15 Pro
            </h2>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Como nuevo</Badge>
              <TrustBadge />
            </div>
          </div>
          <PriceDisplay
            price={5299000}
            equipmentPrice={4999000}
            protectionFee={300000}
          />
          <SellerCard
            name="Ricardo Mendoza"
            verified
            subtitle="Vendedor en Bogotá"
          />
          <Button fullWidth asChild>
            <Link href="/registro">Crear cuenta para comprar</Link>
          </Button>
        </div>
      </section>
    </AppShell>
  );
}
