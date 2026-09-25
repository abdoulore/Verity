/**
 * Verity helpers — thin filesystem / text utilities.
 */

import fs from "fs";
import path from "path";

/** Read a file relative to the workspace root (process.cwd()). */
export function readWorkspaceFile(relPath: string): string | null {
  try {
    return fs.readFileSync(path.resolve(process.cwd(), relPath), "utf8");
  } catch {
    return null;
  }
}

/** Check whether a file exists at the given workspace-relative path. */
export function fileExists(relPath: string): boolean {
  return fs.existsSync(path.resolve(process.cwd(), relPath));
}

/** Return true if `src` contains every pattern in `patterns`. */
export function allPresent(src: string, patterns: (string | RegExp)[]): boolean {
  return patterns.every((p) =>
    typeof p === "string" ? src.includes(p) : p.test(src)
  );
}

/** Return true if `src` contains at least one of the patterns. */
export function anyPresent(src: string, patterns: (string | RegExp)[]): boolean {
  return patterns.some((p) =>
    typeof p === "string" ? src.includes(p) : p.test(src)
  );
}
