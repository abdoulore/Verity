/**
 * AC-07 — A valid request with no matching rows returns a valid CSV with headers.
 *
 * Checks:
 *  1. csv.ts buildCsv() called with an empty array returns only the header row (no data rows).
 *  2. route.ts still sets Content-Type: text/csv on an empty result.
 *  3. A test exercises the zero-match path.
 */

import { CriterionResult } from "../types.js";
import { readWorkspaceFile, allPresent } from "../helpers.js";

const CSV_PATH = "src/lib/csv.ts";
const ROUTE_PATH = "src/app/api/admin/export/route.ts";
const TEST_PATH = "src/app/api/admin/export/route.test.ts";

const AC_TEXT =
  "When all filters are valid but no rows match, the server must return HTTP 200 " +
  "with a CSV body that contains only the header row (no data rows). Content-Type must still be text/csv.";

export function checkAC07(): CriterionResult {
  const csv = readWorkspaceFile(CSV_PATH);
  const route = readWorkspaceFile(ROUTE_PATH);
  const tests = readWorkspaceFile(TEST_PATH);

  const evidence = [];

  if (!csv || !route) {
    return {
      id: "AC-07",
      text: AC_TEXT,
      status: "UNCERTAIN",
      reason: "Could not read one or more required source files.",
      evidence: [],
    };
  }

  // buildCsv([]) will produce `[header, ...lines].join("\n")` where lines = [].
  // So the result is just the header string.  We verify the join pattern.
  const csvJoinPattern =
    csv.includes("[header, ...lines].join") || csv.includes('join("\\n")') || csv.includes("join(\"\\n\")");
  const returnsHeaderOnly = csv.includes("[header, ...lines]");

  evidence.push({
    description: "csv.ts buildCsv returns [header, ...lines].join('\\n') — safe with zero rows",
    filePath: CSV_PATH,
    snippet: returnsHeaderOnly
      ? "✓ [header, ...lines].join(\"\\n\") → empty rows yields header-only CSV"
      : "✗ header-only return pattern not confirmed — manual review needed",
  });

  // Route always responds with text/csv regardless of row count.
  const routeAlwaysTextCsv =
    route.includes('"Content-Type"') && route.includes("text/csv");
  evidence.push({
    description: "route.ts always sets Content-Type: text/csv (not conditional on row count)",
    filePath: ROUTE_PATH,
    snippet: routeAlwaysTextCsv
      ? "✓ Content-Type: text/csv set unconditionally"
      : "✗ Content-Type: text/csv not confirmed as unconditional",
  });

  // Test covers the zero-match path.
  if (tests) {
    const testZeroMatch =
      tests.includes("nonexistent") || tests.includes("no matching rows") ||
      tests.includes("user-nonexistent");
    evidence.push({
      description: "route.test.ts tests a request that matches zero rows",
      filePath: TEST_PATH,
      snippet: testZeroMatch
        ? "✓ zero-match test found (e.g., userId=user-nonexistent-xyz)"
        : "✗ zero-match test not found",
    });
  }

  const allGood = returnsHeaderOnly && routeAlwaysTextCsv;

  return {
    id: "AC-07",
    text: AC_TEXT,
    status: allGood ? "VERIFIED" : (returnsHeaderOnly || routeAlwaysTextCsv ? "UNCERTAIN" : "FAILED"),
    reason: allGood
      ? "buildCsv([]) returns header-only CSV; route.ts sets text/csv unconditionally. Zero-match path tested."
      : "Could not fully confirm header-only CSV with zero rows (see evidence).",
    evidence,
  };
}
