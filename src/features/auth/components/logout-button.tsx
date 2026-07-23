"use client";

import { useTransition } from "react";

import { logoutAction } from "@/features/auth/actions/auth";
import { Button } from "@/components/ui/button";

type LogoutButtonProps = {
  className?: string;
};

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
