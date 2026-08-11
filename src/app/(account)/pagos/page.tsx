/**
 * @file page.tsx
 * @description Seller payout destination (bank account) for Compra Garantizada.
 * @dependencies SellerBankForm, prisma, session
 */

import type { Metadata } from "next";

import { SellerBankForm } from "@/features/payouts/components/seller-bank-form";
import { requireCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Pagos",
  description: "Cuenta bancaria para recibir el pago de tus ventas.",
};

/**
 * SellerPagosPage
 *
 * Lets sellers set the default bank account used when TruePhone pays them.
 *
 * @returns Pagos settings page.
 */
export default async function SellerPagosPage() {
  const current = await requireCurrentProfile("/pagos");

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
          Agrega la cuenta donde TruePhone te pagará después de que el comprador
          confirme el iPhone (o pasen 24 horas desde que marcó que lo recibió).
        </p>
      </div>

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
