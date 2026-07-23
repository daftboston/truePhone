import { BadgeCheck, Headphones, ScanLine, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";

const ITEMS = [
  {
    icon: BadgeCheck,
    label: "Revisión manual",
    detail: "Cada anuncio pasa por un revisor",
  },
  {
    icon: ShieldCheck,
    label: "Compra Garantizada",
    detail: "Protección transparente al comprar",
  },
  {
    icon: ScanLine,
    label: "IMEI y posesión",
    detail: "Validamos el dispositivo real",
  },
  {
    icon: Headphones,
    label: "Soporte humano",
    detail: "Te acompañamos en el proceso",
  },
] as const;

type HomeTrustStripProps = {
  className?: string;
};

export function HomeTrustStrip({ className }: HomeTrustStripProps) {
  return (
    <section
      aria-label="Por qué TruePhone"
      className={cn(
        "bg-muted/80 border-border grid gap-4 rounded-2xl border px-4 py-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-2 lg:px-6",
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
