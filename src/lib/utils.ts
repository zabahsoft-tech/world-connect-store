import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Coerce a product's `images` jsonb column into a typed string array.
 */
export function productImages(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  return images.filter((s): s is string => typeof s === "string" && s.length > 0);
}

/**
 * Main image of a product (first in the gallery), or null when empty.
 */
export function mainImage(images: unknown): string | null {
  const arr = productImages(images);
  return arr[0] ?? null;
}
