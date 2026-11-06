"use server";

import { revalidatePath } from "next/cache";
import {
  acceptSchema,
  idSchema,
  offerSchema,
  quoteVersionSchema,
} from "../schemas";
import type {
  BuybackQuoteView,
  BuybackResult,
  BuybackDraftInput,
  BuybackQuoteVersionInput,
  BuybackOfferInput,
  BuybackAcceptInput,
  BuybackPhotoUrlView,
  BuybackSyncResult,
} from "../types";
import { getCurrentProfile } from "@/lib/auth/session";
import {
  acceptOffer,
  BuybackError,
  cancelQuote,
  createQuote,
  readQuote,
  requestReview,
  sendOffer,
  submitQuote,
  type BuybackActor,
} from "@/lib/buyback/service";
import { photoUrls, uploadPhoto } from "@/lib/buyback/photos";
import { syncBuybackPrices } from "@/lib/buyback/price-sync";

async function run<T>(
  work: (actor: BuybackActor) => Promise<T>,
): Promise<BuybackResult<T>> {
  if (process.env.BUYBACK_ENABLED !== "true")
    return {
      ok: false,
      code: "NOT_AVAILABLE",
      error: "Vende ya aún no está disponible.",
    };
  const current = await getCurrentProfile();
  if (!current)
    return {
      ok: false,
      code: "UNAUTHENTICATED",
      error: "Debes iniciar sesión.",
    };
  try {
    const data = await work({
      id: current.profile.id,
      role: current.profile.role,
    });
    revalidatePath("/vende-ya");
    revalidatePath("/revision/vende-ya");
    return { ok: true, data };
  } catch (error) {
    if (error instanceof BuybackError)
      return { ok: false, code: error.code, error: error.message };
    // Never send DB/Google errors, private rows or credential details to the browser.
    console.error("buyback_operation_failed");
    return {
      ok: false,
      code: "NOT_AVAILABLE",
      error: "No pudimos completar la solicitud. Intenta de nuevo.",
    };
  }
}
function parse<T>(
  schema: {
    safeParse: (
      input: unknown,
    ) => { success: true; data: T } | { success: false };
  },
  input: unknown,
): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success)
    throw new BuybackError(
      "INVALID_INPUT",
      "Revisa los datos de la solicitud.",
    );
  return parsed.data;
}
export async function createBuybackQuoteAction(
  input: BuybackDraftInput,
): Promise<BuybackResult<BuybackQuoteView>> {
  return run((actor) => createQuote(actor, input));
}
export async function getBuybackQuoteAction(
  quoteId: string,
): Promise<BuybackResult<BuybackQuoteView>> {
  return run((actor) => readQuote(actor, parse(idSchema, quoteId)));
}
export async function uploadBuybackPhotoAction(
  form: FormData,
): Promise<BuybackResult<BuybackQuoteView>> {
  return run((actor) => uploadPhoto(actor, form));
}
export async function getBuybackPhotoUrlsAction(
  quoteId: string,
): Promise<BuybackResult<BuybackPhotoUrlView[]>> {
  return run((actor) => photoUrls(actor, parse(idSchema, quoteId)));
}
export async function submitBuybackQuoteAction(
  input: BuybackQuoteVersionInput,
): Promise<BuybackResult<BuybackQuoteView>> {
  return run((actor) => submitQuote(actor, parse(quoteVersionSchema, input)));
}
export async function expressBuybackRangeInterestAction(
  input: BuybackQuoteVersionInput,
): Promise<BuybackResult<BuybackQuoteView>> {
  return run((actor) => requestReview(actor, parse(quoteVersionSchema, input)));
}
export async function sendBuybackOfferAction(
  input: BuybackOfferInput,
): Promise<BuybackResult<BuybackQuoteView>> {
  return run((actor) => sendOffer(actor, parse(offerSchema, input)));
}
export async function acceptBuybackOfferAction(
  input: BuybackAcceptInput,
): Promise<BuybackResult<BuybackQuoteView>> {
  return run((actor) => acceptOffer(actor, parse(acceptSchema, input)));
}
export async function cancelBuybackQuoteAction(
  input: BuybackQuoteVersionInput,
): Promise<BuybackResult<BuybackQuoteView>> {
  return run((actor) => cancelQuote(actor, parse(quoteVersionSchema, input)));
}
export async function syncBuybackPricesAction(): Promise<
  BuybackResult<BuybackSyncResult>
> {
  return run(async (actor) => {
    if (actor.role !== "ADMIN")
      throw new BuybackError(
        "FORBIDDEN",
        "Solo un administrador puede sincronizar precios.",
      );
    try {
      return await syncBuybackPrices(actor.id);
    } catch {
      throw new BuybackError(
        "SYNC_FAILED",
        "No se importaron precios. Revisa el acceso privado de Google y los encabezados; se conservan los precios anteriores.",
      );
    }
  });
}
