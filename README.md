# Verity Sample App

A deliberately incomplete Next.js sample project used as a **test fixture** for the [Verity](../README.md) requirement-verification hackathon prototype.

---

## What this is

Verity is a tool that checks whether a developer ticket has actually been implemented. This repository contains:

| Path | Purpose |
|------|---------|
| `docs/admin-csv-export.md` | Written specification with 8 acceptance criteria (AC-01 – AC-08) |
| `src/app/api/admin/export/route.ts` | Next.js route implementing the export endpoint |
| `src/app/api/admin/export/route.test.ts` | Vitest test suite |
| `src/data/dataset.ts` | Synthetic in-memory dataset (no real data) |
| `src/lib/csv.ts` | CSV serialisation helper |

**AC-06 (every admin export creates an audit record) is intentionally unimplemented.** There is no test for it either. This gap is the signal that Verity should detect when it analyses this project.

---

## Prerequisites

- **Node.js 18+** (no Docker, no database, no external APIs or credentials required)

---

## Setup

```bash
# Install dependencies
npm install
```

---

## Run the development server

```bash
npm run dev
# Open http://localhost:3000
```

---

## Run the tests

```bash
npm test
```

Vitest will run all `*.test.ts` files. You should see output similar to:

```
 ✓ src/app/api/admin/export/route.test.ts (N tests)
```

---

## Try the API manually

With the dev server running:

```bash
# Valid admin export
curl -H "Authorization: Bearer token-admin-alice" \
     http://localhost:3000/api/admin/export

# Filtered export (status=shipped)
curl -H "Authorization: Bearer token-admin-alice" \
     "http://localhost:3000/api/admin/export?status=shipped"

# Should return 403 (viewer token)
curl -H "Authorization: Bearer token-viewer-bob" \
     http://localhost:3000/api/admin/export

# Should return 400 (invalid filter)
curl -H "Authorization: Bearer token-admin-alice" \
     "http://localhost:3000/api/admin/export?status=deleted"
```

---

## Acceptance criteria status

| AC   | Description                                              | Implemented | Tested |
|------|----------------------------------------------------------|-------------|--------|
| AC-01 | Only admins can export                                  | ✅ | ✅ |
| AC-02 | Response is a downloadable CSV with documented columns  | ✅ | ✅ |
| AC-03 | Export limited to 10,000 rows                           | ✅ | ✅ |
| AC-04 | Invalid filters return HTTP 400                         | ✅ | ✅ |
| AC-05 | Each exported row includes a timestamp                  | ✅ | ✅ |
| AC-06 | Every admin export creates an audit record              | ❌ | ❌ |
| AC-07 | Valid request with no matching rows returns CSV headers | ✅ | ✅ |
| AC-08 | Existing automated tests pass                           | ✅ | ✅ |

AC-06 is the gap Verity is designed to detect.
