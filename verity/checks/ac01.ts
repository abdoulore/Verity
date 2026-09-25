/**
 * AC-01 — Only admins can export.
 *
 * Checks:
 *  1. route.ts performs auth check returning HTTP 403 for non-admin.
 *  2. Tests exist that cover the three forbidden cases (no header, viewer token, unknown token).
 */

import { CriterionResult } from "../types.js";
import { readWorkspaceFile, allPresent } from "../helpers.js";

const ROUTE_PATH = "src/app/api/admin/export/route.ts";
const TEST_PATH = "src/app/api/admin/export/route.test.ts";

const AC_TEXT =
  'Requests that do not carry a valid admin bearer token must be rejected with HTTP 403 Forbidden. ' +
  'Applies to: missing Authorization header, tokens belonging to non-admin users, unrecognised tokens.';

export function checkAC01(): CriterionResult {
  const route = readWorkspaceFile(ROUTE_PATH);
  const tests = readWorkspaceFile(TEST_PATH);

  const evidence = [];

  if (!route) {
    return {
      id: "AC-01",
      text: AC_TEXT,
      status: "UNCERTAIN",
      reason: `Could not read ${ROUTE_PATH}.`,
      evidence: [],
    };
  }

  // Check route implements auth guard returning 403.
  const routeHasAuthGuard = allPresent(route, [
    "getUserByToken",
    'user.role !== "admin"',
    "403",
  ]);

  evidence.push({
    description: "route.ts auth guard check (getUserByToken + role check + 403 status)",
    filePath: ROUTE_PATH,
    snippet: routeHasAuthGuard
      ? "getUserByToken(token) … if (!user || user.role !== \"admin\") { return … status: 403 }"
      : "Auth guard pattern NOT found",
  });

  // Check tests cover the three forbidden scenarios.
  const testCoversMissingHeader =
    tests !== null && tests.includes("no authorization header");
  const testCoversViewer =
    tests !== null && tests.includes("viewer token");
  const testCoversUnknown =
    tests !== null && tests.includes("unrecognised token");

  if (tests) {
    evidence.push({
      description: "route.test.ts covers: missing header, viewer token, unrecognised token",
      filePath: TEST_PATH,
      snippet: [
        testCoversMissingHeader ? "✓ missing Authorization header" : "✗ missing Authorization header",
        testCoversViewer ? "✓ viewer token" : "✗ viewer token",
        testCoversUnknown ? "✓ unrecognised token" : "✗ unrecognised token",
      ].join(" | "),
    });
  } else {
    evidence.push({ description: `Could not read ${TEST_PATH}`, filePath: TEST_PATH });
  }

  const allGood =
    routeHasAuthGuard && testCoversMissingHeader && testCoversViewer && testCoversUnknown;

  return {
    id: "AC-01",
    text: AC_TEXT,
    status: allGood ? "VERIFIED" : "FAILED",
    reason: allGood
      ? "route.ts enforces admin-only auth with HTTP 403; all three forbidden scenarios are covered by tests."
      : "One or more required conditions not met (see evidence).",
    evidence,
  };
}
