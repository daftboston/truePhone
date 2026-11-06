/** Pure, tested Bogotá pricing/time rules. No Google, DB, or browser dependencies. */
export const MAX_COP = 2_147_433_647; // PostgreSQL Int minus the upper range offset.
export const BUYBACK_CONDITIONS =
  "TruePhone compra tu iPhone. Oferta sujeta a verificación de identidad, IMEI, Bloqueo de activación y estado en la recogida. Si cambia el precio, debes aceptar una nueva oferta. El pago se realiza por Bre-B después de la verificación y aprobación. La recogida depende de disponibilidad y requiere confirmación.";
const OFFSET_MS = 5 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export function priceRange(purchasePriceCop: number) {
  if (
    !Number.isSafeInteger(purchasePriceCop) ||
    purchasePriceCop <= 100_000 ||
    purchasePriceCop > MAX_COP
  ) {
    throw new Error("INVALID_PRICE");
  }
  return {
    minCop: purchasePriceCop - 100_000,
    maxCop: purchasePriceCop + 50_000,
  };
}

// Bogotá is UTC−5 year-round. Use shifted UTC getters to avoid host timezones/DST.
function local(now: Date) {
  return new Date(now.getTime() - OFFSET_MS);
}
function isWeekday(d: Date) {
  return d.getUTCDay() > 0 && d.getUTCDay() < 6;
}
function startOfReview(d: Date) {
  const r = new Date(d);
  r.setUTCHours(9, 0, 0, 0);
  return r;
}
function nextReviewDay(d: Date) {
  const next = startOfReview(new Date(d.getTime() + DAY));
  while (!isWeekday(next)) next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

/** Next time a reviewer is on duty, or now during the working window. */
export function reviewOpening(now: Date): Date {
  let cursor = local(now);
  if (!isWeekday(cursor) || cursor.getUTCHours() >= 18)
    cursor = nextReviewDay(cursor);
  else if (cursor.getUTCHours() < 9) cursor = startOfReview(cursor);
  return new Date(cursor.getTime() + OFFSET_MS);
}

/** Two working hours; Friday 17:00 → Monday 10:00, not a weekend promise. */
export function reviewDeadline(now: Date): Date {
  let cursor = local(now);
  if (!isWeekday(cursor) || cursor.getUTCHours() >= 18)
    cursor = nextReviewDay(cursor);
  else if (cursor.getUTCHours() < 9) cursor = startOfReview(cursor);
  let remaining = 2 * HOUR;
  while (remaining > 0) {
    const end = new Date(cursor);
    end.setUTCHours(18, 0, 0, 0);
    const available = end.getTime() - cursor.getTime();
    if (remaining <= available)
      return new Date(cursor.getTime() + remaining + OFFSET_MS);
    remaining -= available;
    cursor = nextReviewDay(cursor);
  }
  throw new Error("UNREACHABLE");
}

/** Explicit 18:00 Bogotá expiry at end of next Mon–Fri review/business day. */
export function offerExpiry(now: Date): Date {
  const end = nextReviewDay(local(now));
  end.setUTCHours(18, 0, 0, 0);
  return new Date(end.getTime() + OFFSET_MS);
}

/** Earliest candidate, NOT a capacity reservation or pickup confirmation. */
export function earliestPickupDay(now: Date): string {
  let day = local(now);
  if (!isWeekday(day) || day.getUTCHours() >= 15) day = nextReviewDay(day);
  return day.toISOString().slice(0, 10);
}

export function mayReview(role: string) {
  return role === "ADMIN" || role === "REVIEWER";
}
export function mayReadQuote(
  actor: { id: string; role: string },
  sellerId: string,
) {
  return actor.id === sellerId || mayReview(actor.role);
}
export function acceptanceGuard(input: {
  status: string;
  currentOfferVersion: number;
  offeredVersion: number;
  expectedOfferVersion: number;
  expiresAt: Date;
  acceptedAt: Date | null;
  supersededAt: Date | null;
  now: Date;
}):
  | "OK"
  | "ALREADY_ACCEPTED"
  | "OFFER_CHANGED"
  | "OFFER_EXPIRED"
  | "INVALID_STATE" {
  if (
    input.supersededAt ||
    input.offeredVersion !== input.currentOfferVersion ||
    input.expectedOfferVersion !== input.currentOfferVersion
  )
    return "OFFER_CHANGED";
  if (input.acceptedAt && input.status === "OFFER_ACCEPTED")
    return "ALREADY_ACCEPTED";
  if (input.status !== "OFFER_SENT") return "INVALID_STATE";
  if (input.expiresAt <= input.now) return "OFFER_EXPIRED";
  return "OK";
}
