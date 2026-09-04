/**
 * @file listing-qa-access.ts
 * @description Client-safe listing Q&A constants and access rules (no Prisma).
 * @dependencies @prisma/client ListingStatus type only
 */

import type { ListingStatus } from "@prisma/client";

export const LISTING_QA_BODY_MAX = 500;
export const LISTING_QA_REPORT_REASON_MIN = 10;
export const LISTING_QA_REPORT_REASON_MAX = 1000;
export const LISTING_QA_MAX_OPEN_PER_LISTING = 5;
export const LISTING_QA_MAX_QUESTIONS_PER_DAY = 10;
export const LISTING_QA_MAX_POSTS_PER_HOUR = 20;

export type ListingQaListing = {
  id: string;
  sellerId: string;
  status: ListingStatus;
  slug: string;
  deletedAt: Date | null;
};

export type ListingQaViewer = {
  profileId: string | null;
  isStaff: boolean;
};

export type ListingQaAccessResult = { ok: true } | { ok: false; error: string };

/**
 * listingQaAuthorName
 *
 * Picks a public display name for a Q&A participant.
 *
 * @param party - Profile name fields.
 * @returns Display string.
 * @calledBy listing Q&A UI and moderation queue
 */
export function listingQaAuthorName(party: {
  fullName: string | null;
  username: string | null;
}) {
  return party.fullName?.trim() || party.username || "Usuario TruePhone";
}

/**
 * containsOffPlatformContact
 *
 * Detects phone numbers and off-platform contact fishing in Q&A bodies.
 *
 * @param body - Question or answer text.
 * @returns True when the body looks like off-platform contact.
 * @calledBy ask/answer validation and listing-qa.test
 */
export function containsOffPlatformContact(body: string): boolean {
  const text = body.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

  if (
    /(?:\+57[\s.-]?)?3\d{2}[\s.-]?\d{3}[\s.-]?\d{4}\b/.test(text) ||
    /\b\d{10}\b/.test(text.replace(/[\s.-]/g, " "))
  ) {
    return true;
  }

  return /\b(whats?app|telegram|wa\.me|t\.me|escribeme|llamame|escriba(me)? al|llame al)\b/i.test(
    text,
  );
}

/**
 * canAskListingQuestion
 *
 * Whether a signed-in user may post a public question on a listing.
 *
 * @param input.listing - Listing identity and status.
 * @param input.actorId - Asker profile UUID.
 * @returns Access result with Spanish error copy.
 * @calledBy askListingQuestion, listing-qa.test
 */
export function canAskListingQuestion(input: {
  listing: ListingQaListing;
  actorId: string;
}): ListingQaAccessResult {
  if (input.listing.deletedAt) {
    return { ok: false, error: "Este anuncio ya no está disponible." };
  }
  if (input.listing.sellerId === input.actorId) {
    return {
      ok: false,
      error: "No puedes preguntar en tu propio anuncio.",
    };
  }
  if (input.listing.status !== "PUBLISHED") {
    return {
      ok: false,
      error: "Solo se puede preguntar en anuncios publicados.",
    };
  }
  return { ok: true };
}

/**
 * canAnswerListingQuestion
 *
 * Whether the listing owner may post or edit the official answer.
 *
 * @param input.listing - Listing identity and status.
 * @param input.actorId - Actor profile UUID.
 * @param input.hasAnswer - Whether an answer already exists (create vs edit).
 * @param input.create - True when creating a new answer.
 * @returns Access result with Spanish error copy.
 * @calledBy answerListingQuestion, editListingAnswer, listing-qa.test
 */
export function canAnswerListingQuestion(input: {
  listing: ListingQaListing;
  actorId: string;
  hasAnswer: boolean;
  create: boolean;
}): ListingQaAccessResult {
  if (input.listing.deletedAt) {
    return { ok: false, error: "Este anuncio ya no está disponible." };
  }
  if (input.listing.sellerId !== input.actorId) {
    return {
      ok: false,
      error: "Solo el vendedor puede responder esta pregunta.",
    };
  }
  if (
    input.listing.status !== "PUBLISHED" &&
    input.listing.status !== "RESERVED"
  ) {
    return {
      ok: false,
      error: "Ya no se pueden responder preguntas en este anuncio.",
    };
  }
  if (input.create && input.hasAnswer) {
    return {
      ok: false,
      error: "Esta pregunta ya tiene una respuesta oficial.",
    };
  }
  if (!input.create && !input.hasAnswer) {
    return { ok: false, error: "Esta pregunta aún no tiene respuesta." };
  }
  return { ok: true };
}

/**
 * canDeleteOwnQuestion
 *
 * Whether the asker may delete an unanswered question.
 *
 * @param input.actorId - Actor profile UUID.
 * @param input.askerId - Question author profile UUID.
 * @param input.hasAnswer - Whether an official answer exists.
 * @param input.hiddenAt - Soft-hide timestamp.
 * @returns Access result with Spanish error copy.
 * @calledBy deleteOwnUnansweredQuestion, listing-qa.test
 */
export function canDeleteOwnQuestion(input: {
  actorId: string;
  askerId: string;
  hasAnswer: boolean;
  hiddenAt: Date | null;
}): ListingQaAccessResult {
  if (input.actorId !== input.askerId) {
    return { ok: false, error: "Solo puedes eliminar tu propia pregunta." };
  }
  if (input.hiddenAt) {
    return { ok: false, error: "Esta pregunta ya no está visible." };
  }
  if (input.hasAnswer) {
    return {
      ok: false,
      error: "No puedes eliminar una pregunta que ya tiene respuesta.",
    };
  }
  return { ok: true };
}

/**
 * canViewHiddenQaItem
 *
 * Whether a viewer may see a soft-hidden question or answer.
 *
 * @param input.hiddenAt - Soft-hide timestamp.
 * @param input.authorId - Asker or seller id for the hidden row.
 * @param input.sellerId - Listing owner id.
 * @param input.viewer - Current viewer.
 * @returns True when the hidden row should render as Oculta.
 * @calledBy listListingQuestions, listing-qa.test
 */
export function canViewHiddenQaItem(input: {
  hiddenAt: Date | null;
  authorId: string;
  sellerId: string;
  viewer: ListingQaViewer;
}): boolean {
  if (!input.hiddenAt) return true;
  if (input.viewer.isStaff) return true;
  if (!input.viewer.profileId) return false;
  return (
    input.viewer.profileId === input.authorId ||
    input.viewer.profileId === input.sellerId
  );
}

/**
 * listingQaPublicHref
 *
 * Deep link to the public listing Q&A section.
 *
 * @param slug - Listing slug.
 * @returns Relative path with #preguntas anchor.
 * @calledBy notification helpers
 */
export function listingQaPublicHref(slug: string) {
  return `/anuncios/${slug}#preguntas`;
}
