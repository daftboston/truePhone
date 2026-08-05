/**
 * @file input.tsx
 * @description Styled text input matching the TruePhone form control height.
 * @dependencies react, @/lib/utils
 */

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Input
 *
 * Forwarded native input with design-system border and focus ring styles.
 *
 * @returns Styled HTML input.
 * @calledBy Auth, profile, listing, and checkout forms
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-11 w-full rounded-lg border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
