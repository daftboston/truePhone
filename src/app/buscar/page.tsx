import type { Metadata } from "next";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Buscar",
};

export default function SearchPage() {
  return (
    <AppShell mainClassName="max-w-lg justify-center">
      <EmptyState
        title="La búsqueda llega pronto"
        description="Estamos preparando el catálogo de iPhones verificados."
        action={
          <Button asChild variant="outline">
            <Link href="/">Volver al inicio</Link>
          </Button>
        }
      />
    </AppShell>
  );
}
