/**
 * @file error-state.tsx
 * @description Alert-styled error placeholder with optional recovery action.
 * @dependencies @/lib/utils
 */

import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

/**
 * ErrorState
 *
 * Displays a recoverable error message with role="alert".
 *
 * @param props.title - Error heading; Spanish default provided.
 * @param props.description - Supporting error copy.
 * @param props.action - Optional retry or navigation control.
 * @param props.className - Wrapper className.
 * @returns Alert region for failed data loads.
 * @calledBy Feature pages when fetch or permission errors surface
 */
export function ErrorState({
  title = "Algo salió mal",
  description = "No pudimos cargar esta información. Intenta de nuevo.",
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-16 text-center",
        className,
      )}
      role="alert"
    >
      <h2 className="text-foreground text-lg font-semibold">{title}</h2>
      <p className="text-muted-foreground max-w-sm text-sm">{description}</p>
      {action}
    </div>
  );
}
