#!/usr/bin/env node
/**
 * Verity — portable requirement-verification runner.
 *
 * This is the copy-ready entry point for new projects.
 * It has NO built-in task dependencies — it only loads checks dynamically.
 *
 * Usage:
 *   npx tsx verity/run.ts --task <task-name>
 *
 *   Loads every *.ts file from  verity/tasks/<task-name>/
 *   and reads the spec from     docs/<task-name>.md
 *   Each check file must export a default function: () => CriterionResult
 *
 * Coverage-gap detection:
 *   After running all checks, the runner parses the spec file for criterion IDs
 *   (headings matching /###\s+([A-Z]+-\d+)/). Any ID found in the spec but
 *   absent from the check results is injected as UNCERTAIN. A spec with no
 *   recognisable criterion IDs, or a check set with duplicate IDs, also
 *   triggers UNCERTAIN injection and is noted in the console.
 *
 * Outputs:
 *   verity-report.json   — machine-readable report
 *   verity-report.md     — human-readable Markdown report
 *
 * Exit codes:
 *   0 — all criteria VERIFIED
 *   1 — one or more FAILED
 *   2 — one or more UNCERTAIN (and none failed)
 *   3 — runner error (bad --task, missing files, unexpected exception)
 */

/// <reference types="node" />
import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import { renderJson, renderMarkdown } from "./renderer.js";
import type { VerityReport, CriterionResult } from "./types.js";

const JSON_OUT = "verity-report.json";
const MD_OUT = "verity-report.md";

// ---------------------------------------------------------------------------
// Argument parsing — --task <name> is required
// ---------------------------------------------------------------------------

function parseTaskArg(): string {
  const idx = process.argv.indexOf("--task");
  if (idx === -1) {
    console.error(
      "Error: --task <name> is required.\n" +
      "Usage:  npx tsx verity/run.ts --task <task-name>\n" +
      "Checks: verity/tasks/<task-name>/*.ts\n" +
      "Spec:   docs/<task-name>.md"
    );
    process.exit(3);
  }
  const name = process.argv[idx + 1];
  if (!name || name.startsWith("--")) {
    console.error("Error: --task requires a task name argument.");
    process.exit(3);
  }
  return name;
}

// ---------------------------------------------------------------------------
// Spec parser — extract criterion IDs from the Markdown spec file.
//
// Recognised pattern: a level-3 heading  ###  WORD-NN  (e.g. ### AC-01)
// Returns the ordered list of unique IDs found, or null if the spec file
// cannot be read.
// ---------------------------------------------------------------------------

