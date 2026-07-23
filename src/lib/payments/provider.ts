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

/** Wompi expects amounts in cents (1 COP peso = 100). */
export function pesosToWompiCents(pesos: number) {
  return Math.round(pesos) * 100;
}

export function wompiCentsToPesos(cents: number) {
  return Math.round(cents / 100);
}

/**
 * Verify a Wompi webhook checksum using signature.properties + timestamp + events secret.
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

function readNestedValue(root: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = root;
  for (const part of parts) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

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
