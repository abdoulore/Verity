#!/usr/bin/env node
/**
 * Verity — requirement-verification tool.
 *
 * Usage:
 *   npx tsx verity/run.ts
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

const SPEC_FILE = "docs/admin-csv-export.md";
const JSON_OUT = "verity-report.json";
const MD_OUT = "verity-report.md";

async function main(): Promise<void> {
  console.log("Verity — running checks against", SPEC_FILE);
  console.log("Working directory:", process.cwd());
  console.log("─".repeat(60));

  const checkers = [
    checkAC01,
    checkAC02,
    checkAC03,
    checkAC04,
    checkAC05,
    checkAC06,
    checkAC07,
    checkAC08,
  ];

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
    specFile: SPEC_FILE,
    summary,
    results,
  };

  // Write outputs.
  const jsonOut = path.resolve(process.cwd(), JSON_OUT);
  const mdOut = path.resolve(process.cwd(), MD_OUT);

  fs.writeFileSync(jsonOut, renderJson(report), "utf8");
  fs.writeFileSync(mdOut, renderMarkdown(report), "utf8");

  console.log("─".repeat(60));
  console.log(`Summary: ${summary.verified}/${summary.total} verified, ${summary.failed} failed, ${summary.uncertain} uncertain`);
  console.log(`JSON report → ${JSON_OUT}`);
  console.log(`Markdown report → ${MD_OUT}`);

  // Exit code.
  if (summary.failed > 0) process.exit(1);
  if (summary.uncertain > 0) process.exit(2);
  process.exit(0);
}

main().catch((err) => {
  console.error("Verity encountered an unexpected error:", err);
  process.exit(3);
});
