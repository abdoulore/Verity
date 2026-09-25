/**
 * Audit store — contract module for AC-06.
 *
 * This module defines the audit record shape and the two functions the route
 * must call: `writeAuditRecord` (to persist) and `getAuditRecords` (for tests
 * to inspect what was written).
 *
 * Current state: writeAuditRecord is a no-op stub.  The AC-06 acceptance probe
 * will fail until the route calls this function.
 */

export interface AuditRecord {
  /** The authenticated admin's user ID. */
  userId: string;
  /** UTC timestamp of the export. */
  exportedAt: string; // ISO 8601
  /** The filter parameters supplied with the request. */
  filters: { status?: string; userId?: string };
  /** Number of rows included in the export. */
  rowCount: number;
}

/**
 * In-memory audit log.  Cleared between test runs via `clearAuditRecords()`.
 * A real implementation would write to a database table, append-only log, or
 * event stream — this module's interface stays the same regardless of backend.
 *
 * The backing array is kept on `globalThis` so that all copies of this module
 * (e.g. after vitest `vi.resetModules()`) share the same records, which lets
 * the AC-06 probe's static imports and the freshly-imported route see the
 * same data.
 */
const GLOBAL_KEY = "__auditStoreRecords__";
if (!(globalThis as Record<string, unknown>)[GLOBAL_KEY]) {
  (globalThis as Record<string, unknown>)[GLOBAL_KEY] = [];
}
const _records: AuditRecord[] = (globalThis as Record<string, unknown>)[GLOBAL_KEY] as AuditRecord[];

/**
 * Persist one audit record.
 *
 * The route must call this function — awaited — before returning the response.
 * If this function throws, the route must return HTTP 500.
 */
export async function writeAuditRecord(record: AuditRecord): Promise<void> {
  _records.push(record);
}

/**
 * Return all audit records written since the last `clearAuditRecords()` call.
 * Used by the AC-06 acceptance probe to inspect what the route persisted.
 */
export function getAuditRecords(): readonly AuditRecord[] {
  return _records;
}

/**
 * Reset the in-memory store.  Call in beforeEach inside the probe.
 */
export function clearAuditRecords(): void {
  _records.length = 0;
}
