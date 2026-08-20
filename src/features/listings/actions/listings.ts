"use server";

/**
 * @file listings.ts
 * @description Server actions for listings (listings.ts).
 * @dependencies next/cache, next/navigation, @/features/listings/schemas/listing, @/features/listings/types, @/lib/listings
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  buildListingSlug,
  buildListingTitle,
  computeFees,
  createListingSchema,
  generatePossessionCode,
  hashImei,
  imeiLast4,
  resolveListingCarrier,
  updateListingDetailsSchema,
  updateListingSecuritySchema,
} from "@/features/listings/schemas/listing";
import {
  fieldErrorsFromZod,
  MIN_LISTING_GALLERY_PHOTOS,
  type ListingActionState,
} from "@/features/listings/types";
import {
  getCatalog,
  getOwnedListing,
  isColorAllowedForModel,
  isStorageAllowedForModel,
  requireVerifiedSeller,
} from "@/lib/listings";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

const LISTING_BUCKET = "listing-images";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * checkboxValue
 *
 * Supports listings by implementing checkboxValue.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy listings UI and related modules
 */
function checkboxValue(formData: FormData, name: string) {
  return formData.get(name) === "on" || formData.get(name) === "true";
}

/**
 * uploadListingImage
 *
 * Supports listings by implementing uploadListingImage.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy listings UI and related modules
 */
