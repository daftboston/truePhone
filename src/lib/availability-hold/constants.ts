/**
 * @file constants.ts
 * @description Timing constants for multi-platform availability holds (F3).
 */

/** Seller must respond within 2 hours. */
export const AVAILABILITY_HOLD_PENDING_MS = 2 * 60 * 60 * 1000;

/** Buyer checkout window after seller confirms. */
export const AVAILABILITY_HOLD_UNLOCK_MS = 30 * 60 * 1000;
