import { PaginatedResult, PaginationQuery } from '../types';

export const getPagination = (query: PaginationQuery): { limit: number; offset: number; page: number } => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const offset = (page - 1) * limit;
  return { limit, offset, page };
};

export const buildPaginatedResult = <T>(
  rows: T[],
  count: number,
  page: number,
  limit: number
): PaginatedResult<T> => ({
  data: rows,
  total: count,
  page,
  limit,
  totalPages: Math.ceil(count / limit),
});
