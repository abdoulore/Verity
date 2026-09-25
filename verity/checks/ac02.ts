/**
 * AC-02 — The response is a downloadable CSV with the documented columns.
 *
 * Checks:
 *  1. route.ts returns HTTP 200 with Content-Type: text/csv and Content-Disposition: attachment.
 *  2. csv.ts defines all eight required column headers in the correct order.
 *  3. Tests verify Content-Type, Content-Disposition, and column headers.
 */

import { CriterionResult } from "../types.js";
import { readWorkspaceFile, allPresent } from "../helpers.js";

const ROUTE_PATH = "src/app/api/admin/export/route.ts";
const CSV_PATH = "src/lib/csv.ts";
const TEST_PATH = "src/app/api/admin/export/route.test.ts";

const REQUIRED_COLUMNS = [
  "id",
  "userId",
  "product",
  "quantity",
  "unitPriceCents",
  "status",
  "createdAt",
  "exportedAt",
];

const AC_TEXT =
  "A successful response must: return HTTP 200, set Content-Type: text/csv, " +
  "set Content-Disposition: attachment, and include a header row with all documented columns.";

export function checkAC02(): CriterionResult {
  const route = readWorkspaceFile(ROUTE_PATH);
  const csv = readWorkspaceFile(CSV_PATH);
  const tests = readWorkspaceFile(TEST_PATH);

  const evidence = [];

  // Check route sets correct headers.
  if (route) {
    const hasContentType = route.includes('"Content-Type"') && route.includes("text/csv");
    const hasDisposition = route.includes('"Content-Disposition"') && route.includes("attachment");
    const has200 = route.includes("status: 200") || route.includes("new NextResponse");
    evidence.push({
      description: "route.ts sets Content-Type: text/csv, Content-Disposition: attachment, status 200",
      filePath: ROUTE_PATH,
      snippet: [
        has200 ? "✓ HTTP 200" : "✗ HTTP 200",
        hasContentType ? "✓ Content-Type: text/csv" : "✗ Content-Type: text/csv",
        hasDisposition ? "✓ Content-Disposition: attachment" : "✗ Content-Disposition: attachment",
      ].join(" | "),
    });
  }

  // Check csv.ts exports all required columns in order.
  let columnsVerified = false;
  let columnSnippet = "";
  if (csv) {
    columnsVerified = allPresent(csv, REQUIRED_COLUMNS);
    // Verify order by checking they appear in sequence in the source.
    const indices = REQUIRED_COLUMNS.map((c) => csv.indexOf(`"${c}"`));
    const orderedCorrectly = indices.every((v, i) => i === 0 || v > indices[i - 1]);
    columnSnippet = REQUIRED_COLUMNS.map((c) => {
      const idx = csv.indexOf(`"${c}"`);
      return `${idx >= 0 ? "✓" : "✗"} ${c}`;
    }).join(", ");
    evidence.push({
      description: "csv.ts CSV_HEADERS contains all 8 required columns in documented order",
      filePath: CSV_PATH,
      snippet: columnSnippet + (orderedCorrectly ? " | ✓ order correct" : " | ✗ order incorrect"),
    });
  }

  // Check tests cover the three assertions.
  if (tests) {
    const testsCT = tests.includes("Content-Type") && tests.includes("text/csv");
    const testsCD = tests.includes("Content-Disposition") && tests.includes("attachment");
    const testsCols = REQUIRED_COLUMNS.every((c) => tests.includes(c));
    evidence.push({
      description: "route.test.ts verifies Content-Type, Content-Disposition, and all column headers",
      filePath: TEST_PATH,
      snippet: [
        testsCT ? "✓ Content-Type check" : "✗ Content-Type check",
        testsCD ? "✓ Content-Disposition check" : "✗ Content-Disposition check",
        testsCols ? "✓ all column headers checked" : "✗ some column headers missing from tests",
      ].join(" | "),
    });
  }

  const routeOk =
    route !== null &&
    route.includes('"Content-Type"') &&
    route.includes("text/csv") &&
    route.includes('"Content-Disposition"') &&
    route.includes("attachment");

  const allGood = routeOk && columnsVerified;

  return {
    id: "AC-02",
    text: AC_TEXT,
    status: allGood ? "VERIFIED" : "FAILED",
    reason: allGood
      ? "route.ts returns 200 with correct Content-Type and Content-Disposition; csv.ts defines all 8 columns in the specified order."
      : "One or more required conditions not met (see evidence).",
    evidence,
  };
}
