/**
 * @file utils.ts
 * @description Shared CSS class-name helpers for Tailwind components.
 * @dependencies clsx, tailwind-merge
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
