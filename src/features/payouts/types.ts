/**
 * @file types.ts
 * @description Action state types for seller payout destination forms.
 * @dependencies none
 */

export type PayoutActionState =
  | {
      ok: true;
      message?: string;
    }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
    }
  | null;

/**
 * fieldErrorsFromZod
 *
 * Flattens Zod issues into a field-name → messages map for form UI.
 *
 * @param error - Zod validation error from safeParse.
 * @returns Record of field keys to error message arrays.
 * @calledBy upsertSellerBankAccountAction
 */
export function fieldErrorsFromZod(
  error: import("zod").ZodError,
): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key !== "string") continue;
    fieldErrors[key] ??= [];
    fieldErrors[key].push(issue.message);
  }
  return fieldErrors;
}
