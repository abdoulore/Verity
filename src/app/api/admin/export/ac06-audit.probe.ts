/**
 * AC-06 Acceptance Probe
 * ======================
 * File: src/app/api/admin/export/ac06-audit.probe.ts
 *
 * This file uses the `.probe.ts` extension so it is EXCLUDED from the main
 * vitest suite (which matches `*.test.ts` only).  Run it in isolation:
 *
 *   npm run verity:probe
 *
 * The probe makes a real call to the GET handler and inspects whether an audit
 * record was persisted via the auditStore contract.  It also verifies that
 * when writeAuditRecord throws, the route returns HTTP 500 (not HTTP 200).
 *
 * These checks will FAIL until the route:
 *   1. imports writeAuditRecord from @/lib/auditStore
 *   2. calls await writeAuditRecord({...}) before returning the response
 *   3. wraps that call in try/catch returning HTTP 500 on failure
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { clearAuditRecords, getAuditRecords } from "@/lib/auditStore";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAdminRequest(params?: Record<string, string>): NextRequest {
  const url = new URL("http://localhost:3000/api/admin/export");
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return new NextRequest(url, {
    headers: { authorization: "Bearer token-admin-alice" },
  });
}

async function importRoute() {
  const mod = await import("./route");
  return mod.GET;
}

// ---------------------------------------------------------------------------
// AC-06 probe 1 — audit record is created after a successful export
// ---------------------------------------------------------------------------

describe("AC-06 probe — audit record is persisted on successful export", () => {
  beforeEach(() => {
    clearAuditRecords();
    vi.resetModules();
  });

  it("getAuditRecords() returns exactly one record after a successful admin export", async () => {
    const GET = await importRoute();
    const res = await GET(makeAdminRequest());
    expect(res.status).toBe(200); // sanity: export itself must succeed

    const records = getAuditRecords();
    expect(records).toHaveLength(1);
  });

  it("the audit record contains the admin user ID", async () => {
    const GET = await importRoute();
    await GET(makeAdminRequest());

    const [record] = getAuditRecords();
    expect(record).toBeDefined();
    // Alice's user ID in dataset.ts is "usr-001"
    expect(record.userId).toBe("usr-001");
  });

  it("the audit record contains a valid ISO 8601 exportedAt timestamp", async () => {
    const GET = await importRoute();
    await GET(makeAdminRequest());

    const [record] = getAuditRecords();
    expect(record).toBeDefined();
    expect(record.exportedAt).toBeTruthy();
    expect(new Date(record.exportedAt).toISOString()).toBe(record.exportedAt);
  });

  it("the audit record captures the filters passed with the request", async () => {
    const GET = await importRoute();
    await GET(makeAdminRequest({ status: "shipped", userId: "user-alpha" }));

    const [record] = getAuditRecords();
    expect(record).toBeDefined();
    expect(record.filters).toMatchObject({ status: "shipped", userId: "user-alpha" });
  });

  it("the audit record contains the row count of the exported data", async () => {
    const GET = await importRoute();
    await GET(makeAdminRequest());

    const [record] = getAuditRecords();
    expect(record).toBeDefined();
    // The full 5-row dataset is exported when no filters are applied
    expect(typeof record.rowCount).toBe("number");
    expect(record.rowCount).toBeGreaterThanOrEqual(0);
  });

  it("no audit record is created when the request is rejected (403)", async () => {
    clearAuditRecords();
    const GET = await importRoute();
    const req = new NextRequest(new URL("http://localhost:3000/api/admin/export"), {
      headers: { authorization: "Bearer token-viewer-bob" },
    });
    const res = await GET(req);
    expect(res.status).toBe(403);
    expect(getAuditRecords()).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// AC-06 probe 2 — audit failure causes HTTP 500 (not silent success)
// ---------------------------------------------------------------------------

describe("AC-06 probe — audit failure returns HTTP 500", () => {
  beforeEach(() => {
    clearAuditRecords();
    vi.resetModules();
  });

  it("returns HTTP 500 when writeAuditRecord throws", async () => {
    // Mock the audit store so that writeAuditRecord rejects.
    vi.doMock("@/lib/auditStore", () => ({
      writeAuditRecord: vi.fn().mockRejectedValue(new Error("store unavailable")),
      getAuditRecords: () => [],
      clearAuditRecords: () => {},
    }));

    // Re-import the route so it picks up the mocked auditStore.
    const { GET } = await import("./route");
    const res = await GET(makeAdminRequest());

    // The spec requires HTTP 500 — not a silent 200.
    expect(res.status).toBe(500);
  });
});
