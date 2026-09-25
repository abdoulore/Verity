# Verity — Verification Report

**Spec:** `docs/admin-csv-export.md`
**Generated:** 2026-09-25T22:09:28.492Z

## Summary

| Total | ✅ Verified | ❌ Failed | ⚠️  Uncertain |
|-------|------------|----------|--------------|
| 8 | 8 | 0 | 0 |

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

### AC-06 — ✅ VERIFIED

**Criterion:** Each successful export request must persist an audit record before the response is sent. The record must include: authenticated user ID, UTC timestamp, filter parameters, row count. Failure to persist must return HTTP 500 rather than silently succeed.

**Reason:** All AC-06 probe assertions passed (exit 0). Run 'npm run verity:probe' to reproduce.

**Evidence:**

- **AC-06 acceptance probe file**
  - File: `src/app/api/admin/export/ac06-audit.probe.ts`
  - `✓ probe file exists`
- **Probe command**
  - `npm run verity:probe`
- **Probe output (last 25 lines)**
  ```
  > verity-sample-app@0.1.0 verity:probe
  > vitest run --config vitest.probe.config.ts --reporter=verbose
  The CJS build of Vite's Node API is deprecated. See https://vite.dev/guide/troubleshooting.html#vite-cjs-node-api-deprecated for more details.
   RUN  v1.6.1 C:/Users/DELL/Documents/Verity
   ✓ src/app/api/admin/export/ac06-audit.probe.ts > AC-06 probe — audit record is persisted on successful export > getAuditRecords() returns exactly one record after a successful admin export
   ✓ src/app/api/admin/export/ac06-audit.probe.ts > AC-06 probe — audit record is persisted on successful export > the audit record contains the admin user ID
   ✓ src/app/api/admin/export/ac06-audit.probe.ts > AC-06 probe — audit record is persisted on successful export > the audit record contains a valid ISO 8601 exportedAt timestamp
   ✓ src/app/api/admin/export/ac06-audit.probe.ts > AC-06 probe — audit record is persisted on successful export > the audit record captures the filters passed with the request
   ✓ src/app/api/admin/export/ac06-audit.probe.ts > AC-06 probe — audit record is persisted on successful export > the audit record contains the row count of the exported data
   ✓ src/app/api/admin/export/ac06-audit.probe.ts > AC-06 probe — audit record is persisted on successful export > no audit record is created when the request is rejected (403)
   ✓ src/app/api/admin/export/ac06-audit.probe.ts > AC-06 probe — audit failure returns HTTP 500 > returns HTTP 500 when writeAuditRecord throws
   Test Files  1 passed (1)
        Tests  7 passed (7)
     Start at  23:09:25
     Duration  720ms (transform 73ms, setup 0ms, collect 96ms, tests 91ms, environment 0ms, prepare 196ms)
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
  [32m✓[39m src/app/api/admin/export/route.test.ts[2m > [22mAC-02 – downloadable CSV with documented columns[2m > [22msets Content-Type to text/csv
   [32m✓[39m src/app/api/admin/export/route.test.ts[2m > [22mAC-02 – downloadable CSV with documented columns[2m > [22msets Content-Disposition to attachment
   [32m✓[39m src/app/api/admin/export/route.test.ts[2m > [22mAC-02 – downloadable CSV with documented columns[2m > [22mCSV first line contains all required column headers
   [32m✓[39m src/app/api/admin/export/route.test.ts[2m > [22mAC-03 – export limited to 10,000 rows[2m > [22mnever returns more than 10,000 data rows (header excluded)
   [32m✓[39m src/app/api/admin/export/route.test.ts[2m > [22mAC-04 – invalid filters return HTTP 400[2m > [22mreturns 400 for an unrecognised status value
   [32m✓[39m src/app/api/admin/export/route.test.ts[2m > [22mAC-04 – invalid filters return HTTP 400[2m > [22mreturns 400 for a numeric-only status value
   [32m✓[39m src/app/api/admin/export/route.test.ts[2m > [22mAC-04 – invalid filters return HTTP 400[2m > [22mreturns 200 for valid status=shipped
   [32m✓[39m src/app/api/admin/export/route.test.ts[2m > [22mAC-04 – invalid filters return HTTP 400[2m > [22mreturns 200 for valid status=pending
   [32m✓[39m src/app/api/admin/export/route.test.ts[2m > [22mAC-04 – invalid filters return HTTP 400[2m > [22mreturns 200 for valid status=cancelled
   [32m✓[39m src/app/api/admin/export/route.test.ts[2m > [22mAC-05 – each exported row includes a timestamp[2m > [22mevery data row has a non-empty exportedAt field
   [32m✓[39m src/app/api/admin/export/route.test.ts[2m > [22mAC-05 – each exported row includes a timestamp[2m > [22mevery data row also has a createdAt field
   [32m✓[39m src/app/api/admin/export/route.test.ts[2m > [22mAC-07 – no matching rows still returns valid CSV with headers[2m > [22mreturns 200 with header-only CSV when userId matches nothing
   [32m✓[39m src/app/api/admin/export/route.test.ts[2m > [22mAC-07 – no matching rows still returns valid CSV with headers[2m > [22mContent-Type is still text/csv even with zero data rows
   [32m✓[39m src/app/api/admin/export/route.test.ts[2m > [22mAC-08 – existing automated tests pass (meta-check)[2m > [22mthis test file itself is part of the automated suite
   [32m✓[39m verity/verity.test.ts[2m > [22mrenderJson — edge cases[2m > [22mall 8 AC IDs appear in a full report (AC-06 supplied as fixture, others real)
   [32m✓[39m verity/verity.test.ts[2m > [22mauditStore — contract interface[2m > [22mgetAuditRecords() returns an empty array initially
   [32m✓[39m verity/verity.test.ts[2m > [22mauditStore — contract interface[2m > [22mclearAuditRecords() resets the store after records were written
   [32m✓[39m verity/verity.test.ts[2m > [22mauditStore — contract interface[2m > [22mwriteAuditRecord() is an async function
   [32m✓[39m verity/verity.test.ts[2m > [22mauditStore — contract interface[2m > [22mAuditRecord shape has all four required fields
   [32m✓[39m verity/verity.test.ts[2m > [22mAC-06 probe contract — what must change for probe to pass[2m > [22mafter fix: writeAuditRecord must push one record to the store
   [32m✓[39m verity/verity.test.ts[2m > [22mAC-03 — boundary limitation is reported in evidence[2m > [22mcheckAC03 result includes evidence noting the 5-row dataset limitation
   [32m✓[39m verity/verity.test.ts[2m > [22mAC-03 — boundary limitation is reported in evidence[2m > [22mcheckAC03 evidence mentions the 5-row dataset explicitly
   [32m✓[39m verity/verity.test.ts[2m > [22mAC-03 — boundary limitation is reported in evidence[2m > [22mcheckAC03 evidence notes that boundary test uses a synthetic array
  
  [2m Test Files [22m [1m[32m2 passed[39m[22m[90m (2)[39m
  [2m      Tests [22m [1m[32m73 passed[39m[22m[90m (73)[39m
  [2m   Start at [22m 23:09:27
  [2m   Duration [22m 787ms[2m (transform 241ms, setup 0ms, collect 271ms, tests 235ms, environment 0ms, prepare 396ms)[22m
  ```

---

*Generated by [Verity](./verity/run.ts)*