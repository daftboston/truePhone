/**
 * @file provider.ts
 * @description Types and shared helpers for payment checkout providers (Wompi / mock).
 * @dependencies node:crypto
 */

import { createHash, timingSafeEqual } from "node:crypto";

export type PaymentProviderId = "WOMPI" | "MOCK";

export type CreateCheckoutInput = {
  reference: string;
  amountPesos: number;
  currency: string;
  description: string;
  redirectUrl: string;
  customerEmail?: string | null;
};

export type CreateCheckoutResult = {
  checkoutUrl: string;
  providerCheckoutId: string;
  providerPaymentId?: string | null;
};

export type RefundInput = {
  providerPaymentId: string;
  amountPesos: number;
  reason?: string | null;
};

export type RefundResult =
  | {
      ok: true;
      refundedAmountPesos: number;
    }
  | {
      ok: false;
      error: string;
    };

export type PaymentProviderClient = {
  id: PaymentProviderId;
  createCheckout: (input: CreateCheckoutInput) => Promise<CreateCheckoutResult>;
  refund: (input: RefundInput) => Promise<RefundResult>;
};

/**
 * pesosToWompiCents
 *
 * Converts COP pesos to Wompi's cent unit (1 peso = 100).
 *
 * @param pesos - Integer COP amount.
 * @returns Amount in Wompi cents.
 * @calledBy Wompi checkout creation
 */
export function pesosToWompiCents(pesos: number) {
  return Math.round(pesos) * 100;
}

/**
 * wompiCentsToPesos
 *
 * Converts Wompi cents back to COP pesos.
 *
 * @param cents - Wompi amount in cents.
 * @returns Integer COP pesos.
 * @calledBy Webhook and payment status handlers
 */
export function wompiCentsToPesos(cents: number) {
  return Math.round(cents / 100);
}

/**
 * verifyWompiEventChecksum
 *
 * Verify a Wompi webhook checksum using signature.properties + timestamp + events secret.
 *
 * @param input.data - Event data object from the webhook payload.
 * @param input.properties - Property paths listed in the signature.
 * @param input.timestamp - Event timestamp from Wompi.
 * @param input.checksum - Hex checksum to verify.
 * @param input.eventsSecret - WOMPI_EVENTS_SECRET.
 * @returns True when checksum matches via timing-safe compare.
 * @calledBy Payment webhook route
 * @see https://docs.wompi.co/en/docs/colombia/eventos/
 */
export function verifyWompiEventChecksum(input: {
  data: Record<string, unknown>;
  properties: string[];
  timestamp: number | string;
  checksum: string;
  eventsSecret: string;
}): boolean {
  const { data, properties, timestamp, checksum, eventsSecret } = input;
  if (!checksum || !eventsSecret || properties.length === 0) {
    return false;
  }

  let concatenated = "";
  for (const property of properties) {
    const value = readNestedValue(data, property);
    if (value === undefined || value === null) {
      return false;
    }
    concatenated += String(value);
  }
  concatenated += String(timestamp);
  concatenated += eventsSecret;

  const expected = createHash("sha256").update(concatenated).digest("hex");
  return safeEqualHex(expected, checksum);
}

/**
 * readNestedValue
 *
 * Reads a dotted path from a nested object (Wompi signature.properties).
 *
 * @param root - Root data object.
 * @param path - Dot-separated property path.
 * @returns Nested value or undefined.
 */
function readNestedValue(root: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = root;
  for (const part of parts) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/**
 * safeEqualHex
 *
 * Timing-safe hex string equality (case-insensitive).
 *
 * @param a - Expected hex digest.
 * @param b - Provided checksum.
 * @returns True when equal length and content match.
 */
function safeEqualHex(a: string, b: string) {
  const left = a.toLowerCase();
  const right = b.toLowerCase();
  if (left.length !== right.length) return false;
  try {
    return timingSafeEqual(Buffer.from(left), Buffer.from(right));
  } catch {
    return false;
  }
}
