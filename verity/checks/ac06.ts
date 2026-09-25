/**
 * AC-06 — Every admin export creates an audit record.
 *
 * Assessment method: executable acceptance probe
 * -----------------------------------------------
 * This checker runs the dedicated AC-06 acceptance probe as a subprocess and
 * reports its actual exit code and output as evidence.  The probe is defined in:
 *
 *   src/app/api/admin/export/ac06-audit.probe.ts
 *
 * The probe calls the GET handler directly, then inspects the in-memory audit
 * store (src/lib/auditStore.ts) to verify that:
 *   1. One audit record is written per successful export.
 *   2. The record includes userId, exportedAt (ISO 8601), filters, rowCount.
 *   3. No record is written for rejected requests.
 *   4. When writeAuditRecord throws, the route returns HTTP 500.
 *
 * Status derivation (based entirely on probe exit code — no heuristics):
 *   exit 0         → VERIFIED  (all probe assertions passed)
 *   exit non-zero  → FAILED    (one or more probe assertions failed)
 *   spawn error    → UNCERTAIN (probe could not be executed)
 *
 * How to run the probe manually:
 *   npm run verity:probe
 *
 * How the probe will pass after the fix:
 *   The route must import writeAuditRecord from @/lib/auditStore, call it
 *   (awaited) with { userId, exportedAt, filters, rowCount } before returning
 *   the response, and wrap the call in try/catch returning HTTP 500 on failure.
 *   The implementation in auditStore.ts must push to _records so getAuditRecords()
 *   returns the written entry.
 */

import { execSync } from "child_process";
import { CriterionResult } from "../types.js";
import { fileExists } from "../helpers.js";

const PROBE_FILE = "src/app/api/admin/export/ac06-audit.probe.ts";
const PROBE_COMMAND = "npm run verity:probe";

const AC_TEXT =
  "Each successful export request must persist an audit record before the response is sent. " +
  "The record must include: authenticated user ID, UTC timestamp, filter parameters, row count. " +
  "Failure to persist must return HTTP 500 rather than silently succeed.";

/** Strip ANSI colour codes so failure output is readable in the JSON report. */
function stripAnsi(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;]*m/g, "");
}

/** Extract the last N non-blank lines from a string. */
function tailLines(s: string, n: number): string {
  return s
    .split("\n")
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0)
    .slice(-n)
    .join("\n");
}

export function checkAC06(): CriterionResult {
  const evidence = [];

  // Confirm the probe file exists.
  const probeExists = fileExists(PROBE_FILE);
  evidence.push({
    description: "AC-06 acceptance probe file",
    filePath: PROBE_FILE,
    snippet: probeExists ? "✓ probe file exists" : "✗ probe file not found",
  });

  if (!probeExists) {
    return {
      id: "AC-06",
      text: AC_TEXT,
      status: "UNCERTAIN",
      reason: `Probe file not found at ${PROBE_FILE}. Cannot assess AC-06.`,
      evidence,
    };
  }

  evidence.push({
    description: "Probe command",
    snippet: PROBE_COMMAND,
  });

  // Run the probe.
  try {
    const raw = execSync(`${PROBE_COMMAND} 2>&1`, {
      cwd: process.cwd(),
      timeout: 120_000,
      encoding: "utf8",
    });

    const output = stripAnsi(raw);
    const tail = tailLines(output, 25);

    evidence.push({
      description: "Probe output (last 25 lines)",
      snippet: tail,
    });

    // Even if exit 0, scan for failure markers in case of misconfiguration.
    const hasFailed =
      /\bFAIL\b|\bfailed\b|\bAssertionError\b/.test(output) &&
      !/ 0 failed/.test(output);

    if (hasFailed) {
      return {
        id: "AC-06",
        text: AC_TEXT,
        status: "FAILED",
        reason:
          `Probe exited 0 but output contains failure indicators. ` +
          `Run '${PROBE_COMMAND}' for the full report.`,
        evidence,
      };
    }

    return {
      id: "AC-06",
      text: AC_TEXT,
      status: "VERIFIED",
      reason: `All AC-06 probe assertions passed (exit 0). Run '${PROBE_COMMAND}' to reproduce.`,
      evidence,
    };
  } catch (err: unknown) {
    const execErr = err as { stdout?: string; stderr?: string; status?: number; message?: string };

    // Non-zero exit: probe ran but assertions failed.
    if (typeof execErr.status === "number") {
      const combined = stripAnsi(
        [execErr.stdout ?? "", execErr.stderr ?? ""].join("\n")
      );
      const tail = tailLines(combined, 35);

      evidence.push({
        description: `Probe failed — exit code ${execErr.status}`,
        snippet: tail,
      });

      return {
        id: "AC-06",
        text: AC_TEXT,
        status: "FAILED",
        reason:
          `AC-06 acceptance probe exited with code ${execErr.status}: one or more audit assertions failed. ` +
          `Run '${PROBE_COMMAND}' locally to see the full failure output.`,
        evidence,
      };
    }

    // Spawn error (e.g. npm not found, timeout).
    evidence.push({
      description: "Probe could not be executed",
      snippet: execErr.message ?? String(err),
    });

    return {
      id: "AC-06",
      text: AC_TEXT,
      status: "UNCERTAIN",
      reason: `Probe could not be executed: ${execErr.message ?? String(err)}. Install dependencies and retry.`,
      evidence,
    };
  }
}
