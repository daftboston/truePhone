/**
 * @file listing-wizard-shell.tsx
 * @description ListingWizardShell component for the listings feature.tsx.
 * @dependencies next/link, @/components/step-progress-header, @/components/ui/button, @/features/listings/types, @/lib/utils
 */

import Link from "next/link";

import { StepProgressHeader } from "@/components/step-progress-header";
import { Button } from "@/components/ui/button";
import { LISTING_STEPS } from "@/features/listings/types";
import { cn } from "@/lib/utils";

type ListingWizardShellProps = {
  step: number;
  title: string;
  listingId?: string;
  /** Prior rejection reason kept on DRAFT until the next successful submit. */
  rejectionReason?: string | null;
  children: React.ReactNode;
  className?: string;
};

/**
 * ListingWizardShell
 *
 * Renders the Listing Wizard Shell UI for listings.
 *
 * @param props - ListingWizardShell props.
 * @returns ListingWizardShell React element.
 * @calledBy listings pages and parent components
 */
export function ListingWizardShell({
  step,
  title,
  listingId,
  rejectionReason,
  children,
  className,
}: ListingWizardShellProps) {
  const reason = rejectionReason?.trim();

  return (
    <div className={cn("mx-auto w-full max-w-lg space-y-6", className)}>
      <StepProgressHeader
        step={step}
        totalSteps={LISTING_STEPS.length}
        eyebrow="Publicar iPhone"
        title={title}
      />
      {reason ? (
        <aside className="border-destructive/40 bg-destructive/5 space-y-1 rounded-xl border p-3">
          <p className="text-foreground text-sm font-semibold">
            Motivo del rechazo anterior
          </p>
          <p className="text-muted-foreground text-sm whitespace-pre-wrap">
            {reason}
          </p>
          <p className="text-muted-foreground text-xs">
            Corrige lo indicado y vuelve a enviar el anuncio a revisión.
          </p>
        </aside>
      ) : null}
      {children}
      <div className="flex flex-col gap-2 sm:flex-row">
        {listingId && step > 1 ? (
          <Button variant="outline" asChild className="flex-1">
            <Link
              href={`/vender/${listingId}/${LISTING_STEPS[step - 2]?.pathSuffix ?? "dispositivo"}`}
            >
              Atrás
            </Link>
          </Button>
        ) : null}
        <Button variant="ghost" asChild className="flex-1">
          <Link href="/vender">Guardar y salir</Link>
        </Button>
      </div>
    </div>
  );
}
