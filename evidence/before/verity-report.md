# Verity — Verification Report

**Spec:** `docs/admin-csv-export.md`
**Generated:** 2026-09-25T20:51:32.826Z

## Summary

| Total | ✅ Verified | ❌ Failed | ⚠️  Uncertain |
|-------|------------|----------|--------------|
| 8 | 7 | 1 | 0 |

## Results

### AC-01 — ✅ VERIFIED

**Criterion:** Requests that do not carry a valid admin bearer token must be rejected with HTTP 403 Forbidden. Applies to: missing Authorization header, tokens belonging to non-admin users, unrecognised tokens.

**Reason:** route.ts enforces admin-only auth with HTTP 403; all three forbidden scenarios are covered by tests.

**Evidence:**

- **route.ts auth guard check (getUserByToken + role check + 403 status)**
  - File: `src/app/api/admin/export/route.ts`
  - `getUserByToken(token) … if (!user || user.role !== "admin") { return … status: 403 }`
- **route.test.ts covers: missing header, viewer token, unrecognised token**
  - File: `src/app/api/admin/export/route.test.ts`
  - `✓ missing Authorization header | ✓ viewer token | ✓ unrecognised token`

---

### AC-02 — ✅ VERIFIED

**Criterion:** A successful response must: return HTTP 200, set Content-Type: text/csv, set Content-Disposition: attachment, and include a header row with all documented columns.

**Reason:** route.ts returns 200 with correct Content-Type and Content-Disposition; csv.ts defines all 8 columns in the specified order.

**Evidence:**

- **route.ts sets Content-Type: text/csv, Content-Disposition: attachment, status 200**
  - File: `src/app/api/admin/export/route.ts`
  - `✓ HTTP 200 | ✓ Content-Type: text/csv | ✓ Content-Disposition: attachment`
- **csv.ts CSV_HEADERS contains all 8 required columns in documented order**
  - File: `src/lib/csv.ts`
  - `✓ id, ✓ userId, ✓ product, ✓ quantity, ✓ unitPriceCents, ✓ status, ✓ createdAt, ✓ exportedAt | ✓ order correct`
- **route.test.ts verifies Content-Type, Content-Disposition, and all column headers**
  - File: `src/app/api/admin/export/route.test.ts`
  - `✓ Content-Type check | ✓ Content-Disposition check | ✓ all column headers checked`

---

### AC-03 — ✅ VERIFIED

**Criterion:** The server must return at most 10,000 data rows (excluding the header). Rows beyond this limit are silently truncated.

**Reason:** route.ts declares MAX_ROWS = 10_000 and truncates with .slice(0, MAX_ROWS); boundary exercised by a synthetic test.

**Evidence:**

- **route.ts defines MAX_ROWS = 10_000 and applies rows.slice(0, MAX_ROWS)**
  - File: `src/app/api/admin/export/route.ts`
  - `✓ MAX_ROWS = 10_000 declared | ✓ .slice(0, MAX_ROWS) applied`
- **Boundary test: synthetic array > 10,000 rows built and exact cap verified at slice**
  - File: `src/app/api/admin/export/route.test.ts`
  - `✓ boundary test: synthetic >10,000-row array constructed and slice verified`
- **Dataset boundary limitation: src/data/dataset.ts contains only 5 rows — route-level integration tests cannot reach the 10,000-row boundary without a synthetic fixture**
  - File: `src/data/dataset.ts`
  - `⚠ Live dataset has 5 rows. The MAX_ROWS constant and slice are verified by source inspection; the boundary is exercised only if a synthetic > 10,000-row test exists.`

---

### AC-04 — ✅ VERIFIED

**Criterion:** If any supplied query parameter contains a value not in the documented allowed set, the server must respond with HTTP 400 Bad Request and a descriptive error message. Example: status=deleted is invalid.

**Reason:** route.ts validates the status parameter against VALID_STATUSES and returns HTTP 400 with a descriptive error for any invalid value.

**Evidence:**

- **route.ts VALID_STATUSES set + filter check returning 400**
  - File: `src/app/api/admin/export/route.ts`
  - `✓ VALID_STATUSES includes pending/shipped/cancelled | ✓ .has(statusFilter) guard present | ✓ status: 400 returned`
- **route.test.ts covers invalid status (400) and all three valid statuses (200)**
  - File: `src/app/api/admin/export/route.test.ts`
  - `✓ status=deleted → 400 tested | ✓ pending/shipped/cancelled → 200 tested`

---

### AC-05 — ✅ VERIFIED

**Criterion:** Every data row in the CSV must contain a non-empty, valid ISO 8601 exportedAt timestamp. The createdAt field must also be present and non-empty.

