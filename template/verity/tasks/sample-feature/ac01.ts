/**
 * AC-01 — Sample executable check.
 *
 * Replace the body with real assertions against your implementation.
 *
 * Rules:
 *   - Import and call the real function; do not return VERIFIED because a
 *     file exists or a test name mentions the criterion.
 *   - A check that cannot reach a verdict should return UNCERTAIN. Wrap
 *     calls that may throw in try/catch — an uncaught throw (or a failed
 *     import) aborts the whole run with exit code 3.
 *   - Import types with `import type` (required under verbatimModuleSyntax).
 *   - Return FAILED with concrete evidence when an assertion fails.
 *   - Name files ac01.ts, ac02.ts, … — they load in alphabetical order.
 *
 * This file exports a default function with no parameters that returns
 * CriterionResult. That is the only contract Verity requires.
 */

import type { CriterionResult } from "../../types.js";
// Replace the line below with your real import, e.g.:
//   import { myFunction } from "../../../src/lib/myModule.js";

const IMPL_PATH = "src/lib/myModule.ts"; // update to your actual file

export default function checkAC01(): CriterionResult {
  // ── Run real code ────────────────────────────────────────────────────────
  //
  // Example: call your function with boundary inputs and assert the output.
  //
  //   const result = myFunction("boundary input");
  //   const pass   = result === "expected output";
  //
  // For this sample we synthesise a trivial assertion so the template itself
  // can be run without any src/ implementation.
  const input = "hello";
  const result = input.toUpperCase();
  const expected = "HELLO";
  const pass = result === expected;
  // ── End of sample assertion ──────────────────────────────────────────────

  return {
    id: "AC-01",
    text: "Brief label for the first requirement (copy from your spec).",
    status: pass ? "VERIFIED" : "FAILED",
    reason: pass
      ? "The function returned the expected output for the boundary input."
      : `The function returned "${result}" — expected "${expected}".`,
    evidence: [
      {
        description: `myFunction("${input}") → expected "${expected}"`,
        filePath: IMPL_PATH,
        snippet: `result = "${result}"  ${pass ? "✓" : "✗"}`,
      },
    ],
  };
}
