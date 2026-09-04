/**
 * @file listing-qa.ts
 * @description Public listing Q&A persistence (Phase 8b). Access rules live in listing-qa-access.
 * @dependencies @prisma/client, @/lib/db, @/lib/listing-qa-access
 */

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import {
  LISTING_QA_BODY_MAX,
  LISTING_QA_MAX_OPEN_PER_LISTING,
  LISTING_QA_MAX_POSTS_PER_HOUR,
  LISTING_QA_MAX_QUESTIONS_PER_DAY,
  canAnswerListingQuestion,
  canAskListingQuestion,
  canDeleteOwnQuestion,
  canViewHiddenQaItem,
  containsOffPlatformContact,
  type ListingQaAccessResult,
  type ListingQaViewer,
} from "@/lib/listing-qa-access";

export {
  LISTING_QA_BODY_MAX,
  LISTING_QA_MAX_OPEN_PER_LISTING,
  LISTING_QA_MAX_POSTS_PER_HOUR,
  LISTING_QA_MAX_QUESTIONS_PER_DAY,
  LISTING_QA_REPORT_REASON_MAX,
  LISTING_QA_REPORT_REASON_MIN,
  canAnswerListingQuestion,
  canAskListingQuestion,
  canDeleteOwnQuestion,
  canViewHiddenQaItem,
  containsOffPlatformContact,
  listingQaAuthorName,
  listingQaPublicHref,
} from "@/lib/listing-qa-access";
export type {
  ListingQaAccessResult,
  ListingQaListing,
  ListingQaViewer,
} from "@/lib/listing-qa-access";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const partySelect = {
  id: true,
  fullName: true,
  username: true,
  avatarUrl: true,
} satisfies Prisma.ProfileSelect;

const questionListInclude = {
  asker: { select: partySelect },
  answer: {
    include: {
      seller: { select: partySelect },
    },
  },
} satisfies Prisma.ListingQuestionInclude;

export type ListingQaQuestion = Prisma.ListingQuestionGetPayload<{
  include: typeof questionListInclude;
}>;

/**
 * loadListingForQa
 *
 * Loads listing fields needed for Q&A authorization.
 *
 * @param listingId - Listing UUID.
 * @returns ListingQaListing or null.
 * @calledBy Q&A mutations
 */
export async function loadListingForQa(listingId: string) {
  return prisma.listing.findFirst({
    where: { id: listingId },
    select: {
      id: true,
      sellerId: true,
      status: true,
      slug: true,
      deletedAt: true,
      title: true,
    },
  });
}

/**
 * listListingQuestions
 *
 * Lists Q&A threads for a listing, omitting hidden rows from the public.
 *
 * @param input.listingId - Listing UUID.
 * @param input.sellerId - Listing owner id.
 * @param input.viewer - Current viewer.
 * @returns Visible question threads, oldest first.
 * @calledBy ListingQaSection, seller hub hint
 */
export async function listListingQuestions(input: {
  listingId: string;
  sellerId: string;
  viewer: ListingQaViewer;
}): Promise<ListingQaQuestion[]> {
  const rows = await prisma.listingQuestion.findMany({
    where: { listingId: input.listingId },
    include: questionListInclude,
    orderBy: { createdAt: "asc" },
  });

  return rows.flatMap((row) => {
    if (
      !canViewHiddenQaItem({
        hiddenAt: row.hiddenAt,
        authorId: row.askerId,
        sellerId: input.sellerId,
        viewer: input.viewer,
      })
    ) {
      return [];
    }

    if (
      row.answer &&
      !canViewHiddenQaItem({
        hiddenAt: row.answer.hiddenAt,
        authorId: row.answer.sellerId,
        sellerId: input.sellerId,
        viewer: input.viewer,
      })
    ) {
      return [{ ...row, answer: null }];
    }

    return [row];
  });
}

/**
 * countPublicListingQuestions
 *
 * Counts non-hidden questions on a listing.
 *
 * @param listingId - Listing UUID.
 * @returns Public question count.
 * @calledBy ListingQaSection
 */
export async function countPublicListingQuestions(listingId: string) {
  return prisma.listingQuestion.count({
    where: { listingId, hiddenAt: null },
  });
}

/**
 * countUnansweredListingQuestions
 *
 * Counts visible questions that still need an official answer.
 *
 * @param listingId - Listing UUID.
 * @returns Unanswered question count.
 * @calledBy SellerListingSummary
 */
