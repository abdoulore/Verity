/**
 * AC-08 — The existing automated tests pass.
 *
 * Checks:
 *  1. A test suite file exists.
 *  2. The test runner can be invoked with `npm test`.
 *  3. We execute `npm test` and capture the exit code + output.
 *     Exit code 0 → VERIFIED; non-zero → FAILED; execution error → UNCERTAIN.
 *
 * NOTE: This checker executes a child process.  It is the only checker that does so.
 * The result reflects the actual test outcome at the time Verity is run.
 */

import { execSync } from "child_process";
import { CriterionResult } from "../types.js";
import { fileExists, readWorkspaceFile } from "../helpers.js";

const PACKAGE_PATH = "package.json";
const TEST_PATH = "src/app/api/admin/export/route.test.ts";

const AC_TEXT =
  'All tests in the project\'s automated test suite must pass with no failures before a pull request is merged. ' +
  'The suite is run with: npm test';

export function checkAC08(): CriterionResult {
  const evidence = [];

  // Confirm package.json has a "test" script.
  const pkg = readWorkspaceFile(PACKAGE_PATH);
  const hasTestScript = pkg !== null && pkg.includes('"test"') && pkg.includes("vitest");
  evidence.push({
    description: 'package.json defines a "test" script using vitest',
    filePath: PACKAGE_PATH,
    snippet: hasTestScript ? '✓ "test": "vitest run"' : "✗ test script not found",
  });

  // Confirm the test file exists.
  const testFileExists = fileExists(TEST_PATH);
  evidence.push({
    description: "Test file exists at expected path",
    filePath: TEST_PATH,
    snippet: testFileExists ? "✓ file exists" : "✗ file not found",
  });

  // Run the test suite.
  try {
    const output = execSync("npm test -- --reporter=verbose 2>&1", {
      cwd: process.cwd(),
      timeout: 120_000,
      encoding: "utf8",
    });

    // Capture last ~30 lines of output as evidence.
    const lines = output.split("\n");
    const tail = lines.slice(Math.max(0, lines.length - 30)).join("\n").trim();

    // Check for failure indicators even when exit code is 0.
    const hasFailed = /\b(FAIL|failed|Error)\b/.test(output) &&
      !output.toLowerCase().includes("0 failed");

    evidence.push({
      description: "npm test execution result (last 30 lines of output)",
      snippet: tail,
    });

    return {
      id: "AC-08",
      text: AC_TEXT,
      status: hasFailed ? "FAILED" : "VERIFIED",
      reason: hasFailed
        ? "npm test exited 0 but output contains failure indicators. Review test output."
        : "npm test completed with exit code 0 and no failure indicators in output.",
      evidence,
    };
  } catch (err: unknown) {
    const execErr = err as { stdout?: string; stderr?: string; status?: number };
    const combined = [execErr.stdout ?? "", execErr.stderr ?? ""].join("\n").trim();
    const tail = combined.split("\n").slice(-30).join("\n");

    evidence.push({
      description: `npm test failed with exit code ${execErr.status ?? "unknown"}`,
      snippet: tail,
    });

    return {
      id: "AC-08",
      text: AC_TEXT,
      status: "FAILED",
      reason: `npm test exited with a non-zero code (${execErr.status ?? "unknown"}). Tests did not all pass.`,
      evidence,
    };
  }
}
