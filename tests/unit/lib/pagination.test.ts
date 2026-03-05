import { describe, it, expect } from 'vitest';
import { parsePagination, buildPaginationResult } from '@/lib/utils/pagination';

describe('parsePagination', () => {
  it('returns defaults when no params provided', () => {
    const params = new URLSearchParams();
    const result = parsePagination(params);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.offset).toBe(0);
  });

  it('parses page and pageSize from search params', () => {
    const params = new URLSearchParams({ page: '3', pageSize: '20' });
    const result = parsePagination(params);
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(20);
    expect(result.offset).toBe(40);
  });

  it('enforces minimum page of 1', () => {
    const params = new URLSearchParams({ page: '0' });
    const result = parsePagination(params);
    expect(result.page).toBe(1);
  });

  it('enforces minimum page of 1 for negative values', () => {
    const params = new URLSearchParams({ page: '-5' });
    const result = parsePagination(params);
    expect(result.page).toBe(1);
  });

  it('enforces maximum pageSize of 100', () => {
    const params = new URLSearchParams({ pageSize: '200' });
    const result = parsePagination(params);
    expect(result.pageSize).toBe(100);
  });

  it('enforces minimum pageSize of 1', () => {
    const params = new URLSearchParams({ pageSize: '0' });
    const result = parsePagination(params);
    expect(result.pageSize).toBe(1);
  });

  it('calculates correct offset for page 2', () => {
    const params = new URLSearchParams({ page: '2', pageSize: '25' });
    const result = parsePagination(params);
    expect(result.offset).toBe(25);
  });
});

describe('buildPaginationResult', () => {
  it('builds correct pagination metadata', () => {
    const result = buildPaginationResult(1, 50, 120);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.total).toBe(120);
    expect(result.totalPages).toBe(3);
  });

  it('rounds up totalPages for partial pages', () => {
    const result = buildPaginationResult(1, 50, 51);
    expect(result.totalPages).toBe(2);
  });

  it('returns 0 totalPages for empty results', () => {
    const result = buildPaginationResult(1, 50, 0);
    expect(result.totalPages).toBe(0);
  });

  it('returns 1 totalPage when total equals pageSize', () => {
    const result = buildPaginationResult(1, 50, 50);
    expect(result.totalPages).toBe(1);
  });
});
