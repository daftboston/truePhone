"use client";

/**
 * @file password-field.tsx
 * @description Password input with a show/hide toggle for account forms.
 * @dependencies react, lucide-react, Input, Label
 */

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PasswordFieldProps = {
  id: string;
  name: string;
  label: string;
  error?: string;
  autoComplete?: string;
};

/**
 * PasswordField
 *
 * Labeled password input with a 44px-adjacent show/hide control.
 *
 * @param props.id - Input id.
 * @param props.name - Form field name.
 * @param props.label - Visible label.
 * @param props.error - Optional field error.
 * @param props.autoComplete - Autocomplete token; defaults to new-password.
 * @returns Labeled password field.
 * @calledBy UpdatePasswordForm, ChangePasswordForm
 */
export function PasswordField({
  id,
  name,
  label,
  error,
  autoComplete = "new-password",
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={8}
          className="pr-11"
        />
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1.5 transition-colors"
          onClick={() => setShowPassword((current) => !current)}
          aria-label={
            showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
          }
          aria-pressed={showPassword}
        >
          {showPassword ? (
            <EyeOff className="size-4" aria-hidden />
          ) : (
            <Eye className="size-4" aria-hidden />
          )}
        </button>
      </div>
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </div>
  );
}
