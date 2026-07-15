import { cn } from "@/lib/utils";

type StepProgressHeaderProps = {
  step: number;
  totalSteps: number;
  title: string;
  eyebrow?: string;
  className?: string;
};

export function StepProgressHeader({
  step,
  totalSteps,
  title,
  eyebrow,
  className,
}: StepProgressHeaderProps) {
  const progress = Math.min(100, Math.round((step / totalSteps) * 100));

  return (
    <header className={cn("space-y-3", className)}>
      <div className="text-muted-foreground flex items-center justify-between text-xs font-medium tracking-wide uppercase">
        <span>
          Paso {step} de {totalSteps}
        </span>
        <span>{progress}% completado</span>
      </div>
      <div
        className="bg-muted h-1.5 overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="bg-trust h-full rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
      {eyebrow && (
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {eyebrow}
        </p>
      )}
      <h1 className="text-foreground text-2xl font-semibold tracking-tight">
        {title}
      </h1>
    </header>
  );
}