export async function countUnansweredListingQuestions(listingId: string) {
  return prisma.listingQuestion.count({
    where: {
      listingId,
      hiddenAt: null,
      answer: { is: null },
    },
  });
}

/**
 * askListingQuestion
 *
 * Creates a public question after access, fishing, and rate-limit checks.
 *
 * @param input.listingId - Listing UUID.
 * @param input.askerId - Asker profile UUID.
 * @param input.body - Question text.
 * @returns Created question id or Spanish error.
 * @calledBy askListingQuestionAction
 */
export async function askListingQuestion(input: {
  listingId: string;
  askerId: string;
  body: string;
}): Promise<
  | {
      ok: true;
      questionId: string;
      listingSlug: string;
      listingTitle: string;
      sellerId: string;
    }
  | { ok: false; error: string }
> {
  const listing = await loadListingForQa(input.listingId);
  if (!listing) {
    return { ok: false, error: "Anuncio no encontrado." };
  }

  const access = canAskListingQuestion({
    listing,
    actorId: input.askerId,
  });
  if (!access.ok) return access;

  const fishing = validateQaBody(input.body);
  if (!fishing.ok) return fishing;

  const rate = await assertAskRateLimits(input.askerId, listing.id);
  if (!rate.ok) return rate;

  const created = await prisma.listingQuestion.create({
    data: {
      listingId: listing.id,
      askerId: input.askerId,
      body: fishing.body,
    },
    select: { id: true },
  });

  return {
    ok: true,
    questionId: created.id,
    listingSlug: listing.slug,
    listingTitle: listing.title,
    sellerId: listing.sellerId,
  };
}

/**
 * answerListingQuestion
 *
 * Creates the official seller answer for a question.
 *
 * @param input.questionId - Question UUID.
 * @param input.sellerId - Seller profile UUID.
 * @param input.body - Answer text.
 * @returns Created answer id or Spanish error.
 * @calledBy answerListingQuestionAction
 */
export async function answerListingQuestion(input: {
  questionId: string;
  sellerId: string;
  body: string;
}): Promise<
  | {
      ok: true;
      answerId: string;
      askerId: string;
      listingSlug: string;
      listingTitle: string;
    }
  | { ok: false; error: string }
> {
  const question = await loadQuestionForMutation(input.questionId);
  if (!question) {
    return { ok: false, error: "Pregunta no encontrada." };
  }
  if (question.hiddenAt) {
    return { ok: false, error: "Esta pregunta ya no está visible." };
  }

  const access = canAnswerListingQuestion({
    listing: question.listing,
    actorId: input.sellerId,
    hasAnswer: Boolean(question.answer),
    create: true,
  });
  if (!access.ok) return access;

  const fishing = validateQaBody(input.body);
  if (!fishing.ok) return fishing;

  const rate = await assertPostRateLimit(input.sellerId);
  if (!rate.ok) return rate;

  try {
    const created = await prisma.listingQuestionAnswer.create({
      data: {
        questionId: question.id,
        sellerId: input.sellerId,
        body: fishing.body,
      },
      select: { id: true },
    });

    return {
      ok: true,
      answerId: created.id,
      askerId: question.askerId,
      listingSlug: question.listing.slug,
      listingTitle: question.listing.title,
    };
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return {
        ok: false,
        error: "Esta pregunta ya tiene una respuesta oficial.",
      };
    }
    throw error;
  }
}

/**
 * editListingAnswer
 *
 * Updates the seller's official answer.
 *
 * @param input.answerId - Answer UUID.
 * @param input.sellerId - Seller profile UUID.
 * @param input.body - Updated answer text.
 * @returns Ok or Spanish error.
 * @calledBy editListingAnswerAction
 */
export async function editListingAnswer(input: {
  answerId: string;
  sellerId: string;
  body: string;
}): Promise<{ ok: true; listingSlug: string } | { ok: false; error: string }> {
  const answer = await prisma.listingQuestionAnswer.findFirst({
    where: { id: input.answerId },
    include: {
      question: {
        include: {
          listing: {
            select: {
              id: true,
              sellerId: true,
              status: true,
              slug: true,
              deletedAt: true,
              title: true,
            },
          },
        },
      },
    },
  });

  if (!answer) {
    return { ok: false, error: "Respuesta no encontrada." };
  }
  if (answer.hiddenAt || answer.question.hiddenAt) {
    return { ok: false, error: "Esta respuesta ya no está visible." };
  }

  const access = canAnswerListingQuestion({
    listing: answer.question.listing,
    actorId: input.sellerId,
    hasAnswer: true,
    create: false,
  });
  if (!access.ok) return access;

  const fishing = validateQaBody(input.body);
  if (!fishing.ok) return fishing;

  const rate = await assertPostRateLimit(input.sellerId);
  if (!rate.ok) return rate;

  await prisma.listingQuestionAnswer.update({
    where: { id: answer.id },
    data: { body: fishing.body },
  });

  return { ok: true, listingSlug: answer.question.listing.slug };
}

