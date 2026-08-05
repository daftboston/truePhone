/**
 * @file textarea.tsx
 * @description Multi-line text control matching design-system form styles.
 * @dependencies react, @/lib/utils
 */

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Textarea
 *
 * Forwarded native textarea with min-height and focus ring styles.
 *
 * @returns Styled HTML textarea.
 * @calledBy Listing descriptions, messages, and review forms
 */
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-24 w-full rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
