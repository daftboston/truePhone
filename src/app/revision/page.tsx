import type { Metadata } from "next";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Revisión",
};

export default function ReviewHubPage() {
  return (
    <AppShell mainClassName="max-w-lg gap-6">
      <div className="space-y-2">
        <h1 className="text-foreground text-xl font-semibold tracking-tight">
          Centro de revisión
        </h1>
        <p className="text-muted-foreground text-sm">
          Colas de confianza para revisores y administradores.
        </p>
      </div>

      <div className="grid gap-3">
        <Button asChild>
          <Link href="/revision/identidad">Cola de identidad</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/revision/anuncios">Cola de anuncios</Link>
        </Button>
      </div>
    </AppShell>
  );
}
