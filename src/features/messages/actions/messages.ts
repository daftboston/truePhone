"use server";

import { revalidatePath } from "next/cache";

import {
  blockUserSchema,
  fieldErrorsFromZod,
  markThreadReadSchema,
  MESSAGE_RATE_LIMIT,
  MESSAGE_RATE_WINDOW_MS,
  reportConversationSchema,
  sendMessageSchema,
  type MessageActionState,
} from "@/features/messages/schemas/message";
import { getCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  areMessagingBlocked,
  canSendInListingThread,
  canViewListingThread,
  createMessage,
  getListingForThread,
  markThreadRead,
} from "@/lib/messages";

function revalidateMessagingPaths(listingId: string) {
  revalidatePath("/mensajes");
  revalidatePath(`/mensajes/${listingId}`);
  revalidatePath(`/vender/${listingId}`);
  revalidatePath("/", "layout");
}

export async function sendMessageAction(
  _prev: MessageActionState,
  formData: FormData,
): Promise<MessageActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return {
      ok: false,
      error: "Debes iniciar sesión para enviar mensajes.",
      loginRequired: true,
    };
  }

  const parsed = sendMessageSchema.safeParse({
    listingId: formData.get("listingId"),
    receiverId: formData.get("receiverId"),
    content: formData.get("content"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa el mensaje.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const { listingId, receiverId, content } = parsed.data;
  const senderId = current.profile.id;

  if (senderId === receiverId) {
    return { ok: false, error: "No puedes enviarte mensajes a ti mismo." };
  }

  const listing = await getListingForThread(listingId);
  if (!listing) {
    return { ok: false, error: "Anuncio no encontrado." };
  }

  const access = await canSendInListingThread(listing, senderId, receiverId);
  if (!access.ok) {
    return { ok: false, error: access.error };
  }

  if (await areMessagingBlocked(senderId, receiverId)) {
    return {
      ok: false,
      error: "No puedes enviar mensajes a este usuario.",
    };
  }

  const recentCount = await prisma.message.count({
    where: {
      senderId,
      createdAt: { gte: new Date(Date.now() - MESSAGE_RATE_WINDOW_MS) },
    },
  });
  if (recentCount >= MESSAGE_RATE_LIMIT) {
    return {
      ok: false,
      error: "Estás enviando demasiado rápido. Espera un momento.",
    };
  }

  const receiver = await prisma.profile.findUnique({
    where: { id: receiverId },
    select: { id: true },
  });
  if (!receiver) {
    return { ok: false, error: "Destinatario no encontrado." };
  }

  const message = await createMessage({
    listingId,
    senderId,
    receiverId,
    content,
  });

  revalidateMessagingPaths(listingId);
  return {
    ok: true,
    message: "Mensaje enviado.",
    messageId: message.id,
  };
}

export async function markThreadReadAction(
  listingId: string,
  otherUserId: string,
): Promise<MessageActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return {
      ok: false,
      error: "Debes iniciar sesión.",
      loginRequired: true,
    };
  }

  const parsed = markThreadReadSchema.safeParse({ listingId, otherUserId });
  if (!parsed.success) {
    return { ok: false, error: "Conversación inválida." };
  }

  const listing = await getListingForThread(parsed.data.listingId);
  if (!listing) {
    return { ok: false, error: "Anuncio no encontrado." };
  }

  const access = await canViewListingThread(
    listing,
    current.profile.id,
    parsed.data.otherUserId,
  );
  if (!access.ok) {
    return { ok: false, error: access.error };
  }

  await markThreadRead(
    parsed.data.listingId,
    current.profile.id,
    parsed.data.otherUserId,
  );

  revalidateMessagingPaths(parsed.data.listingId);
  return { ok: true };
}

export async function blockUserAction(
  blockedId: string,
  listingId?: string,
): Promise<MessageActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return {
      ok: false,
      error: "Debes iniciar sesión.",
      loginRequired: true,
    };
  }

  const parsed = blockUserSchema.safeParse({ blockedId });
  if (!parsed.success) {
    return { ok: false, error: "Usuario inválido." };
  }

  if (parsed.data.blockedId === current.profile.id) {
    return { ok: false, error: "No puedes bloquearte a ti mismo." };
  }

  const target = await prisma.profile.findUnique({
    where: { id: parsed.data.blockedId },
    select: { id: true },
  });
  if (!target) {
    return { ok: false, error: "Usuario no encontrado." };
  }

  await prisma.userBlock.upsert({
    where: {
      blockerId_blockedId: {
        blockerId: current.profile.id,
        blockedId: parsed.data.blockedId,
      },
    },
    create: {
      blockerId: current.profile.id,
      blockedId: parsed.data.blockedId,
    },
    update: {},
  });

  revalidatePath("/mensajes");
  if (listingId) {
    revalidatePath(`/mensajes/${listingId}`);
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Usuario bloqueado." };
}

export async function unblockUserAction(
  blockedId: string,
  listingId?: string,
): Promise<MessageActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return {
      ok: false,
      error: "Debes iniciar sesión.",
      loginRequired: true,
    };
  }

  await prisma.userBlock.deleteMany({
    where: {
      blockerId: current.profile.id,
      blockedId,
    },
  });

  revalidatePath("/mensajes");
  if (listingId) {
    revalidatePath(`/mensajes/${listingId}`);
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Usuario desbloqueado." };
}

export async function reportConversationAction(
  _prev: MessageActionState,
  formData: FormData,
): Promise<MessageActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return {
      ok: false,
      error: "Debes iniciar sesión.",
      loginRequired: true,
    };
  }

  const parsed = reportConversationSchema.safeParse({
    listingId: formData.get("listingId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa el reporte.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const listing = await getListingForThread(parsed.data.listingId);
  if (!listing) {
    return { ok: false, error: "Anuncio no encontrado." };
  }

  // Reporter must be a participant (seller, assigned reviewer, or prior messenger).
  const participated = await prisma.message.findFirst({
    where: {
      listingId: listing.id,
      OR: [
        { senderId: current.profile.id },
        { receiverId: current.profile.id },
      ],
    },
    select: { id: true },
  });

  const isSeller = current.profile.id === listing.sellerId;
  const isReviewer = current.profile.id === listing.reviewerId;
  if (!participated && !isSeller && !isReviewer) {
    return {
      ok: false,
      error: "Solo puedes reportar conversaciones en las que participas.",
    };
  }

  await prisma.conversationReport.create({
    data: {
      reporterId: current.profile.id,
      listingId: listing.id,
      reason: parsed.data.reason,
    },
  });

  revalidatePath(`/mensajes/${listing.id}`);
  return { ok: true, message: "Reporte enviado. Lo revisaremos pronto." };
}
