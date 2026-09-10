import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines conditional class names and resolves conflicting Tailwind CSS utility classes.
 *
 * @param {...ClassValue[]} inputs - Dynamic list of class expressions, strings, or records.
 * @returns {string} Deduplicated and merged CSS class string.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
