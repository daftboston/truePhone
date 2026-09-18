/**
 * @file index.ts
 * @description Client-safe availability-hold exports (copy, constants). Server-only
 *   service helpers live in ./service.ts — import that path from Server Components,
 *   Server Actions, and Route Handlers, not from this barrel.
 */

export {
  ACTIVE_UNLOCK_BLOCK_MESSAGE,
  BUYER_HOLD_DENIED_BODY,
  BUYER_HOLD_EXPIRED_BODY,
  BUYER_HOLD_PENDING_INTRO,
  BUYER_HOLD_PENDING_PLAZO_LABEL,
  SELLER_ALSO_LISTED_PAUSE_REMINDER,
} from "./copy";

export {
  AVAILABILITY_HOLD_PENDING_MS,
  AVAILABILITY_HOLD_UNLOCK_MS,
} from "./constants";