async function uploadListingImage(
  authUserId: string,
  listingId: string,
  kind: "gallery" | "possession",
  file: File,
): Promise<{ url: string } | { error: string }> {
  if (!ALLOWED_TYPES.has(file.type)) {
    return { error: "Usa una imagen JPG, PNG o WebP." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: "La imagen debe pesar máximo 5 MB." };
  }

  const extension = file.type.split("/")[1] ?? "jpg";
  const objectPath = `${authUserId}/${listingId}/${kind}-${Date.now()}.${extension}`;
  const supabase = await createClient();
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from(LISTING_BUCKET)
    .upload(objectPath, bytes, {
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    return {
      error:
        "No pudimos subir la imagen. Confirma que el bucket «listing-images» existe en Supabase.",
    };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(LISTING_BUCKET).getPublicUrl(objectPath);

  return { url: publicUrl };
}

/**
 * createListingAction
 *
 * Server action: create listing for authenticated listings flows.
 *
 * @param _prev - Previous form state from useActionState when applicable.
 * @param formDataOrArgs - FormData or typed action arguments.
 * @returns Action state on errors; may redirect on success.
 * @calledBy listings components
 */
export async function createListingAction(
  _prev: ListingActionState,
  formData: FormData,
): Promise<ListingActionState> {
  const seller = await requireVerifiedSeller();
  if (!seller.ok) {
    return { ok: false, error: seller.error };
  }

  const parsed = createListingSchema.safeParse({
    iphoneModelId: formData.get("iphoneModelId"),
    iphoneColorId: formData.get("iphoneColorId"),
    iphoneStorageId: formData.get("iphoneStorageId"),
    condition: formData.get("condition"),
    batteryHealth: formData.get("batteryHealth"),
    price: formData.get("price"),
    description: formData.get("description") || "",
    hasBox: checkboxValue(formData, "hasBox"),
    hasCharger: checkboxValue(formData, "hasCharger"),
    hasReceipt: checkboxValue(formData, "hasReceipt"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los datos del dispositivo.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const [model, color, storage] = await Promise.all([
    prisma.iphoneModel.findUnique({ where: { id: parsed.data.iphoneModelId } }),
    prisma.iphoneColor.findUnique({ where: { id: parsed.data.iphoneColorId } }),
    prisma.iphoneStorage.findUnique({
      where: { id: parsed.data.iphoneStorageId },
    }),
  ]);

  if (!model || !color || !storage) {
    return { ok: false, error: "Modelo, color o almacenamiento no válido." };
  }

  const colorAllowed = await isColorAllowedForModel(model.id, color.id);
  if (!colorAllowed) {
    return {
      ok: false,
      error: "Ese color no está disponible para el modelo seleccionado.",
    };
  }

  const storageAllowed = await isStorageAllowedForModel(model.id, storage.id);
  if (!storageAllowed) {
    return {
      ok: false,
      error:
        "Ese almacenamiento no está disponible para el modelo seleccionado.",
    };
  }

  const fees = computeFees(parsed.data.price);
  const idSuffix = crypto.randomUUID().slice(0, 8);
  const title = buildListingTitle({
    modelName: model.name,
    storageGb: storage.valueGb,
    colorName: color.name,
  });
  const slug = buildListingSlug({
    modelSlug: model.slug,
    storageGb: storage.valueGb,
    colorName: color.name,
    idSuffix,
  });

  const listing = await prisma.listing.create({
    data: {
      sellerId: seller.current.profile.id,
      iphoneModelId: model.id,
      iphoneColorId: color.id,
      iphoneStorageId: storage.id,
      title,
      slug,
      description: parsed.data.description || null,
      condition: parsed.data.condition,
      batteryHealth: parsed.data.batteryHealth,
      price: parsed.data.price,
      platformFee: fees.platformFee,
      finalPrice: fees.finalPrice,
      hasBox: Boolean(parsed.data.hasBox),
      hasCharger: Boolean(parsed.data.hasCharger),
      hasReceipt: Boolean(parsed.data.hasReceipt),
      status: "DRAFT",
      possessionChallenge: {
        create: {
          code: generatePossessionCode(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  revalidatePath("/vender");
  redirect(`/vender/${listing.id}/fotos`);
}

/**
 * updateListingDetailsAction
 *
 * Server action: update listing details for authenticated listings flows.
 *
 * @param _prev - Previous form state from useActionState when applicable.
 * @param formDataOrArgs - FormData or typed action arguments.
 * @returns Action state on errors; may redirect on success.
 * @calledBy listings components
 */
export async function updateListingDetailsAction(
  listingId: string,
  _prev: ListingActionState,
  formData: FormData,
): Promise<ListingActionState> {
  const seller = await requireVerifiedSeller();
  if (!seller.ok) {
    return { ok: false, error: seller.error };
  }

  const listing = await getOwnedListing(listingId, seller.current.profile.id);
  if (!listing || listing.status !== "DRAFT") {
    return { ok: false, error: "Solo puedes editar borradores." };
  }

  const parsed = updateListingDetailsSchema.safeParse({
    iphoneModelId: formData.get("iphoneModelId"),
    iphoneColorId: formData.get("iphoneColorId"),
    iphoneStorageId: formData.get("iphoneStorageId"),
    condition: formData.get("condition"),
    batteryHealth: formData.get("batteryHealth"),
    price: formData.get("price"),
    description: formData.get("description") || "",
    hasBox: checkboxValue(formData, "hasBox"),
    hasCharger: checkboxValue(formData, "hasCharger"),
    hasReceipt: checkboxValue(formData, "hasReceipt"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los datos del dispositivo.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const [model, color, storage] = await Promise.all([
    prisma.iphoneModel.findUnique({ where: { id: parsed.data.iphoneModelId } }),
    prisma.iphoneColor.findUnique({ where: { id: parsed.data.iphoneColorId } }),
    prisma.iphoneStorage.findUnique({
      where: { id: parsed.data.iphoneStorageId },
    }),
  ]);

  if (!model || !color || !storage) {
    return { ok: false, error: "Modelo, color o almacenamiento no válido." };
  }

  const colorAllowed = await isColorAllowedForModel(model.id, color.id);
  if (!colorAllowed) {
    return {
      ok: false,
      error: "Ese color no está disponible para el modelo seleccionado.",
    };
  }

  const storageAllowed = await isStorageAllowedForModel(model.id, storage.id);
  if (!storageAllowed) {
    return {
      ok: false,
      error:
        "Ese almacenamiento no está disponible para el modelo seleccionado.",
    };
  }

  const fees = computeFees(parsed.data.price);
  const title = buildListingTitle({
    modelName: model.name,
    storageGb: storage.valueGb,
    colorName: color.name,
  });

  await prisma.listing.update({
    where: { id: listing.id },
    data: {
      iphoneModelId: model.id,
      iphoneColorId: color.id,
      iphoneStorageId: storage.id,
      title,
      description: parsed.data.description || null,
      condition: parsed.data.condition,
      batteryHealth: parsed.data.batteryHealth,
      price: parsed.data.price,
      platformFee: fees.platformFee,
      finalPrice: fees.finalPrice,
      hasBox: Boolean(parsed.data.hasBox),
      hasCharger: Boolean(parsed.data.hasCharger),
      hasReceipt: Boolean(parsed.data.hasReceipt),
    },
  });

  revalidatePath(`/vender/${listing.id}`);
  revalidatePath("/vender");
  redirect(`/vender/${listing.id}/fotos`);
}

/**
 * uploadListingGalleryAction
 *
 * Server action: upload listing gallery for authenticated listings flows.
 *
 * @param _prev - Previous form state from useActionState when applicable.
 * @param formDataOrArgs - FormData or typed action arguments.
 * @returns Action state on errors; may redirect on success.
 * @calledBy listings components
 */
export async function uploadListingGalleryAction(
  listingId: string,
  _prev: ListingActionState,
  formData: FormData,
): Promise<ListingActionState> {
  const seller = await requireVerifiedSeller();
  if (!seller.ok) {
    return { ok: false, error: seller.error };
  }

  const listing = await getOwnedListing(listingId, seller.current.profile.id);
  if (!listing || listing.status !== "DRAFT") {
    return { ok: false, error: "Solo puedes editar borradores." };
  }

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Selecciona una foto." };
  }

  const upload = await uploadListingImage(
    seller.current.user.id,
    listing.id,
    "gallery",
    file,
  );
  if ("error" in upload) {
    return { ok: false, error: upload.error };
  }

  const nextOrder = listing.images.filter(
    (i) => i.imageType === "gallery",
  ).length;

  await prisma.listingImage.create({
    data: {
      listingId: listing.id,
      imageUrl: upload.url,
      imageType: "gallery",
      displayOrder: nextOrder,
    },
  });

  revalidatePath(`/vender/${listing.id}/fotos`);
  return { ok: true, message: "Foto agregada." };
}

/**
 * continueFromPhotosAction
 *
 * Server action: continue from photos for authenticated listings flows.
 *
 * @param _prev - Previous form state from useActionState when applicable.
 * @param formDataOrArgs - FormData or typed action arguments.
 * @returns Action state on errors; may redirect on success.
 * @calledBy listings components
 */
export async function continueFromPhotosAction(listingId: string) {
  const seller = await requireVerifiedSeller();
  if (!seller.ok) {
    return { ok: false as const, error: seller.error };
  }

  const listing = await getOwnedListing(listingId, seller.current.profile.id);
  if (!listing || listing.status !== "DRAFT") {
    return { ok: false as const, error: "Anuncio no encontrado." };
  }

  const galleryCount = listing.images.filter(
    (i) => i.imageType === "gallery",
  ).length;
  if (galleryCount < MIN_LISTING_GALLERY_PHOTOS) {
    return {
      ok: false as const,
      error: `Agrega al menos ${MIN_LISTING_GALLERY_PHOTOS} fotos del dispositivo.`,
    };
  }

  redirect(`/vender/${listingId}/seguridad`);
}

/**
 * updateListingSecurityAction
 *
 * Server action: update listing security for authenticated listings flows.
 *
 * @param _prev - Previous form state from useActionState when applicable.
 * @param formDataOrArgs - FormData or typed action arguments.
 * @returns Action state on errors; may redirect on success.
 * @calledBy listings components
 */
export async function updateListingSecurityAction(
  listingId: string,
  _prev: ListingActionState,
  formData: FormData,
): Promise<ListingActionState> {
  const seller = await requireVerifiedSeller();
  if (!seller.ok) {
    return { ok: false, error: seller.error };
  }

  const listing = await getOwnedListing(listingId, seller.current.profile.id);
  if (!listing || listing.status !== "DRAFT") {
    return { ok: false, error: "Solo puedes editar borradores." };
  }

  const parsed = updateListingSecuritySchema.safeParse({
    imei: formData.get("imei"),
    activationLocked: formData.get("activationLocked"),
    unlocked: formData.get("unlocked"),
    carrier: formData.get("carrier") || "",
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los datos de seguridad.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  if (parsed.data.activationLocked === "true") {
    return {
      ok: false,
      error:
        "No puedes listar un iPhone con Activation Lock activo. Desactívalo en iCloud antes de continuar.",
    };
  }

  const imeiHash = hashImei(parsed.data.imei);
  const duplicate = await prisma.listing.findFirst({
    where: {
      imeiHash,
      deletedAt: null,
      NOT: { id: listing.id },
      status: { notIn: ["ARCHIVED", "REJECTED"] },
    },
    select: { id: true },
  });
  if (duplicate) {
    return {
      ok: false,
      error: "Ya existe un anuncio con este IMEI en TruePhone.",
    };
  }

  await prisma.listing.update({
    where: { id: listing.id },
    data: {
      imeiHash,
      imeiLast4: imeiLast4(parsed.data.imei),
      activationLocked: false,
      unlocked: parsed.data.unlocked === "true",
      carrier: resolveListingCarrier(parsed.data.unlocked, parsed.data.carrier),
    },
  });

  revalidatePath(`/vender/${listing.id}`);
  redirect(`/vender/${listing.id}/posesion`);
}

/**
 * uploadPossessionPhotoAction
 *
 * Server action: upload possession photo for authenticated listings flows.
 *
 * @param _prev - Previous form state from useActionState when applicable.
 * @param formDataOrArgs - FormData or typed action arguments.
 * @returns Action state on errors; may redirect on success.
 * @calledBy listings components
 */
export async function uploadPossessionPhotoAction(
  listingId: string,
  _prev: ListingActionState,
  formData: FormData,
): Promise<ListingActionState> {
  const seller = await requireVerifiedSeller();
  if (!seller.ok) {
    return { ok: false, error: seller.error };
  }

  const listing = await getOwnedListing(listingId, seller.current.profile.id);
  if (!listing || listing.status !== "DRAFT") {
    return { ok: false, error: "Solo puedes editar borradores." };
  }

  if (!listing.possessionChallenge) {
    return { ok: false, error: "No encontramos el código de posesión." };
  }

  const file = formData.get("possessionImage");
  if (!(file instanceof File) || file.size === 0) {
    return {
      ok: false,
      error: "Sube una foto del iPhone mostrando el código.",
    };
  }

  const upload = await uploadListingImage(
    seller.current.user.id,
    listing.id,
    "possession",
    file,
  );
  if ("error" in upload) {
    return { ok: false, error: upload.error };
  }

  await prisma.$transaction([
    prisma.devicePossessionChallenge.update({
      where: { listingId: listing.id },
      data: {
        photoUrl: upload.url,
        verifiedAt: new Date(),
      },
    }),
    prisma.listingImage.deleteMany({
      where: { listingId: listing.id, imageType: "possession" },
    }),
    prisma.listingImage.create({
      data: {
        listingId: listing.id,
        imageUrl: upload.url,
        imageType: "possession",
        displayOrder: 0,
      },
    }),
  ]);

  revalidatePath(`/vender/${listing.id}/posesion`);
  redirect(`/vender/${listing.id}/revisar`);
}

/**
 * submitListingForReviewAction
 *
 * Server action: submit listing for review for authenticated listings flows.
 *
 * @param _prev - Previous form state from useActionState when applicable.
 * @param formDataOrArgs - FormData or typed action arguments.
 * @returns Action state on errors; may redirect on success.
 * @calledBy listings components
 */
export async function submitListingForReviewAction(
  listingId: string,
): Promise<ListingActionState> {
  const seller = await requireVerifiedSeller();
  if (!seller.ok) {
    return { ok: false, error: seller.error };
  }

  const listing = await getOwnedListing(listingId, seller.current.profile.id);
  if (!listing || listing.status !== "DRAFT") {
    return { ok: false, error: "Solo puedes enviar borradores." };
  }

  const galleryCount = listing.images.filter(
    (i) => i.imageType === "gallery",
  ).length;
  if (galleryCount < MIN_LISTING_GALLERY_PHOTOS) {
    return {
      ok: false,
      error: `Agrega al menos ${MIN_LISTING_GALLERY_PHOTOS} fotos del dispositivo.`,
    };
  }
  if (!listing.imeiHash) {
    return { ok: false, error: "Completa el IMEI y la seguridad del equipo." };
  }
  if (!listing.possessionChallenge?.photoUrl) {
    return {
      ok: false,
      error: "Debes completar la verificación de posesión del dispositivo.",
    };
  }

  // Transition Draft → Submitted → Pending Review (no skipped states).
  await prisma.$transaction([
    prisma.listing.update({
      where: { id: listing.id },
      data: { status: "SUBMITTED" },
    }),
    prisma.listing.update({
      where: { id: listing.id },
      data: {
        status: "PENDING_REVIEW",
        rejectionReason: null,
        reviewerNotes: null,
        reviewedAt: null,
        approvedAt: null,
        reviewerId: null,
      },
    }),
  ]);

  revalidatePath("/vender");
  revalidatePath(`/vender/${listing.id}`);
  revalidatePath("/revision");
  revalidatePath("/revision/anuncios");
  redirect(`/vender/${listing.id}/enviado`);
}

/**
 * reopenRejectedListingAction
 *
 * Server action: reopen rejected listing for authenticated listings flows.
 *
 * @param _prev - Previous form state from useActionState when applicable.
 * @param formDataOrArgs - FormData or typed action arguments.
 * @returns Action state on errors; may redirect on success.
 * @calledBy listings components
 */
export async function reopenRejectedListingAction(
  listingId: string,
): Promise<ListingActionState> {
  const seller = await requireVerifiedSeller();
  if (!seller.ok) {
    return { ok: false, error: seller.error };
  }

  const listing = await getOwnedListing(listingId, seller.current.profile.id);
  if (!listing) {
    return { ok: false, error: "Anuncio no encontrado." };
  }
  if (listing.status !== "REJECTED") {
    return {
      ok: false,
      error: "Solo puedes editar anuncios rechazados.",
    };
  }

  await prisma.listing.update({
    where: { id: listing.id },
    data: {
      status: "DRAFT",
      // Keep rejectionReason visible until the next successful submit.
    },
  });

  revalidatePath("/vender");
  revalidatePath(`/vender/${listing.id}`);
  revalidatePath(`/vender/${listing.id}/dispositivo`);
  revalidatePath("/revision");
  revalidatePath("/revision/anuncios");

  return {
    ok: true,
    listingId: listing.id,
    message: "Puedes editar el anuncio.",
  };
}

/**
 * deleteListingGalleryImageAction
 *
 * Server action: delete listing gallery image for authenticated listings flows.
 *
 * @param _prev - Previous form state from useActionState when applicable.
 * @param formDataOrArgs - FormData or typed action arguments.
 * @returns Action state on errors; may redirect on success.
 * @calledBy listings components
 */
export async function deleteListingGalleryImageAction(
  listingId: string,
  imageId: string,
): Promise<ListingActionState> {
  const seller = await requireVerifiedSeller();
  if (!seller.ok) {
    return { ok: false, error: seller.error };
  }

  const listing = await getOwnedListing(listingId, seller.current.profile.id);
  if (!listing || listing.status !== "DRAFT") {
    return { ok: false, error: "Solo puedes editar borradores." };
  }

  const image = listing.images.find(
    (item) => item.id === imageId && item.imageType === "gallery",
  );
  if (!image) {
    return { ok: false, error: "Foto no encontrada." };
  }

  await prisma.listingImage.delete({ where: { id: image.id } });
  revalidatePath(`/vender/${listing.id}/fotos`);
  return { ok: true, message: "Foto eliminada." };
}

/**
 * deleteDraftListingAction
 *
 * Server action: delete draft listing for authenticated listings flows.
 *
 * @param _prev - Previous form state from useActionState when applicable.
 * @param formDataOrArgs - FormData or typed action arguments.
 * @returns Action state on errors; may redirect on success.
 * @calledBy listings components
 */
export async function deleteDraftListingAction(listingId: string) {
  const seller = await requireVerifiedSeller();
  if (!seller.ok) {
    return { ok: false as const, error: seller.error };
  }

  const listing = await getOwnedListing(listingId, seller.current.profile.id);
  if (!listing || listing.status !== "DRAFT") {
    return { ok: false as const, error: "Solo puedes eliminar borradores." };
  }

  await prisma.listing.update({
    where: { id: listing.id },
    data: { deletedAt: new Date(), status: "ARCHIVED" },
  });

  revalidatePath("/vender");
  redirect("/vender");
}

/**
 * loadCatalogAction
 *
 * Server action: load catalog for authenticated listings flows.
 *
 * @param _prev - Previous form state from useActionState when applicable.
 * @param formDataOrArgs - FormData or typed action arguments.
 * @returns Action state on errors; may redirect on success.
 * @calledBy listings components
 */
export async function loadCatalogAction() {
  return getCatalog();
}
