import { NextResponse } from 'next/server';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(
    { success: true, data } satisfies ApiResponse<T>,
    { status }
  );
}

export function apiError(code: string, message: string, status: number) {
  const safeMessage =
    process.env.NODE_ENV === 'production' && status >= 500
      ? 'Internal Server Error'
      : message;
  return NextResponse.json(
    { success: false, error: { code, message: safeMessage } },
    { status }
  );
}

export function apiPaginated<T>(
  data: T[],
  pagination: ApiResponse<T>['pagination']
) {
  return NextResponse.json({ success: true, data, pagination });
}
