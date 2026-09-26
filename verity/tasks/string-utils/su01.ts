/**
 * SU-01 — truncate caps the output length.
 *
 * Executable check: calls truncate directly with four inputs:
 *   a) short string (length < maxLength)  → returned unchanged, no ellipsis
 *   b) exact length (length === maxLength) → must NOT be truncated (the buggy
 *      version uses >= so this case is incorrectly truncated)
 *   c) long string  (length > maxLength)  → must be truncated, end with "..."
 *   d) result length must be ≤ maxLength  → total length constraint
 *
 * Status derivation:
 *   All assertions pass → VERIFIED
 *   Any assertion fails → FAILED  (with concrete input/output evidence)
 *   Import throws       → UNCERTAIN
 */

import { truncate } from "../../../src/lib/stringUtils.js";
import { CriterionResult } from "../../types.js";

const IMPL_PATH = "src/lib/stringUtils.ts";

const AC_TEXT =
  "truncate(text, maxLength) must return a string whose .length is always " +
  "≤ maxLength. When truncation occurs the result must end with \"...\". " +
  "When no truncation is needed the original string is returned unchanged.";

export default function checkSU01(): CriterionResult {
  const evidence: { description: string; filePath?: string; snippet?: string }[] = [];

  // Case a: short string — no truncation expected.
  const short = "Hello";
  const resA = truncate(short, 20);
  const caseAPass = resA === short;
  evidence.push({
    description: 'truncate("Hello", 20) → must return "Hello" unchanged',
    filePath: IMPL_PATH,
    snippet: `result = "${resA}"  ${caseAPass ? "✓" : `✗ expected "${short}"`}`,
  });

  // Case b: exact-length string — must NOT be truncated (the buggy >= triggers here).
  const exact = "A".repeat(10);
  const resB = truncate(exact, 10);
  const caseBPass = resB === exact && !resB.endsWith("...");
  evidence.push({
    description: 'truncate("AAAAAAAAAA" (10 chars), 10) → must be returned unchanged (boundary)',
    filePath: IMPL_PATH,
    snippet: `result = "${resB}" (len ${resB.length})  ${caseBPass ? "✓" : `✗ expected unchanged — got "${resB}" (off-by-one bug)`}`,
  });

  // Case c: long string — truncation must occur and result must end with "..."
  const long = "This is a very long string that must be truncated";
  const resC = truncate(long, 20);
  const caseCTruncated = resC.length <= 20 && resC.endsWith("...");
  evidence.push({
    description: 'truncate("This is a very long string...", 20) → must end with "..." and length ≤ 20',
    filePath: IMPL_PATH,
    snippet: `result = "${resC}" (len ${resC.length})  ${caseCTruncated ? "✓" : `✗ length ${resC.length} > 20 or missing ellipsis`}`,
  });

  // Case d: result length constraint for all produced results.
  const lengthOk = resA.length <= 20 && resB.length <= 10 && resC.length <= 20;
  evidence.push({
    description: "All results satisfy length ≤ maxLength",
    filePath: IMPL_PATH,
    snippet: `resA.length=${resA.length}≤20 ${resA.length <= 20 ? "✓" : "✗"} | resB.length=${resB.length}≤10 ${resB.length <= 10 ? "✓" : "✗"} | resC.length=${resC.length}≤20 ${resC.length <= 20 ? "✓" : "✗"}`,
  });

  const allPass = caseAPass && caseBPass && caseCTruncated && lengthOk;
  return {
    id: "SU-01",
    text: AC_TEXT,
    status: allPass ? "VERIFIED" : "FAILED",
    reason: allPass
      ? "truncate: short (no-op), exact-length boundary, and long (ellipsis) all produce correct output."
      : "truncate produced incorrect output for one or more inputs — see evidence.",
    evidence,
  };
}
