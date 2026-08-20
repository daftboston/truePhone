/**
 * @file index.ts
 * @description Public barrel for TruePhone Financial Core (holds, fees, ledger, payouts, refunds, chargebacks).
 * @dependencies financial-core modules; see docs/FINANCIAL_MODEL.md
 *
 * Marketplace / Shipping must not call Wompi payout or refund APIs directly.
 */

export {
  MARKETPLACE_FEE_RATE,
  MARKETPLACE_FEE_RATE_BPS,
  LOYALTY_FEE_RATE,
  LOYALTY_FEE_RATE_BPS,
  PREMIUM_SHIPPING_FEE_PESOS,
  computeFees,
  computeOrderFees,
  feePercentLabel,
  feeRateFromKind,
  feeRateBpsFromKind,
  buyerCancelRefundPesos,
  type FeeRateKind,
  type OrderFeeSnapshot,
} from "@/lib/financial-core/fees";

export { halfUpPesos } from "@/lib/financial-core/money";
export {
  appendLedgerEntry,
  listLedgerForOrder,
} from "@/lib/financial-core/ledger";
export { recordPaymentHold } from "@/lib/financial-core/hold";
export {
  resolveFeeKindForBuyer,
  findActiveFeeEntitlement,
  createLoyaltyEntitlementForSellerCancel,
  markFeeEntitlementUsed,
  reserveFeeEntitlement,
  releaseFeeEntitlementForOrder,
} from "@/lib/financial-core/entitlements";
export {
  authorizeCancelMoney,
  authorizeRefundAfterSellerAbandon,
} from "@/lib/financial-core/cancel";
export { buyerCanChooseRefundOrLoyalty } from "@/lib/financial-core/buyer-abandon-choice";
export { cancelOpenPayouts } from "@/lib/financial-core/open-payouts";
export {
  canCancelPaidOrder,
  manualPayoutCompletionBlocker,
  PAID_ORDER_CANCEL_BLOCKED_ERROR,
} from "@/lib/financial-core/settlement-guards";
export {
  onBuyerMarkedReceived,
  confirmOrderByBuyer,
  freezePayout,
  unfreezePayout,
  authorizeAndSubmitPayout,
  confirmManualPayoutCompleted,
  processExpiredBuyerConfirmations,
} from "@/lib/financial-core/settlement";
export {
  recordChargebackReceived,
  authorizeOpsRefund,
  resolveDisputeForSeller,
  markChargebackAbsorbed,
  type ChargebackSource,
  type OpsRefundReason,
  type OpsListingOutcome,
  type FinancialMoneyResult,
} from "@/lib/financial-core/chargebacks";
