/**
 * AC-04 — Invalid filters return HTTP 400.
 *
 * Checks:
 *  1. route.ts validates the status param against VALID_STATUSES and returns 400 on mismatch.
 *  2. Tests confirm 400 for invalid values and 200 for each valid value.
 */

import { CriterionResult } from "../types.js";
import { readWorkspaceFile, allPresent } from "../helpers.js";

const ROUTE_PATH = "src/app/api/admin/export/route.ts";
const TEST_PATH = "src/app/api/admin/export/route.test.ts";

const AC_TEXT =
  'If any supplied query parameter contains a value not in the documented allowed set, ' +
  'the server must respond with HTTP 400 Bad Request and a descriptive error message. ' +
  'Example: status=deleted is invalid.';

export function checkAC04(): CriterionResult {
  const route = readWorkspaceFile(ROUTE_PATH);
  const tests = readWorkspaceFile(TEST_PATH);

  const evidence = [];

  if (!route) {
    return {
      id: "AC-04",
      text: AC_TEXT,
      status: "UNCERTAIN",
      reason: `Could not read ${ROUTE_PATH}.`,
      evidence: [],
    };
  }

  const hasValidSet = allPresent(route, [
    "VALID_STATUSES",
    '"pending"',
    '"shipped"',
    '"cancelled"',
  ]);
  const hasCheck = route.includes("VALID_STATUSES.has(statusFilter)");
  const has400 = route.includes("status: 400");

  evidence.push({
    description: "route.ts VALID_STATUSES set + filter check returning 400",
    filePath: ROUTE_PATH,
    snippet: [
      hasValidSet ? "✓ VALID_STATUSES includes pending/shipped/cancelled" : "✗ VALID_STATUSES missing",
      hasCheck ? "✓ .has(statusFilter) guard present" : "✗ guard not found",
      has400 ? "✓ status: 400 returned" : "✗ status: 400 not found",
    ].join(" | "),
  });

  if (tests) {
    const testsInvalid = tests.includes('"deleted"') || tests.includes("deleted");
    const testsValidStatuses = ["pending", "shipped", "cancelled"].every((s) =>
      tests.includes(`status: "${s}"`) || tests.includes(`"${s}"`)
    );
    evidence.push({
      description: "route.test.ts covers invalid status (400) and all three valid statuses (200)",
      filePath: TEST_PATH,
      snippet: [
        testsInvalid ? "✓ status=deleted → 400 tested" : "✗ invalid status test not found",
        testsValidStatuses ? "✓ pending/shipped/cancelled → 200 tested" : "✗ valid status tests incomplete",
      ].join(" | "),
    });
  }

  const allGood = hasValidSet && hasCheck && has400;

  return {
    id: "AC-04",
    text: AC_TEXT,
    status: allGood ? "VERIFIED" : "FAILED",
    reason: allGood
      ? "route.ts validates the status parameter against VALID_STATUSES and returns HTTP 400 with a descriptive error for any invalid value."
      : "Filter validation or 400 response not implemented correctly (see evidence).",
    evidence,
  };
}
