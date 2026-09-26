/**
 * PAG-01 — Page size is capped at 100 items.
 *
 * Executable check: calls paginate directly with three inputs:
 *   a) pageSize: 10   → data.length must be 10          (normal case)
 *   b) pageSize: 100  → data.length must be 100         (boundary: exactly 100 must NOT be capped)
 *   c) pageSize: 200  → data.length must be at most 100 (above limit: must be capped)
 *
 * Why ordinary tests miss the bug:
 *   Tests that only exercise pageSize < 100 or pageSize >> 100 never hit the
 *   exact boundary where the buggy `<` comparison misreads pageSize: 100.
 *
 * Status derivation:
 *   All three assertions pass  → VERIFIED
 *   Any assertion fails        → FAILED  (with concrete input/output evidence)
 *   Import throws              → UNCERTAIN (the module-level import will prevent loading)
 */

import { paginate } from "../../../src/lib/paginate.js";
import { CriterionResult } from "../../types.js";

const IMPL_PATH = "src/lib/paginate.ts";

const AC_TEXT =
  "pageSize must be silently clamped to at most 100 before slicing. " +
  "A caller supplying pageSize: 200 must receive at most 100 items in data. " +
  "The pageSize field in the result must reflect the original requested value.";

export default function checkPAG01(): CriterionResult {
  const evidence: { description: string; filePath?: string; snippet?: string }[] = [];

  // Build a 500-item test array.
  const items = Array.from({ length: 500 }, (_, i) => i);

  // Case a: pageSize 10 (normal — no cap expected)
  const resA = paginate(items, 1, 10);
  const caseAPass = resA.data.length === 10;
  evidence.push({
    description: "paginate(500 items, page=1, pageSize=10) → data.length must be 10",
    filePath: IMPL_PATH,
    snippet: `data.length = ${resA.data.length}  ${caseAPass ? "✓" : "✗ expected 10"}`,
  });

  // Case b: pageSize 100 (boundary — must NOT be capped below 100)
  const resB = paginate(items, 1, 100);
  const caseBPass = resB.data.length === 100;
  evidence.push({
    description: "paginate(500 items, page=1, pageSize=100) → data.length must be exactly 100 (boundary)",
    filePath: IMPL_PATH,
    snippet: `data.length = ${resB.data.length}  ${caseBPass ? "✓" : `✗ expected 100 — got ${resB.data.length} (off-by-one bug)`}`,
  });

  // Case c: pageSize 200 (above limit — must be capped at 100)
  const resC = paginate(items, 1, 200);
  const caseCPass = resC.data.length <= 100;
  evidence.push({
    description: "paginate(500 items, page=1, pageSize=200) → data.length must be ≤ 100 (cap enforced)",
    filePath: IMPL_PATH,
    snippet: `data.length = ${resC.data.length}  ${caseCPass ? "✓" : `✗ expected ≤ 100 — got ${resC.data.length}`}`,
  });

  const allPass = caseAPass && caseBPass && caseCPass;
  return {
    id: "PAG-01",
    text: AC_TEXT,
    status: allPass ? "VERIFIED" : "FAILED",
    reason: allPass
      ? "pageSize cap: normal (10), boundary (100), and above-limit (200) all produce correct data.length."
      : "pageSize cap check failed — see evidence for which case(s) produced wrong data.length.",
    evidence,
  };
}
