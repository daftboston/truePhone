/**
 * @file page.tsx
 * @description Seller payout destination (bank account) for Compra Garantizada.
 * @dependencies SellerBankForm, prisma, session
 */

import type { Metadata } from "next";
import Link from "next/link";

import { SellerBankForm } from "@/features/payouts/components/seller-bank-form";
import { requireCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Pagos",
  description: "Cuenta bancaria para recibir el pago de tus ventas.",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * SellerPagosPage
 *
 * Lets sellers set the default bank account used when TruePhone pays them.
 *
 * @param props.searchParams.guardado - Success flag after save.
 * @returns Pagos settings page.
 */
export default async function SellerPagosPage({ searchParams }: PageProps) {
  const current = await requireCurrentProfile("/pagos");
  const params = await searchParams;
  const justSaved = params.guardado === "1";

  const account = await prisma.sellerBankAccount.findFirst({
    where: { profileId: current.profile.id, isDefault: true },
  });

  return (
    <>
      <div className="space-y-2">
        <h1 className="text-foreground text-xl font-semibold tracking-tight">
          Pagos
        </h1>
        <p className="text-muted-foreground text-sm">
          Esta cuenta es para recibir el pago de una venta. Si compraste un
          iPhone, el cobro está en{" "}
          <Link
            href="/compras"
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            Compras
          </Link>
          .
        </p>
        <p className="text-muted-foreground text-sm">
          TruePhone te paga aquí después de que el comprador confirme el iPhone
          (o pasen 24 horas desde que marcó que lo recibió).
        </p>
      </div>

      {justSaved && account ? (
        <p
          className="border-border bg-muted/50 text-trust rounded-xl border px-4 py-3 text-sm"
          role="status"
        >
          Cuenta lista. TruePhone te pagará a{" "}
          {account.bankName ?? account.bankCode} · ***
          {account.accountNumber.slice(-4)} cuando se libere la venta.
        </p>
      ) : null}

      <section className="border-border space-y-4 rounded-xl border p-4">
        <h2 className="text-foreground text-sm font-semibold">
          Cuenta bancaria
        </h2>
        {account ? (
          <p className="text-muted-foreground text-sm">
            Actual: {account.bankName ?? account.bankCode} ·{" "}
            {account.accountType === "AHORROS" ? "Ahorros" : "Corriente"} · ***
            {account.accountNumber.slice(-4)} · {account.holderName}
          </p>
        ) : (
          <p className="text-muted-foreground text-sm">
            Todavía no tienes una cuenta predeterminada. Sin ella no podemos
            liberar tu liquidación.
          </p>
        )}
        <SellerBankForm
          initial={
            account
              ? {
                  legalIdType: account.legalIdType,
                  legalId: account.legalId,
                  bankCode: account.bankCode,
                  accountType: account.accountType,
                  accountNumber: account.accountNumber,
                  holderName: account.holderName,
                  email: account.email,
                }
              : {
                  holderName: current.profile.fullName ?? "",
                  email: "",
                }
          }
        />
      </section>
    </>
  );
}
