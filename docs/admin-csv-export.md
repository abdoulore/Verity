# Admin CSV Export — Feature Specification

**Feature:** Admin CSV Export  
**Status:** Draft  
**Version:** 1.0.0

---

## Overview

Administrators can download a CSV file containing order records. The export supports optional server-side filters, is capped at a maximum row count, and every export action is audited for compliance.

---

## Endpoint

```
GET /api/admin/export
```

### Authentication

The request must include a valid bearer token for an admin user:

```
Authorization: Bearer <token>
```

### Query Parameters

| Parameter | Type   | Required | Description                                              |
|-----------|--------|----------|----------------------------------------------------------|
| `status`  | string | No       | Filter rows by order status. Allowed: `pending`, `shipped`, `cancelled`. |
| `userId`  | string | No       | Filter rows to a specific user identifier.               |

---

## Response

On success the server responds with **HTTP 200** and a file download:

```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="export.csv"
```

### CSV Columns

Every exported file must contain exactly these columns in this order:

| # | Column           | Description                                      |
|---|------------------|--------------------------------------------------|
| 1 | `id`             | Unique order identifier                          |
| 2 | `userId`         | Identifier of the user who placed the order      |
| 3 | `product`        | Product name                                     |
| 4 | `quantity`       | Number of units ordered                          |
| 5 | `unitPriceCents` | Unit price in cents (integer)                    |
| 6 | `status`         | Order status: `pending`, `shipped`, or `cancelled` |
| 7 | `createdAt`      | ISO 8601 timestamp when the order was created    |
| 8 | `exportedAt`     | ISO 8601 timestamp when the row was exported     |

---

## Acceptance Criteria

### AC-01 — Only admins can export

Requests that do not carry a valid admin bearer token **must** be rejected with **HTTP 403 Forbidden**.  
This applies to:
- Missing `Authorization` header
- Tokens belonging to non-admin users (e.g. `viewer` role)
- Unrecognised tokens

### AC-02 — The response is a downloadable CSV with the documented columns

A successful response **must**:
- Return HTTP 200
- Set `Content-Type: text/csv`
- Set `Content-Disposition: attachment`
- Include a header row containing every column listed in the **CSV Columns** table above

### AC-03 — An export is limited to 10,000 rows

The server **must** return at most **10,000 data rows** (excluding the header). Rows beyond this limit are silently truncated.

### AC-04 — Invalid filters return HTTP 400

If any supplied query parameter contains a value that is not in the documented allowed set, the server **must** respond with **HTTP 400 Bad Request** and a descriptive error message. Example: `status=deleted` is invalid.

### AC-05 — Each exported row includes a timestamp

Every data row in the CSV **must** contain a non-empty, valid ISO 8601 `exportedAt` timestamp. The `createdAt` field must also be present and non-empty.

### AC-06 — Every admin export creates an audit record

Each successful export request **must** persist an audit record before the response is sent. The audit record must include at minimum:
- The authenticated user's identifier
- The UTC timestamp of the export
- The filter parameters supplied with the request
- The number of rows included in the export

Failure to persist the audit record **must** result in the request failing with HTTP 500 rather than silently succeeding without an audit trail. The audit store is intentionally left abstract in this specification; implementations may use a database table, append-only log file, or compatible event stream.

### AC-07 — A valid request with no matching rows returns a valid CSV with headers

When all filters are valid but no rows match, the server **must** return HTTP 200 with a CSV body that contains only the header row (no data rows). The `Content-Type` must still be `text/csv`.

### AC-08 — The existing automated tests pass

All tests in the project's automated test suite **must** pass with no failures before a pull request is merged. The suite is run with:

```
npm test
```

---

## Error Responses

| HTTP Status | Condition                              |
|-------------|----------------------------------------|
| 400         | Invalid filter parameter value         |
| 403         | Missing, invalid, or non-admin token   |
| 500         | Internal error (including audit failure) |

---

## Non-Functional Notes

- The endpoint is read-only; it does not mutate order data.
- The `exportedAt` timestamp is generated server-side at request time and is identical for all rows in a single export.
- Row ordering in the CSV is not guaranteed and may vary between requests.
