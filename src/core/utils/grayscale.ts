/**
 * Convert a grayscale lightness value (0–100) to a hex color string.
 *
 * 0 = pure black (#000000), 100 = pure white (#ffffff).
 * Values outside the range are clamped.
 *
 * @param lightness Grayscale lightness percent
 * @returns Hex color string like '#1a1a1a'
 */
export function lightnessToHex(lightness: number): string {
  const clamped = Math.max(0, Math.min(100, lightness));
  const v = Math.round((clamped / 100) * 255);
  const hex = v.toString(16).padStart(2, '0');
  return `#${hex}${hex}${hex}`;
}

/** Minimum lightness for the dark-square slider (pure black). */
export const DARK_SQUARE_MIN_LIGHTNESS = 0;
/** Maximum lightness for the dark-square slider (medium gray). */
export const DARK_SQUARE_MAX_LIGHTNESS = 50;
/** Default lightness — matches the historical '#0d0d0d' color. */
export const DARK_SQUARE_DEFAULT_LIGHTNESS = 5;
