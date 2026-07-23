import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { OrderCard } from "@/features/orders/components/order-card";
import { requireCurrentProfile } from "@/lib/auth/session";
import { listOrdersForSeller } from "@/lib/orders";

export const metadata: Metadata = {
  title: "Ventas",
  description: "Pedidos de tus anuncios en TruePhone.",
};

export default async function SalesPage() {
  const current = await requireCurrentProfile("/ventas");
  const orders = await listOrdersForSeller(current.profile.id);

  return (
    <>
      <div className="space-y-2">
        <h1 className="text-foreground text-xl font-semibold tracking-tight">
          Ventas
        </h1>
        <p className="text-muted-foreground text-sm">
          Pedidos de compradores sobre tus anuncios.
        </p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="Aún no hay ventas"
          description="Cuando alguien reserve uno de tus iPhones, aparecerá aquí."
          action={
            <Button asChild>
              <Link href="/vender">Mis anuncios</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <OrderCard
                order={order}
                href={`/ventas/${order.id}`}
                perspective="seller"
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
