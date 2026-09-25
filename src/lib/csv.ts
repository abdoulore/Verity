import { OrderRecord } from "@/data/dataset";

/** CSV column headers – must match the spec. */
export const CSV_HEADERS = [
  "id",
  "userId",
  "product",
  "quantity",
  "unitPriceCents",
  "status",
  "createdAt",
  "exportedAt",
] as const;

/** Escape a CSV field: wrap in quotes if it contains a comma, quote, or newline. */
function escapeField(value: string | number): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Serialise an array of OrderRecord rows to a CSV string.
 * Each row receives an `exportedAt` timestamp (current UTC time, or the
 * caller-supplied value when provided so the route and audit record agree).
 */
export function buildCsv(rows: OrderRecord[], exportedAt: string = new Date().toISOString()): string {
  const header = CSV_HEADERS.join(",");
  const lines = rows.map((r) =>
    [
      r.id,
      r.userId,
      r.product,
      r.quantity,
      r.unitPriceCents,
      r.status,
      r.createdAt,
      exportedAt,
    ]
      .map(escapeField)
      .join(",")
  );
  return [header, ...lines].join("\n");
}
