"use client";

import { useTransition } from "react";

import { logoutAction } from "@/features/auth/actions/auth";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      loading={pending}
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
