/**
 * @file select.tsx
 * @description Native select styled to match Input height and focus ring.
 * @dependencies react, @/lib/utils
 */

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Select
 *
 * Forwarded native select for simple dropdown fields.
 *
 * @returns Styled HTML select.
 * @calledBy Listing and profile forms
 */
const Select = React.forwardRef<
  HTMLSelectElement,
  React.ComponentProps<"select">
>(({ className, children, ...props }, ref) => {
  return (
    <select
      className={cn(
        "border-input bg-background ring-offset-background focus-visible:ring-ring flex h-11 w-full rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    >
      {children}
    </select>
  );
});
Select.displayName = "Select";

export { Select };
