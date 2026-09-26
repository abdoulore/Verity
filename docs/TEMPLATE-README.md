# Verity — Developer Template

Copy this directory structure into any TypeScript project to get executable
requirement verification in under ten minutes.

---

## What Verity does (and does not do)

| Does | Does not |
|---|---|
| Execute real code against your acceptance criteria | Automatically read a ticket and generate checks |
| Report VERIFIED / FAILED / UNCERTAIN per criterion | Replace unit tests |
| Detect criteria in your spec that have no check | Understand prose; it runs what you write |
| Refuse an all-VERIFIED result when coverage is missing | Prove correctness by source inspection alone |

**Bob drafts the checks. Verity executes them.**

---

## Files you need

```
docs/
  <your-task>.md          ← Step 1: your spec with labelled acceptance criteria

src/
  <your code here>        ← Step 2: implement the feature

verity/
  run.ts                  ← already present — do not modify
  types.ts                ← already present — do not modify
  helpers.ts              ← already present — do not modify
  renderer.ts             ← already present — do not modify
  tasks/
    <your-task>/
      ac01.ts             ← Step 3: one check file per criterion
      ac02.ts
      …
```

---

## Step 1 — Write the spec

Create `docs/<your-task>.md`.  
Acceptance criteria **must** use level-3 headings with a labelled ID:

```markdown
### AC-01 — The criterion label here

Criterion text describing the requirement in plain language.
One paragraph is enough; bullet points for sub-conditions are fine.

### AC-02 — Another criterion

...
```

The ID format is `WORD-NN` (e.g. `AC-01`, `PAG-03`, `AUTH-02`).  
Verity reads these IDs and reports UNCERTAIN for any ID that has no check.

**Sample spec** → see [`docs/string-utils.md`](../docs/string-utils.md) in this repo.

---

## Step 2 — Implement the feature

Write your feature code in `src/` as normal.

---

## Step 3 — Ask Bob to draft checks

Point Bob at your ticket and your code:

> *"Here is my spec: docs/<your-task>.md  
> Here is the implementation: src/lib/<your-module>.ts  
> Draft one Verity check per acceptance criterion.  
> Each check must call the real function with boundary inputs and return  
> a CriterionResult. Use verity/tasks/string-utils/su01.ts as a reference."*

Bob will produce one `.ts` file per criterion.  
**Review each check before running it.** Bob may mis-read an edge case.

### What a good check looks like

```typescript
// verity/tasks/my-task/ac01.ts
import { myFunction } from "../../../src/lib/myModule.js";
import { CriterionResult } from "../../types.js";

export default function checkAC01(): CriterionResult {
  // Call the real function with boundary inputs.
  const result = myFunction("boundary input");
  const pass = result === "expected output";

  return {
    id: "AC-01",
    text: "The criterion text from the spec.",
    status: pass ? "VERIFIED" : "FAILED",
    reason: pass
      ? "myFunction returned the correct output for the boundary input."
      : `myFunction returned "${result}" — expected "expected output".`,
    evidence: [
      {
        description: 'myFunction("boundary input") → "expected output"',
        filePath: "src/lib/myModule.ts",
        snippet: `result = "${result}"  ${pass ? "✓" : "✗"}`,
      },
    ],
  };
}
```

Rules:
- **Run real code.** Import the module and call it with boundary inputs.
- **Never return VERIFIED because a file exists** or a test name mentions the criterion.
- **A missing or un-runnable check must be UNCERTAIN**, not VERIFIED.
- Name files `ac01.ts`, `ac02.ts`, … (alphabetical load order).

---

## Step 4 — Add an npm script

```jsonc
// package.json — add to "scripts":
"verity:my-task": "npx tsx verity/run.ts --task my-task"
```

---

## Step 5 — Run Verity

```bash
npm run verity:my-task
```

Verity writes `verity-report.json` and `verity-report.md` to the project root.

### Exit codes

| Code | Meaning |
|---|---|
| 0 | All criteria VERIFIED |
| 1 | One or more FAILED |
| 2 | None failed, but one or more UNCERTAIN (includes coverage gaps) |
| 3 | Runner error (bad --task name, no check files, etc.) |

---

## Coverage-gap detection

Verity **automatically** parses your spec file for criterion IDs and compares
them with the check results.

| Scenario | Verity behaviour |
|---|---|
| Spec ID has a matching check result | Normal verdict (VERIFIED / FAILED) |
| Spec ID has **no** matching check | Injected as **UNCERTAIN** |
| Check result ID not in spec | Noted but not penalised |
| Duplicate check IDs | Injected UNCERTAIN, cannot exit 0 |
| Spec has no recognisable IDs | UNCERTAIN injected, cannot exit 0 |

This means:
- **You cannot get an all-VERIFIED result until every spec criterion has a check.**
- **Duplicate IDs in your checks always block a green result.**

---

## Example workflow with the string-utils fixture

This repo includes a complete fixture to demonstrate the FAILED → VERIFIED cycle.

```bash
# 1. Run the fixture (SU-01 will FAIL — truncate has an off-by-one bug)
npm run verity:string-utils

# 2. Open src/lib/stringUtils.ts and fix the bug:
#    Change:  if (text.length >= maxLength) {
#    To:      if (text.length > maxLength) {

# 3. Run again — both criteria should now be VERIFIED
npm run verity:string-utils
```

The original failing evidence looks like:

```
❌  SU-01  FAILED  — truncate produced incorrect output for one or more inputs
   result = "AAAAAAA..." (len 10)  ✗ expected unchanged — got "AAAAAAA..." (off-by-one bug)
```

After the fix:

```
✅  SU-01  VERIFIED  — truncate: short (no-op), exact-length boundary, and long (ellipsis) all correct
✅  SU-02  VERIFIED  — slugify produced correct lowercase hyphenated slugs for all four inputs
```

---

## Full setup and run commands

```bash
# Install dependencies (one time)
npm ci

# Run the unit test suite
npm test

# Run the AC-06 audit probe (for the Admin CSV Export example)
npm run verity:probe

# Verify the Admin CSV Export task (8 criteria)
npm run verity

# Verify the Pagination API task (3 criteria)
npm run verity:pagination

# Verify the string-utils fixture task (2 criteria — SU-01 fails before fix)
npm run verity:string-utils

# Production build (Next.js)
npm run build
```

---

## Repository layout

```
docs/
  admin-csv-export.md     — Admin CSV Export spec (8 criteria)
  pagination-api.md       — Pagination API spec (3 criteria)
  string-utils.md         — String Utils spec (2 criteria, fixture)
  TEMPLATE-README.md      — This file

verity/
  run.ts                  — CLI entry point
  types.ts                — CriterionResult, VerityReport
  renderer.ts             — JSON + Markdown output
  helpers.ts              — readWorkspaceFile, allPresent, etc.
  checks/                 — Built-in Admin CSV Export checks (ac01–ac08)
  tasks/
    pagination-api/       — PAG-01, PAG-02, PAG-03
    string-utils/         — SU-01 (fixture, initially FAILED), SU-02

src/
  app/api/admin/export/   — Admin CSV Export route + tests + probe
  lib/
    csv.ts                — CSV builder
    auditStore.ts         — Audit store
    paginate.ts           — Pagination utility
    stringUtils.ts        — String utils (fixture with planted bug)
```
