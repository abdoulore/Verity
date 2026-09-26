/**
 * PAG-02 — Requesting a page beyond the last page returns an empty data array.
 *
 * Executable check: calls paginate with two over-range inputs:
 *   a) 10 items, pageSize 10, page 2  → data must be [] (nothing on page 2)
 *   b) 0  items, pageSize 10, page 1  → data must be [] (empty collection)
 *
 * Also verifies total and totalPages are correct and that no exception is thrown.
 *
 * Status derivation:
 *   Both assertions pass → VERIFIED
 *   Any assertion fails  → FAILED
 *   Import throws        → UNCERTAIN (module-level import prevents loading)
 */

import { paginate } from "../../../src/lib/paginate.js";
import { CriterionResult } from "../../types.js";

const IMPL_PATH = "src/lib/paginate.ts";

const AC_TEXT =
  "When page * pageSize > total, the function must return an empty data array " +
  "and correct total / totalPages values. The function must not throw.";

export default function checkPAG02(): CriterionResult {
  const evidence: { description: string; filePath?: string; snippet?: string }[] = [];

  // Case a: page beyond last page
  let resA: ReturnType<typeof paginate> | null = null;
  let threwA = false;
  try {
    resA = paginate(Array.from({ length: 10 }, (_, i) => i), 2, 10);
  } catch { threwA = true; }

  const caseAEmptyData = !threwA && resA !== null && resA.data.length === 0;
  const caseATotalOk = !threwA && resA !== null && resA.total === 10 && resA.totalPages === 1;
  evidence.push({
    description: "paginate(10 items, page=2, pageSize=10) — beyond last page → data must be []",
    filePath: IMPL_PATH,
    snippet: threwA
      ? "✗ function threw an error"
      : `data.length = ${resA!.data.length}  ${caseAEmptyData ? "✓" : "✗ expected 0"} | ` +
        `total = ${resA!.total} ${caseATotalOk ? "✓" : "✗"} | totalPages = ${resA!.totalPages} ${caseATotalOk ? "✓" : "✗"}`,
  });

  // Case b: empty collection
  let resB: ReturnType<typeof paginate> | null = null;
  let threwB = false;
  try {
    resB = paginate([], 1, 10);
  } catch { threwB = true; }

  const caseBEmptyData = !threwB && resB !== null && resB.data.length === 0;
  const caseBTotalOk = !threwB && resB !== null && resB.total === 0;
  evidence.push({
    description: "paginate([] empty, page=1, pageSize=10) → data must be [], total must be 0",
    filePath: IMPL_PATH,
    snippet: threwB
      ? "✗ function threw an error"
      : `data.length = ${resB!.data.length}  ${caseBEmptyData ? "✓" : "✗ expected 0"} | ` +
        `total = ${resB!.total}  ${caseBTotalOk ? "✓" : "✗ expected 0"}`,
  });

  const allPass = caseAEmptyData && caseATotalOk && caseBEmptyData && caseBTotalOk;
  return {
    id: "PAG-02",
    text: AC_TEXT,
    status: allPass ? "VERIFIED" : "FAILED",
    reason: allPass
      ? "Out-of-range page and empty collection both return empty data without throwing."
      : "One or more over-range assertions failed — see evidence.",
    evidence,
  };
}
