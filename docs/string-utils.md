# String Utils — Feature Specification

**Feature:** String utility helpers  
**Status:** Draft  
**Version:** 1.0.0

---

## Overview

A small set of pure string utilities used across the application.  
All functions are stateless and have no I/O or side-effects.

---

## Functions

### `truncate(text, maxLength)`

Returns the input string truncated to `maxLength` characters.  
If the string is longer than `maxLength`, the result ends with `"..."` and the
visible text (before the ellipsis) is exactly `maxLength - 3` characters long,
so the total length is always `≤ maxLength`.  
If the string is at or below `maxLength`, it is returned unchanged.

### `slugify(text)`

Converts a human-readable title into a URL-safe slug:
- Converts to lowercase.
- Replaces every run of whitespace and non-alphanumeric characters with a
  single hyphen.
- Trims leading and trailing hyphens from the result.

---

## Acceptance Criteria

### SU-01 — `truncate` caps the output length

`truncate(text, maxLength)` **must** return a string whose `.length` is always
`≤ maxLength`.  
When truncation occurs the result **must** end with `"..."`.  
When no truncation is needed the original string is returned unchanged.

### SU-02 — `slugify` produces a valid URL slug

`slugify(text)` **must** return a string that:
- Is entirely lowercase.
- Contains only `[a-z0-9-]` characters.
- Does not start or end with a hyphen.
- Replaces runs of whitespace and punctuation with exactly one hyphen each.

---

## Non-Functional Notes

- Both functions are pure.
- Neither function may throw for any string input (including empty strings).
