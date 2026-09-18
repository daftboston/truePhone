/**
 * @file boost.ts
 * @description Silent Destacados boost on qualifying price drops (F2).
 */

/** Minimum absolute drop in COP to qualify for boost. */
export const BOOST_MIN_DROP_COP = 50_000;

/** Minimum relative drop (3%). */
export const BOOST_MIN_DROP_RATIO = 0.03;

/** Boost duration in days. */
export const BOOST_DURATION_DAYS = 7;

/**
 * qualifiesForPriceDropBoost
 *
 * Returns true when the new price drops enough vs baseline.
 */
export function qualifiesForPriceDropBoost(
  baselinePrice: number,
  newPrice: number,
): boolean {
  if (newPrice >= baselinePrice) return false;
  const drop = baselinePrice - newPrice;
  const ratio = drop / baselinePrice;
  return drop >= BOOST_MIN_DROP_COP || ratio >= BOOST_MIN_DROP_RATIO;
}

/**
 * boostUntilFromNow
 *
 * Computes boost end timestamp from current time.
 */
export function boostUntilFromNow(now = new Date()): Date {
  return new Date(now.getTime() + BOOST_DURATION_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * buildPriceDropBoostUpdate
 *
 * Returns Prisma listing update fields when a published price drop qualifies.
 * Ignores re-drop during an active boost window.
 */
export function buildPriceDropBoostUpdate(input: {
  currentPrice: number;
  newPrice: number;
  priceAtPublish: number | null;
  boostUntil: Date | null;
  now?: Date;
}): { price: number; priceAtPublish?: number; boostUntil?: Date } | null {
  const now = input.now ?? new Date();
  if (input.boostUntil && input.boostUntil > now) {
    return { price: input.newPrice };
  }

  const baseline = input.priceAtPublish ?? input.currentPrice;
  if (!qualifiesForPriceDropBoost(baseline, input.newPrice)) {
    return { price: input.newPrice };
  }

  return {
    price: input.newPrice,
    priceAtPublish: input.newPrice,
    boostUntil: boostUntilFromNow(now),
  };
}
