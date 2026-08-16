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
 * Wide sell-wizard chrome: progress header, step content, and a sticky
 * Atrás / Guardar y salir bar. Desktop steps use two-column forms inside.
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
    <div className={cn("flex min-h-0 w-full flex-1 flex-col gap-6", className)}>
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
      <div className="min-w-0 flex-1">{children}</div>
      <div className="bg-background/95 sticky bottom-20 z-10 -mx-4 mt-auto flex flex-col gap-2 border-t px-4 py-3 sm:flex-row md:bottom-0 md:-mx-6 md:px-6">
        {listingId && step > 1 ? (
          <Button
            variant="outline"
            asChild
            className="flex-1 lg:min-w-40 lg:flex-none"
          >
            <Link
              href={`/vender/${listingId}/${LISTING_STEPS[step - 2]?.pathSuffix ?? "dispositivo"}`}
            >
              Atrás
            </Link>
          </Button>
        ) : null}
        <Button
          variant="ghost"
          asChild
          className="flex-1 lg:min-w-40 lg:flex-none"
        >
          <Link href="/vender">Guardar y salir</Link>
        </Button>
      </div>
    </div>
  );
}
