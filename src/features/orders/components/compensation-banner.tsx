/**
 * @file compensation-banner.tsx
 * @description Persistent buyer banner for an active 8% replacement-purchase entitlement.
 * @dependencies next/link, lucide-react, Button
 */

import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CompensationBannerProps = {
  sourceOrderId: string;
  showAction?: boolean;
  className?: string;
};

/**
 * CompensationBanner
 *
 * Keeps the replacement benefit visible from purchases through marketplace browse.
 *
 * @param props.sourceOrderId - Cancelled order that granted the entitlement.
 * @param props.showAction - Whether to render the marketplace CTA.
 * @param props.className - Optional wrapper class.
 * @returns Trust-styled compensation notice.
 * @calledBy purchases, explore, search, and public listing pages
 */
export function CompensationBanner({
  sourceOrderId,
  showAction = false,
  className,
}: CompensationBannerProps) {
  return (
    <aside
      className={cn(
        "border-trust/30 bg-trust/5 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
      role="status"
    >
      <div className="flex gap-3">
        <ShieldCheck
          className="text-trust mt-0.5 size-5 shrink-0"
          aria-hidden
        />
        <div className="space-y-1">
          <p className="text-foreground text-sm font-semibold">
            Tienes una compra de reemplazo con protección del 8%
          </p>
          <p className="text-muted-foreground text-xs">
            Se aplicará automáticamente al reservar un iPhone elegible.
          </p>
        </div>
      </div>
      {showAction ? (
        <Button asChild size="sm">
          <Link href={`/explorar?compensacion=${sourceOrderId}`}>
            Buscar reemplazo
          </Link>
        </Button>
      ) : null}
    </aside>
  );
}
