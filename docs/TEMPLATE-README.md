# Verity — Developer Template

Copy the `template/` directory into any TypeScript project to add executable
requirement verification in under ten minutes.

---

## What Verity does (and does not do)

| Does | Does not |
|---|---|
| Execute real code against your acceptance criteria | Read a ticket and auto-generate checks |
| Report VERIFIED / FAILED / UNCERTAIN per criterion | Replace unit tests |
| Detect spec criteria that have no check (→ UNCERTAIN) | Prove correctness from source text alone |
| Block an all-VERIFIED result when coverage is missing | Understand prose — it runs what you write |

**Bob drafts the checks. Verity executes them.**

---

## Files to copy

Copy these files from `template/`, preserving the directory structure:

```
template/
  verity/
    run.ts                              ← CLI entry point (no built-in tasks)
    types.ts                            ← CriterionResult, VerityReport
    renderer.ts                         ← JSON + Markdown output
    helpers.ts                          ← readWorkspaceFile, allPresent, etc.
    tasks/
      sample-feature/
        ac01.ts                         ← example check — replace with yours
  docs/
    sample-feature.md                   ← example spec — replace with yours
```

Reference only — **merge, do not overwrite** your own files:

```
template/
  package.json                          ← the script + devDependencies to merge
  tsconfig.json                         ← only for projects with no tsconfig
```

Take files from `template/` only. The repo's own `verity/run.ts`,
`verity/checks/` and `verity/tasks/` depend on the sample app and will not
work elsewhere.

---

## Step-by-step setup

### 1 — Copy the template files

```bash
cp -r template/verity   <your-project>/verity
cp -r template/docs/.   <your-project>/docs    # creates docs/ or merges into it
# Only if the project has no tsconfig.json yet:
cp    template/tsconfig.json  <your-project>/tsconfig.json
```

PowerShell:

```powershell
Copy-Item -Recurse template\verity <your-project>\verity
New-Item -ItemType Directory -Force <your-project>\docs | Out-Null
Copy-Item template\docs\* <your-project>\docs
```

Keep your existing `tsconfig.json`. The template files type-check under strict
settings (`verbatimModuleSyntax`, `noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes`, `types: []`) with both `module: nodenext` and
`module: commonjs`. They reference Node types themselves, so you do not need
to add `"node"` to `types`.

### 2 — Install the dev dependencies

```bash
cd <your-project>
npm install --save-dev tsx typescript @types/node
```

`tsx` runs Verity. `typescript` and `@types/node` are needed only to
type-check the Verity files; the runner works without them. There are no
runtime dependencies — Verity uses only Node built-ins (`fs`, `path`, `url`).

### 2a — Smoke-test the install

```bash
npx tsx verity/run.ts --task sample-feature
```

Expected: `AC-01 VERIFIED`, `AC-02 UNCERTAIN` (the sample spec has two
criteria but only one check), exit code `2`. That confirms the runner, check
loading and coverage-gap detection all work. Delete
`verity/tasks/sample-feature/` and `docs/sample-feature.md` when you no longer
need them.

### 3 — Write your spec

Create `docs/<your-task>.md`.  
Acceptance criteria **must** use level-3 headings with a labelled ID:

```markdown
### AC-01 — The requirement label

One paragraph describing the requirement. Bullet points for sub-conditions.

### AC-02 — Another criterion
...
```

The ID format is `WORD-NN` (e.g. `AC-01`, `AUTH-03`, `PAG-02`).  
Verity reads these IDs and reports UNCERTAIN for any ID without a check.

### 4 — Ask Bob to draft checks

> *"Here is my spec: `docs/<your-task>.md`  
> Here is the implementation: `src/lib/<your-module>.ts`  
> Draft one Verity check per acceptance criterion.  
> Each check must call the real function with boundary inputs and return  
> a `CriterionResult`. Use `verity/tasks/sample-feature/ac01.ts` as a reference.*"

Bob will produce one `.ts` file per criterion.
**Review every check before running it.** A check that only confirms a file
exists or wraps a source-text search is not sufficient — it must execute code.

### 5 — Add an npm script

```jsonc
// package.json
{
  "scripts": {
    "verity:<your-task>": "npx tsx verity/run.ts --task <your-task>"
  }
}
```

### 6 — Run

```bash
npm run verity:<your-task>
```

Verity writes `verity-report.json` and `verity-report.md` to the project root.

---

## What a good check looks like

```typescript
// verity/tasks/my-task/ac01.ts
import { myFunction } from "../../../src/lib/myModule.js";
import type { CriterionResult } from "../../types.js";

export default function checkAC01(): CriterionResult {
  // Call the real function with a boundary input.
  const result = myFunction("boundary-input");
  const pass   = result === "expected-output";

  return {
    id:     "AC-01",
    text:   "The criterion text from the spec.",
    status: pass ? "VERIFIED" : "FAILED",
    reason: pass
      ? "myFunction returned the expected output."
      : `myFunction returned "${result}" — expected "expected-output".`,
    evidence: [
      {
        description: 'myFunction("boundary-input") → expected "expected-output"',
        filePath:    "src/lib/myModule.ts",
        snippet:     `result = "${result}"  ${pass ? "✓" : "✗"}`,
      },
    ],
  };
}
```

Rules:
- **Run real code.** Import the module and call it with boundary inputs.
- **Never return VERIFIED because a file exists** or a string appears in source.
- **Name files `ac01.ts`, `ac02.ts`, …** — they are loaded alphabetically.
- **Import `CriterionResult` with `import type`.** A plain `import { … }` of a
  type crashes at runtime in projects with `verbatimModuleSyntax`.
- A check that cannot run must `return { status: "UNCERTAIN", … }`. Wrap calls
  that may throw in `try/catch` — an uncaught throw aborts the whole run.

---

## Exit codes

| Code | Meaning |
|---|---|
| `0` | All criteria VERIFIED |
| `1` | One or more FAILED |
| `2` | None failed, but one or more UNCERTAIN (includes coverage gaps) |
| `3` | Runner error (bad `--task`, missing files, unexpected exception) |

---

## Coverage-gap detection

After every run Verity compares the criterion IDs in your spec against the
IDs returned by your checks.

| Scenario | Verity behaviour |
|---|---|
| Spec ID has a matching check result | Normal verdict (VERIFIED / FAILED) |
| Spec ID has **no** matching check | Injected as **UNCERTAIN** — exits 2 |
| Duplicate check IDs in results | UNCERTAIN injected — exits 2 |
| Spec has no `### WORD-NN` headings | UNCERTAIN injected — exits 2 |
| Spec file cannot be read | UNCERTAIN injected — exits 2 |

An all-VERIFIED exit-0 is **impossible** until every spec criterion has a check.

---

## Limitations

- `--task <name>` is required; the template runner has no default task.
- Checks must be synchronous (`() => CriterionResult`); a returned Promise is
  not awaited.
- A check that throws, or whose `import` fails (e.g. a wrong path to your
  module), aborts the run with exit code `3` and no report is written.
- The spec and checks must live at `docs/<task>.md` and
  `verity/tasks/<task>/`, and Verity must be run from the project root.
- Only `### WORD-NN` headings count as criteria (e.g. `AC-01`; not `AC01` or
  `ac-01`).
- Each run overwrites `verity-report.json` and `verity-report.md`; add them to
  `.gitignore` if you do not want them committed.
