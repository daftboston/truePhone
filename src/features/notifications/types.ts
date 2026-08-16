/**
 * @file types.ts
 * @description Shared action state types for notification server actions.
 */

export type NotificationActionState =
  { ok: true; message?: string } | { ok: false; error: string } | null;
