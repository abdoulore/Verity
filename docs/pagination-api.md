# Pagination API — Feature Specification

**Feature:** Paginate helper  
**Status:** Draft  
**Version:** 1.0.0

---

## Overview

A pure utility function `paginate` that slices an array into pages.  
It is used by any API route that needs cursor-free, offset-based pagination.

---

## Function signature

```ts
paginate<T>(items: T[], page: number, pageSize: number): PaginateResult<T>
```

```ts
interface PaginateResult<T> {
  data: T[];         // items on this page
  page: number;      // current page (1-based)
  pageSize: number;  // requested page size
  total: number;     // total items across all pages
  totalPages: number;// Math.ceil(total / pageSize)
}
```

---

## Acceptance Criteria

### PAG-01 — Page size is capped at 100 items

The `pageSize` argument **must** be silently clamped to **at most 100** before slicing.  
A caller supplying `pageSize: 200` must receive at most 100 items in `data`.  
The `pageSize` field in the result must reflect the **original requested value**, not the
clamped internal value.

### PAG-02 — Requesting a page beyond the last page returns an empty data array

When `page * pageSize > total`, the function **must** return an empty `data` array and
correct `total` / `totalPages` values.  The function **must not** throw.

### PAG-03 — `totalPages` is always the mathematical ceiling

`totalPages` must equal `Math.ceil(total / pageSize)` for every combination of inputs,
including when `total` is 0 and when `total` is not evenly divisible by `pageSize`.

---

## Non-Functional Notes

- The function is pure; it has no I/O, no side-effects.
- `page` is 1-based. Page 1 returns items 0…pageSize-1.
- Negative or zero `page` is treated as page 1.
- Negative or zero `pageSize` is treated as pageSize 1.
