import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { OrderCard } from "@/features/orders/components/order-card";
import { requireCurrentProfile } from "@/lib/auth/session";
import { listOrdersForBuyer } from "@/lib/orders";

export const metadata: Metadata = {
  title: "Compras",
  description: "Tus pedidos en TruePhone.",
};

export default async function PurchasesPage() {
  const current = await requireCurrentProfile("/compras");
  const orders = await listOrdersForBuyer(current.profile.id);

  return (
    <>
      <div className="space-y-2">
        <h1 className="text-foreground text-xl font-semibold tracking-tight">
          Compras
        </h1>
        <p className="text-muted-foreground text-sm">
          Pedidos de iPhones verificados que reservaste o compraste.
        </p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="Aún no hay compras"
          description="Cuando reserves un iPhone verificado, aparecerá aquí."
          action={
            <Button asChild>
              <Link href="/explorar">Explorar</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <OrderCard
                order={order}
                href={`/compras/${order.id}`}
                perspective="buyer"
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
