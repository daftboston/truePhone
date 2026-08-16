/**
 * @file types.ts
 * @description Shared action state types for ops dispute / chargeback tooling.
 */

export type OpsDisputeActionState =
  { ok: true; message: string } | { ok: false; error: string } | null;
