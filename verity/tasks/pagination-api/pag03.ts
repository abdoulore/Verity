/**
 * PAG-03 — totalPages is always the mathematical ceiling.
 *
 * Executable check: calls paginate with three different combinations and
 * verifies totalPages === Math.ceil(total / pageSize) in every case:
 *   a) total=0,  pageSize=10  → totalPages must be 0  (Math.ceil(0/10) = 0)
 *   b) total=10, pageSize=3   → totalPages must be 4  (Math.ceil(10/3) = 4)
 *   c) total=9,  pageSize=3   → totalPages must be 3  (Math.ceil(9/3) = 3, exact)
 *
 * Status derivation:
 *   All three assertions pass → VERIFIED
 *   Any assertion fails       → FAILED
 *   Import throws             → UNCERTAIN (module-level import prevents loading)
 */

import { paginate } from "../../../src/lib/paginate.js";
import { CriterionResult } from "../../types.js";

const IMPL_PATH = "src/lib/paginate.ts";

const AC_TEXT =
  "totalPages must equal Math.ceil(total / pageSize) for every combination of inputs, " +
  "including when total is 0 and when total is not evenly divisible by pageSize.";

export default function checkPAG03(): CriterionResult {
  const evidence: { description: string; filePath?: string; snippet?: string }[] = [];

  const cases: Array<{
    items: number[];
    page: number;
    pageSize: number;
    expectedTotalPages: number;
    label: string;
  }> = [
    {
      items: [],
      page: 1,
      pageSize: 10,
      expectedTotalPages: 0,
      label: "total=0, pageSize=10 → Math.ceil(0/10)=0",
    },
    {
      items: Array.from({ length: 10 }, (_, i) => i),
      page: 1,
      pageSize: 3,
      expectedTotalPages: 4,
      label: "total=10, pageSize=3 → Math.ceil(10/3)=4",
    },
    {
      items: Array.from({ length: 9 }, (_, i) => i),
      page: 1,
      pageSize: 3,
      expectedTotalPages: 3,
      label: "total=9, pageSize=3 → Math.ceil(9/3)=3 (exact)",
    },
  ];

  let allPass = true;
  for (const c of cases) {
    let res: ReturnType<typeof paginate> | null = null;
    let threw = false;
    try {
      res = paginate(c.items, c.page, c.pageSize);
    } catch { threw = true; }

    const pass = !threw && res !== null && res.totalPages === c.expectedTotalPages;
    if (!pass) allPass = false;

    evidence.push({
      description: `paginate: ${c.label}`,
      filePath: IMPL_PATH,
      snippet: threw
        ? "✗ function threw an error"
        : `totalPages = ${res!.totalPages}  ${pass ? "✓" : `✗ expected ${c.expectedTotalPages}`}`,
    });
  }

  return {
    id: "PAG-03",
    text: AC_TEXT,
    status: allPass ? "VERIFIED" : "FAILED",
    reason: allPass
      ? "totalPages equals Math.ceil(total / pageSize) for all three test cases."
      : "totalPages ceiling calculation failed for one or more inputs — see evidence.",
    evidence,
  };
}
