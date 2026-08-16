/**
 * @file utils.ts
 * @description Shared CSS class-name helpers and the desktop shell width cap.
 * @dependencies clsx, tailwind-merge
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Desktop content cap (~1440px). Shared by AppShell, AppHeader, and SiteFooter
 * so marketplace pages fill a laptop screen without stretching on ultrawide.
 */
export const SHELL_WIDTH_CLASS = "max-w-[90rem]";

/**
 * cn
 *
 * Merges conditional class names and resolves Tailwind conflicts.
 *
 * @param inputs - Class values accepted by clsx (strings, arrays, objects).
 * @returns A single space-separated class string after twMerge.
 * @calledBy UI components across the app
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
