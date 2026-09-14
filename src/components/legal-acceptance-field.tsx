"use client";

/**
 * @file legal-acceptance-field.tsx
 * @description Ley 527 checkbox for terms and privacy acceptance (not pre-checked).
 * @dependencies react, next/link, @/lib/legal
 */

import Link from "next/link";

import { LEGAL_PATHS } from "@/lib/legal";
import { cn } from "@/lib/utils";

type LegalAcceptanceFieldProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  name?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
};

/**
 * LegalAcceptanceField
 *
 * Renders the required pre-pay / signup acceptance checkbox with legal links.
 *
 * @param props.checked - Current checked state (must start false).
 * @param props.onCheckedChange - Called when the user toggles the box.
 * @param props.name - Form field name (default legalAccepted).
 * @param props.id - Input id for label association.
 * @param props.className - Wrapper className.
 * @param props.disabled - Disables interaction when true.
 * @returns Checkbox label with links to /terminos and /privacidad.
 * @calledBy RegisterForm, OrderDetailView, MockCheckoutConfirm
 */
export function LegalAcceptanceField({
  checked,
  onCheckedChange,
  name = "legalAccepted",
  id = "legalAccepted",
  className,
  disabled = false,
}: LegalAcceptanceFieldProps) {
  return (
    <label
      className={cn(
        "flex items-start gap-2.5 text-sm leading-relaxed",
        disabled ? "opacity-60" : "cursor-pointer",
        className,
      )}
    >
      <input
        type="checkbox"
        id={id}
        name={name}
        value="true"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onCheckedChange(event.target.checked)}
        className="mt-0.5 size-4 shrink-0 rounded border"
        required
      />
      <span className="text-muted-foreground">
        He leído y acepto los{" "}
        <Link
          href={LEGAL_PATHS.terms}
          className="text-foreground font-medium underline-offset-2 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Términos
        </Link>{" "}
        y la{" "}
        <Link
          href={LEGAL_PATHS.privacy}
          className="text-foreground font-medium underline-offset-2 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Política de Privacidad
        </Link>
      </span>
    </label>
  );
}
