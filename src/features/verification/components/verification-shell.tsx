import Link from "next/link";

import { StepProgressHeader } from "@/components/step-progress-header";
import { Button } from "@/components/ui/button";
import { VERIFICATION_STEPS } from "@/features/verification/types";
import { cn } from "@/lib/utils";

type VerificationShellProps = {
  step: number;
  title: string;
  children: React.ReactNode;
  className?: string;
};

export function VerificationShell({
  step,
  title,
  children,
  className,
}: VerificationShellProps) {
  return (
    <div className={cn("mx-auto w-full max-w-lg space-y-6", className)}>
      <StepProgressHeader
        step={step}
        totalSteps={VERIFICATION_STEPS.length}
        eyebrow="Verificación de vendedor"
        title={title}
      />
      {children}
      <Button variant="ghost" asChild className="w-full">
        <Link href="/vender">Salir por ahora</Link>
      </Button>
    </div>
  );
}
