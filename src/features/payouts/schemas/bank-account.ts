/**
 * @file bank-account.ts
 * @description Zod schema for seller bank payout destination.
 * @dependencies zod, colombia-banks
 */

import { z } from "zod";

import { COLOMBIA_BANKS } from "@/lib/payments/colombia-banks";

const bankCodes = COLOMBIA_BANKS.map((b) => b.code) as [string, ...string[]];

export const sellerBankAccountSchema = z.object({
  legalIdType: z.enum(["CC", "CE", "NIT"], {
    message: "Selecciona el tipo de documento.",
  }),
  legalId: z
    .string()
    .trim()
    .regex(/^\d{6,15}$/, "Ingresa un número de documento válido."),
  bankCode: z.enum(bankCodes, {
    message: "Selecciona un banco.",
  }),
  accountType: z.enum(["AHORROS", "CORRIENTE"], {
    message: "Selecciona el tipo de cuenta.",
  }),
  accountNumber: z
    .string()
    .trim()
    .regex(/^\d{6,20}$/, "Ingresa un número de cuenta válido."),
  holderName: z
    .string()
    .trim()
    .min(3, "Ingresa el nombre del titular.")
    .max(120, "El nombre es demasiado largo."),
  email: z.string().trim().email("Ingresa un correo válido.").max(160),
});

export type SellerBankAccountInput = z.infer<typeof sellerBankAccountSchema>;
