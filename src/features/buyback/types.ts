import type { z } from "zod";
import type {
  draftSchema,
  quoteVersionSchema,
  offerSchema,
  acceptSchema,
} from "./schemas";
export type BuybackDraftInput = z.infer<typeof draftSchema>;
export type BuybackQuoteVersionInput = z.infer<typeof quoteVersionSchema>;
export type BuybackOfferInput = z.infer<typeof offerSchema>;
export type BuybackAcceptInput = z.infer<typeof acceptSchema>;
export type BuybackPhotoUrlView = {
  slot: number;
  url: string;
  expiresInSeconds: number;
};
export type BuybackSyncResult = {
  imported: number;
  issues: number;
  skipped: boolean;
};

/** Seller-safe contracts. No purchase-price snapshots, import rows, or storage paths. */
export type BuybackErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_AVAILABLE"
  | "INVALID_INPUT"
  | "NOT_FOUND"
  | "INVALID_STATE"
  | "QUOTE_CHANGED"
  | "OFFER_CHANGED"
  | "OFFER_EXPIRED"
  | "UPLOAD_FAILED"
  | "SYNC_FAILED";

export type BuybackResult<T> =
  { ok: true; data: T } | { ok: false; code: BuybackErrorCode; error: string };

export type BuybackOfferView = {
  id: string;
  version: number;
  amountCop: number;
  conditions: string;
  expiresAt: string;
  acceptedAt: string | null;
  expired: boolean;
};
export type BuybackQuoteView = {
  id: string;
  version: number;
  status:
    | "DRAFT"
    | "RANGE_READY"
    | "REVIEW_REQUESTED"
    | "OFFER_SENT"
    | "OFFER_ACCEPTED"
    | "PURCHASED"
    | "CANCELLED";
  iphoneModelId: string;
  iphoneStorageId: string;
  condition: string;
  batteryHealth: number;
  description: string;
  city: string;
  range: { minCop: number; maxCop: number } | null;
  manualReview: boolean;
  reviewDueAt: string | null;
  reviewStartsAt: string;
  photoSlots: number[];
  offer: BuybackOfferView | null;
  // Acceptance is NOT pickup confirmation or payment. Payments & Trust schedules capacity.
  pickupStatus: "NOT_REQUESTED" | "PENDING_SCHEDULING" | "COMPLETED";
};
