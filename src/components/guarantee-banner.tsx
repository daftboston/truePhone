/**
 * @file guarantee-banner.tsx
 * @description Trust-colored aside promoting TruePhone purchase guarantee messaging.
 * @dependencies lucide-react, @/lib/utils
 */

import { ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";

type GuaranteeBannerProps = {
  title?: string;
  description?: string;
  className?: string;
};

/**
 * GuaranteeBanner
 *
 * Renders a shield icon with title and description for trust messaging.
 *
 * @param props.title - Banner heading.
 * @param props.description - Supporting copy.
 * @param props.className - Optional className.
 * @returns Aside with trust styling.
 * @calledBy Listing detail and marketing surfaces
 */
export function GuaranteeBanner({
  title = "Compra garantizada",
  description = "TruePhone retiene tu pago. Después de marcar «Ya recibí» tienes 24 horas para confirmar o reportar. Si no reportas, pagamos al vendedor.",
  className,
}: GuaranteeBannerProps) {
  return (
    <aside
      className={cn(
        "bg-trust text-trust-foreground flex gap-3 rounded-xl p-4",
        className,
      )}
    >
      <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-sm opacity-90">{description}</p>
      </div>
    </aside>
  );
}
