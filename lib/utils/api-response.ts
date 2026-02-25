import { NextResponse } from 'next/server';

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  pagination?: PaginationMeta;
}

interface ApiErrorResponse {
  success: false;
  error: { code: string; message: string };
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true as const, data }, { status });
}

export function apiError(
  code: string,
  message: string,
  status: number
): NextResponse<ApiErrorResponse> {
  const safeMessage =
    process.env.NODE_ENV === 'production' && status >= 500
      ? 'Internal Server Error'
      : message;
  return NextResponse.json(
    { success: false as const, error: { code, message: safeMessage } },
    { status }
  );
}

export function apiPaginated<T>(
  data: T[],
  pagination: PaginationMeta
): NextResponse<ApiSuccessResponse<T[]>> {
  return NextResponse.json({
    success: true as const,
    data,
    pagination,
  });
}

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get('limit') || '20', 10))
  );
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}
