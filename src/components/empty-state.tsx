/**
 * @file empty-state.tsx
 * @description Centered empty-list placeholder with optional action slot.
 * @dependencies @/lib/utils
 */

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** Optional second CTA, typically a FAQ / ayuda link. */
  secondaryAction?: React.ReactNode;
  className?: string;
};

/**
 * EmptyState
 *
 * Shows a title, optional description, and optional CTA when a list has no items.
 *
 * @param props.title - Primary empty message.
 * @param props.description - Optional supporting copy.
 * @param props.action - Optional button or link node.
 * @param props.secondaryAction - Optional second CTA (FAQ, clear filters).
 * @param props.className - Wrapper className.
 * @returns Centered empty-state block.
 * @calledBy HomePage, FavoritesPage, inbox and queue pages
 */
export function EmptyState({
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-16 text-center",
        className,
      )}
    >
      <h2 className="text-foreground text-lg font-semibold">{title}</h2>
      {description && (
        <p className="text-muted-foreground max-w-sm text-sm">{description}</p>
      )}
      {action}
      {secondaryAction}
    </div>
  );
}
