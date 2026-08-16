/**
 * @file message.ts
 * @description Zod schemas and related types for messages (message.ts).
 * @dependencies zod
 */

import { z } from "zod";

/** MESSAGE_CONTENT_MAX — validates input for related MESSAGE_CONTENT_MAX flows. */
export const MESSAGE_CONTENT_MAX = 2000;
/** MESSAGE_RATE_LIMIT — validates input for related MESSAGE_RATE_LIMIT flows. */
export const MESSAGE_RATE_LIMIT = 20;
/** MESSAGE_RATE_WINDOW_MS — validates input for related MESSAGE_RATE_WINDOW_MS flows. */
export const MESSAGE_RATE_WINDOW_MS = 60_000;

/** sendMessageSchema — validates input for related sendMessage flows. */
export const sendMessageSchema = z.object({
  listingId: z.string().min(1, "Anuncio inválido."),
  receiverId: z.string().min(1, "Destinatario inválido."),
  content: z
    .string()
    .trim()
    .min(1, "Escribe un mensaje.")
    .max(MESSAGE_CONTENT_MAX, "El mensaje es demasiado largo."),
});

/** markThreadReadSchema — validates input for related markThreadRead flows. */
export const markThreadReadSchema = z.object({
  listingId: z.string().min(1),
  otherUserId: z.string().min(1),
});

/** blockUserSchema — validates input for related blockUser flows. */
export const blockUserSchema = z.object({
  blockedId: z.string().min(1, "Usuario inválido."),
});

/** reportConversationSchema — validates input for related reportConversation flows. */
export const reportConversationSchema = z.object({
  listingId: z.string().min(1),
  reason: z
    .string()
    .trim()
    .min(10, "Describe el problema (mínimo 10 caracteres).")
    .max(1000, "El motivo es demasiado largo."),
});

export type MessageActionState =
  | {
      ok: true;
      message?: string;
      messageId?: string;
    }
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
 * Flattens Zod issues into a field-name → messages map for form UI.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy messages UI and related modules
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