/**
 * deleteOwnUnansweredQuestion
 *
 * Deletes the asker's own unanswered question.
 *
 * @param input.questionId - Question UUID.
 * @param input.askerId - Asker profile UUID.
 * @returns Ok or Spanish error.
 * @calledBy deleteOwnUnansweredQuestionAction
 */
export async function deleteOwnUnansweredQuestion(input: {
  questionId: string;
  askerId: string;
}): Promise<{ ok: true; listingSlug: string } | { ok: false; error: string }> {
  const question = await loadQuestionForMutation(input.questionId);
  if (!question) {
    return { ok: false, error: "Pregunta no encontrada." };
  }

  const access = canDeleteOwnQuestion({
    actorId: input.askerId,
    askerId: question.askerId,
    hasAnswer: Boolean(question.answer),
    hiddenAt: question.hiddenAt,
  });
  if (!access.ok) return access;

  await prisma.listingQuestion.delete({ where: { id: question.id } });
  return { ok: true, listingSlug: question.listing.slug };
}

/**
 * reportListingQa
 *
 * Creates an open report on a question or answer.
 *
 * @param input.reporterId - Reporter profile UUID.
 * @param input.questionId - Optional question UUID.
 * @param input.answerId - Optional answer UUID.
 * @param input.reason - Report reason.
 * @returns Ok or Spanish error.
 * @calledBy reportListingQuestionAction
 */
export async function reportListingQa(input: {
  reporterId: string;
  questionId?: string;
  answerId?: string;
  reason: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (Boolean(input.questionId) === Boolean(input.answerId)) {
    return { ok: false, error: "Elige una pregunta o una respuesta." };
  }

  if (input.questionId) {
    const question = await prisma.listingQuestion.findFirst({
      where: { id: input.questionId, hiddenAt: null },
      select: { id: true, askerId: true },
    });
    if (!question) {
      return { ok: false, error: "Pregunta no encontrada." };
    }
    if (question.askerId === input.reporterId) {
      return { ok: false, error: "No puedes reportar tu propia pregunta." };
    }
    const already = await prisma.listingQuestionReport.findFirst({
      where: {
        questionId: question.id,
        reporterId: input.reporterId,
        resolvedAt: null,
      },
      select: { id: true },
    });
    if (already) {
      return { ok: false, error: "Ya reportaste esta pregunta." };
    }
    await prisma.listingQuestionReport.create({
      data: {
        questionId: question.id,
        reporterId: input.reporterId,
        reason: input.reason.trim(),
      },
    });
    return { ok: true };
  }

  const answer = await prisma.listingQuestionAnswer.findFirst({
    where: { id: input.answerId, hiddenAt: null },
    select: { id: true, sellerId: true },
  });
  if (!answer) {
    return { ok: false, error: "Respuesta no encontrada." };
  }
  if (answer.sellerId === input.reporterId) {
    return { ok: false, error: "No puedes reportar tu propia respuesta." };
  }
  const already = await prisma.listingQuestionReport.findFirst({
    where: {
      answerId: answer.id,
      reporterId: input.reporterId,
      resolvedAt: null,
    },
    select: { id: true },
  });
  if (already) {
    return { ok: false, error: "Ya reportaste esta respuesta." };
  }
  await prisma.listingQuestionReport.create({
    data: {
      answerId: answer.id,
      reporterId: input.reporterId,
      reason: input.reason.trim(),
    },
  });
  return { ok: true };
}

/**
 * hideListingQuestion
 *
 * Soft-hides a question and resolves its open reports (and answer reports).
 *
 * @param input.questionId - Question UUID.
 * @param input.moderatorId - Staff profile UUID.
 * @returns Ok or Spanish error.
 * @calledBy hideListingQuestionAction
 */
export async function hideListingQuestion(input: {
  questionId: string;
  moderatorId: string;
}): Promise<{ ok: true; listingSlug: string } | { ok: false; error: string }> {
  const question = await loadQuestionForMutation(input.questionId);
  if (!question) {
    return { ok: false, error: "Pregunta no encontrada." };
  }
  if (question.hiddenAt) {
    return { ok: false, error: "Esta pregunta ya está oculta." };
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.listingQuestion.update({
      where: { id: question.id },
      data: { hiddenAt: now, hiddenById: input.moderatorId },
    });
    await tx.listingQuestionReport.updateMany({
      where: {
        resolvedAt: null,
        OR: [
          { questionId: question.id },
          ...(question.answer ? [{ answerId: question.answer.id }] : []),
        ],
      },
      data: { resolvedAt: now, resolvedById: input.moderatorId },
    });
  });

  return { ok: true, listingSlug: question.listing.slug };
}

