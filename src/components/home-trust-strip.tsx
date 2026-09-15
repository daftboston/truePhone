/**
 * @file home-trust-strip.tsx
 * @description Home-page trust pillars (manual review, escrow, IMEI).
 * @dependencies lucide-react, @/lib/utils
 * @changelog 2026-09-10 — Three escrow-accurate facts; dropped vague fourth tile.
 */

import { BadgeCheck, ScanLine, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";

const ITEMS = [
  {
    icon: BadgeCheck,
    label: "Revisión manual",
    detail: "Cada anuncio pasa por un revisor de TruePhone.",
  },
  {
    icon: ShieldCheck,
    label: "Compra Garantizada",
    detail:
      "TruePhone asegura tu pago. Una vez recibas tu iPhone, tienes hasta 24 horas para confirmar que tu teléfono esté bien.",
  },
  {
    icon: ScanLine,
    label: "IMEI y posesión",
    detail: "Validamos el dispositivo real antes de publicar.",
  },
] as const;

type HomeTrustStripProps = {
  className?: string;
};

/**
 * HomeTrustStrip
 *
 * Renders three trust messaging tiles under the home hero.
 *
 * @param props.className - Optional section className.
 * @returns Accessible section of trust pillars.
 * @calledBy HomePage
 */
export function HomeTrustStrip({ className }: HomeTrustStripProps) {
  return (
    <section
      aria-label="Por qué TruePhone"
      className={cn(
        "bg-muted/80 border-border grid gap-4 rounded-2xl border px-4 py-5 sm:grid-cols-3 lg:gap-2 lg:px-6",
        className,
      )}
    >
      {ITEMS.map(({ icon: Icon, label, detail }) => (
        <div key={label} className="flex items-start gap-3 px-1 py-1">
          <span className="bg-trust/10 text-trust flex size-9 shrink-0 items-center justify-center rounded-lg">
            <Icon className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 space-y-0.5">
            <p className="text-foreground text-sm font-semibold">{label}</p>
            <p className="text-muted-foreground text-xs leading-snug">
              {detail}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}
