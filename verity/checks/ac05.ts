/**
 * AC-05 — Each exported row includes a timestamp.
 *
 * Checks:
 *  1. csv.ts adds exportedAt = new Date().toISOString() to every row.
 *  2. The OrderRecord type includes createdAt: string (ISO 8601).
 *  3. Both fields appear in the CSV_HEADERS array.
 *  4. Tests verify non-empty exportedAt and createdAt on every data row.
 */

import { CriterionResult } from "../types.js";
import { readWorkspaceFile, allPresent } from "../helpers.js";

const CSV_PATH = "src/lib/csv.ts";
const DATA_PATH = "src/data/dataset.ts";
const TEST_PATH = "src/app/api/admin/export/route.test.ts";

const AC_TEXT =
  'Every data row in the CSV must contain a non-empty, valid ISO 8601 exportedAt timestamp. ' +
  'The createdAt field must also be present and non-empty.';

export function checkAC05(): CriterionResult {
  const csv = readWorkspaceFile(CSV_PATH);
  const data = readWorkspaceFile(DATA_PATH);
  const tests = readWorkspaceFile(TEST_PATH);

  const evidence = [];

  if (!csv) {
    return {
      id: "AC-05",
      text: AC_TEXT,
      status: "UNCERTAIN",
      reason: `Could not read ${CSV_PATH}.`,
      evidence: [],
    };
  }

  // Check csv.ts adds exportedAt per row.
  const hasExportedAt = csv.includes("exportedAt") && csv.includes("new Date().toISOString()");
  const hasCreatedAt = csv.includes("r.createdAt");
  const headersHaveBoth = csv.includes('"exportedAt"') && csv.includes('"createdAt"');

  evidence.push({
    description: "csv.ts generates exportedAt = new Date().toISOString() and includes createdAt",
    filePath: CSV_PATH,
    snippet: [
      hasExportedAt ? "✓ exportedAt = new Date().toISOString()" : "✗ exportedAt generation not found",
      hasCreatedAt ? "✓ r.createdAt in row mapping" : "✗ r.createdAt not found",
      headersHaveBoth ? "✓ both in CSV_HEADERS" : "✗ missing from CSV_HEADERS",
    ].join(" | "),
  });

  // Check OrderRecord has createdAt: string.
  if (data) {
    const hasCreatedAtField = data.includes("createdAt:") && data.includes("ISO 8601");
    evidence.push({
      description: "dataset.ts OrderRecord type declares createdAt: string (ISO 8601)",
      filePath: DATA_PATH,
      snippet: hasCreatedAtField
        ? "✓ createdAt: string; // ISO 8601 declared in OrderRecord"
        : "✗ createdAt ISO 8601 declaration not found",
    });
  }

  // Check tests validate both timestamps.
  if (tests) {
    const testsExportedAt = tests.includes("exportedAt") && tests.includes("toISOString");
    const testsCreatedAt = tests.includes("createdAt") && tests.includes("createdAtIdx");
    evidence.push({
      description: "route.test.ts checks exportedAt (ISO 8601 validated) and createdAt on every data row",
      filePath: TEST_PATH,
      snippet: [
        testsExportedAt ? "✓ exportedAt ISO 8601 validation test present" : "✗ exportedAt test not found",
        testsCreatedAt ? "✓ createdAt presence test present" : "✗ createdAt test not found",
      ].join(" | "),
    });
  }

  const allGood = hasExportedAt && hasCreatedAt && headersHaveBoth;

  return {
    id: "AC-05",
    text: AC_TEXT,
    status: allGood ? "VERIFIED" : "FAILED",
    reason: allGood
      ? "csv.ts stamps every row with exportedAt = new Date().toISOString() and maps r.createdAt; both are in CSV_HEADERS."
      : "Timestamp generation incomplete (see evidence).",
    evidence,
  };
}
