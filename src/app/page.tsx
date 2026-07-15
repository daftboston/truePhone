import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { FilterChip, FilterChipGroup } from "@/components/filter-chip";
import { GuaranteeBanner } from "@/components/guarantee-banner";
import { ListingCard } from "@/components/listing-card";
import { PriceDisplay } from "@/components/price-display";
import { SearchBar } from "@/components/search-bar";
import { SellerCard } from "@/components/seller-card";
import { StepProgressHeader } from "@/components/step-progress-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { TrustBadge } from "@/components/trust-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <div className="bg-background flex min-h-full flex-1 flex-col pb-24">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-8 px-4 py-6">
        <section className="bg-primary text-primary-foreground space-y-3 rounded-2xl p-5">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              Tu próximo iPhone, verificado por expertos
            </h1>
            <ThemeToggle />
          </div>
          <p className="text-sm opacity-90">
            Marketplace confiable para comprar y vender iPhones usados en
            Colombia.
          </p>
          <Button variant="secondary" fullWidth>
            Explorar iPhones
          </Button>
        </section>

        <section className="space-y-3">
          <SearchBar />
          <FilterChipGroup>
            <FilterChip label="Todos" selected />
            <FilterChip label="iPhone 15" />
            <FilterChip label="iPhone 14" />
            <FilterChip label="iPhone 13" />
          </FilterChipGroup>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-foreground text-lg font-semibold">
              Equipos destacados
            </h2>
            <TrustBadge />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ListingCard
              href="#"
              title="iPhone 15 Pro"
              price={5299000}
              batteryHealth={98}
              verified
              conditionLabel="Como nuevo"
            />
            <ListingCard
              href="#"
              title="iPhone 14"
              price={2899000}
              batteryHealth={91}
              verified
              conditionLabel="Excelente"
            />
          </div>
        </section>

        <GuaranteeBanner />

        <section className="space-y-3">
          <h2 className="text-foreground text-lg font-semibold">
            Detalle de precio
          </h2>
          <PriceDisplay
            price={5299000}
            equipmentPrice={4999000}
            protectionFee={300000}
          />
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Como nuevo</Badge>
            <TrustBadge />
          </div>
          <SellerCard
            name="Ricardo Mendoza"
            verified
            subtitle="Vendedor en Bogotá"
          />
          <Button fullWidth>Comprar ahora</Button>
        </section>

        <section className="space-y-3">
          <StepProgressHeader
            step={1}
            totalSteps={3}
            eyebrow="Seguridad del vendedor"
            title="Verificación de vendedor"
          />
          <div className="space-y-2">
            <Label htmlFor="demo-input">Nombre completo</Label>
            <Input id="demo-input" placeholder="Tu nombre" />
          </div>
          <Button variant="trust" fullWidth>
            Iniciar verificación
          </Button>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
