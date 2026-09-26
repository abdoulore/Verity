/**
 * String utility helpers.
 *
 * This module is the Verity fixture for the string-utils task.
 * It demonstrates the FAILED → VERIFIED cycle:
 *   - Before fix: truncate used `>=` and incorrectly truncated strings
 *     whose length was exactly maxLength (off-by-one boundary bug).
 *   - After fix:  truncate uses `>` and the boundary case is handled correctly.
 */

/**
 * Returns `text` truncated to at most `maxLength` characters.
 * When truncation occurs the result ends with "..." and the total
 * length equals exactly `maxLength`.
 * When no truncation is needed the original string is returned unchanged.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length > maxLength) {
    return text.slice(0, maxLength - 3) + "...";
  }
  return text;
}

/**
 * Converts a human-readable title into a URL-safe slug.
 * - Lowercase
 * - Runs of non-alphanumeric characters → single hyphen
 * - No leading/trailing hyphens
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
