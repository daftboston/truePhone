import type { Metadata } from "next";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Compras",
};

export default function PurchasesPage() {
  return (
    <AppShell mainClassName="max-w-lg justify-center">
      <EmptyState
        title="Aún no hay compras"
        description="Cuando compres un iPhone verificado, aparecerá aquí."
        action={
          <Button asChild>
            <Link href="/buscar">Explorar</Link>
          </Button>
        }
      />
    </AppShell>
  );
}