/**
 * hideListingAnswer
 *
 * Soft-hides an official answer and resolves its open reports.
 *
 * @param input.answerId - Answer UUID.
 * @param input.moderatorId - Staff profile UUID.
 * @returns Ok or Spanish error.
 * @calledBy hideListingAnswerAction
 */
export async function hideListingAnswer(input: {
  answerId: string;
  moderatorId: string;
}): Promise<{ ok: true; listingSlug: string } | { ok: false; error: string }> {
  const answer = await prisma.listingQuestionAnswer.findFirst({
    where: { id: input.answerId },
    include: {
      question: {
        select: {
          listing: { select: { slug: true } },
        },
      },
    },
  });
  if (!answer) {
    return { ok: false, error: "Respuesta no encontrada." };
  }
  if (answer.hiddenAt) {
    return { ok: false, error: "Esta respuesta ya está oculta." };
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.listingQuestionAnswer.update({
      where: { id: answer.id },
      data: { hiddenAt: now, hiddenById: input.moderatorId },
    });
    await tx.listingQuestionReport.updateMany({
      where: { answerId: answer.id, resolvedAt: null },
      data: { resolvedAt: now, resolvedById: input.moderatorId },
    });
  });

  return { ok: true, listingSlug: answer.question.listing.slug };
}

/**
 * dismissListingQuestionReports
 *
 * Resolves open reports on a question and/or its answer without hiding.
 *
 * @param input.questionId - Optional question UUID.
 * @param input.answerId - Optional answer UUID.
 * @param input.moderatorId - Staff profile UUID.
 * @returns Ok or Spanish error.
 * @calledBy dismissListingQuestionReportsAction
 */
export async function dismissListingQuestionReports(input: {
  questionId?: string;
  answerId?: string;
  moderatorId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!input.questionId && !input.answerId) {
    return { ok: false, error: "Elige una pregunta o una respuesta." };
  }

  await prisma.listingQuestionReport.updateMany({
    where: {
      resolvedAt: null,
      OR: [
        input.questionId ? { questionId: input.questionId } : undefined,
        input.answerId ? { answerId: input.answerId } : undefined,
      ].filter(Boolean) as Prisma.ListingQuestionReportWhereInput[],
    },
    data: {
      resolvedAt: new Date(),
      resolvedById: input.moderatorId,
    },
  });

  return { ok: true };
}

/**
 * countOpenListingQuestionReports
 *
 * Counts unresolved Q&A reports for the ops hub.
 *
 * @returns Open report count.
 * @calledBy Review hub
 */
export async function countOpenListingQuestionReports() {
  return prisma.listingQuestionReport.count({
    where: { resolvedAt: null },
  });
}

/**
 * listOpenListingQuestionReports
 *
 * Lists unresolved Q&A reports for the moderation queue.
 *
 * @param take - Max rows; defaults to 80.
 * @returns Report rows with question/answer context.
 * @calledBy /revision/preguntas
 */
