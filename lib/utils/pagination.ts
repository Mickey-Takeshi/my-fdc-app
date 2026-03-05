/**
 * lib/utils/pagination.ts
 *
 * Pagination utilities (Phase 35)
 */

export interface PaginationParams {
  page: number;
  pageSize: number;
  offset: number;
}

export interface PaginationResult {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

/**
 * Parse pagination parameters from URL search params.
 * Enforces page >= 1 and pageSize <= MAX_PAGE_SIZE.
 */
export function parsePagination(searchParams: URLSearchParams): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE), 10))
  );
  const offset = (page - 1) * pageSize;

  return { page, pageSize, offset };
}

/**
 * Build pagination result metadata.
 */
export function buildPaginationResult(
  page: number,
  pageSize: number,
  total: number
): PaginationResult {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}
