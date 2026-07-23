import { z } from "zod";

export const MESSAGE_CONTENT_MAX = 2000;
export const MESSAGE_RATE_LIMIT = 20;
export const MESSAGE_RATE_WINDOW_MS = 60_000;

export const sendMessageSchema = z.object({
  listingId: z.string().min(1, "Anuncio inválido."),
  receiverId: z.string().min(1, "Destinatario inválido."),
  content: z
    .string()
    .trim()
    .min(1, "Escribe un mensaje.")
    .max(MESSAGE_CONTENT_MAX, "El mensaje es demasiado largo."),
});

export const markThreadReadSchema = z.object({
  listingId: z.string().min(1),
  otherUserId: z.string().min(1),
});

export const blockUserSchema = z.object({
  blockedId: z.string().min(1, "Usuario inválido."),
});

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
