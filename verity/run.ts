#!/usr/bin/env node
/**
 * Verity — requirement-verification tool.
 * (Windows note: dynamic imports use pathToFileURL so ESM loader accepts them.)
 *
 * Built-in task (default, no flags):
 *   Runs the Admin CSV Export checks from verity/checks/
 *   against docs/admin-csv-export.md
 *
 * Custom task:
 *   npx tsx verity/run.ts --task <task-name>
 *
 *   Loads every *.ts file from  verity/tasks/<task-name>/
 *   and reads the spec from     docs/<task-name>.md
 *   Each check file must export a default function: () => CriterionResult
 *
 * Outputs:
 *   verity-report.json   — machine-readable report
 *   verity-report.md     — human-readable Markdown report
 *
 * Exit codes:
 *   0 — all criteria VERIFIED
 *   1 — one or more FAILED
 *   2 — one or more UNCERTAIN (and none failed)
 */

import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { checkAC01 } from "./checks/ac01.js";
import { checkAC02 } from "./checks/ac02.js";
import { checkAC03 } from "./checks/ac03.js";
import { checkAC04 } from "./checks/ac04.js";
import { checkAC05 } from "./checks/ac05.js";
import { checkAC06 } from "./checks/ac06.js";
import { checkAC07 } from "./checks/ac07.js";
import { checkAC08 } from "./checks/ac08.js";
import { renderJson, renderMarkdown } from "./renderer.js";
import { VerityReport, CriterionResult } from "./types.js";

const JSON_OUT = "verity-report.json";
const MD_OUT = "verity-report.md";

// ---------------------------------------------------------------------------
// Argument parsing — pick up --task <name>
// ---------------------------------------------------------------------------

function parseTaskArg(): string | null {
  const idx = process.argv.indexOf("--task");
  if (idx === -1) return null;
  const name = process.argv[idx + 1];
  if (!name || name.startsWith("--")) {
    console.error("Error: --task requires a task name argument.");
    process.exit(3);
  }
  return name;
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
    console.error(`Error: no *.ts check files found in verity/tasks/${taskName}/`);
    process.exit(3);
  }

  const checkers: Array<() => CriterionResult> = [];
  for (const file of files) {
    const mod = await import(pathToFileURL(path.join(tasksDir, file)).href);
    const fn = mod.default ?? Object.values(mod).find((v) => typeof v === "function");
    if (typeof fn !== "function") {
      console.warn(`Warning: ${file} does not export a default function — skipped.`);
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

  let specFile: string;
  let checkers: Array<() => CriterionResult>;

  if (taskName === null) {
    // Default: Admin CSV Export (backward-compatible)
    specFile = "docs/admin-csv-export.md";
    checkers = [
      checkAC01, checkAC02, checkAC03, checkAC04,
      checkAC05, checkAC06, checkAC07, checkAC08,
    ];
  } else {
    specFile = `docs/${taskName}.md`;
    checkers = await loadTaskChecks(taskName);
  }

  console.log("Verity — running checks against", specFile);
  console.log("Working directory:", process.cwd());
  console.log("─".repeat(60));

  const results: CriterionResult[] = [];

  for (const check of checkers) {
    const result = check();
    results.push(result);
    const icon =
      result.status === "VERIFIED" ? "✅" :
      result.status === "FAILED"   ? "❌" : "⚠️ ";
    console.log(`${icon}  ${result.id}  ${result.status}  —  ${result.reason}`);
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
  console.log(`Summary: ${summary.verified}/${summary.total} verified, ${summary.failed} failed, ${summary.uncertain} uncertain`);
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
