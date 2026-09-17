/**
 * @file delivery-address.ts
 * @description Zod schemas for checkout delivery address and post-payment change requests.
 * @dependencies zod, @/lib/locations/colombia-cities
 */

import { z } from "zod";

import {
  cityOptionNeedsDetail,
  COLOMBIA_DEPARTMENT_OPTIONS,
} from "@/lib/locations/colombia-cities";

const departmentSchema = z
  .string()
  .trim()
  .min(1, "Selecciona el departamento.")
  .refine(
    (value) =>
      (COLOMBIA_DEPARTMENT_OPTIONS as readonly string[]).includes(value),
    "Departamento inválido.",
  );

/** Shared delivery address fields for checkout and change requests. */
export const deliveryAddressFieldsSchema = z
  .object({
    recipientName: z
      .string()
      .trim()
      .min(2, "Indica el nombre de quien recibe.")
      .max(120, "El nombre es demasiado largo."),
    phone: z
      .string()
      .trim()
      .min(7, "Indica un teléfono de contacto.")
      .max(20, "El teléfono es demasiado largo."),
    department: departmentSchema,
    cityOption: z.string().trim().min(1, "Selecciona la ciudad."),
    cityDetail: z
      .string()
      .trim()
      .max(120, "La ciudad es demasiado larga.")
      .optional()
      .or(z.literal("")),
    addressLine: z
      .string()
      .trim()
      .min(5, "Indica la dirección completa.")
      .max(200, "La dirección es demasiado larga."),
    notes: z
      .string()
      .trim()
      .max(300, "Las notas son demasiado largas.")
      .optional()
      .or(z.literal("")),
  })
  .superRefine((value, ctx) => {
    if (cityOptionNeedsDetail(value.cityOption) && !value.cityDetail?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["cityDetail"],
        message: "Indica el nombre de la ciudad.",
      });
    }
  });

/** Buyer checkout: order id, legal acceptance, and delivery address. */
export const checkoutDeliveryAddressSchema = deliveryAddressFieldsSchema.extend(
  {
    orderId: z.string().min(1, "Pedido inválido."),
    legalAccepted: z.literal(true, {
      error: "Debes aceptar los Términos y la Política de Privacidad.",
    }),
  },
);

/** Buyer request to change a frozen delivery address. */
export const requestDeliveryAddressChangeSchema =
  deliveryAddressFieldsSchema.extend({
    orderId: z.string().min(1, "Pedido inválido."),
  });

/** Seller accepts or rejects a pending change request. */
export const respondDeliveryAddressChangeSchema = z.object({
  changeId: z.string().min(1, "Solicitud inválida."),
  decision: z.enum(["accept", "reject"]),
});

export type DeliveryAddressActionState =
  | { ok: true; message?: string }
  | {
      ok: false;
      error: string;
      loginRequired?: boolean;
      fieldErrors?: Record<string, string[]>;
    }
  | null;

/**
 * fieldErrorsFromZod
 *
 * @param error - Zod validation error.
 * @returns Field-keyed messages for form UI.
 * @calledBy delivery address server actions
 */
export function fieldErrorsFromZod(
  error: z.ZodError,
): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key !== "string") continue;
    fieldErrors[key] ??= [];
    fieldErrors[key].push(issue.message);
  }
  return fieldErrors;
}
