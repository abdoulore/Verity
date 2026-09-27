# Verity

**The ticket says done. Verity proves it.**

Verity checks a developer ticket against a working project. A developer writes a spec in `docs/`, a set of executable checks in `verity/tasks/<task-name>/`, and runs Verity to receive a VERIFIED / FAILED / UNCERTAIN verdict per requirement — backed by command output and assertion results as evidence. The web dashboard lets developers run and inspect these checks in the browser while the project runs locally.

Verity does **not** automatically understand arbitrary requirements or prove correctness from source text alone. Each criterion requires a hand-written check that executes real code or commands.

---

## Tasks included

### Admin CSV Export (original)

Eight acceptance criteria for `docs/admin-csv-export.md`. Checks use source inspection, existing test coverage, and an executable audit probe.

| Check | Before repair | After repair |
|---|---:|---:|
| Ordinary tests | 73/73 passed | 73/73 passed |
| AC-06 audit probe | 1/7 passed | 7/7 passed |
| Verity requirements | 7/8 verified | 8/8 verified |

Saved evidence: `evidence/before/` and `evidence/after/`.

### Pagination API (second task)

Three acceptance criteria for `docs/pagination-api.md`. Checks call `src/lib/paginate.ts` directly at the exact boundary values. Ordinary tests that skip the boundary (pageSize 10, pageSize 200) miss the bug; Verity detects it.

| State | PAG-01 | PAG-02 | PAG-03 |
|---|---|---|---|
| Buggy (off-by-one in cap) | ❌ FAILED | ✅ VERIFIED | ✅ VERIFIED |
| Repaired | ✅ VERIFIED | ✅ VERIFIED | ✅ VERIFIED |

---

## Run locally

Requires Node.js and npm. No Docker, database, or external credentials.

```bash
npm ci
npm test                    # 73 unit tests
npm run verity:probe        # AC-06 audit probe (7 assertions)
npm run verity              # Admin CSV Export — 8 criteria
npm run verity:pagination   # Pagination API   — 3 criteria
npm run build               # Next.js production build
npm run dev                 # Open http://localhost:3000 for the dashboard
```

Each `verity` command writes `verity-report.json` and `verity-report.md` to the project root.

### Web dashboard

Open `http://localhost:3000` after `npm run dev`. Select an audit in the sidebar and click **Run audit**. The dashboard runs the same CLI checks against this checkout, then displays counts, individual verdicts, reasons, and expandable evidence. Use **Specification** to inspect the source requirements, **Developer guide** to add a task, and download the JSON or Markdown report from **Results**. New tasks in `verity/tasks/<task-name>/` with a matching `docs/<task-name>.md` appear after a page reload; no UI code changes are required.

The audit API executes project-owned check files and writes reports to this checkout. Run this dashboard only for a project you trust. It requires a writable, persistent Node.js process with dependencies installed; a static host or a serverless deployment with a read-only filesystem cannot execute the CLI runner. The browser cannot read a visitor's local repository from a remotely hosted site. To audit another project, install Verity there and run its dashboard locally.

Exit codes: `0` = all VERIFIED · `1` = one or more FAILED · `2` = none failed but one or more UNCERTAIN.

---

## Adding your own task

Follow these four steps. No changes to existing files are required.

### 1. Write a spec

Create `docs/<task-name>.md`. It must contain clearly defined acceptance criteria. There is no magic parsing — the spec is for humans; the checks are what Verity executes.

### 2. Implement the thing

Write the feature code in `src/` as normal.

### 3. Write the checks

Create one TypeScript file per criterion in `verity/tasks/<task-name>/`. Each file must export a **default function** with this signature:

```ts
// verity/tasks/my-task/ac01.ts
import { CriterionResult } from "../../types.js";

export default function checkAC01(): CriterionResult {
  // Execute real code or commands here.
  // Return VERIFIED, FAILED, or UNCERTAIN — never VERIFIED solely because a
  // file exists or a test name mentions the criterion.
  return {
    id: "AC-01",
    text: "The criterion text from the spec.",
    status: "VERIFIED",   // or "FAILED" or "UNCERTAIN"
    reason: "One sentence explaining the verdict.",
    evidence: [
      {
        description: "What was executed and what it returned.",
        filePath: "src/lib/my-module.ts",  // optional
        snippet: "actual output here",     // optional
      },
    ],
  };
}
```

Rules:
- **Run real code.** Import the module and call it with boundary inputs. Do not return VERIFIED because a source file exists.
- **A missing or un-runnable check must be UNCERTAIN**, not VERIFIED.
- **Keep checks confined to this project.** Do not `exec` arbitrary external commands.
- Files are loaded in alphabetical order, so name them `ac01.ts`, `ac02.ts`, … or `pag01.ts`, etc.

### 4. Add an npm script and run

```jsonc
// package.json — add to "scripts":
"verity:my-task": "npx tsx verity/run.ts --task my-task"
```

```bash
npm run verity:my-task
```

---

## Repository layout

```
docs/
  admin-csv-export.md     — Admin CSV Export spec
  pagination-api.md       — Pagination API spec

verity/
  run.ts                  — CLI entry point (--task <name> selects a task)
  types.ts                — CriterionResult, VerityReport, etc.
  renderer.ts             — JSON + Markdown report writers
  helpers.ts              — readWorkspaceFile, allPresent, etc.
  checks/                 — Built-in Admin CSV Export checks (ac01–ac08)
  tasks/
    pagination-api/       — Executable checks for the pagination task

src/
  app/api/admin/export/   — Admin CSV Export route + tests + AC-06 probe
  lib/
    csv.ts                — CSV builder
    auditStore.ts         — In-memory audit store
    paginate.ts           — Pagination utility

evidence/
  before/                 — Reports before the audit fix
  after/                  — Reports after the audit fix
```

---

## How Bob was used

IBM Bob IDE was used to build the sample project, implement Verity, investigate the failing audit requirement, repair the export workflow, and extend Verity to support multiple tasks. The task session summaries for relevant Bob tasks are included in `bob_sessions/`.

The before and after reports preserve the key workflow: ordinary tests passed, the independent audit probe found a missing requirement, Bob repaired it, and the unchanged probe verified the result.
