/**
 * @file recommended-prices.ts
 * @description Server actions for admin recommended price CRUD.
 * @dependencies next/cache, prisma, recommended-price schema
 */

"use server";

import { revalidatePath } from "next/cache";

import {
  deleteRecommendedPriceSchema,
  fieldErrorsFromZod,
  recommendedPriceSchema,
} from "@/features/recommended-prices/schemas/recommended-price";
import type { RecommendedPriceActionState } from "@/features/recommended-prices/types";
import { getCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { isStorageAllowedForModel } from "@/lib/listings";

/**
 * requireAdmin
 *
 * Gates recommended-price mutations to ADMIN profiles.
 *
 * @returns Current profile when ADMIN; otherwise a failed action state.
 * @calledBy upsertRecommendedPriceAction, deleteRecommendedPriceAction
 */
async function requireAdmin(): Promise<
  | { ok: true; profileId: string }
  | { ok: false; state: RecommendedPriceActionState }
> {
  const current = await getCurrentProfile();
  if (!current) {
    return {
      ok: false,
      state: { ok: false, error: "Debes iniciar sesión." },
    };
  }
  if (current.profile.role !== "ADMIN") {
    return {
      ok: false,
      state: {
        ok: false,
        error: "Solo administradores pueden gestionar precios de referencia.",
      },
    };
  }
  return { ok: true, profileId: current.profile.id };
}

/**
 * upsertRecommendedPriceAction
 *
 * Creates or updates a recommended price keyed by model + storage + condition.
 * When `id` is present, updates that row (and may change the unique combo).
 *
 * @param _prev - Previous form state from useActionState.
 * @param formData - Recommended price form fields.
 * @returns RecommendedPriceActionState with success or validation errors.
 * @calledBy RecommendedPriceForm
 */
export async function upsertRecommendedPriceAction(
  _prev: RecommendedPriceActionState,
  formData: FormData,
): Promise<RecommendedPriceActionState> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.state;

  const parsed = recommendedPriceSchema.safeParse({
    id: formData.get("id") || undefined,
    iphoneModelId: formData.get("iphoneModelId"),
    iphoneStorageId: formData.get("iphoneStorageId"),
    condition: formData.get("condition"),
    priceCop: formData.get("priceCop"),
    minPriceCop: formData.get("minPriceCop"),
    maxPriceCop: formData.get("maxPriceCop"),
    notes: formData.get("notes"),
    effectiveFrom: formData.get("effectiveFrom"),
    effectiveTo: formData.get("effectiveTo"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los campos del precio de referencia.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const data = parsed.data;
  const notes =
    data.notes && data.notes.trim().length > 0 ? data.notes.trim() : null;

  // Ensure catalog FKs exist before write.
  const [model, storage] = await Promise.all([
    prisma.iphoneModel.findUnique({ where: { id: data.iphoneModelId } }),
    prisma.iphoneStorage.findUnique({ where: { id: data.iphoneStorageId } }),
  ]);
  if (!model) {
    return { ok: false, error: "Modelo de iPhone no encontrado." };
  }
  if (!storage) {
    return { ok: false, error: "Almacenamiento no encontrado." };
  }

  const storageAllowed = await isStorageAllowedForModel(model.id, storage.id);
  if (!storageAllowed) {
    return {
      ok: false,
      error:
        "Ese almacenamiento no está disponible para el modelo seleccionado.",
    };
  }

  const payload = {
    iphoneModelId: data.iphoneModelId,
    iphoneStorageId: data.iphoneStorageId,
    condition: data.condition,
    priceCop: data.priceCop,
    minPriceCop: data.minPriceCop ?? null,
    maxPriceCop: data.maxPriceCop ?? null,
    notes,
    effectiveFrom: data.effectiveFrom,
    effectiveTo: data.effectiveTo,
  };

  try {
    if (data.id) {
      const existing = await prisma.recommendedPrice.findUnique({
        where: { id: data.id },
      });
      if (!existing) {
        return { ok: false, error: "El precio de referencia ya no existe." };
      }

      await prisma.recommendedPrice.update({
        where: { id: data.id },
        data: payload,
      });
    } else {
      await prisma.recommendedPrice.upsert({
        where: {
          iphoneModelId_iphoneStorageId_condition: {
            iphoneModelId: data.iphoneModelId,
            iphoneStorageId: data.iphoneStorageId,
            condition: data.condition,
          },
        },
        create: payload,
        update: payload,
      });
    }
  } catch (error) {
    // Unique collision when editing into an existing combo owned by another row.
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return {
        ok: false,
        error:
          "Ya existe un precio para esa combinación de modelo, almacenamiento y estado.",
      };
    }
    throw error;
  }

  revalidatePath("/revision/precios");
  revalidatePath("/revision");

  return {
    ok: true,
    message: data.id
      ? "Precio de referencia actualizado."
      : "Precio de referencia guardado.",
  };
}

/**
 * deleteRecommendedPriceAction
 *
 * Removes a recommended price row.
 *
 * @param _prev - Previous form state from useActionState.
 * @param formData - Must include `id`.
 * @returns RecommendedPriceActionState.
 * @calledBy DeleteRecommendedPriceButton
 */
export async function deleteRecommendedPriceAction(
  _prev: RecommendedPriceActionState,
  formData: FormData,
): Promise<RecommendedPriceActionState> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.state;

  const parsed = deleteRecommendedPriceSchema.safeParse({
    id: formData.get("id"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "No se pudo eliminar el precio de referencia.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  try {
    await prisma.recommendedPrice.delete({ where: { id: parsed.data.id } });
  } catch {
    return { ok: false, error: "El precio de referencia ya no existe." };
  }

  revalidatePath("/revision/precios");
  revalidatePath("/revision");

  return { ok: true, message: "Precio de referencia eliminado." };
}
