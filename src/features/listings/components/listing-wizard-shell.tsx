import Link from "next/link";

import { StepProgressHeader } from "@/components/step-progress-header";
import { Button } from "@/components/ui/button";
import { LISTING_STEPS } from "@/features/listings/types";
import { cn } from "@/lib/utils";

type ListingWizardShellProps = {
  step: number;
  title: string;
  listingId?: string;
  children: React.ReactNode;
  className?: string;
};

export function ListingWizardShell({
  step,
  title,
  listingId,
  children,
  className,
}: ListingWizardShellProps) {
  return (
    <div className={cn("mx-auto w-full max-w-lg space-y-6", className)}>
      <StepProgressHeader
        step={step}
        totalSteps={LISTING_STEPS.length}
        eyebrow="Publicar iPhone"
        title={title}
      />
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
