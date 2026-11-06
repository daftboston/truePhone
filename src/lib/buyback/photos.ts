import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";
import { mayReadQuote } from "./policy";
import {
  BuybackError,
  lockedQuote,
  readQuote,
  type BuybackActor,
} from "./service";

export const BUYBACK_BUCKET = "buyback-photos";
export function detectImage(
  bytes: Uint8Array,
): "image/jpeg" | "image/png" | "image/webp" | null {
  const b = Buffer.from(bytes);
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
    return "image/png";
  if (
    b.toString("ascii", 0, 4) === "RIFF" &&
    b.toString("ascii", 8, 12) === "WEBP"
  )
    return "image/webp";
  return null;
}
export async function uploadPhoto(actor: BuybackActor, form: FormData) {
  const quoteId = form.get("quoteId"),
    slotRaw = form.get("slot"),
    file = form.get("file");
  const slot =
    typeof slotRaw === "string" && /^\d{1,2}$/.test(slotRaw)
      ? Number(slotRaw)
      : -1;
  if (
    typeof quoteId !== "string" ||
    !quoteId ||
    quoteId.length > 100 ||
    slot < 0 ||
    slot > 11 ||
    !(file instanceof File) ||
    file.size === 0 ||
    file.size > 4 * 1024 * 1024
  ) {
    throw new BuybackError(
      "INVALID_INPUT",
      "Sube una foto JPG, PNG o WebP de máximo 4 MB en un espacio válido.",
    );
  }
  const q = await prisma.buybackQuote.findUnique({ where: { id: quoteId } });
  if (!q || q.sellerId !== actor.id)
    throw new BuybackError("NOT_FOUND", "Solicitud no encontrada.");
  if (q.status !== "DRAFT")
    throw new BuybackError("INVALID_STATE", "Las fotos ya están en revisión.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = detectImage(bytes);
  if (!mime || mime !== file.type)
    throw new BuybackError(
      "INVALID_INPUT",
      "El archivo no es una imagen JPG, PNG o WebP válida.",
    );
  const admin = createAdminClient();
  if (!admin)
    throw new BuybackError(
      "UPLOAD_FAILED",
      "Las fotos privadas no están disponibles. Intenta más tarde.",
    );
  const objectPath = `${actor.id}/${q.id}/${randomUUID()}.${mime.split("/")[1]}`;
  const upload = await admin.storage
    .from(BUYBACK_BUCKET)
    .upload(objectPath, bytes, { contentType: mime, upsert: false });
  if (upload.error)
    throw new BuybackError(
      "UPLOAD_FAILED",
      "No pudimos subir la foto privada.",
    );
  let oldPath: string | null = null;
  try {
    await prisma.$transaction(async (tx) => {
      const current = await lockedQuote(tx, q.id);
      if (current.sellerId !== actor.id || current.status !== "DRAFT")
        throw new BuybackError(
          "INVALID_STATE",
          "Las fotos ya están en revisión.",
        );
      oldPath = current.photos.find((p) => p.slot === slot)?.objectPath ?? null;
      await tx.buybackPhoto.upsert({
        where: { quoteId_slot: { quoteId: q.id, slot } },
        create: { quoteId: q.id, slot, objectPath },
        update: { objectPath },
      });
      await tx.buybackQuote.update({
        where: { id: q.id },
        data: { version: { increment: 1 } },
      });
    });
  } catch (error) {
    await admin.storage.from(BUYBACK_BUCKET).remove([objectPath]);
    throw error;
  }
  if (oldPath) await admin.storage.from(BUYBACK_BUCKET).remove([oldPath]);
  return readQuote(actor, q.id);
}

export async function photoUrls(actor: BuybackActor, quoteId: string) {
  const q = await prisma.buybackQuote.findUnique({
    where: { id: quoteId },
    include: { photos: { orderBy: { slot: "asc" } } },
  });
  if (!q || !mayReadQuote(actor, q.sellerId))
    throw new BuybackError("NOT_FOUND", "Solicitud no encontrada.");
  const admin = createAdminClient();
  if (!admin)
    throw new BuybackError(
      "UPLOAD_FAILED",
      "Las fotos privadas no están disponibles.",
    );
  const expiresInSeconds = 300;
  return Promise.all(
    q.photos.map(async (photo) => {
      const { data, error } = await admin.storage
        .from(BUYBACK_BUCKET)
        .createSignedUrl(photo.objectPath, expiresInSeconds);
      if (error || !data)
        throw new BuybackError(
          "UPLOAD_FAILED",
          "No pudimos cargar las fotos privadas.",
        );
      return { slot: photo.slot, url: data.signedUrl, expiresInSeconds };
    }),
  );
}
