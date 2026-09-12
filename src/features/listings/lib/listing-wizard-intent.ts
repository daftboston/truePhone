/**
 * @file listing-wizard-intent.ts
 * @description Maps sell-wizard submit intent to the next redirect path.
 * @dependencies none
 */

export const LISTING_SAVE_EXIT_PATH = "/vender?borrador=ok";

export const LISTING_WIZARD_FORM_IDS = {
  device: "listing-device-form",
  security: "listing-security-form",
  possession: "listing-possession-form",
} as const;

/**
 * listingWizardNextPath
 *
 * Continuar stays on the next wizard step. Guardar y salir returns to the
 * seller hub after the same persist.
 *
 * @param intent - Form `intent` field (`save_exit` or continue).
 * @param continuePath - Path used when the seller continues the wizard.
 * @returns Redirect path.
 * @calledBy listing create/update server actions
 *
 * @example
 * listingWizardNextPath("save_exit", "/vender/abc/fotos"); // "/vender?borrador=ok"
 */
export function listingWizardNextPath(
  intent: FormDataEntryValue | null,
  continuePath: string,
) {
  return intent === "save_exit" ? LISTING_SAVE_EXIT_PATH : continuePath;
}
