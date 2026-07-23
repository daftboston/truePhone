import {
  pesosToWompiCents,
  type CreateCheckoutInput,
  type CreateCheckoutResult,
  type PaymentProviderClient,
  type RefundInput,
  type RefundResult,
} from "@/lib/payments/provider";

type WompiEnv = {
  publicKey: string;
  privateKey: string;
  eventsSecret: string;
  apiBaseUrl: string;
  checkoutBaseUrl: string;
};

export function getWompiEnv(): WompiEnv | null {
  const publicKey = process.env.WOMPI_PUBLIC_KEY?.trim();
  const privateKey = process.env.WOMPI_PRIVATE_KEY?.trim();
  const eventsSecret = process.env.WOMPI_EVENTS_SECRET?.trim();
  if (!publicKey || !privateKey || !eventsSecret) {
    return null;
  }

  const isProd = publicKey.startsWith("pub_prod_");
  return {
    publicKey,
    privateKey,
    eventsSecret,
    apiBaseUrl:
      process.env.WOMPI_API_BASE_URL?.trim() ||
      (isProd
        ? "https://production.wompi.co/v1"
        : "https://sandbox.wompi.co/v1"),
    checkoutBaseUrl:
      process.env.WOMPI_CHECKOUT_BASE_URL?.trim() ||
      "https://checkout.wompi.co/l",
  };
}

export function createWompiProvider(env: WompiEnv): PaymentProviderClient {
  return {
    id: "WOMPI",

    async createCheckout(
      input: CreateCheckoutInput,
    ): Promise<CreateCheckoutResult> {
      const amountInCents = pesosToWompiCents(input.amountPesos);
      const body = {
        name: truncate(input.description, 80) || "TruePhone Compra Garantizada",
        description: truncate(
          `TruePhone · ${input.reference} · incluye protección 6%`,
          200,
        ),
        single_use: true,
        collect_shipping: false,
        currency: input.currency === "COP" ? "COP" : "COP",
        amount_in_cents: amountInCents,
        redirect_url: input.redirectUrl,
        sku: truncate(input.reference, 36),
      };

      const response = await fetch(`${env.apiBaseUrl}/payment_links`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.privateKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const json = (await response.json().catch(() => null)) as {
        data?: { id?: string };
        error?: { reason?: string; messages?: string[] };
      } | null;

      if (!response.ok || !json?.data?.id) {
        const reason =
          json?.error?.reason ||
          json?.error?.messages?.join(", ") ||
          `Wompi respondió ${response.status}`;
        throw new Error(`No se pudo crear el checkout: ${reason}`);
      }

      const providerCheckoutId = json.data.id;
      return {
        providerCheckoutId,
        checkoutUrl: `${env.checkoutBaseUrl}/${providerCheckoutId}`,
      };
    },

    async refund(input: RefundInput): Promise<RefundResult> {
      // Same-day voids are preferred; fall back to marking refunded server-side
      // if the provider rejects (e.g. already settled). Full escrow payouts are future.
      const response = await fetch(
        `${env.apiBaseUrl}/transactions/${encodeURIComponent(input.providerPaymentId)}/void`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.privateKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        },
      );

      if (response.ok) {
        return { ok: true, refundedAmountPesos: input.amountPesos };
      }

      const json = (await response.json().catch(() => null)) as {
        error?: { reason?: string };
      } | null;
      return {
        ok: false,
        error:
          json?.error?.reason ||
          `Wompi no pudo anular el pago (${response.status}).`,
      };
    },
  };
}

function truncate(value: string, max: number) {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max);
}
