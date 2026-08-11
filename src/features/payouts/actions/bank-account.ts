/**
 * @file bank-account.ts
 * @description Server actions for seller bank payout destinations.
 * @dependencies next/cache, prisma, seller bank schema, colombia-banks
 */

"use server";

import { revalidatePath } from "next/cache";

import { sellerBankAccountSchema } from "@/features/payouts/schemas/bank-account";
import {
  fieldErrorsFromZod,
  type PayoutActionState,
} from "@/features/payouts/types";
import { requireCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { findColombiaBank } from "@/lib/payments/colombia-banks";

/**
 * upsertSellerBankAccountAction
 *
 * Creates or replaces the seller's default bank destination for settlement.
 *
 * @param _prev - Previous form state from useActionState.
 * @param formData - Bank account form fields.
 * @returns PayoutActionState with success message or validation errors.
 * @calledBy SellerBankForm
 */
export async function upsertSellerBankAccountAction(
  _prev: PayoutActionState,
  formData: FormData,
): Promise<PayoutActionState> {
  const current = await requireCurrentProfile("/pagos");

  const parsed = sellerBankAccountSchema.safeParse({
    legalIdType: formData.get("legalIdType"),
    legalId: formData.get("legalId"),
    bankCode: formData.get("bankCode"),
    accountType: formData.get("accountType"),
    accountNumber: formData.get("accountNumber"),
    holderName: formData.get("holderName"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los datos de la cuenta e intenta de nuevo.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const bank = findColombiaBank(parsed.data.bankCode);
  if (!bank) {
    return { ok: false, error: "Banco no reconocido." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.sellerBankAccount.updateMany({
      where: { profileId: current.profile.id, isDefault: true },
      data: { isDefault: false },
    });

    await tx.sellerBankAccount.create({
      data: {
        profileId: current.profile.id,
        legalIdType: parsed.data.legalIdType,
        legalId: parsed.data.legalId,
        bankCode: parsed.data.bankCode,
        bankName: bank.name,
        accountType: parsed.data.accountType,
        accountNumber: parsed.data.accountNumber,
        holderName: parsed.data.holderName,
        email: parsed.data.email,
        isDefault: true,
      },
    });
  });

  revalidatePath("/pagos");
  revalidatePath("/ventas");

  return {
    ok: true,
    message: "Cuenta bancaria guardada. La usaremos para enviarte el pago.",
  };
}
