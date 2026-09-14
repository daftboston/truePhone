/**
 * @file retracto-notice.tsx
 * @description Statutory retracto microcopy near checkout fee breakdown.
 * @dependencies next/link, @/lib/legal
 */

import Link from "next/link";

import { LEGAL_PATHS } from "@/lib/legal";

/**
 * RetractoNotice
 *
 * Shows Ley 1480 retracto notice with links to terms and /pqr.
 *
 * @returns Compact consumer-rights paragraph.
 * @calledBy OrderCheckoutSection, listing purchase column
 */
export function RetractoNotice() {
  return (
    <p className="text-muted-foreground text-xs leading-relaxed">
      Puedes tener derecho de retracto de 5 días hábiles desde la entrega (Ley
      1480). Detalles en{" "}
      <Link
        href={LEGAL_PATHS.terms}
        className="text-foreground font-medium underline-offset-2 hover:underline"
      >
        Términos
      </Link>{" "}
      y en{" "}
      <Link
        href={LEGAL_PATHS.pqr}
        className="text-foreground font-medium underline-offset-2 hover:underline"
      >
        /pqr
      </Link>
      .
    </p>
  );
}