function parseCriterionIds(specFile: string): string[] | null {
  const absPath = path.resolve(process.cwd(), specFile);
  let content: string;
  try {
    content = fs.readFileSync(absPath, "utf8");
  } catch {
    return null;
  }
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const line of content.split("\n")) {
    const m = line.match(/^###\s+([A-Z]+-\d+)\b/);
    if (m?.[1]) {
      const id = m[1];
      if (!seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    }
  }
  return ids;
}

// ---------------------------------------------------------------------------
// Coverage-gap check — compare spec IDs against check results.
//
// Returns an array of synthetic UNCERTAIN results for any spec ID that has
// no corresponding entry in `results`. Also detects duplicate result IDs and
// appends a warning entry for each duplicate.
// ---------------------------------------------------------------------------

function detectCoverageGaps(
  specIds: string[],
  results: CriterionResult[]
): CriterionResult[] {
  const gaps: CriterionResult[] = [];

  // Detect duplicate IDs among check results.
  const idCount = new Map<string, number>();
  for (const r of results) {
    idCount.set(r.id, (idCount.get(r.id) ?? 0) + 1);
  }
  for (const [id, count] of idCount) {
    if (count > 1) {
      console.warn(
        `⚠️  WARNING: criterion ID "${id}" appears ${count} times in check results — ` +
        `duplicate IDs prevent an all-VERIFIED result.`
      );
      gaps.push({
        id: `${id}:DUPLICATE`,
        text: `Duplicate criterion ID "${id}" detected in check results.`,
        status: "UNCERTAIN",
        reason:
          `The criterion ID "${id}" was returned by ${count} separate checks. ` +
          `Duplicate IDs make it impossible to confirm full coverage. ` +
          `Fix the check files so each ID is unique.`,
        evidence: [
          {
            description: "Duplicate ID detected",
            snippet: `"${id}" appears ${count} times in results`,
          },
        ],
      });
    }
  }

  // Find spec IDs missing from results.
  const resultIds = new Set(results.map((r) => r.id));
  for (const specId of specIds) {
    if (!resultIds.has(specId)) {
      console.warn(
        `⚠️  WARNING: criterion "${specId}" is in the spec but has no check — marked UNCERTAIN.`
      );
      gaps.push({
        id: specId,
        text: `Criterion ${specId} is defined in the spec but no check was executed for it.`,
        status: "UNCERTAIN",
        reason:
          `No check file produced a result for "${specId}". ` +
          `Draft a check for this criterion and place it in verity/tasks/<task-name>/.`,
        evidence: [
          {
            description: "Missing check",
            snippet: `${specId} found in spec; absent from check results`,
          },
        ],
      });
    }
  }

  return gaps;
}

// ---------------------------------------------------------------------------
// Dynamic task loader — reads verity/tasks/<name>/*.ts
// ---------------------------------------------------------------------------

async function loadTaskChecks(
  taskName: string
): Promise<Array<() => CriterionResult>> {
  const tasksDir = path.resolve(process.cwd(), "verity", "tasks", taskName);

  if (!fs.existsSync(tasksDir)) {
    console.error(
      `Error: task directory not found: verity/tasks/${taskName}/\n` +
      `Create it with at least one check file. See README.md for instructions.`
    );
    process.exit(3);
  }

  const files = fs
    .readdirSync(tasksDir)
    .filter((f) => f.endsWith(".ts"))
    .sort();

  if (files.length === 0) {
    console.error(
      `Error: no *.ts check files found in verity/tasks/${taskName}/`
    );
    process.exit(3);
  }

  const checkers: Array<() => CriterionResult> = [];
  for (const file of files) {
    const mod = await import(
      pathToFileURL(path.join(tasksDir, file)).href
    );
    const fn =
      mod.default ??
      Object.values(mod).find((v) => typeof v === "function");
    if (typeof fn !== "function") {
      console.warn(
        `Warning: ${file} does not export a default function — skipped.`
      );
      continue;
    }
    checkers.push(fn as () => CriterionResult);
  }
  return checkers;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const taskName = parseTaskArg();
  const specFile = `docs/${taskName}.md`;
  const checkers = await loadTaskChecks(taskName);

  console.log("Verity — running checks against", specFile);
  console.log("Working directory:", process.cwd());
  console.log("─".repeat(60));

  const results: CriterionResult[] = [];

  for (const check of checkers) {
    const result = check();
    results.push(result);
    const icon =
      result.status === "VERIFIED"
        ? "✅"
        : result.status === "FAILED"
        ? "❌"
        : "⚠️ ";
    console.log(`${icon}  ${result.id}  ${result.status}  —  ${result.reason}`);
  }

  // -------------------------------------------------------------------------
  // Coverage-gap detection
  // -------------------------------------------------------------------------

  const specIds = parseCriterionIds(specFile);

  if (specIds === null) {
    console.warn(
      `⚠️  WARNING: spec file "${specFile}" could not be read — coverage cannot be verified.`
    );
    results.push({
      id: "SPEC:UNREADABLE",
      text: `Spec file ${specFile} could not be read.`,
      status: "UNCERTAIN",
      reason:
        `The spec file could not be opened. Ensure docs/${taskName}.md exists.`,
      evidence: [{ description: "Spec file not readable", snippet: specFile }],
    });
  } else if (specIds.length === 0) {
    console.warn(
      `⚠️  WARNING: spec file "${specFile}" contains no recognisable criterion IDs ` +
      `(expected headings like "### AC-01"). An all-VERIFIED result is not possible.`
    );
    results.push({
      id: "SPEC:NO-CRITERIA",
      text: `Spec file ${specFile} has no recognisable criterion headings.`,
      status: "UNCERTAIN",
      reason:
        `No headings matching "### WORD-NN" were found in the spec. ` +
        `Add labelled acceptance criteria (e.g. "### AC-01 — ...").`,
      evidence: [
        { description: "No criterion IDs found in spec", snippet: specFile },
      ],
    });
  } else {
    const gaps = detectCoverageGaps(specIds, results);
    if (gaps.length > 0) {
      results.push(...gaps);
      console.log("─".repeat(60));
      console.log(
        `Coverage gaps: ${gaps.length} criterion/criteria without checks injected as UNCERTAIN.`
      );
    }
  }

  const summary = {
    total: results.length,
    verified: results.filter((r) => r.status === "VERIFIED").length,
    failed: results.filter((r) => r.status === "FAILED").length,
    uncertain: results.filter((r) => r.status === "UNCERTAIN").length,
  };

  const report: VerityReport = {
    generatedAt: new Date().toISOString(),
    specFile,
    summary,
    results,
  };

  const jsonOut = path.resolve(process.cwd(), JSON_OUT);
  const mdOut = path.resolve(process.cwd(), MD_OUT);

  fs.writeFileSync(jsonOut, renderJson(report), "utf8");
  fs.writeFileSync(mdOut, renderMarkdown(report), "utf8");

  console.log("─".repeat(60));
  console.log(
    `Summary: ${summary.verified}/${summary.total} verified, ` +
    `${summary.failed} failed, ${summary.uncertain} uncertain`
  );
  console.log(`JSON report → ${JSON_OUT}`);
  console.log(`Markdown report → ${MD_OUT}`);

  if (summary.failed > 0) process.exit(1);
  if (summary.uncertain > 0) process.exit(2);
  process.exit(0);
}

main().catch((err) => {
  console.error("Verity encountered an unexpected error:", err);
  process.exit(3);
});
