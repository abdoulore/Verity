import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import type { VerityReport } from "../../../../verity/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const root = process.cwd();
const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
let running = false;

async function tasks() {
  const names = ["admin-csv-export"];
  const entries = await fs.readdir(path.join(root, "verity/tasks"), { withFileTypes: true });
  names.push(...entries.filter((entry) => entry.isDirectory() && slug.test(entry.name)).map((entry) => entry.name).sort());
  return Promise.all(names.map(async (name) => {
    const specFile = `docs/${name}.md`;
    const spec = await fs.readFile(path.join(root, specFile), "utf8").catch(() => "");
    return { name, title: spec.match(/^#\s+(.+)$/m)?.[1]?.replace(/\s+[—-]\s+Feature Specification$/, "") ?? name, specFile, spec,
      criteria: [...spec.matchAll(/^###\s+([A-Z]+-\d+)\b/gm)].map((match) => match[1]) };
  }));
}

export async function GET() {
  try { return NextResponse.json({ tasks: await tasks() }); }
  catch { return NextResponse.json({ error: "Could not read this project's tasks." }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  if (running) return NextResponse.json({ error: "Another audit is running. Try again when it finishes." }, { status: 409 });
  let name: unknown;
  try { ({ name } = await request.json()); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (typeof name !== "string" || !slug.test(name) || !(await tasks()).some((task) => task.name === name)) {
    return NextResponse.json({ error: "Unknown task." }, { status: 400 });
  }
  running = true;
  try {
    const started = Date.now();
    const args = ["--import", "tsx", "verity/run.ts", ...(name === "admin-csv-export" ? [] : ["--task", name])];
    const outcome = await new Promise<{ code: number | null; output: string }>((resolve, reject) => {
      const child = spawn(process.execPath, args, { cwd: root, env: process.env, stdio: ["ignore", "pipe", "pipe"], timeout: 130_000 });
      let output = "";
      const append = (chunk: Buffer) => { output = (output + chunk.toString()).slice(-12000); };
      child.stdout.on("data", append);
      child.stderr.on("data", append);
      child.on("error", reject);
      child.on("close", (code) => resolve({ code, output }));
    });
    if (outcome.code === null || outcome.code > 2) throw new Error(outcome.output || "Runner could not start.");
    const reportFile = path.join(root, "verity-report.json");
    const stat = await fs.stat(reportFile);
    if (stat.mtimeMs < started - 2000) throw new Error("Runner did not produce a new report.");
    const report = JSON.parse(await fs.readFile(reportFile, "utf8")) as VerityReport;
    const markdown = await fs.readFile(path.join(root, "verity-report.md"), "utf8");
    return NextResponse.json({ report, markdown, exitCode: outcome.code, output: outcome.output });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Audit failed to start." }, { status: 500 });
  } finally { running = false; }
}
