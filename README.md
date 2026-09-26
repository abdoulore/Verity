# Verity

**The ticket says done. Verity proves it.**

Verity is a prototype for checking a developer ticket against a working project. This demo uses an Admin CSV Export feature with eight acceptance criteria. The ordinary tests passed while the audit requirement was missing; Verity’s separate acceptance probe exposed the gap. After the audit fix, the same probe and verifier passed.

## Demonstrated result

| Check | Before repair | After repair |
|---|---:|---:|
| Ordinary tests | 73/73 passed | 73/73 passed |
| AC-06 audit probe | 1/7 passed | 7/7 passed |
| Verity requirements | 7/8 verified | 8/8 verified |

The saved reports are in `evidence/before/` and `evidence/after/`. Bob IDE task summaries are in `bob_sessions/` as evidence of Bob usage.

## What the prototype checks

The ticket is `docs/admin-csv-export.md`. Verity assesses its eight defined acceptance criteria using source checks, existing tests, and an executable probe for audit recording. Each result is `VERIFIED`, `FAILED`, or `UNCERTAIN`, with evidence in JSON and Markdown reports.

This prototype has checkers written for the eight criteria in this sample project. It does not automatically support arbitrary tickets or repositories.

## Run locally

Requires Node.js and npm. No Docker, database, external API, or credentials are needed.

```bash
npm ci
npm test
npm run verity:probe
npm run verity
npm run build
```

`npm run verity` writes `verity-report.json` and `verity-report.md` in the project root. It exits with code 0 when all criteria are verified, 1 when a criterion fails, and 2 when none fail but at least one is uncertain.

To try the sample API:

```bash
npm run dev
```

Then request `http://localhost:3000/api/admin/export` with the header `Authorization: Bearer token-admin-alice`.

## How Bob was used

IBM Bob IDE was used to build the sample project, implement Verity, investigate the failing audit requirement, and repair the export workflow. The task session summaries for relevant Bob tasks are included in `bob_sessions/`.

The before and after reports preserve the key workflow: ordinary tests passed, the independent audit probe found a missing requirement, Bob repaired it, and the unchanged probe verified the result.