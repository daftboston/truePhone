"use client";

/**
 * @file confirm-action.tsx
 * @description Inline two-step confirmation for irreversible actions.
 * @dependencies react, @/components/ui/button
 */

import { useState } from "react";

import { Button } from "@/components/ui/button";

type ConfirmActionProps = {
  idleLabel: string;
  confirmLabel: string;
  cancelLabel?: string;
  hint?: string;
  pending?: boolean;
  disabled?: boolean;
  variant?: "default" | "destructive" | "outline";
  type?: "button" | "submit";
  size?: "default" | "sm";
  fullWidth?: boolean;
  onConfirm?: () => void;
};

/**
 * ConfirmAction
 *
 * First tap asks for confirmation; the second tap submits or calls onConfirm.
 * Avoids window.confirm so the decision stays in the page.
 *
 * @param props.idleLabel - Label before confirmation.
 * @param props.confirmLabel - Label for the confirming tap.
 * @param props.cancelLabel - Optional cancel to reset.
 * @param props.hint - Short explanation shown while confirming.
 * @param props.pending - Loading state on the confirm button.
 * @param props.disabled - Disables both steps.
 * @param props.variant - Button variant for both steps.
 * @param props.type - `submit` for forms; `button` with onConfirm otherwise.
 * @param props.size - Button size; `sm` for queue rows.
 * @param props.fullWidth - Stretch buttons.
 * @param props.onConfirm - Click handler when type is button.
 * @returns Two-step action controls.
 * @calledBy Identity review, listing review, listing photo delete, listing draft delete
 */
export function ConfirmAction({
  idleLabel,
  confirmLabel,
  cancelLabel = "Cancelar",
  hint,
  pending = false,
  disabled = false,
  variant = "default",
  type = "button",
  size = "default",
  fullWidth = true,
  onConfirm,
}: ConfirmActionProps) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button
        type="button"
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        disabled={disabled || pending}
        onClick={() => setConfirming(true)}
      >
        {idleLabel}
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      {hint ? (
        <p className="text-muted-foreground text-xs" role="status">
          {hint}
        </p>
      ) : null}
      <Button
        type={type}
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        loading={pending}
        disabled={disabled}
        onClick={
          type === "button"
            ? () => {
                onConfirm?.();
              }
            : undefined
        }
      >
        {confirmLabel}
      </Button>
      <Button
        type="button"
        variant="ghost"
        fullWidth={fullWidth}
        disabled={pending}
        onClick={() => setConfirming(false)}
      >
        {cancelLabel}
      </Button>
    </div>
  );
}
