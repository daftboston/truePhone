/**
 * @file copy.ts
 * @description Lawyer-approved Spanish copy for availability-hold UI (F3).
 */

/** Buyer PENDING wait body (Lawyer #3). */
export const BUYER_HOLD_PENDING_INTRO =
  "Este iPhone también puede estar publicado en otros sitios. Antes de cobrarte, le pedimos al vendedor que confirme que sigue disponible. No se realiza ningún cobro hasta que confirme.";

export const BUYER_HOLD_PENDING_PLAZO_LABEL = "Plazo:";

/** Buyer DENIED terminal state (Lawyer #5 — seller said no). */
export const BUYER_HOLD_DENIED_BODY =
  "El vendedor indicó que este iPhone ya no está disponible. No se realizó ningún cobro. Puedes seguir buscando otros anuncios.";

/** Buyer EXPIRED terminal state (Lawyer #5 — seller timeout). */
export const BUYER_HOLD_EXPIRED_BODY =
  "El vendedor no confirmó a tiempo. No se realizó ningún cobro. Puedes seguir buscando otros anuncios o intentar de nuevo más tarde.";

/** Seller pause reminder on hold response page (Lawyer #4). */
export const SELLER_ALSO_LISTED_PAUSE_REMINDER =
  "Si vendes este iPhone en otra plataforma, retira o pausa tu anuncio en TruePhone de inmediato para evitar que se venda dos veces.";
