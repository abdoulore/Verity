import { NextRequest, NextResponse } from "next/server";
import { ORDERS, getUserByToken } from "@/data/dataset";
import { buildCsv } from "@/lib/csv";
import { writeAuditRecord } from "@/lib/auditStore";

const MAX_ROWS = 10_000;

const VALID_STATUSES = new Set(["pending", "shipped", "cancelled"]);

export async function GET(request: NextRequest) {
  // AC-01: Only admins can export.
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const user = getUserByToken(token);

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // AC-04: Validate filters.
  const { searchParams } = request.nextUrl;
  const statusFilter = searchParams.get("status");
  const userIdFilter = searchParams.get("userId");

  if (statusFilter !== null && !VALID_STATUSES.has(statusFilter)) {
    return NextResponse.json(
      { error: `Invalid status filter: "${statusFilter}". Must be one of: pending, shipped, cancelled.` },
      { status: 400 }
    );
  }

  // Apply filters.
  let rows = ORDERS;
  if (statusFilter) {
    rows = rows.filter((r) => r.status === statusFilter);
  }
  if (userIdFilter) {
    rows = rows.filter((r) => r.userId === userIdFilter);
  }

  // AC-03: Limit to 10,000 rows.
  rows = rows.slice(0, MAX_ROWS);

  // AC-02 + AC-05 + AC-07: Build CSV (includes exportedAt timestamp; valid even with zero rows).
  const exportedAt = new Date().toISOString();
  const csv = buildCsv(rows, exportedAt);

  // AC-06: Persist audit record before responding; HTTP 500 if it fails.
  try {
    await writeAuditRecord({
      userId: user.id,
      exportedAt,
      filters: {
        ...(statusFilter !== null ? { status: statusFilter } : {}),
        ...(userIdFilter !== null ? { userId: userIdFilter } : {}),
      },
      rowCount: rows.length,
    });
  } catch {
    return NextResponse.json({ error: "Audit record could not be persisted." }, { status: 500 });
  }

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="export.csv"',
    },
  });
}
