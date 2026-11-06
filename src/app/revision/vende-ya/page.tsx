import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentProfile } from "@/lib/auth/session";
import { mayReview } from "@/lib/buyback/policy";
import { quoteView } from "@/lib/buyback/service";
import {
  BuybackReviewerControls,
  SyncBuybackPricesButton,
} from "@/features/buyback/components/reviewer-controls";

export const dynamic = "force-dynamic";
const date = (value: Date | null) =>
  value
    ? new Intl.DateTimeFormat("es-CO", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "America/Bogota",
      }).format(value) + " (Bogotá)"
    : "Pendiente";
const cop = (amount: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount) + " COP";
export default async function BuybackReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ after?: string }>;
}) {
  if (process.env.BUYBACK_ENABLED !== "true") notFound();
  const current = await getCurrentProfile();
  if (!current) redirect("/login?next=/revision/vende-ya");
  if (!mayReview(current.profile.role)) notFound();
  const { after } = await searchParams;
  const [records, latestImport] = await Promise.all([
    prisma.buybackQuote.findMany({
      where: {
        status: { in: ["REVIEW_REQUESTED", "OFFER_SENT", "OFFER_ACCEPTED"] },
      },
      orderBy: [{ reviewDueAt: "asc" }, { id: "asc" }],
      take: 26,
      ...(after && after.length <= 100
        ? { cursor: { id: after }, skip: 1 }
        : {}),
      include: {
        photos: { orderBy: { slot: "asc" } },
        offers: { orderBy: { version: "desc" }, take: 1 },
        iphoneModel: true,
        iphoneStorage: true,
      },
    }),
    current.profile.role === "ADMIN"
      ? prisma.buybackPriceImport.findFirst({ orderBy: { importedAt: "desc" } })
      : Promise.resolve(null),
  ]);
  const quotes = records.slice(0, 25);
  return (
    <div className="space-y-6">
      <Link className="text-primary text-sm underline" href="/revision">
        Volver a revisión
      </Link>
      <header className="space-y-2">
        <h1 className="text-xl font-semibold">Vende ya · Bogotá</h1>
        <p className="text-muted-foreground text-sm">
          TruePhone es el comprador. Revisa las ocho fotos y el estado antes de
          enviar una oferta. La aceptación no confirma recogida ni pago.
        </p>
      </header>
      {current.profile.role === "ADMIN" ? (
        <section
          className="space-y-2 rounded-xl border p-4"
          aria-label="Precios privados"
        >
          <p className="text-sm">
            Última sincronización: {date(latestImport?.importedAt ?? null)}.{" "}
            {latestImport
              ? `${latestImport.validRows} precios válidos; ${Array.isArray(latestImport.issues) ? latestImport.issues.length : 0} filas por revisar.`
              : "Importa precios antes de cotizar."}
          </p>
          <SyncBuybackPricesButton />
        </section>
      ) : null}
      {quotes.length === 0 ? (
        <p className="text-muted-foreground">
          No hay solicitudes en esta página.{" "}
          <Link href="/revision/vende-ya" className="underline">
            Volver al inicio de la cola
          </Link>
          .
        </p>
      ) : null}
      {quotes.map((q) => (
        <article key={q.id} className="space-y-3 rounded-xl border p-4">
          <h2 className="font-semibold">
            {q.iphoneModel.name} · {q.iphoneStorage.valueGb} GB
          </h2>
          <p className="text-muted-foreground text-sm">
            Solicitud {q.id} · {q.condition} · batería {q.batteryHealth}%
          </p>
          <p className="text-sm whitespace-pre-wrap">{q.description}</p>
          <p className="text-sm">
            Revisar antes de {date(q.reviewDueAt)}.{" "}
            {q.rangeMinCop !== null && q.rangeMaxCop !== null
              ? `Rango guardado: ${cop(q.rangeMinCop)} a ${cop(q.rangeMaxCop)}.`
              : "Revisión manual: sin precio del catálogo."}
          </p>
          {q.offers[0] ? (
            <p className="text-sm">
              Oferta actual: {cop(q.offers[0].amountCop)}. Vence:{" "}
              {date(q.offers[0].expiresAt)}.{" "}
              {q.offers[0].acceptedAt
                ? "Aceptada; pendiente de programación."
                : "Pendiente de aceptación."}
            </p>
          ) : null}
          <BuybackReviewerControls quote={quoteView(q)} />
        </article>
      ))}
      {records.length > 25 ? (
        <Link
          className="text-primary underline"
          href={`/revision/vende-ya?after=${encodeURIComponent(quotes[24].id)}`}
        >
          Ver siguientes solicitudes
        </Link>
      ) : null}
    </div>
  );
}