**Reason:** csv.ts stamps every row with exportedAt = new Date().toISOString() and maps r.createdAt; both are in CSV_HEADERS.

**Evidence:**

- **csv.ts generates exportedAt = new Date().toISOString() and includes createdAt**
  - File: `src/lib/csv.ts`
  - `✓ exportedAt = new Date().toISOString() | ✓ r.createdAt in row mapping | ✓ both in CSV_HEADERS`
- **dataset.ts OrderRecord type declares createdAt: string (ISO 8601)**
  - File: `src/data/dataset.ts`
  - `✓ createdAt: string; // ISO 8601 declared in OrderRecord`
- **route.test.ts checks exportedAt (ISO 8601 validated) and createdAt on every data row**
  - File: `src/app/api/admin/export/route.test.ts`
  - `✓ exportedAt ISO 8601 validation test present | ✓ createdAt presence test present`

---

### AC-06 — ❌ FAILED

**Criterion:** Each successful export request must persist an audit record before the response is sent. The record must include: authenticated user ID, UTC timestamp, filter parameters, row count. Failure to persist must return HTTP 500 rather than silently succeed.

**Reason:** AC-06 acceptance probe exited with code 1: one or more audit assertions failed. Run 'npm run verity:probe' locally to see the full failure output.

**Evidence:**

- **AC-06 acceptance probe file**
  - File: `src/app/api/admin/export/ac06-audit.probe.ts`
  - `✓ probe file exists`
- **Probe command**
  - `npm run verity:probe`
- **Probe failed — exit code 1**
  ```
  > verity-sample-app@0.1.0 verity:probe
  > vitest run --config vitest.probe.config.ts --reporter=verbose
  FAIL src/app/api/admin/export/ac06-audit.probe.ts
    × AC-06 probe — audit record is persisted on successful export > getAuditRecords() returns exactly one record after a successful admin export
      → expected [] to have a length of 1 but got +0
    × AC-06 probe — audit record is persisted on successful export > the audit record contains the admin user ID
      → expected undefined not to be undefined
    × AC-06 probe — audit record is persisted on successful export > the audit record contains a valid ISO 8601 exportedAt timestamp
      → expected undefined not to be undefined
    × AC-06 probe — audit record is persisted on successful export > the audit record captures the filters passed with the request
      → expected undefined not to be undefined
    × AC-06 probe — audit record is persisted on successful export > the audit record contains the row count of the exported data
      → expected undefined not to be undefined
    ✓ AC-06 probe — audit record is persisted on successful export > no audit record is created when the request is rejected (403)
    × AC-06 probe — audit failure returns HTTP 500 > returns HTTP 500 when writeAuditRecord throws
      → expected 200 to be 500 // Object.is equality
   Test Files  1 failed (1)
        Tests  6 failed | 1 passed (7)
     Start at  22:54:01
     Duration  669ms (transform 67ms, setup 0ms, collect 84ms, tests 91ms, environment 0ms, prepare 155ms)
  ```

---

### AC-07 — ✅ VERIFIED

**Criterion:** When all filters are valid but no rows match, the server must return HTTP 200 with a CSV body that contains only the header row (no data rows). Content-Type must still be text/csv.

**Reason:** buildCsv([]) returns header-only CSV; route.ts sets text/csv unconditionally. Zero-match path tested.

**Evidence:**

- **csv.ts buildCsv returns [header, ...lines].join('\n') — safe with zero rows**
  - File: `src/lib/csv.ts`
  - `✓ [header, ...lines].join("\n") → empty rows yields header-only CSV`
- **route.ts always sets Content-Type: text/csv (not conditional on row count)**
  - File: `src/app/api/admin/export/route.ts`
  - `✓ Content-Type: text/csv set unconditionally`
- **route.test.ts tests a request that matches zero rows**
  - File: `src/app/api/admin/export/route.test.ts`
  - `✓ zero-match test found (e.g., userId=user-nonexistent-xyz)`

---

### AC-08 — ✅ VERIFIED

**Criterion:** All tests in the project's automated test suite must pass with no failures before a pull request is merged. The suite is run with: npm test

**Reason:** npm test completed with exit code 0 and no failure indicators in output.

**Evidence:**

- **package.json defines a "test" script using vitest**
  - File: `package.json`
  - `✓ "test": "vitest run"`
- **Test file exists at expected path**
  - File: `src/app/api/admin/export/route.test.ts`
  - `✓ file exists`
- **npm test execution result (last 30 lines of output)**
  ```
  Test Files  2 passed (2)
       Tests  73 passed (73)
    Start at  22:56:43
    Duration  728ms
  ```

---

*Generated by [Verity](./verity/run.ts)*
