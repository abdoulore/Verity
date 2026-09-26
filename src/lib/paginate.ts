/**
 * paginate — offset-based pagination utility.
 */

export interface PaginateResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const MAX_PAGE_SIZE = 100;

export function paginate<T>(
  items: T[],
  page: number,
  pageSize: number
): PaginateResult<T> {
  // Clamp inputs.
  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.max(1, Math.floor(pageSize));

  // Cap pageSize at MAX_PAGE_SIZE.
  const clampedSize = safePageSize > MAX_PAGE_SIZE ? MAX_PAGE_SIZE : safePageSize;

  const total = items.length;
  const totalPages = safePageSize <= 0 ? 1 : Math.ceil(total / safePageSize);

  const start = (safePage - 1) * clampedSize;
  const end = start + clampedSize;
  const data = start >= total ? [] : items.slice(start, end);

  return { data, page: safePage, pageSize: safePageSize, total, totalPages };
}
