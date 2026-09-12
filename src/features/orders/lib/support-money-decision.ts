/**
 * @file support-money-decision.ts
 * @description Detects order-support staff decisions that move money or freeze.
 * @dependencies none
 */

/**
 * isSupportMoneyDecision
 *
 * Returns whether a staff decision unfreezes, refunds, or accepts a paid cancel.
 *
 * @param decision - staffOrderSupportDecisionAction value.
 * @param caseType - Persisted support case type.
 * @returns True when the reviewer should confirm the money consequence.
 * @calledBy OrderSupportOpsPanel
 */
export function isSupportMoneyDecision(
  decision: string,
  caseType: string,
): boolean {
  if (decision === "APPROVE_CANCELLATION") return true;
  if (decision === "CONTINUE_FULFILLMENT") return true;
  return decision === "REJECT" && caseType === "FULFILLMENT_EXCEPTION";
}

/**
 * supportMoneyDecisionHint
 *
 * Spanish confirm copy for a money-moving support decision.
 *
 * @param decision - staffOrderSupportDecisionAction value.
 * @returns One-line consequence, or null when the decision is not monetary.
 * @calledBy OrderSupportOpsPanel
 */
export function supportMoneyDecisionHint(decision: string): string | null {
  if (decision === "APPROVE_CANCELLATION") {
    return "Esto archiva el anuncio y abre el remedio del comprador (8% o reembolso).";
  }
  if (decision === "CONTINUE_FULFILLMENT") {
    return "Esto descongela la liquidación y el pedido sigue.";
  }
  if (decision === "REJECT") {
    return "Esto rechaza la excepción y descongela la liquidación.";
  }
  return null;
}
