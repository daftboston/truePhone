"use client";

/**
 * @file logout-button.tsx
 * @description Client button that signs the user out via logoutAction.
 * @dependencies react, logoutAction, Button
 */

import { useTransition } from "react";

import { logoutAction } from "@/features/auth/actions/auth";
import { Button } from "@/components/ui/button";

type LogoutButtonProps = {
  className?: string;
};

/**
 * LogoutButton
 *
 * Invokes logoutAction inside a transition and shows a loading state.
 *
 * @param props.className - Optional classes forwarded to the Button.
 * @returns Full-width outline logout button.
 * @calledBy account/profile pages and account navigation
 */
export function LogoutButton({ className }: LogoutButtonProps) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      fullWidth
      loading={pending}
      className={className}
      onClick={() => {
        startTransition(async () => {
          await logoutAction();
        });
      }}
    >
      Cerrar sesión
    </Button>
  );
}