export async function listOpenListingQuestionReports(take = 80) {
  return prisma.listingQuestionReport.findMany({
    where: { resolvedAt: null },
    include: {
      reporter: { select: partySelect },
      question: {
        include: {
          asker: { select: partySelect },
          listing: { select: { id: true, title: true, slug: true } },
        },
      },
      answer: {
        include: {
          seller: { select: partySelect },
          question: {
            include: {
              asker: { select: partySelect },
              listing: { select: { id: true, title: true, slug: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take,
  });
}

/**
 * validateQaBody
 *
 * Trims, length-checks, and rejects off-platform contact fishing.
 *
 * @param body - Raw question or answer text.
 * @returns Trimmed body or Spanish error.
 * @calledBy ask/answer/edit mutations
 */
function validateQaBody(
  body: string,
): { ok: true; body: string } | { ok: false; error: string } {
  const trimmed = body.trim();
  if (trimmed.length < 1) {
    return { ok: false, error: "Escribe tu pregunta o respuesta." };
  }
  if (trimmed.length > LISTING_QA_BODY_MAX) {
    return {
      ok: false,
      error: `El texto es demasiado largo (máximo ${LISTING_QA_BODY_MAX} caracteres).`,
    };
  }
  if (containsOffPlatformContact(trimmed)) {
    return {
      ok: false,
      error:
        "No publiques teléfonos, WhatsApp ni otros contactos. Usa Compra Garantizada o Contactar vendedor.",
    };
  }
  return { ok: true, body: trimmed };
}

/**
 * assertAskRateLimits
 *
 * Enforces open-per-listing, daily, and hourly ask limits.
 *
 * @param askerId - Asker profile UUID.
 * @param listingId - Listing UUID.
 * @returns Ok or Spanish error.
 * @calledBy askListingQuestion
 */
async function assertAskRateLimits(
  askerId: string,
  listingId: string,
): Promise<ListingQaAccessResult> {
  const now = Date.now();
  const [openOnListing, askedToday, postsLastHour] = await Promise.all([
    prisma.listingQuestion.count({
      where: {
        listingId,
        askerId,
        hiddenAt: null,
        answer: { is: null },
      },
    }),
    prisma.listingQuestion.count({
      where: {
        askerId,
        createdAt: { gte: new Date(now - DAY_MS) },
      },
    }),
    countRecentPosts(askerId, now),
  ]);

  if (openOnListing >= LISTING_QA_MAX_OPEN_PER_LISTING) {
    return {
      ok: false,
      error: "Ya tienes suficientes preguntas abiertas en este anuncio.",
    };
  }
  if (askedToday >= LISTING_QA_MAX_QUESTIONS_PER_DAY) {
    return {
      ok: false,
      error: "Alcanzaste el límite de preguntas por hoy.",
    };
  }
  if (postsLastHour >= LISTING_QA_MAX_POSTS_PER_HOUR) {
    return {
      ok: false,
      error: "Espera un momento antes de publicar otra pregunta.",
    };
  }
  return { ok: true };
}

/**
 * assertPostRateLimit
 *
 * Enforces the hourly post cap for seller answers.
 *
 * @param profileId - Actor profile UUID.
 * @returns Ok or Spanish error.
 * @calledBy answerListingQuestion, editListingAnswer
 */
async function assertPostRateLimit(
  profileId: string,
): Promise<ListingQaAccessResult> {
  const postsLastHour = await countRecentPosts(profileId, Date.now());
  if (postsLastHour >= LISTING_QA_MAX_POSTS_PER_HOUR) {
    return {
      ok: false,
      error: "Espera un momento antes de publicar otra respuesta.",
    };
  }
  return { ok: true };
}

/**
 * countRecentPosts
 *
 * Counts questions and answers created by a profile in the last hour.
 *
 * @param profileId - Actor profile UUID.
 * @param now - Current epoch ms.
 * @returns Combined post count.
 * @calledBy assertAskRateLimits, assertPostRateLimit
 */
async function countRecentPosts(profileId: string, now: number) {
  const since = new Date(now - HOUR_MS);
  const [questions, answers] = await Promise.all([
    prisma.listingQuestion.count({
      where: { askerId: profileId, createdAt: { gte: since } },
    }),
    prisma.listingQuestionAnswer.count({
      where: { sellerId: profileId, createdAt: { gte: since } },
    }),
  ]);
  return questions + answers;
}

/**
 * loadQuestionForMutation
 *
 * Loads a question with listing and optional answer for write paths.
 *
 * @param questionId - Question UUID.
 * @returns Question row or null.
 * @calledBy answer, delete, hide helpers
 */
async function loadQuestionForMutation(questionId: string) {
  return prisma.listingQuestion.findFirst({
    where: { id: questionId },
    include: {
      answer: { select: { id: true } },
      listing: {
        select: {
          id: true,
          sellerId: true,
          status: true,
          slug: true,
          deletedAt: true,
          title: true,
        },
      },
    },
  });
}
