export function getPagination(page?: string, limit?: string) {
  const parsedPage = Math.max(1, parseInt(page ?? '1', 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit ?? '10', 10) || 10));
  const skip = (parsedPage - 1) * parsedLimit;

  return { page: parsedPage, limit: parsedLimit, skip };
}

export function buildPaginationResult(total: number, page: number, limit: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
